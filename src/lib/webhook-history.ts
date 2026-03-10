import type { WebhookEvent } from './platform/types';

const MAX_WEBHOOK_EVENTS = 50;

const webhookHistory: WebhookEvent[] = [];

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
