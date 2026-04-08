'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import CheckoutContent from '../platform/checkout/checkout-content';

function CheckoutLoading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <Loader2 className="size-8 animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Loading checkout...</p>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutLoading />}>
      <CheckoutContent />
    </Suspense>
  );
}
