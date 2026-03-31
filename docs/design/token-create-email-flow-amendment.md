# Design Amendment: Token Create — Email-Based Customer Resolution

**Author:** Alo  
**Date:** 2026-04-01  
**Status:** Draft  
**Amends:** `docs/design/token-management.md` (Step 1 of Create Page)  
**Linked issue:** #394 follow-up

---

## Summary

Replace the manual Customer ID input in the token create flow with a universal email-based lookup. The user experience is seamless — they enter an email, the system resolves it to either an existing customer or a new one, and proceeds to card entry without any explicit branching.

---

## 1. Amended Step 1 UX

### Current (replace this)

- Customer ID (text input, required)
- Login ID (text input, required)
- Merchant ID (text input, required)
- Session config (duration, maxTimesApproved, maxTimesUse)

### New

- **Email** (text input, required) — primary identifier
- First Name (text input, optional)
- Last Name (text input, optional)
- Session config (duration, maxTimesApproved, maxTimesUse) — unchanged
- Login and Merchant: **auto-populated from `activePlatform(config)`**, hidden from user

**UX behavior:**
- User enters email and clicks "Continue" (or presses Enter)
- System shows a brief lookup state ("Checking...")
- **Match found:** Display a confirmation banner: "✓ Existing customer found: John Doe (t1_cus_xxxx)" — first/last fields pre-filled. User can edit.
- **No match:** No banner, no error — flow continues transparently. A new customer will be created alongside the token.
- Then user clicks "Create Session & Load PayFields" to proceed to card entry

---

## 2. Customer Resolution Logic

```
User enters email
        │
        ▼
GET /customers?filter=email[equals]=<input>
        │
   ┌────┴────┐
found?      not found
   │              │
   ▼              ▼
resolve =     resolve =
customerId    { login, merchant, email, first?, last? }
(string)      (object)
        │
        ▼
createTxnSession (same as before)
        │
        ▼
PayFields config.customer = resolvedValue
        │
        ▼
Card entry → POST /tokens
```

**Multiple matches:** If `GET /customers` returns >1 result for the same email, use the first (most recent or by created date). Display a warning: "Multiple customers found for this email. Using: {id}." Engineer can add a selector dropdown as a follow-up if needed.

---

## 3. PayFields Integration — Critical Question

The current `window.PayFields.config.customer` is typed as `string` in our codebase and likely only accepts a string ID in the SDK.

**Strategy: pre-create customer when no match, then always pass a string ID**

This avoids relying on undocumented SDK behavior:

```
No match path:
  1. User clicks "Create Session & Load PayFields"
  2. Server action calls POST /customers (new action needed)
     → creates customer with { login, merchant, email, first?, last? }
     → returns customer ID
  3. Store the new customer ID in state
  4. createTxnSession (same as before)
  5. PayFields config.customer = newCustomerId (always a string)
```

This means:
- **Match path:** `config.customer = resolvedCustomerId` (looked up from email)
- **No match path:** `config.customer = newlyCreatedCustomerId` (created in Step 1)
- PayFields always receives a string — no SDK behavior risk

**Why not nested create?**

While `POST /tokens` supports nested customer creation, PayFields SDK internally constructs the `/tokens` request. We can't inject a customer object into `PayFields.config.customer` reliably without SDK documentation confirming this. Pre-creating the customer is safer, explicit, and matches the codebase pattern (server actions for all API calls).

---

## 4. Type Changes

### `Token.customer` — widen to union

```typescript
// src/lib/platform/types.ts

// Inline customer object when returned by nested create (or embed)
export interface TokenCustomerObject {
  id: string;
  first?: string;
  last?: string;
  email?: string;
}

export interface Token {
  // ...existing fields...
  customer: string | TokenCustomerObject; // string ID or embedded object
}
```

Update all display logic for `Token.customer` to handle both shapes:

```typescript
function getCustomerId(token: Token): string {
  if (typeof token.customer === 'string') return token.customer;
  return token.customer.id;
}
```

### New type: `CreateCustomerRequest` (if not already in types.ts)

```typescript
export interface CreateCustomerRequest {
  login: string;
  merchant: string;
  email: string;
  first?: string;
  last?: string;
}
```

---

## 5. Server Action Changes

### New action needed: `createCustomerFromEmailAction`

```typescript
// In src/actions/platform.ts

export async function createCustomerFromEmailAction(
  context: PlatformActionContext,
  body: CreateCustomerRequest
): Promise<ServerActionResult<unknown>> {
  return runPlatformAction(
    context,
    (client) => client.createCustomer(body),
    '/customers',
    'POST',
    body
  );
}
```

`createCustomer` already exists on `PlatformClient` — no client changes needed.

### Existing action reuse: `listCustomersAction`

Used as-is with filter `{ field: 'email', operator: 'equals', value: email }`.

---

## 6. UI Component Changes

### State additions to `CreateTokenPage`

```typescript
// Replace: customerId, loginId, merchantId
// With:
const [email, setEmail] = useState('');
const [firstName, setFirstName] = useState('');
const [lastName, setLastName] = useState('');
const [resolvedCustomerId, setResolvedCustomerId] = useState<string | null>(null);
const [customerLookupState, setCustomerLookupState] = useState<'idle' | 'looking' | 'found' | 'new'>('idle');
const [lookupResult, setLookupResult] = useState<Customer | null>(null);
```

Login and merchant come from `activePlatform(config)` — no state needed.

### Step 1 render changes

Replace the current three-field form with:

```
┌─────────────────────────────────────────────────────┐
│  Email Address *                                    │
│  [user@example.com              ] [Check →]         │
│                                                     │
│  ✓ Customer found: John Doe (t1_cus_xxxx)           │  ← shown if found
│  ⚠ Multiple matches — using most recent             │  ← shown if >1
│                                                     │
│  First Name (optional)    Last Name (optional)      │
│  [John            ]       [Doe             ]        │
│                                                     │
│  ── Session Config ──────────────────────────────── │
│  Duration (min)   Max Approved   Max Uses           │
│  [30      ]       [1       ]     [3      ]          │
│                                                     │
│  [Create Session & Load PayFields →]                │
└─────────────────────────────────────────────────────┘
```

"Check" triggers email lookup. "Create Session" button runs:
1. If `customerLookupState === 'new'`: call `createCustomerFromEmailAction`, get ID
2. Call `createTxnSessionAction` (login/merchant from config)
3. Set `config.customer = resolvedCustomerId`
4. Advance to Step 2

### Email validation

Simple: check `email.includes('@')` before lookup, show inline error if invalid.

---

## 7. Edge Cases

| Scenario | Handling |
|----------|----------|
| Invalid email format | Inline validation before lookup; disable "Check" button |
| Lookup returns 0 results | `customerLookupState = 'new'`; proceed transparently |
| Lookup returns 1 result | `customerLookupState = 'found'`; show confirmation banner; pre-fill name |
| Lookup returns >1 results | Use `data[0]`; show "Multiple matches" warning badge |
| Customer create fails (no match path) | `toast.error()` with API error; stay on Step 1 |
| txnSession create fails | Same as current — toast + stay on Step 1 |
| Email input cleared after lookup | Reset `customerLookupState` to `'idle'`, clear `resolvedCustomerId` |
| Lookup API error (500/network) | Show "Lookup failed" toast; treat as "new" to allow flow to continue |
| Config missing platformApiKey | Same guard as current — `toast.error()` before any API call |
| Config missing login/merchant | These come from `activePlatform(config)`. If not set, block with "Platform credentials not configured" |

---

## 8. Implementation Notes

### What changes

| File | Change |
|------|--------|
| `src/app/platform/tokens/create/page.tsx` | Replace customerId/loginId/merchantId state + form with email/firstName/lastName; add lookup logic; add pre-create customer step |
| `src/lib/platform/types.ts` | Widen `Token.customer` to `string \| TokenCustomerObject`; add `TokenCustomerObject` interface |
| `src/actions/platform.ts` | Add `createCustomerFromEmailAction` (thin wrapper over existing `createCustomer`) |

### What stays the same

- Step 2 (PayFields card entry) — no changes
- Step 3 (Result) — no changes; `Token.customer` display handled by `getCustomerId()` helper
- `PlatformClient.createCustomer()` — already exists, no change
- `listCustomersAction` — reused as-is
- `createTxnSessionAction` — reused, just change `login`/`merchant` to come from config
- Session config fields (duration, maxTimesApproved, maxTimesUse) — unchanged

### Login and merchant from config

Check how `activePlatform(config)` exposes these values. The existing `createTxnSession` call in Step 1 currently requires the user to enter login/merchant manually. For the new flow:

```typescript
const { platformApiKey, platformLogin, platformMerchant } = activePlatform(config);
```

If `platformLogin` / `platformMerchant` are not exposed in the config shape, the engineer needs to either:
1. Add them to the config if they're available settings, or
2. Keep a single "Login ID" field (hidden unless config doesn't have it)

Check `src/lib/config.ts` and `usePayrixConfig` hook to confirm what's available.

---

## Summary of Change

Before: 3 manual inputs (Customer ID, Login, Merchant) → proceed to PayFields
After: 1 email input → auto-resolve (lookup or pre-create) → auto-get login/merchant from config → proceed to PayFields

User sees: enter email, optionally name, click go. The customer lookup and creation happen transparently.
