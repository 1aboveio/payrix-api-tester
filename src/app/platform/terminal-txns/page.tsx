'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  MoreHorizontal,
  Search,
  ChevronDown,
  ChevronRight,
  Plus,
  Loader2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { listTerminalTxnsAction } from '@/actions/terminal-txns';
import type { PlatformSearchFilter } from '@/lib/platform/types';
import type {
  TerminalTxn,
  TerminalTxnType,
} from '@/lib/payrix/terminal-txns-types';
import {
  TERMINAL_TXN_TYPE_LABELS,
  TERMINAL_TXN_ENTRY_MODE_LABELS,
  TERMINAL_TXN_BIN_TYPE_LABELS,
} from '@/lib/payrix/terminal-txns-types';
import { toast } from '@/lib/toast';
import { generateRequestId } from '@/lib/payrix/identifiers';
import { PaginationControls } from '@/components/platform/pagination-controls';
import { PlatformApiResultPanel } from '@/components/platform/api-result-panel';
import type { ServerActionResult } from '@/lib/payrix/types';

export default function TerminalTxnsPage() {
  const { config } = usePayrixConfig();
  const [txns, setTxns] = useState<TerminalTxn[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [activeSearchQuery, setActiveSearchQuery] = useState('');
  const [result, setResult] = useState<ServerActionResult<unknown> | null>(null);
  const [lastFilters, setLastFilters] = useState<PlatformSearchFilter[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchTxns = async (offset = 0, pageLimit = limit, search = '') => {
    setLoading(true);
    try {
      const requestId = generateRequestId();
      const context = { config, requestId };
      const filters: PlatformSearchFilter[] = [];
      if (search) filters.push({ field: 'id', operator: 'eq', value: search });

      const response = await listTerminalTxnsAction(context, filters, { limit: pageLimit, offset });

      if (response.apiResponse.error) {
        const errorMsg =
          typeof response.apiResponse.error === 'string'
            ? response.apiResponse.error
            : (response.apiResponse.error as Record<string, unknown>)?.message || 'API error';
        toast.error(`Failed to fetch terminal transactions: ${errorMsg}`);
        setTxns([]);
        setResult(response);
        setTotalPages(1);
      } else {
        const items = response.apiResponse.data as TerminalTxn[];
        setTxns(items ?? []);
        setResult(response);
        setLastFilters(filters);
        setCurrentOffset(offset);
        setCurrentPage(Math.floor(offset / pageLimit) + 1);

        // Read total from API pagination metadata — same pattern as /platform/transactions
        const apiResponse = response.historyEntry?.response as { response?: { details?: { page?: { total?: number } } } } | undefined;
        const pageDetails = apiResponse?.response?.details?.page;
        const total = pageDetails?.total ?? items?.length ?? 0;
        setTotalCount(total);
        setTotalPages(Math.max(1, Math.ceil(total / pageLimit)));
      }
    } catch (err) {
      console.error('Fetch error:', err);
      toast.error('Failed to fetch terminal transactions');
      setTxns([]);
      setTotalPages(1);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (config?.platformApiKey) {
      fetchTxns(0, limit, '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config?.platformApiKey, config?.platformEnvironment]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    setActiveSearchQuery(searchInput);
    setCurrentOffset(0);
    fetchTxns(0, limit, searchInput);
  };

  function formatCentsToDollars(cents: number): string {
    return `$${(cents / 100).toFixed(2)}`;
  }

  function formatDate(dateStr?: string): string {
    if (!dateStr) return '-';
    try { return format(new Date(dateStr), 'MMM d, yyyy HH:mm'); }
    catch { return dateStr; }
  }

  function getTypeLabel(type: TerminalTxnType): string {
    return TERMINAL_TXN_TYPE_LABELS[type] ?? String(type);
  }

  function getTypeColor(type: TerminalTxnType): 'default' | 'secondary' | 'destructive' | 'outline' {
    switch (type) {
      case 1: return 'default';
      case 2: return 'secondary';
      case 5: return 'destructive';
      default: return 'outline';
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Terminal Transactions</h1>
          <p className="text-muted-foreground text-sm">Payrix Pro terminal transaction management</p>
        </div>
        <Button asChild>
          <Link href="/platform/terminal-txns/create">
            <Plus className="mr-2 h-4 w-4" />
            Create Terminal Txn
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="pt-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              placeholder="Search by Terminal Txn ID..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="max-w-sm"
            />
            <Button type="submit" variant="secondary" disabled={loading}>
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
            {activeSearchQuery && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setSearchInput('');
                  setActiveSearchQuery('');
                  setCurrentPage(1);
                  setCurrentOffset(0);
                  fetchTxns(0, limit, '');
                }}
              >
                Clear
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </span>
            ) : (
              txns.length > 0
                ? `${totalCount.toLocaleString()} terminal transaction${totalCount !== 1 ? 's' : ''}`
                : 'No terminal transactions found'
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>BIN Type</TableHead>
                  <TableHead>Entry Mode</TableHead>
                  <TableHead>Auth Code</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-8"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {txns.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                      {activeSearchQuery ? 'No matching terminal transactions.' : 'No terminal transactions found.'}
                    </TableCell>
                  </TableRow>
                )}
                {txns.map((txn) => (
                  <>
                    <TableRow
                      key={txn.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setExpandedId(expandedId === txn.id ? null : txn.id)}
                    >
                      <TableCell>
                        {expandedId === txn.id
                          ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                      </TableCell>
                      <TableCell className="font-mono text-xs max-w-[120px] truncate">{txn.id}</TableCell>
                      <TableCell><Badge variant={getTypeColor(txn.type)}>{getTypeLabel(txn.type)}</Badge></TableCell>
                      <TableCell className="text-right font-medium">{formatCentsToDollars(txn.total)}</TableCell>
                      <TableCell>{txn.currency}</TableCell>
                      <TableCell>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-muted">
                          {TERMINAL_TXN_BIN_TYPE_LABELS[txn.binType] ?? txn.binType}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {txn.entryMode ? TERMINAL_TXN_ENTRY_MODE_LABELS[txn.entryMode] ?? txn.entryMode : '-'}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{txn.authCode ?? '-'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDate(txn.created)}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem disabled>View Detail</DropdownMenuItem>
                            <DropdownMenuItem disabled>Edit</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                    {expandedId === txn.id && (
                      <TableRow>
                        <TableCell colSpan={10} className="bg-muted/30 p-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div><span className="text-muted-foreground text-xs">MID</span><p className="font-mono">{txn.mid ?? '-'}</p></div>
                            <div><span className="text-muted-foreground text-xs">Merchant</span><p className="font-mono">{txn.merchant ?? '-'}</p></div>
                            <div><span className="text-muted-foreground text-xs">Status</span><p>{txn.status}</p></div>
                            <div><span className="text-muted-foreground text-xs">Swiped/PIN/Sig</span><p>{txn.swiped}/{txn.pin}/{txn.signature}</p></div>
                            <div><span className="text-muted-foreground text-xs">Origin</span><p>{txn.origin}</p></div>
                            <div><span className="text-muted-foreground text-xs">POS</span><p>{txn.pos === 0 ? 'Internal' : 'External'}</p></div>
                            {txn.tip != null && <div><span className="text-muted-foreground text-xs">Tip</span><p>{formatCentsToDollars(txn.tip)}</p></div>}
                            {txn.cashback != null && <div><span className="text-muted-foreground text-xs">Cashback</span><p>{formatCentsToDollars(txn.cashback)}</p></div>}
                            {txn.first && <div><span className="text-muted-foreground text-xs">Cardholder</span><p>{[txn.first, txn.last].filter(Boolean).join(' ') || '-'}</p></div>}
                            {txn.city && <div><span className="text-muted-foreground text-xs">Location</span><p>{[txn.city, txn.state, txn.country].filter(Boolean).join(', ')}</p></div>}
                            <div><span className="text-muted-foreground text-xs">Modified</span><p className="text-xs">{formatDate(txn.modified)}</p></div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          </div>
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            limit={limit}
            onPageChange={(p) => {
              const offset = (p - 1) * limit;
              fetchTxns(offset, limit, activeSearchQuery);
            }}
            onLimitChange={(l) => {
              setLimit(l);
              fetchTxns(0, l, activeSearchQuery);
            }}
            totalCount={totalCount}
          />
        </CardContent>
      </Card>

      {result && (
        <PlatformApiResultPanel
          config={config}
          endpoint="/terminalTxns"
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
