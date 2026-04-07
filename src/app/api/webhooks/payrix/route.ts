import { NextRequest, NextResponse } from 'next/server';
import { saveWebhookEvent } from '@/lib/payrix/dal/webhook-events';
import { createSubscriptionInvoice } from '@/lib/platform/subscription-invoice';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const eventType = extractEventType(payload) ?? 'unknown';
    const headers: Record<string, string> = {};
    req.headers.forEach((v, k) => {
      headers[k] = v;
    });
    void saveWebhookEvent({ eventType, source: 'payrix', payload, headers }).catch(
      (err) => console.error('webhook save error:', err),
    );

    // Auto-create invoice for subscription billing events
    if (eventType.startsWith('txn.') || eventType.startsWith('subscription.')) {
      void handleSubscriptionBilling(payload).catch(
        (err) => console.error('subscription invoice error:', err),
      );
    }
  } catch {
    // ignore parse errors — still ack
  }
  return NextResponse.json({ received: true });
}

/**
 * If a webhook contains a transaction linked to a subscription,
 * auto-create an invoice for that billing period.
 */
async function handleSubscriptionBilling(payload: unknown) {
  const apiKey = process.env.PAYRIX_PLATFORM_API_KEY;
  if (!apiKey) return; // No API key configured for auto-invoicing

  const env = (process.env.PAYRIX_PLATFORM_ENV === 'prod' ? 'prod' : 'test') as 'test' | 'prod';

  // Extract transaction data from webhook payload
  const p = payload as Record<string, unknown>;
  const response = p.response as Record<string, unknown> | undefined;
  if (!response) return;

  const dataArr = response.data as Record<string, unknown>[] | undefined;
  if (!Array.isArray(dataArr) || dataArr.length === 0) return;

  const txn = dataArr[0];
  const subscriptionId = txn.subscription as string | undefined;
  if (!subscriptionId) return; // Not a subscription transaction

  const merchant = txn.merchant as string | undefined;
  const total = txn.total as number | undefined;
  if (!merchant || !total) return;

  // Get login from the alert or transaction
  const alert = response.alert as Record<string, unknown> | undefined;
  const login = (txn.creator || txn.login || alert?.login) as string | undefined;
  if (!login) return;

  await createSubscriptionInvoice({
    apiKey,
    environment: env,
    login,
    merchant,
    subscriptionId,
    amount: total,
  });
}

// Extract event type from Payrix webhook payload
// Payrix wraps alerts in: { response: { alert: { invoiceStatus, txnStatus, ... }, data: [...] } }
export function extractEventType(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null;

  const p = payload as Record<string, unknown>;

  // Direct fields (simple/custom webhooks)
  if (typeof p.type === 'string') return p.type;
  if (typeof p.event === 'string') return p.event;
  if (typeof p.eventType === 'string') return p.eventType;

  // Payrix alert structure: payload.response.alert
  if (p.response && typeof p.response === 'object') {
    const response = p.response as Record<string, unknown>;
    if (response.alert && typeof response.alert === 'object') {
      const alert = response.alert as Record<string, unknown>;

      if (typeof alert.invoiceStatus === 'string') {
        return `invoice.${alert.invoiceStatus}`;
      }
      if (typeof alert.txnStatus === 'string') {
        return `txn.${alert.txnStatus}`;
      }
      if (typeof alert.invoiceType === 'string' && alert.invoiceType !== 'alert') {
        return `invoice.${alert.invoiceType}`;
      }
    }
  }

  // Nested data object fallback
  if (p.data && typeof p.data === 'object' && !Array.isArray(p.data)) {
    const data = p.data as Record<string, unknown>;
    if (typeof data.event === 'string') return data.event;
    if (typeof data.type === 'string') return data.type;
  }

  // Generic fallback: scan response.alert for entity/status patterns
  const genericAlertEvent = extractGenericAlertEvent(p);
  if (genericAlertEvent) return genericAlertEvent;

  // Fallback: inspect response.data[] array
  const dataArrayEvent = extractFromDataArray(p);
  if (dataArrayEvent) return dataArrayEvent;

  return null;
}

// Extract event from generic alert patterns like terminalTxnStatus, resource+status, etc.
function extractGenericAlertEvent(payload: Record<string, unknown>): string | null {
  const response = payload.response;
  if (!response || typeof response !== 'object') return null;
  
  const resp = response as Record<string, unknown>;
  const alert = resp.alert;
  if (!alert || typeof alert !== 'object') return null;
  
  const a = alert as Record<string, unknown>;
  
  // Pattern: <entity>Status field (e.g., terminalTxnStatus, merchantStatus)
  const entityStatusKeys = ['terminalTxnStatus', 'merchantStatus', 'subscriptionStatus', 'disbursementStatus', 'chargebackStatus'];
  for (const key of entityStatusKeys) {
    if (typeof a[key] === 'string') {
      const entity = key.replace('Status', '');
      return `${entity}.${a[key]}`;
    }
  }
  
  // Pattern: <entity>Type field
  const entityTypeKeys = ['terminalTxnType', 'merchantType', 'subscriptionType', 'disbursementType', 'chargebackType'];
  for (const key of entityTypeKeys) {
    if (typeof a[key] === 'string') {
      const entity = key.replace('Type', '');
      return `${entity}.${a[key]}`;
    }
  }
  
  // Pattern: resource + status combination
  if (typeof a.resource === 'string' && typeof a.status === 'string') {
    return `${a.resource}.${a.status}`;
  }
  
  // Pattern: entity + status combination
  if (typeof a.entity === 'string' && typeof a.status === 'string') {
    return `${a.entity}.${a.status}`;
  }
  
  // Pattern: standalone type/status that looks like an event
  if (typeof a.type === 'string' && a.type.includes('.')) {
    return a.type;
  }
  
  return null;
}

// Extract event from response.data[] array
function extractFromDataArray(payload: Record<string, unknown>): string | null {
  const response = payload.response;
  if (!response || typeof response !== 'object') return null;
  
  const resp = response as Record<string, unknown>;
  const data = resp.data;
  if (!Array.isArray(data) || data.length === 0) return null;
  
  const firstItem = data[0];
  if (!firstItem || typeof firstItem !== 'object') return null;
  
  const item = firstItem as Record<string, unknown>;
  
  // Check for event/type/status fields
  if (typeof item.event === 'string') return item.event;
  if (typeof item.type === 'string') return item.type;
  if (typeof item.status === 'string') {
    // Try to find entity/resource context
    const entity = typeof item.resource === 'string' 
      ? item.resource 
      : typeof item.entity === 'string' 
        ? item.entity 
        : null;
    if (entity) return `${entity}.${item.status}`;
  }
  
  return null;
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
