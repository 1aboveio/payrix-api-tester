'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import ConfirmationContent from '../../platform/checkout/confirmation/confirmation-content';

function ConfirmationLoading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <Loader2 className="size-8 animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Loading confirmation...</p>
      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<ConfirmationLoading />}>
      <ConfirmationContent />
    </Suspense>
  );
}
