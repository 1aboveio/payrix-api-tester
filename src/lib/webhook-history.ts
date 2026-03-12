import type { WebhookEvent } from './platform/types';

const MAX_WEBHOOK_EVENTS = 50;

// Use globalThis to share state across Next.js webpack chunks
// (API route and server action are bundled separately; module-level vars are NOT shared)
const g = globalThis as typeof globalThis & {
  __webhookHistory?: WebhookEvent[];
};
if (!g.__webhookHistory) g.__webhookHistory = [];

export function addWebhookEvent(event: WebhookEvent): void {
  g.__webhookHistory!.unshift(event);
  if (g.__webhookHistory!.length > MAX_WEBHOOK_EVENTS) {
    g.__webhookHistory!.length = MAX_WEBHOOK_EVENTS;
  }
}

export function getWebhookHistory(): WebhookEvent[] {
  return [...(g.__webhookHistory ?? [])];
}

export function clearWebhookHistory(): void {
  g.__webhookHistory = [];
}

export function deleteWebhookEvent(id: string): void {
  if (!g.__webhookHistory) return;
  const index = g.__webhookHistory.findIndex(e => e.id === id);
  if (index !== -1) g.__webhookHistory.splice(index, 1);
}
