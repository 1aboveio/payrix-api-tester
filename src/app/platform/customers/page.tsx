'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
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
import { usePayrixConfig } from '@/hooks/use-payrix-config';
import { listCustomersAction } from '@/actions/platform';
import type { Customer } from '@/lib/platform/types';
import { toast } from '@/lib/toast';
import { generateRequestId } from '@/lib/payrix/identifiers';
import { PaginationControls } from '@/components/platform/pagination-controls';
import { PlatformApiResultPanel } from '@/components/platform/api-result-panel';
import type { PlatformSearchFilter } from '@/lib/platform/types';
import type { ServerActionResult } from '@/lib/payrix/types';

function formatDateSafe(value?: string | number | Date | null): string {
  if (value === undefined || value === null || value === '') return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : format(date, 'MMM d, yyyy');
}

export default function CustomersPage() {
  const router = useRouter();
  const { config } = usePayrixConfig();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [requestPreview, setRequestPreview] = useState<unknown>({});
  const [result, setResult] = useState<ServerActionResult<unknown> | null>(null);
  const [lastFilters, setLastFilters] = useState<PlatformSearchFilter[] | undefined>(undefined);

  const fetchCustomers = async (page: number = currentPage) => {
    if (!config.platformApiKey) {
      toast.error('Platform API key not configured');
      return;
    }

    setLoading(true);
    try {
      const requestId = generateRequestId();
      const filters = searchQuery
        ? [
            { field: 'firstName', operator: 'like', value: searchQuery },
            { field: 'lastName', operator: 'like', value: searchQuery },
            { field: 'email', operator: 'like', value: searchQuery },
          ]
        : undefined;
      setLastFilters(filters as PlatformSearchFilter[] | undefined);
      setRequestPreview({
        filters: filters ?? [],
        pagination: { page, limit },
      });
      const result = await listCustomersAction(
        { config, requestId },
        filters as PlatformSearchFilter[] | undefined,
        { page, limit }
      );
      setResult(result as ServerActionResult<unknown>);

      if (result.apiResponse.error) {
        toast.error(result.apiResponse.error);
        return;
      }

      const data = result.apiResponse.data as Customer[] | undefined;
      if (data) {
        setCustomers(data);
        const total = (result.historyEntry.response as any)?.details?.page?.total || data.length;
        setTotalPages(Math.ceil(total / limit) || 1);
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
    setCurrentPage(1);
    fetchCustomers(1);
  };

  const filteredCustomers = customers.filter(c => 
    searchQuery === '' || 
    c.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
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
                {filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {loading ? 'Loading customers...' : 'No customers found'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((customer) => (
                    <TableRow 
                      key={customer.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/platform/customers/${customer.id}`)}
                    >
                      <TableCell className="font-medium">
                        {customer.firstName || customer.lastName 
                          ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim()
                          : '-'}
                      </TableCell>
                      <TableCell>{customer.email || '-'}</TableCell>
                      <TableCell>{customer.phone || '-'}</TableCell>
                      <TableCell>{customer.city || '-'}</TableCell>
                      <TableCell>{formatDateSafe((customer as any).created)}</TableCell>
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
              fetchCustomers(page);
            }}
            onLimitChange={(newLimit) => {
              setLimit(newLimit);
              setCurrentPage(1);
              fetchCustomers(1);
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
