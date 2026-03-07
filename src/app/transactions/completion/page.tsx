'use client';

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import { completionAction } from '@/actions/payrix';
import { ApiResultPanel } from '@/components/payrix/api-result-panel';
import { EndpointInfo } from '@/components/payrix/endpoint-info';
import { TemplateSelector } from '@/components/payrix/template-selector';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { usePayrixConfig } from '@/hooks/use-payrix-config';
import { buildCurlCommand } from '@/lib/payrix/curl';
import { completionTemplates } from '@/lib/payrix/templates';
import { toast } from '@/lib/toast';
import type { CompletionRequest, HttpMethod, ServerActionResult } from '@/lib/payrix/types';
import { generateReferenceNumber, generateTicketNumber } from '@/lib/payrix/identifiers';
import { buildHeaderPreview } from '@/lib/payrix/headers';
import { addExistingHistoryEntry } from '@/lib/storage';

const DEFAULTS: CompletionRequest = {
  transactionAmount: '',
  referenceNumber: '',
  ticketNumber: '',
};

function CompletionForm() {
  const { config } = usePayrixConfig();
  const searchParams = useSearchParams();
  const [transactionId, setTransactionId] = useState(searchParams.get('transactionId') ?? '');
  const [form, setForm] = useState<CompletionRequest>({ ...DEFAULTS });
  const [templateId, setTemplateId] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [httpMethod, setHttpMethod] = useState('POST');
  const [requestId, setRequestId] = useState<string | null>(null);
  const [result, setResult] = useState<ServerActionResult<unknown> | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const curlCommand = useMemo(
    () =>
      transactionId
        ? buildCurlCommand({
            config,
            endpoint: `/api/v1/authorization/${encodeURIComponent(transactionId)}/completion`,
            method: httpMethod,
            body: form,
            includeAuthorization: true,
          })
        : '',
    [config, form, transactionId, httpMethod]
  );

  return (
    <div className="space-y-4">
      <EndpointInfo method="POST" endpoint="/api/v1/authorization/{transactionId}/completion" docsUrl="https://docs.payrix.com/reference" />
      <Card>
        <CardHeader>
          <CardTitle>Completion</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <TemplateSelector
            templates={completionTemplates}
            selectedId={templateId}
            onSelect={(tpl) => {
              setTemplateId(tpl.id);
              setTemplateName(tpl.name);
              setForm({ ...DEFAULTS, laneId: config.defaultLaneId || '', ...tpl.fields } as CompletionRequest);
            }}
            onReset={() => {
              setTemplateId('');
              setTemplateName('');
              setForm({ ...DEFAULTS, laneId: config.defaultLaneId || '' });
            }}
          />
          <form
            className="grid gap-4 md:grid-cols-2"
            onSubmit={async (event) => {
              event.preventDefault();
              setSaving(false);
              const payload = { ...form };
              if ('referenceNumber' in payload && !payload.referenceNumber) {
                payload.referenceNumber = generateReferenceNumber();
              }
              if ('ticketNumber' in payload && !payload.ticketNumber) {
                payload.ticketNumber = generateTicketNumber();
              }
              setForm(payload);
              const nextRequestId = crypto.randomUUID();
              setRequestId(nextRequestId);
              setSubmitting(true);
              toast.info('Sending request...');
              try {
                const response = await completionAction({
                  config,
                  requestId: nextRequestId,
                  transactionId,
                  request: payload,
                  templateName: templateName || undefined,
                  httpMethod: httpMethod as HttpMethod,
                });
                setResult(response as ServerActionResult<unknown>);
                toast.success('Request sent');
              } finally {
                setSubmitting(false);
              }
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="transactionId">Authorization Transaction ID</Label>
              <Input id="transactionId" value={transactionId} onChange={(e) => setTransactionId(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Transaction Amount (optional override)</Label>
              <Input id="amount" value={form.transactionAmount} onChange={(e) => setForm({ ...form, transactionAmount: e.target.value })} placeholder="Leave blank for full amount" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reference">Reference Number</Label>
              <Input id="reference" value={form.referenceNumber} onChange={(e) => setForm({ ...form, referenceNumber: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ticket">Ticket Number</Label>
              <Input id="ticket" value={form.ticketNumber} onChange={(e) => setForm({ ...form, ticketNumber: e.target.value })} />
            </div>
            <div className="md:col-span-2 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setTemplateId('');
                  setTemplateName('');
                  setForm({ ...DEFAULTS, laneId: config.defaultLaneId || '' });
                }}
              >
                Reset
              </Button>
              <Button type="submit" disabled={submitting}>
                Execute Completion
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <ApiResultPanel
        requestHeaders={buildHeaderPreview(config, true, requestId ?? undefined)}
        requestPreview={{ transactionId, ...form }}
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

export default function CompletionPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <CompletionForm />
    </Suspense>
  );
}
