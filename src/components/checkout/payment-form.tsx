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
  const [shouldLoadScript, setShouldLoadScript] = useState(false);
  const [payFieldsReady, setPayFieldsReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
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

  // Pre-configure PayFields BEFORE loading script
  useEffect(() => {
    if (!txnSessionKey || !resolvedCustomerId) {
      return;
    }

    // Pre-set config on window BEFORE script loads
    (window as Window).PayFields = {
      config: {
        apiKey: config.platformApiKey,
        txnSessionKey: txnSessionKey,
        merchant: platformMerchant,
        mode: 'token',
        customer: resolvedCustomerId,
      },
      addFields: () => {},
      onSuccess: () => {},
      onFailure: () => {},
      submit: () => {},
    };

    // Now safe to load script
    setShouldLoadScript(true);
  }, [txnSessionKey, resolvedCustomerId, config.platformApiKey, platformMerchant]);

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
    if (!window.PayFields) {
      toast.error('Payment form not ready');
      return;
    }

    setIsSubmitting(true);
    setPayFieldsError(null);

    try {
      window.PayFields.submit();
    } catch (error) {
      setIsSubmitting(false);
      const errorMsg = error instanceof Error ? error.message : 'Submission failed';
      setPayFieldsError(errorMsg);
      onError(errorMsg);
    }
  };

  const handlePayFieldsLoad = () => {
    if (!window.PayFields) {
      console.error('PayFields not available after script load');
      return;
    }

    // Set up callbacks
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

    // Configure and initialize fields after delay
    window.PayFields.fields = [
      { type: 'number', element: '#payFields-ccnumber' },
      { type: 'expiration', element: '#payFields-ccexp' },
      { type: 'cvv', element: '#payFields-cvv' }
    ];

    setTimeout(() => {
      if (window.PayFields?.addFields) {
        window.PayFields.addFields();
      }
      setPayFieldsReady(true);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {shouldLoadScript && (
        <Script
          src={payFieldsUrl}
          strategy="afterInteractive"
          onLoad={handlePayFieldsLoad}
        />
      )}

      {/* Customer Info Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Customer Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="customer@example.com"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                disabled={customerState.status === 'looking'}
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleLookup}
                disabled={!email.includes('@') || customerState.status === 'looking'}
                variant="secondary"
              >
                {customerState.status === 'looking' ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Looking up...</>
                ) : (
                  'Lookup'
                )}
              </Button>
            </div>
          </div>

          {customerState.status === 'new' && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Customer not found</AlertTitle>
              <AlertDescription>
                <div className="space-y-3 mt-2">
                  <p>Would you like to create a new customer?</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Doe"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={async () => {
                      setIsCreatingCustomer(true);
                      await createCustomer(email, firstName, lastName);
                      setIsCreatingCustomer(false);
                    }}
                    disabled={isCreatingCustomer || !firstName || !lastName}
                    className="w-full"
                  >
                    {isCreatingCustomer ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating...</>
                    ) : (
                      'Create Customer'
                    )}
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {customerState.status === 'error' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{customerState.message}</AlertDescription>
            </Alert>
          )}

          {resolvedCustomerId && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              Customer resolved: <Badge variant="secondary">{resolvedCustomerId}</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Form Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-2xl font-bold text-center py-4">
            {currency} {totalAmount.toFixed(2)}
          </div>

          {payFieldsError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Payment Error</AlertTitle>
              <AlertDescription>{payFieldsError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div>
              <Label>Card Number</Label>
              <div
                id="payFields-ccnumber"
                className="w-full h-10 px-3 py-2 border rounded-md bg-white min-h-[40px]"
              >
                {!payFieldsReady && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading secure form...
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Expiry Date</Label>
                <div
                  id="payFields-ccexp"
                  className="w-full h-10 px-3 py-2 border rounded-md bg-white min-h-[40px]"
                />
              </div>
              <div>
                <Label>CVV</Label>
                <div
                  id="payFields-cvv"
                  className="w-full h-10 px-3 py-2 border rounded-md bg-white min-h-[40px]"
                />
              </div>
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!payFieldsReady || isSubmitting || !resolvedCustomerId}
            className="w-full"
            size="lg"
          >
            {isSubmitting ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</>
            ) : (
              buttonText
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}