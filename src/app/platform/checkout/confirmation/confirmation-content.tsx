'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Loader2, AlertCircle, Receipt, CreditCard } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { activePlatform } from '@/lib/config';
import { usePayrixConfig } from '@/hooks/use-payrix-config';
import { getInvoiceAction, getSubscriptionAction, getTokenAction, getTransactionAction, listTokensAction, getPlanAction, createSubscriptionTokenAction, createInvoiceAction, createCatalogItemAction, createInvoiceLineItemAction } from '@/actions/platform';
import type { Invoice, Subscription, Token, Plan } from '@/lib/platform/types';
import { getTokenCustomerId, getSubscriptionAmount, getPlanCycleLabel } from '@/lib/platform/types';
import { generateRequestId } from '@/lib/payrix/identifiers';

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
  }).format(amount / 100);
}

function formatDate(dateString?: string): string {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export default function ConfirmationContent() {
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get('invoiceId');
  const subscriptionId = searchParams.get('subscriptionId');
  const tokenId = searchParams.get('tokenId');

  const { config } = usePayrixConfig();
  const activePlatformCreds = activePlatform(config);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [token, setToken] = useState<Token | null>(null);
  const [tokenBound, setTokenBound] = useState(false);
  const [tokenBindError, setTokenBindError] = useState<string | null>(null);
  const [firstPaymentSuccess, setFirstPaymentSuccess] = useState(false);
  const [firstPaymentError, setFirstPaymentError] = useState<string | null>(null);
  const [invoiceCreated, setInvoiceCreated] = useState(false);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);
  const processedRef = useRef(false);

  useEffect(() => {
    const fetchData = async () => {
      if (processedRef.current) return;
      processedRef.current = true;
      if (!activePlatformCreds.platformApiKey) {
        setError('Platform API key not configured');
        setLoading(false);
        return;
      }

      if (!tokenId) {
        setError('No token information provided');
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        // Resolve the token object.
        // In txnToken mode, PayFields returns a transaction ID (t1_txn_...) not a token ID.
        let tokenObj: Token | undefined;

        if (tokenId.startsWith('t1_tok_')) {
          // Direct token ID — fetch it
          const tokenRequestId = generateRequestId();
          const tokenResult = await getTokenAction({ config, requestId: tokenRequestId }, tokenId);
          if (!tokenResult.apiResponse.error) {
            const tokenData = tokenResult.apiResponse.data as Token[] | Token | undefined;
            tokenObj = Array.isArray(tokenData) ? tokenData[0] : tokenData;
          }
        } else if (tokenId.startsWith('t1_txn_')) {
          // Transaction ID — fetch txn to get token hash, then find matching token
          const txnReqId = generateRequestId();
          const txnResult = await getTransactionAction({ config, requestId: txnReqId }, tokenId);
          if (!txnResult.apiResponse.error) {
            const txnData = txnResult.apiResponse.data as Record<string, unknown>[] | Record<string, unknown> | undefined;
            const txn = Array.isArray(txnData) ? txnData[0] : txnData;
            const tokenHash = txn?.token as string | undefined;
            if (tokenHash) {
              const tokListId = generateRequestId();
              const tokResult = await listTokensAction({ config, requestId: tokListId }, undefined, { page: 1, limit: 20 });
              if (!tokResult.apiResponse.error) {
                const tokData = tokResult.apiResponse.data as Token[] | undefined;
                tokenObj = tokData?.find(t => t.token === tokenHash);
              }
            }
          }
        }

        if (tokenObj) {
          setToken(tokenObj);
        }

        // Fetch invoice or subscription
        if (invoiceId) {
          const requestId = generateRequestId();
          const result = await getInvoiceAction({ config, requestId }, invoiceId);
          
          if (!result.apiResponse.error) {
            const data = result.apiResponse.data as Invoice[] | Invoice | undefined;
            const inv = Array.isArray(data) ? data[0] : data;
            if (inv) {
              setInvoice(inv);
            }
          }
        } else if (subscriptionId) {
          const requestId = generateRequestId();
          const result = await getSubscriptionAction({ config, requestId }, subscriptionId);
          let sub: Subscription | undefined;

          if (!result.apiResponse.error) {
            const data = result.apiResponse.data as Subscription[] | Subscription | undefined;
            sub = Array.isArray(data) ? data[0] : data;
            if (sub) {
              // Enrich with plan data for amount display
              if (typeof sub.plan === 'string' && sub.plan) {
                try {
                  const planReqId = generateRequestId();
                  const planResult = await getPlanAction({ config, requestId: planReqId }, sub.plan);
                  if (!planResult.apiResponse.error) {
                    const planData = planResult.apiResponse.data as Plan[] | Plan | undefined;
                    const planObj = Array.isArray(planData) ? planData[0] : planData;
                    if (planObj) sub.plan = planObj;
                  }
                } catch { /* best-effort */ }
              }
              setSubscription(sub);
            }
          }

          // For subscription checkouts: bind token, mark payment, create invoice
          if (tokenObj && sub) {
            const platform = activePlatform(config);

            // 1. Bind token to subscription for auto-payments
            if (tokenObj.token) {
              try {
                const bindRequestId = generateRequestId();
                const bindResult = await createSubscriptionTokenAction(
                  { config, requestId: bindRequestId },
                  { subscription: subscriptionId, token: tokenObj.token }
                );
                if (bindResult.apiResponse.error) {
                  console.error('Token bind error:', bindResult.apiResponse.error);
                  setTokenBindError(bindResult.apiResponse.error);
                } else {
                  setTokenBound(true);
                }
              } catch (bindErr) {
                console.error('Failed to bind token to subscription', bindErr);
                setTokenBindError('Failed to set up automatic payments');
              }
            }

            // 2. First period payment handled by PayFields in txnToken mode
            setFirstPaymentSuccess(true);

            // 3. Auto-create invoice for the first period
            // Resolve login if missing
            let login = platform.platformLogin;
            const merchant = platform.platformMerchant;
            if (!login && merchant) {
              // Fallback: use subscription's creator or fetch from API keys
              login = sub.login || '';
            }

            const planObj = typeof sub.plan === 'object' ? sub.plan : null;
            const amount = planObj?.amount || getSubscriptionAmount(sub);

            if (amount && login && merchant) {
              try {
                const cycleLabel = planObj ? getPlanCycleLabel(planObj) : 'Period';
                const now = new Date();
                const invoiceNum = `SUB-${subscriptionId.slice(-8)}-${now.toISOString().slice(0, 10).replace(/-/g, '')}`;

                // Create catalog item
                const catReqId = generateRequestId();
                const catResult = await createCatalogItemAction({ config, requestId: catReqId }, {
                  login,
                  item: `${planObj?.name || 'Subscription'} — ${cycleLabel}`,
                  description: `${cycleLabel} subscription payment`,
                  price: amount,
                });
                const catData = catResult.apiResponse.data as { id?: string }[] | { id?: string } | undefined;
                const catItem = Array.isArray(catData) ? catData[0] : catData;

                // Create invoice linked to subscription
                const invReqId = generateRequestId();
                const customerStr = typeof sub.customer === 'string' ? sub.customer
                  : typeof sub.customer === 'object' ? sub.customer.id : undefined;
                const invResult = await createInvoiceAction({ config, requestId: invReqId }, {
                  login,
                  merchant,
                  number: invoiceNum,
                  status: 'paid',
                  customer: customerStr,
                  subscription: subscriptionId,
                  type: 'recurring',
                  title: `${planObj?.name || 'Subscription'} — First Period`,
                });
                const invData = invResult.apiResponse.data as { id?: string }[] | { id?: string } | undefined;
                const inv = Array.isArray(invData) ? invData[0] : invData;

                // Add line item
                if (inv?.id && catItem?.id) {
                  const liReqId = generateRequestId();
                  await createInvoiceLineItemAction({ config, requestId: liReqId }, {
                    invoice: inv.id,
                    invoiceItem: catItem.id,
                    quantity: 1,
                    price: amount,
                  });
                }

                if (!invResult.apiResponse.error) {
                  setInvoiceCreated(true);
                } else {
                  console.error('Invoice creation error:', invResult.apiResponse.error);
                  setInvoiceError(invResult.apiResponse.error);
                }
              } catch (invErr) {
                console.error('Failed to create invoice', invErr);
                setInvoiceError('Failed to create invoice for this period');
              }
            } else {
              console.warn('Skipping invoice creation — missing:', { amount, login, merchant });
            }
          } else {
            console.warn('Skipping subscription post-payment — missing:', { tokenObj: !!tokenObj, sub: !!sub });
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [config, invoiceId, subscriptionId, tokenId, activePlatformCreds.platformApiKey]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="size-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading confirmation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const totalAmount = invoice?.total || (subscription ? getSubscriptionAmount(subscription) : undefined) || 0;
  const currency = 'USD'; // Default since Invoice doesn't have currency field
  const isPaid = invoice?.status === 'paid';
  const isConfirmed = !invoice || isPaid; // Non-invoice flows trust the callback

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="text-center mb-8">
        {isConfirmed ? (
          <>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
              <CheckCircle className="size-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold mb-2">
              {subscription ? 'Subscription Activated!' : 'Payment Successful!'}
            </h1>
            <p className="text-muted-foreground">
              {invoice
                ? 'Your invoice has been paid successfully.'
                : 'First period charged and card saved for automatic future payments.'}
            </p>
          </>
        ) : (
          <>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 mb-4">
              <AlertCircle className="size-8 text-yellow-600" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Payment Processing</h1>
            <p className="text-muted-foreground">
              Your payment has been submitted but the invoice status is still <Badge variant="secondary">{invoice.status}</Badge>. It may take a moment to update.
            </p>
          </>
        )}
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="size-5" />
            Receipt Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {invoice && (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Invoice ID</span>
                <span className="font-mono">{invoice.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Invoice Status</span>
                <Badge variant={isPaid ? 'default' : 'secondary'}>{invoice.status}</Badge>
              </div>
              <Separator />
            </>
          )}
          
          {subscription && (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subscription ID</span>
                <span className="font-mono">{subscription.id}</span>
              </div>
              <Separator />
            </>
          )}

          <div className="flex justify-between">
            <span className="text-muted-foreground">Amount {subscription ? '(first period)' : 'Paid'}</span>
            <span className="font-semibold">{formatCurrency(totalAmount, currency)}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-muted-foreground">Date</span>
            <span>{formatDate(new Date().toISOString())}</span>
          </div>

          {token && (
            <>
              <Separator />
              <div className="flex items-center gap-2">
                <CreditCard className="size-4" />
                <span className="text-muted-foreground">Payment Method</span>
                <Badge variant="secondary">•••• {String(token.payment?.number || '')}</Badge>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {token && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Token Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Token ID</span>
              <Link 
                href={`/platform/tokens/${token.id}`}
                className="font-mono text-sm hover:underline"
              >
                {token.id}
              </Link>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Customer</span>
              <Link
                href={`/platform/customers/${getTokenCustomerId(token)}`}
                className="font-mono text-sm hover:underline"
              >
                {getTokenCustomerId(token)}
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {firstPaymentSuccess && (
        <Alert className="mb-6">
          <CheckCircle className="size-4" />
          <AlertTitle>First Period Charged</AlertTitle>
          <AlertDescription>
            {formatCurrency(totalAmount, currency)} has been charged for the first billing period.
          </AlertDescription>
        </Alert>
      )}

      {firstPaymentError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="size-4" />
          <AlertTitle>First Payment Failed</AlertTitle>
          <AlertDescription>{firstPaymentError}</AlertDescription>
        </Alert>
      )}

      {invoiceCreated && (
        <Alert className="mb-6">
          <CheckCircle className="size-4" />
          <AlertTitle>Invoice Created</AlertTitle>
          <AlertDescription>
            An invoice has been generated for the first billing period.
          </AlertDescription>
        </Alert>
      )}

      {invoiceError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="size-4" />
          <AlertTitle>Invoice Creation Failed</AlertTitle>
          <AlertDescription>{invoiceError}</AlertDescription>
        </Alert>
      )}

      {tokenBound && token && (
        <Alert className="mb-6">
          <CheckCircle className="size-4" />
          <AlertTitle>Automatic Payments Enabled</AlertTitle>
          <AlertDescription>
            Card ending in {String(token.payment?.number || '')} has been set up for automatic future payments on this subscription.
          </AlertDescription>
        </Alert>
      )}

      {tokenBindError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="size-4" />
          <AlertTitle>Auto-Payment Setup Failed</AlertTitle>
          <AlertDescription>{tokenBindError}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-center gap-4">
        <Button variant="outline" asChild>
          <Link href={invoice ? '/platform/invoices' : '/platform/subscriptions'}>
            View {invoice ? 'Invoices' : 'Subscriptions'}
          </Link>
        </Button>
        <Button asChild>
          <Link href="/">
            Return Home
          </Link>
        </Button>
      </div>
    </div>
  );
}
