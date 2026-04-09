'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoaderCircle, ChevronLeft, ChevronRight } from 'lucide-react';

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
  const [currentLimit, setCurrentLimit] = useState(10);
  const [lastFilters, setLastFilters] = useState<TransactionFilterValues | null>(null);

  const handleSearch = async (filters: TransactionFilterValues) => {
    setLoading(true);
    setCurrentOffset(0);
    setCurrentLimit(filters.limit);
    setLastFilters(filters);
    try {
      const data = await queryTransactions(config, { ...filters, offset: 0 });
      setResult(data);
      if (!data.error) {
        toast.success(`Loaded ${data.data.length} transactions`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = async (newOffset: number) => {
    if (!lastFilters) return;
    setLoading(true);
    setCurrentOffset(newOffset);
    try {
      const data = await queryTransactions(config, { ...lastFilters, offset: newOffset });
      setResult(data);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevPage = () => {
    const newOffset = Math.max(0, currentOffset - currentLimit);
    handlePageChange(newOffset);
  };

  const handleNextPage = () => {
    if (result?.pagination?.hasMore) {
      handlePageChange(currentOffset + currentLimit);
    }
  };

  const handleRowClick = (tx: Transaction) => {
    const transactionId = tx.transactionId ?? (tx as Record<string, unknown>).TransactionId;
    if (transactionId) {
      router.push(`/transactions/${String(transactionId)}`);
    }
  };

  const currentPage = Math.floor(currentOffset / currentLimit) + 1;
  const totalPages = result?.pagination?.total
    ? Math.ceil(result.pagination.total / currentLimit)
    : undefined;

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

          {/* Pagination Controls */}
          <Card>
            <CardContent className="flex items-center justify-between py-4">
              <div className="text-sm text-muted-foreground">
                {result.pagination?.total !== undefined ? (
                  <>
                    Showing {currentOffset + 1}-{Math.min(currentOffset + result.data.length, result.pagination.total)} of{' '}
                    {result.pagination.total} transactions
                  </>
                ) : (
                  <>
                    Showing {currentOffset + 1}-{currentOffset + result.data.length} transactions
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={currentOffset === 0 || loading}
                >
                  <ChevronLeft className="size-4 mr-1" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground px-2">
                  Page {currentPage}
                  {totalPages !== undefined && ` of ${totalPages}`}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={!result.pagination?.hasMore || loading}
                >
                  Next
                  <ChevronRight className="size-4 ml-1" />
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
