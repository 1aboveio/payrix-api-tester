# PayFields Integration Redesign

## Overview

Based on official Worldpay/PayFields documentation, this redesign addresses three confirmed root causes for submit failures.

## Root Causes Fixed

1. **Missing jQuery dependency** — PayFields SDK requires jQuery to be loaded first
2. **Missing `?spa=1` parameter** — Required for single-page application mode
3. **Wrong initialization method** — Must use `ready()` not `addFields()` in SPA mode
4. **Incorrect config timing** — Config must be set BEFORE script loads (same JS tick)

## Implementation Details

### 1. Script Loading Sequence

```ts
// Load jQuery FIRST, then PayFields with ?spa=1
const jq = document.createElement('script');
jq.src = 'https://code.jquery.com/jquery-3.6.0.min.js';
jq.onload = () => {
  const script = document.createElement('script');
  script.src = `${payFieldsBaseUrl}?spa=1`;
  script.onload = () => {
    // Set config, fields, then call:
    window.PayFields.ready();  // NOT addFields() — required for ?spa=1 mode
    setPayFieldsReady(true);
  };
  document.head.appendChild(script);
};
document.head.appendChild(jq);
```

### 2. Checkout Page Config (payment-form.tsx)

For transaction mode (checkout):

```ts
window.PayFields.config.txnSessionKey = txnSessionKey;
window.PayFields.config.merchant = platformMerchant;
window.PayFields.config.mode = 'txn';
window.PayFields.config.txnType = 'sale';
window.PayFields.config.amount = String(Math.round(totalAmount * 100)); // cents
window.PayFields.config.customer = resolvedCustomerId;
window.PayFields.config.invoiceResult = { invoice: invoiceId }; // Links to invoice
```

### 3. Token Create Page Config

Same jQuery + spa=1 pattern, but with:

```ts
window.PayFields.config.mode = 'token';
// No amount, txnType, or invoiceResult for token mode
```

### 4. Container Sizing

Official recommended dimensions: **300×73px**

```tsx
// All three field containers:
className="w-[300px] border rounded-md bg-white"
style={{ height: '73px' }}

// Grid wrapper:
<div className="flex gap-4">
```

### 5. TypeScript Interface Updates

Add to `Window.PayFields`:

```ts
interface Window {
  PayFields?: {
    config: {
      apiKey: string;
      txnSessionKey: string;
      merchant: string;
      mode: 'txn' | 'token';
      customer: string;
      txnType?: 'sale' | 'auth' | 'refund';
      amount?: string; // Amount in cents
      invoiceResult?: { invoice: string };
    };
    fields?: Array<{
      type: string;
      element: string;
    }>;
    addFields?: () => void; // Only for non-SPA mode
    ready?: () => void; // Required for ?spa=1 mode
    onSuccess: (response: PayFieldsResponse) => void;
    onFailure: (response: PayFieldsResponse) => void;
    submit: () => void;
  };
}
```

## Files Changed

1. `src/components/checkout/payment-form.tsx` — Complete rewrite with jQuery + spa=1
2. `src/app/platform/tokens/create/page.tsx` — Same pattern for token mode
3. `src/components/checkout/checkout-content.tsx` — Add invoiceId prop threading
4. Type declarations updated

## Testing

1. Build passes: `pnpm build`
2. E2E post-deploy verification
3. Manual testing of both checkout flow and token creation
