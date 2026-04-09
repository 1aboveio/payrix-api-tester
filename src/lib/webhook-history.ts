'use server';

import { prisma } from '@/lib/db';
import type { WebhookEvent } from './platform/types';

const MAX_WEBHOOK_EVENTS = 50;

/**
 * @deprecated Use saveWebhookEventToDb instead. Keeping for backward compatibility during migration.
 */
export async function addWebhookEvent(event: WebhookEvent): Promise<void> {
  await prisma.webhookEvent.create({
    data: {
      eventType: event.eventType,
      source: event.source ?? 'payrix',
      payload: event.payload as object,
      headers: event.headers as object ?? null,
    },
  });
  
  // Also maintain in-memory cache for backward compatibility
  const g = globalThis as typeof globalThis & {
    __webhookHistory?: WebhookEvent[];
  };
  if (!g.__webhookHistory) g.__webhookHistory = [];
  g.__webhookHistory.unshift(event);
  if (g.__webhookHistory.length > MAX_WEBHOOK_EVENTS) {
    g.__webhookHistory.length = MAX_WEBHOOK_EVENTS;
  }
}

/**
 * Get webhook history from Cloud SQL database.
 * Falls back to in-memory cache if DB is unavailable.
 */
export async function getWebhookHistory(): Promise<WebhookEvent[]> {
  try {
    const events = await prisma.webhookEvent.findMany({
      orderBy: { receivedAt: 'desc' },
      take: MAX_WEBHOOK_EVENTS,
    });
    
    return events.map(e => ({
      id: e.id,
      eventType: e.eventType,
      source: e.source,
      payload: e.payload as WebhookEvent['payload'],
      headers: e.headers as WebhookEvent['headers'] | undefined,
      receivedAt: e.receivedAt.toISOString(),
    }));
  } catch (error) {
    console.error('Error fetching webhook events from DB, falling back to memory:', error);
    // Fallback to in-memory cache
    const g = globalThis as typeof globalThis & {
      __webhookHistory?: WebhookEvent[];
    };
    return [...(g.__webhookHistory ?? [])];
  }
}

/**
 * @deprecated Use getWebhookHistory instead.
 */
export function clearWebhookHistory(): void {
  const g = globalThis as typeof globalThis & {
    __webhookHistory?: WebhookEvent[];
  };
  g.__webhookHistory = [];
}

/**
 * @deprecated Not implemented for DB. Use individual event deletion instead.
 */
export function deleteWebhookEvent(id: string): void {
  const g = globalThis as typeof globalThis & {
    __webhookHistory?: WebhookEvent[];
  };
  if (!g.__webhookHistory) return;
  const index = g.__webhookHistory.findIndex(e => e.id === id);
  if (index !== -1) g.__webhookHistory.splice(index, 1);
}

// Export Prisma DAL functions for direct use
export { saveWebhookEvent, getWebhookEvents, getWebhookEventById } from './payrix/dal/webhook-events';
