'use client';

import Link from 'next/link';
import { useState } from 'react';

import { cancelAction } from '@/actions/payrix';
import { ApiResultPanel } from '@/components/payrix/api-result-panel';
import { EndpointInfo } from '@/components/payrix/endpoint-info';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePayrixConfig } from '@/hooks/use-payrix-config';
import { buildCurlCommand } from '@/lib/payrix/curl';
import { buildHeaderPreview } from '@/lib/payrix/headers';
import { addExistingHistoryEntry } from '@/lib/storage';
import type { HttpMethod, ServerActionResult } from '@/lib/payrix/types';

export default function CancelPage() {
  const { config } = usePayrixConfig();
  const [laneId, setLaneId] = useState('');
  const [requestId, setRequestId] = useState<string | null>(null);
  const [result, setResult] = useState<ServerActionResult<unknown> | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [httpMethod, setHttpMethod] = useState<HttpMethod>('POST');

  const curlCommand = buildCurlCommand({
    config,
    endpoint: '/api/v1/cancel',
    method: httpMethod,
    body: { laneId },
    includeAuthorization: true,
  });

  return (
    <div className="space-y-4">
      <EndpointInfo method="POST" endpoint="/api/v1/cancel" docsUrl="https://docs.payrix.com/reference" />
      <Card>
        <CardHeader>
          <CardTitle>Cancel Transaction</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Cancel an ongoing transaction on the specified lane. This is typically used to abort a transaction
            that is currently in progress on the PIN Pad.
          </p>
          <form
            className="grid gap-4"
            onSubmit={async (event) => {
              event.preventDefault();
              setSaving(false);
              const nextRequestId = crypto.randomUUID();
              setRequestId(nextRequestId);
              setSubmitting(true);
              try {
                const response = await cancelAction({
                  config,
                  requestId: nextRequestId,
                  laneId,
                  httpMethod,
                });
                setResult(response as ServerActionResult<unknown>);
              } finally {
                setSubmitting(false);
              }
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="laneId">Lane ID</Label>
              <Input
                id="laneId"
                value={laneId}
                onChange={(e) => setLaneId(e.target.value)}
                placeholder="Enter lane ID"
                required
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setLaneId('');
                }}
              >
                Reset
              </Button>
              <Button type="submit" disabled={submitting}>
                Execute Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <ApiResultPanel
        requestHeaders={buildHeaderPreview(config, true, requestId ?? undefined)}
        requestPreview={{ laneId }}
        httpMethod={httpMethod}
        onHttpMethodChange={setHttpMethod}
        loading={submitting}
        result={result}
        curlCommand={curlCommand}
        historySaved={saving}
        onSaveHistory={
          result
            ? () => {
                addExistingHistoryEntry(result.historyEntry);
                setSaving(true);
              }
            : undefined
        }
      />
    </div>
  );
}
