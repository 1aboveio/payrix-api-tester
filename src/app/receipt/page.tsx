'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import { receiptAction } from '@/actions/payrix';
import { ApiResultPanel } from '@/components/payrix/api-result-panel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { usePayrixConfig } from '@/hooks/use-payrix-config';
import type { ReceiptRequest, ServerActionResult } from '@/lib/payrix/types';
import { addExistingHistoryEntry } from '@/lib/storage';

function ReceiptForm() {
  const { config } = usePayrixConfig();
  const searchParams = useSearchParams();
  const [form, setForm] = useState<ReceiptRequest>({
    transactionId: searchParams.get('transactionId') ?? '',
  });
  const [result, setResult] = useState<ServerActionResult<unknown> | null>(null);
  const [saving, setSaving] = useState(false);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Receipt Lookup</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4 md:grid-cols-2"
            onSubmit={async (event) => {
              event.preventDefault();
              setSaving(false);
              const response = await receiptAction({ config, request: form });
              setResult(response as ServerActionResult<unknown>);
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="transactionId">Transaction ID</Label>
              <Input
                id="transactionId"
                value={form.transactionId}
                onChange={(event) => setForm({ ...form, transactionId: event.target.value })}
                required
              />
            </div>
            <Button className="md:col-span-2" type="submit">
              Get Receipt
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

export default function ReceiptPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <ReceiptForm />
    </Suspense>
  );
}
