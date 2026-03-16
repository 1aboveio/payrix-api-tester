import { prisma } from '@/lib/db';

export async function saveWebhookEvent(data: {
  eventType: string;
  source: string;
  payload: unknown;
  headers: unknown;
}) {
  return prisma.webhookEvent.create({
    data: {
      eventType: data.eventType,
      source: data.source,
      payload: data.payload as object,
      headers: (data.headers as object) ?? null,
    },
  });
}

export async function getWebhookEvents({
  limit = 50,
  offset = 0,
}: {
  limit?: number;
  offset?: number;
}) {
  const [items, total] = await Promise.all([
    prisma.webhookEvent.findMany({
      orderBy: { receivedAt: 'desc' },
      take: limit,
      skip: offset,
      select: { id: true, eventType: true, source: true, receivedAt: true },
    }),
    prisma.webhookEvent.count(),
  ]);
  return { items, total };
}

export async function getWebhookEventById(id: string) {
  return prisma.webhookEvent.findUnique({ where: { id } });
}
