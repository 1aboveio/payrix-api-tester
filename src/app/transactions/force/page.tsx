'use client';

import { useMemo, useState } from 'react';

import { forceAction } from '@/actions/payrix';
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
import { forceTemplates } from '@/lib/payrix/templates';
import { toast } from '@/lib/toast';
import type { ForceRequest, HttpMethod, ServerActionResult } from '@/lib/payrix/types';
import { generateReferenceNumber, generateTicketNumber } from '@/lib/payrix/identifiers';
import { buildHeaderPreview } from '@/lib/payrix/headers';
import { addExistingHistoryEntry } from '@/lib/storage';

const DEFAULTS: ForceRequest = {
  laneId: '',
  transactionAmount: '',
  approvalNumber: '',
  referenceNumber: '',
  ticketNumber: '',
};

export default function ForcePage() {
  const { config } = usePayrixConfig();
  const [form, setForm] = useState<ForceRequest>({ ...DEFAULTS, laneId: config.defaultLaneId || '' });
  const [templateId, setTemplateId] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [httpMethod, setHttpMethod] = useState('POST');
  const [requestId, setRequestId] = useState<string | null>(null);
  const [result, setResult] = useState<ServerActionResult<unknown> | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const curlCommand = useMemo(
    () =>
      buildCurlCommand({
        config,
        endpoint: '/api/v1/force/credit',
        method: httpMethod,
        body: form,
        includeAuthorization: true,
      }),
    [config, form, httpMethod]
  );

  return (
    <div className="space-y-4">
      <EndpointInfo method="POST" endpoint="/api/v1/force/credit" docsUrl="https://docs.payrix.com/reference" />
      <Card>
        <CardHeader>
          <CardTitle>Force (Voice Auth)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <TemplateSelector
            templates={forceTemplates}
            selectedId={templateId}
            onSelect={(tpl) => {
              setTemplateId(tpl.id);
              setTemplateName(tpl.name);
              setForm({ ...DEFAULTS, ...tpl.fields } as ForceRequest);
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
              if (!payload.approvalNumber && payload.approvalCode) {
                payload.approvalNumber = payload.approvalCode;
              }
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
                const response = await forceAction({
                  config,
                  requestId: nextRequestId,
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
              <Label htmlFor="laneId">Lane ID</Label>
              <Input id="laneId" value={form.laneId} onChange={(e) => setForm({ ...form, laneId: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Transaction Amount</Label>
              <Input id="amount" value={form.transactionAmount} onChange={(e) => setForm({ ...form, transactionAmount: e.target.value })} placeholder="20.00" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="approvalNumber">Approval Number</Label>
              <Input id="approvalNumber" value={form.approvalNumber} onChange={(e) => setForm({ ...form, approvalNumber: e.target.value })} placeholder="123456" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reference">Reference Number</Label>
              <Input id="reference" value={form.referenceNumber} onChange={(e) => setForm({ ...form, referenceNumber: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ticket">Ticket Number</Label>
              <Input id="ticket" value={form.ticketNumber} onChange={(e) => setForm({ ...form, ticketNumber: e.target.value })} />
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
                  setForm({ ...DEFAULTS, laneId: config.defaultLaneId || '' });
                }}
              >
                Reset
              </Button>
              <Button type="submit" disabled={submitting}>
                Execute Force
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
