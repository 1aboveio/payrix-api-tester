'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  CreditCard,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { usePayrixConfig } from '@/hooks/use-payrix-config';
import { listTransactionsAction } from '@/actions/platform';
import type { Transaction, PlatformSearchFilter } from '@/lib/platform/types';
import { toast } from '@/lib/toast';
import { generateRequestId } from '@/lib/payrix/identifiers';
import { PaginationControls } from '@/components/platform/pagination-controls';
import { PlatformApiResultPanel } from '@/components/platform/api-result-panel';
import { TransactionTable } from '@/components/platform/transaction-table';
import type { ServerActionResult } from '@/lib/payrix/types';

export default function TransactionsPage() {
  const { config } = usePayrixConfig();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(10);

  // Filter state
  const [searchInput, setSearchInput] = useState('');
  const [activeSearchQuery, setActiveSearchQuery] = useState('');
  const [result, setResult] = useState<ServerActionResult<unknown> | null>(null);
  const [lastFilters, setLastFilters] = useState<PlatformSearchFilter[] | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = async (
    offset: number = 0,
    pageLimit: number = limit,
    filters?: PlatformSearchFilter[],
    search?: string
  ) => {
    setLoading(true);
    setError(null);
    try {
      const requestId = generateRequestId();
      const context = { config, requestId };
      
      const searchFilters = filters ? [...filters] : [];
      
      // Add search query if provided
      if (search) {
        searchFilters.push({ field: 'id', operator: 'eq', value: search });
      }
      
      // Use offset-based pagination
      const response = await listTransactionsAction(context, searchFilters, { limit: pageLimit, offset });
      
      // Check for API errors
      if (response.apiResponse.error) {
        const errorMsg =
          typeof response.apiResponse.error === 'string'
            ? response.apiResponse.error
            : typeof response.apiResponse.error === 'object' && response.apiResponse.error !== null
              ? String((response.apiResponse.error as Record<string, unknown>).message || 'API error')
              : 'API error';
        console.error('Transaction API error:', errorMsg);
        setError(errorMsg);
        toast.error(`Failed to fetch transactions: ${errorMsg}`);
        setTransactions([]);
        setTotalPages(1);
        setResult(response);
        setLoading(false);
        return;
      }
      
      if (response.apiResponse.data) {
        const data = response.apiResponse.data as Transaction[];
        setTransactions(data);
        const pageDetails =
          (response.historyEntry?.response as { response?: { details?: { page?: { total?: number } } } } | null | undefined)
            ?.response?.details?.page;
        const total = pageDetails?.total ?? data.length;
        setTotalPages(Math.max(1, Math.ceil(total / pageLimit)));
        setCurrentOffset(offset);
      }
      
      setResult(response);
      setLastFilters(searchFilters);
      setCurrentPage(Math.floor(offset / pageLimit) + 1);
      setLimit(pageLimit);
      setCurrentOffset(offset);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch transactions';
      console.error('Error fetching transactions:', err);
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions(0, limit, [], activeSearchQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = () => {
    setActiveSearchQuery(searchInput);
    fetchTransactions(0, limit, [], searchInput);
  };

  const handlePageChange = (newPage: number) => {
    const offset = (newPage - 1) * limit;
    fetchTransactions(offset, limit, lastFilters, activeSearchQuery);
  };

  const handleLimitChange = (newLimit: number) => {
    fetchTransactions(0, newLimit, lastFilters, activeSearchQuery);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CreditCard className="h-8 w-8" />
          <div>
            <h1 className="text-2xl font-bold">Transactions</h1>
            <p className="text-muted-foreground">
              View and search platform transactions
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href="/platform/transactions/create">
            Create Transaction
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by transaction ID..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          <div className="font-semibold">Error loading transactions</div>
          <div className="text-sm">{error}</div>
        </div>
      )}

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>
            {loading ? 'Loading...' : `${transactions.length} transactions found`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 && !loading ? (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{error ? 'Failed to load transactions. Please try again.' : 'No transactions found'}</p>
            </div>
          ) : (
            <>
              <TransactionTable
                transactions={transactions}
                linkToDetail
                columns={['id', 'date', 'type', 'amount', 'status', 'cofType', 'origin', 'card', 'auth', 'descriptor']}
              />

              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                limit={limit}
                onPageChange={handlePageChange}
                onLimitChange={handleLimitChange}
              />
            </>
          )}
        </CardContent>
      </Card>

      {result && (
        <PlatformApiResultPanel
          config={config}
          endpoint="/txns"
          method="GET"
          requestPreview={{ filters: lastFilters, pagination: { limit, offset: currentOffset } }}
          searchFilters={lastFilters}
          pagination={{ limit, offset: currentOffset }}
          result={result}
          loading={loading}
        />
      )}
    </div>
  );
}
