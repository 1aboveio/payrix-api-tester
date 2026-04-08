import { PlatformClient } from './client';
import type { CreateInvoiceRequest, CreateCatalogItemRequest, Plan, Invoice } from './types';
import { getPlanCycleLabel } from './types';

/**
 * Auto-create an invoice for a subscription billing event.
 * Used by the webhook handler when Payrix auto-bills a subscription.
 *
 * Deduplication: uses transactionId in invoice number to prevent duplicates
 * from webhook retries or multiple lifecycle events.
 */
export async function createSubscriptionInvoice(params: {
  apiKey: string;
  environment: 'test' | 'prod';
  login: string;
  merchant: string;
  subscriptionId: string;
  customerId?: string;
  plan?: Plan;
  amount: number;
  periodLabel?: string;
  transactionId?: string;
}) {
  const { apiKey, environment, login, merchant, subscriptionId, customerId, plan, amount, periodLabel, transactionId } = params;
  const client = new PlatformClient({ apiKey, environment });

  const cycleLabel = periodLabel || (plan ? getPlanCycleLabel(plan) : 'Period');
  // Use transactionId for uniqueness if available, otherwise fall back to date
  const uniqueSuffix = transactionId
    ? transactionId.slice(-12)
    : new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '');
  const invoiceNum = `SUB-${subscriptionId.slice(-8)}-${uniqueSuffix}`;

  // Check for existing invoice with same number to avoid duplicates
  const existingResult = await client.listInvoices(
    [{ field: 'number', operator: 'eq', value: invoiceNum }],
    { page: 1, limit: 1 }
  );
  if (existingResult.data?.length > 0) {
    return { invoice: existingResult.data[0] as Invoice, catalogItem: null, errors: [], deduplicated: true };
  }

  // 1. Create catalog item
  const catResult = await client.createCatalogItem({
    login,
    item: `${plan?.name || 'Subscription'} — ${cycleLabel}`,
    description: `${cycleLabel} subscription payment`,
    price: amount,
  } as CreateCatalogItemRequest);

  const catItem = catResult.data?.[0];

  // 2. Create invoice linked to subscription
  const invResult = await client.createInvoice({
    login,
    merchant,
    number: invoiceNum,
    status: 'paid',
    customer: customerId,
    subscription: subscriptionId,
    type: 'recurring',
    title: `${plan?.name || 'Subscription'} — ${cycleLabel} Payment`,
  } as CreateInvoiceRequest);

  const inv = invResult.data?.[0];

  // 3. Add line item
  if (inv?.id && catItem?.id) {
    await client.createInvoiceLineItem({
      invoice: inv.id,
      invoiceItem: catItem.id,
      quantity: 1,
      price: amount,
    });
  }

  return { invoice: inv, catalogItem: catItem, errors: [...catResult.errors, ...invResult.errors], deduplicated: false };
}
