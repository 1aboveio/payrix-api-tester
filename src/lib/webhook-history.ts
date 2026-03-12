import type { WebhookEvent } from './platform/types';

const MAX_WEBHOOK_EVENTS = 50;

// Use globalThis to share state across Next.js webpack chunks
const g = globalThis as typeof globalThis & {
  __webhookHistory?: WebhookEvent[];
};
if (!g.__webhookHistory) g.__webhookHistory = [];
const webhookHistory = g.__webhookHistory;

export function addWebhookEvent(event: WebhookEvent): void {
  webhookHistory.unshift(event);
  if (webhookHistory.length > MAX_WEBHOOK_EVENTS) {
    webhookHistory.length = MAX_WEBHOOK_EVENTS;
  }
}

export function getWebhookHistory(): WebhookEvent[] {
  return [...webhookHistory];
}

export function clearWebhookHistory(): void {
  webhookHistory.length = 0;
}

export function deleteWebhookEvent(id: string): void {
  const index = webhookHistory.findIndex(e => e.id === id);
  if (index !== -1) {
    webhookHistory.splice(index, 1);
  }
}
