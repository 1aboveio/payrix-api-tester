'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { ArrowLeft, Edit, Repeat, CreditCard } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { usePayrixConfig } from '@/hooks/use-payrix-config';
import { getSubscriptionAction } from '@/actions/platform';
import type { Subscription } from '@/lib/platform/types';
import { toast } from '@/lib/toast';
import { generateRequestId } from '@/lib/payrix/identifiers';

const SUBSCRIPTION_STATUS_COLORS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  'inactive': 'secondary',
  'active': 'default',
  'frozen': 'destructive',
};

export default function SubscriptionDetailPage() {
  const params = useParams();
  const subscriptionId = params.id as string;
  
  const { config } = usePayrixConfig();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!config.platformApiKey || !subscriptionId) return;

      setLoading(true);
      const requestId = generateRequestId();
      
      try {
        const response = await getSubscriptionAction({ config, requestId }, subscriptionId);
        
        if (response.apiResponse.error) {
          toast.error(`Failed to load subscription: ${response.apiResponse.error}`);
          return;
        }

        const data = response.apiResponse.data as Subscription[] | Subscription | undefined;
        const sub = Array.isArray(data) ? data[0] : data;
        if (sub) {
          setSubscription(sub);
        }
      } catch (err) {
        toast.error('Failed to load subscription');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [config.platformApiKey, subscriptionId]);

  const formatCurrency = (amount?: number, currency?: string) => {
    if (amount === undefined) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount / 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">Loading subscription...</div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Subscription not found</p>
        <Button asChild className="mt-4">
          <Link href="/platform/subscriptions">Back to Subscriptions</Link>
        </Button>
      </div>
    );
  }

  const isActive = subscription.status === 'active';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button asChild variant="outline" size="sm">
          <Link href="/platform/subscriptions">
            <ArrowLeft className="mr-2 size-4" />
            Back to Subscriptions
          </Link>
        </Button>

        <div className="flex gap-2">
          {isActive && (
            <Button asChild size="sm">
              <Link href={`/platform/checkout?subscriptionId=${subscription.id}`}>
                <CreditCard className="mr-2 size-4" />
                Pay
              </Link>
            </Button>
          )}

          <Button asChild variant="outline" size="sm">
            <Link href={`/platform/subscriptions/${subscription.id}/edit`}>
              <Edit className="mr-2 size-4" />
              Edit
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Repeat className="size-5" />
            Subscription Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">ID</span>
            <span className="font-mono">{subscription.id}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Status</span>
            <Badge variant={SUBSCRIPTION_STATUS_COLORS[subscription.status] || 'secondary'}>
              {subscription.status === 'active' ? 'active' : subscription.status === 'inactive' ? 'inactive' : subscription.status}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Customer</span>
            <Link 
              href={`/platform/customers/${typeof subscription.customer === 'string' ? subscription.customer : (subscription.customer as { id: string })?.id}`}
              className="font-mono text-sm hover:underline"
            >
              {typeof subscription.customer === 'string' ? subscription.customer : (subscription.customer as { id: string })?.id}
            </Link>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Plan</span>
            <Link 
              href={`/platform/plans/${typeof subscription.plan === 'string' ? subscription.plan : (subscription.plan as { id: string })?.id}`}
              className="font-mono text-sm hover:underline"
            >
              {typeof subscription.plan === 'string' ? subscription.plan : (subscription.plan as { id: string })?.id}
            </Link>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Amount</span>
            <span className="font-semibold">{formatCurrency(subscription.amount, subscription.currency)}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Start Date</span>
            <span>{subscription.startDate ? format(new Date(subscription.startDate), 'MMM d, yyyy') : '-'}</span>
          </div>

          {subscription.endDate && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">End Date</span>
              <span>{format(new Date(subscription.endDate), 'MMM d, yyyy')}</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Created</span>
            <span>{subscription.created ? format(new Date(subscription.created), 'MMM d, yyyy HH:mm') : '-'}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
