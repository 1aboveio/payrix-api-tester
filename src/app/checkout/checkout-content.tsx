'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { activePlatform } from '@/lib/config';
import { usePayrixConfig } from '@/hooks/use-payrix-config';
import { getInvoiceAction, getSubscriptionAction, getPlanAction, createTxnSessionAction, resolvePlatformCredentialsAction } from '@/actions/platform';
import { BillSummary } from '@/components/checkout/bill-summary';
import { PaymentForm } from '@/components/checkout/payment-form';
import type { Invoice } from '@/lib/platform/types';
import type { Subscription, Plan, Token } from '@/lib/platform/types';
import { toast } from '@/lib/toast';
import { generateRequestId } from '@/lib/payrix/identifiers';

export default function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get('invoiceId');
  const subscriptionId = searchParams.get('subscriptionId');
  
  const { config, updateConfig } = usePayrixConfig();
  const activePlatformCreds = activePlatform(config);
  const platformLogin = activePlatformCreds.platformLogin || '';
  const platformMerchant = activePlatformCreds.platformMerchant || '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [txnSessionKey, setTxnSessionKey] = useState<string | null>(null);

  // Fetch invoice or subscription data
  useEffect(() => {
    const fetchData = async () => {
      if (!activePlatformCreds.platformApiKey) {
        setError('Platform API key not configured');
        setLoading(false);
        return;
      }

      if (!invoiceId && !subscriptionId) {
        setError('No invoice or subscription ID provided');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        if (invoiceId) {
          const requestId = generateRequestId();
          const result = await getInvoiceAction({ config, requestId }, invoiceId);
          
          if (result.apiResponse.error) {
            setError(`Failed to load invoice: ${result.apiResponse.error}`);
            setLoading(false);
            return;
          }

          const data = result.apiResponse.data as Invoice[] | Invoice | undefined;
          const inv = Array.isArray(data) ? data[0] : data;
          if (inv) {
            setInvoice(inv);
          } else {
            setError('Invoice not found');
          }
        } else if (subscriptionId) {
          const requestId = generateRequestId();
          const result = await getSubscriptionAction({ config, requestId }, subscriptionId);
          
          if (result.apiResponse.error) {
            setError(`Failed to load subscription: ${result.apiResponse.error}`);
            setLoading(false);
            return;
          }

          const data = result.apiResponse.data as Subscription[] | Subscription | undefined;
          const sub = Array.isArray(data) ? data[0] : data;
          if (sub) {
            setSubscription(sub);
            
            // Fetch plan details
            const planId = typeof sub.plan === 'string' ? sub.plan : sub.plan?.id;
            if (planId) {
              const planRequestId = generateRequestId();
              const planResult = await getPlanAction({ config, requestId: planRequestId }, planId);
              
              if (!planResult.apiResponse.error) {
                const planData = planResult.apiResponse.data as Plan[] | Plan | undefined;
                const planObj = Array.isArray(planData) ? planData[0] : planData;
                if (planObj) {
                  setPlan(planObj);
                }
              }
            }
          } else {
            setError('Subscription not found');
          }
        }
      } catch (err) {
        setError('Failed to load checkout data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [config, invoiceId, subscriptionId, activePlatformCreds.platformApiKey]);

  // Create txnSession once invoice/subscription is loaded
  useEffect(() => {
    const createSession = async () => {
      if (!invoice && !subscription) return;

      let currentLogin = platformLogin;
      let currentMerchant = platformMerchant;

      // Auto-resolve login/merchant if missing but API key exists
      if ((!currentLogin || !currentMerchant) && activePlatformCreds.platformApiKey) {
        try {
          const result = await resolvePlatformCredentialsAction(
            activePlatformCreds.platformApiKey,
            config.platformEnvironment
          );

          if (result.success && result.login && result.merchant) {
            currentLogin = result.login;
            currentMerchant = result.merchant;

            // Save resolved credentials to config
            const env = config.globalEnvironment;
            const newConfig = {
              ...config,
              platform: {
                ...config.platform,
                [env]: {
                  ...config.platform[env],
                  platformLogin: result.login,
                  platformMerchant: result.merchant,
                },
              },
            };
            updateConfig(newConfig);
          } else {
            setError('Platform login and merchant not configured. Please check your settings.');
            return;
          }
        } catch (err) {
          setError('Platform login and merchant not configured. Please check your settings.');
          return;
        }
      }

      if (!currentLogin || !currentMerchant) {
        setError('Platform login and merchant not configured. Please check your settings.');
        return;
      }

      try {
        const requestId = generateRequestId();
        const result = await createTxnSessionAction(
          { config, requestId },
          {
            login: currentLogin,
            merchant: currentMerchant,
            configurations: {
              duration: 30,
              maxTimesApproved: 1,
              maxTimesUse: 3,
            },
          }
        );

        if (result.apiResponse.error) {
          toast.error(`Failed to create session: ${result.apiResponse.error}`);
          return;
        }

        const sessions = result.apiResponse.data as Array<{ key: string }> | undefined;
        const session = Array.isArray(sessions) ? sessions[0] : sessions;
        if (session?.key) {
          setTxnSessionKey(session.key);
        }
      } catch (err) {
        toast.error('Failed to create payment session');
        console.error(err);
      }
    };

    createSession();
  }, [config, invoice, subscription, platformLogin, platformMerchant, activePlatformCreds.platformApiKey, updateConfig]);

  const handlePaymentSuccess = (token: Token) => {
    const params = new URLSearchParams();
    if (invoiceId) {
      params.set('invoiceId', invoiceId);
    } else if (subscriptionId) {
      params.set('subscriptionId', subscriptionId);
    }
    params.set('tokenId', token.id);
    router.push(`/checkout/confirmation?${params.toString()}`);
  };

  const handlePaymentError = (message: string) => {
    toast.error(message);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="size-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading checkout...</p>
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
        <div className="mt-4 text-center">
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  const totalAmount = invoice?.total || subscription?.amount || 0;
  const currency = 'USD';

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel - Bill Summary */}
        <div>
          <BillSummary
            invoice={invoice || undefined}
            subscription={subscription || undefined}
            plan={plan || undefined}
          />
        </div>

        {/* Right Panel - Payment Form */}
        <div>
          {txnSessionKey ? (
            <PaymentForm
              invoiceId={invoiceId || undefined}
              totalAmount={totalAmount}
              txnSessionKey={txnSessionKey}
              platformMerchant={(platformMerchant || activePlatformCreds.platformMerchant) ?? ''}
              platformApiKey={activePlatformCreds.platformApiKey ?? ''}
              platformEnvironment={(config.platformEnvironment === 'prod' ? 'live' : 'test') as 'test' | 'live'}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />
          ) : (
            <div className="flex items-center justify-center h-64 border rounded-lg">
              <div className="text-center">
                <Loader2 className="size-6 animate-spin mx-auto mb-2" />
                <p className="text-muted-foreground">Initializing payment session...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
