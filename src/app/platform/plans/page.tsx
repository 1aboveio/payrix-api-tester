'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MoreHorizontal, Plus, Search, Calendar } from 'lucide-react';

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
import { activePlatform } from '@/lib/config';
import { usePayrixConfig } from '@/hooks/use-payrix-config';
import { listPlansAction } from '@/actions/platform';
import type { Plan, PlatformSearchFilter } from '@/lib/platform/types';
import { getPlanCycleLabel } from '@/lib/platform/types';
import { toast } from '@/lib/toast';
import { generateRequestId } from '@/lib/payrix/identifiers';
import { PaginationControls } from '@/components/platform/pagination-controls';
import type { ServerActionResult } from '@/lib/payrix/types';
import { formatPayrixTimestamp } from '@/lib/date-utils';
import { useTimezone } from '@/hooks/use-timezone';

export default function PlansPage() {
  const router = useRouter();
  const { config } = usePayrixConfig();
  const { timezone } = useTimezone();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [result, setResult] = useState<ServerActionResult<unknown> | null>(null);

  const fetchPlans = async (page: number = currentPage, pageLimit: number = limit) => {
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
      if (searchQuery) filters.push({ field: 'name', operator: 'like', value: searchQuery });

      const response = await listPlansAction(
        { config, requestId },
        filters.length > 0 ? filters : undefined,
        { page, limit: pageLimit }
      );
      
      setResult(response);
      
      if (response.apiResponse.error) {
        toast.error(`Failed to load plans: ${response.apiResponse.error}`);
        return;
      }

      const data = response.apiResponse.data as Plan[] | undefined;
      if (data) {
        setPlans(data);
        setTotalPages(Math.max(1, Math.ceil(data.length / pageLimit)));
      }
    } catch (err) {
      toast.error('Failed to load plans');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [config.platformApiKey]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchPlans(page, limit);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setCurrentPage(1);
    fetchPlans(1, newLimit);
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchPlans(1, limit);
  };

  const formatCurrency = (amount?: number, currency?: string) => {
    if (amount === undefined) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount / 100);
  };

  // formatCycle removed — using getPlanCycleLabel from types instead

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="size-5" />
              Plans
            </CardTitle>
            <CardDescription>Manage billing plans</CardDescription>
          </div>
          <Button asChild>
            <Link href="/platform/plans/create">
              <Plus className="mr-2 size-4" />
              Create Plan
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="flex gap-2">
            <Input
              placeholder="Search by name..."
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
                  <TableHead>Name</TableHead>
                  <TableHead>Cycle</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
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
                ) : plans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No plans found
                    </TableCell>
                  </TableRow>
                ) : (
                  plans.map((plan) => (
                    <TableRow key={plan.id} className="cursor-pointer" onClick={() => router.push(`/platform/plans/${plan.id}`)}>
                      <TableCell className="font-medium">{plan.name}</TableCell>
                      <TableCell>{getPlanCycleLabel(plan)}</TableCell>
                      <TableCell>{formatCurrency(plan.amount, plan.currency)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                        {plan.description || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={plan.inactive === 0 ? 'default' : 'secondary'}>
                          {plan.inactive === 0 ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatPayrixTimestamp(plan.created, 'MMM d, yyyy', timezone) || '-'}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/platform/plans/${plan.id}`); }}>
                              View Details
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
