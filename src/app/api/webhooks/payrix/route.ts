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
function extractEventType(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }
  
  const p = payload as Record<string, unknown>;
  
  // Common Payrix webhook payload structures
  if (typeof p.event === 'string') return p.event;
  if (typeof p.type === 'string') return p.type;
  if (typeof p.eventType === 'string') return p.eventType;
  
  // Check nested objects
  if (p.data && typeof p.data === 'object') {
    const data = p.data as Record<string, unknown>;
    if (typeof data.event === 'string') return data.event;
    if (typeof data.type === 'string') return data.type;
  }
  
  return null;
}

// Extract entity ID from Payrix webhook payload
function extractEntityId(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object') {
    return undefined;
  }
  
  const p = payload as Record<string, unknown>;
  
  // Common ID fields
  if (typeof p.id === 'string') return p.id;
  if (typeof p.entityId === 'string') return p.entityId;
  if (typeof p.entity_id === 'string') return p.entity_id;
  
  // Check nested data object
  if (p.data && typeof p.data === 'object') {
    const data = p.data as Record<string, unknown>;
    if (typeof data.id === 'string') return data.id;
    if (typeof data.entityId === 'string') return data.entityId;
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
