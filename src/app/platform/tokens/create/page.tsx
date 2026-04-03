'use client';

import { useState, useEffect, useRef } from 'react';
import { CreditCard, Loader2, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { PayFieldsResponse } from '@/types/payfields';
import { toast } from '@/lib/toast';

export default function TokenCreatePage() {
  const [payFieldsReady, setPayFieldsReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [payFieldsError, setPayFieldsError] = useState<string | null>(null);
  const [token, setToken] = useState<{ id: string } | null>(null);
  const scriptLoadedRef = useRef(false);

  // Mock config - in real app, fetch from settings
  const config = {
    platformApiKey: process.env.NEXT_PUBLIC_PAYRIX_API_KEY || '',
    platformEnvironment: (process.env.NEXT_PUBLIC_PAYRIX_ENV || 'test') as 'test' | 'production',
  };
  const platformMerchant = process.env.NEXT_PUBLIC_PAYRIX_MERCHANT || '';
  const txnSessionKey = 'mock-session-key'; // Would come from API
  const customerId = 'mock-customer-id'; // Would come from route params or context

  const payFieldsBaseUrl = config.platformEnvironment === 'test'
    ? 'https://test-api.payrix.com/payfieldsjs'
    : 'https://api.payrix.com/payfieldsjs';

  // Load jQuery + PayFields with spa=1 mode
  useEffect(() => {
    if (!txnSessionKey || !customerId || scriptLoadedRef.current) return;
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
        mode: 'token', // Token mode for token creation
        customer: customerId,
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
            setToken({ id: response.data[0].id });
            toast.success('Token created successfully');
          } else {
            setPayFieldsError('No token data returned');
          }
        };

        window.PayFields.onFailure = (response: PayFieldsResponse) => {
          setIsSubmitting(false);
          const errorMsg = response.errors?.map(e => e.message).join(', ') || 'Token creation failed';
          setPayFieldsError(errorMsg);
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
  }, [txnSessionKey, customerId, config.platformApiKey, config.platformEnvironment, platformMerchant, payFieldsBaseUrl]);

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
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Create Payment Token
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {!payFieldsReady ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-4">
                {/* Card Number - 300x73px per Worldpay spec */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Card Number</label>
                  <div
                    id="payFields-ccnumber"
                    className="w-[300px] border rounded-md bg-white"
                    style={{ height: '73px' }}
                  />
                </div>
                
                {/* Expiration and CVV - flex layout with gap */}
                <div className="flex gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Expiration</label>
                    <div
                      id="payFields-ccexp"
                      className="w-[300px] border rounded-md bg-white"
                      style={{ height: '73px' }}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">CVV</label>
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
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{payFieldsError}</AlertDescription>
                </Alert>
              )}

              {token && (
                <Alert className="bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertTitle>Token Created</AlertTitle>
                  <AlertDescription>
                    Token ID: {token.id}
                  </AlertDescription>
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
                Create Token
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
