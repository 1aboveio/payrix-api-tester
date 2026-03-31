'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { ArrowLeft, CreditCard, Loader2, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { activePlatform } from '@/lib/config';
import { usePayrixConfig } from '@/hooks/use-payrix-config';
import { createTxnSessionAction } from '@/actions/platform';
import type { Token, TxnSession } from '@/lib/platform/types';
import { toast } from '@/lib/toast';
import { generateRequestId } from '@/lib/payrix/identifiers';
import { PlatformApiResultPanel } from '@/components/platform/api-result-panel';
import type { ServerActionResult } from '@/lib/payrix/types';

// PayFields SDK types
declare global {
  interface Window {
    PayFields: {
      config: {
        apiKey: string;
        txnSessionKey: string;
        merchant: string;
        mode: string;
        customer: string;
      };
      onSuccess: ((response: PayFieldsResponse) => void) | null;
      onFailure: ((response: PayFieldsResponse) => void) | null;
      submit: () => void;
    };
  }
}

interface PayFieldsResponse {
  data: Array<{
    id: string;
    token: string;
    status: number;
    customer: string;
    payment: {
      number: string;
      bin: string;
      method: number;
    };
    expiration: string;
    name: string;
    description: string;
    custom: string;
    inactive: number;
    frozen: number;
    origin: number;
    entryMode: number;
    accountUpdaterEligible: number;
    omnitoken: string;
    created: string;
    modified: string;
  }>;
  errors: Array<{
    field?: string;
    message: string;
    code?: string;
  }>;
}

type Step = 'config' | 'card' | 'result';

export default function CreateTokenPage() {
  const router = useRouter();
  const { config } = usePayrixConfig();
  
  // Step 1: Configuration state
  const [customerId, setCustomerId] = useState('');
  const [loginId, setLoginId] = useState('');
  const [merchantId, setMerchantId] = useState('');
  const [duration, setDuration] = useState(30);
  const [maxTimesApproved, setMaxTimesApproved] = useState(1);
  const [maxTimesUse, setMaxTimesUse] = useState(3);
  
  // Step 2: Session state
  const [txnSession, setTxnSession] = useState<TxnSession | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [payFieldsReady, setPayFieldsReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Step 3: Result state
  const [createdToken, setCreatedToken] = useState<Token | null>(null);
  const [payFieldsError, setPayFieldsError] = useState<string | null>(null);
  
  // UI state
  const [step, setStep] = useState<Step>('config');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ServerActionResult<unknown> | null>(null);
  
  const payFieldsUrl = config.platformEnvironment === 'test'
    ? 'https://test-api.payrix.com/payfieldsjs'
    : 'https://api.payrix.com/payfieldsjs';

  const handleCreateSession = async () => {
    if (!activePlatform(config).platformApiKey) {
      toast.error('Platform API key not configured');
      return;
    }

    if (!customerId.trim() || !loginId.trim() || !merchantId.trim()) {
      toast.error('Customer ID, Login ID, and Merchant ID are required');
      return;
    }

    setLoading(true);
    try {
      const requestId = generateRequestId();
      const actionResult = await createTxnSessionAction(
        { config, requestId },
        {
          login: loginId.trim(),
          merchant: merchantId.trim(),
          configurations: {
            duration,
            maxTimesApproved,
            maxTimesUse,
          },
        }
      );
      
      setResult(actionResult as ServerActionResult<unknown>);

      if (actionResult.apiResponse.error) {
        toast.error(actionResult.apiResponse.error);
        return;
      }

      const data = actionResult.apiResponse.data as TxnSession[] | TxnSession | undefined;
      const session = Array.isArray(data) ? data[0] : data;
      
      if (session) {
        setTxnSession(session);
        setStep('card');
        toast.success('Transaction session created');
      } else {
        toast.error('Failed to create transaction session');
      }
    } catch (error) {
      toast.error('Failed to create session');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Initialize PayFields when script loads and we're on card step
  useEffect(() => {
    if (step === 'card' && scriptLoaded && txnSession && typeof window !== 'undefined' && window.PayFields) {
      const platformCreds = activePlatform(config);
      
      window.PayFields.config.apiKey = platformCreds.platformApiKey || '';
      window.PayFields.config.txnSessionKey = txnSession.key;
      window.PayFields.config.merchant = merchantId;
      window.PayFields.config.mode = 'token';
      window.PayFields.config.customer = customerId;

      window.PayFields.onSuccess = (response: PayFieldsResponse) => {
        setSubmitting(false);
        if (response.data && response.data.length > 0) {
          setCreatedToken(response.data[0]);
          setPayFieldsError(null);
          setStep('result');
          toast.success('Token created successfully');
        } else {
          setPayFieldsError('No token data received');
        }
      };

      window.PayFields.onFailure = (response: PayFieldsResponse) => {
        setSubmitting(false);
        const errorMsg = response.errors?.map(e => e.message).join(', ') || 'Token creation failed';
        setPayFieldsError(errorMsg);
        toast.error(errorMsg);
      };

      setPayFieldsReady(true);
    }
  }, [step, scriptLoaded, txnSession, config, customerId, merchantId]);

  const handleSubmit = () => {
    if (!payFieldsReady || !window.PayFields) {
      toast.error('PayFields not ready');
      return;
    }
    setSubmitting(true);
    setPayFieldsError(null);
    window.PayFields.submit();
  };

  const handleStartOver = () => {
    setStep('config');
    setTxnSession(null);
    setCreatedToken(null);
    setPayFieldsError(null);
    setPayFieldsReady(false);
    setScriptLoaded(false);
  };

  // Config Step
  if (step === 'config') {
    return (
      <div className="space-y-4">
        <Button asChild variant="outline" size="sm">
          <Link href="/platform/tokens">
            <ArrowLeft className="mr-2 size-4" />
            Back to Tokens
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="size-5" />
              Create Token
            </CardTitle>
            <CardDescription>
              Create a new payment token using the PayFields SDK.
              {<Link href="/platform/customers" target="_blank" className="inline-flex items-center gap-1 ml-1 text-blue-600 hover:underline">
                Browse Customers <ExternalLink className="size-3" />
              </Link>}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="customerId">Customer ID *</Label>
                <Input
                  id="customerId"
                  placeholder="t1_cus_..."
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="loginId">Login ID *</Label>
                <Input
                  id="loginId"
                  placeholder="Your Payrix login ID"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="merchantId">Merchant ID *</Label>
                <Input
                  id="merchantId"
                  placeholder="t1_mer_..."
                  value={merchantId}
                  onChange={(e) => setMerchantId(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="duration">Session Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  min={1}
                  max={120}
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value) || 30)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="maxApproved">Max Times Approved</Label>
                <Input
                  id="maxApproved"
                  type="number"
                  min={1}
                  max={10}
                  value={maxTimesApproved}
                  onChange={(e) => setMaxTimesApproved(parseInt(e.target.value) || 1)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="maxUse">Max Times Use</Label>
                <Input
                  id="maxUse"
                  type="number"
                  min={1}
                  max={10}
                  value={maxTimesUse}
                  onChange={(e) => setMaxTimesUse(parseInt(e.target.value) || 3)}
                />
              </div>
            </div>

            <Separator />

            <Button 
              onClick={handleCreateSession} 
              disabled={loading}
              className="w-full md:w-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Creating Session...
                </>
              ) : (
                'Create Session & Load PayFields'
              )}
            </Button>
          </CardContent>
        </Card>

        <PlatformApiResultPanel
          config={config}
          endpoint="/txnSessions"
          method="POST"
          requestPreview={{
            login: loginId,
            merchant: merchantId,
            configurations: { duration, maxTimesApproved, maxTimesUse },
          }}
          result={result}
          loading={loading}
        />
      </div>
    );
  }

  // Card Entry Step
  if (step === 'card') {
    return (
      <div className="space-y-4">
        <Script
          src={payFieldsUrl}
          strategy="lazyOnload"
          onLoad={() => setScriptLoaded(true)}
          onError={() => toast.error('Failed to load PayFields SDK')}
        />

        <Button asChild variant="outline" size="sm">
          <Link href="/platform/tokens">
            <ArrowLeft className="mr-2 size-4" />
            Back to Tokens
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="size-5" />
              Enter Card Details
            </CardTitle>
            <CardDescription>
              Enter card information in the secure fields below.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {txnSession && (
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Session ID:</span>
                  <span className="font-mono text-sm">{txnSession.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Customer:</span>
                  <span className="font-mono text-sm">{customerId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Badge variant={txnSession.status === 0 ? "default" : "secondary"}>
                    {txnSession.status === 0 ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Card Number</Label>
                <div 
                  id="payFields-ccnumber" 
                  className="border rounded-md p-3 min-h-[42px] bg-white"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Expiration</Label>
                  <div 
                    id="payFields-ccexp" 
                    className="border rounded-md p-3 min-h-[42px] bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label>CVV</Label>
                  <div 
                    id="payFields-cvv" 
                    className="border rounded-md p-3 min-h-[42px] bg-white"
                  />
                </div>
              </div>
            </div>

            {!scriptLoaded && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="size-5 animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">Loading PayFields SDK...</span>
              </div>
            )}

            {payFieldsError && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-start gap-2">
                <AlertCircle className="size-5 text-red-600 mt-0.5" />
                <div>
                  <p className="font-medium text-red-800">Error</p>
                  <p className="text-sm text-red-600">{payFieldsError}</p>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleStartOver}
                disabled={submitting}
              >
                Start Over
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={!payFieldsReady || submitting}
                className="flex-1"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Submit'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Result Step
  if (step === 'result' && createdToken) {
    return (
      <div className="space-y-4">
        <Button asChild variant="outline" size="sm">
          <Link href="/platform/tokens">
            <ArrowLeft className="mr-2 size-4" />
            Back to Tokens
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="size-5 text-green-600" />
              Token Created
            </CardTitle>
            <CardDescription>
              The payment token has been successfully created.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-green-800 font-medium">Token ID</p>
                  <p className="font-mono text-sm">{createdToken.id}</p>
                </div>
                <div>
                  <p className="text-sm text-green-800 font-medium">Last 4</p>
                  <p className="text-sm">•••• {createdToken.payment?.number}</p>
                </div>
                <div>
                  <p className="text-sm text-green-800 font-medium">Expiration</p>
                  <p className="text-sm">
                    {createdToken.expiration 
                      ? `${createdToken.expiration.slice(0, 2)}/${createdToken.expiration.slice(2)}` 
                      : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-green-800 font-medium">Customer</p>
                  <p className="font-mono text-sm">{createdToken.customer}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleStartOver}>
                Create Another Token
              </Button>
              <Button asChild>
                <Link href={`/platform/tokens/${createdToken.id}`}>
                  View Token Details
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}