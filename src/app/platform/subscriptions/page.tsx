'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { MoreHorizontal, Plus, Search, Repeat } from 'lucide-react';

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
import { listSubscriptionsAction, listPlansAction, listSubscriptionTokensAction, listTokensAction, listCustomersAction } from '@/actions/platform';
import type { Subscription, Plan, SubscriptionToken, Token, Customer } from '@/lib/platform/types';
import { getSubscriptionAmount, getSubscriptionPlanName, getSubscriptionCustomerName } from '@/lib/platform/types';
import { toast } from '@/lib/toast';
import { generateRequestId } from '@/lib/payrix/identifiers';
import { PaginationControls } from '@/components/platform/pagination-controls';
import type { ServerActionResult } from '@/lib/payrix/types';

function getStatusInfo(sub: Subscription): { label: string; variant: 'default' | 'secondary' | 'destructive' } {
  if (sub.frozen === 1) return { label: 'Frozen', variant: 'destructive' };
  if (sub.inactive === 1) return { label: 'Inactive', variant: 'secondary' };
  return { label: 'Active', variant: 'default' };
}

function formatPayrixDate(num?: number): string {
  if (!num) return '-';
  const s = String(num);
  if (s.length !== 8) return '-';
  const d = new Date(`${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`);
  return isNaN(d.getTime()) ? '-' : format(d, 'MMM d, yyyy');
}

export default function SubscriptionsPage() {
  const router = useRouter();
  const { config } = usePayrixConfig();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [result, setResult] = useState<ServerActionResult<unknown> | null>(null);
  const [subTokenMap, setSubTokenMap] = useState<Map<string, Token>>(new Map());

  const fetchSubscriptions = async (page: number = currentPage, pageLimit: number = limit) => {
    if (!config.platformApiKey) {
      toast.error('Platform API key not configured');
      return;
    }

    setLoading(true);
    const requestId = generateRequestId();
    
    try {
      const filters = searchQuery ? [{ field: 'customer', operator: 'eq' as const, value: searchQuery }] : undefined;
      
      const response = await listSubscriptionsAction(
        { config, requestId },
        filters,
        { page, limit: pageLimit }
      );
      
      setResult(response);
      
      if (response.apiResponse.error) {
        toast.error(`Failed to load subscriptions: ${response.apiResponse.error}`);
        return;
      }

      const data = response.apiResponse.data as Subscription[] | undefined;
      if (data) {
        // Enrich subscriptions with plan and customer data
        // (Payrix embed strips subscription fields, so we fetch separately)

        // 1. Enrich with plans
        const plansRequestId = generateRequestId();
        const plansResponse = await listPlansAction({ config, requestId: plansRequestId }, undefined, { page: 1, limit: 100 });
        const plansData = plansResponse.apiResponse.data as Plan[] | undefined;
        if (plansData) {
          const planMap = new Map(plansData.map(p => [p.id, p]));
          for (const sub of data) {
            if (typeof sub.plan === 'string' && planMap.has(sub.plan)) {
              sub.plan = planMap.get(sub.plan)!;
            }
          }
        }

        // 2. Enrich with customers via subscriptionTokens → tokens
        try {
          const stReqId = generateRequestId();
          const stResponse = await listSubscriptionTokensAction({ config, requestId: stReqId }, undefined, { page: 1, limit: 100 });
          const stData = stResponse.apiResponse.data as SubscriptionToken[] | undefined;

          if (stData && stData.length > 0) {
            // Map subscription ID → token hashes
            const subToTokenHash = new Map<string, string>();
            for (const st of stData) {
              if (!subToTokenHash.has(st.subscription)) {
                subToTokenHash.set(st.subscription, st.token);
              }
            }

            // Fetch tokens to get customer IDs
            const tokReqId = generateRequestId();
            const tokResponse = await listTokensAction({ config, requestId: tokReqId }, undefined, { page: 1, limit: 100 });
            const tokData = tokResponse.apiResponse.data as Token[] | undefined;

            if (tokData) {
              const hashToToken = new Map<string, Token>();
              for (const tok of tokData) {
                if (tok.token) hashToToken.set(tok.token, tok);
              }

              const tokenMap = new Map<string, Token>();
              const customerIds = new Set<string>();
              for (const sub of data) {
                const tokenHash = subToTokenHash.get(sub.id);
                if (tokenHash && hashToToken.has(tokenHash)) {
                  const tok = hashToToken.get(tokenHash)!;
                  tokenMap.set(sub.id, tok);
                  if (!sub.customer && tok.customer) {
                    const custId = typeof tok.customer === 'string' ? tok.customer : (tok.customer as { id: string })?.id;
                    if (custId) {
                      sub.customer = custId;
                      customerIds.add(custId);
                    }
                  } else if (typeof sub.customer === 'string') {
                    customerIds.add(sub.customer);
                  }
                }
              }
              setSubTokenMap(tokenMap);

              // Fetch customer records to get emails
              if (customerIds.size > 0) {
                const custReqId = generateRequestId();
                const custResponse = await listCustomersAction({ config, requestId: custReqId }, undefined, { page: 1, limit: 100 });
                const custData = custResponse.apiResponse.data as Customer[] | undefined;
                if (custData) {
                  const custMap = new Map(custData.map(c => [c.id, c]));
                  for (const sub of data) {
                    const custId = typeof sub.customer === 'string' ? sub.customer : undefined;
                    if (custId && custMap.has(custId)) {
                      sub.customer = custMap.get(custId)!;
                    }
                  }
                }
              }
            }
          }
        } catch { /* customer enrichment is best-effort */ }

        setSubscriptions(data);
        setTotalPages(Math.max(1, Math.ceil(data.length / pageLimit)));
      }
    } catch (err) {
      toast.error('Failed to load subscriptions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [config.platformApiKey]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchSubscriptions(page, limit);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setCurrentPage(1);
    fetchSubscriptions(1, newLimit);
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchSubscriptions(1, limit);
  };

  const formatCurrency = (amount?: number, currency?: string) => {
    if (amount === undefined) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount / 100);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Repeat className="size-5" />
              Subscriptions
            </CardTitle>
            <CardDescription>Manage recurring billing subscriptions</CardDescription>
          </div>
          <Button asChild>
            <Link href="/platform/subscriptions/create">
              <Plus className="mr-2 size-4" />
              Create Subscription
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="flex gap-2">
            <Input
              placeholder="Search by customer ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="max-w-sm"
            />
            <Button variant="outline" onClick={handleSearch}>
              <Search className="mr-2 size-4" />
              Search
            </Button>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Token</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Cycles Paid</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : subscriptions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      No subscriptions found
                    </TableCell>
                  </TableRow>
                ) : (
                  subscriptions.map((subscription) => (
                    <TableRow key={subscription.id} className="cursor-pointer" onClick={() => router.push(`/platform/subscriptions/${subscription.id}`)}>
                      <TableCell className="text-sm">
                        {getSubscriptionCustomerName(subscription)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {getSubscriptionPlanName(subscription)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {(() => {
                          const tok = subTokenMap.get(subscription.id);
                          if (!tok) return '-';
                          const last4 = tok.payment?.number ? `•••• ${tok.payment.number}` : '';
                          const exp = tok.expiration ? `${String(tok.expiration).slice(0, 2)}/${String(tok.expiration).slice(2)}` : '';
                          return last4 ? `${last4} ${exp}` : exp || tok.id.slice(-8);
                        })()}
                      </TableCell>
                      <TableCell>
                        {(() => { const s = getStatusInfo(subscription); return <Badge variant={s.variant}>{s.label}</Badge>; })()}
                      </TableCell>
                      <TableCell>{formatCurrency(getSubscriptionAmount(subscription), subscription.currency)}</TableCell>
                      <TableCell className="text-sm">
                        {formatPayrixDate(subscription.start)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatPayrixDate(subscription.finish)}
                      </TableCell>
                      <TableCell className="text-sm text-center">
                        {subscription.cyclesPaid ?? '-'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {subscription.created ? format(new Date(subscription.created), 'MMM d, yyyy') : '-'}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/platform/subscriptions/${subscription.id}`); }}>
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/platform/checkout?subscriptionId=${subscription.id}`); }}>
                              Pay &amp; Subscribe
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
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
          />
        </CardContent>
      </Card>
    </div>
  );
}
