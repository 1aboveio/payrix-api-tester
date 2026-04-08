'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CreditCard, Trash2, History } from 'lucide-react';
import { format } from 'date-fns';

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
import { activePlatform } from '@/lib/config';
import { usePayrixConfig } from '@/hooks/use-payrix-config';
import { getSubscriptionAction, updateSubscriptionAction, deleteSubscriptionAction, getPlanAction, listTransactionsAction, listTokensAction } from '@/actions/platform';
import type { Subscription, UpdateSubscriptionRequest, Transaction, Token } from '@/lib/platform/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getSubscriptionAmount, getSubscriptionPlanName, getSubscriptionPlanId, getSubscriptionCustomerName, getSubscriptionCustomerId } from '@/lib/platform/types';
import { toast } from '@/lib/toast';
import { generateRequestId } from '@/lib/payrix/identifiers';
import { PlatformApiResultPanel } from '@/components/platform/api-result-panel';
import type { ServerActionResult } from '@/lib/payrix/types';

function toPayrixDate(dateStr: string): number {
  return parseInt(dateStr.replace(/-/g, ''));
}

function fromPayrixInt(num?: number): string {
  if (!num) return '';
  const s = String(num);
  if (s.length !== 8) return '';
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
}

export default function SubscriptionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const subscriptionId = params.id as string;
  const { config } = usePayrixConfig();
  const platform = activePlatform(config);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [requestPreview, setRequestPreview] = useState<unknown>({});
  const [result, setResult] = useState<ServerActionResult<unknown> | null>(null);
  const [panelMethod, setPanelMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE'>('GET');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txnsLoading, setTxnsLoading] = useState(false);
  const [boundToken, setBoundToken] = useState<Token | null>(null);

  const [formData, setFormData] = useState({
    start: '',
    finish: '',
    origin: '2',
    descriptor: '',
    txnDescription: '',
    inactive: '0',
    frozen: '0',
  });

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!platform.platformApiKey || !subscriptionId) {
        setLoading(false);
        return;
      }

      try {
        const requestId = generateRequestId();
        const response = await getSubscriptionAction({ config, requestId }, subscriptionId);
        setResult(response as ServerActionResult<unknown>);

        if (response.apiResponse.error) {
          toast.error(`Failed to load subscription: ${response.apiResponse.error}`);
          return;
        }

        const data = response.apiResponse.data as Subscription[] | Subscription | undefined;
        const sub = Array.isArray(data) ? data[0] : data;
        if (sub) {
          // Enrich with plan data
          if (typeof sub.plan === 'string' && sub.plan) {
            try {
              const planRequestId = generateRequestId();
              const planResult = await getPlanAction({ config, requestId: planRequestId }, sub.plan);
              if (!planResult.apiResponse.error) {
                const planData = planResult.apiResponse.data as import('@/lib/platform/types').Plan[] | import('@/lib/platform/types').Plan | undefined;
                const planObj = Array.isArray(planData) ? planData[0] : planData;
                if (planObj) sub.plan = planObj;
              }
            } catch { /* plan enrichment is best-effort */ }
          }
          setSubscription(sub);
          setFormData({
            start: fromPayrixInt(sub.start),
            finish: fromPayrixInt(sub.finish),
            origin: sub.origin != null ? String(sub.origin) : '2',
            descriptor: '',
            txnDescription: '',
            inactive: String(sub.inactive),
            frozen: String(sub.frozen),
          });
        }
      } catch (err) {
        toast.error('Failed to load subscription');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [platform.platformApiKey, subscriptionId]);

  // Resolve bound token (with last4) from embedded subscriptionTokens
  useEffect(() => {
    const resolveToken = async () => {
      if (!platform.platformApiKey || !subscription) return;

      // Get bound token hash from embedded subscriptionTokens
      const boundSt = subscription.subscriptionTokens?.[0];
      if (!boundSt?.token) return;

      // Fetch token with expand[payment][] to get last4
      try {
        const tokReqId = generateRequestId();
        const tokResponse = await listTokensAction({ config, requestId: tokReqId }, undefined, { page: 1, limit: 50 });
        const tokData = tokResponse.apiResponse.data as Token[] | undefined;
        const matched = tokData?.find(t => t.token === boundSt.token);
        if (matched) {
          setBoundToken(matched);
          // Enrich subscription with customer from token
          if (!subscription.customer && matched.customer) {
            const custId = typeof matched.customer === 'string' ? matched.customer : (matched.customer as { id: string })?.id;
            if (custId) setSubscription(prev => prev ? { ...prev, customer: custId } : prev);
          }
        }
      } catch { /* best-effort */ }
    };

    resolveToken();
  }, [subscription?.id, platform.platformApiKey]);

  // Fetch payment history using server-side subscription[equals] filter
  useEffect(() => {
    const fetchTransactions = async () => {
      if (!platform.platformApiKey || !subscriptionId) return;

      setTxnsLoading(true);
      try {
        const txnRequestId = generateRequestId();
        const txnResponse = await listTransactionsAction(
          { config, requestId: txnRequestId },
          [{ field: 'subscription', operator: 'equals', value: subscriptionId }],
          { page: 1, limit: 50 }
        );
        if (!txnResponse.apiResponse.error) {
          const txnData = txnResponse.apiResponse.data as Transaction[] | undefined;
          if (txnData) {
            setTransactions(txnData);
          }
        }
      } catch (err) {
        console.error('Failed to load transactions', err);
      } finally {
        setTxnsLoading(false);
      }
    };

    fetchTransactions();
  }, [platform.platformApiKey, subscriptionId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setSaving(true);
    setPanelMethod('PUT');
    try {
      const requestId = generateRequestId();
      const body: UpdateSubscriptionRequest = {
        start: formData.start ? toPayrixDate(formData.start) : undefined,
        finish: formData.finish ? toPayrixDate(formData.finish) : undefined,
        origin: parseInt(formData.origin),
        descriptor: formData.descriptor || undefined,
        txnDescription: formData.txnDescription || undefined,
        inactive: parseInt(formData.inactive),
        frozen: parseInt(formData.frozen),
      };
      setRequestPreview(body);

      const response = await updateSubscriptionAction({ config, requestId }, subscriptionId, body);
      setResult(response as ServerActionResult<unknown>);

      if (response.apiResponse.error) {
        toast.error(response.apiResponse.error);
        return;
      }

      toast.success('Subscription updated successfully');
    } catch (error) {
      toast.error('Failed to update subscription');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this subscription?')) return;

    setDeleting(true);
    try {
      const requestId = generateRequestId();
      const response = await deleteSubscriptionAction({ config, requestId }, subscriptionId);
      if (response.apiResponse.error) {
        toast.error(response.apiResponse.error);
        return;
      }
      toast.success('Subscription deleted successfully');
      router.push('/platform/subscriptions');
    } catch (err) {
      toast.error('Failed to delete subscription');
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">Loading subscription...</div>
      </div>
    );
  }

  const isActive = formData.inactive === '0';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button asChild variant="outline" size="sm">
          <Link href="/platform/subscriptions">
            <ArrowLeft className="mr-2 size-4" />
            Back to Subscriptions
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          {isActive && (
            <Button asChild size="sm">
              <Link href={`/platform/checkout?subscriptionId=${subscriptionId}`}>
                <CreditCard className="mr-2 size-4" />
                Pay &amp; Subscribe
              </Link>
            </Button>
          )}
          <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
            <Trash2 className="mr-2 size-4" />
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>

      {/* Read-only info from the fetched subscription */}
      {subscription && (
        <Card>
          <CardHeader>
            <CardTitle>Subscription Info</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">ID</span>
              <span className="font-mono">{subscription.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge variant={subscription.inactive === 0 ? (subscription.frozen === 0 ? 'default' : 'destructive') : 'secondary'}>
                {subscription.frozen === 1 ? 'Frozen' : subscription.inactive === 0 ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Customer</span>
              <Link
                href={`/platform/customers/${getSubscriptionCustomerId(subscription)}`}
                className="hover:underline"
              >
                {getSubscriptionCustomerName(subscription)}
              </Link>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Plan</span>
              <Link
                href={`/platform/plans/${getSubscriptionPlanId(subscription)}`}
                className="hover:underline"
              >
                {getSubscriptionPlanName(subscription)}
              </Link>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-semibold">
                {(() => { const amt = getSubscriptionAmount(subscription); return amt != null ? new Intl.NumberFormat('en-US', { style: 'currency', currency: subscription.currency || 'USD' }).format(amt / 100) : '-'; })()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment Method</span>
              {boundToken ? (
                <Link href={`/platform/tokens/${boundToken.id}`} className="hover:underline">
                  {boundToken.payment?.number
                    ? `•••• ${boundToken.payment.number}`
                    : ''}{boundToken.expiration
                    ? ` (${String(boundToken.expiration).slice(0, 2)}/${String(boundToken.expiration).slice(2)})`
                    : ''}
                  {!boundToken.payment?.number && !boundToken.expiration ? boundToken.id : ''}
                </Link>
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Subscription Details</CardTitle>
            <CardDescription>View and edit subscription details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="start">Start Date</Label>
                <Input
                  id="start"
                  type="date"
                  value={formData.start}
                  onChange={(e) => setFormData({ ...formData, start: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="finish">End Date</Label>
                <Input
                  id="finish"
                  type="date"
                  value={formData.finish}
                  onChange={(e) => setFormData({ ...formData, finish: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="origin">Origin</Label>
                <Select
                  value={formData.origin}
                  onValueChange={(value) => setFormData({ ...formData, origin: value })}
                >
                  <SelectTrigger id="origin">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">eCommerce</SelectItem>
                    <SelectItem value="3">Mail / Phone</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="inactive">Status</Label>
                <Select
                  value={formData.inactive}
                  onValueChange={(value) => setFormData({ ...formData, inactive: value })}
                >
                  <SelectTrigger id="inactive">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Active</SelectItem>
                    <SelectItem value="1">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="frozen">Frozen</Label>
                <Select
                  value={formData.frozen}
                  onValueChange={(value) => setFormData({ ...formData, frozen: value })}
                >
                  <SelectTrigger id="frozen">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">No</SelectItem>
                    <SelectItem value="1">Yes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descriptor">Descriptor</Label>
                <Input
                  id="descriptor"
                  value={formData.descriptor}
                  onChange={(e) => setFormData({ ...formData, descriptor: e.target.value })}
                  placeholder="Statement descriptor"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="txnDescription">Transaction Description</Label>
                <Input
                  id="txnDescription"
                  value={formData.txnDescription}
                  onChange={(e) => setFormData({ ...formData, txnDescription: e.target.value })}
                  placeholder="Description for transactions"
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

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="size-5" />
            Payment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {txnsLoading ? (
            <p className="text-center py-4 text-muted-foreground">Loading transactions...</p>
          ) : transactions.length === 0 ? (
            <p className="text-center py-4 text-muted-foreground">No payments recorded yet.</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Card</TableHead>
                    <TableHead>Auth Code</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((txn) => (
                    <TableRow key={txn.id}>
                      <TableCell className="text-sm">
                        {txn.created ? format(new Date(txn.created), 'MMM d, yyyy HH:mm') : '-'}
                      </TableCell>
                      <TableCell className="font-medium">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: txn.currency || 'USD' }).format((txn.total ?? txn.amount) / 100)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={txn.status === 2 ? 'destructive' : txn.status === 5 ? 'secondary' : 'default'}>
                          {txn.status === 0 ? 'Pending' : txn.status === 1 ? 'Approved' : txn.status === 2 ? 'Failed' : txn.status === 3 ? 'Captured' : txn.status === 4 ? 'Settled' : txn.status === 5 ? 'Returned' : String(txn.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {txn.last4 ? `•••• ${txn.last4}` : '-'}
                      </TableCell>
                      <TableCell className="text-sm font-mono">
                        {txn.authCode || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <PlatformApiResultPanel
        config={config}
        endpoint={`/subscriptions/${subscriptionId}`}
        method={panelMethod}
        requestPreview={requestPreview}
        result={result}
        loading={loading || saving}
      />
    </div>
  );
}
