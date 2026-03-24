'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoaderCircle } from 'lucide-react';

import { EndpointInfo } from '@/components/payrix/endpoint-info';
import { TransactionFilters, type TransactionFilterValues } from '@/components/payrix/transaction-filters';
import { TransactionTable } from '@/components/payrix/transaction-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePayrixConfig } from '@/hooks/use-payrix-config';
import { queryTransactions, type TransactionQueryResult } from '@/lib/payrix/dal/transactions';
import { toast } from '@/lib/toast';
import type { Transaction } from '@/lib/payrix/types';
import { activeTripos } from '@/lib/config';

function toJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export default function TransactionsPage() {
  const { config } = usePayrixConfig();
  const router = useRouter();
  const [result, setResult] = useState<TransactionQueryResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (filters: TransactionFilterValues) => {
    setLoading(true);
    try {
      const data = await queryTransactions(config, filters);
      setResult(data);
      if (!data.error) {
        toast.success('Transactions loaded');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (tx: Transaction) => {
    const transactionId = tx.transactionId ?? (tx as Record<string, unknown>).TransactionId;
    if (transactionId) {
      router.push(`/transactions/${String(transactionId)}`);
    }
  };

  return (
    <div className="space-y-4">
      <EndpointInfo method="POST" endpoint="/api/v1/transactionQuery" docsUrl="https://docs.payrix.com/reference" />
      <TransactionFilters onSubmit={handleSearch} loading={loading} defaultTerminalId={activeTripos(config).defaultTerminalId || ''} />

      {loading && (
        <Card>
          <CardContent className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin" />
            Loading transactions...
          </CardContent>
        </Card>
      )}

      {result?.error && (
        <Card>
          <CardContent className="py-4">
            <div className="rounded-md border border-destructive/60 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {result.error}
            </div>
          </CardContent>
        </Card>
      )}

      {result && !result.error && (
        <>
          <TransactionTable
            transactions={result.data}
            onRowClick={handleRowClick}
            defaultSort={{ key: 'timestamp', desc: true }}
            totalCount={result.data.length}
          />

          <Card>
            <CardHeader>
              <CardTitle>Raw JSON</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="max-h-96 overflow-auto rounded-md bg-muted p-4 text-xs">
                {toJson(result.raw)}
              </pre>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
