'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { 
  MoreHorizontal, 
  Plus, 
  Search,
  FileText,
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
import { activePlatform } from '@/lib/config';
import { usePayrixConfig } from '@/hooks/use-payrix-config';
import { listInvoicesAction } from '@/actions/platform';
import type { Invoice, InvoiceStatus } from '@/lib/platform/types';
import { getMerchantDisplay } from '@/lib/platform/types';
import { toast } from '@/lib/toast';
import { generateRequestId } from '@/lib/payrix/identifiers';
import { PaginationControls } from '@/components/platform/pagination-controls';
import { PlatformApiResultPanel } from '@/components/platform/api-result-panel';
import type { PlatformSearchFilter } from '@/lib/platform/types';
import type { ServerActionResult } from '@/lib/payrix/types';

const INVOICE_STATUS_COLORS: Record<InvoiceStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'secondary',
  cancelled: 'destructive',
  expired: 'destructive',
  viewed: 'default',
  paid: 'default',
  confirmed: 'default',
  refunded: 'outline',
  rejected: 'destructive',
};

export default function InvoicesPage() {
  const router = useRouter();
  const { config } = usePayrixConfig();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(10);
  
  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchInput, setSearchInput] = useState('');
  const [activeSearchQuery, setActiveSearchQuery] = useState('');
  const [requestPreview, setRequestPreview] = useState<unknown>({});
  const [result, setResult] = useState<ServerActionResult<unknown> | null>(null);
  const [lastFilters, setLastFilters] = useState<PlatformSearchFilter[] | undefined>(undefined);

  const fetchInvoices = async (
    page: number = currentPage,
    pageLimit: number = limit,
    status: string = statusFilter,
    query: string = activeSearchQuery
  ) => {
    if (!activePlatform(config).platformApiKey) {
      toast.error('Platform API key not configured');
      return;
    }

    setLoading(true);
    try {
      const requestId = generateRequestId();
      const baseFilters: PlatformSearchFilter[] = [];
      if (status !== 'all') {
        baseFilters.push({ field: 'status', operator: 'eq', value: status as InvoiceStatus });
      }

      const trimmedQuery = query.trim();
      const numberFilters: PlatformSearchFilter[] = trimmedQuery
        ? [...baseFilters, { field: 'number', operator: 'like', value: trimmedQuery } as PlatformSearchFilter]
        : baseFilters;
      const initialFilters = numberFilters.length > 0 ? numberFilters : undefined;

      setLastFilters(initialFilters);
      setRequestPreview({
        filters: initialFilters ?? [],
        pagination: { page, limit: pageLimit },
      });

      const initialResult = await listInvoicesAction(
        { config, requestId },
        initialFilters,
        { page, limit: pageLimit }
      );
      setResult(initialResult as ServerActionResult<unknown>);

      if (initialResult.apiResponse.error) {
        toast.error(initialResult.apiResponse.error);
        return;
      }

      let data = initialResult.apiResponse.data as Invoice[] | undefined;
      let resultToUse = initialResult as ServerActionResult<unknown>;
      let effectiveFilters = initialFilters as PlatformSearchFilter[] | undefined;

      if (trimmedQuery && (!data || data.length === 0)) {
        const titleFilters: PlatformSearchFilter[] = [
          ...baseFilters,
          { field: 'title', operator: 'like', value: trimmedQuery } as PlatformSearchFilter,
        ];
        const fallbackRequestId = generateRequestId();
        const fallbackResult = await listInvoicesAction(
          { config, requestId: fallbackRequestId },
          titleFilters,
          { page, limit: pageLimit }
        );

        if (!fallbackResult.apiResponse.error) {
          data = fallbackResult.apiResponse.data as Invoice[] | undefined;
          resultToUse = fallbackResult as ServerActionResult<unknown>;
          effectiveFilters = titleFilters;
          setResult(fallbackResult as ServerActionResult<unknown>);
        }
      }

      setLastFilters(effectiveFilters);
      setRequestPreview({
        filters: effectiveFilters ?? [],
        pagination: { page, limit: pageLimit },
      });

      if (data) {
        setInvoices(data);
        const total = (resultToUse.historyEntry.response as any)?.response?.details?.page?.total || data.length;
        setTotalPages(Math.ceil(total / pageLimit) || 1);
      }
    } catch (error) {
      toast.error('Failed to fetch invoices');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchInvoices();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = () => {
    const trimmed = searchInput.trim();
    setActiveSearchQuery(trimmed);
    setCurrentPage(1);
    fetchInvoices(1, limit, statusFilter, trimmed);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="size-5" />
                Invoices
              </CardTitle>
              <CardDescription>Manage Payrix Platform invoices.</CardDescription>
            </div>
            <Button asChild>
              <Link href="/platform/invoices/create">
                <Plus className="mr-2 size-4" />
                Create Invoice
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="search" className="sr-only">Search</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by number or title..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="w-[180px]">
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value);
                  setCurrentPage(1);
                  fetchInvoices(1, limit, value, activeSearchQuery);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="viewed">Viewed</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={handleSearch} disabled={loading}>
              {loading ? 'Loading...' : 'Search'}
            </Button>
          </div>

          {/* Invoices Table */}
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Number</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Merchant</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      {loading ? 'Loading invoices...' : 'No invoices found'}
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((invoice) => (
                    <TableRow key={invoice.id} className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/platform/invoices/${invoice.id}`)}
                    >
                      <TableCell className="font-medium">{invoice.number}</TableCell>
                      <TableCell>{invoice.title || '-'}</TableCell>
                      <TableCell>{getMerchantDisplay(invoice.merchant)}</TableCell>
                      <TableCell>
                        <Badge variant={INVOICE_STATUS_COLORS[invoice.status]}>
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="capitalize">{invoice.type || 'single'}</TableCell>
                      <TableCell className="text-right">
                        {invoice.total ? `$${(invoice.total / 100).toFixed(2)}` : '-'}
                      </TableCell>
                      <TableCell>
                        {invoice.dueDate 
                          ? format(new Date(invoice.dueDate), 'MMM d, yyyy') 
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="size-8">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/platform/invoices/${invoice.id}`}>View</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/platform/invoices/${invoice.id}/edit`}>Edit</Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            limit={limit}
            onPageChange={(page) => {
              setCurrentPage(page);
              fetchInvoices(page, limit, statusFilter, activeSearchQuery);
            }}
            onLimitChange={(newLimit) => {
              setLimit(newLimit);
              setCurrentPage(1);
              fetchInvoices(1, newLimit, statusFilter, activeSearchQuery);
            }}
          />
        </CardContent>
      </Card>

      <PlatformApiResultPanel
        config={config}
        endpoint="/invoices"
        method="GET"
        requestPreview={requestPreview}
        result={result}
        loading={loading}
        searchFilters={lastFilters}
        pagination={{ page: currentPage, limit }}
      />
    </div>
  );
}
