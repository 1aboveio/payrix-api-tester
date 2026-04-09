'use client';

import { useEffect, useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { activePlatform } from '@/lib/config';
import { usePayrixConfig } from '@/hooks/use-payrix-config';
import { createPlanAction } from '@/actions/platform';
import type { CreatePlanRequest } from '@/lib/platform/types';
import { toast } from '@/lib/toast';
import { generateRequestId } from '@/lib/payrix/identifiers';
import { PlatformApiResultPanel } from '@/components/platform/api-result-panel';
import type { ServerActionResult } from '@/lib/payrix/types';

const SCHEDULE_OPTIONS = [
  { value: '1', label: 'Daily' },
  { value: '2', label: 'Weekly' },
  { value: '3', label: 'Monthly' },
  { value: '4', label: 'Yearly' },
];

export default function CreatePlanPage() {
  const router = useRouter();
  const { config } = usePayrixConfig();
  const platform = activePlatform(config);
  const [loading, setLoading] = useState(false);
  const [requestPreview, setRequestPreview] = useState<unknown>({});
  const [result, setResult] = useState<ServerActionResult<unknown> | null>(null);

  const [formData, setFormData] = useState({
    merchant: platform.platformMerchant || '',
    name: '',
    description: '',
    amount: '',
    schedule: '3',
    scheduleFactor: '1',
    type: 'recurring',
    maxFailures: '',
  });

  // Keep merchant in sync with async config resolution
  useEffect(() => {
    if (platform.platformMerchant && !formData.merchant) {
      setFormData((prev) => ({ ...prev, merchant: platform.platformMerchant! }));
    }
  }, [platform.platformMerchant]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!platform.platformApiKey) {
      toast.error('Platform API key not configured');
      return;
    }

    if (!formData.merchant || !formData.name || !formData.amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    const amountCents = Math.round(parseFloat(formData.amount) * 100);
    if (isNaN(amountCents) || amountCents <= 0) {
      toast.error('Amount must be a positive number');
      return;
    }

    setLoading(true);
    try {
      const requestId = generateRequestId();
      const body: CreatePlanRequest = {
        merchant: formData.merchant,
        name: formData.name || undefined,
        description: formData.description || undefined,
        amount: amountCents,
        schedule: parseInt(formData.schedule),
        scheduleFactor: parseInt(formData.scheduleFactor) || undefined,
        type: formData.type || undefined,
        maxFailures: formData.maxFailures ? parseInt(formData.maxFailures) : undefined,
      };
      setRequestPreview(body);

      const result = await createPlanAction({ config, requestId }, body);
      setResult(result as ServerActionResult<unknown>);

      if (result.apiResponse.error) {
        toast.error(result.apiResponse.error);
        return;
      }

      toast.success('Plan created successfully');
      router.push('/platform/plans');
    } catch (error) {
      toast.error('Failed to create plan');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href="/platform/plans">
            <ArrowLeft className="mr-2 size-4" />
            Back to Plans
          </Link>
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Create Plan</CardTitle>
            <CardDescription>Create a new billing plan.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="merchant">Merchant ID</Label>
                <Input
                  id="merchant"
                  value={formData.merchant}
                  readOnly
                  className="bg-muted"
                />
                {formData.merchant && (
                  <p className="text-xs text-muted-foreground">Auto-resolved from API key</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Plan Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Monthly Pro"
                  required
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
                <Label htmlFor="schedule">Billing Cycle *</Label>
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
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Plan'}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/platform/plans">Cancel</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      <PlatformApiResultPanel
        config={config}
        endpoint="/plans"
        method="POST"
        requestPreview={requestPreview}
        result={result}
        loading={loading}
      />
    </div>
  );
}
