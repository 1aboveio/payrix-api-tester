'use client';

import { useState, useEffect, useRef } from 'react';
import { CreditCard, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from '@/lib/toast';

// Extend Window interface for PayFields
declare global {
  interface Window {
    PayFields?: {
      config: {
        apiKey: string;
        txnSessionKey: string;
        merchant: string;
        mode: 'txn' | 'token';
        txnType?: 'sale' | 'auth' | 'refund';
        amount?: string;
        invoiceResult?: { invoice: string };
        customer?: string | { first: string; last: string; email: string };
      };
      fields?: Array<{
        type: string;
        element: string;
      }>;
      ready?: () => void;
      onSuccess: (response: PayFieldsResponse) => void;
      onFailure: (response: PayFieldsResponse) => void;
      submit: () => void;
    };
  }
}

interface PayFieldsResponse {
  data: Array<{
    id: string;
    [key: string]: unknown;
  }>;
  errors: Array<{
    field?: string;
    message: string;
    code?: string;
  }>;
}

interface PaymentFormProps {
  email: string;
  firstName?: string;
  lastName?: string;
  invoiceId: string;
  totalAmount: number;
  txnSessionKey: string;
  platformMerchant: string;
  platformApiKey: string;
  platformEnvironment: 'test' | 'production';
  onSuccess: (result: { tokenId: string }) => void;
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
  const [customerId, setCustomerId] = useState<string | null>(null);
  const scriptLoadedRef = useRef(false);

  const payFieldsBaseUrl = platformEnvironment === 'test'
    ? 'https://test-api.payrix.com/payFieldsScript'
    : 'https://api.payrix.com/payFieldsScript';

  // Background customer lookup (non-blocking)
  useEffect(() => {
    const lookupCustomer = async () => {
      try {
        const response = await fetch(
          `/api/platform/customers?email=${encodeURIComponent(email)}&merchant=${platformMerchant}`,
          { headers: { 'Authorization': `Bearer ${platformApiKey}` } }
        );
        if (response.ok) {
          const data = await response.json();
          if (data.customers?.length > 0) {
            setCustomerId(data.customers[0].id);
          }
        }
      } catch {
        // Silent fail - customer lookup is optional
      }
    };
    lookupCustomer();
  }, [email, platformMerchant, platformApiKey]);

  // Load jQuery + PayFields
  useEffect(() => {
    if (scriptLoadedRef.current) return;
    scriptLoadedRef.current = true;

    const jqScript = document.createElement('script');
    jqScript.src = 'https://code.jquery.com/jquery-3.6.0.min.js';
    jqScript.onerror = () => toast.error('Failed to load jQuery');
    
    jqScript.onload = () => {
      (window as any).PayFields = (window as any).PayFields || {};
      (window as any).PayFields.config = {
        apiKey: platformApiKey,
        txnSessionKey,
        merchant: platformMerchant,
        mode: 'txn',
        txnType: 'sale',
        amount: String(Math.round(totalAmount * 100)),
        invoiceResult: { invoice: invoiceId },
      };

      if (!customerId) {
        (window as any).PayFields.config.customer = {
          first: firstName || 'Guest',
          last: lastName || 'Customer',
          email,
        };
      }

      const script = document.createElement('script');
      script.src = `${payFieldsBaseUrl}?spa=1`;
      script.onerror = () => toast.error('Failed to load PayFields SDK');
      
      script.onload = () => {
        if (!window.PayFields) return;

        window.PayFields.onSuccess = (response: PayFieldsResponse) => {
          setIsSubmitting(false);
          if (response.data && response.data.length > 0) {
            onSuccess({ tokenId: response.data[0].id });
          } else {
            onError('No token returned from payment');
          }
        };

        window.PayFields.onFailure = (response: PayFieldsResponse) => {
          setIsSubmitting(false);
          const errorMsg = response.errors?.map(e => e.message).join(', ') || 'Payment failed';
          onError(errorMsg);
        };

        const fields: Array<{ type: string; element: string }> = [
          { type: 'number', element: '#payFields-ccnumber' },
          { type: 'expiration', element: '#payFields-ccexp' },
          { type: 'cvv', element: '#payFields-cvv' },
        ];

        if (customerId) {
          fields.push({ type: 'customer_id', element: '#payfields-cid' });
        }

        window.PayFields.fields = fields;

        if (customerId) {
          const cidInput = document.getElementById('payfields-cid') as HTMLInputElement;
          if (cidInput) {
            cidInput.value = customerId;
          }
        }

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
  }, [customerId, email, firstName, lastName, invoiceId, platformApiKey, platformEnvironment, platformMerchant, totalAmount, txnSessionKey, payFieldsBaseUrl]);

  const handleSubmit = async () => {
    if (!window.PayFields) {
      toast.error('Payment form not ready');
      return;
    }

    setIsSubmitting(true);

    try {
      window.PayFields.submit();
    } catch (error) {
      setIsSubmitting(false);
      const errorMsg = error instanceof Error ? error.message : 'Submission failed';
      onError(errorMsg);
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Card Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!payFieldsReady ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <input type="hidden" id="payfields-cid" />
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="payFields-ccnumber">Card Number</Label>
                <div
                  id="payFields-ccnumber"
                  style={{ width: '300px', height: '73px' }}
                  className="border rounded-md bg-white"
                />
              </div>

              <div>
                <Label htmlFor="payFields-ccexp">Expiration</Label>
                <div
                  id="payFields-ccexp"
                  style={{ width: '300px', height: '73px' }}
                  className="border rounded-md bg-white"
                />
              </div>

              <div>
                <Label htmlFor="payFields-cvv">CVV</Label>
                <div
                  id="payFields-cvv"
                  style={{ width: '300px', height: '73px' }}
                  className="border rounded-md bg-white"
                />
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !payFieldsReady}
              className="w-full"
              size="lg"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Pay ${(totalAmount).toFixed(2)}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
