'use client';

import { useState } from 'react';
import { PaymentForm } from './payment-form';
import type { PayrixConfig } from '@/lib/payrix/types';
import type { Token } from '@/lib/platform/types';
import { toast } from '@/lib/toast';

interface CheckoutContentProps {
  config: PayrixConfig;
  platformLogin: string;
  platformMerchant: string;
  txnSessionKey: string;
  totalAmount: number;
  currency: string;
  invoiceId: string;
  onComplete?: (result: { token: Token; invoiceId: string }) => void;
}

export function CheckoutContent({
  config,
  platformLogin,
  platformMerchant,
  txnSessionKey,
  totalAmount,
  currency,
  invoiceId,
  onComplete,
}: CheckoutContentProps) {
  const [completed, setCompleted] = useState(false);

  const handleSuccess = (token: Token) => {
    toast.success('Payment processed successfully');
    setCompleted(true);
    onComplete?.({ token, invoiceId });
  };

  const handleError = (message: string) => {
    toast.error(`Payment failed: ${message}`);
  };

  if (completed) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Payment Complete</h2>
        <p className="text-muted-foreground">
          Your payment has been processed successfully.
        </p>
      </div>
    );
  }

  return (
    <PaymentForm
      config={config}
      platformLogin={platformLogin}
      platformMerchant={platformMerchant}
      txnSessionKey={txnSessionKey}
      totalAmount={totalAmount}
      currency={currency}
      buttonText={`Pay ${currency} ${(totalAmount).toFixed(2)}`}
      invoiceId={invoiceId}
      onSuccess={handleSuccess}
      onError={handleError}
    />
  );
}
