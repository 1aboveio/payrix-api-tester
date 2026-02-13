'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import { saleAction } from '@/actions/payrix';
import { ApiResultPanel } from '@/components/payrix/api-result-panel';
import { TemplateSelector } from '@/components/payrix/template-selector';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePayrixConfig } from '@/hooks/use-payrix-config';
import { buildCurlCommand } from '@/lib/payrix/curl';
import { saleTemplates } from '@/lib/payrix/templates';
import type { SaleRequest, ServerActionResult } from '@/lib/payrix/types';
import { generateReferenceNumber, generateTicketNumber } from '@/lib/payrix/identifiers';
import { addExistingHistoryEntry } from '@/lib/storage';

const DEFAULTS: SaleRequest = {
  laneId: '',
  transactionAmount: '',
  referenceNumber: '',
  ticketNumber: '',
};

export default function SalePage() {
  const { config } = usePayrixConfig();
  const [form, setForm] = useState<SaleRequest>({ ...DEFAULTS });
  const [templateId, setTemplateId] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [result, setResult] = useState<ServerActionResult<unknown> | null>(null);
  const [saving, setSaving] = useState(false);

  const transactionId = useMemo(() => {
    if (!result?.apiResponse.data || typeof result.apiResponse.data !== 'object') {
      return '';
    }

    const value = (result.apiResponse.data as Record<string, unknown>).transactionId;
    return typeof value === 'string' ? value : '';
  }, [result]);

  const curlCommand = useMemo(
    () =>
      buildCurlCommand({
        config,
        endpoint: '/api/v1/sale',
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
          <CardTitle>Sale</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <TemplateSelector
            templates={saleTemplates}
            selectedId={templateId}
            onSelect={(tpl) => {
              setTemplateId(tpl.id);
              setTemplateName(tpl.name);
              setForm({ ...DEFAULTS, ...tpl.fields } as SaleRequest);
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
              if ('ticketNumber' in payload && !payload.ticketNumber) {
                payload.ticketNumber = generateTicketNumber();
              }
              setForm(payload);
              const response = await saleAction({ config, request: payload, templateName: templateName || undefined });
              setResult(response as ServerActionResult<unknown>);
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="laneId">Lane ID</Label>
              <Input id="laneId" value={form.laneId} onChange={(e) => setForm({ ...form, laneId: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Transaction Amount</Label>
              <Input
                id="amount"
                value={form.transactionAmount}
                onChange={(e) => setForm({ ...form, transactionAmount: e.target.value })}
                placeholder="10.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reference">Reference Number</Label>
              <Input
                id="reference"
                value={form.referenceNumber}
                onChange={(e) => setForm({ ...form, referenceNumber: e.target.value })}
              />
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
                  setForm({ ...DEFAULTS });
                }}
              >
                Reset
              </Button>
              <Button type="submit">
                Execute Sale
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <ApiResultPanel
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
        quickActions={
          transactionId ? (
            <>
              <Button asChild variant="outline">
                <Link href={`/reversals/void?transactionId=${encodeURIComponent(transactionId)}`}>Void</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={`/reversals/return?transactionId=${encodeURIComponent(transactionId)}&paymentType=credit`}>Return</Link>
              </Button>
            </>
          ) : null
        }
      />
    </div>
  );
}
