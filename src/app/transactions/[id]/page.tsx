'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

import { TransactionDetail } from '@/components/payrix/transaction-detail';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePayrixConfig } from '@/hooks/use-payrix-config';
import { getTransactionById, type TransactionQueryResult } from '@/lib/payrix/dal/transactions';

export default function TransactionDetailPage() {
  const params = useParams<{ id: string }>();
  const { config } = usePayrixConfig();
  const [transactionId, setTransactionId] = useState(params.id ?? '');
  const [result, setResult] = useState<TransactionQueryResult | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchTransaction = useCallback(
    async (id: string) => {
      if (!id.trim()) return;
      setLoading(true);
      try {
        const data = await getTransactionById(config, id.trim());
        setResult(data);
      } finally {
        setLoading(false);
      }
    },
    [config]
  );

  useEffect(() => {
    if (params.id) {
      fetchTransaction(params.id);
    }
  }, [params.id, fetchTransaction]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTransaction(transactionId);
  };

  const transaction = result?.data?.[0];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Transaction Detail</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex items-end gap-4" onSubmit={handleSubmit}>
            <div className="flex-1 space-y-2">
              <Label htmlFor="td-transactionId">Transaction ID</Label>
              <Input
                id="td-transactionId"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? 'Loading...' : 'Fetch'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {result?.error && (
        <Card>
          <CardContent className="py-4">
            <div className="rounded-md border border-destructive/60 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {result.error}
            </div>
          </CardContent>
        </Card>
      )}

      {result && !result.error && !transaction && (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No transaction found for this ID.
          </CardContent>
        </Card>
      )}

      {transaction && <TransactionDetail transaction={transaction} raw={result?.raw} />}
    </div>
  );
}
