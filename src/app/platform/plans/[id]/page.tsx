'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { ArrowLeft, Edit, Calendar } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { usePayrixConfig } from '@/hooks/use-payrix-config';
import { getPlanAction } from '@/actions/platform';
import type { Plan } from '@/lib/platform/types';
import { toast } from '@/lib/toast';
import { generateRequestId } from '@/lib/payrix/identifiers';

export default function PlanDetailPage() {
  const params = useParams();
  const planId = params.id as string;
  
  const { config } = usePayrixConfig();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlan = async () => {
      if (!config.platformApiKey || !planId) return;

      setLoading(true);
      const requestId = generateRequestId();
      
      try {
        const response = await getPlanAction({ config, requestId }, planId);
        
        if (response.apiResponse.error) {
          toast.error(`Failed to load plan: ${response.apiResponse.error}`);
          return;
        }

        const data = response.apiResponse.data as Plan[] | Plan | undefined;
        const p = Array.isArray(data) ? data[0] : data;
        if (p) {
          setPlan(p);
        }
      } catch (err) {
        toast.error('Failed to load plan');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, [config.platformApiKey, planId]);

  const formatCurrency = (amount?: number, currency?: string) => {
    if (amount === undefined) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount / 100);
  };

  const formatCycle = (cycle?: string) => {
    if (!cycle) return '-';
    return cycle.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">Loading plan...</div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Plan not found</p>
        <Button asChild className="mt-4">
          <Link href="/platform/plans">Back to Plans</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button asChild variant="outline" size="sm">
          <Link href="/platform/plans">
            <ArrowLeft className="mr-2 size-4" />
            Back to Plans
          </Link>
        </Button>

        <Button asChild variant="outline" size="sm">
          <Link href={`/platform/plans/${plan.id}/edit`}>
            <Edit className="mr-2 size-4" />
            Edit
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="size-5" />
            {plan.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">ID</span>
            <span className="font-mono">{plan.id}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Status</span>
            <Badge variant={plan.inactive === 0 ? 'default' : 'secondary'}>
              {plan.inactive === 0 ? 'Active' : 'Inactive'}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Billing Cycle</span>
            <span>{formatCycle(plan.cycle)}</span>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Amount</span>
            <span className="font-semibold">{formatCurrency(plan.amount, plan.currency)}</span>
          </div>

          {plan.trialDays && plan.trialDays > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Trial Period</span>
              <span>{plan.trialDays} days</span>
            </div>
          )}

          {plan.description && (
            <>
              <Separator />
              <div>
                <span className="text-muted-foreground">Description</span>
                <p className="mt-1">{plan.description}</p>
              </div>
            </>
          )}

          <Separator />

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Created</span>
            <span>{plan.created ? format(new Date(plan.created), 'MMM d, yyyy HH:mm') : '-'}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
