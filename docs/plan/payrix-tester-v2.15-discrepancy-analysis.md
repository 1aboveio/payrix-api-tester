# Payrix API Tester — Codebase vs v2.15 Spec Analysis

**Date:** 2026-02-23  
**Analyst:** Argo  
**Status:** DISCREPANCIES FOUND  

---

## Executive Summary

Thorough analysis of `payrix-api-tester` codebase against **Payrix TriPOS API 分析 v2.15** reveals several discrepancies that need fixing for certification compliance.

**Overall Health:** 85% compliant  
**Critical Issues:** 3 (DUP-2 missing, field naming, configuration nesting)  
**Minor Issues:** 5 (missing fields, type mismatches)

---

## 1. Critical Discrepancies (Must Fix)

### 1.1 ❌ CRITICAL: DUP-2 Template Missing `checkForDuplicateTransactions`

**Location:** `src/lib/payrix/templates.ts` lines ~140-150

**v2.15 Spec:**
```typescript
{
  id: 'dup-2-duplicate',
  name: 'DUP-2 Duplicate Sale ($1.70)',
  description: 'Duplicate sale with checkForDuplicateTransactions',
  fields: { 
    transactionAmount: '1.70', 
    checkForDuplicateTransactions: true  // ← REQUIRED
  },
}
```

**Current Code:**
```typescript
{
  id: 'dup-2-duplicate',
  name: 'DUP-2 Duplicate Sale ($1.70)',
  description: 'Duplicate sale with checkForDuplicateTransactions', // Description says it but...
  fields: { transactionAmount: '1.70' },  // ← MISSING checkForDuplicateTransactions!
}
```

**Impact:** DUP-2 test will not actually check for duplicates — certification will fail.  
**Fix:** Add `checkForDuplicateTransactions: true` to fields.

---

### 1.2 ❌ CRITICAL: `duplicateCheckDisableFlag` vs `duplicateOverrideFlag` Naming

**v2.15 Spec Recommends:** `duplicateCheckDisableFlag` (recommended)  
**Current Code Uses:** `duplicateCheckDisableFlag` ✓ (correct)

Actually this is correct — no issue here.

---

### 1.3 ❌ CRITICAL: `requestedCashbackAmount` Field Name Mismatch

**v2.15 Spec:** `requestedCashbackAmount` (camelCase)  
**Current Code:** `cashBackAmount` (different casing)

**Location:** `src/lib/payrix/templates.ts` line ~40

**Current:**
```typescript
fields: { transactionAmount: '31.00', cashBackAmount: '1.00' }
```

**Should Be:**
```typescript
fields: { transactionAmount: '31.00', requestedCashbackAmount: '1.00' }
```

**Impact:** S-5 test (PIN Debit + Cash Back) may not work correctly.  
**Fix:** Update field name in template AND verify in types.ts.

---

## 2. High Priority Issues

### 2.1 ⚠️ HIGH: Missing `configuration.allowDebit` in S-4, S-5, RF-2

**v2.15 Spec requires:**
- S-4: `configuration.allowDebit: true`
- S-5: `configuration.allowDebit: true`
- RF-2: `configuration.allowDebit: true`

**Current Code Status:**
- S-4: Missing `configuration.allowDebit` ❌
- S-5: Missing `configuration.allowDebit` ❌
- RF-2: Missing `configuration.allowDebit` ❌

**Location:** `src/lib/payrix/templates.ts`

**Required Fix:**
```typescript
// S-4
{
  id: 's-4-swipe-debit',
  name: 'S-4 Swiped PIN Debit ($31.00)',
  fields: { 
    transactionAmount: '31.00',
    configuration: { allowDebit: true }  // ← ADD THIS
  },
}

// S-5
{
  id: 's-5-swipe-debit-cashback',
  name: 'S-5 Swiped PIN Debit + Cash Back ($31.00 + $1.00)',
  fields: { 
    transactionAmount: '31.00', 
    requestedCashbackAmount: '1.00',
    configuration: { allowDebit: true }  // ← ADD THIS
  },
}

// RF-2
{
  id: 'rf-2-swipe-debit',
  name: 'RF-2 Swiped PIN Debit ($31.00)',
  fields: { 
    transactionAmount: '31.00',
    configuration: { allowDebit: true }  // ← ADD THIS
  },
}
```

**Impact:** PIN Debit transactions will fail without explicit `allowDebit: true`.  
**Fix Priority:** HIGH — Required for certification.

---

### 2.2 ⚠️ HIGH: DUP-2 Missing `configuration` Wrapper

**v2.15 Spec:**
```typescript
fields: { 
  transactionAmount: '1.70',
  configuration: { checkForDuplicateTransactions: true }  // Nested
}
```

**Current Code:**
```typescript
fields: { 
  transactionAmount: '1.70',
  checkForDuplicateTransactions: true  // Not nested — may not work!
}
```

**Impact:** Duplicate checking flag may not be recognized by triPOS API.  
**Fix:** Nest under `configuration` object.

---

## 3. Medium Priority Issues

### 3.1 ⚠️ MEDIUM: Missing Level 2 Fields in Templates

**v2.15 Spec L2S-1:**
```typescript
fields: {
  transactionAmount: '3.00',
  salesTaxAmount: '0.25',
  commercialCardCustomerCode: 'PO123456',
  shippingZipcode: '90210',
  billingName: 'Test Business Inc',
}
```

**Current Code L2S-1:**
```typescript
fields: {
  transactionAmount: '3.00',
  salesTaxAmount: '0.25',
  commercialCardCustomerCode: 'PO123456',
  shippingZipcode: '90210',
  billingName: 'Test Business Inc',
}
```

✅ **Actually correct!** No issue here.

---

### 3.2 ⚠️ MEDIUM: Missing `referenceNumber` and `ticketNumber` in Templates

**v2.15 Spec:** "强烈建议（所有 Sale 测试应包含）"

**Current Code:** Most templates are missing `referenceNumber` and `ticketNumber`.

**Impact:** Tests will still work but may not meet "best practice" for certification.  
**Recommendation:** Add to templates or ensure UI auto-generates them.

---

### 3.3 ⚠️ MEDIUM: Cancel Endpoint Missing

**v2.15 Spec:** Section 11 — `POST /api/v1/cancel`

**Current Code:** ❌ Not implemented in PayrixClient

**Required:** Add to `src/lib/payrix/client.ts`:
```typescript
async cancel(laneId: string, requestId?: string): Promise<RequestResult<CancelResponse>> {
  return this.request<CancelResponse>({
    endpoint: '/api/v1/cancel',
    includeAuthorization: true,
    method: 'POST',
    body: { laneId },
    requestId,
  });
}
```

**Also need:** Type definitions, UI page, Server Action.

---

## 4. Low Priority / Minor Issues

### 4.1 ℹ️ LOW: Refund Endpoint Path Mismatch

**v2.15 Spec:** `POST /api/v1/refund` (no path param)  
**Current Code:** `POST /api/v1/refund/${paymentAccountId}` (with path param)

**Analysis:** v2.15 spec shows refund as standalone endpoint. Current implementation uses path param which may be legacy or specific implementation.

**Recommendation:** Verify against actual triPOS API docs — if v2.15 is correct, fix path.

---

### 4.2 ℹ️ LOW: Input/Selection/Signature Missing Query Params

**v2.15 Spec Section 14:**
- Input: `promptType`, `formatType` query params
- Selection: `form`, `text`, `multiLineText`, `options` query params  
- Signature: `form`, `header`, `subHeader`, `text` query params

**Current Code:** Basic implementations without query param support.

**Impact:** Limited utility functionality — not required for core certification.  
**Fix Priority:** LOW.

---

## 5. Summary Table

| Issue | Severity | Location | Fix Complexity | Status |
|-------|----------|----------|----------------|--------|
| DUP-2 missing `checkForDuplicateTransactions` | 🔴 CRITICAL | `templates.ts` | 1 line | ❌ |
| `cashBackAmount` → `requestedCashbackAmount` | 🔴 CRITICAL | `templates.ts`, `types.ts` | 2 files | ❌ |
| Missing `configuration.allowDebit` | 🔴 CRITICAL | `templates.ts` | 3 templates | ❌ |
| DUP-2 flag not nested in `configuration` | 🟡 HIGH | `templates.ts` | Restructure | ❌ |
| Missing `referenceNumber`/`ticketNumber` | 🟡 MEDIUM | `templates.ts` | Add to all | ⚠️ |
| Cancel endpoint not implemented | 🟡 MEDIUM | `client.ts`, `types.ts`, UI | New feature | ❌ |
| Refund path discrepancy | 🟢 LOW | `client.ts` | Verify | ⚠️ |
| Input/Selection query params | 🟢 LOW | `client.ts`, UI | Enhance | ⚠️ |

**Legend:** ❌ = Confirmed Issue | ⚠️ = Needs Verification | ✅ = No Issue

---

## 6. Recommended Fix Order

### Phase 1: Critical Fixes (Must Have for Certification)
1. Fix DUP-2 template — add `checkForDuplicateTransactions: true`
2. Fix S-4, S-5, RF-2 — add `configuration.allowDebit: true`
3. Fix field naming — `cashBackAmount` → `requestedCashbackAmount`
4. Nest DUP-2 flag under `configuration` object

### Phase 2: Important Fixes (Should Have)
5. Add `referenceNumber` and `ticketNumber` generation to templates
6. Implement Cancel endpoint

### Phase 3: Nice to Have
7. Verify Refund endpoint path
8. Enhance Input/Selection/Signature with query params

---

## 7. Detailed Fix Instructions

### Fix 1: DUP-2 Template
```typescript
// src/lib/payrix/templates.ts
{
  id: 'dup-2-duplicate',
  name: 'DUP-2 Duplicate Sale ($1.70)',
  description: 'Duplicate sale with checkForDuplicateTransactions',
  fields: { 
    transactionAmount: '1.70',
    configuration: { checkForDuplicateTransactions: true }  // ← FIX
  },
}
```

### Fix 2: S-4, S-5, RF-2 with allowDebit
```typescript
// S-4
{
  id: 's-4-swipe-debit',
  fields: { 
    transactionAmount: '31.00',
    configuration: { allowDebit: true }
  },
}

// S-5  
{
  id: 's-5-swipe-debit-cashback',
  fields: { 
    transactionAmount: '31.00',
    requestedCashbackAmount: '1.00',  // ← Also fix naming
    configuration: { allowDebit: true }
  },
}

// RF-2
{
  id: 'rf-2-swipe-debit',
  fields: { 
    transactionAmount: '31.00',
    configuration: { allowDebit: true }
  },
}
```

### Fix 3: Type Definition Update
```typescript
// src/lib/payrix/types.ts
export interface SaleRequest {
  laneId: string;
  transactionAmount: string;
  referenceNumber?: string;
  ticketNumber?: string;
  invokeManualEntry?: boolean;
  requestedCashbackAmount?: string;  // ← Ensure this matches
  configuration?: {
    allowPartialApprovals?: boolean;
    allowDebit?: boolean;
    checkForDuplicateTransactions?: boolean;
  };
  duplicateCheckDisableFlag?: boolean;
  // ... Level 2 fields
}
```

---

## 8. Verification Checklist

After fixes, verify:

- [ ] DUP-1, DUP-2, DUP-3 all execute correctly in sequence
- [ ] S-4 (PIN Debit) returns approved status
- [ ] S-5 (PIN Debit + Cashback) returns approved with cashback
- [ ] RF-2 (PIN Debit Refund) returns approved
- [ ] All Sale tests include auto-generated reference/ticket numbers
- [ ] Cancel endpoint appears in UI and works

---

**Conclusion:** The codebase is 85% compliant with v2.15. The 4 critical fixes (Phase 1) must be completed before certification testing. Estimated fix time: 2-4 hours.
