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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { activePlatform } from '@/lib/config';
import { usePayrixConfig } from '@/hooks/use-payrix-config';
import { listTransactionsAction } from '@/actions/platform';
import type { Transaction, PlatformSearchFilter } from '@/lib/platform/types';
import { toast } from '@/lib/toast';
import { generateRequestId } from '@/lib/payrix/identifiers';
import { PaginationControls } from '@/components/platform/pagination-controls';
import { PlatformApiResultPanel } from '@/components/platform/api-result-panel';
import { TransactionTable } from '@/components/platform/transaction-table';
import type { ServerActionResult } from '@/lib/payrix/types';

function toYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Trim any time component from a date-like string, returning just YYYY-MM-DD. */
function trimToDate(value: string): string {
  const s = value.trim();
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : s;
}

export default function TransactionsPage() {
  const { config } = usePayrixConfig();
  const merchantId = activePlatform(config).platformMerchant ?? '';
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(10);

  // Filter state — date inputs (YYYY-MM-DD). Payrix treats them as ET.
  const [searchInput, setSearchInput] = useState('');
  const [activeSearchQuery, setActiveSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [result, setResult] = useState<ServerActionResult<unknown> | null>(null);
  const [lastFilters, setLastFilters] = useState<PlatformSearchFilter[] | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  // Default the date range to the last 7 days on mount. Set in an effect so
  // SSR-rendered HTML matches the initial client state (avoids hydration
  // mismatch on the input values).
  useEffect(() => {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    setDateFrom((prev) => prev || toYMD(sevenDaysAgo));
    setDateTo((prev) => prev || toYMD(today));
  }, []);

  // Build the full filter set from current UI state. Called on every fetch.
  // Payrix native operators per the OpenAPI spec: equals, greater, lesser.
  // Always scope to the merchant configured in Settings so a platform key
  // spanning multiple merchants doesn't fan out across all of them.
  const buildFilters = (search: string): PlatformSearchFilter[] => {
    const filters: PlatformSearchFilter[] = [];
    if (merchantId) {
      filters.push({ field: 'merchant', operator: 'equals', value: merchantId });
    }
    if (search) {
      filters.push({ field: 'id', operator: 'equals', value: search });
    }
    if (dateFrom) {
      filters.push({ field: 'created', operator: 'greater', value: trimToDate(dateFrom) });
    }
    if (dateTo) {
      filters.push({ field: 'created', operator: 'lesser', value: trimToDate(dateTo) });
    }
    if (statusFilter !== 'all') {
      filters.push({ field: 'status', operator: 'equals', value: statusFilter });
    }
    return filters;
  };

  const fetchTransactions = async (
    offset: number = 0,
    pageLimit: number = limit,
    filters?: PlatformSearchFilter[],
  ) => {
    setLoading(true);
    setError(null);
    try {
      const requestId = generateRequestId();
      const context = { config, requestId };

      const searchFilters = filters ?? buildFilters(activeSearchQuery);

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

  // No auto-fetch on mount — require an explicit "Search" click so the page
  // doesn't fan out a broad query (especially expensive on live keys that
  // span many merchants).

  const handleSearch = () => {
    setHasSearched(true);
    setActiveSearchQuery(searchInput);
    // Build filters from the just-captured search input so we don't wait on
    // the state update before firing the request.
    const filters: PlatformSearchFilter[] = [];
    if (merchantId) filters.push({ field: 'merchant', operator: 'equals', value: merchantId });
    if (searchInput) filters.push({ field: 'id', operator: 'equals', value: searchInput });
    if (dateFrom) filters.push({ field: 'created', operator: 'greater', value: trimToDate(dateFrom) });
    if (dateTo) filters.push({ field: 'created', operator: 'lesser', value: trimToDate(dateTo) });
    if (statusFilter !== 'all') filters.push({ field: 'status', operator: 'equals', value: statusFilter });
    fetchTransactions(0, limit, filters);
  };

  const handleReset = () => {
    setSearchInput('');
    setActiveSearchQuery('');
    setDateFrom('');
    setDateTo('');
    setStatusFilter('all');
    // Keep results cleared until the user runs another search rather than
    // refetching everything for the merchant — consistent with the no-
    // auto-fetch behavior on initial mount.
    setTransactions([]);
    setLastFilters(undefined);
    setResult(null);
    setHasSearched(false);
    setTotalPages(1);
    setCurrentPage(1);
    setCurrentOffset(0);
  };

  const handlePageChange = (newPage: number) => {
    const offset = (newPage - 1) * limit;
    fetchTransactions(offset, limit, lastFilters);
  };

  const handleLimitChange = (newLimit: number) => {
    fetchTransactions(0, newLimit, lastFilters);
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
        <CardContent className="pt-6 space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search-id" className="sr-only">Transaction ID</Label>
              <Input
                id="search-id"
                placeholder="Search by transaction ID..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div>
              <Label htmlFor="date-from" className="text-xs">From</Label>
              <Input
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="date-to" className="text-xs">To</Label>
              <Input
                id="date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="status-filter" className="text-xs">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status-filter">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="0">Pending</SelectItem>
                  <SelectItem value="1">Approved</SelectItem>
                  <SelectItem value="2">Failed</SelectItem>
                  <SelectItem value="3">Captured</SelectItem>
                  <SelectItem value="4">Settled</SelectItem>
                  <SelectItem value="5">Returned</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSearch} className="flex-1">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
              <Button variant="outline" onClick={handleReset}>
                Reset
              </Button>
            </div>
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
              <p>
                {error
                  ? 'Failed to load transactions. Please try again.'
                  : hasSearched
                    ? 'No transactions found'
                    : 'Apply filters and click Search to load transactions.'}
              </p>
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
