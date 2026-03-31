# Checkout Page Design — payrix-api-tester

**Date:** 2026-04-01  
**Status:** Design Proposal  
**Issue:** TBD (create after design approval)  
**Owner:** Alo (Chief Architect)  
**Engineer:** Suzzy (Frontend) — default for portal/admin features  

---

## 1. Overview

This document defines the design for a **Checkout Page** in the payrix-api-tester app. The checkout provides a Stripe-style experience with a bill/subscription summary on the left and a payment form on the right.

**Purpose:** Enable one-time invoice payments and subscription setup via a unified checkout experience.

**Scope:**
- New `/checkout` page with query params (`invoiceId` or `subscriptionId`)
- New API client methods for subscriptions, plans, and token binding
- Confirmation state/page after successful payment
- Entry points from invoice detail (existing) and future subscription pages

---

## 2. Page Layout

### 2.1 Desktop (≥768px) — Two-Panel Grid

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Checkout                                      │
├────────────────────────────────┬────────────────────────────────────────┤
│   BILL SUMMARY (Left 40%)      │   PAYMENT FORM (Right 60%)           │
│                                │                                        │
│  ┌──────────────────────────┐  │  ┌────────────────────────────────┐  │
│  │ Invoice #INV-001         │  │  │ Email *                         │  │
│  │ Status: Pending          │  │  │ [............................] │  │
│  │ Due: Apr 15, 2026       │  │  │                                │  │
│  └──────────────────────────┘  │  │ First Name                      │  │
│                                │  │ [............................] │  │
│  Line Items:                   │  │                                │  │
│  ├─ Item 1         $50.00     │  │ Last Name                       │  │
│  ├─ Item 2         $25.00     │  │ [............................] │  │
│  ├─ Tax             $7.50     │  │                                │  │
│  └──────────────────────────┘  │  └────────────────────────────────┘  │
│                                │                                        │
│  Subtotal:        $75.00       │  ┌────────────────────────────────┐  │
│  Tax:             $7.50        │  │  PayFields Secure Iframes      │  │
│  ─────────────────────────     │  │  [#payFields-ccnumber]         │  │
│  Total:          $82.50        │  │  [#payFields-ccexp]            │  │
│                                │  │  [#payFields-cvv]             │  │
│                                │  └────────────────────────────────┘  │
│                                │                                        │
│                                │  [ 💳 Pay $82.50 ]                   │
│                                │                                        │
└────────────────────────────────┴────────────────────────────────────────┘
```

### 2.2 Mobile (<768px) — Vertical Stack

```
┌─────────────────────────────────────────┐
│            Checkout                     │
├─────────────────────────────────────────┤
│  BILL SUMMARY                           │
│  ┌─────────────────────────────────────┐│
│  │ Invoice #INV-001  Status: Pending  ││
│  │ Due: Apr 15, 2026                 ││
│  │ ...line items...                   ││
│  │ Total: $82.50                      ││
│  └─────────────────────────────────────┘│
│                                         │
│  PAYMENT FORM                           │
│  ┌─────────────────────────────────────┐│
│  │ Email *                             ││
│  │ [............................]     ││
│  │ ...PayFields iframes...            ││
│  │ [ 💳 Pay $82.50 ]                   ││
│  └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

### 2.3 Visual Specifications

- **Left panel background:** `bg-muted/30` (subtle separator)
- **Card style:** shadcn/ui `Card` component with `CardHeader`, `CardContent`
- **Typography:** Use existing app patterns — heading sizes match other pages
- **Spacing:** `gap-6` between panels, `p-6` internal card padding

---

## 3. URL Structure

| URL | Mode | Description |
|-----|------|-------------|
| `/checkout?invoiceId={id}` | `invoice` | One-time invoice payment |
| `/checkout?subscriptionId={id}` | `subscription` | Subscription setup |
| `/checkout/confirmation` | `confirmation` | Post-payment receipt |

**Implementation:**
- Single page component at `src/app/checkout/page.tsx`
- URLSearchParams determines mode (`invoice` | `subscription`)
- If both params present → prioritize `invoiceId` (payment first)
- If neither → show error state "No payment target specified"

---

## 4. Data Flow

### 4.1 Page Load

```
checkout/page.tsx (Server Component)
         │
         ▼
   Extract invoiceId / subscriptionId from searchParams
         │
         ├──▶ getInvoice(invoiceId) ──▶ Invoice data
         │                                    │
         ├──▶ getSubscription(subscriptionId) ──▶ Subscription data
         │                                    │
         ▼                                    ▼
   If mode=invoice: fetch line items via getInvoiceItems(invoiceId)
   If mode=subscription: fetch plan via getPlan(subscription.plan)
         │
         ▼
   Render checkout with bill data
```

### 4.2 Customer Resolution (Email Input)

```
User enters email ──▶ onBlur/onChange (debounced 300ms)
         │
         ▼
   Server Action: resolveCustomer(email)
         │
         ├──▶ GET /customers?email[equals]=xxx
         │         │
         │    ┌────┴────┐
         │    ▼         ▼
         │  Found    Not Found
         │    │         │
         │    ▼         ▼
         │ Use      POST /customers
         │ existing (pre-create)
         │ customer
         │    ID         │
         │         ▼    ▼
         └──▶ Return { customerId, isNew: boolean }
                   │
                   ▼
         Store customerId in form state
```

**Note:** Customer resolution happens BEFORE PayFields initialization because PayFields requires a valid `customer` string ID.

### 4.3 PayFields Initialization

```
After customer resolved:
         │
         ▼
   Server Action: createTxnSession(config, customerId, mode)
         │
         ├──▶ POST /txnSessions
         │    Body: { merchant, customer, type: 'token', ... }
         │
         ▼
   Return: { txnSessionKey, apiKey, ... }
         │
         ▼
   Client: Initialize PayFields SDK
         │
         ▼
   window.PayFields.setup({
     apiKey,
     txnSessionKey,
     merchant,
     customer: customerId,  // string ID from resolution
     mode: 'token',
     containers: {
       ccnumber: 'payFields-ccnumber',
       ccexp: 'payFields-ccexp',
       cvv: 'payFields-cvv'
     },
     onSuccess: handleTokenSuccess,
     onFailure: handleTokenFailure
   })
```

### 4.4 Checkout Submission

#### Invoice Path (One-Time)

```
PayFields.onSuccess({ token: "raw_hash_xxx" })
         │
         ▼
   Server Action: payInvoice(invoiceId, token)
         │
         ├──▶ POST /txns
         │    Body: {
         │      merchant: config.merchantId,
         │      token: "raw_hash_xxx",
         │      type: 1,  // sale
         │      total: invoice.total,
         │      origin: 2  // checkout
         │    }
         │
         ▼
   On success: Redirect to /checkout/confirmation
   On failure: Show error, allow retry
```

#### Subscription Path (Recurring)

```
PayFields.onSuccess({ token: "raw_hash_xxx" })
         │
         ▼
   Server Action: createSubscriptionToken(subscriptionId, token)
         │
         ├──▶ POST /subscriptionTokens
         │    Body: {
         │      subscription: subscriptionId,
         │      token: "raw_hash_xxx"
         │    }
         │
         ▼
   On success: Redirect to /checkout/confirmation
   On failure: Show error, allow retry
```

### 4.5 Confirmation Page

```
/checkout/confirmation?type=invoice&txnId=xxx
         │
         ▼
   Display:
   ┌─────────────────────────────────────┐
   │   ✅ Payment Successful!            │
   │                                     │
   │   Receipt                           │
   │   ─────────                         │
   │   Invoice: #INV-001                │
   │   Amount: $82.50                   │
   │   Card: **** 4242                   │
   │   Date: Apr 1, 2026                 │
   │                                     │
   │   [ Back to Invoice ]               │
   └─────────────────────────────────────┘
```

---

## 5. Entry Points

### 5.1 Invoice Detail Page

File: `src/app/platform/invoices/[id]/page.tsx` (future)

Add "Pay Now" button in invoice header when status is `pending`:

```tsx
{invoice.status === 'pending' && (
  <Button asChild>
    <Link href={`/checkout?invoiceId=${invoice.id}`}>
      Pay Now
    </Link>
  </Button>
)}
```

### 5.2 Subscription Pages (Future)

- `src/app/platform/subscriptions/page.tsx` — list view
- `src/app/platform/subscriptions/[id]/page.tsx` — detail view

Both add "Subscribe / Pay" button linking to `/checkout?subscriptionId={id}`.

### 5.3 Direct URL Access

Users can bookmark or share `/checkout?invoiceId=xxx` directly.

**Security note:** Validate that invoice/subscription belongs to accessible merchant context. If user lacks permission → 403 error.

---

## 6. API Client Methods

### 6.1 New Methods in `src/lib/platform/client.ts`

```typescript
// Existing pattern reference: src/lib/payrix/client.ts
// New platform client at src/lib/platform/client.ts

interface PlatformClient {
  // Invoice (already exists in some form — verify)
  getInvoice(id: string): Promise<RequestResult<Invoice>>;
  listInvoices(params?: ListParams): Promise<RequestResult<Invoice[]>>;
  getInvoiceItems(invoiceId: string): Promise<RequestResult<InvoiceItem[]>>;
  
  // Subscriptions (NEW)
  getSubscription(id: string): Promise<RequestResult<Subscription>>;
  listSubscriptions(params?: ListParams): Promise<RequestResult<Subscription[]>>;
  
  // Plans (NEW)
  getPlan(id: string): Promise<RequestResult<Plan>>;
  
  // Token Binding (NEW)
  createSubscriptionToken(body: CreateSubscriptionTokenRequest): Promise<RequestResult<SubscriptionToken>>;
  createTransaction(body: CreateTransactionRequest): Promise<RequestResult<Transaction>>;
  
  // Customers (NEW or existing)
  getCustomerByEmail(email: string): Promise<RequestResult<Customer | null>>;
  createCustomer(body: CreateCustomerRequest): Promise<RequestResult<Customer>>;
  
  // Token Session (NEW)
  createTxnSession(body: CreateTxnSessionRequest): Promise<RequestResult<TxnSession>>;
}
```

### 6.2 New Types in `src/lib/platform/types.ts`

```typescript
// Checkout Mode
export type CheckoutMode = 'invoice' | 'subscription';

// Invoice (verify against actual API response)
export interface Invoice {
  id: string;
  merchant: string;
  customer: string;
  status: 'pending' | 'paid' | 'void' | 'expired';
  total: number;
  dueDate: string; // ISO date
  emails?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface InvoiceItem {
  id: string;
  invoice: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

// Subscription (from OpenAPI spec)
export interface Subscription {
  id: string;
  plan: string;           // Plan ID
  start: string;         // YYYYMMDD
  finish: string;        // YYYYMMDD
  tax?: number;
  inactive?: boolean;
  frozen?: boolean;
  failures?: number;
  maxFailures?: number;
  origin?: number;
  firstTxn?: string;
  txnDescription?: string;
  order?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Plan (from OpenAPI spec)
export interface Plan {
  id: string;
  name: string;
  billingCycle: 'weekly' | 'monthly' | 'quarterly' | 'annual';
  amount: number;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Token Binding
export interface SubscriptionToken {
  id: string;
  subscription: string;
  token: string;
  createdAt: string;
}

export interface CreateSubscriptionTokenRequest {
  subscription: string;
  token: string;
}

// Transaction (for invoice payment)
export interface Transaction {
  id: string;
  merchant: string;
  customer: string;
  token: string;
  type: number;         // 1 = sale
  total: number;
  status: string;
  origin: number;       // 2 = checkout
  createdAt: string;
}

export interface CreateTransactionRequest {
  merchant: string;
  token: string;
  type: number;
  total: number;
  origin: number;
  customer?: string;
}

// Customer
export interface Customer {
  id: string;
  login: string;
  merchant: string;
  email: string;
  firstName?: string;
  lastName?: string;
  createdAt?: string;
}

export interface CreateCustomerRequest {
  login: string;
  merchant: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

// TxnSession (for PayFields)
export interface TxnSession {
  key: string;
  apiKey: string;
  merchant: string;
  customer: string;
  expiresAt: string;
}

export interface CreateTxnSessionRequest {
  merchant: string;
  customer: string;
  type: 'token' | 'sale';
  // Additional config as needed
}
```

---

## 7. File Structure

### 7.1 New Files

| File | Purpose |
|------|---------|
| `src/lib/platform/types.ts` | All type definitions above |
| `src/lib/platform/client.ts` | Platform API client (existing or new) |
| `src/actions/platform.ts` | Server actions for checkout flow |
| `src/app/checkout/page.tsx` | Main checkout page |
| `src/app/checkout/confirmation/page.tsx` | Confirmation page |
| `src/components/checkout/bill-summary.tsx` | Left panel component |
| `src/components/checkout/payment-form.tsx` | Right panel form |
| `src/components/checkout/payfields-container.tsx` | PayFields SDK wrapper |
| `src/components/checkout/customer-info.tsx` | Email + name fields |
| `src/hooks/useCustomerResolution.ts` | Email lookup + pre-create hook |
| `src/hooks/usePayFields.ts` | PayFields initialization hook |

### 7.2 Modified Files

| File | Change |
|------|--------|
| `src/lib/platform/types.ts` | Add checkout-related types (if not new) |
| `src/lib/platform/client.ts` | Add new API methods (if existing) |
| `src/app/platform/invoices/[id]/page.tsx` | Add "Pay" button (future) |
| `src/app/platform/invoices/page.tsx` | Add "Pay" button in list (future) |
| `src/components/layout/app-shell.tsx` | Add checkout to nav (optional) |

### 7.3 Directory Structure (New)

```
src/
├── app/
│   ├── checkout/
│   │   ├── page.tsx           # Main checkout
│   │   └── confirmation/
│   │       └── page.tsx      # Confirmation
│   └── platform/             # Future
│       ├── invoices/
│       │   ├── [id]/
│       │   │   └── page.tsx  # Invoice detail
│       │   └── page.tsx      # Invoice list
│       └── subscriptions/
│           ├── [id]/
│           │   └── page.tsx  # Subscription detail
│           └── page.tsx      # Subscription list
├── components/
│   └── checkout/
│       ├── bill-summary.tsx
│       ├── payment-form.tsx
│       ├── payfields-container.tsx
│       └── customer-info.tsx
├── hooks/
│   ├── useCustomerResolution.ts
│   └── usePayFields.ts
├── lib/
│   └── platform/
│       ├── client.ts
│       └── types.ts
└── actions/
    └── platform.ts
```

---

## 8. Confirmation Page

### 8.1 Route

`/checkout/confirmation`

### 8.2 Query Params

- `type` — `invoice` | `subscription`
- `txnId` — Transaction ID (for invoice)
- `subscriptionId` — Subscription ID (for subscription)
- `tokenLast4` — Last 4 digits of card (from token response)

### 8.3 Display Content

**For Invoice:**
- Payment status (success/failure)
- Invoice ID and amount
- Transaction ID
- Card (last4)
- Timestamp

**For Subscription:**
- Subscription status (active)
- Plan name and billing cycle
- First payment amount
- Next billing date

### 8.4 Actions

- "View Invoice" — back to invoice detail
- "View Subscription" — back to subscription detail (future)
- "Done" — back to home or dashboard

---

## 9. Edge Cases

### 9.1 Invalid/Expired Invoice

- If invoice status is not `pending` → show error "Invoice is not payable"
- If current date > due date → show warning "Invoice is overdue" but allow payment
- If invoice is `void` → show error "Invoice is void"

### 9.2 Already-Paid Invoice

- If invoice.status === 'paid' → show "Already paid" with payment date
- Disable payment form, show receipt link if available

### 9.3 Subscription with No Plan

- If subscription.plan is missing → show error "Subscription has no plan"
- Do not render payment form

### 9.4 PayFields Failure

- `onFailure` callback → display error message from PayFields
- Allow retry without re-entering card (SDK retains state)

### 9.5 Customer Create Failure

- If POST /customers fails → show error "Failed to create customer"
- Log error details, allow retry

### 9.6 Network Errors

- Timeout after 30s → show "Request timed out, please try again"
- 4xx errors → show specific error message
- 5xx errors → show "Server error, please try again later"

### 9.7 Concurrent Payment Prevention

- Disable "Pay" button after click (loading state)
- Prevent double-submit

---

## 10. E2E Test Considerations

### 10.1 Testable with Real API

- Page loads correctly with valid invoiceId/subscriptionId
- Invoice data displays in bill summary
- Subscription + plan data displays correctly
- Email customer resolution (existing customer)
- Email customer resolution (new customer creation)
- Successful invoice payment flow
- Successful subscription token binding
- Confirmation page displays correct data
- Error states display appropriately
- Mobile responsive layout

### 10.2 Requires Mocking

- **PayFields SDK:** The actual SDK requires a valid txnSession and renders iframes
  - Mock `window.PayFields` object with controlled `onSuccess`/`onFailure`
  - Or use test mode if PayFields provides one
- **Token response:** Can mock the token hash returned by PayFields
- **Browser iframe rendering:** Visual regression tests may need mocking

### 10.3 API Endpoint Integration Tests (Required)

Every new API integration must have a dedicated integration test that calls the real Payrix test API and validates the response shape. These tests run independently of the UI — they verify that our `PlatformClient` methods and server actions work correctly against the live Payrix sandbox.

**Test file:** `e2e/tests/platform-checkout-api.spec.ts`

**Required test cases:**

```typescript
// Subscription API tests
test('GET /subscriptions - list subscriptions', async () => { ... });
test('GET /subscriptions/{id} - get subscription detail', async () => { ... });
test('GET /plans/{id} - get plan detail for subscription', async () => { ... });

// Token binding tests
test('POST /subscriptionTokens - bind token to subscription', async () => { ... });
test('POST /txns - one-time payment with token hash', async () => { ... });

// Session management tests
test('POST /txnSessions - create txn session for PayFields', async () => { ... });

// Customer resolution tests
test('GET /customers?email[equals]=... - lookup existing customer by email', async () => { ... });
test('POST /customers - pre-create new customer from email', async () => { ... });
test('GET /customers?email[equals]=... - no match returns empty', async () => { ... });

// Invoice data tests
test('GET /invoices/{id} - fetch invoice for bill summary', async () => { ... });
test('GET /invoiceItems?invoice=... - fetch invoice line items', async () => { ... });
```

**Test patterns:**
- Use `TEST_PLATFORM_API_KEY` env var (same as existing E2E tests)
- Each test calls the real Payrix test API via `PlatformClient` or server action
- Validate response shape matches our TypeScript types
- Validate pagination, error responses, and edge cases (invalid IDs → 404)
- Use `test.describe.serial` for tests that depend on created resources (e.g., create customer → lookup)

**Test card numbers for PayFields sandbox:**
- Visa: `4111111111111111` (always approved)
- Mastercard: `5431111111111111`
- Declined: `4000000000000002`

### 10.4 E2E UI Test Approach

1. **Integration tests:** Page renders with mock API responses
2. **E2E tests (real API):** Full flow without actual card (use test card via mocked PayFields)
3. **PayFields mock:** Use `page.addInitScript()` to inject mock `PayFields` global that simulates `onSuccess`/`onFailure`

---

## 11. Implementation Order

### Phase 1: Foundation (Days 1-2)

1. Add types to `src/lib/platform/types.ts`
2. Create `src/lib/platform/client.ts` with new methods
3. Add server actions in `src/actions/platform.ts`

### Phase 2: UI Components (Days 2-3)

4. Create `src/components/checkout/bill-summary.tsx`
5. Create `src/components/checkout/customer-info.tsx`
6. Create `src/components/checkout/payfields-container.tsx`
7. Create `src/components/checkout/payment-form.tsx`

### Phase 3: Hooks (Day 3)

8. Create `src/hooks/useCustomerResolution.ts`
9. Create `src/hooks/usePayFields.ts`

### Phase 4: Pages (Days 3-4)

10. Build `src/app/checkout/page.tsx` (main checkout)
11. Build `src/app/checkout/confirmation/page.tsx`

### Phase 5: Integration (Day 4)

12. Add entry point "Pay" button to existing invoice detail (if exists)
13. Test end-to-end flow with mock PayFields

### Phase 6: Future (Out of Scope)

- Invoice list page with "Pay" button
- Subscription list/detail pages
- Additional validation (email format, etc.)

---

## 12. References

- Existing PayrixClient pattern: `src/lib/payrix/client.ts`
- Server actions pattern: `src/actions/payrix.ts`
- PayFields integration: See token creation docs (from task context)
- shadcn/ui components: Use `Card`, `Button`, `Input`, `Label`, `Form`

---

## 13. Open Questions

1. **Authentication:** Should checkout require authentication? (Assume no for MVP — public payment page)
2. **Merchant context:** How is merchant determined? From query param? Session? Config?
3. **Invoice line items:** Confirm API structure for `GET /invoiceItems?invoice=xxx`
4. **Plan billing display:** Confirm format for billing cycle (weekly/monthly/quarterly/annual)
5. **Test card:** Is there a test card number for PayFields sandbox?

---

**End of Design Document**