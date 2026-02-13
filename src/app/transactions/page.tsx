'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoaderCircle } from 'lucide-react';

import { TransactionFilters, type TransactionFilterValues } from '@/components/payrix/transaction-filters';
import { TransactionTable } from '@/components/payrix/transaction-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { usePayrixConfig } from '@/hooks/use-payrix-config';
import { queryTransactions, type TransactionQueryResult } from '@/lib/payrix/dal/transactions';
import { toast } from '@/lib/toast';
import type { Transaction } from '@/lib/payrix/types';

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
  const [filterTerm, setFilterTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const handleSearch = async (filters: TransactionFilterValues) => {
    setLoading(true);
    setPage(1);
    setPageSize(Math.min(100, filters.maxPageSize));
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

  const filteredTransactions = (result?.data ?? []).filter((tx) => {
    if (!filterTerm.trim()) return true;
    const term = filterTerm.toLowerCase();
    return JSON.stringify(tx).toLowerCase().includes(term);
  });

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const pagedTransactions = filteredTransactions.slice(start, start + pageSize);

  const handleRowClick = (tx: Transaction) => {
    const transactionId = tx.transactionId ?? (tx as Record<string, unknown>).TransactionId;
    if (transactionId) {
      router.push(`/transactions/${String(transactionId)}`);
    }
  };

  return (
    <div className="space-y-4">
      <TransactionFilters onSubmit={handleSearch} loading={loading} />

      {result && !result.error && (
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-wrap items-center gap-2">
              <Input
                className="max-w-sm"
                placeholder="Filter loaded transactions..."
                value={filterTerm}
                onChange={(event) => {
                  setFilterTerm(event.target.value);
                  setPage(1);
                }}
              />
              <Input
                className="w-24"
                type="number"
                min={1}
                max={500}
                value={pageSize}
                onChange={(event) => {
                  const next = Number(event.target.value) || 1;
                  setPageSize(Math.max(1, next));
                  setPage(1);
                }}
              />
              <span className="text-sm text-muted-foreground">Page {currentPage} / {totalPages}</span>
            </div>
          </CardContent>
        </Card>
      )}

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
            transactions={pagedTransactions}
            onRowClick={handleRowClick}
            defaultSort={{ key: 'timestamp', desc: true }}
            totalCount={filteredTransactions.length}
          />

          <Card>
            <CardContent className="py-4">
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage <= 1}
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage >= totalPages}
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
