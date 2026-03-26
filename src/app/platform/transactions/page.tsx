'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { 
  MoreHorizontal, 
  Search,
  CreditCard,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { usePayrixConfig } from '@/hooks/use-payrix-config';
import { listTransactionsAction } from '@/actions/platform';
import type { Transaction, TransactionStatus, PlatformSearchFilter } from '@/lib/platform/types';
import { TRANSACTION_STATUS_LABELS, TRANSACTION_TYPE_LABELS } from '@/lib/platform/types';
import { getMerchantDisplay } from '@/lib/platform/types';
import { toast } from '@/lib/toast';
import { generateRequestId } from '@/lib/payrix/identifiers';
import { PaginationControls } from '@/components/platform/pagination-controls';
import { PlatformApiResultPanel } from '@/components/platform/api-result-panel';
import type { ServerActionResult } from '@/lib/payrix/types';

const TRANSACTION_STATUS_COLORS: Record<TransactionStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  0: 'secondary',  // Pending
  1: 'default',    // Approved
  2: 'destructive', // Failed
  3: 'default',    // Captured
  4: 'default',    // Settled
  5: 'outline',    // Returned
};

export default function TransactionsPage() {
  const router = useRouter();
  const { config } = usePayrixConfig();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(10);
  
  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>('all');
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
      
      // Add status filter if not 'all'
      if (statusFilter !== 'all') {
        searchFilters.push({ field: 'status', operator: 'eq', value: statusFilter });
      }
      
      // Add search query if provided
      if (search) {
        searchFilters.push({ field: 'id', operator: 'eq', value: search });
      }
      
      // Use offset-based pagination
      const response = await listTransactionsAction(context, searchFilters, { limit: pageLimit, offset });
      
      // Check for API errors
      if (response.apiResponse.error) {
        const errorMsg = typeof response.apiResponse.error === 'string' 
          ? response.apiResponse.error 
          : (response.apiResponse.error as any)?.message || 'API error';
        console.error('Transaction API error:', errorMsg);
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
        const total = (response.historyEntry?.response as any)?.response?.details?.page?.total || data.length;
        setTotalPages(Math.ceil(total / pageLimit));
      }
      
      setResult(response);
      setLastFilters(searchFilters);
      setCurrentPage(Math.floor(offset / pageLimit) + 1);
      setLimit(pageLimit);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to fetch transactions');
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

  const handlePageChange = (newPage: number) => {
    const offset = (newPage - 1) * limit;
    fetchTransactions(offset, limit, lastFilters, activeSearchQuery);
  };

  const handleLimitChange = (newLimit: number) => {
    fetchTransactions(0, newLimit, lastFilters, activeSearchQuery);
  };

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
              <p>No transactions found</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Merchant</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((txn) => (
                    <TableRow key={txn.id}>
                      <TableCell className="font-mono text-xs">{txn.id}</TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(txn.total || 0, txn.currency)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={TRANSACTION_STATUS_COLORS[txn.status] || 'default'}>
                          {TRANSACTION_STATUS_LABELS[txn.status] ?? txn.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{txn.type ? TRANSACTION_TYPE_LABELS[txn.type] : '-'}</TableCell>
                      <TableCell>{getMerchantDisplay(txn.merchant)}</TableCell>
                      <TableCell>
                        {txn.created ? format(new Date(txn.created), 'yyyy-MM-dd HH:mm') : '-'}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/platform/transactions/${txn.id}`}>
                                View Details
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
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
          requestPreview={{ filters: lastFilters, pagination: { page: currentPage, limit }}}
          result={result}
          loading={loading}
        />
      )}
    </div>
  );
}
