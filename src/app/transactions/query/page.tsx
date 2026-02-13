'use client';

import { useMemo, useState } from 'react';

import { transactionQueryAction } from '@/actions/payrix';
import { ApiResultPanel } from '@/components/payrix/api-result-panel';
import { EndpointInfo } from '@/components/payrix/endpoint-info';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePayrixConfig } from '@/hooks/use-payrix-config';
import { buildCurlCommand } from '@/lib/payrix/curl';
import { buildHeaderPreview } from '@/lib/payrix/headers';
import { toast } from '@/lib/toast';
import type { HttpMethod, ServerActionResult, TransactionQueryRequest } from '@/lib/payrix/types';
import { addExistingHistoryEntry } from '@/lib/storage';

export default function TransactionQueryPage() {
  const { config } = usePayrixConfig();
  const [form, setForm] = useState<TransactionQueryRequest>({
    transactionId: '',
    referenceNumber: '',
    terminalId: config.defaultTerminalId || '',
    startDate: '',
    endDate: '',
  });
  const [httpMethod, setHttpMethod] = useState('POST');
  const [requestId, setRequestId] = useState<string | null>(null);
  const [result, setResult] = useState<ServerActionResult<unknown> | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const curlCommand = useMemo(
    () =>
      buildCurlCommand({
        config,
        endpoint: '/api/v1/transactionQuery',
        method: httpMethod,
        body: form,
        includeAuthorization: true,
      }),
    [config, form, httpMethod]
  );

  return (
    <div className="space-y-4">
      <EndpointInfo method="POST" endpoint="/api/v1/transactionQuery" docsUrl="https://docs.payrix.com/reference" />
      <Card>
        <CardHeader>
          <CardTitle>Transaction Query</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4 md:grid-cols-2"
            onSubmit={async (event) => {
              event.preventDefault();
              setSaving(false);
              const request = Object.fromEntries(
                Object.entries(form).filter(([, value]) => typeof value !== 'string' || value.trim() !== '')
              ) as TransactionQueryRequest;
              const nextRequestId = crypto.randomUUID();
              setRequestId(nextRequestId);
              setSubmitting(true);
              toast.info('Sending request...');
              try {
                const response = await transactionQueryAction({ config, requestId: nextRequestId, request, httpMethod: httpMethod as HttpMethod });
                setResult(response as ServerActionResult<unknown>);
                toast.success('Request sent');
              } finally {
                setSubmitting(false);
              }
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="transactionId">Transaction ID</Label>
              <Input
                id="transactionId"
                value={form.transactionId}
                onChange={(event) => setForm({ ...form, transactionId: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="referenceNumber">Reference Number</Label>
              <Input
                id="referenceNumber"
                value={form.referenceNumber}
                onChange={(event) => setForm({ ...form, referenceNumber: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="terminalId">Terminal ID</Label>
              <Input id="terminalId" value={form.terminalId} onChange={(event) => setForm({ ...form, terminalId: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input id="startDate" value={form.startDate as string} onChange={(event) => setForm({ ...form, startDate: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input id="endDate" value={form.endDate as string} onChange={(event) => setForm({ ...form, endDate: event.target.value })} />
            </div>
            <Button className="md:col-span-2" type="submit" disabled={submitting}>
              Execute
            </Button>
          </form>
        </CardContent>
      </Card>

      <ApiResultPanel
        requestHeaders={buildHeaderPreview(config, true, requestId ?? undefined)}
        requestPreview={form}
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
