'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { ArrowLeft, CreditCard, ExternalLink, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { activePlatform } from '@/lib/config';
import { usePayrixConfig } from '@/hooks/use-payrix-config';
import { createTxnSessionAction } from '@/actions/platform';
import type { TxnSession, Token } from '@/lib/platform/types';
import { toast } from '@/lib/toast';
import { generateRequestId } from '@/lib/payrix/identifiers';
import { PlatformApiResultPanel } from '@/components/platform/api-result-panel';
import type { ServerActionResult } from '@/lib/payrix/types';

// Extend Window interface for PayFields
declare global {
  interface Window {
    PayFields?: {
      config: {
        apiKey: string;
        txnSessionKey: string;
        merchant: string;
        mode: string;
        customer: string;
      };
      onSuccess: (response: PayFieldsResponse) => void;
      onFailure: (response: PayFieldsResponse) => void;
      submit: () => void;
    };
  }
}

interface PayFieldsResponse {
  data: Token[];
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
  const [step, setStep] = useState<Step>('config');
  const [loading, setLoading] = useState(false);
  const [payFieldsLoaded, setPayFieldsLoaded] = useState(false);
  const [payFieldsReady, setPayFieldsReady] = useState(false);
  const [payFieldsSubmitting, setPayFieldsSubmitting] = useState(false);
  
  // Config form state
  const [customerId, setCustomerId] = useState('');
  const [loginId, setLoginId] = useState('');
  const [merchantId, setMerchantId] = useState('');
  const [duration, setDuration] = useState(30);
  const [maxTimesApproved, setMaxTimesApproved] = useState(1);
  const [maxTimesUse, setMaxTimesUse] = useState(3);
  
  // Session and result state
  const [txnSession, setTxnSession] = useState<TxnSession | null>(null);
  const [createdToken, setCreatedToken] = useState<Token | null>(null);
  const [payFieldsError, setPayFieldsError] = useState<string | null>(null);
  const [actionResult, setActionResult] = useState<ServerActionResult<unknown> | null>(null);
  
  const payFieldsContainerRef = useRef<HTMLDivElement>(null);

  // Get PayFields SDK URL based on environment
  const payFieldsUrl = config.platformEnvironment === 'test'
    ? 'https://test-api.payrix.com/payfieldsjs'
    : 'https://api.payrix.com/payfieldsjs';

  const activePlatformCreds = activePlatform(config);

  const handleCreateSession = async () => {
    if (!activePlatformCreds.platformApiKey) {
      toast.error('Platform API key not configured');
      return;
    }

    if (!customerId.trim() || !loginId.trim() || !merchantId.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setPayFieldsError(null);
    try {
      const requestId = generateRequestId();
      const result = await createTxnSessionAction(
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
      setActionResult(result as ServerActionResult<unknown>);

      if (result.apiResponse.error) {
        toast.error(`Failed to create session: ${result.apiResponse.error}`);
        return;
      }

      const session = result.apiResponse.data as TxnSession | undefined;
      if (session) {
        setTxnSession(session);
        setStep('card');
        toast.success('Session created successfully');
      } else {
        toast.error('No session returned');
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
    if (step !== 'card' || !payFieldsLoaded || !txnSession || !window.PayFields) {
      return;
    }

    // Configure PayFields
    window.PayFields.config.apiKey = activePlatformCreds.platformApiKey;
    window.PayFields.config.txnSessionKey = txnSession.key;
    window.PayFields.config.merchant = merchantId;
    window.PayFields.config.mode = 'token';
    window.PayFields.config.customer = customerId;

    // Set up callbacks
    window.PayFields.onSuccess = (response: PayFieldsResponse) => {
      setPayFieldsSubmitting(false);
      if (response.data && response.data.length > 0) {
        setCreatedToken(response.data[0]);
        setStep('result');
        toast.success('Token created successfully');
      } else {
        setPayFieldsError('No token data returned');
      }
    };

    window.PayFields.onFailure = (response: PayFieldsResponse) => {
      setPayFieldsSubmitting(false);
      const errorMsg = response.errors?.map(e => e.message).join(', ') || 'Token creation failed';
      setPayFieldsError(errorMsg);
    };

    setPayFieldsReady(true);
  }, [step, payFieldsLoaded, txnSession, customerId, merchantId, activePlatformCreds.platformApiKey]);

  const handlePayFieldsSubmit = () => {
    if (!window.PayFields) {
      toast.error('PayFields not loaded');
      return;
    }
    setPayFieldsSubmitting(true);
    setPayFieldsError(null);
    window.PayFields.submit();
  };

  const handleStartOver = () => {
    setStep('config');
    setTxnSession(null);
    setCreatedToken(null);
    setPayFieldsError(null);
    setPayFieldsReady(false);
    setPayFieldsLoaded(false);
  };

  const formatSessionTimeRemaining = () => {
    if (!txnSession) return '-';
    const minutes = txnSession.durationAvailable;
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  };

  // Step 1: Configuration
  const renderConfigStep = () => (
    <Card>
      <CardHeader>
        <CardTitle>Step 1: Configuration</CardTitle>
        <CardDescription>
          Configure the token creation session. You'll need a valid customer ID, login, and merchant.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="customerId">
            Customer ID <span className="text-destructive">*</span>
          </Label>
          <div className="flex gap-2">
            <Input
              id="customerId"
              placeholder="t1_cus_xxxxxxxx"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
            />
            <Button variant="outline" asChild>
              <Link href="/platform/customers" target="_blank">
                <ExternalLink className="mr-2 size-4" />
                Browse
              </Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            The customer ID to associate with this token.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="loginId">
            Login ID <span className="text-destructive">*</span>
          </Label>
          <Input
            id="loginId"
            placeholder="t1_log_xxxxxxxx"
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="merchantId">
            Merchant ID <span className="text-destructive">*</span>
          </Label>
          <Input
            id="merchantId"
            placeholder="t1_mer_xxxxxxxx"
            value={merchantId}
            onChange={(e) => setMerchantId(e.target.value)}
          />
        </div>

        <Separator />

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="duration">Duration (minutes)</Label>
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
            <Label htmlFor="maxApproved">Max Approved</Label>
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
            <Label htmlFor="maxUse">Max Uses</Label>
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

        <Button 
          onClick={handleCreateSession} 
          disabled={loading || !activePlatformCreds.platformApiKey}
          className="w-full"
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

        {!activePlatformCreds.platformApiKey && (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>API Key Required</AlertTitle>
            <AlertDescription>
              Please configure your Platform API key in Settings first.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );

  // Step 2: Card Entry with PayFields
  const renderCardStep = () => (
    <>
      <Script
        src={payFieldsUrl}
        strategy="lazyOnload"
        onLoad={() => setPayFieldsLoaded(true)}
        onError={() => toast.error('Failed to load PayFields SDK')}
      />
      
      <Card>
        <CardHeader>
          <CardTitle>Step 2: Card Entry</CardTitle>
          <CardDescription>
            Enter card details securely via PayFields. Card data never touches our server.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {txnSession && (
            <Alert>
              <AlertTitle>Session Info</AlertTitle>
              <AlertDescription>
                <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                  <div>Session ID: <span className="font-mono">{txnSession.id}</span></div>
                  <div>Key: <span className="font-mono">{txnSession.key.slice(0, 8)}...{txnSession.key.slice(-8)}</span></div>
                  <div>Time Remaining: <span className="font-mono">{formatSessionTimeRemaining()}</span></div>
                  <div>Uses: <span className="font-mono">{txnSession.timesUsed}/{txnSession.configurations.maxTimesUse}</span></div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div ref={payFieldsContainerRef} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Card Number</Label>
              <div 
                id="payFields-ccnumber" 
                className="border rounded-md p-3 min-h-[42px] bg-white"
              >
                {!payFieldsReady && <span className="text-muted-foreground">Loading...</span>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Expiration</Label>
                <div 
                  id="payFields-ccexp" 
                  className="border rounded-md p-3 min-h-[42px] bg-white"
                >
                  {!payFieldsReady && <span className="text-muted-foreground">Loading...</span>}
                </div>
              </div>
              <div className="space-y-2">
                <Label>CVV</Label>
                <div 
                  id="payFields-cvv" 
                  className="border rounded-md p-3 min-h-[42px] bg-white"
                >
                  {!payFieldsReady && <span className="text-muted-foreground">Loading...</span>}
                </div>
              </div>
            </div>
          </div>

          {payFieldsError && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{payFieldsError}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleStartOver}
              disabled={payFieldsSubmitting}
            >
              Start Over
            </Button>
            <Button 
              onClick={handlePayFieldsSubmit}
              disabled={!payFieldsReady || payFieldsSubmitting}
              className="flex-1"
            >
              {payFieldsSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Card'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );

  // Step 3: Result
  const renderResultStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="size-6 text-green-500" />
          Token Created Successfully
        </CardTitle>
        <CardDescription>
          The token has been created and is ready to use.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {createdToken && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Token ID</p>
                <p className="font-mono text-sm break-all">{createdToken.id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last 4</p>
                <p className="font-mono">•••• {createdToken.payment?.number}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Expiration</p>
                <p className="font-mono">{createdToken.expiration?.slice(0, 2)}/{createdToken.expiration?.slice(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Customer</p>
                <Link 
                  href={`/platform/customers/${createdToken.customer}`}
                  className="font-mono text-sm hover:underline"
                >
                  {createdToken.customer}
                </Link>
              </div>
            </div>

            <Separator />

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
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      <Button asChild variant="outline" size="sm">
        <Link href="/platform/tokens">
          <ArrowLeft className="mr-2 size-4" />
          Back to Tokens
        </Link>
      </Button>

      <div className="flex items-center gap-2 mb-4">
        <Badge variant={step === 'config' ? 'default' : 'outline'}>Step 1</Badge>
        <span className="text-muted-foreground">→</span>
        <Badge variant={step === 'card' ? 'default' : 'outline'}>Step 2</Badge>
        <span className="text-muted-foreground">→</span>
        <Badge variant={step === 'result' ? 'default' : 'outline'}>Step 3</Badge>
      </div>

      {step === 'config' && renderConfigStep()}
      {step === 'card' && renderCardStep()}
      {step === 'result' && renderResultStep()}

      {step === 'config' && actionResult && (
        <PlatformApiResultPanel
          config={config}
          endpoint="/txnSessions"
          method="POST"
          requestPreview={{
            login: loginId,
            merchant: merchantId,
            configurations: { duration, maxTimesApproved, maxTimesUse },
          }}
          result={actionResult}
          loading={loading}
        />
      )}
    </div>
  );
}
