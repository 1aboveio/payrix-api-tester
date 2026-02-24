# Payrix API Tester - Gap Analysis & Implementation Plan

**Based on:** Payrix TriPOS API 分析 v2.16 vs Existing Codebase  
**Date:** 2026-02-24  
**Status:** Comprehensive Implementation Plan

---

## Executive Summary

The `payrix-api-tester` codebase is currently at **zero implementation** (only ARCHITECTURE.md exists). This document provides a comprehensive gap analysis between the **v2.16 spec** (61 test cases across ~20 endpoints) and the planned architecture, with prioritized implementation phases.

---

## 1. Complete API Endpoint Gap Analysis

### 1.1 Lane Management (Section 1 of spec)

| Endpoint | Spec Status | Architecture Status | Gap | Priority |
|----------|-------------|---------------------|-----|----------|
| `POST /cloudapi/v1/lanes/` | ✅ Documented | ✅ Planned | None | P0 |
| `DELETE /cloudapi/v1/lanes/{laneId}` | ✅ Documented | ✅ Planned | None | P0 |
| `GET /cloudapi/v1/lanes/{laneId}/connectionstatus` | ✅ Documented | ✅ Planned | None | P0 |
| `GET /cloudapi/v1/lanes/` (List) | ✅ Documented | ⚠️ Mentioned | **Missing implementation plan** | P1 |

**Gap Details:**
- List Lanes endpoint exists in spec but not explicitly in architecture
- Need to add `listLanes()` to PayrixClient

### 1.2 Transaction APIs (Sections 2-10 of spec)

| Endpoint | Spec Status | Architecture Status | Gap |
|----------|-------------|---------------------|-----|
| `POST /api/v1/sale` | ✅ Full test matrix (S-1..S-10, L2S-1/2, DUP-1/2/3) | ✅ Planned | **Missing Tip Prompt support** |
| `POST /api/v1/authorization` | ✅ Full test matrix (A-1..A-8, L2A-1/2) | ✅ Planned | None |
| `POST /api/v1/authorization/{id}/completion` | ✅ Full test matrix (C-1..C-8) | ✅ Planned | None |
| `POST /api/v1/refund` | ✅ Full test matrix (RF-1..RF-5) | ✅ Planned | None |
| `POST /api/v1/return/{id}/{type}` | ✅ Full test matrix (RT-1..RT-5) | ✅ Planned | None |
| `POST /api/v1/reversal/{id}/{type}` | ✅ Full test matrix (RV-1..RV-6) | ✅ Planned | None |
| `POST /api/v1/void/{id}` | ✅ Full test matrix (V-1..V-4) | ✅ Planned | None |
| `POST /api/v1/force/credit` | ✅ Full test matrix (F-1..F-3) | ✅ Planned | None |
| `GET /api/v1/binQuery/{laneId}` | ✅ Full test matrix (BQ-1..BQ-3) | ✅ Planned | None |
| `POST /api/v1/cancel` | ✅ Documented | ❌ **MISSING** | **Not in architecture** |

### 1.3 Utility APIs (Section 14 of spec)

| Endpoint | Spec Status | Architecture Status | Gap |
|----------|-------------|---------------------|-----|
| `POST /api/v1/display` | ✅ Documented | ✅ Planned | None |
| `POST /api/v1/idle` | ✅ Documented | ✅ Planned | None |
| `GET /api/v1/input/{laneId}` | ✅ Documented with query params | ✅ Planned | **Missing query params in plan** |
| `GET /api/v1/selection/{laneId}` | ✅ Documented with query params | ✅ Planned | **Missing query params in plan** |
| `GET /api/v1/signature/{laneId}` | ✅ Documented with query params | ✅ Planned | **Missing query params in plan** |
| `GET /api/v1/status/host` | ✅ Documented | ✅ Planned | None |
| `GET /api/v1/status/triPOS/{echo}` | ✅ Documented | ✅ Planned | None |
| `POST /api/v1/receipt` | ✅ Fully documented (v2.15+) | ⚠️ Mentioned | **Missing full implementation plan** |

### 1.4 Query APIs (Section 15 of spec)

| Endpoint | Spec Status | Architecture Status | Gap |
|----------|-------------|---------------------|-----|
| `POST /api/v1/transactionQuery` | ✅ Documented | ❌ **MISSING** | **Not in architecture** |

---

## 2. Critical Feature Gaps

### 2.1 🔴 HIGH PRIORITY - Missing from Architecture

#### 1. Tip Prompt Support (Section 2.4 of spec)
**Status:** Spec v2.16 added full Tip Prompt documentation - **NOT in architecture**

**Spec Requirements:**
- Pre-set tip: `tipAmount` field
- PIN Pad tip prompt: `configuration.enableTipPrompt` + `configuration.tipPromptOptions`
- Response fields: `subTotalAmount`, `tipAmount`, `transactionAmount`
- Receipt integration for tips

**Implementation Needed:**
```typescript
// Add to SaleRequest interface
interface SaleRequest {
  // ... existing fields
  tipAmount?: string;  // Pre-set tip
  configuration?: {
    enableTipPrompt?: boolean;  // Enable PIN Pad tip
    tipPromptOptions?: string[];  // ["15", "18", "20", "none"] or ["5.00", "10.00", "other"]
    // ... existing config fields
  }
}

// Add to SaleResponse interface
interface SaleResponse {
  // ... existing fields
  subTotalAmount?: string;  // Original amount
  tipAmount?: string;  // Selected tip amount
  // transactionAmount already exists (final total)
}
```

**UI Changes:**
- Tip configuration section in Sale form
- Tip preset input field
- PIN Pad tip options builder (array of strings)
- Response display showing subTotal + tip + total

#### 2. Cancel Endpoint (Section 11 of spec)
**Status:** Documented in spec v2.13+ - **NOT in architecture**

```typescript
// Add to PayrixClient
async cancel(laneId: string): Promise<RequestResult<CancelResponse>>

// Route: /api/v1/cancel
// Method: POST
// Body: { laneId: number }
```

#### 3. Transaction Query Endpoint (Section 15 of spec)
**Status:** Documented for reconciliation - **NOT in architecture**

```typescript
// Add to PayrixClient
async transactionQuery(request: TransactionQueryRequest): Promise<RequestResult<TransactionQueryResponse>>

interface TransactionQueryRequest {
  approvalNumber: string;
  referenceNumber: string;
  terminalId: string;
  transactionDateTimeBegin: string;
  transactionDateTimeEnd: string;
  transactionId: string;
}
```

#### 4. List Lanes Endpoint (Section 1.4 of spec)
**Status:** Documented - **NOT in architecture**

```typescript
// Add to PayrixClient
async listLanes(): Promise<RequestResult<ListLanesResponse>>

// Route: GET /cloudapi/v1/lanes/
```

### 2.2 🟡 MEDIUM PRIORITY - Query Parameters Missing

#### Utility Endpoints Query Params

| Endpoint | Missing Query Params |
|----------|---------------------|
| `GET /api/v1/input/{laneId}` | `promptType`, `formatType` |
| `GET /api/v1/selection/{laneId}` | `form`, `text`, `multiLineText`, `options` |
| `GET /api/v1/signature/{laneId}` | `form`, `header`, `subHeader`, `text` |
| `GET /api/v1/binQuery/{laneId}` | `invokeManualEntry`, `isCscSupported` |

**Implementation:**
```typescript
// Input request
interface InputRequest {
  laneId: string;
  promptType?: string;  // Amount, AccountNumber, ZIPCode, etc.
  formatType?: string;  // AmountWithDollarCommaDecimal, etc.
}

// Selection request
interface SelectionRequest {
  laneId: string;
  form: 'MultiOption';
  text?: string;
  multiLineText?: string;  // line1|line2|line3
  options: string;  // one|two|three
}

// Signature request
interface SignatureRequest {
  laneId: string;
  form: 'simple' | 'contract';
  header?: string;
  subHeader?: string;
  text?: string;
}

// BIN Query request
interface BinQueryRequest {
  laneId: string;
  invokeManualEntry?: boolean;
  isCscSupported?: boolean;
}
```

### 2.3 🟢 LOW PRIORITY - Enhanced Documentation

#### Receipt Endpoint (Section 14.9 of spec)
**Current:** Basic mention in architecture  
**Spec:** Full documentation with PIN Pad model support

**Additional Fields Needed:**
```typescript
interface ReceiptRequest {
  laneId: number;
  receiptType?: 'Sale' | 'Refund' | 'Void' | 'Authorization';
  subTotalAmount?: string;
  tipAmount?: string;
  cashbackAmount?: string;
  header?: string[];
  footer?: string[];
  customTemplate?: string;
  countryCode?: string;  // "Can" for Canada
  language?: string;     // "French"
  accountType?: string;  // "Chequing" for Canada
  pinVerified?: boolean;
  emv?: object;
}
```

**PIN Pad Support Matrix:**
- Ingenico: Lane5000, Lane7000, Lane7000 Deluxe, Lane8000, Lane8000 Deluxe, Move5000
- Verifone: Mx915, Mx925

---

## 3. Template/Test Case Gap Analysis

### 3.1 Sale Templates (Current vs Spec)

| Spec Test | Template ID | Status | Notes |
|-----------|-------------|--------|-------|
| S-1 | ✅ | CP Swiped Credit ($1.04) | Implemented |
| S-2 | ✅ | CP Swiped Credit Partial ($9.65) | Implemented |
| S-3 | ✅ | CP Swiped Credit Balance ($32.00) | Implemented |
| S-4 | ✅ | CP Swiped PIN Debit ($31.00) | Implemented |
| S-5 | ✅ | CP Swiped PIN Debit Cashback ($31.00 + $1.00) | Implemented |
| S-6 | ✅ | CP EMV Insert ($1.06) | Implemented |
| S-7 | ✅ | CP Contactless EMV ($1.08) | Implemented |
| S-8 | ✅ | CP Keyed Credit ($1.07) | Implemented |
| S-9 | ✅ | CP Keyed Credit Partial ($9.65) | Implemented |
| S-10 | ✅ | CP Keyed Credit Balance ($32.00) | Implemented |
| L2S-1 | ⚠️ | Level 2 Swiped ($3.00) | **Missing from templates** |
| L2S-2 | ⚠️ | Level 2 EMV ($4.00) | **Missing from templates** |
| DUP-1 | ⚠️ | Duplicate Check Test 1 | **Missing - needs duplicate params** |
| DUP-2 | ⚠️ | Duplicate Check Test 2 | **Missing** |
| DUP-3 | ⚠️ | Duplicate Override | **Missing** |

**Missing Fields for Level 2:**
```typescript
interface Level2Data {
  salesTaxAmount: string;
  commercialCardCustomerCode?: string;
  shippingZipcode?: string;
  ticketNumber?: string;
  billingName?: string;
}
```

**Missing Fields for Duplicate Handling:**
```typescript
interface DuplicateHandling {
  duplicateOverrideFlag?: boolean;      // Override duplicate check
  duplicateCheckDisableFlag?: boolean;  // Disable duplicate check
}
```

### 3.2 Authorization Templates

| Spec Test | Status | Notes |
|-----------|--------|-------|
| A-1..A-8 | ✅ | All implemented |
| L2A-1 | ⚠️ | Level 2 Swiped ($5.00) | **Missing** |
| L2A-2 | ⚠️ | Level 2 EMV ($6.00) | **Missing** |

### 3.3 Completion Templates

| Spec Test | Status | Notes |
|-----------|--------|-------|
| C-1..C-8 | ✅ | All implemented |

### 3.4 Refund Templates

| Spec Test | Status | Notes |
|-----------|--------|-------|
| RF-1..RF-5 | ✅ | All implemented |

### 3.5 Return Templates

| Spec Test | Status | Notes |
|-----------|--------|-------|
| RT-1..RT-5 | ✅ | All implemented |

### 3.6 Reversal Templates

| Spec Test | Status | Notes |
|-----------|--------|-------|
| RV-1..RV-6 | ✅ | All implemented |

### 3.7 Void Templates

| Spec Test | Status | Notes |
|-----------|--------|-------|
| V-1..V-4 | ✅ | All implemented |

### 3.8 Force Templates

| Spec Test | Status | Notes |
|-----------|--------|-------|
| F-1..F-3 | ✅ | All implemented |

### 3.9 BIN Query Templates

| Spec Test | Status | Notes |
|-----------|--------|-------|
| BQ-1 | ✅ | Swipe |
| BQ-2 | ✅ | Contactless |
| BQ-3 | ⚠️ | Keyed with CSC | **Missing query params** |

---

## 4. Type Definition Gaps

### 4.1 Request Type Updates

```typescript
// lib/payrix/types.ts - Missing/Incorrect fields

// SaleRequest - MISSING:
interface SaleRequest {
  // ... existing fields
  tipAmount?: string;  // Pre-set tip
  // Configuration - MISSING fields:
  configuration?: {
    allowPartialApprovals?: boolean;
    allowDebit?: boolean;
    enableTipPrompt?: boolean;        // NEW
    tipPromptOptions?: string[];      // NEW
    checkForDuplicateTransactions?: boolean;  // NEW for DUP tests
  }
  // Level 2 fields - MISSING:
  salesTaxAmount?: string;
  commercialCardCustomerCode?: string;
  shippingZipcode?: string;
  billingName?: string;
  // Duplicate handling - MISSING:
  duplicateOverrideFlag?: boolean;
  duplicateCheckDisableFlag?: boolean;
}

// New Types - MISSING entirely:
interface CancelRequest {
  laneId: number;
}

interface TransactionQueryRequest {
  approvalNumber: string;
  referenceNumber: string;
  terminalId: string;
  transactionDateTimeBegin: string;
  transactionDateTimeEnd: string;
  transactionId: string;
}

interface ReceiptRequest {
  laneId: number;
  customTemplate?: string;
  countryCode?: string;
  language?: string;
  header?: string[];
  footer?: string[];
  receiptType?: 'Sale' | 'Refund' | 'Void' | 'Authorization';
  subTotalAmount?: string;
  tipAmount?: string;
  cashbackAmount?: string;
  accountType?: string;
  pinVerified?: boolean;
  emv?: object;
}
```

### 4.2 Response Type Updates

```typescript
// SaleResponse - MISSING:
interface SaleResponse {
  // ... existing fields
  subTotalAmount?: string;  // Original amount before tip
  tipAmount?: string;       // Selected tip amount
  // Response for duplicate detection:
  isDuplicate?: boolean;
  originalTransactionId?: string;
}
```

---

## 5. UI/Component Gaps

### 5.1 New Pages Needed

| Page | Route | Status | Priority |
|------|-------|--------|----------|
| Cancel | `/reversals/cancel` | ❌ Missing | P1 |
| Transaction Query | `/query` | ❌ Missing | P2 |
| List Lanes | `/lanes/list` | ⚠️ Mentioned | P2 |

### 5.2 Enhanced Pages Needed

| Page | Enhancement | Priority |
|------|-------------|----------|
| Sale Form | Tip configuration section | P0 |
| Receipt Form | Full receipt parameters | P2 |
| Input Utility | Query params (promptType, formatType) | P2 |
| Selection Utility | Query params (multiLineText, options) | P2 |
| Signature Utility | Query params (form type, header, etc.) | P2 |
| BIN Query | Query params (manual entry, CSC) | P2 |

### 5.3 Component Updates

| Component | Update | Priority |
|-----------|--------|----------|
| `template-selector.tsx` | Add Level 2 templates | P1 |
| `template-selector.tsx` | Add Duplicate handling templates | P1 |
| `api-result-panel.tsx` | Show subTotal/tip/total breakdown | P1 |
| `endpoint-info.tsx` | Document Cancel endpoint | P1 |

---

## 6. Implementation Plan

### Phase 1: Critical Missing Features (P0 - Week 1)

#### Tasks:
1. **Update Type Definitions**
   - [ ] Add `tipAmount` to `SaleRequest`
   - [ ] Add `enableTipPrompt` and `tipPromptOptions` to configuration
   - [ ] Add `subTotalAmount` and `tipAmount` to `SaleResponse`
   - [ ] Add `CancelRequest` type
   - [ ] Update `ReceiptRequest` with full fields

2. **Implement Tip Prompt Support**
   - [ ] Update `PayrixClient.sale()` to handle tip params
   - [ ] Add tip configuration UI to Sale form
   - [ ] Update response display to show tip breakdown

3. **Implement Cancel Endpoint**
   - [ ] Add `cancel()` method to `PayrixClient`
   - [ ] Create `/reversals/cancel` page
   - [ ] Add Cancel server action

### Phase 2: Level 2 & Duplicate Handling (P1 - Week 2)

#### Tasks:
1. **Level 2 Support**
   - [ ] Add Level 2 fields to types
   - [ ] Create L2S-1, L2S-2 sale templates
   - [ ] Create L2A-1, L2A-2 authorization templates
   - [ ] Update Sale/Auth forms with Level 2 section

2. **Duplicate Handling**
   - [ ] Add duplicate control flags to types
   - [ ] Create DUP-1, DUP-2, DUP-3 templates
   - [ ] Document duplicate handling in UI

3. **Enhanced Query Parameters**
   - [ ] Update utility endpoints with query params
   - [ ] Add query param inputs to utility forms

### Phase 3: Advanced Features (P2 - Week 3)

#### Tasks:
1. **Transaction Query**
   - [ ] Implement `transactionQuery()` method
   - [ ] Create `/query` page with filter form
   - [ ] Display query results table

2. **List Lanes**
   - [ ] Implement `listLanes()` method
   - [ ] Create `/lanes/list` page
   - [ ] Display lanes table with status

3. **Enhanced Receipt**
   - [ ] Update Receipt form with all parameters
   - [ ] Add PIN Pad model support info
   - [ ] Support custom templates

### Phase 4: Polish & Testing (P3 - Week 4)

#### Tasks:
1. **Test All Templates**
   - [ ] Verify all 61 test cases have templates
   - [ ] Test each endpoint with certification parameters
   - [ ] Validate response handling

2. **Documentation**
   - [ ] Update ARCHITECTURE.md with new endpoints
   - [ ] Add tip prompt documentation
   - [ ] Document duplicate handling flow

3. **UI/UX Improvements**
   - [ ] Add tooltips for certification-specific params
   - [ ] Improve response formatting
   - [ ] Add copy-to-clipboard for cURL

---

## 7. Files to Create/Modify

### New Files

```
src/
├── app/
│   ├── reversals/
│   │   └── cancel/
│   │       └── page.tsx              # NEW: Cancel page
│   └── query/
│       └── page.tsx                  # NEW: Transaction Query page
├── actions/
│   └── payrix.ts                     # ADD: executeCancel, executeTransactionQuery
└── lib/payrix/
    ├── types.ts                      # UPDATE: Add missing types
    ├── client.ts                     # UPDATE: Add cancel, listLanes, transactionQuery
    └── templates.ts                  # UPDATE: Add L2 and DUP templates
```

### Modified Files

```
src/
├── app/
│   ├── transactions/
│   │   └── sale/
│   │       └── page.tsx              # UPDATE: Add tip config section
│   ├── utility/
│   │   ├── input/
│   │   │   └── page.tsx              # UPDATE: Add query params
│   │   ├── selection/
│   │   │   └── page.tsx              # UPDATE: Add query params
│   │   └── signature/
│   │       └── page.tsx              # UPDATE: Add query params
│   └── receipt/
│       └── page.tsx                  # UPDATE: Add full receipt params
└── components/payrix/
    ├── api-result-panel.tsx          # UPDATE: Show tip breakdown
    └── template-selector.tsx         # UPDATE: Add L2/DUP templates
```

---

## 8. Dependencies

No new dependencies required - all changes use existing stack:
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui

---

## 9. Certification Readiness Checklist

### Required for Certification (61 Test Cases)

| Category | Test Count | Implementation Status |
|----------|------------|----------------------|
| Sale | 15 | ⚠️ Missing L2S + DUP |
| Authorization | 10 | ⚠️ Missing L2A |
| Completion | 8 | ✅ Complete |
| Refund | 5 | ✅ Complete |
| Return | 5 | ✅ Complete |
| Reversal | 6 | ✅ Complete |
| Void | 4 | ✅ Complete |
| Force | 3 | ✅ Complete |
| BIN Query | 3 | ⚠️ Missing BQ-3 params |
| **Total** | **59+** | **~85% Complete** |

### Post-Certification Features

| Feature | Priority |
|---------|----------|
| Transaction Query | P2 |
| List Lanes | P2 |
| Enhanced Receipt Customization | P3 |

---

## 10. Summary

### Critical Gaps (Must Fix for Certification)
1. **Tip Prompt Support** (v2.16 spec addition) - P0
2. **Cancel Endpoint** - P1
3. **Level 2 Data Templates** (L2S-1/2, L2A-1/2) - P1
4. **Duplicate Handling Templates** (DUP-1/2/3) - P1
5. **Query Parameters** for utility endpoints - P2

### Estimated Effort
- **Phase 1 (P0):** 2-3 days
- **Phase 2 (P1):** 3-4 days
- **Phase 3 (P2):** 2-3 days
- **Phase 4 (P3):** 2-3 days
- **Total:** ~10-13 days for full v2.16 compliance

### Next Actions
1. ✅ Review this plan with team
2. 🔄 Create tickets for Phase 1 tasks
3. ⏳ Begin implementation with Tip Prompt support
4. ⏳ Update templates.ts with missing test cases
