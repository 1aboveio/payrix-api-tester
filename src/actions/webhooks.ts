'use server';

import { getWebhookEvents } from '@/lib/payrix/dal/webhook-events';
import type { WebhookEvent } from '@/lib/platform/types';

export async function getWebhookHistoryAction(): Promise<WebhookEvent[]> {
  const { items } = await getWebhookEvents({ limit: 50 });
  
  // Map Prisma WebhookEvent to platform WebhookEvent type
  return items.map(e => ({
    id: e.id,
    eventType: e.eventType,
    source: e.source,
    payload: e.payload,
    receivedAt: e.receivedAt.toISOString(),
  }));
}