'use server';

import { getWebhookEvents, getWebhookEventById } from '@/lib/payrix/dal/webhook-events';
import type { WebhookEvent } from '@/lib/platform/types';

export async function getWebhookHistoryAction(): Promise<WebhookEvent[]> {
  const { items } = await getWebhookEvents({ limit: 50 });

  // Map Prisma WebhookEvent to platform WebhookEvent type
  return items.map(e => ({
    id: e.id,
    eventType: e.eventType,
    source: e.source,
    payload: e.payload as WebhookEvent['payload'],
    headers: e.headers as WebhookEvent['headers'] | undefined,
    receivedAt: e.receivedAt.toISOString(),
  }));
}

export interface WebhookPageResult {
  items: WebhookEvent[];
  total: number;
}

export async function getWebhookEventsPageAction(page: number, pageSize: number): Promise<WebhookPageResult> {
  const offset = (page - 1) * pageSize;
  const { items, total } = await getWebhookEvents({ limit: pageSize, offset });
  return {
    total,
    items: items.map(e => ({
      id: e.id,
      eventType: e.eventType,
      source: e.source,
      payload: e.payload as WebhookEvent['payload'],
      headers: e.headers as WebhookEvent['headers'] | undefined,
      receivedAt: e.receivedAt.toISOString(),
    })),
  };
}

export async function getWebhookEventAction(id: string): Promise<WebhookEvent | null> {
  const e = await getWebhookEventById(id);
  if (!e) return null;
  return {
    id: e.id,
    eventType: e.eventType,
    source: e.source,
    payload: e.payload as WebhookEvent['payload'],
    headers: e.headers as WebhookEvent['headers'] | undefined,
    receivedAt: e.receivedAt.toISOString(),
  };
}
