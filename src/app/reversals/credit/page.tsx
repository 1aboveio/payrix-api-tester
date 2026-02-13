'use client';

import { useMemo, useState } from 'react';

import { creditAction } from '@/actions/payrix';
import { ApiResultPanel } from '@/components/payrix/api-result-panel';
import { TemplateSelector } from '@/components/payrix/template-selector';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePayrixConfig } from '@/hooks/use-payrix-config';
import { buildCurlCommand } from '@/lib/payrix/curl';
import { creditTemplates } from '@/lib/payrix/templates';
import type { CreditRequest, ServerActionResult } from '@/lib/payrix/types';
import { generateReferenceNumber, generateTicketNumber } from '@/lib/payrix/identifiers';
import { buildHeaderPreview } from '@/lib/payrix/headers';
import { addExistingHistoryEntry } from '@/lib/storage';

const DEFAULTS: CreditRequest = {
  laneId: '',
  transactionAmount: '',
  referenceNumber: '',
};

export default function CreditPage() {
  const { config } = usePayrixConfig();
  const [form, setForm] = useState<CreditRequest>({ ...DEFAULTS });
  const [templateId, setTemplateId] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [result, setResult] = useState<ServerActionResult<unknown> | null>(null);
  const [saving, setSaving] = useState(false);

  const curlCommand = useMemo(
    () =>
      buildCurlCommand({
        config,
        endpoint: '/api/v1/credit',
        method: 'POST',
        body: form,
        includeAuthorization: true,
      }),
    [config, form]
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Credit (Standalone Refund)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <TemplateSelector
            templates={creditTemplates}
            selectedId={templateId}
            onSelect={(tpl) => {
              setTemplateId(tpl.id);
              setTemplateName(tpl.name);
              setForm({ ...DEFAULTS, ...tpl.fields } as CreditRequest);
            }}
            onReset={() => {
              setTemplateId('');
              setTemplateName('');
              setForm({ ...DEFAULTS });
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
              const response = await creditAction({ config, request: payload, templateName: templateName || undefined });
              setResult(response as ServerActionResult<unknown>);
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="laneId">Lane ID</Label>
              <Input
                id="laneId"
                value={form.laneId}
                onChange={(e) => setForm({ ...form, laneId: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="transactionAmount">Transaction Amount</Label>
              <Input
                id="transactionAmount"
                value={form.transactionAmount}
                onChange={(e) => setForm({ ...form, transactionAmount: e.target.value })}
                placeholder="10.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="referenceNumber">Reference Number (optional)</Label>
              <Input
                id="referenceNumber"
                value={form.referenceNumber}
                onChange={(e) => setForm({ ...form, referenceNumber: e.target.value })}
              />
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
                  setForm({ ...DEFAULTS });
                }}
              >
                Reset
              </Button>
              <Button type="submit">
                Execute Credit
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <ApiResultPanel
        requestHeaders={buildHeaderPreview(config, true)}
        requestPreview={form}
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
