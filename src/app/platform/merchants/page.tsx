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
import type { Merchant, PlatformEntity, PlatformSearchFilter } from '@/lib/platform/types';
import { toast } from '@/lib/toast';
import { generateRequestId } from '@/lib/payrix/identifiers';
import { PaginationControls } from '@/components/platform/pagination-controls';
import { PlatformApiResultPanel } from '@/components/platform/api-result-panel';
import type { ServerActionResult } from '@/lib/payrix/types';

function formatDateSafe(value?: string | number | Date | null): string {
  if (value === undefined || value === null || value === '') return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : format(date, 'MMM d, yyyy');
}

// Get merchant display name - prefer dba, then entity.name, then fallback to id
function getMerchantName(merchant: Merchant): string {
  if (merchant.dba) return merchant.dba;
  const entity = merchant.entity as PlatformEntity | undefined;
  if (entity && typeof entity === 'object' && typeof entity.name === 'string') return entity.name;
  if (merchant.name && typeof merchant.name === 'string') return merchant.name;
  return merchant.id;
}

// Get merchant email from entity
function getMerchantEmail(merchant: Merchant): string {
  const entity = merchant.entity as PlatformEntity | undefined;
  if (entity && typeof entity === 'object') {
    return entity.email || '-';
  }
  return merchant.email || '-';
}

// Get merchant phone from entity
function getMerchantPhone(merchant: Merchant): string {
  const entity = merchant.entity as PlatformEntity | undefined;
  if (entity && typeof entity === 'object') {
    return entity.phone || '-';
  }
  return merchant.phone || '-';
}

// Get status label from integer status
function getMerchantStatusLabel(status: number): string {
  const labels: Record<number, string> = {
    0: 'Not Ready',
    1: 'Pending',
    2: 'Boarded',
    3: 'Active',
    4: 'Suspended',
    5: 'Cancelled',
    6: 'Closed',
  };
  return labels[status] || `Status ${status}`;
}

export default function MerchantsPage() {
  const router = useRouter();
  const { config } = usePayrixConfig();
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const [activeSearchQuery, setActiveSearchQuery] = useState('');
  const [requestPreview, setRequestPreview] = useState<unknown>({});
  const [result, setResult] = useState<ServerActionResult<unknown> | null>(null);
  const [lastFilters, setLastFilters] = useState<PlatformSearchFilter[] | undefined>(undefined);

  const fetchMerchants = async (
    page: number = currentPage,
    pageLimit: number = limit,
    query: string = activeSearchQuery
  ) => {
    if (!config.platformApiKey) {
      toast.error('Platform API key not configured');
      return;
    }

    setLoading(true);
    try {
      const requestId = generateRequestId();
      const trimmedQuery = query.trim();
      const filters = trimmedQuery
        ? [{ field: trimmedQuery.includes('@') ? 'email' : 'name', operator: 'like', value: trimmedQuery }]
        : undefined;
      setLastFilters(filters as PlatformSearchFilter[] | undefined);
      setRequestPreview({
        filters: filters ?? [],
        pagination: { page, limit: pageLimit },
      });
      const result = await listMerchantsAction(
        { config, requestId },
        filters as PlatformSearchFilter[] | undefined,
        { page, limit: pageLimit }
      );
      setResult(result as ServerActionResult<unknown>);

      if (result.apiResponse.error) {
        toast.error(result.apiResponse.error);
        return;
      }

      const data = result.apiResponse.data as Merchant[] | undefined;
      if (data) {
        setMerchants(data);
        const total = (result.historyEntry.response as any)?.response?.details?.page?.total || data.length;
        setTotalPages(Math.ceil(total / pageLimit) || 1);
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
    const trimmed = searchInput.trim();
    setActiveSearchQuery(trimmed);
    setCurrentPage(1);
    fetchMerchants(1, limit, trimmed);
  };

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
                  <TableHead>Status</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {merchants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {loading ? 'Loading merchants...' : 'No merchants found'}
                    </TableCell>
                  </TableRow>
                ) : (
                  merchants.map((merchant) => (
                    <TableRow 
                      key={merchant.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/platform/merchants/${merchant.id}`)}
                    >
                      <TableCell className="font-medium">{getMerchantName(merchant)}</TableCell>
                      <TableCell>
                        <Badge variant={merchant.status === 3 ? 'default' : 'secondary'}>
                          {getMerchantStatusLabel(merchant.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>{getMerchantEmail(merchant)}</TableCell>
                      <TableCell>{getMerchantPhone(merchant)}</TableCell>
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
              fetchMerchants(page, limit, activeSearchQuery);
            }}
            onLimitChange={(newLimit) => {
              setLimit(newLimit);
              setCurrentPage(1);
              fetchMerchants(1, newLimit, activeSearchQuery);
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
