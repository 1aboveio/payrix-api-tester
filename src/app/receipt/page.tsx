'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import { receiptAction } from '@/actions/payrix';
import { ApiResultPanel } from '@/components/payrix/api-result-panel';
import { EndpointInfo } from '@/components/payrix/endpoint-info';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { usePayrixConfig } from '@/hooks/use-payrix-config';
import { buildCurlCommand } from '@/lib/payrix/curl';
import { buildHeaderPreview } from '@/lib/payrix/headers';
import { toast } from '@/lib/toast';
import { generateRequestId } from '@/lib/payrix/identifiers';
import type { HttpMethod, ReceiptRequest, ServerActionResult } from '@/lib/payrix/types';
import { addExistingHistoryEntry } from '@/lib/storage';

function ReceiptForm() {
  const { config } = usePayrixConfig();
  const searchParams = useSearchParams();
  const defaultForm: ReceiptRequest = {
    transactionId: searchParams.get('transactionId') ?? '',
  };
  const [form, setForm] = useState<ReceiptRequest>({
    ...defaultForm,
  });
  const [httpMethod, setHttpMethod] = useState('POST');
  const [requestId, setRequestId] = useState<string>(generateRequestId());
  const [result, setResult] = useState<ServerActionResult<unknown> | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const curlCommand = buildCurlCommand({
    config,
    endpoint: '/api/v1/receipt',
    method: httpMethod,
    body: form,
    includeAuthorization: true,
  });

  return (
    <div className="space-y-4">
      <EndpointInfo method="POST" endpoint="/api/v1/receipt" docsUrl="https://docs.payrix.com/reference" />
      <Card>
        <CardHeader>
          <CardTitle>Receipt Lookup</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4 md:grid-cols-2"
            onSubmit={async (event) => {
              event.preventDefault();
              setSaving(false);
              const nextRequestId = generateRequestId();
              setRequestId(nextRequestId);
              setSubmitting(true);
              toast.info('Sending request...');
              try {
                const response = await receiptAction({ config, requestId: nextRequestId, request: form, httpMethod: httpMethod as HttpMethod });
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
                required
              />
            </div>
            <div className="md:col-span-2 flex flex-wrap gap-2">
              <Button type="submit" disabled={submitting}>
                Get Receipt
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={submitting}
                onClick={() => {
                  setForm(defaultForm);
                  setResult(null);
                  setSaving(false);
                }}
              >
                Reset
              </Button>
            </div>
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

export default function ReceiptPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <ReceiptForm />
    </Suspense>
  );
}
