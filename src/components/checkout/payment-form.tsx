'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from '@/lib/toast';
import type { Token } from '@/lib/platform/types';
import type { PayFieldsResponse } from '@/types/payfields';

interface PaymentFormProps {
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
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const readyCalledRef = useRef(false);

  // Load PayFields SDK and call ready() exactly once
  useEffect(() => {
    if (!txnSessionKey || readyCalledRef.current) return;

    const win = window as any;

    const payFieldsBaseUrl = platformEnvironment === 'test'
      ? 'https://test-api.payrix.com/payFieldsScript'
      : 'https://api.payrix.com/payFieldsScript';

    function loadScript(src: string): Promise<void> {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.head.appendChild(script);
      });
    }

    async function init() {
      try {
        if (!win.jQuery) {
          await loadScript('https://code.jquery.com/jquery-3.6.0.min.js');
        }
        if (!win.PayFields) {
          await loadScript(`${payFieldsBaseUrl}?spa=1`);
        }
        if (readyCalledRef.current || !win.PayFields) return;

        win.PayFields.config.txnSessionKey = txnSessionKey;
        win.PayFields.config.apiKey = platformApiKey;
        win.PayFields.config.merchant = platformMerchant;
        win.PayFields.config.mode = 'txn';
        win.PayFields.config.txnType = 'sale';
        win.PayFields.config.amount = String(totalAmount);
        win.PayFields.config.invoiceResult = { invoice: invoiceId };
        win.PayFields.config.customer = { first: '', last: '', email: '' };

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

        win.PayFields.fields = [
          { type: 'number', element: '#payFields-ccnumber' },
          { type: 'expiration', element: '#payFields-ccexp' },
          { type: 'cvv', element: '#payFields-cvv' },
        ];

        win.PayFields.customizations = {
          style: {
            '.input': {
              font: '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              padding: '8px 12px',
              height: '36px',
              border: 'none',
              outline: 'none',
              'box-sizing': 'border-box',
              width: '100%',
            },
          },
        };

        // Show divs first, then call ready() after browser paint
        setPayFieldsReady(true);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (!readyCalledRef.current && win.PayFields?.ready) {
              readyCalledRef.current = true;
              win.PayFields.ready();
            }
          });
        });
      } catch (err) {
        toast.error('Failed to load payment SDK');
        console.error(err);
      }
    }

    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txnSessionKey]);

  // Update PayFields config when existing customer is found (background)
  useEffect(() => {
    if (!existingCustomerId || !payFieldsReady) return;

    const win = window as any;
    if (win.PayFields?.config) {
      win.PayFields.config.customer = existingCustomerId;
    }
  }, [existingCustomerId, payFieldsReady]);

  const handleSubmit = () => {
    const win = window as any;
    if (!win.PayFields) {
      toast.error('Payment form not ready');
      return;
    }

    if (!email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Update customer info from form state before submitting
    win.PayFields.config.customer = existingCustomerId || {
      first: firstName,
      last: lastName,
      email,
    };

    setIsSubmitting(true);
    setPayFieldsError(null);

    try {
      win.PayFields.submit();
    } catch (error) {
      setIsSubmitting(false);
      const errorMsg = error instanceof Error ? error.message : 'Submission failed';
      setPayFieldsError(errorMsg);
      onError(errorMsg);
    }
  };

  // Background email lookup (non-blocking)
  useEffect(() => {
    if (!email.includes('@')) return;
    const timeout = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/platform/customers?email=${encodeURIComponent(email)}&merchant=${encodeURIComponent(platformMerchant)}`,
          { headers: { 'Authorization': `Bearer ${platformApiKey}` } }
        );
        if (response.ok) {
          const data = await response.json();
          if (data.customers?.length > 0) {
            setExistingCustomerId(data.customers[0].id);
          } else {
            setExistingCustomerId(null);
          }
        }
      } catch {
        // Silently fail
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [email, platformApiKey, platformMerchant]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Payment Method</CardTitle>
        <CardDescription>All transactions are secure and encrypted</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Contact Info */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="email" className="font-semibold">Email Address *</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="firstName" className="font-semibold">First Name</Label>
              <Input
                id="firstName"
                placeholder="John"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="lastName" className="font-semibold">Last Name</Label>
              <Input
                id="lastName"
                placeholder="Doe"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Card Fields */}
        {!payFieldsReady ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label htmlFor="payFields-ccnumber" className="font-semibold">Card Number</Label>
              <div
                id="payFields-ccnumber"
                className="border rounded-md bg-white mt-1 overflow-hidden"
                style={{ height: '40px' }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="payFields-ccexp" className="font-semibold">Expiration</Label>
                <div
                  id="payFields-ccexp"
                  className="border rounded-md bg-white mt-1 overflow-hidden"
                  style={{ height: '40px' }}
                />
              </div>
              <div>
                <Label htmlFor="payFields-cvv" className="font-semibold">CVV</Label>
                <div
                  id="payFields-cvv"
                  className="border rounded-md bg-white mt-1 overflow-hidden"
                  style={{ height: '40px' }}
                />
              </div>
            </div>
          </div>
        )}

        {payFieldsError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Payment Error</AlertTitle>
            <AlertDescription>{payFieldsError}</AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !payFieldsReady || !email.includes('@')}
          className="w-full"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : null}
          Pay
        </Button>
      </CardContent>
    </Card>
  );
}
