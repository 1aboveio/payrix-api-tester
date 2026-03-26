'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { LoaderCircle } from 'lucide-react';

import { EndpointInfo } from '@/components/payrix/endpoint-info';
import { TransactionFilters, type TransactionFilterValues } from '@/components/payrix/transaction-filters';
import { TransactionTable } from '@/components/payrix/transaction-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  const [currentOffset, setCurrentOffset] = useState(0);
  const [currentLimit, setCurrentLimit] = useState(100);
  const [lastFilters, setLastFilters] = useState<TransactionFilterValues | null>(null);

  const doQuery = async (filters: TransactionFilterValues, offset: number) => {
    setLoading(true);
    try {
      const data = await queryTransactions(config, { ...filters, offset, maxPageSize: filters.maxPageSize ?? 100 });
      setResult(data);
      if (!data.error) {
        toast.success('Transactions loaded');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (filters: TransactionFilterValues) => {
    setLastFilters(filters);
    setCurrentOffset(0);
    setCurrentLimit(filters.maxPageSize ?? 100);
    await doQuery(filters, 0);
  };

  const handleNext = async () => {
    if (!result?.hasMore || !lastFilters) return;
    const nextOffset = currentOffset + currentLimit;
    await doQuery(lastFilters, nextOffset);
    setCurrentOffset(nextOffset);
  };

  const handlePrev = async () => {
    if (currentOffset === 0 || !lastFilters) return;
    const prevOffset = Math.max(0, currentOffset - currentLimit);
    await doQuery(lastFilters, prevOffset);
    setCurrentOffset(prevOffset);
  };

  const handleRowClick = (tx: Transaction) => {
    const transactionId = tx.transactionId ?? (tx as Record<string, unknown>).transactionId;
    if (transactionId) {
      router.push(`/transactions/${String(transactionId)}`);
    }
  };

  const startItem = result && result.data.length > 0 ? currentOffset + 1 : 0;
  const endItem = result ? currentOffset + result.data.length : 0;

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
            totalCount={result.hasMore ? undefined : endItem}
          />

          {/* Pagination controls */}
          <Card>
            <CardContent className="flex items-center justify-between py-3">
              <span className="text-sm text-muted-foreground">
                {result.data.length > 0
                  ? `Showing ${startItem}–${endItem}${result.hasMore ? '+' : ''}`
                  : 'No results'}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrev}
                  disabled={currentOffset === 0 || loading}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNext}
                  disabled={!result.hasMore || loading}
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>

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
