'use client';

import { useState } from 'react';

import { creditAction } from '@/actions/payrix';
import { ApiResultPanel } from '@/components/payrix/api-result-panel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePayrixConfig } from '@/hooks/use-payrix-config';
import type { ServerActionResult } from '@/lib/payrix/types';
import { addExistingHistoryEntry } from '@/lib/storage';

export default function CreditPage() {
  const { config } = usePayrixConfig();
  const [form, setForm] = useState({
    laneId: '',
    transactionAmount: '',
    referenceNumber: '',
    ticketNumber: '',
  });
  const [result, setResult] = useState<ServerActionResult<unknown> | null>(null);
  const [saving, setSaving] = useState(false);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Credit (Standalone Refund)</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4 md:grid-cols-2"
            onSubmit={async (event) => {
              event.preventDefault();
              setSaving(false);
              const response = await creditAction({ config, request: form });
              setResult(response as ServerActionResult<unknown>);
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="laneId">Lane ID</Label>
              <Input
                id="laneId"
                value={form.laneId}
                onChange={(event) => setForm({ ...form, laneId: event.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="transactionAmount">Transaction Amount</Label>
              <Input
                id="transactionAmount"
                value={form.transactionAmount}
                onChange={(event) => setForm({ ...form, transactionAmount: event.target.value })}
                placeholder="10.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="referenceNumber">Reference Number (optional)</Label>
              <Input
                id="referenceNumber"
                value={form.referenceNumber}
                onChange={(event) => setForm({ ...form, referenceNumber: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ticketNumber">Ticket Number (optional)</Label>
              <Input
                id="ticketNumber"
                value={form.ticketNumber}
                onChange={(event) => setForm({ ...form, ticketNumber: event.target.value })}
              />
            </div>
            <Button className="md:col-span-2" type="submit">
              Execute Credit
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
      />
    </div>
  );
}
