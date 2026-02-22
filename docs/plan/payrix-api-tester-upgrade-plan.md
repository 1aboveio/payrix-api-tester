# Payrix API Tester Upgrade Plan

**Document:** Payrix TriPOS API 分析 v2.15  
**Date:** 2026-02-23  
**Status:** DRAFT  
**Prepared for:** Alo (Architect)  

## Related Documents

- [Workspace Architecture](../../ARCHITECTURE.md) — Overall 1Above platform architecture
- [cover-gen Architecture](../../cover-gen/ARCHITECTURE.md) — Document generation service
- [webhook-gateway Architecture](../../webhook-gateway/ARCHITECTURE.md) — Webhook ingestion service
- [payrix-api-tester Architecture](../../payrix-api-tester/ARCHITECTURE.md) — **THIS SERVICE** (Next.js 16 + React 19)

---

## Executive Summary

This plan outlines the upgrade requirements for `payrix-api-tester` to align with **Payrix TriPOS API 分析 v2.15**. 

**KEY FINDING:** The repository (`git@github.com:1aboveio/payrix-api-tester.git`) is **already substantially implemented** as a **Next.js 16 + React 19** web application (not Python/FastAPI as originally assumed). It includes:

- ✅ **17 API Endpoints** — All endpoints already implemented in `PayrixClient`
- ✅ **61 Certification Templates** — Predefined in `lib/payrix/templates.ts`
- ✅ **UI Pages** — All routes (`/lanes`, `/transactions/*`, `/reversals/*`, `/utility/*`)
- ✅ **Server Actions** — API calls with history tracking
- ✅ **cURL Generation** — Command export for debugging

**Remaining Work:** Test execution order guidance, transaction dependency tracking, certification reporting.

---

## 1.5 Architecture Context

The `payrix-api-tester` fits into the 1Above platform as a **certification and integration testing service**:

```
┌─────────────────────────────────────────────────────────────────┐
│                     1Above Platform                              │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │  cover-gen   │  │ payrix-api-tester│  │webhook-gateway   │  │
│  │  (Documents) │  │  (Certification) │  │  (Webhooks)      │  │
│  └──────┬───────┘  └────────┬─────────┘  └────────┬─────────┘  │
│         │                   │                      │             │
│         ▼                   ▼                      ▼             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Worldpay/FIS triPOS Cloud                    │  │
│  │         (Payment Processing Platform)                     │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

**Actual Tech Stack (from repo analysis):**
- **Framework:** Next.js 16.1.6 with App Router
- **Runtime:** React 19.2.3
- **Language:** TypeScript 5.x
- **Styling:** Tailwind CSS 4.x + shadcn/ui
- **State:** React Hooks + localStorage
- **HTTP:** Native fetch via Server Actions
- **Validation:** Zod 4.3.6

---

## 1. Scope of Upgrade

### Current State (As of 2026-02-23)
✅ **ALREADY IMPLEMENTED:**
- **PayrixClient** (`lib/payrix/client.ts`) — All 17 endpoints with typed requests/responses
- **61 Certification Templates** (`lib/payrix/templates.ts`) — S-1..S-10, A-1..A-8, etc.
- **UI Routes** — `/lanes`, `/transactions/*`, `/reversals/*`, `/utility/*`, `/settings`
- **Server Actions** (`actions/payrix.ts`) — API calls with automatic history tracking
- **cURL Generator** (`lib/payrix/curl.ts`) — Command export for each request
- **Configuration UI** — Settings page for credentials and defaults

### Target State (v2.15)
- [ ] **Test Execution Order Guide** — Visual guide for certification sequence
- [ ] **Transaction Dependency Tracking** — Auto-link Return/Reversal to original Sale
- [ ] **Certification Report Generation** — PDF export for certification submission
- [ ] **E2E Test Suite** — Playwright automation for critical flows
- [ ] **Template Validation** — Verify all 61 templates execute correctly

---

## 2. Implementation Status

### 2.1 Already Complete ✅

| Component | Location | Status |
|-----------|----------|--------|
| PayrixClient (17 endpoints) | `lib/payrix/client.ts` | ✅ Complete |
| Type Definitions | `lib/payrix/types.ts` | ✅ Complete |
| 61 Test Templates | `lib/payrix/templates.ts` | ✅ Complete |
| Server Actions | `actions/payrix.ts` | ✅ Complete |
| cURL Generator | `lib/payrix/curl.ts` | ✅ Complete |
| Lane Management UI | `app/lanes/*` | ✅ Complete |
| Transaction UI | `app/transactions/*` | ✅ Complete |
| Reversal UI | `app/reversals/*` | ✅ Complete |
| Utility UI | `app/utility/*` | ✅ Complete |
| Settings UI | `app/settings/page.tsx` | ✅ Complete |
| History Tracking | `actions/payrix.ts` (serverHistory) | ✅ Complete |

### 2.2 Remaining Work 🚧

| Feature | Priority | Complexity | Notes |
|---------|----------|------------|-------|
| Test Execution Order Guide | P1 | Low | Visual guide: Lane → Sale → Auth → Completion → etc. |
| Transaction Dependency Tracking | P1 | Medium | Link Return/Reversal/Void to original transactionId |
| Certification Report Export | P2 | Medium | PDF generation for certification submission |
| E2E Playwright Tests | P2 | High | Automate critical user journeys |
| Template Validation Suite | P1 | Medium | Verify all 61 templates work end-to-end |

---

## 3. Endpoint Implementation (ALL COMPLETE ✅)

All 17 endpoints are already implemented in the codebase:

| Endpoint | Method | UI Route | Templates | Status |
|----------|--------|----------|-----------|--------|
| `/cloudapi/v1/lanes` | POST | `/lanes/create` | Lane create | ✅ |
| `/cloudapi/v1/lanes/{id}` | DELETE | `/lanes` | - | ✅ |
| `/cloudapi/v1/lanes/{id}/connectionstatus` | GET | `/lanes/connection-status` | - | ✅ |
| `/api/v1/sale` | POST | `/transactions/sale` | 15 templates | ✅ |
| `/api/v1/authorization` | POST | `/transactions/authorization` | 10 templates | ✅ |
| `/api/v1/authorization/{id}/completion` | POST | `/transactions/completion` | 8 templates | ✅ |
| `/api/v1/refund/{id}` | POST | `/reversals/credit` | 5 templates | ✅ |
| `/api/v1/return/{id}/{type}` | POST | `/reversals/return` | 5 templates | ✅ |
| `/api/v1/reversal/{id}/{type}` | POST | `/reversals/reversal` | 6 templates | ✅ |
| `/api/v1/void/{id}` | POST | `/reversals/void` | 4 templates | ✅ |
| `/api/v1/force/credit` | POST | `/transactions/force` | 3 templates | ✅ |
| `/api/v1/binQuery/{id}` | GET | `/transactions/bin-query` | 3 templates | ✅ |
| `/api/v1/display` | POST | `/utility/display` | - | ✅ |
| `/api/v1/idle` | POST | `/utility/idle` | - | ✅ |
| `/api/v1/input/{id}` | GET | `/utility/input` | - | ✅ |
| `/api/v1/selection/{id}` | GET | `/utility/selection` | - | ✅ |
| `/api/v1/signature/{id}` | GET | `/utility/signature` | - | ✅ |
| `/api/v1/status/host` | GET | `/utility/status` | - | ✅ |
| `/api/v1/status/triPOS/{echo}` | GET | `/utility/status` | - | ✅ |
| `/api/v1/receipt` | POST | `/receipt` | - | ✅ |

**Total:** 20 API methods across 17 endpoints — **ALL IMPLEMENTED** ✅

---

## 4. Template Inventory (61 Templates - ALL DEFINED ✅)

All templates are defined in `lib/payrix/templates.ts`:

### Sale Templates (15)
- S-1..S-10: Core sale tests (swipe, EMV, contactless, keyed)
- L2S-1, L2S-2: Level 2 sales
- DUP-1, DUP-2, DUP-3: Duplicate handling

### Authorization Templates (10)
- A-1..A-8: Core authorization tests
- L2A-1, L2A-2: Level 2 authorizations

### Completion Templates (8)
- C-1..C-8: Completion of authorizations

### Refund Templates (5)
- RF-1..RF-5: Swipe, debit, contactless, EMV, keyed

### Return Templates (5)
- RT-1..RT-5: Full and partial returns

### Reversal Templates (6)
- RV-1..RV-6: Credit and debit reversals

### Void Templates (4)
- V-1..V-4: Void by entry method

### Force Templates (3)
- F-1..F-3: Force credit by entry method

### BIN Query Templates (3)
- BQ-1..BQ-3: Swipe, contactless, keyed

**Total: 61 certification test cases — ALL DEFINED** ✅

---

## 5. Key Architecture Components (EXISTING)

### 5.1 PayrixClient
Location: `lib/payrix/client.ts`

Already implements all API methods with:
- Automatic header generation
- Request/response typing
- Error handling
- Base URL selection (cert/prod)

### 5.2 Server Actions
Location: `actions/payrix.ts`

Already implements:
- All endpoint actions (executeSale, executeAuthorization, etc.)
- History tracking with cURL generation
- Request validation

### 5.3 Template System
Location: `lib/payrix/templates.ts`

Already provides:
- 61 test case templates
- Template selector component integration
- Field pre-population

### 5.4 UI Structure
Location: `app/`

Already organized as:
- `/lanes/*` — Lane management
- `/transactions/*` — Transaction endpoints
- `/reversals/*` — Return/Reversal/Void/Credit
- `/utility/*` — Display, Idle, Input, Selection, Signature, Status
- `/settings` — Configuration

---

## 6. Remaining Implementation Tasks

### 6.1 Test Execution Order Guide (P1)

**Location:** New page or sidebar component  
**Purpose:** Guide users through certification sequence

**Content:**
```
1. Lane Management
   └── Create Lane (activation code required)
2. Sale Transactions
   └── S-1..S-10 (save transactionIds)
3. Authorization
   └── A-1..A-8 (save transactionIds)
4. Completion
   └── C-1..C-8 (use auth transactionIds)
5. Refund / Return / Reversal / Void
   └── Execute with saved transactionIds
6. Force / BIN Query / Level 2 / Duplicate
   └── Standalone tests
```

### 6.2 Transaction Dependency Tracking (P1)

**Location:** Extend `lib/payrix/dal/transactions.ts`  
**Purpose:** Link dependent transactions

**Requirements:**
- Store `transactionId` → `testCase` mapping
- Allow lookup for Return/Reversal/Void
- UI dropdown to select from saved transactions

### 6.3 Certification Report Export (P2)

**Location:** New component + API endpoint  
**Purpose:** Generate certification submission document

**Format:**
- PDF report with test results
- Cover page with merchant info
- Test case matrix with pass/fail status
- Summary statistics

### 6.4 E2E Test Suite (P2)

**Location:** `e2e/` directory (new)  
**Purpose:** Automate critical user journeys

**Tests:**
- Complete certification flow
- Template execution
- History tracking
- Settings persistence

### 6.5 Template Validation Suite (P1)

**Location:** Integration tests  
**Purpose:** Verify all 61 templates work correctly

**Method:**
- Run each template against cert environment
- Record expected vs actual statusCode
- Flag mismatches for review

---

## 7. Development Workflow

### 7.1 Repository
```bash
git clone git@github.com:1aboveio/payrix-api-tester.git
cd payrix-api-tester
pnpm install
pnpm dev
```

### 7.2 Key Files to Modify

| Task | Files |
|------|-------|
| Execution Order Guide | `app/guide/page.tsx` (new) |
| Dependency Tracking | `lib/payrix/dal/transactions.ts`, `app/reversals/*/page.tsx` |
| Report Export | `app/reports/page.tsx` (new), `lib/reports/generator.ts` (new) |
| E2E Tests | `e2e/*.spec.ts` (new) |
| Template Validation | `tests/template-validation.test.ts` (new) |

---

## 8. Validation Checklist

Before certification submission:

- [ ] All 61 templates execute without errors
- [ ] Transaction IDs are correctly saved and linked
- [ ] Return/Reversal/Void use correct original transactionIds
- [ ] cURL commands match expected format
- [ ] Report generation produces valid PDF
- [ ] E2E tests pass in CI/CD

---

## 9. References

### Internal
- [payrix-api-tester ARCHITECTURE.md](../../payrix-api-tester/ARCHITECTURE.md)
- [Payrix TriPOS API 分析 v2.15](docs/Payrix%20TriPOS%20API%20分析%20v2.15.md)
- [PLAN.md](../../payrix-api-tester/PLAN.md) (original repo plan)

### External
- [triPOS Cloud API](https://triposcert.vantiv.com/api/swagger-ui-bootstrap/)
- [Next.js Documentation](https://nextjs.org/docs)

---

**Summary:** The payrix-api-tester is already 80% complete. Focus remaining effort on:
1. Test execution guidance
2. Transaction dependency tracking  
3. Certification reporting
4. E2E automation
| P2 | `POST /api/v1/receipt` | High | Print receipt (limited device support) |

### Phase 4: Advanced Features

| Priority | Feature | Complexity | Notes |
|----------|---------|------------|-------|
| P3 | Level 2 Processing | Medium | Commercial card optimization |
| P3 | Duplicate Transaction Handling | Medium | Detect/override duplicates |
| P3 | Store & Forward | High | Offline transaction handling |

---

## 3. Key Technical Requirements

### 3.1 Request Structure

All requests must include these headers:
```json
{
  "tp-application-id": "{APP_ID}",
  "tp-application-name": "{APP_NAME}",
  "tp-application-version": "{VERSION}",
  "tp-request-id": "{UUID}",
  "tp-authorization": "Version=1.0",
  "tp-express-acceptor-id": "{ACCEPTOR_ID}",
  "tp-express-account-id": "{ACCOUNT_ID}",
  "tp-express-account-token": "{ACCOUNT_TOKEN}"
}
```

### 3.2 Required Body Fields

Every transaction request must include:
- `laneId` (integer) - Terminal identifier
- `referenceNumber` (string, ≤16 digits) - Unique transaction reference
- `ticketNumber` (string, ≤6 digits) - Interchange ticket number

### 3.3 Path Parameters

Several endpoints require path parameters:
- `{laneId}` - Lane Management, BIN Query, Input, Selection, Signature
- `{transactionId}` - Completion, Return, Reversal, Void
- `{paymentType}` - Return, Reversal (values: Credit, Debit, EBT, Gift)
- `{echo}` - Status triPOS (any string)

### 3.4 Query Parameters (Utility Endpoints)

| Endpoint | Query Params | Example |
|----------|--------------|---------|
| `GET /api/v1/input/{laneId}` | `promptType`, `formatType` | `?promptType=Amount&formatType=AmountWithDollarCommaDecimal` |
| `GET /api/v1/selection/{laneId}` | `form`, `text`, `multiLineText`, `options` | `?form=MultiOption&text=Choose&options=one\|two\|three` |
| `GET /api/v1/signature/{laneId}` | `form`, `header`, `subHeader`, `text` | `?form=contract&header=Title&text=Agreement` |
| `GET /api/v1/binQuery/{laneId}` | `invokeManualEntry`, `isCscSupported` | `?invokeManualEntry=true&isCscSupported=true` |

### 3.5 Response Handling

**Two-step validation required:**
1. Check HTTP status code (200 = success)
2. Check `statusCode` field:
   - `0` = Approved
   - `5` = Partial Approved
   - `20` = Declined
   - `23` = Duplicate

---

## 4. Certification Test Cases

### 4.1 Sale Transactions (10 tests)

| Test | Entry Method | Amount | Special Config |
|------|--------------|--------|----------------|
| S-1 | Swipe Credit | \$1.04 | - |
| S-2 | Swipe Credit (Partial) | \$9.65 | `allowPartialApprovals: true` |
| S-3 | Swipe Credit (Balance) | \$32.00 | - |
| S-4 | Swipe PIN Debit | \$31.00 | `allowDebit: true` |
| S-5 | Swipe PIN Debit + CashBack | \$31.00 | `allowDebit: true`, `requestedCashbackAmount: "1.00"` |
| S-6 | EMV Insert | \$1.06 | - |
| S-7 | Contactless EMV | \$1.08 | - |
| S-8 | Keyed Credit | \$1.07 | `invokeManualEntry: true` |
| S-9 | Keyed Credit (Partial) | \$9.65 | `invokeManualEntry: true`, `allowPartialApprovals: true` |
| S-10 | Keyed Credit (Balance) | \$32.00 | `invokeManualEntry: true` |

### 4.2 Authorization (8 tests)

Same entry methods as Sale (S-1 through S-10, excluding S-4 and S-5 which are Debit-specific).

### 4.3 Completion (8 tests)

Must reference Authorization `transactionId`. C-2 and C-7 use different amount ($6.10 vs original $9.65).

### 4.4 Other Transaction Types

- **Refund (5)**: Swipe Credit, PIN Debit, Contactless, EMV, Keyed
- **Return (5)**: Reference original Sale transactionId
- **Reversal (6)**: Full reversal of various entry methods
- **Void (4)**: Cancel unsettled transactions
- **Force (3)**: Voice auth approval code required
- **BIN Query (3)**: Card BIN lookup

### 4.5 Duplicate Handling (3 tests)

Must use **same card** for all 3 tests:
1. Normal Sale (\$1.70)
2. Duplicate Sale with `checkForDuplicateTransactions: true` → expect statusCode=23
3. Override with `duplicateCheckDisableFlag: true` or `duplicateOverrideFlag: true`

---

## 5. Special Configuration Objects

### 5.1 `configuration` Object

```json
{
  "configuration": {
    "allowPartialApprovals": true,     // For partial approval tests
    "allowDebit": true,                // For Debit card tests
    "checkForDuplicateTransactions": true,  // For duplicate detection
    "marketCode": "Retail"             // Optional: Retail, HotelLodging, FoodRestaurant
  }
}
```

### 5.2 Level 2 Data

```json
{
  "salesTaxAmount": "0.25",              // Must be > 0.1% of sale amount
  "commercialCardCustomerCode": "PO123456",
  "shippingZipcode": "90210",
  "billingName": "Test Business Inc"
}
```

### 5.3 Duplicate Control Flags

```json
{
  "duplicateCheckDisableFlag": true,   // Recommended: Disable duplicate checking
  "duplicateOverrideFlag": true        // Alternative: Override after detection
}
```

---

## 6. Rate Limiting

**Status Check Rate Limit:**
- Maximum 1 status check every 2 minutes
- Applies to: `/api/v1/status/host`, `/api/v1/status/triPOS/{echo}`, `/cloudapi/v1/lanes/{laneId}/connectionstatus`
- Exceeding limit may result in Worldpay/FIS rejecting merchant processing

---

## 7. Receipt Printing Support

### Supported Devices

**Ingenico:**
- Lane5000, Lane7000, Lane7000 Deluxe
- Lane8000, Lane8000 Deluxe, Move5000

**Verifone:**
- Mx915, Mx925

### Template System

- Default templates available (English/French for Canada)
- Custom templates via `customTemplate` field
- Placeholder format: `{{fieldName}}`
- Custom tags: `@{Center}{{ApplicationLabel}}`

---

## 8. Implementation Checklist

### Phase 1: Foundation
- [ ] Implement authentication header management
- [ ] Implement request ID generation (UUID)
- [ ] Implement base HTTP client with retry logic
- [ ] Implement response parsing (HTTP + statusCode)

### Phase 2: Core Transactions
- [ ] Implement Sale endpoint with all 10 test cases
- [ ] Implement Authorization + Completion (16 tests)
- [ ] Implement Refund, Return, Reversal, Void (20 tests)
- [ ] Implement Force and BIN Query (6 tests)

### Phase 3: Lane Management
- [ ] Implement Lane Create/Delete
- [ ] Implement Connection Status check

### Phase 4: Test Automation
- [ ] Automate all 61 certification test cases
- [ ] Implement test result logging
- [ ] Implement transaction ID tracking for dependent tests

### Phase 5: Optional Features
- [ ] Implement utility endpoints (Display, Idle, Input, Selection, Signature)
- [ ] Implement status check endpoints (with rate limiting)
- [ ] Implement receipt printing (if target device supports)
- [ ] Implement Level 2 processing
- [ ] Implement Duplicate handling

### Phase 6: Certification Prep
- [ ] Generate certification script execution report
- [ ] Document hardware used (PIN Pad model, connectivity)
- [ ] Prepare test card inventory
- [ ] Schedule certification session with Worldpay/FIS

---

## 9. Dependencies

### Required
- triPOS Cloud API credentials (Acceptor ID, Account ID, Account Token)
- Physical PIN Pad device (Ingenico or Verifone)
- Certification test cards (Visa, MC, Amex, Debit)
- Internet connectivity to triposcert.vantiv.com

### Optional (for advanced features)
- Receipt paper (for receipt printing tests)
- Signature-capable PIN Pad (for signature tests)
- Multi-line display PIN Pad (for multiLineText tests)

---

## 10. References

### Documents
- Payrix TriPOS API 分析 v2.15 (this analysis)
- ExpressCertificationScript_triPOSCloud_Retail (Worldpay certification script)

### API Documentation
- triPOS Cloud API: https://triposcert.vantiv.com/api/swagger-ui-bootstrap/
- Lane Management API: https://triposcert.vantiv.com/cloudapi/swagger/ui/index
- Worldpay Developer: https://docs.worldpay.com/apis/tripos/tripos-cloud
- FIS Developer: https://developerengine.fisglobal.com/apis/tripos/tripos-cloud

### Knowledge Base
- Display: https://triposcert.vantiv.com/api/help/kb/display.html
- Input: https://triposcert.vantiv.com/api/help/kb/input.html
- Selection: https://triposcert.vantiv.com/api/help/kb/selection.html
- Signature: https://triposcert.vantiv.com/api/help/kb/signature.html
- Receipts: https://triposcert.vantiv.com/api/help/kb/Receipt.html
- Cancel: https://triposcert.vantiv.com/api/help/kb/cancel.html

---

**Next Steps:**
1. Review this plan with development team
2. Prioritize Phase 1 and Phase 2 implementation
3. Schedule certification test execution
4. Coordinate with Worldpay/FIS for certification session
