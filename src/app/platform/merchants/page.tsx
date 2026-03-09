'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Search, Building2 } from 'lucide-react';

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
import { Badge } from '@/components/ui/badge';
import { usePayrixConfig } from '@/hooks/use-payrix-config';
import { listMerchantsAction } from '@/actions/platform';
import type { Merchant } from '@/lib/platform/types';
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

export default function MerchantsPage() {
  const router = useRouter();
  const { config } = usePayrixConfig();
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [requestPreview, setRequestPreview] = useState<unknown>({});
  const [result, setResult] = useState<ServerActionResult<unknown> | null>(null);
  const [lastFilters, setLastFilters] = useState<PlatformSearchFilter[] | undefined>(undefined);

  const fetchMerchants = async (page: number = currentPage) => {
    if (!config.platformApiKey) {
      toast.error('Platform API key not configured');
      return;
    }

    setLoading(true);
    try {
      const requestId = generateRequestId();
      const filters = searchQuery
        ? [
            { field: 'name', operator: 'like', value: searchQuery },
            { field: 'email', operator: 'like', value: searchQuery },
          ]
        : undefined;
      setLastFilters(filters as PlatformSearchFilter[] | undefined);
      setRequestPreview({
        filters: filters ?? [],
        pagination: { page, limit },
      });
      const result = await listMerchantsAction(
        { config, requestId },
        filters as PlatformSearchFilter[] | undefined,
        { page, limit }
      );
      setResult(result as ServerActionResult<unknown>);

      if (result.apiResponse.error) {
        toast.error(result.apiResponse.error);
        return;
      }

      const data = result.apiResponse.data as Merchant[] | undefined;
      if (data) {
        setMerchants(data);
        const total = (result.historyEntry.response as any)?.details?.page?.total || data.length;
        setTotalPages(Math.ceil(total / limit) || 1);
      }
    } catch (error) {
      toast.error('Failed to fetch merchants');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMerchants();
  }, []);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchMerchants(1);
  };

  const filteredMerchants = merchants.filter(m => {
    const normalizedQuery = searchQuery.toLowerCase();
    return (
      searchQuery === '' ||
      (m.name || '').toLowerCase().includes(normalizedQuery) ||
      (m.email || '').toLowerCase().includes(normalizedQuery)
    );
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="size-5" />
            Merchants
          </CardTitle>
          <CardDescription>View Payrix Platform merchants.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search" className="sr-only">Search</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search merchants..."
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
                  <TableHead>Status</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMerchants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {loading ? 'Loading merchants...' : 'No merchants found'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMerchants.map((merchant) => (
                    <TableRow 
                      key={merchant.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/platform/merchants/${merchant.id}`)}
                    >
                      <TableCell className="font-medium">{merchant.name}</TableCell>
                      <TableCell>
                        <Badge variant={merchant.status === 'active' ? 'default' : 'secondary'}>
                          {merchant.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{merchant.email || '-'}</TableCell>
                      <TableCell>{merchant.phone || '-'}</TableCell>
                      <TableCell>{formatDateSafe((merchant as any).created)}</TableCell>
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
              fetchMerchants(page);
            }}
            onLimitChange={(newLimit) => {
              setLimit(newLimit);
              setCurrentPage(1);
              fetchMerchants(1);
            }}
          />
        </CardContent>
      </Card>

      <PlatformApiResultPanel
        config={config}
        endpoint="/merchants"
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
