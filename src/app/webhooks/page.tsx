'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { WebhookEndpointUrl } from '@/components/webhooks/webhook-endpoint-url';
import { getWebhookEventsPageAction } from '@/actions/webhooks';
import type { WebhookEvent } from '@/lib/platform/types';
import { formatInTz } from '@/lib/date-utils';
import { useTimezone } from '@/hooks/use-timezone';

const PAGE_SIZE = 50;

export default function WebhooksPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground py-8 text-center">Loading...</p>}>
      <WebhooksPageInner />
    </Suspense>
  );
}

function WebhooksPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { timezone } = useTimezone();

  const page = Math.max(1, Number(searchParams.get('page')) || 1);

  const [items, setItems] = useState<WebhookEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getWebhookEventsPageAction(page, PAGE_SIZE)
      .then(({ items, total }) => {
        setItems(items);
        setTotal(total);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Webhook Monitor</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Endpoint: <WebhookEndpointUrl />
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Received Events ({total})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Loading...</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No webhook events received yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Event Type</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Received At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>
                      <Link
                        href={`/webhooks/${event.id}`}
                        className="font-mono text-xs text-primary hover:underline"
                      >
                        {event.id.slice(0, 12)}…
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{event.eventType}</Badge>
                    </TableCell>
                    <TableCell>{event.source}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatInTz(new Date(event.receivedAt), 'MMM d, yyyy HH:mm:ss', timezone)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                {page > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/webhooks?page=${page - 1}`)}
                  >
                    Previous
                  </Button>
                )}
                {page < totalPages && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/webhooks?page=${page + 1}`)}
                  >
                    Next
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
