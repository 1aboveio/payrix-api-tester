import { NextRequest, NextResponse } from 'next/server';
import { addWebhookEvent } from '@/lib/webhook-history';
import type { WebhookEvent } from '@/lib/platform/types';

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    
    // Extract event type from payload - Payrix typically sends event type in the payload
    const eventType = extractEventType(payload);
    const entityId = extractEntityId(payload);
    
    const webhookEvent: WebhookEvent = {
      id: crypto.randomUUID(),
      receivedAt: new Date().toISOString(),
      eventType: eventType || 'unknown',
      payload,
      entityId,
    };
    
    addWebhookEvent(webhookEvent);
    
    return NextResponse.json({ success: true, id: webhookEvent.id });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 400 }
    );
  }
}

// Extract event type from Payrix webhook payload
// Payrix wraps alerts in: { response: { alert: { invoiceStatus, txnStatus, ... }, data: [...] } }
function extractEventType(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null;

  const p = payload as Record<string, unknown>;

  // Direct fields (simple/custom webhooks)
  if (typeof p.event === 'string') return p.event;
  if (typeof p.eventType === 'string') return p.eventType;

  // Payrix alert structure: payload.response.alert
  if (p.response && typeof p.response === 'object') {
    const response = p.response as Record<string, unknown>;
    if (response.alert && typeof response.alert === 'object') {
      const alert = response.alert as Record<string, unknown>;

      // Invoice alerts: invoiceStatus = "paid" | "viewed" | "emailed" | etc.
      if (typeof alert.invoiceStatus === 'string') {
        return `invoice.${alert.invoiceStatus}`;
      }
      // Transaction alerts: txnStatus or similar
      if (typeof alert.txnStatus === 'string') {
        return `txn.${alert.txnStatus}`;
      }
      // Fallback: invoiceType / txnType
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

// Extract entity ID from Payrix webhook payload
function extractEntityId(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object') return undefined;

  const p = payload as Record<string, unknown>;

  // Direct fields
  if (typeof p.id === 'string') return p.id;
  if (typeof p.entityId === 'string') return p.entityId;

  // Payrix alert structure: first item in response.data array
  if (p.response && typeof p.response === 'object') {
    const response = p.response as Record<string, unknown>;
    if (Array.isArray(response.data) && response.data.length > 0) {
      const first = response.data[0] as Record<string, unknown>;
      if (typeof first.id === 'string') return first.id;
    }
    // Also check response.alert.invoice.id
    if (response.alert && typeof response.alert === 'object') {
      const alert = response.alert as Record<string, unknown>;
      if (alert.invoice && typeof alert.invoice === 'object') {
        const inv = alert.invoice as Record<string, unknown>;
        if (typeof inv.id === 'string') return inv.id;
      }
    }
  }

  // Nested data object fallback
  if (p.data && typeof p.data === 'object' && !Array.isArray(p.data)) {
    const data = p.data as Record<string, unknown>;
    if (typeof data.id === 'string') return data.id;
  }

  return undefined;
}

// Reject other methods
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
