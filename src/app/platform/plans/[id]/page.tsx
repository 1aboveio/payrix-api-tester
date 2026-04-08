'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { activePlatform } from '@/lib/config';
import { usePayrixConfig } from '@/hooks/use-payrix-config';
import { getPlanAction, updatePlanAction, deletePlanAction } from '@/actions/platform';
import type { Plan, UpdatePlanRequest } from '@/lib/platform/types';
import { getPlanCycleLabel } from '@/lib/platform/types';
import { toast } from '@/lib/toast';
import { generateRequestId } from '@/lib/payrix/identifiers';
import { PlatformApiResultPanel } from '@/components/platform/api-result-panel';
import type { ServerActionResult } from '@/lib/payrix/types';

const CYCLE_TO_SCHEDULE: Record<string, string> = {
  daily: '1',
  weekly: '2',
  monthly: '3',
  yearly: '4',
};

const SCHEDULE_OPTIONS = [
  { value: '1', label: 'Daily' },
  { value: '2', label: 'Weekly' },
  { value: '3', label: 'Monthly' },
  { value: '4', label: 'Yearly' },
];

export default function PlanDetailPage() {
  const router = useRouter();
  const params = useParams();
  const planId = params.id as string;
  const { config } = usePayrixConfig();
  const platform = activePlatform(config);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [requestPreview, setRequestPreview] = useState<unknown>({});
  const [result, setResult] = useState<ServerActionResult<unknown> | null>(null);
  const [panelMethod, setPanelMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE'>('GET');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    amount: '',
    schedule: '3',
    scheduleFactor: '1',
    type: 'recurring',
    maxFailures: '',
  });

  useEffect(() => {
    const fetchPlan = async () => {
      if (!platform.platformApiKey || !planId) {
        setLoading(false);
        return;
      }

      try {
        const requestId = generateRequestId();
        const response = await getPlanAction({ config, requestId }, planId);
        setResult(response as ServerActionResult<unknown>);

        if (response.apiResponse.error) {
          toast.error(`Failed to load plan: ${response.apiResponse.error}`);
          return;
        }

        const data = response.apiResponse.data as Plan[] | Plan | undefined;
        const plan = Array.isArray(data) ? data[0] : data;
        if (plan) {
          setPlan(plan);
          setFormData({
            name: plan.name || '',
            description: plan.description || '',
            amount: (plan.amount / 100).toFixed(2),
            schedule: plan.schedule ? String(plan.schedule) : (CYCLE_TO_SCHEDULE[plan.cycle || ''] || '3'),
            scheduleFactor: plan.scheduleFactor != null ? String(plan.scheduleFactor) : '1',
            type: plan.type || 'recurring',
            maxFailures: plan.maxFailures != null ? String(plan.maxFailures) : '',
          });
        }
      } catch (err) {
        toast.error('Failed to load plan');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, [platform.platformApiKey, planId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.amount) {
      toast.error('Amount is required');
      return;
    }

    const amountCents = Math.round(parseFloat(formData.amount) * 100);
    if (isNaN(amountCents) || amountCents <= 0) {
      toast.error('Amount must be a positive number');
      return;
    }

    setSaving(true);
    setPanelMethod('PUT');
    try {
      const requestId = generateRequestId();
      const body: UpdatePlanRequest = {
        name: formData.name || undefined,
        description: formData.description || undefined,
        amount: amountCents,
        schedule: parseInt(formData.schedule),
        scheduleFactor: parseInt(formData.scheduleFactor) || undefined,
        type: formData.type || undefined,
        maxFailures: formData.maxFailures ? parseInt(formData.maxFailures) : undefined,
      };
      setRequestPreview(body);

      const response = await updatePlanAction({ config, requestId }, planId, body);
      setResult(response as ServerActionResult<unknown>);

      if (response.apiResponse.error) {
        toast.error(response.apiResponse.error);
        return;
      }

      toast.success('Plan updated successfully');
    } catch (error) {
      toast.error('Failed to update plan');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this plan?')) return;

    setDeleting(true);
    try {
      const requestId = generateRequestId();
      const response = await deletePlanAction({ config, requestId }, planId);
      if (response.apiResponse.error) {
        toast.error(response.apiResponse.error);
        return;
      }
      toast.success('Plan deleted successfully');
      router.push('/platform/plans');
    } catch (err) {
      toast.error('Failed to delete plan');
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">Loading plan...</div>
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

        <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
          <Trash2 className="mr-2 size-4" />
          {deleting ? 'Deleting...' : 'Delete'}
        </Button>
      </div>

      {plan && (
        <Card>
          <CardHeader>
            <CardTitle>Plan Info</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">ID</span>
              <span className="font-mono">{plan.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge variant={plan.inactive === 0 ? 'default' : 'secondary'}>
                {plan.inactive === 0 ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Merchant</span>
              <span className="font-mono">{plan.merchant}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cycle</span>
              <span>{getPlanCycleLabel(plan)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Plan Details</CardTitle>
            <CardDescription>View and edit plan details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Plan Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Monthly Pro"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount (USD) *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="29.99"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="schedule">Billing Cycle</Label>
                <Select
                  value={formData.schedule}
                  onValueChange={(value) => setFormData({ ...formData, schedule: value })}
                >
                  <SelectTrigger id="schedule">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SCHEDULE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="scheduleFactor">Schedule Factor</Label>
                <Input
                  id="scheduleFactor"
                  type="number"
                  min="1"
                  value={formData.scheduleFactor}
                  onChange={(e) => setFormData({ ...formData, scheduleFactor: e.target.value })}
                  placeholder="1"
                />
                <p className="text-xs text-muted-foreground">e.g. 2 with Monthly = every 2 months</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recurring">Recurring</SelectItem>
                    <SelectItem value="installment">Installment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxFailures">Max Failures</Label>
                <Input
                  id="maxFailures"
                  type="number"
                  min="0"
                  value={formData.maxFailures}
                  onChange={(e) => setFormData({ ...formData, maxFailures: e.target.value })}
                  placeholder="e.g. 3"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Plan description"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      <PlatformApiResultPanel
        config={config}
        endpoint={`/plans/${planId}`}
        method={panelMethod}
        requestPreview={requestPreview}
        result={result}
        loading={loading || saving}
      />
    </div>
  );
}
