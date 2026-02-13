# [DRAFT] Payrix API Tester — Full Certification Endpoints + Test Case Templates Plan

## TL;DR
- Add **all triPOS Cloud endpoints** required by Payrix certification (v2.1 doc) to the tester UI/API.
- For **each endpoint**, provide **predefined test case templates** aligned to certification script.
- Provide **execution order guidance** + **saved request presets** for quick certification runs.

---

## Scope
### A) Endpoints to Add (from v2.1 doc)
**Current tester already has:**
- Sale (`POST /api/v1/sale`)
- Transaction Query (list + by id)
- Void/Return/Reversal/Credit/Receipt (basic flows)

**Gap to fill (cert coverage + templates):**
- Full set below, plus **test case templates for every endpoint**
**Lane Management**
- `POST /cloudapi/v1/lanes` (create)
- `DELETE /cloudapi/v1/lanes/{laneId}` (delete)
- `GET /cloudapi/v1/lanes` (list)
- `GET /cloudapi/v1/lanes/{laneId}` (get)

**Sale / Auth / Completion**
- `POST /api/v1/sale`
- `POST /api/v1/authorization`
- `POST /api/v1/authorization/{transactionId}/completion`

**Refund / Return / Reversal / Void**
- `POST /api/v1/refund`
- `POST /api/v1/return/{transactionId}/{paymentType}`
- `POST /api/v1/reversal/{transactionId}/{paymentType}`
- `POST /api/v1/void/{transactionId}`

**Force / BIN Query**
- `POST /api/v1/force/credit`
- `GET /api/v1/binQuery/{laneId}`

**Level 2 / Duplicate Handling (as request variants)**
- Level 2 data on **Sale** + **Authorization**
- Duplicate flags on **Sale** (`checkForDuplicateTransactions`, `duplicateCheckDisableFlag`)

**Optional Status/Utility (rate-limited)**
- `POST /api/v1/display`
- `POST /api/v1/idle`
- `GET /api/v1/input/{laneId}`
- `GET /api/v1/selection/{laneId}`
- `GET /api/v1/signature/{laneId}`
- `GET /api/v1/status/host`
- `GET /api/v1/status/triPOS/{echo}`
- `GET /cloudapi/v1/lanes/{laneId}/connectionstatus`

---

## B) Test Case Templates (Predefined Presets)
For each endpoint, add a **Preset Template** panel with selectable cases. Templates map 1:1 to certification script amounts and entry methods.

### 1) Sale Templates (10)
- Swipe Credit (1.04)
- Swipe Credit Partial (9.65, allowPartialApprovals)
- Swipe Credit Balance (32.00)
- PIN Debit (31.00)
- PIN Debit CashBack (31.00 + cashBackAmount=1.00)
- EMV Insert (1.06)
- Contactless (1.08)
- Keyed Credit (1.07, invokeManualEntry)
- Keyed Partial (9.65, allowPartialApprovals + invokeManualEntry)
- Keyed Balance (32.00, invokeManualEntry)

### 2) Authorization Templates (8)
- Same pattern as Sale (Swipe/EMV/CTLS/Keyed + Partial/Balance)

### 3) Completion Templates (8)
- Completion per Auth ID
- Includes partial completion amounts (6.10 for Partial Auth)

### 4) Refund Templates (5)
- Swipe Credit (1.12)
- Swipe Debit (31.00)
- CTLS (2.31)
- EMV (2.32)
- Keyed (1.13)

### 5) Return Templates (5)
- Full return (1.04 / 1.08 / 1.07)
- Partial returns (0.50, 0.53)

### 6) Reversal Templates (6)
- Reversal for Swipe/EMV/CTLS/Keyed/Debit
- Direct Express reversal (special handling note)

### 7) Void Templates (4)
- Void for Swipe/EMV/CTLS/Keyed (1.00)

### 8) Force Credit Templates (3)
- Swipe/CTLS/Keyed with approvalCode

### 9) BIN Query Templates (3)
- Swipe/CTLS/Keyed

### 10) Level 2 Templates (4)
- L2 Sale (3.00 / 4.00)
- L2 Auth (5.00 / 6.00)

### 11) Duplicate Handling (3)
- Normal Sale (1.70)
- Duplicate Sale (checkForDuplicateTransactions)
- Override duplicate (duplicateCheckDisableFlag)

---

## UX / IA Changes
- Add a **Certification Templates** selector per endpoint page
- Preset selection should **populate form fields** (laneId, amount, flags, etc.)
- Add a **“Save to History”** entry per run (for audit)
- Provide **execution order guide** (Lane → Sale → Auth → Completion → Refund/Return/Reversal/Void → Force/BIN/Level2/Duplicate)

---

## Data/Code Changes
- Extend `PayrixClient` with missing endpoints
- Add missing types in `src/lib/payrix/types.ts`
- Add new UI pages/components per endpoint (or tabs under existing pages)
- Add **templates definition file** (e.g. `src/lib/payrix/templates.ts`) to centralize test cases
- Add **template renderer** component with:
  - template dropdown per endpoint
  - “apply template” to populate form
  - optional “save as custom preset” (stretch)

---

## Risks / Open Questions
- prod host / authorization generation
- Direct Express reversal (LaneNumber mapping)
- Level 2 field exact names
- BIN Query response structure

---

## Implementation Steps (Proposed)
1. Add missing API client methods + types
2. Add template definitions (centralized)
3. Add UI pages and template selector
4. Wire execution + history
5. Manual QA per template

---

## Definition of Done
- All endpoints available in UI
- Each endpoint has preset templates
- Templates populate form and can be executed
- Results saved to history
- Execution order guidance available

