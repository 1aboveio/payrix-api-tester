import { CheckoutContent } from './checkout-content';

interface CheckoutPageProps {
  searchParams: { 
    invoiceId?: string;
    amount?: string;
    sessionKey?: string;
    merchant?: string;
  };
}

export default function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const invoiceId = searchParams.invoiceId || '';
  const totalAmount = parseFloat(searchParams.amount || '0');
  const txnSessionKey = searchParams.sessionKey || '';
  const platformMerchant = searchParams.merchant || '';

  if (!invoiceId || !totalAmount || !txnSessionKey || !platformMerchant) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Invalid Checkout</h1>
          <p className="text-muted-foreground">Missing required parameters.</p>
        </div>
      </div>
    );
  }

  return (
    <CheckoutContent 
      invoiceId={invoiceId}
      totalAmount={totalAmount}
      txnSessionKey={txnSessionKey}
      platformMerchant={platformMerchant}
    />
  );
}
