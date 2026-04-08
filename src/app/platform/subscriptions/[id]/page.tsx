'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CreditCard, Trash2, History, Plus } from 'lucide-react';
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
import { getSubscriptionAction, updateSubscriptionAction, deleteSubscriptionAction, getPlanAction, listTransactionsAction, listTokensAction, getCustomerAction, deleteSubscriptionTokenAction, createSubscriptionTokenAction, createTxnSessionAction } from '@/actions/platform';
import type { Subscription, UpdateSubscriptionRequest, Transaction, Token, Customer, SubscriptionToken } from '@/lib/platform/types';
import { getSubscriptionAmount, getSubscriptionPlanName, getSubscriptionPlanId, getSubscriptionCustomerName, getSubscriptionCustomerId } from '@/lib/platform/types';
import { TransactionTable } from '@/components/platform/transaction-table';
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
  const [boundTokens, setBoundTokens] = useState<{ subscriptionToken: SubscriptionToken; token: Token }[]>([]);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [addPaymentLoading, setAddPaymentLoading] = useState(false);
  const [payFieldsReady, setPayFieldsReady] = useState(false);
  const payFieldsReadyRef = useRef(false);

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

  // Resolve all bound tokens (with last4) and customer (with email)
  useEffect(() => {
    const resolveTokensAndCustomer = async () => {
      if (!platform.platformApiKey || !subscription) return;

      const sts = subscription.subscriptionTokens;
      if (!sts || sts.length === 0) return;

      try {
        // Fetch all tokens with expand[payment][] for last4
        const tokReqId = generateRequestId();
        const tokResponse = await listTokensAction({ config, requestId: tokReqId }, undefined, { page: 1, limit: 100 });
        const tokData = tokResponse.apiResponse.data as Token[] | undefined;
        if (!tokData) return;

        const hashToToken = new Map(tokData.map(t => [t.token, t]));
        const resolved: { subscriptionToken: SubscriptionToken; token: Token }[] = [];
        for (const st of sts) {
          const tok = hashToToken.get(st.token);
          if (tok) resolved.push({ subscriptionToken: st, token: tok });
        }
        setBoundTokens(resolved);

        // Resolve customer from the first token
        const firstTok = resolved[0]?.token;
        if (firstTok?.customer) {
          const custId = typeof firstTok.customer === 'string' ? firstTok.customer : (firstTok.customer as { id: string })?.id;
          if (custId) {
            try {
              const custReqId = generateRequestId();
              const custResult = await getCustomerAction({ config, requestId: custReqId }, custId);
              if (!custResult.apiResponse.error) {
                const custData = custResult.apiResponse.data as Customer[] | Customer | undefined;
                const cust = Array.isArray(custData) ? custData[0] : custData;
                if (cust) setSubscription(prev => prev ? { ...prev, customer: cust } : prev);
              }
            } catch { /* best-effort */ }
          }
        }
      } catch { /* best-effort */ }
    };

    resolveTokensAndCustomer();
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
          </CardContent>
        </Card>
      )}

      {/* Bound Tokens + Add New Payment */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="size-5" />
            Payment Methods ({boundTokens.length})
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowAddPayment(!showAddPayment)}
          >
            <Plus className="mr-2 size-4" />
            Add New Payment
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {boundTokens.map(({ subscriptionToken: st, token: tok }, i) => (
            <div key={st.id} className="flex items-center justify-between rounded-md border p-3">
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground font-mono">#{i + 1}</span>
                <div>
                  <Link href={`/platform/tokens/${tok.id}`} className="text-sm font-medium hover:underline">
                    {tok.payment?.number ? `•••• ${tok.payment.number}` : tok.id}
                    {tok.expiration ? ` (${String(tok.expiration).slice(0, 2)}/${String(tok.expiration).slice(2)})` : ''}
                  </Link>
                  <p className="text-xs text-muted-foreground font-mono">{tok.id}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={async () => {
                  if (!confirm('Remove this payment method from the subscription?')) return;
                  try {
                    const reqId = generateRequestId();
                    const res = await deleteSubscriptionTokenAction({ config, requestId: reqId }, st.id);
                    if (res.apiResponse.error) {
                      toast.error(res.apiResponse.error);
                    } else {
                      toast.success('Payment method removed');
                      setBoundTokens(prev => prev.filter(bt => bt.subscriptionToken.id !== st.id));
                    }
                  } catch {
                    toast.error('Failed to remove payment method');
                  }
                }}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
          {boundTokens.length === 0 && !showAddPayment && (
            <p className="text-center py-2 text-sm text-muted-foreground">No payment methods bound yet.</p>
          )}

          {/* Inline Add Payment Form */}
          {showAddPayment && (
            <AddPaymentForm
              config={config}
              subscriptionId={subscriptionId}
              onSuccess={(newSt, newTok) => {
                setBoundTokens(prev => [...prev, { subscriptionToken: newSt, token: newTok }]);
                setShowAddPayment(false);
                toast.success('Payment method added');
              }}
              onCancel={() => setShowAddPayment(false)}
            />
          )}
        </CardContent>
      </Card>

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
            <TransactionTable transactions={transactions} linkToDetail />
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

/** Inline form to add a new payment method via PayFields token mode */
function AddPaymentForm({
  config,
  subscriptionId,
  onSuccess,
  onCancel,
}: {
  config: import('@/lib/payrix/types').PayrixConfig;
  subscriptionId: string;
  onSuccess: (st: SubscriptionToken, tok: Token) => void;
  onCancel: () => void;
}) {
  const platform = activePlatform(config);
  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionKey, setSessionKey] = useState<string | null>(null);
  const readyCalledRef = useRef(false);

  // Create txnSession + load PayFields
  useEffect(() => {
    if (!platform.platformApiKey || !platform.platformLogin || !platform.platformMerchant) return;

    let cancelled = false;

    const init = async () => {
      // 1. Create txnSession
      const reqId = generateRequestId();
      const sessionResult = await createTxnSessionAction({ config, requestId: reqId }, {
        login: platform.platformLogin!,
        merchant: platform.platformMerchant!,
        configurations: { duration: 3600, maxTimesApproved: 1, maxTimesUse: 3 },
      });
      if (cancelled) return;
      const sessions = sessionResult.apiResponse.data as { key: string }[] | undefined;
      const key = Array.isArray(sessions) ? sessions[0]?.key : undefined;
      if (!key) {
        setError('Failed to create payment session');
        return;
      }
      setSessionKey(key);

      // 2. Load PayFields SDK
      const win = window as unknown as Record<string, unknown>;
      const payFieldsBaseUrl = config.globalEnvironment === 'test'
        ? 'https://test-api.payrix.com/payFieldsScript'
        : 'https://api.payrix.com/payFieldsScript';

      const loadScript = (src: string) => new Promise<void>((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
        const s = document.createElement('script');
        s.src = src;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.head.appendChild(s);
      });

      if (!win.jQuery) await loadScript('https://code.jquery.com/jquery-3.6.0.min.js');
      if (!(win as { PayFields?: unknown }).PayFields) await loadScript(`${payFieldsBaseUrl}?spa=1`);
      if (cancelled || readyCalledRef.current) return;

      const pf = (win as { PayFields?: Record<string, unknown> }).PayFields;
      if (!pf) return;

      (pf as Record<string, unknown>).config = {};
      const pfConfig = pf.config as Record<string, unknown>;
      pfConfig.txnSessionKey = key;
      pfConfig.apiKey = platform.platformApiKey;
      pfConfig.merchant = platform.platformMerchant;
      pfConfig.mode = 'token';

      pf.onSuccess = (response: { data?: { id?: string; token?: string }[] }) => {
        setSubmitting(false);
        const tokenData = response.data?.[0];
        if (tokenData?.token) {
          handleTokenCreated(tokenData.id || '', tokenData.token);
        } else {
          setError('No token returned');
        }
      };
      pf.onFailure = (response: { errors?: { message: string }[] }) => {
        setSubmitting(false);
        setError(response.errors?.map(e => e.message).join(', ') || 'Tokenization failed');
      };
      pf.fields = [
        { type: 'number', element: '#addPayment-ccnumber' },
        { type: 'expiration', element: '#addPayment-ccexp' },
        { type: 'cvv', element: '#addPayment-cvv' },
      ];

      setReady(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!readyCalledRef.current && typeof pf.ready === 'function') {
            readyCalledRef.current = true;
            (pf.ready as () => void)();
          }
        });
      });
    };

    init().catch(err => setError(err instanceof Error ? err.message : 'Init failed'));
    return () => { cancelled = true; };
  }, [platform.platformApiKey]);

  const handleTokenCreated = async (tokenId: string, tokenHash: string) => {
    setSubmitting(true);
    try {
      // Bind token to subscription
      const bindReqId = generateRequestId();
      const bindResult = await createSubscriptionTokenAction({ config, requestId: bindReqId }, {
        subscription: subscriptionId,
        token: tokenHash,
      });
      if (bindResult.apiResponse.error) {
        setError(bindResult.apiResponse.error);
        setSubmitting(false);
        return;
      }
      const stData = bindResult.apiResponse.data as SubscriptionToken[] | SubscriptionToken | undefined;
      const newSt = Array.isArray(stData) ? stData[0] : stData;

      // Fetch the token with expand[payment][] for display
      const tokReqId = generateRequestId();
      const tokResult = await listTokensAction({ config, requestId: tokReqId }, undefined, { page: 1, limit: 20 });
      const tokData = tokResult.apiResponse.data as Token[] | undefined;
      const newTok = tokData?.find(t => t.token === tokenHash);

      if (newSt && newTok) {
        onSuccess(newSt, newTok);
      } else {
        setError('Token bound but failed to fetch details');
      }
    } catch {
      setError('Failed to bind payment method');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = () => {
    const win = window as unknown as Record<string, unknown>;
    const pf = (win as { PayFields?: { submit?: () => void } }).PayFields;
    if (!pf?.submit) {
      setError('Payment form not ready');
      return;
    }
    setSubmitting(true);
    setError(null);
    pf.submit();
  };

  return (
    <div className="rounded-md border p-4 space-y-4 bg-muted/30">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Add New Payment Method</h4>
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <div className="space-y-3">
        <div>
          <Label className="text-xs">Card Number</Label>
          <div id="addPayment-ccnumber" className="border rounded-md bg-white mt-1 overflow-hidden" style={{ height: '40px' }} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Expiration</Label>
            <div id="addPayment-ccexp" className="border rounded-md bg-white mt-1 overflow-hidden" style={{ height: '40px' }} />
          </div>
          <div>
            <Label className="text-xs">CVV</Label>
            <div id="addPayment-cvv" className="border rounded-md bg-white mt-1 overflow-hidden" style={{ height: '40px' }} />
          </div>
        </div>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={!ready || submitting}
        className="w-full"
      >
        {submitting ? 'Saving...' : 'Save Payment Method'}
      </Button>
      <p className="text-xs text-muted-foreground text-center">
        A $0 authorization will be performed to verify the card. No charge will be made.
      </p>
    </div>
  );
}
