'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getWebhookEventAction } from '@/actions/webhooks';
import type { WebhookEvent } from '@/lib/platform/types';
import { formatInTz } from '@/lib/date-utils';
import { useTimezone } from '@/hooks/use-timezone';

export default function WebhookDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { timezone } = useTimezone();

  const [event, setEvent] = useState<WebhookEvent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getWebhookEventAction(id)
      .then(setEvent)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button asChild variant="outline" size="sm">
            <Link href="/webhooks">&larr; Back</Link>
          </Button>
          <h2 className="text-2xl font-bold">Webhook Event</h2>
        </div>
        <p className="text-muted-foreground">Event not found.</p>
      </div>
    );
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
            <dd>{formatInTz(new Date(event.receivedAt), 'MMM d, yyyy HH:mm:ss', timezone)}</dd>
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
