'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { 
  CreditCard,
  Search,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { usePayrixConfig } from '@/hooks/use-payrix-config';
import { listTerminalTxnsAction } from '@/actions/platform';
import type { TerminalTxn } from '@/lib/platform/types';
import { toast } from '@/lib/toast';
import { generateRequestId } from '@/lib/payrix/identifiers';
import { PlatformApiResultPanel } from '@/components/platform/api-result-panel';
import type { ServerActionResult } from '@/lib/payrix/types';
import type { PlatformSearchFilter } from '@/lib/platform/types';

export default function TerminalTransactionsPage() {
  const { config } = usePayrixConfig();
  const [transactions, setTransactions] = useState<TerminalTxn[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [limit, setLimit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  
  // Filter state
  const [searchInput, setSearchInput] = useState('');
  const [activeSearchQuery, setActiveSearchQuery] = useState('');
  const [result, setResult] = useState<ServerActionResult<unknown> | null>(null);
  const [lastFilters, setLastFilters] = useState<PlatformSearchFilter[] | undefined>(undefined);

  const fetchTransactions = async (
    offset: number = 0,
    pageLimit: number = limit,
    filters?: PlatformSearchFilter[],
    search?: string
  ) => {
    setLoading(true);
    try {
      const requestId = generateRequestId();
      const context = { config, requestId };
      
      const searchFilters = filters ? [...filters] : [];
      
      // Add search query if provided
      if (search) {
        searchFilters.push({ field: 'id', operator: 'eq', value: search });
      }
      
      const response = await listTerminalTxnsAction(context, searchFilters, { limit: pageLimit, offset });
      
      // Check for API errors
      if (response.apiResponse.error) {
        const errorMsg = typeof response.apiResponse.error === 'string' 
          ? response.apiResponse.error 
          : (response.apiResponse.error as any)?.message || 'API error';
        console.error('Terminal Transaction API error:', errorMsg);
        toast.error(`Failed to fetch terminal transactions: ${errorMsg}`);
        setTransactions([]);
        setTotalCount(0);
        setResult(response);
        setLoading(false);
        return;
      }
      
      if (response.apiResponse.data) {
        const data = response.apiResponse.data as TerminalTxn[];
        setTransactions(data);
        const total = (response.historyEntry?.response as any)?.response?.details?.page?.total || data.length;
        setTotalCount(total);
      }
      
      setResult(response);
      setLastFilters(searchFilters);
      setCurrentOffset(offset);
      setLimit(pageLimit);
    } catch (error) {
      console.error('Error fetching terminal transactions:', error);
      toast.error('Failed to fetch terminal transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions(0, limit, [], activeSearchQuery);
  }, []);

  const handleSearch = () => {
    setActiveSearchQuery(searchInput);
    fetchTransactions(0, limit, [], searchInput);
  };

  const handlePrevPage = () => {
    const newOffset = Math.max(0, currentOffset - limit);
    fetchTransactions(newOffset, limit, lastFilters, activeSearchQuery);
  };

  const handleNextPage = () => {
    if (currentOffset + transactions.length < totalCount) {
      fetchTransactions(currentOffset + limit, limit, lastFilters, activeSearchQuery);
    }
  };

  const currentPage = Math.floor(currentOffset / limit) + 1;
  const totalPages = Math.ceil(totalCount / limit);
  const hasMore = currentOffset + transactions.length < totalCount;

  const formatCurrency = (amount: number, currency?: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount / 100);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CreditCard className="h-8 w-8" />
          <div>
            <h1 className="text-2xl font-bold">Terminal Transactions</h1>
            <p className="text-muted-foreground">
              View and search terminal transactions
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by terminal transaction ID..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? (
                <>
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {loading && transactions.length === 0 && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <LoaderCircle className="mr-2 h-6 w-6 animate-spin" />
            Loading terminal transactions...
          </CardContent>
        </Card>
      )}

      {!loading && transactions.length === 0 && !result?.apiResponse.error && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No terminal transactions found
          </CardContent>
        </Card>
      )}

      {result?.apiResponse.error && (
        <Card>
          <CardContent className="py-4">
            <div className="rounded-md border border-destructive/60 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {typeof result.apiResponse.error === 'string' 
                ? result.apiResponse.error 
                : 'Failed to fetch terminal transactions'}
            </div>
          </CardContent>
        </Card>
      )}

      {transactions.length > 0 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Terminal Transactions</CardTitle>
              <CardDescription>
                Showing {currentOffset + 1}-{currentOffset + transactions.length} of {totalCount} transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Card</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((txn) => (
                    <TableRow key={txn.id}>
                      <TableCell className="font-mono text-xs">{txn.id}</TableCell>
                      <TableCell>{txn.type}</TableCell>
                      <TableCell>{formatCurrency(txn.amount, txn.currency)}</TableCell>
                      <TableCell>
                        {txn.card?.number}
                        {txn.card?.expiration && (
                          <span className="text-muted-foreground text-xs ml-1">
                            ({txn.card.expiration})
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {txn.created ? format(new Date(txn.created), 'MMM d, yyyy HH:mm') : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={txn.inactive ? 'secondary' : 'default'}>
                          {txn.inactive ? 'Inactive' : 'Active'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevPage}
                    disabled={currentOffset === 0 || loading}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={!hasMore || loading}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <PlatformApiResultPanel
            result={result}
            title="API Response"
          />
        </>
      )}
    </div>
  );
}
