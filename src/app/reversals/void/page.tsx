'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import { voidAction } from '@/actions/payrix';
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
import { voidTemplates } from '@/lib/payrix/templates';
import type { ServerActionResult, VoidRequest } from '@/lib/payrix/types';
import { generateReferenceNumber, generateTicketNumber, generateRequestId } from '@/lib/payrix/identifiers';
import { buildHeaderPreview } from '@/lib/payrix/headers';
import { addExistingHistoryEntry } from '@/lib/storage';

const DEFAULTS: VoidRequest = {
  referenceNumber: '',
};

function VoidForm() {
  const { config } = usePayrixConfig();
  const searchParams = useSearchParams();
  const [transactionId, setTransactionId] = useState(searchParams.get('transactionId') ?? '');
  const [form, setForm] = useState<VoidRequest>({ ...DEFAULTS, referenceNumber: generateReferenceNumber(), ticketNumber: generateTicketNumber() });
  const [templateId, setTemplateId] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [requestId, setRequestId] = useState<string | null>(null);

  useEffect(() => {
    setRequestId(generateRequestId());
  }, []);
  const [result, setResult] = useState<ServerActionResult<unknown> | null>(null);
  const [saving, setSaving] = useState(false);

  const curlCommand = useMemo(
    () =>
      transactionId
        ? buildCurlCommand({
            config,
            endpoint: `/api/v1/void/${encodeURIComponent(transactionId)}`,
            method: 'POST',
            body: form,
            includeAuthorization: true,
          })
        : '',
    [config, form, transactionId]
  );

  return (
    <div className="space-y-4">
      <EndpointInfo method="POST" endpoint="/api/v1/void/{transactionId}" docsUrl="https://docs.payrix.com/reference" />
      <Card>
        <CardHeader>
          <CardTitle>Void Transaction</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <TemplateSelector
            templates={voidTemplates}
            selectedId={templateId}
            onSelect={(tpl) => {
              setTemplateId(tpl.id);
              setTemplateName(tpl.name);
              setForm({ ...DEFAULTS, laneId: config.defaultLaneId || '', ...tpl.fields } as VoidRequest);
            }}
            onReset={() => {
              setTemplateId('');
              setTemplateName('');
              setRequestId(generateRequestId());
              setForm({ ...DEFAULTS, laneId: config.defaultLaneId || '', referenceNumber: generateReferenceNumber(), ticketNumber: generateTicketNumber() });
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
              setForm(payload);
              const nextRequestId = generateRequestId();
              setRequestId(nextRequestId);

              const response = await voidAction({ config, requestId: nextRequestId, transactionId, request: payload, templateName: templateName || undefined });
              setResult(response as ServerActionResult<unknown>);
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="transactionId">Transaction ID</Label>
              <Input
                id="transactionId"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="referenceNumber">Reference Number (optional)</Label>
              <Input
                id="referenceNumber"
                value={(form.referenceNumber as string) ?? ''}
                onChange={(e) => setForm({ ...form, referenceNumber: e.target.value })}
              />
            </div>
            <div className="md:col-span-2 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setTemplateId('');
                  setTemplateName('');
              setRequestId(generateRequestId());
                  setForm({ ...DEFAULTS, laneId: config.defaultLaneId || '', referenceNumber: generateReferenceNumber(), ticketNumber: generateTicketNumber() });
                }}
              >
                Reset
              </Button>
              <Button type="submit">
                Execute Void
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <ApiResultPanel
        requestHeaders={buildHeaderPreview(config, true, requestId ?? undefined)}
        requestPreview={{ transactionId, ...form }}
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

export default function VoidPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <VoidForm />
    </Suspense>
  );
}
