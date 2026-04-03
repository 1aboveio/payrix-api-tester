'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { EmailStep } from '@/components/checkout/email-step';
import { PaymentForm } from '@/components/checkout/payment-form';
import { usePayrixConfig } from '@/hooks/use-payrix-config';
import { activePlatform } from '@/lib/config';
import { toast } from '@/lib/toast';

interface CheckoutContentProps {
  invoiceId: string;
  totalAmount: number;
  txnSessionKey: string;
  platformMerchant: string;
}

export function CheckoutContent({ invoiceId, totalAmount, txnSessionKey, platformMerchant }: CheckoutContentProps) {
  const [step, setStep] = useState<'email' | 'payment'>('email');
  const [emailData, setEmailData] = useState<{ email: string; firstName?: string; lastName?: string } | null>(null);
  
  const { config } = usePayrixConfig();
  const activePlatformCreds = activePlatform(config);
  const platformApiKey = activePlatformCreds.platformApiKey || '';
  const platformEnvironment = config.platformEnvironment;

  const handleEmailContinue = (data: { email: string; firstName?: string; lastName?: string }) => {
    setEmailData(data);
    setStep('payment');
  };

  const handlePaymentSuccess = (result: { tokenId: string }) => {
    toast.success('Payment successful!');
    console.log('Payment success:', result);
  };

  const handlePaymentError = (message: string) => {
    toast.error(`Payment failed: ${message}`);
  };

  if (!platformMerchant || !platformApiKey) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">Initializing checkout...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      {step === 'email' ? (
        <EmailStep onContinue={handleEmailContinue} />
      ) : emailData ? (
        <PaymentForm
          email={emailData.email}
          firstName={emailData.firstName}
          lastName={emailData.lastName}
          invoiceId={invoiceId}
          totalAmount={totalAmount}
          txnSessionKey={txnSessionKey}
          platformMerchant={platformMerchant}
          platformApiKey={platformApiKey}
          platformEnvironment={platformEnvironment === 'prod' ? 'production' : 'test'}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
        />
      ) : null}
    </div>
  );
}
