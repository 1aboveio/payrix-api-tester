'use client';

import { useState, useEffect } from 'react';
import Script from 'next/script';
import { CreditCard, Loader2, CheckCircle, AlertCircle, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useCustomerResolution } from '@/hooks/use-customer-resolution';
import type { PayrixConfig } from '@/lib/payrix/types';
import type { Token } from '@/lib/platform/types';
import { toast } from '@/lib/toast';

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

interface PaymentFormProps {
  config: PayrixConfig;
  platformLogin: string;
  platformMerchant: string;
  txnSessionKey: string;
  totalAmount: number;
  currency: string;
  buttonText: string;
  onSuccess: (token: Token) => void;
  onError: (message: string) => void;
}

export function PaymentForm({
  config,
  platformLogin,
  platformMerchant,
  txnSessionKey,
  totalAmount,
  currency,
  buttonText,
  onSuccess,
  onError,
}: PaymentFormProps) {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [payFieldsLoaded, setPayFieldsLoaded] = useState(false);
  const [payFieldsReady, setPayFieldsReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [payFieldsError, setPayFieldsError] = useState<string | null>(null);

  const {
    state: customerState,
    resolvedCustomerId,
    lookupCustomer,
    createCustomer,
    reset: resetCustomer,
  } = useCustomerResolution({
    config,
    platformLogin,
    platformMerchant,
  });

  // Get PayFields SDK URL based on environment
  const payFieldsUrl = config.platformEnvironment === 'test'
    ? 'https://test-api.payrix.com/payFieldsScript'
    : 'https://api.payrix.com/payFieldsScript';

  // Initialize PayFields when script loads
  useEffect(() => {
    if (!payFieldsLoaded || !window.PayFields || !txnSessionKey || !resolvedCustomerId) {
      return;
    }

    window.PayFields.config.apiKey = config.platformApiKey;
    window.PayFields.config.txnSessionKey = txnSessionKey;
    window.PayFields.config.merchant = platformMerchant;
    window.PayFields.config.mode = 'token';
    window.PayFields.config.customer = resolvedCustomerId;

    window.PayFields.onSuccess = (response: PayFieldsResponse) => {
      setIsSubmitting(false);
      if (response.data && response.data.length > 0) {
        onSuccess(response.data[0]);
      } else {
        setPayFieldsError('No token data returned');
        onError('No token data returned');
      }
    };

    window.PayFields.onFailure = (response: PayFieldsResponse) => {
      setIsSubmitting(false);
      const errorMsg = response.errors?.map(e => e.message).join(', ') || 'Token creation failed';
      setPayFieldsError(errorMsg);
      onError(errorMsg);
    };

    setPayFieldsReady(true);
  }, [payFieldsLoaded, txnSessionKey, resolvedCustomerId, config.platformApiKey, platformMerchant, onSuccess, onError]);

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (customerState.status !== 'idle' && customerState.status !== 'looking') {
      resetCustomer();
    }
  };

  const handleLookup = async () => {
    if (!email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    await lookupCustomer(email);
  };

  const handleSubmit = async () => {
    if (!email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (!resolvedCustomerId && customerState.status === 'new') {
      // Create customer first
      const newId = await createCustomer(email, firstName, lastName);
      if (!newId) {
        onError('Failed to create customer');
        return;
      }
    } else if (!resolvedCustomerId) {
      toast.error('Please check the email address');
      return;
    }

    if (!window.PayFields) {
      toast.error('PayFields not loaded');
      return;
    }

    setIsSubmitting(true);
    setPayFieldsError(null);
    window.PayFields.submit();
  };

  const isValidEmail = email.includes('@') && email.includes('.');
  const showPayFields = resolvedCustomerId && payFieldsReady;

  return (
    <>
      <Script
        src={payFieldsUrl}
        strategy="lazyOnload"
        onLoad={() => setPayFieldsLoaded(true)}
        onError={() => toast.error('Failed to load PayFields SDK')}
      />
      
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="size-5" />
            Payment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Email Lookup */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address <span className="text-destructive">*</span></Label>
            <div className="flex gap-2">
              <Input
                id="email"
                type="email"
                placeholder="customer@example.com"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
              />
              <Button
                variant="outline"
                onClick={handleLookup}
                disabled={!isValidEmail || customerState.status === 'looking'}
              >
                {customerState.status === 'looking' ? (
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
            {customerState.status === 'found' && (
              <Alert className="mt-2">
                <CheckCircle className="size-4 text-green-500" />
                <AlertTitle>Existing customer found</AlertTitle>
                <AlertDescription>
                  {customerState.customer.firstName || customerState.customer.lastName
                    ? `${customerState.customer.firstName || ''} ${customerState.customer.lastName || ''}`.trim() + ' '
                    : ''}
                  ({customerState.customer.id})
                  {customerState.multipleMatches && (
                    <span className="text-amber-600 ml-2">— Multiple matches, using most recent</span>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {customerState.status === 'new' && (
              <Alert className="mt-2" variant="default">
                <AlertCircle className="size-4" />
                <AlertTitle>New customer</AlertTitle>
                <AlertDescription>
                  No existing customer found. A new customer will be created when you pay.
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

          {/* PayFields */}
          {showPayFields && (
            <>
              <div className="space-y-4 pt-4 border-t">
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
                  <AlertTitle>Payment Error</AlertTitle>
                  <AlertDescription>{payFieldsError}</AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !payFieldsReady}
                className="w-full"
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {buttonText}
                    <Badge variant="secondary" className="ml-2">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: currency || 'USD',
                      }).format(totalAmount / 100)}
                    </Badge>
                  </>
                )}
              </Button>
            </>
          )}

          {!showPayFields && resolvedCustomerId && (
            <div className="text-center text-muted-foreground py-4">
              <Loader2 className="size-6 animate-spin mx-auto mb-2" />
              Loading payment form...
            </div>
          )}

          {!resolvedCustomerId && (
            <div className="text-center text-muted-foreground py-4">
              Enter your email and click Check to continue
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

export default PaymentForm;