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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePayrixConfig } from '@/hooks/use-payrix-config';
import { buildCurlCommand } from '@/lib/payrix/curl';
import { saleTemplates } from '@/lib/payrix/templates';
import type { SaleRequest, ServerActionResult } from '@/lib/payrix/types';
import { generateReferenceNumber, generateTicketNumber } from '@/lib/payrix/identifiers';
import { buildHeaderPreview } from '@/lib/payrix/headers';
import { addExistingHistoryEntry } from '@/lib/storage';

const DEFAULTS: SaleRequest = {
  laneId: '',
  transactionAmount: '',
  referenceNumber: '',
  ticketNumber: '',
};

export default function SalePage() {
  const { config, requestId: nextRequestId } = usePayrixConfig();
  const [form, setForm] = useState<SaleRequest>({ ...DEFAULTS });
  const [templateId, setTemplateId] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [requestId, setRequestId] = useState<string | null>(null);
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
              const nextRequestId = crypto.randomUUID();
              setRequestId(nextRequestId);
              const payload = { ...form };
              if ('referenceNumber' in payload && !payload.referenceNumber) {
                payload.referenceNumber = generateReferenceNumber();
              }
              if ('ticketNumber' in payload && !payload.ticketNumber) {
                payload.ticketNumber = generateTicketNumber();
              }
              setForm(payload);
              const response = await saleAction({ config, requestId: nextRequestId, request: payload, templateName: templateName || undefined });
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
            <div className="space-y-2">
              <Label htmlFor="cashBackAmount">Cash Back Amount (optional)</Label>
              <Input
                id="cashBackAmount"
                value={(form as { cashBackAmount?: string }).cashBackAmount ?? ''}
                onChange={(e) => setForm({ ...form, cashBackAmount: e.target.value })}
                placeholder="1.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="allowPartialApprovals">Allow Partial Approvals</Label>
              <Select
                value={
                  (form as { configuration?: { allowPartialApprovals?: boolean } }).configuration?.allowPartialApprovals === undefined
                    ? 'unset'
                    : (form as { configuration?: { allowPartialApprovals?: boolean } }).configuration?.allowPartialApprovals
                    ? 'true'
                    : 'false'
                }
                onValueChange={(value) => {
                  const next = value === 'unset' ? undefined : value === 'true';
                  const currentConfig = (form as { configuration?: Record<string, unknown> }).configuration ?? {};
                  const updatedConfig = { ...currentConfig, allowPartialApprovals: next };
                  if (next === undefined) {
                    delete (updatedConfig as Record<string, unknown>).allowPartialApprovals;
                  }
                  setForm({
                    ...form,
                    configuration: Object.keys(updatedConfig).length ? updatedConfig : undefined,
                  });
                }}
              >
                <SelectTrigger id="allowPartialApprovals">
                  <SelectValue placeholder="Unset" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unset">Unset</SelectItem>
                  <SelectItem value="true">True</SelectItem>
                  <SelectItem value="false">False</SelectItem>
                </SelectContent>
              </Select>
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
            <div className="space-y-2">
              <Label htmlFor="allowDebit">Allow Debit</Label>
              <Select
                value={
                  (form as { configuration?: { allowDebit?: boolean } }).configuration?.allowDebit === undefined
                    ? 'unset'
                    : (form as { configuration?: { allowDebit?: boolean } }).configuration?.allowDebit
                    ? 'true'
                    : 'false'
                }
                onValueChange={(value) => {
                  const next = value === 'unset' ? undefined : value === 'true';
                  const currentConfig = (form as { configuration?: Record<string, unknown> }).configuration ?? {};
                  const updatedConfig = { ...currentConfig, allowDebit: next };
                  if (next === undefined) {
                    delete (updatedConfig as Record<string, unknown>).allowDebit;
                  }
                  setForm({
                    ...form,
                    configuration: Object.keys(updatedConfig).length ? updatedConfig : undefined,
                  });
                }}
              >
                <SelectTrigger id="allowDebit">
                  <SelectValue placeholder="Unset" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unset">Unset</SelectItem>
                  <SelectItem value="true">True</SelectItem>
                  <SelectItem value="false">False</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="checkForDuplicateTransactions">Check Duplicate Transactions</Label>
              <Select
                value={
                  (form as { checkForDuplicateTransactions?: boolean }).checkForDuplicateTransactions === undefined
                    ? 'unset'
                    : (form as { checkForDuplicateTransactions?: boolean }).checkForDuplicateTransactions
                    ? 'true'
                    : 'false'
                }
                onValueChange={(value) =>
                  setForm({
                    ...form,
                    checkForDuplicateTransactions: value === 'unset' ? undefined : value === 'true',
                  })
                }
              >
                <SelectTrigger id="checkForDuplicateTransactions">
                  <SelectValue placeholder="Unset" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unset">Unset</SelectItem>
                  <SelectItem value="true">True</SelectItem>
                  <SelectItem value="false">False</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="duplicateCheckDisableFlag">Duplicate Check Disable Flag</Label>
              <Select
                value={
                  (form as { duplicateCheckDisableFlag?: boolean }).duplicateCheckDisableFlag === undefined
                    ? 'unset'
                    : (form as { duplicateCheckDisableFlag?: boolean }).duplicateCheckDisableFlag
                    ? 'true'
                    : 'false'
                }
                onValueChange={(value) =>
                  setForm({
                    ...form,
                    duplicateCheckDisableFlag: value === 'unset' ? undefined : value === 'true',
                  })
                }
              >
                <SelectTrigger id="duplicateCheckDisableFlag">
                  <SelectValue placeholder="Unset" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unset">Unset</SelectItem>
                  <SelectItem value="true">True</SelectItem>
                  <SelectItem value="false">False</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="salesTaxAmount">Sales Tax Amount (Level 2)</Label>
              <Input
                id="salesTaxAmount"
                value={(form as { salesTaxAmount?: string }).salesTaxAmount ?? ''}
                onChange={(e) => setForm({ ...form, salesTaxAmount: e.target.value })}
                placeholder="0.25"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="commercialCardCustomerCode">Commercial Card Customer Code</Label>
              <Input
                id="commercialCardCustomerCode"
                value={(form as { commercialCardCustomerCode?: string }).commercialCardCustomerCode ?? ''}
                onChange={(e) => setForm({ ...form, commercialCardCustomerCode: e.target.value })}
                placeholder="PO123456"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shippingZipcode">Shipping Zipcode</Label>
              <Input
                id="shippingZipcode"
                value={(form as { shippingZipcode?: string }).shippingZipcode ?? ''}
                onChange={(e) => setForm({ ...form, shippingZipcode: e.target.value })}
                placeholder="90210"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="billingName">Billing Name</Label>
              <Input
                id="billingName"
                value={(form as { billingName?: string }).billingName ?? ''}
                onChange={(e) => setForm({ ...form, billingName: e.target.value })}
                placeholder="Test Business Inc"
              />
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
        requestHeaders={buildHeaderPreview(config, true, requestId ?? undefined)}
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
