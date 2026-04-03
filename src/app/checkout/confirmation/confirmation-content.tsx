'use client';

import { useEffect, useState } from 'react';
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
import { getInvoiceAction, getSubscriptionAction, getTokenAction } from '@/actions/platform';
import type { Invoice } from '@/lib/platform/types';
import type { Subscription, Token } from '@/lib/platform/types';
import { getTokenCustomerId } from '@/lib/platform/types';
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

  useEffect(() => {
    const fetchData = async () => {
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
        // Fetch token details
        const tokenRequestId = generateRequestId();
        const tokenResult = await getTokenAction({ config, requestId: tokenRequestId }, tokenId);
        
        if (!tokenResult.apiResponse.error) {
          const tokenData = tokenResult.apiResponse.data as Token[] | Token | undefined;
          const tokenObj = Array.isArray(tokenData) ? tokenData[0] : tokenData;
          if (tokenObj) {
            setToken(tokenObj);
          }
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
          
          if (!result.apiResponse.error) {
            const data = result.apiResponse.data as Subscription[] | Subscription | undefined;
            const sub = Array.isArray(data) ? data[0] : data;
            if (sub) {
              setSubscription(sub);
            }
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

  const totalAmount = invoice?.total || subscription?.amount || 0;
  const currency = 'USD'; // Default since Invoice doesn't have currency field

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
          <CheckCircle className="size-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Payment Successful!</h1>
        <p className="text-muted-foreground">
          {invoice 
            ? 'Your invoice has been paid successfully.'
            : 'Your subscription has been set up successfully.'}
        </p>
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
            <span className="text-muted-foreground">Amount Paid</span>
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
