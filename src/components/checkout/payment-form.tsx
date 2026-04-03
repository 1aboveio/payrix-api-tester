'use client';

import { useState, useEffect, useRef } from 'react';
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
import type { PayFieldsResponse } from '@/types/payfields';
import { toast } from '@/lib/toast';

interface PaymentFormProps {
  config: PayrixConfig;
  platformLogin: string;
  platformMerchant: string;
  txnSessionKey: string;
  totalAmount: number;
  currency: string;
  buttonText: string;
  invoiceId: string;
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
  invoiceId,
  onSuccess,
  onError,
}: PaymentFormProps) {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [payFieldsReady, setPayFieldsReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [payFieldsError, setPayFieldsError] = useState<string | null>(null);
  const scriptLoadedRef = useRef(false);

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
  const payFieldsBaseUrl = config.platformEnvironment === 'test'
    ? 'https://test-api.payrix.com/payfieldsjs'
    : 'https://api.payrix.com/payfieldsjs';

  // Load jQuery + PayFields with spa=1 mode
  useEffect(() => {
    if (!txnSessionKey || !resolvedCustomerId || scriptLoadedRef.current) return;
    scriptLoadedRef.current = true;

    // Load jQuery first (required by PayFields)
    const jqScript = document.createElement('script');
    jqScript.src = 'https://code.jquery.com/jquery-3.6.0.min.js';
    jqScript.onerror = () => toast.error('Failed to load jQuery');
    
    jqScript.onload = () => {
      // Set config BEFORE loading PayFields (same JS tick)
      (window as any).PayFields = (window as any).PayFields || {};
      (window as any).PayFields.config = {
        apiKey: config.platformApiKey,
        txnSessionKey,
        merchant: platformMerchant,
        mode: 'txn',
        txnType: 'sale',
        amount: String(Math.round(totalAmount * 100)), // Amount in cents
        customer: resolvedCustomerId,
        invoiceResult: { invoice: invoiceId },
      };

      // Now load PayFields with spa=1
      const script = document.createElement('script');
      script.src = `${payFieldsBaseUrl}?spa=1`;
      script.onerror = () => toast.error('Failed to load PayFields SDK');
      
      script.onload = () => {
        if (!window.PayFields) return;

        // Set up callbacks
        window.PayFields.onSuccess = (response: PayFieldsResponse) => {
          setIsSubmitting(false);
          if (response.data && response.data.length > 0) {
            onSuccess(response.data[0] as Token);
          } else {
            setPayFieldsError('No token data returned');
            onError('No token data returned');
          }
        };

        window.PayFields.onFailure = (response: PayFieldsResponse) => {
          setIsSubmitting(false);
          const errorMsg = response.errors?.map(e => e.message).join(', ') || 'Transaction failed';
          setPayFieldsError(errorMsg);
          onError(errorMsg);
        };

        // Configure fields
        window.PayFields.fields = [
          { type: 'number', element: '#payFields-ccnumber' },
          { type: 'expiration', element: '#payFields-ccexp' },
          { type: 'cvv', element: '#payFields-cvv' },
        ];

        // Initialize (use ready() for spa=1 mode)
        if (window.PayFields.ready) {
          window.PayFields.ready();
        }
        setPayFieldsReady(true);
      };

      document.head.appendChild(script);
    };

    document.head.appendChild(jqScript);

    return () => {
      if (jqScript.parentNode) jqScript.parentNode.removeChild(jqScript);
    };
  }, [txnSessionKey, resolvedCustomerId, config.platformApiKey, config.platformEnvironment, platformMerchant, totalAmount, invoiceId, onSuccess, onError, payFieldsBaseUrl]);

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

  const handleCreateCustomer = async () => {
    if (!firstName || !lastName) {
      toast.error('Please enter first and last name');
      return;
    }
    setIsCreatingCustomer(true);
    await createCustomer({ email, firstName, lastName });
    setIsCreatingCustomer(false);
  };

  return (
    <div className="space-y-6">
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
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Lookup'
                )}
              </Button>
            </div>
          </div>

          {customerState.status === 'found' && (
            <Alert className="bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle>Customer Found</AlertTitle>
              <AlertDescription>
                {customerState.customer?.firstName} {customerState.customer?.lastName}
              </AlertDescription>
            </Alert>
          )}

          {customerState.status === 'not_found' && (
            <div className="space-y-3">
              <Alert className="bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertTitle>Customer Not Found</AlertTitle>
                <AlertDescription>
                  Create a new customer to continue.
                </AlertDescription>
              </Alert>
              <div className="grid grid-cols-2 gap-3">
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
                onClick={handleCreateCustomer}
                disabled={isCreatingCustomer || !firstName || !lastName}
                variant="outline"
                className="w-full"
              >
                {isCreatingCustomer ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Create Customer
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Fields Section */}
      {resolvedCustomerId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Card Details
              <Badge variant="secondary">{currency}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!payFieldsReady ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-4">
                  {/* Card Number - 300x73px per Worldpay spec */}
                  <div>
                    <Label htmlFor="payFields-ccnumber">Card Number</Label>
                    <div
                      id="payFields-ccnumber"
                      className="w-[300px] border rounded-md bg-white"
                      style={{ height: '73px' }}
                    />
                  </div>
                  
                  {/* Expiration and CVV - flex layout with gap */}
                  <div className="flex gap-4">
                    <div>
                      <Label htmlFor="payFields-ccexp">Expiration</Label>
                      <div
                        id="payFields-ccexp"
                        className="w-[300px] border rounded-md bg-white"
                        style={{ height: '73px' }}
                      />
                    </div>
                    <div>
                      <Label htmlFor="payFields-cvv">CVV</Label>
                      <div
                        id="payFields-cvv"
                        className="w-[300px] border rounded-md bg-white"
                        style={{ height: '73px' }}
                      />
                    </div>
                  </div>
                </div>

                {payFieldsError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
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
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  {buttonText}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
