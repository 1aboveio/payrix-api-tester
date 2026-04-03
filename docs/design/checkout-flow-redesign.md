# Design: Checkout Flow Redesign

**Status:** Proposed  
**Author:** Alo  
**Date:** 2026-04-03  
**Issue:** #505 (new)

---

## Problem

The current checkout flow is over-engineered and broken in practice:

1. **Customer lookup gate blocks payment** — user must look up email, then look up or create a customer before the card form even appears. This is friction we invented; the Payrix docs don't require it.

2. **PayFields handles customer creation natively** — the `PayFields.config.customer` object (not a string ID) creates a new customer atomically during payment. We don't need to pre-create.

3. **The `customer` field conflict** — we're using `config.customer` as a string ID for existing customers, but the docs show it as an object for new customer creation. The correct field for existing customer linking is the `customer_id` field element.

4. **Too many steps before payment** — user sees email field, lookup button, conditional "customer not found" panel, create customer button — all before seeing a card input.

---

## Official Payrix Pattern

From the docs, PayFields natively handles:
- **New customer creation**: set `PayFields.config.customer = { first, last, email }` object
- **Existing customer linking**: add `{ type: 'customer_id', element: '#cid' }` to fields array with a hidden input populated with the ID
- **Invoice linking**: `PayFields.config.invoiceResult = { invoice: 'invId' }`
- **Amount**: `PayFields.config.amount = '7100'` (cents)

The SDK submits everything together — card data + customer + invoice — in one atomic `PayFields.submit()` call.

---

## New Flow Design

### Checkout page — simplified to 2 steps

**Step 1: Email + invoice display (immediate)**
- Show invoice details (already working)
- Show email input field
- User types email and clicks "Continue"
- We do a background lookup (non-blocking — user doesn't wait to see card form)

**Step 2: Card form (immediate after email entered)**
- Card form loads immediately when email is entered (don't wait for lookup result)
- Behind the scenes: lookup email → if found, set `customer_id`; if not found, pass customer object with email/name for auto-create
- User fills card details and clicks Pay

This means: **email → card form loads immediately → Pay**. No "customer not found" gate. No create customer button.

### PayFields config (per path)

**Email found → existing customer:**
```js
// Add hidden input to DOM with customer ID
document.getElementById('cid').value = customerId;
// Field in PayFields.fields:
{ type: 'customer_id', element: '#cid' }
```

**Email not found → new customer (auto-create via PayFields):**
```js
PayFields.config.customer = {
  first: firstName || 'Guest',
  last: lastName || 'Customer',
  email: email,
};
// No customer_id field
```

Both paths use the same `invoiceResult` and `amount`:
```js
PayFields.config.invoiceResult = { invoice: invoiceId };
PayFields.config.amount = String(amountInCents);
PayFields.config.mode = 'txn';
PayFields.config.txnType = 'sale';
```

---

## Component Architecture

### `checkout-content.tsx` — orchestrator
- Fetches invoice data (existing)
- Renders `<EmailStep>` initially
- On email submit → renders `<PaymentStep>` with email + lookup result

### `email-step.tsx` — new simple component
- Single input: email
- Optional: first name, last name (shown inline, not in a modal/alert)
- "Continue to Payment" button
- On submit: calls parent with `{ email, firstName, lastName }`

### `payment-step.tsx` — replaces current `payment-form.tsx`
Props:
```ts
interface PaymentStepProps {
  email: string;
  firstName?: string;
  lastName?: string;
  invoiceId: string;
  totalAmount: number;  // in dollars
  currency: string;
  txnSessionKey: string;
  platformMerchant: string;
  platformApiKey: string;
  platformEnvironment: 'test' | 'live';
  onSuccess: (response: PayFieldsResponse) => void;
  onError: (msg: string) => void;
}
```

Internally:
1. On mount: fires background customer lookup (non-blocking)
2. Immediately loads jQuery → PayFields (`?spa=1`)
3. On SDK ready: sets config based on lookup result (customer_id OR customer object)
4. Calls `PayFields.ready()` → iframes appear
5. Submit button → `PayFields.submit()`

### PayFields field setup
```js
const fields = [
  { type: 'number', element: '#payFields-ccnumber' },
  { type: 'expiration', element: '#payFields-ccexp' },
  { type: 'cvv', element: '#payFields-cvv' },
];

// If existing customer found before SDK ready:
if (customerId) {
  document.getElementById('cid').value = customerId;
  fields.push({ type: 'customer_id', element: '#cid' });
}
// If not found: PayFields.config.customer = { first, last, email }
```

The `cid` input is a hidden `<input id="cid">` in the DOM.

---

## UI Design

```
┌─────────────────────────────────┐  ┌─────────────────────────────────┐
│ Invoice                         │  │ Payment                         │
│                                 │  │                                 │
│ Invoice #: xxx                  │  │ Email: jonas@1above.io          │
│ Status: Unpaid                  │  │ ─────────────────────────────   │
│                                 │  │                                 │
│ Subtotal: $59.00                │  │ Card Number                     │
│ Tax:      $12.00                │  │ ┌─────────────────────────────┐ │
│ Discount: -$1.00                │  │ │   [PayFields iframe]        │ │
│ ─────────────────               │  │ └─────────────────────────────┘ │
│ Total: $71.00                   │  │                                 │
└─────────────────────────────────┘  │ Expiry            CVV           │
                                     │ ┌──────────────┐ ┌───────────┐ │
  Step 1 (before email entered):     │ │ [iframe]     │ │ [iframe]  │ │
  ┌─────────────────────────────┐    │ └──────────────┘ └───────────┘ │
  │ Email: [_________________]  │    │                                 │
  │ First: [________]           │    │ [  Pay $71.00  ]               │
  │ Last:  [________]           │    └─────────────────────────────────┘
  │ [Continue to Payment]       │
  └─────────────────────────────┘
```

After "Continue to Payment":
- Invoice panel stays on left
- Payment panel on right: shows email (readonly), card fields, Pay button
- If lookup still in progress: card fields show, Pay button disabled with spinner
- Once lookup resolves: Pay button enables (config updated silently)

---

## Key Constraints

- **No customer creation gate** — if email not found, PayFields creates customer automatically via `config.customer` object
- **Card form loads immediately** — no waiting for customer lookup
- **Background lookup** — fires on email submit, resolves before or after PayFields loads
- **If lookup finishes before SDK ready**: store result in ref, apply in `initPayFields()`  
- **If SDK ready before lookup**: set customer as object with email/name, update config if lookup resolves later (call `PayFields.ready()` again to reinitialize)

---

## Files to Change

| File | Change |
|------|--------|
| `src/app/checkout/checkout-content.tsx` | Add email step, split into EmailStep + PaymentStep |
| `src/components/checkout/payment-form.tsx` | Full rewrite — remove customer lookup UI, implement background resolution |
| `src/components/checkout/email-step.tsx` | New — simple email + name form |
| `src/app/checkout/page.tsx` | Minor — pass invoiceId through |

**Do NOT change:**
- `src/hooks/use-customer-resolution.ts` — can keep as utility
- Invoice fetching logic — already works
- Confirmation page — already works

---

## Test Coverage

### E2E tests (`e2e/journeys/checkout-flow.spec.ts`) — new file

| Test | What it covers |
|------|---------------|
| `loads invoice details on valid invoiceId` | Invoice card renders with amount, status |
| `shows email step initially` | Email + name inputs visible, no card form yet |
| `continues to payment after email entry` | After "Continue", card containers appear |
| `card containers are visible at correct size` | `#payFields-ccnumber`, `#payFields-ccexp`, `#payFields-cvv` visible, min 300×73px |
| `pay button is disabled until card fields load` | Button disabled state correct |
| `shows error on invalid invoiceId` | Error state rendered |
| `shows error on missing invoiceId` | Redirect or error on no param |

> **Note on PayFields iframe testing:** PayFields iframes are cross-origin (payrix.com) and cannot be automated via Playwright CDP. Tests verify container presence and SDK loading, not card submission. Manual test required for full payment flow.

### Unit/integration tests

| Test file | What it covers |
|-----------|---------------|
| `email-step.test.tsx` | Renders correctly; "Continue" disabled until valid email; calls `onContinue` with correct data |
| `payment-form.test.tsx` | Mounts with correct props; fires background lookup on mount; renders PayFields containers; shows spinner until ready |

### Manual test checklist (required before merge to main)

- [ ] Enter email for existing customer → card form loads → submit → confirmation page
- [ ] Enter unknown email → card form loads → submit → new customer created in Payrix portal → confirmation page
- [ ] Payment appears linked to invoice in Payrix portal
- [ ] Test with Payrix test card `4242 4242 4242 4242`, any future expiry, any CVV

---

## Acceptance Criteria

1. User opens checkout URL → sees invoice + email form immediately
2. User enters email (+ optional first/last name) → clicks Continue
3. Card fields appear immediately (no waiting for customer lookup)
4. Pay button enabled once card fields load
5. User enters card details → clicks Pay
6. On success → confirmation page with transaction ID
7. If email matches existing customer → payment linked to that customer
8. If email not found → new customer auto-created by PayFields, payment linked
9. Payment applied to invoice (verified in Payrix portal)
10. No "Customer Not Found" blocking gate
11. `pnpm build` passes
12. All E2E tests pass in CI
13. Manual payment test passes (test card through confirmation)
