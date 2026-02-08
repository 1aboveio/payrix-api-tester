'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import { saleAction } from '@/actions/payrix';
import { ApiResultPanel } from '@/components/payrix/api-result-panel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePayrixConfig } from '@/hooks/use-payrix-config';
import type { SaleRequest, ServerActionResult } from '@/lib/payrix/types';
import { addExistingHistoryEntry } from '@/lib/storage';

export default function SalePage() {
  const { config } = usePayrixConfig();
  const [form, setForm] = useState<SaleRequest>({
    laneId: '',
    transactionAmount: '',
    referenceNumber: '',
    ticketNumber: '',
  });
  const [result, setResult] = useState<ServerActionResult<unknown> | null>(null);
  const [saving, setSaving] = useState(false);

  const transactionId = useMemo(() => {
    if (!result?.apiResponse.data || typeof result.apiResponse.data !== 'object') {
      return '';
    }

    const value = (result.apiResponse.data as Record<string, unknown>).transactionId;
    return typeof value === 'string' ? value : '';
  }, [result]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Sale</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4 md:grid-cols-2"
            onSubmit={async (event) => {
              event.preventDefault();
              setSaving(false);
              const response = await saleAction({ config, request: form });
              setResult(response as ServerActionResult<unknown>);
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="laneId">Lane ID</Label>
              <Input id="laneId" value={form.laneId} onChange={(event) => setForm({ ...form, laneId: event.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Transaction Amount</Label>
              <Input
                id="amount"
                value={form.transactionAmount}
                onChange={(event) => setForm({ ...form, transactionAmount: event.target.value })}
                placeholder="10.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reference">Reference Number</Label>
              <Input
                id="reference"
                value={form.referenceNumber}
                onChange={(event) => setForm({ ...form, referenceNumber: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ticket">Ticket Number</Label>
              <Input id="ticket" value={form.ticketNumber} onChange={(event) => setForm({ ...form, ticketNumber: event.target.value })} />
            </div>
            <Button className="md:col-span-2" type="submit">
              Execute
            </Button>
          </form>
        </CardContent>
      </Card>

      <ApiResultPanel
        requestPreview={form}
        result={result}
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
