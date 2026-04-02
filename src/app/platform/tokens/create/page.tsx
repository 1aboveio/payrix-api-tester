'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { ArrowLeft, CreditCard, CheckCircle, AlertCircle, Loader2, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { activePlatform } from '@/lib/config';
import { usePayrixConfig } from '@/hooks/use-payrix-config';
import { createTxnSessionAction, listCustomersAction, createCustomerFromEmailAction } from '@/actions/platform';
import type { TxnSession, Token, Customer } from '@/lib/platform/types';
import { getTokenCustomerId } from '@/lib/platform/types';
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
      fields?: Array<{
        type: string;
        element: string;
      }>;
      addFields?: () => void;
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
type LookupState = 'idle' | 'looking' | 'found' | 'new' | 'error';

export default function CreateTokenPage() {
  const router = useRouter();
  const { config } = usePayrixConfig();
  const [step, setStep] = useState<Step>('config');
  const [loading, setLoading] = useState(false);
  const [shouldLoadScript, setShouldLoadScript] = useState(false);
  const [payFieldsReady, setPayFieldsReady] = useState(false);
  const [payFieldsSubmitting, setPayFieldsSubmitting] = useState(false);
  
  // Email-based customer resolution state
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [lookupState, setLookupState] = useState<LookupState>('idle');
  const [foundCustomer, setFoundCustomer] = useState<Customer | null>(null);
  const [multipleMatches, setMultipleMatches] = useState(false);
  const [resolvedCustomerId, setResolvedCustomerId] = useState<string | null>(null);
  
  // Session config state
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
  const platformLogin = activePlatformCreds.platformLogin || '';
  const platformMerchant = activePlatformCreds.platformMerchant || '';

  // Email validation
  const isValidEmail = (email: string): boolean => {
    return email.includes('@') && email.includes('.');
  };

  // Customer lookup via email
  const handleEmailLookup = async () => {
    if (!isValidEmail(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (!activePlatformCreds.platformApiKey) {
      toast.error('Platform API key not configured');
      return;
    }

    setLookupState('looking');
    setFoundCustomer(null);
    setMultipleMatches(false);
    setResolvedCustomerId(null);

    try {
      const requestId = generateRequestId();
      const result = await listCustomersAction(
        { config, requestId },
        [{ field: 'email', operator: 'eq', value: email.trim() }],
        { limit: 10 }
      );

      if (result.apiResponse.error) {
        // Treat lookup error as "new" to allow flow to continue
        setLookupState('new');
        toast.info('Customer lookup failed — will create new customer');
        return;
      }

      const customers = result.apiResponse.data as Customer[] | undefined;
      
      if (!customers || customers.length === 0) {
        // No match — will create new customer
        setLookupState('new');
      } else if (customers.length === 1) {
        // Single match
        setLookupState('found');
        setFoundCustomer(customers[0]);
        setResolvedCustomerId(customers[0].id);
        setFirstName(customers[0].firstName || '');
        setLastName(customers[0].lastName || '');
      } else {
        // Multiple matches — use first, show warning
        setLookupState('found');
        setFoundCustomer(customers[0]);
        setMultipleMatches(true);
        setResolvedCustomerId(customers[0].id);
        setFirstName(customers[0].firstName || '');
        setLastName(customers[0].lastName || '');
      }
    } catch (error) {
      setLookupState('error');
      toast.error('Lookup failed');
      console.error(error);
    }
  };

  // Clear lookup when email changes significantly
  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (lookupState !== 'idle' && lookupState !== 'looking') {
      setLookupState('idle');
      setFoundCustomer(null);
      setResolvedCustomerId(null);
      setMultipleMatches(false);
    }
  };

  const handleCreateSession = async () => {
    if (!activePlatformCreds.platformApiKey) {
      toast.error('Platform API key not configured');
      return;
    }

    if (!isValidEmail(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (!platformLogin || !platformMerchant) {
      toast.error('Platform login and merchant not configured. Please set them in Settings.');
      return;
    }

    setLoading(true);
    setPayFieldsError(null);

    try {
      let customerId = resolvedCustomerId;

      // If no existing customer, create one first
      if (!customerId) {
        const requestId = generateRequestId();
        const createResult = await createCustomerFromEmailAction(
          { config, requestId },
          {
            login: platformLogin,
            merchant: platformMerchant,
            email: email.trim(),
            firstName: firstName.trim() || undefined,
            lastName: lastName.trim() || undefined,
          }
        );

        if (createResult.apiResponse.error) {
          toast.error(`Failed to create customer: ${createResult.apiResponse.error}`);
          setLoading(false);
          return;
        }

        const newCustomer = createResult.apiResponse.data as Customer[] | Customer | undefined;
        const customerObj = Array.isArray(newCustomer) ? newCustomer[0] : newCustomer;
        if (customerObj?.id) {
          customerId = customerObj.id;
          setResolvedCustomerId(customerId);
        } else {
          toast.error('Customer creation returned no ID');
          setLoading(false);
          return;
        }
      }

      // Create txnSession
      const requestId = generateRequestId();
      const result = await createTxnSessionAction(
        { config, requestId },
        {
          login: platformLogin,
          merchant: platformMerchant,
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
        setLoading(false);
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

  // Load PayFields script when ready — config set in onLoad callback after SDK initializes
  useEffect(() => {
    if (step !== 'card' || !txnSession || !resolvedCustomerId) {
      return;
    }
    // Script loads, then config is set via property assignments in handlePayFieldsLoad
    setShouldLoadScript(true);
  }, [step, txnSession, resolvedCustomerId]);

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
    setShouldLoadScript(false);
    setEmail('');
    setFirstName('');
    setLastName('');
    setLookupState('idle');
    setFoundCustomer(null);
    setResolvedCustomerId(null);
    setMultipleMatches(false);
  };

  const formatSessionTimeRemaining = () => {
    if (!txnSession) return '-';
    const minutes = txnSession.durationAvailable;
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  };

  // Step 1: Configuration with Email Lookup
  const renderConfigStep = () => (
    <Card>
      <CardHeader>
        <CardTitle>Step 1: Customer Information</CardTitle>
        <CardDescription>
          Enter an email address. We'll find an existing customer or create a new one automatically.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Email Lookup */}
        <div className="space-y-2">
          <Label htmlFor="email">
            Email Address <span className="text-destructive">*</span>
          </Label>
          <div className="flex gap-2">
            <Input
              id="email"
              type="email"
              placeholder="customer@example.com"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleEmailLookup()}
            />
            <Button 
              variant="outline" 
              onClick={handleEmailLookup}
              disabled={!isValidEmail(email) || lookupState === 'looking' || !activePlatformCreds.platformApiKey}
            >
              {lookupState === 'looking' ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  <Search className="mr-2 size-4" />
                  Check
                </>
              )}
            </Button>
          </div>
          
          {/* Lookup Results */}
          {lookupState === 'found' && foundCustomer && (
            <Alert className="mt-2">
              <CheckCircle className="size-4 text-green-500" />
              <AlertTitle>Existing customer found</AlertTitle>
              <AlertDescription>
                {foundCustomer.firstName || foundCustomer.lastName 
                  ? `${foundCustomer.firstName || ''} ${foundCustomer.lastName || ''}`.trim() + ' '
                  : ''}
                ({foundCustomer.id})
                {multipleMatches && (
                  <span className="text-amber-600 ml-2">— Multiple matches, using most recent</span>
                )}
              </AlertDescription>
            </Alert>
          )}
          
          {lookupState === 'new' && (
            <Alert className="mt-2" variant="default">
              <AlertCircle className="size-4" />
              <AlertTitle>New customer</AlertTitle>
              <AlertDescription>
                No existing customer found. A new customer will be created when you proceed.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Name Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name (optional)</Label>
            <Input
              id="firstName"
              placeholder="John"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name (optional)</Label>
            <Input
              id="lastName"
              placeholder="Doe"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
        </div>

        {/* Session Config */}
        <div className="border-t pt-4 mt-4">
          <h4 className="text-sm font-medium mb-3">Session Configuration</h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (min)</Label>
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
        </div>

        {/* Login/Merchant Info */}
        {(platformLogin || platformMerchant) && (
          <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
            <div>Login: <span className="font-mono">{platformLogin || 'Not set'}</span></div>
            <div>Merchant: <span className="font-mono">{platformMerchant || 'Not set'}</span></div>
          </div>
        )}

        <Button 
          onClick={handleCreateSession} 
          disabled={loading || !isValidEmail(email) || !activePlatformCreds.platformApiKey || !platformLogin || !platformMerchant}
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

        {activePlatformCreds.platformApiKey && (!platformLogin || !platformMerchant) && (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Login & Merchant Required</AlertTitle>
            <AlertDescription>
              Please configure Platform Login and Merchant in Settings.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );

  // Step 2: Card Entry with PayFields
  const handlePayFieldsLoad = () => {
    if (!window.PayFields) {
      console.error('PayFields not available after script load');
      return;
    }

    // Re-set config AFTER script load — SDK resets window.PayFields on load, wiping pre-set config
    if (txnSession && resolvedCustomerId) {
      // Use individual property assignments (not wholesale replacement) per PayFields SDK spec
      window.PayFields.config.apiKey = activePlatformCreds.platformApiKey;
      window.PayFields.config.txnSessionKey = txnSession.key;
      window.PayFields.config.merchant = platformMerchant;
      window.PayFields.config.mode = 'token';
      window.PayFields.config.customer = resolvedCustomerId;
    }

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

    // Configure and initialize fields after delay
    window.PayFields.fields = [
      { type: 'number', element: '#payFields-ccnumber' },
      { type: 'expiration', element: '#payFields-ccexp' },
      { type: 'cvv', element: '#payFields-cvv' }
    ];

    setTimeout(() => {
      if (window.PayFields && window.PayFields.addFields) {
        window.PayFields.addFields();
      }
      setPayFieldsReady(true);
    }, 1000);
  };

  const renderCardStep = () => (
    <>
      {shouldLoadScript && (
        <Script
          src={payFieldsUrl}
          strategy="afterInteractive"
          onLoad={handlePayFieldsLoad}
          onError={() => toast.error('Failed to load PayFields SDK')}
        />
      )}
      
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
                  href={`/platform/customers/${getTokenCustomerId(createdToken)}`}
                  className="font-mono text-sm hover:underline"
                >
                  {getTokenCustomerId(createdToken)}
                </Link>
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
            login: platformLogin,
            merchant: platformMerchant,
            configurations: { duration, maxTimesApproved, maxTimesUse },
          }}
          result={actionResult}
          loading={loading}
        />
      )}
    </div>
  );
}
