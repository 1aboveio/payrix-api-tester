import { PlatformClient } from './client';
import type { CreateInvoiceRequest, CreateCatalogItemRequest, Plan } from './types';
import { getPlanCycleLabel } from './types';

/**
 * Auto-create an invoice for a subscription billing event.
 * Used by the webhook handler when Payrix auto-bills a subscription.
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
}) {
  const { apiKey, environment, login, merchant, subscriptionId, customerId, plan, amount, periodLabel } = params;
  const client = new PlatformClient({ apiKey, environment });

  const cycleLabel = periodLabel || (plan ? getPlanCycleLabel(plan) : 'Period');
  const now = new Date();
  const invoiceNum = `SUB-${subscriptionId.slice(-8)}-${now.toISOString().slice(0, 10).replace(/-/g, '')}`;

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

  return { invoice: inv, catalogItem: catItem, errors: [...catResult.errors, ...invResult.errors] };
}
