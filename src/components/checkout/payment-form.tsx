'use client';

import { useState, useEffect, useRef } from 'react';
import { CreditCard, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from '@/lib/toast';
import type { Token } from '@/lib/platform/types';
import type { PayFieldsResponse } from '@/types/payfields';

interface PaymentFormProps {
  email: string;
  firstName?: string;
  lastName?: string;
  invoiceId?: string;
  totalAmount: number;
  txnSessionKey: string;
  platformMerchant: string;
  platformApiKey: string;
  platformEnvironment: 'test' | 'live';
  onSuccess: (token: Token) => void;
  onError: (message: string) => void;
}

export function PaymentForm({
  email,
  firstName,
  lastName,
  invoiceId,
  totalAmount,
  txnSessionKey,
  platformMerchant,
  platformApiKey,
  platformEnvironment,
  onSuccess,
  onError,
}: PaymentFormProps) {
  const [payFieldsReady, setPayFieldsReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [payFieldsError, setPayFieldsError] = useState<string | null>(null);
  const [existingCustomerId, setExistingCustomerId] = useState<string | null>(null);
  const scriptLoadedRef = useRef(false);

  // Background email lookup (non-blocking)
  useEffect(() => {
    const lookupEmail = async () => {
      try {
        const response = await fetch(
          `/api/platform/customers?email=${encodeURIComponent(email)}`,
          { cache: 'no-store' }
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.customers?.length > 0) {
            setExistingCustomerId(data.customers[0].id);
          }
        }
      } catch {
        // Silently fail - we'll create new customer if lookup fails
      }
    };

    lookupEmail();
  }, [email]);

  // Load PayFields SDK
  useEffect(() => {
    if (!txnSessionKey || scriptLoadedRef.current) return;
    scriptLoadedRef.current = true;

    const payFieldsBaseUrl = platformEnvironment === 'test'
      ? 'https://test-api.payrix.com/payFieldsScript'
      : 'https://api.payrix.com/payFieldsScript';

    // Load jQuery first (required by PayFields)
    const jqScript = document.createElement('script');
    jqScript.src = 'https://code.jquery.com/jquery-3.6.0.min.js';
    jqScript.async = true;
    jqScript.onerror = () => toast.error('Failed to load jQuery');
    
    jqScript.onload = () => {
      // Load PayFields with spa=1
      const script = document.createElement('script');
      script.src = `${payFieldsBaseUrl}?spa=1`;
      script.async = true;
      script.onerror = () => toast.error('Failed to load PayFields SDK');
      
      script.onload = () => {
        const win = window as any;
        if (!win.PayFields) return;

        // Set config property-by-property AFTER PayFields loads (Bug 1 fix)
        win.PayFields.config.txnSessionKey = txnSessionKey;
        win.PayFields.config.apiKey = platformApiKey;
        win.PayFields.config.merchant = platformMerchant;
        win.PayFields.config.mode = 'txn';
        win.PayFields.config.txnType = 'sale';
        // Bug 2 fix: multiply by 100 to convert to cents
        win.PayFields.config.amount = String(Math.round(totalAmount * 100));
        win.PayFields.config.invoiceResult = { invoice: invoiceId };
        
        // Set customer (new customer by default)
        win.PayFields.config.customer = {
          first: firstName || '',
          last: lastName || '',
          email,
        };

        // Set up callbacks
        win.PayFields.onSuccess = (response: PayFieldsResponse) => {
          setIsSubmitting(false);
          if (response.data && response.data.length > 0) {
            onSuccess(response.data[0] as Token);
          } else {
            setPayFieldsError('No token data returned');
            onError('No token data returned');
          }
        };

        win.PayFields.onFailure = (response: PayFieldsResponse) => {
          setIsSubmitting(false);
          const errorMsg = response.errors?.map(e => e.message).join(', ') || 'Transaction failed';
          setPayFieldsError(errorMsg);
          onError(errorMsg);
        };

        // Configure fields
        win.PayFields.fields = [
          { type: 'number', element: '#payFields-ccnumber' },
          { type: 'expiration', element: '#payFields-ccexp' },
          { type: 'cvv', element: '#payFields-cvv' },
        ];

        // Initialize (use ready() for spa=1 mode)
        if (win.PayFields.ready) {
          win.PayFields.ready();
        }
        setPayFieldsReady(true);
      };

      document.head.appendChild(script);
    };

    document.head.appendChild(jqScript);

    return () => {
      if (jqScript.parentNode) jqScript.parentNode.removeChild(jqScript);
    };
  }, [txnSessionKey, email, firstName, lastName, platformApiKey, platformEnvironment, platformMerchant, totalAmount, invoiceId, onSuccess, onError]);

  // Update customer ID when lookup completes
  useEffect(() => {
    if (existingCustomerId && window.PayFields) {
      (window as any).PayFields.config.customer = existingCustomerId;
    }
  }, [existingCustomerId]);

  const handleSubmit = () => {
    if (!window.PayFields) {
      toast.error('Payment form not ready');
      return;
    }

    setIsSubmitting(true);
    setPayFieldsError(null);

    try {
      (window as any).PayFields.submit();
    } catch (error) {
      setIsSubmitting(false);
      const errorMsg = error instanceof Error ? error.message : 'Submission failed';
      setPayFieldsError(errorMsg);
      onError(errorMsg);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Card Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {!payFieldsReady ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div className="bg-muted p-3 rounded-md">
                <p className="text-sm text-muted-foreground">Paying as:</p>
                <p className="font-medium">{email}</p>
                {firstName && lastName && (
                  <p className="text-sm">{firstName} {lastName}</p>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="payFields-ccnumber">Card Number</Label>
                  <div
                    id="payFields-ccnumber"
                    className="w-[300px] border rounded-md bg-white mt-1"
                    style={{ height: '73px' }}
                  />
                </div>

                <div className="flex gap-4">
                  <div>
                    <Label htmlFor="payFields-ccexp">Expiration</Label>
                    <div
                      id="payFields-ccexp"
                      className="w-[300px] border rounded-md bg-white mt-1"
                      style={{ height: '73px' }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="payFields-cvv">CVV</Label>
                    <div
                      id="payFields-cvv"
                      className="w-[300px] border rounded-md bg-white mt-1"
                      style={{ height: '73px' }}
                    />
                  </div>
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
              Pay USD {(totalAmount / 100).toFixed(2)}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
