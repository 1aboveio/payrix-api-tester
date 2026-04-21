'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MoreHorizontal, Plus, Repeat } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useTimezone } from '@/hooks/use-timezone';
import { formatPayrixInt, formatPayrixTimestamp } from '@/lib/date-utils';
import { listSubscriptionsAction, listPlansAction, listSubscriptionTokensAction, listTokensAction, getCustomerAction } from '@/actions/platform';
import type { Subscription, Plan, SubscriptionToken, Token, Customer, PlatformSearchFilter } from '@/lib/platform/types';
import { getSubscriptionAmount, getSubscriptionPlanName, getSubscriptionCustomerName } from '@/lib/platform/types';
import { toast } from '@/lib/toast';
import { generateRequestId } from '@/lib/payrix/identifiers';
import { PaginationControls } from '@/components/platform/pagination-controls';
import { PlatformApiResultPanel } from '@/components/platform/api-result-panel';
import type { ServerActionResult } from '@/lib/payrix/types';

function getStatusInfo(sub: Subscription): { label: string; variant: 'default' | 'secondary' | 'destructive' } {
  if (sub.frozen === 1) return { label: 'Frozen', variant: 'destructive' };
  if (sub.inactive === 1) return { label: 'Inactive', variant: 'secondary' };
  return { label: 'Active', variant: 'default' };
}

export default function SubscriptionsPage() {
  const router = useRouter();
  const { config } = usePayrixConfig();
  const { timezone } = useTimezone();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(10);
  const [result, setResult] = useState<ServerActionResult<unknown> | null>(null);
  const [lastFilters, setLastFilters] = useState<PlatformSearchFilter[] | undefined>(undefined);
  const [subTokenMap, setSubTokenMap] = useState<Map<string, Token[]>>(new Map());

  const fetchSubscriptions = async (page: number = currentPage, pageLimit: number = limit) => {
    if (!config.platformApiKey) {
      toast.error('Platform API key not configured');
      return;
    }

    setLoading(true);
    const requestId = generateRequestId();
    
    try {
      const merchantId = activePlatform(config).platformMerchant;
      const filters: PlatformSearchFilter[] = [];
      if (merchantId) filters.push({ field: 'merchant', operator: 'equals', value: merchantId });

      const effectiveFilters = filters.length > 0 ? filters : undefined;
      setLastFilters(effectiveFilters);

      const response = await listSubscriptionsAction(
        { config, requestId },
        effectiveFilters,
        { page, limit: pageLimit }
      );
      
      setResult(response);
      
      if (response.apiResponse.error) {
        toast.error(`Failed to load subscriptions: ${response.apiResponse.error}`);
        return;
      }

      const data = response.apiResponse.data as Subscription[] | undefined;
      if (data) {
        // Show subscriptions immediately, stop loading spinner
        setSubscriptions(data);
        setTotalPages(Math.max(1, Math.ceil(data.length / pageLimit)));
        setLoading(false);

        // Enrich with plans, tokens, and customers (all best-effort, non-blocking)
        try {
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
            setSubscriptions([...data]); // trigger re-render with plan names
          }

          // 2. Enrich with customers via subscriptionTokens → tokens.
          // Query per-subscription with filters — unfiltered pagination at
          // limit 100 silently drops records on larger accounts.
          const subTokensResults = await Promise.all(
            data.map(async (sub) => {
              const reqId = generateRequestId();
              const resp = await listSubscriptionTokensAction(
                { config, requestId: reqId },
                [{ field: 'subscription', operator: 'equals', value: sub.id }],
                { page: 1, limit: 10 }
              );
              const sts = (resp.apiResponse.data as SubscriptionToken[] | undefined) ?? [];
              return { sub, sts };
            })
          );

          // Resolve each unique token hash via token[equals] lookup
          const uniqueHashes = Array.from(
            new Set(subTokensResults.flatMap(({ sts }) => sts.map((s) => s.token)))
          );
          const hashToToken = new Map<string, Token>();
          await Promise.all(
            uniqueHashes.map(async (hash) => {
              const reqId = generateRequestId();
              const resp = await listTokensAction(
                { config, requestId: reqId },
                [{ field: 'token', operator: 'equals', value: hash }],
                { page: 1, limit: 1 }
              );
              const tok = (resp.apiResponse.data as Token[] | undefined)?.[0];
              if (tok) hashToToken.set(hash, tok);
            })
          );

          const tokenMap = new Map<string, Token[]>();
          const customerIds = new Set<string>();
          for (const { sub, sts } of subTokensResults) {
            const toks: Token[] = [];
            for (const st of sts) {
              const tok = hashToToken.get(st.token);
              if (tok) toks.push(tok);
            }
            if (toks.length > 0) tokenMap.set(sub.id, toks);
            if (!sub.customer && toks[0]?.customer) {
              const custId = typeof toks[0].customer === 'string' ? toks[0].customer : (toks[0].customer as { id: string })?.id;
              if (custId) {
                sub.customer = custId;
                customerIds.add(custId);
              }
            } else if (typeof sub.customer === 'string') {
              customerIds.add(sub.customer);
            }
          }
          setSubTokenMap(tokenMap);

          // Fetch each customer by id — avoids the same 100-record pagination trap
          if (customerIds.size > 0) {
            const custMap = new Map<string, Customer>();
            await Promise.all(
              Array.from(customerIds).map(async (custId) => {
                const reqId = generateRequestId();
                const resp = await getCustomerAction({ config, requestId: reqId }, custId);
                const custData = resp.apiResponse.data as Customer[] | Customer | undefined;
                const cust = Array.isArray(custData) ? custData[0] : custData;
                if (cust) custMap.set(cust.id, cust);
              })
            );
            for (const sub of data) {
              const custId = typeof sub.customer === 'string' ? sub.customer : undefined;
              if (custId && custMap.has(custId)) {
                sub.customer = custMap.get(custId)!;
              }
            }
          }

          setSubscriptions([...data]); // trigger re-render with enriched data
        } catch (enrichErr) {
          console.error('Subscription enrichment failed:', enrichErr);
          // Subscriptions already displayed — enrichment is best-effort
        }
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
          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Merchant</TableHead>
                  <TableHead>Login</TableHead>
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
                    <TableCell colSpan={12} className="text-center py-8">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : subscriptions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-8 text-muted-foreground">
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
                      <TableCell className="font-mono text-xs text-muted-foreground" onClick={(e) => e.stopPropagation()}>
                        {subscription.merchant ? (
                          <Link
                            href={`/platform/merchants/${subscription.merchant}`}
                            className="hover:underline"
                          >
                            {subscription.merchant}
                          </Link>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {subscription.login || '-'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {(() => {
                          const toks = subTokenMap.get(subscription.id);
                          if (!toks || toks.length === 0) return '-';
                          const first = toks[0];
                          const last4 = first.payment?.number ? `•••• ${first.payment.number}` : '';
                          const exp = first.expiration ? `${String(first.expiration).slice(0, 2)}/${String(first.expiration).slice(2)}` : '';
                          const label = last4 ? `${last4} ${exp}`.trim() : exp || first.id.slice(-8);
                          return (
                            <span className="flex items-center gap-1">
                              {label}
                              {toks.length > 1 && (
                                <span className="inline-flex items-center justify-center rounded-full bg-muted px-1.5 py-0.5 text-xs font-medium">
                                  +{toks.length - 1}
                                </span>
                              )}
                            </span>
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        {(() => { const s = getStatusInfo(subscription); return <Badge variant={s.variant}>{s.label}</Badge>; })()}
                      </TableCell>
                      <TableCell>{formatCurrency(getSubscriptionAmount(subscription), subscription.currency)}</TableCell>
                      <TableCell className="text-sm">
                        {formatPayrixInt(subscription.start, 'MMM d, yyyy', timezone) || '-'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatPayrixInt(subscription.finish, 'MMM d, yyyy', timezone) || '-'}
                      </TableCell>
                      <TableCell className="text-sm text-center">
                        {subscription.cyclesPaid ?? '-'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatPayrixTimestamp(subscription.created, 'MMM d, yyyy', timezone) || '-'}
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

      <PlatformApiResultPanel
        config={config}
        endpoint="/subscriptions"
        method="GET"
        requestPreview={{ filters: lastFilters ?? [], pagination: { page: currentPage, limit } }}
        result={result}
        loading={loading}
        searchFilters={lastFilters}
        pagination={{ page: currentPage, limit }}
      />
    </div>
  );
}
