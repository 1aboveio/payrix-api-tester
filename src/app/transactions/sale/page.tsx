'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { PrinterCheck } from 'lucide-react';

import { saleAction, printSaleReceiptAction, type PrintSaleReceiptResult } from '@/actions/payrix';
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
import { saleTemplates } from '@/lib/payrix/templates';
import { toast } from '@/lib/toast';
import type { HttpMethod, SaleRequest, SaleResponse, ServerActionResult } from '@/lib/payrix/types';
import { generateReferenceNumber, generateTicketNumber, generateRequestId } from '@/lib/payrix/identifiers';
import { buildHeaderPreview } from '@/lib/payrix/headers';
import { addExistingHistoryEntry } from '@/lib/storage';

const DEFAULTS: SaleRequest = {
  laneId: '',
  transactionAmount: '',
  referenceNumber: '',
  ticketNumber: '',
};

export default function SalePage() {
  const { config } = usePayrixConfig();
  const [form, setForm] = useState<SaleRequest>({
    ...DEFAULTS,
    laneId: '',
    referenceNumber: '',
    ticketNumber: '',
  });
  const [templateId, setTemplateId] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [httpMethod, setHttpMethod] = useState('POST');
  const [requestId, setRequestId] = useState<string | null>(null);

  useEffect(() => {
    setRequestId(generateRequestId());
  }, []);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      laneId: prev.laneId || config.defaultLaneId || '',
      referenceNumber: prev.referenceNumber || generateReferenceNumber(),
      ticketNumber: prev.ticketNumber || generateTicketNumber(),
    }));
  }, [config.defaultLaneId]);
  const [result, setResult] = useState<ServerActionResult<unknown> | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Tip Prompt state
  const [tipMode, setTipMode] = useState<'none' | 'preset' | 'pinpad'>('none');
  const [tipAmount, setTipAmount] = useState('');
  const [tipOptions, setTipOptions] = useState('15,18,20,none');

  // Compute effective request including tip settings for preview/curl consistency
  const effectiveRequest = useMemo(() => {
    const payload = { ...form };

    // Add tip parameters based on mode
    if (tipMode === 'preset' && tipAmount) {
      payload.tipAmount = tipAmount;
    } else if (tipMode === 'pinpad' && tipOptions) {
      const options = tipOptions.split(',').map((s) => s.trim()).filter(Boolean);
      if (options.length > 0) {
        payload.configuration = {
          ...(payload.configuration || {}),
          enableTipPrompt: true,
          tipPromptOptions: options,
        };
      }
    }

    return payload;
  }, [form, tipMode, tipAmount, tipOptions]);

  const transactionId = useMemo(() => {
    if (!result?.apiResponse.data || typeof result.apiResponse.data !== 'object') {
      return '';
    }

    const value = (result.apiResponse.data as Record<string, unknown>).transactionId;
    return typeof value === 'string' ? value : '';
  }, [result]);

  const saleResponseForPrint = useMemo(() => {
    if (!result?.apiResponse.data || typeof result.apiResponse.data !== 'object') {
      return null;
    }

    return {
      ...(result.apiResponse.data as Record<string, unknown>),
      merchantName: config.expressAccountId,
    } as SaleResponse;
  }, [result, config.expressAccountId]);

  const printOutcome = useMemo(() => {
    if (!result?.apiResponse.data || typeof result.apiResponse.data !== 'object') {
      return null;
    }

    const saleData = result.apiResponse.data as Record<string, unknown>;
    return (saleData.printOutcome as PrintSaleReceiptResult) ?? null;
  }, [result]);

  const [isAutoPrintNotified, setIsAutoPrintNotified] = useState<string | null>(null);
  const [reprinting, setReprinting] = useState(false);

  useEffect(() => {
    if (!printOutcome || !transactionId || isAutoPrintNotified === transactionId) {
      return;
    }

    if (printOutcome.printed) {
      toast.success('Receipt printed automatically');
    } else if (printOutcome.queued) {
      toast.info('Receipt print started in background.');
    } else if (!printOutcome.skipped && printOutcome.attempted) {
      toast.error(`Receipt auto-print failed: ${printOutcome.error || printOutcome.reason}`);
    }

    setIsAutoPrintNotified(transactionId);
  }, [printOutcome, transactionId, isAutoPrintNotified]);

  const handleReprint = async () => {
    if (!saleResponseForPrint) {
      return;
    }

    setReprinting(true);
    try {
      const outcome = await printSaleReceiptAction({
        saleResponse: saleResponseForPrint,
        merchantName: config.expressAccountId,
      });

      if (outcome.printed) {
        toast.success('Receipt sent to shared printer.');
      } else if (outcome.skipped) {
        toast.info(`Print skipped: ${outcome.reason}`);
      } else {
        toast.error(`Print failed: ${outcome.error || outcome.reason}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Print request failed';
      toast.error(`Print failed: ${message}`);
    } finally {
      setReprinting(false);
    }
  };

  const curlCommand = useMemo(
    () =>
      buildCurlCommand({
        config,
        endpoint: '/api/v1/sale',
        method: httpMethod,
        body: effectiveRequest,
        includeAuthorization: true,
      }),
    [config, effectiveRequest, httpMethod]
  );

  return (
    <div className="space-y-4">
      <EndpointInfo method="POST" endpoint="/api/v1/sale" docsUrl="https://docs.payrix.com/reference" />
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
              setForm({ ...DEFAULTS, laneId: config.defaultLaneId || '', referenceNumber: generateReferenceNumber(), ticketNumber: generateTicketNumber(), ...tpl.fields } as SaleRequest);
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
              const payload = { ...effectiveRequest };

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
                const response = await saleAction({
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

            {/* Tip Prompt Section */}
            <div className="md:col-span-2 border-t pt-4 mt-2">
              <h3 className="text-sm font-medium mb-3">Tip Configuration</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="tipMode">Tip Mode</Label>
                  <Select
                    value={tipMode}
                    onValueChange={(value) => {
                      setTipMode(value as 'none' | 'preset' | 'pinpad');
                      // Clear tip values when changing mode
                      if (value === 'none') {
                        setTipAmount('');
                        setTipOptions('15,18,20,none');
                      }
                    }}
                  >
                    <SelectTrigger id="tipMode">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Tip</SelectItem>
                      <SelectItem value="preset">Pre-set Tip</SelectItem>
                      <SelectItem value="pinpad">PIN Pad Tip Prompt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {tipMode === 'preset' && (
                  <div className="space-y-2">
                    <Label htmlFor="tipAmount">Tip Amount</Label>
                    <Input
                      id="tipAmount"
                      value={tipAmount}
                      onChange={(e) => setTipAmount(e.target.value)}
                      placeholder="10.00"
                    />
                  </div>
                )}

                {tipMode === 'pinpad' && (
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="tipOptions">
                      Tip Options (comma-separated)
                      <span className="text-xs text-muted-foreground ml-2">
                        e.g., 15,18,20,none or 5.00,10.00,other
                      </span>
                    </Label>
                    <Input
                      id="tipOptions"
                      value={tipOptions}
                      onChange={(e) => setTipOptions(e.target.value)}
                      placeholder="15,18,20,none"
                    />
                    <p className="text-xs text-muted-foreground">
                      Percentages: 15,18,20,none (no % symbol) | Fixed: 5.00,10.00,other
                    </p>
                  </div>
                )}
              </div>
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
                  setTipMode('none');
                  setTipAmount('');
                  setTipOptions('15,18,20,none');
                }}
              >
                Reset
              </Button>
              <Button type="submit" disabled={submitting}>
                Execute Sale
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <ApiResultPanel
        requestHeaders={buildHeaderPreview(config, true, requestId ?? undefined)}
        requestPreview={effectiveRequest}
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
        quickActions={
          transactionId ? (
            <>
              <Button asChild variant="outline">
                <Link href={`/reversals/void?transactionId=${encodeURIComponent(transactionId)}`}>Void</Link>
              </Button>
              <Button asChild variant="outline">
                <Link
                  href={`/reversals/return?transactionId=${encodeURIComponent(transactionId)}&paymentType=credit`}
                >
                  Return
                </Link>
              </Button>
              <Button variant="secondary" onClick={handleReprint} disabled={reprinting}>
                  <PrinterCheck className="mr-2 h-4 w-4" />
                  {reprinting ? 'Printing...' : 'Print Receipt'}
                </Button>
            </>
          ) : null
        }
      />
    </div>
  );
}
