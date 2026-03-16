import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getWebhookEventById } from '@/lib/payrix/dal/webhook-events';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default async function WebhookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getWebhookEventById(id);

  if (!event) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="outline" size="sm">
          <Link href="/webhooks">&larr; Back</Link>
        </Button>
        <h2 className="text-2xl font-bold">Webhook Event</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Event Metadata</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
            <dt className="font-medium text-muted-foreground">ID</dt>
            <dd className="font-mono text-xs">{event.id}</dd>
            <dt className="font-medium text-muted-foreground">Event Type</dt>
            <dd>
              <Badge variant="outline">{event.eventType}</Badge>
            </dd>
            <dt className="font-medium text-muted-foreground">Source</dt>
            <dd>{event.source}</dd>
            <dt className="font-medium text-muted-foreground">Received At</dt>
            <dd>{event.receivedAt.toLocaleString()}</dd>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payload</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="overflow-auto rounded-md bg-muted p-4 text-xs">
            {JSON.stringify(event.payload, null, 2)}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Headers</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="overflow-auto rounded-md bg-muted p-4 text-xs">
            {JSON.stringify(event.headers, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
