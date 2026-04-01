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
import { listSubscriptionsAction } from '@/actions/platform';
import type { Subscription } from '@/lib/platform/types';
import { toast } from '@/lib/toast';
import { generateRequestId } from '@/lib/payrix/identifiers';
import { PaginationControls } from '@/components/platform/pagination-controls';
import type { ServerActionResult } from '@/lib/payrix/types';

const SUBSCRIPTION_STATUS_COLORS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  active: 'default',
  inactive: 'secondary',
  cancelled: 'destructive',
  suspended: 'outline',
};

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
        setSubscriptions(data);
        // Estimate total pages - in a real implementation you'd get this from API
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
                  <TableHead>ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : subscriptions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No subscriptions found
                    </TableCell>
                  </TableRow>
                ) : (
                  subscriptions.map((subscription) => (
                    <TableRow key={subscription.id} className="cursor-pointer" onClick={() => router.push(`/platform/subscriptions/${subscription.id}`)}>
                      <TableCell className="font-mono text-sm">{subscription.id}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {typeof subscription.plan === 'string' ? subscription.plan : subscription.plan?.id}
                      </TableCell>
                      <TableCell>
                        <Badge variant={SUBSCRIPTION_STATUS_COLORS[subscription.status] || 'secondary'}>
                          {subscription.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(subscription.amount, subscription.currency)}</TableCell>
                      <TableCell>
                        {subscription.startDate ? format(new Date(subscription.startDate), 'MMM d, yyyy') : '-'}
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
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/checkout?subscriptionId=${subscription.id}`); }}>
                              Pay Now
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
