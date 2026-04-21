'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { activePlatform } from '@/lib/config';
import { usePayrixConfig } from '@/hooks/use-payrix-config';
import { useTimezone } from '@/hooks/use-timezone';
import { formatInTz } from '@/lib/date-utils';
import { createSubscriptionAction, listPlansAction } from '@/actions/platform';
import type { CreateSubscriptionRequest, Plan } from '@/lib/platform/types';
import { getPlanCycleLabel } from '@/lib/platform/types';
import { toast } from '@/lib/toast';
import { generateRequestId } from '@/lib/payrix/identifiers';
import { PlatformApiResultPanel } from '@/components/platform/api-result-panel';
import type { ServerActionResult } from '@/lib/payrix/types';

function toPayrixDate(date: Date): number {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return parseInt(`${y}${m}${d}`);
}

function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addCycle(start: Date, schedule: number, factor: number): Date {
  const end = new Date(start);
  switch (schedule) {
    case 1: // daily
      end.setDate(end.getDate() + factor);
      break;
    case 2: // weekly
      end.setDate(end.getDate() + 7 * factor);
      break;
    case 3: // monthly
      end.setMonth(end.getMonth() + factor);
      break;
    case 4: // yearly
      end.setFullYear(end.getFullYear() + factor);
      break;
  }
  return end;
}

export default function CreateSubscriptionPage() {
  const router = useRouter();
  const { config } = usePayrixConfig();
  const { timezone } = useTimezone();
  const platform = activePlatform(config);
  const [loading, setLoading] = useState(false);
  const [requestPreview, setRequestPreview] = useState<unknown>({});
  const [result, setResult] = useState<ServerActionResult<unknown> | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);

  const [planId, setPlanId] = useState('');
  const [startMode, setStartMode] = useState<'today' | 'future'>('today');
  const [futureDate, setFutureDate] = useState('');
  const [cycles, setCycles] = useState('1');
  const [origin, setOrigin] = useState('2');
  const [descriptor, setDescriptor] = useState('');
  const [txnDescription, setTxnDescription] = useState('');

  const selectedPlan = plans.find(p => p.id === planId);
  const schedule = selectedPlan?.schedule || 3;
  const factor = selectedPlan?.scheduleFactor || 1;

  // Compute start and end dates based on selections
  const { startDate, endDate } = useMemo(() => {
    const start = startMode === 'today' ? new Date() : (futureDate ? new Date(futureDate + 'T00:00:00') : null);
    if (!start || !selectedPlan) return { startDate: null, endDate: null };

    const numCycles = parseInt(cycles) || 1;
    const end = addCycle(start, schedule, factor * numCycles);

    return { startDate: start, endDate: end };
  }, [startMode, futureDate, selectedPlan, cycles, schedule, factor]);

  // Minimum future date = tomorrow
  const minFutureDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return toDateString(d);
  }, []);

  // Fetch plans for the dropdown
  useEffect(() => {
    const fetchPlans = async () => {
      if (!platform.platformApiKey) return;

      setPlansLoading(true);
      try {
        const requestId = generateRequestId();
        const response = await listPlansAction({ config, requestId }, undefined, { page: 1, limit: 100 });
        const data = response.apiResponse.data as Plan[] | undefined;
        if (data) {
          setPlans(data.filter(p => p.inactive === 0));
        }
      } catch (err) {
        console.error('Failed to load plans', err);
      } finally {
        setPlansLoading(false);
      }
    };

    fetchPlans();
  }, [platform.platformApiKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!platform.platformApiKey) {
      toast.error('Platform API key not configured');
      return;
    }

    if (!planId || !startDate || !endDate) {
      toast.error('Please select a plan and configure the billing period');
      return;
    }

    setLoading(true);
    try {
      const requestId = generateRequestId();
      const body: CreateSubscriptionRequest = {
        plan: planId,
        start: toPayrixDate(startDate),
        finish: toPayrixDate(endDate),
        origin: parseInt(origin),
        descriptor: descriptor || undefined,
        txnDescription: txnDescription || undefined,
      };
      setRequestPreview(body);

      const result = await createSubscriptionAction({ config, requestId }, body);
      setResult(result as ServerActionResult<unknown>);

      if (result.apiResponse.error) {
        toast.error(result.apiResponse.error);
        return;
      }

      toast.success('Subscription created successfully');

      const data = result.apiResponse.data as { id?: string }[] | { id?: string } | undefined;
      const newSub = Array.isArray(data) ? data[0] : data;
      router.push(newSub?.id ? `/platform/subscriptions/${newSub.id}` : '/platform/subscriptions');
    } catch (error) {
      toast.error('Failed to create subscription');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const cycleLabel = selectedPlan ? getPlanCycleLabel(selectedPlan).toLowerCase() : 'period';

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href="/platform/subscriptions">
            <ArrowLeft className="mr-2 size-4" />
            Back to Subscriptions
          </Link>
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Create Subscription</CardTitle>
            <CardDescription>Create a new subscription based on a billing plan.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Plan */}
            <div className="space-y-2">
              <Label htmlFor="plan">Plan *</Label>
              {plans.length > 0 ? (
                <Select value={planId} onValueChange={setPlanId}>
                  <SelectTrigger id="plan">
                    <SelectValue placeholder={plansLoading ? 'Loading plans...' : 'Select a plan'} />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name || plan.id} — {new Intl.NumberFormat('en-US', { style: 'currency', currency: plan.currency || 'USD' }).format(plan.amount / 100)}/{getPlanCycleLabel(plan)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="plan"
                  value={planId}
                  onChange={(e) => setPlanId(e.target.value)}
                  placeholder="Plan ID"
                  required
                />
              )}
              {selectedPlan?.description && (
                <p className="text-xs text-muted-foreground">{selectedPlan.description}</p>
              )}
            </div>

            {/* Step 2: Billing Period (only shown after plan selected) */}
            {selectedPlan && (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Start *</Label>
                    <Select value={startMode} onValueChange={(v) => setStartMode(v as 'today' | 'future')}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="today">Start today</SelectItem>
                        <SelectItem value="future">Start from a future date</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {startMode === 'future' && (
                    <div className="space-y-2">
                      <Label htmlFor="futureDate">Start Date</Label>
                      <Input
                        id="futureDate"
                        type="date"
                        value={futureDate}
                        min={minFutureDate}
                        onChange={(e) => setFutureDate(e.target.value)}
                        required
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="cycles">Number of {cycleLabel} cycles</Label>
                    <Input
                      id="cycles"
                      type="number"
                      min="1"
                      value={cycles}
                      onChange={(e) => setCycles(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Origin</Label>
                    <Select value={origin} onValueChange={setOrigin}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">eCommerce</SelectItem>
                        <SelectItem value="3">Mail / Phone</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Computed period summary */}
                {startDate && endDate && (
                  <div className="rounded-md border p-4 bg-muted/50 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Billing cycle</span>
                      <span className="font-medium">{getPlanCycleLabel(selectedPlan)}{factor > 1 ? ` (every ${factor})` : ''}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Start</span>
                      <span>{formatInTz(startDate, 'MMM d, yyyy', timezone)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">End</span>
                      <span>{formatInTz(endDate, 'MMM d, yyyy', timezone)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total charges</span>
                      <span>{cycles} × {new Intl.NumberFormat('en-US', { style: 'currency', currency: selectedPlan.currency || 'USD' }).format(selectedPlan.amount / 100)}</span>
                    </div>
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="descriptor">Descriptor</Label>
                    <Input
                      id="descriptor"
                      value={descriptor}
                      onChange={(e) => setDescriptor(e.target.value)}
                      placeholder="Statement descriptor"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="txnDescription">Transaction Description</Label>
                    <Input
                      id="txnDescription"
                      value={txnDescription}
                      onChange={(e) => setTxnDescription(e.target.value)}
                      placeholder="Description for transactions"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading || !planId || !startDate}>
                {loading ? 'Creating...' : 'Create Subscription'}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/platform/subscriptions">Cancel</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      <PlatformApiResultPanel
        config={config}
        endpoint="/subscriptions"
        method="POST"
        requestPreview={requestPreview}
        result={result}
        loading={loading}
      />
    </div>
  );
}
