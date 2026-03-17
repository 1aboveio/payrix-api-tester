import { NextRequest, NextResponse } from 'next/server';
import { saveWebhookEvent } from '@/lib/payrix/dal/webhook-events';

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
  } catch {
    // ignore parse errors — still ack
  }
  return NextResponse.json({ received: true });
}

// Extract event type from Payrix webhook payload
// Payrix wraps alerts in: { response: { alert: { invoiceStatus, txnStatus, ... }, data: [...] } }
function extractEventType(payload: unknown): string | null {
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
