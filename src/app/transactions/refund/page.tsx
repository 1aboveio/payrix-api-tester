'use client';

import { useEffect, useMemo, useState } from 'react';

import { refundAction } from '@/actions/payrix';
import { ApiResultPanel } from '@/components/payrix/api-result-panel';
import { EndpointInfo } from '@/components/payrix/endpoint-info';
import { TemplateSelector } from '@/components/payrix/template-selector';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePayrixConfig } from '@/hooks/use-payrix-config';
import { buildCurlCommand } from '@/lib/payrix/curl';
import { refundTemplates } from '@/lib/payrix/templates';
import { toast } from '@/lib/toast';
import type { HttpMethod, RefundRequest, ServerActionResult } from '@/lib/payrix/types';
import { generateReferenceNumber, generateTicketNumber, generateRequestId } from '@/lib/payrix/identifiers';
import { buildHeaderPreview } from '@/lib/payrix/headers';
import { addExistingHistoryEntry } from '@/lib/storage';
import { activeTripos } from '@/lib/config';

const DEFAULTS: RefundRequest = {
  laneId: '',
  transactionAmount: '',
  referenceNumber: '',
  ticketNumber: '',
};

export default function RefundPage() {
  const { config } = usePayrixConfig();
  const [paymentAccountId, setPaymentAccountId] = useState('');
  const [form, setForm] = useState<RefundRequest>({ ...DEFAULTS, laneId: activeTripos(config).defaultLaneId || '', referenceNumber: generateReferenceNumber(), ticketNumber: generateTicketNumber() });
  const [templateId, setTemplateId] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [httpMethod, setHttpMethod] = useState('POST');
  const [requestId, setRequestId] = useState<string | null>(null);

  useEffect(() => {
    setRequestId(generateRequestId());
  }, []);
  const [result, setResult] = useState<ServerActionResult<unknown> | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const curlCommand = useMemo(
    () =>
      paymentAccountId
        ? buildCurlCommand({
            config,
            endpoint: `/api/v1/refund/${encodeURIComponent(paymentAccountId)}`,
            method: httpMethod,
            body: form,
            includeAuthorization: true,
          })
        : '',
    [config, form, paymentAccountId, httpMethod]
  );

  return (
    <div className="space-y-4">
      <EndpointInfo method="POST" endpoint="/api/v1/refund/{paymentAccountId}" docsUrl="https://docs.payrix.com/reference" />
      <Card>
        <CardHeader>
          <CardTitle>Refund (Standalone)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <TemplateSelector
            templates={refundTemplates}
            selectedId={templateId}
            onSelect={(tpl) => {
              setTemplateId(tpl.id);
              setTemplateName(tpl.name);
              setForm({ ...DEFAULTS, laneId: activeTripos(config).defaultLaneId || '', ...tpl.fields } as RefundRequest);
            }}
            onReset={() => {
              setTemplateId('');
              setTemplateName('');
              setRequestId(generateRequestId());
              setForm({ ...DEFAULTS, laneId: activeTripos(config).defaultLaneId || '', referenceNumber: generateReferenceNumber(), ticketNumber: generateTicketNumber() });
            }}
          />
          <form
            className="grid gap-4 md:grid-cols-2"
            onSubmit={async (event) => {
              event.preventDefault();
              setSaving(false);
              const payload = { ...form };
              if (!payload.referenceNumber) {
                payload.referenceNumber = generateReferenceNumber();
              }
              if (!payload.ticketNumber) {
                payload.ticketNumber = generateTicketNumber();
              }
                            setForm(payload);
              const nextRequestId = generateRequestId();
              setRequestId(nextRequestId);
              setSubmitting(true);
              toast.info('Sending request...');
              try {
                const response = await refundAction({
                  config,
                  requestId: nextRequestId,
                  paymentAccountId,
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
              <Label htmlFor="paymentAccountId">Payment Account ID</Label>
              <Input
                id="paymentAccountId"
                value={paymentAccountId}
                onChange={(e) => setPaymentAccountId(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="laneId">Lane ID</Label>
              <Input id="laneId" value={form.laneId} onChange={(e) => setForm({ ...form, laneId: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Transaction Amount</Label>
              <Input id="amount" value={form.transactionAmount} onChange={(e) => setForm({ ...form, transactionAmount: e.target.value })} placeholder="1.12" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reference">Reference Number</Label>
              <Input id="reference" value={form.referenceNumber ?? ''} onChange={(e) => setForm({ ...form, referenceNumber: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ticket">Ticket Number</Label>
              <Input id="ticket" value={form.ticketNumber ?? ''} onChange={(e) => setForm({ ...form, ticketNumber: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invokeManualEntry">Invoke Manual Entry</Label>
              <Select
                value={
                  (form as { invokeManualEntry?: boolean }).invokeManualEntry === undefined
                    ? 'unset'
                    : (form as { invokeManualEntry?: boolean }).invokeManualEntry
                    ? 'true'
                    : 'false'
                }
                onValueChange={(value) =>
                  setForm({
                    ...form,
                    invokeManualEntry: value === 'unset' ? undefined : value === 'true',
                  })
                }
              >
                <SelectTrigger id="invokeManualEntry">
                  <SelectValue placeholder="Unset" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unset">Unset</SelectItem>
                  <SelectItem value="true">True</SelectItem>
                  <SelectItem value="false">False</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setTemplateId('');
                  setTemplateName('');
              setRequestId(generateRequestId());
                  setForm({ ...DEFAULTS, laneId: activeTripos(config).defaultLaneId || '', referenceNumber: generateReferenceNumber(), ticketNumber: generateTicketNumber() });
                }}
              >
                Reset
              </Button>
              <Button type="submit" disabled={submitting}>
                Execute Refund
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <ApiResultPanel
        requestHeaders={buildHeaderPreview(config, true, requestId ?? undefined)}
        requestPreview={{ paymentAccountId, ...form }}
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
