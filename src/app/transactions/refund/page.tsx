'use client';

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import { refundAction } from '@/actions/payrix';
import { ApiResultPanel } from '@/components/payrix/api-result-panel';
import { TemplateSelector } from '@/components/payrix/template-selector';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { usePayrixConfig } from '@/hooks/use-payrix-config';
import { buildCurlCommand } from '@/lib/payrix/curl';
import { refundTemplates } from '@/lib/payrix/templates';
import type { PaymentType, RefundRequest, ServerActionResult } from '@/lib/payrix/types';
import { generateReferenceNumber, generateTicketNumber } from '@/lib/payrix/identifiers';
import { buildHeaderPreview } from '@/lib/payrix/headers';
import { addExistingHistoryEntry } from '@/lib/storage';

const DEFAULTS: RefundRequest = {
  transactionAmount: '',
  referenceNumber: '',
};

function RefundForm() {
  const { config } = usePayrixConfig();
  const searchParams = useSearchParams();
  const [transactionId, setTransactionId] = useState(searchParams.get('transactionId') ?? '');
  const [paymentType, setPaymentType] = useState<PaymentType>((searchParams.get('paymentType') as PaymentType) || 'credit');
  const [form, setForm] = useState<RefundRequest>({ ...DEFAULTS });
  const [templateId, setTemplateId] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [result, setResult] = useState<ServerActionResult<unknown> | null>(null);
  const [saving, setSaving] = useState(false);

  const curlCommand = useMemo(
    () =>
      transactionId
        ? buildCurlCommand({
            config,
            endpoint: `/api/v1/sale/${encodeURIComponent(transactionId)}/refund/${encodeURIComponent(paymentType)}`,
            method: 'POST',
            body: form,
            includeAuthorization: true,
          })
        : '',
    [config, form, transactionId, paymentType]
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Refund (Linked)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <TemplateSelector
            templates={refundTemplates}
            selectedId={templateId}
            onSelect={(tpl) => {
              setTemplateId(tpl.id);
              setTemplateName(tpl.name);
              setForm({ ...DEFAULTS, ...tpl.fields } as RefundRequest);
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
              const response = await refundAction({ config, transactionId, paymentType, request: payload, templateName: templateName || undefined });
              setResult(response as ServerActionResult<unknown>);
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="transactionId">Original Transaction ID</Label>
              <Input id="transactionId" value={transactionId} onChange={(e) => setTransactionId(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentType">Payment Type</Label>
              <Select value={paymentType} onValueChange={(v) => setPaymentType(v as PaymentType)}>
                <SelectTrigger id="paymentType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit">Credit</SelectItem>
                  <SelectItem value="debit">Debit</SelectItem>
                  <SelectItem value="ebt">EBT</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Refund Amount (optional)</Label>
              <Input id="amount" value={form.transactionAmount} onChange={(e) => setForm({ ...form, transactionAmount: e.target.value })} placeholder="Leave blank for full amount" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reference">Reference Number</Label>
              <Input id="reference" value={form.referenceNumber} onChange={(e) => setForm({ ...form, referenceNumber: e.target.value })} />
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
                Execute Refund
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <ApiResultPanel
        requestHeaders={buildHeaderPreview(config, true)}
        requestPreview={{ transactionId, paymentType, ...form }}
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

export default function RefundPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <RefundForm />
    </Suspense>
  );
}
