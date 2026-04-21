'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Users, Plus } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { activePlatform } from '@/lib/config';
import { usePayrixConfig } from '@/hooks/use-payrix-config';
import { listCustomersAction } from '@/actions/platform';
import type { Customer } from '@/lib/platform/types';
import { toast } from '@/lib/toast';
import { generateRequestId } from '@/lib/payrix/identifiers';
import { PaginationControls } from '@/components/platform/pagination-controls';
import { PlatformApiResultPanel } from '@/components/platform/api-result-panel';
import type { PlatformSearchFilter } from '@/lib/platform/types';
import type { ServerActionResult } from '@/lib/payrix/types';
import { formatPayrixTimestamp } from '@/lib/date-utils';
import { useTimezone } from '@/hooks/use-timezone';

export default function CustomersPage() {
  const router = useRouter();
  const { config } = usePayrixConfig();
  const { timezone } = useTimezone();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const [activeSearchQuery, setActiveSearchQuery] = useState('');
  const [requestPreview, setRequestPreview] = useState<unknown>({});
  const [result, setResult] = useState<ServerActionResult<unknown> | null>(null);
  const [lastFilters, setLastFilters] = useState<PlatformSearchFilter[] | undefined>(undefined);

  const fetchCustomers = async (
    page: number = currentPage,
    pageLimit: number = limit,
    query: string = activeSearchQuery
  ) => {
    if (!activePlatform(config).platformApiKey) {
      toast.error('Platform API key not configured');
      return;
    }

    setLoading(true);
    try {
      const requestId = generateRequestId();
      const trimmedQuery = query.trim();
      const primaryField = trimmedQuery.includes('@') ? 'email' : 'firstName';
      const primaryFilters = trimmedQuery
        ? [{ field: primaryField, operator: 'like', value: trimmedQuery }]
        : undefined;
      setLastFilters(primaryFilters as PlatformSearchFilter[] | undefined);
      setRequestPreview({
        filters: primaryFilters ?? [],
        pagination: { page, limit: pageLimit },
      });
      const primaryResult = await listCustomersAction(
        { config, requestId },
        primaryFilters as PlatformSearchFilter[] | undefined,
        { page, limit: pageLimit }
      );
      setResult(primaryResult as ServerActionResult<unknown>);

      if (primaryResult.apiResponse.error) {
        toast.error(primaryResult.apiResponse.error);
        return;
      }

      let data = primaryResult.apiResponse.data as Customer[] | undefined;
      let resultToUse = primaryResult as ServerActionResult<unknown>;
      let effectiveFilters = primaryFilters as PlatformSearchFilter[] | undefined;

      if (!trimmedQuery.includes('@') && (!data || data.length === 0)) {
        const fallbackFilters: PlatformSearchFilter[] = [{ field: 'lastName', operator: 'like', value: trimmedQuery }];
        const fallbackRequestId = generateRequestId();
        const fallbackResult = await listCustomersAction(
          { config, requestId: fallbackRequestId },
          fallbackFilters,
          { page, limit: pageLimit }
        );

        if (!fallbackResult.apiResponse.error) {
          data = fallbackResult.apiResponse.data as Customer[] | undefined;
          resultToUse = fallbackResult as ServerActionResult<unknown>;
          effectiveFilters = fallbackFilters;
          setResult(fallbackResult as ServerActionResult<unknown>);
        }
      }

      setLastFilters(effectiveFilters);
      setRequestPreview({
        filters: effectiveFilters ?? [],
        pagination: { page, limit: pageLimit },
      });

      if (data) {
        setCustomers(data);
        const total = (resultToUse.historyEntry.response as any)?.response?.details?.page?.total || data.length;
        setTotalPages(Math.ceil(total / pageLimit) || 1);
      }
    } catch (error) {
      toast.error('Failed to fetch customers');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleSearch = () => {
    const trimmed = searchInput.trim();
    setActiveSearchQuery(trimmed);
    setCurrentPage(1);
    fetchCustomers(1, limit, trimmed);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="size-5" />
                Customers
              </CardTitle>
              <CardDescription>Manage Payrix Platform customers.</CardDescription>
            </div>
            <Button asChild>
              <Link href="/platform/customers/create">
                <Plus className="mr-2 size-4" />
                Create Customer
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search" className="sr-only">Search</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search customers..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-9"
                />
              </div>
            </div>
            <Button variant="outline" onClick={handleSearch} disabled={loading}>
              {loading ? 'Loading...' : 'Search'}
            </Button>
          </div>

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {loading ? 'Loading customers...' : 'No customers found'}
                    </TableCell>
                  </TableRow>
                ) : (
                  customers.map((customer) => (
                    <TableRow 
                      key={customer.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/platform/customers/${customer.id}`)}
                    >
                      <TableCell className="font-medium">
                        {customer.first || customer.last
                          ? `${customer.first || ''} ${customer.last || ''}`.trim()
                          : '-'}
                      </TableCell>
                      <TableCell>{customer.email || '-'}</TableCell>
                      <TableCell>{customer.phone || '-'}</TableCell>
                      <TableCell>{customer.city || '-'}</TableCell>
                      <TableCell>{formatPayrixTimestamp((customer as any).created, 'MMM d, yyyy', timezone) || '-'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            limit={limit}
            onPageChange={(page) => {
              setCurrentPage(page);
              fetchCustomers(page, limit, activeSearchQuery);
            }}
            onLimitChange={(newLimit) => {
              setLimit(newLimit);
              setCurrentPage(1);
              fetchCustomers(1, newLimit, activeSearchQuery);
            }}
          />
        </CardContent>
      </Card>

      <PlatformApiResultPanel
        config={config}
        endpoint="/customers"
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
