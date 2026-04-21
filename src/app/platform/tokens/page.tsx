'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, CreditCard, Plus } from 'lucide-react';
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
  TableCaption,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { activePlatform } from '@/lib/config';
import { usePayrixConfig } from '@/hooks/use-payrix-config';
import { listTokensAction } from '@/actions/platform';
import type { Token } from '@/lib/platform/types';
import { TOKEN_STATUS_LABELS, TOKEN_PAYMENT_METHOD_LABELS, getTokenCustomerId } from '@/lib/platform/types';
import { toast } from '@/lib/toast';
import { generateRequestId } from '@/lib/payrix/identifiers';
import { PaginationControls } from '@/components/platform/pagination-controls';
import { PlatformApiResultPanel } from '@/components/platform/api-result-panel';
import type { PlatformSearchFilter } from '@/lib/platform/types';
import type { ServerActionResult } from '@/lib/payrix/types';
import { formatPayrixTimestamp } from '@/lib/date-utils';
import { useTimezone } from '@/hooks/use-timezone';

function formatExpiration(expiration: string): string {
  if (!expiration || expiration.length !== 4) return '-';
  const month = expiration.slice(0, 2);
  const year = expiration.slice(2, 4);
  return `${month}/${year}`;
}

function getTokenStatus(inactive: number, frozen: number): string {
  if (inactive === 1) return 'Inactive';
  if (frozen === 1) return 'Frozen';
  return 'Active';
}

function getTokenStatusVariant(inactive: number, frozen: number): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (inactive === 1) return 'destructive';
  if (frozen === 1) return 'secondary';
  return 'default';
}

export default function TokensPage() {
  const router = useRouter();
  const { config } = usePayrixConfig();
  const { timezone } = useTimezone();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'frozen'>('all');
  const [requestPreview, setRequestPreview] = useState<unknown>({});
  const [result, setResult] = useState<ServerActionResult<unknown> | null>(null);
  const [lastFilters, setLastFilters] = useState<PlatformSearchFilter[] | undefined>(undefined);

  const fetchTokens = async (
    page: number = currentPage,
    pageLimit: number = limit,
    query: string = searchInput
  ) => {
    if (!activePlatform(config).platformApiKey) {
      toast.error('Platform API key not configured');
      return;
    }

    setLoading(true);
    try {
      const requestId = generateRequestId();
      const trimmedQuery = query.trim();
      const filters: PlatformSearchFilter[] = [];

      // Add status filter
      if (statusFilter === 'active') {
        filters.push({ field: 'inactive', operator: 'eq', value: 0 });
      } else if (statusFilter === 'inactive') {
        filters.push({ field: 'inactive', operator: 'eq', value: 1 });
      } else if (statusFilter === 'frozen') {
        filters.push({ field: 'frozen', operator: 'eq', value: 1 });
      }

      // Add search query filter (customer ID or token ID).
      // Payrix prefixes IDs with `t1_` in test mode and `p1_` in live mode — match both.
      if (trimmedQuery) {
        if (/^[tp]1_cus_/.test(trimmedQuery)) {
          filters.push({ field: 'customer', operator: 'eq', value: trimmedQuery });
        } else {
          filters.push({ field: 'id', operator: 'like', value: trimmedQuery });
        }
      }

      setLastFilters(filters.length > 0 ? filters : undefined);
      setRequestPreview({
        filters: filters,
        pagination: { page, limit: pageLimit },
      });

      const actionResult = await listTokensAction(
        { config, requestId },
        filters.length > 0 ? filters : undefined,
        { page, limit: pageLimit }
      );
      setResult(actionResult as ServerActionResult<unknown>);

      if (actionResult.apiResponse.error) {
        toast.error(actionResult.apiResponse.error);
        return;
      }

      const data = actionResult.apiResponse.data as Token[] | undefined;
      if (data) {
        setTokens(data);
        const total = (actionResult.historyEntry.response as any)?.response?.details?.page?.total || data.length;
        setTotalPages(Math.ceil(total / pageLimit) || 1);
      }
    } catch (error) {
      toast.error('Failed to fetch tokens');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTokens();
  }, []);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchTokens(1, limit, searchInput);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="size-5" />
                Tokens
              </CardTitle>
              <CardDescription>Manage Payrix Platform payment tokens.</CardDescription>
            </div>
            <Button asChild>
              <Link href="/platform/tokens/create">
                <Plus className="mr-2 size-4" />
                Create Token
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
                  placeholder="Search by customer ID or token ID..."
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
              <TableCaption>A list of payment tokens.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Token ID</TableHead>
                  <TableHead>Last 4</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Expiration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tokens.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {loading ? 'Loading tokens...' : 'No tokens found'}
                    </TableCell>
                  </TableRow>
                ) : (
                  tokens.map((token) => (
                    <TableRow 
                      key={token.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/platform/tokens/${token.id}`)}
                    >
                      <TableCell className="font-mono text-xs truncate max-w-[120px]">
                        {token.id}
                      </TableCell>
                      <TableCell>
                        <span className="font-mono">•••• {String(token.payment?.number || '-')}</span>
                      </TableCell>
                      <TableCell>
                        {TOKEN_PAYMENT_METHOD_LABELS[token.payment?.method as keyof typeof TOKEN_PAYMENT_METHOD_LABELS] || 'Card'}
                      </TableCell>
                      <TableCell>{formatExpiration(token.expiration || '')}</TableCell>
                      <TableCell>
                        <Badge variant={getTokenStatusVariant(token.inactive ?? 0, token.frozen ?? 0)}>
                          {getTokenStatus(token.inactive ?? 0, token.frozen ?? 0)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Link 
                          href={`/platform/customers/${getTokenCustomerId(token)}`}
                          className="font-mono text-xs hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {getTokenCustomerId(token)}
                        </Link>
                      </TableCell>
                      <TableCell>{formatPayrixTimestamp(token.created, 'MMM d, yyyy', timezone) || '-'}</TableCell>
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
              fetchTokens(page, limit, searchInput);
            }}
            onLimitChange={(newLimit) => {
              setLimit(newLimit);
              setCurrentPage(1);
              fetchTokens(1, newLimit, searchInput);
            }}
          />
        </CardContent>
      </Card>

      <PlatformApiResultPanel
        config={config}
        endpoint="/tokens"
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
