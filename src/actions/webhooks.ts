'use server';

import { getWebhookHistory } from '@/lib/webhook-history';
import type { WebhookEvent } from '@/lib/platform/types';

export async function getWebhookHistoryAction(): Promise<WebhookEvent[]> {
  return getWebhookHistory();
}
