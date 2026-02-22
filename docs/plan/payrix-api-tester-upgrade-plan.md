# Payrix API Tester Upgrade Plan

**Document:** Payrix TriPOS API 分析 v2.15  
**Date:** 2026-02-23  
**Status:** DRAFT  
**Prepared for:** Alo (Architect)  

---

## Executive Summary

This plan outlines the upgrade requirements for `payrix-api-tester` to align with **Payrix TriPOS API 分析 v2.15**. The upgrade covers ~61 certification test cases across 17 API endpoints, including full Lane Management, Transaction Processing (Sale/Auth/Refund/etc.), and Utility endpoints.

---

## 1. Scope of Upgrade

### Current State (Assumed)
- Basic Sale transaction support
- Limited endpoint coverage
- Minimal certification test case implementation

### Target State (v2.15)
- **17 API Endpoints** fully implemented
- **~61 Certification Test Cases** automated
- Full support for Worldpay/FIS triPOS Cloud certification

---

## 2. Endpoint Implementation Priority

### Phase 1: Core Transaction (Required for Certification)

| Priority | Endpoint | Test Cases | Complexity | Notes |
|----------|----------|------------|------------|-------|
| P0 | `POST /api/v1/sale` | 10 | Medium | Core payment flow |
| P0 | `POST /api/v1/authorization` | 8 | Medium | Pre-auth for hotels/restaurants |
| P0 | `POST /api/v1/authorization/{id}/completion` | 8 | Medium | Auth completion |
| P0 | `POST /api/v1/refund` | 5 | Low | Standalone refund |
| P0 | `POST /api/v1/return/{id}/{type}` | 5 | Low | Reference-based return |
| P0 | `POST /api/v1/reversal/{id}/{type}` | 6 | Medium | Full reversal |
| P0 | `POST /api/v1/void/{id}` | 4 | Low | Transaction void |
| P0 | `POST /api/v1/force/credit` | 3 | Medium | Voice auth force |
| P0 | `GET /api/v1/binQuery/{laneId}` | 3 | Low | Card BIN lookup |

### Phase 2: Lane Management (Required for Certification)

| Priority | Endpoint | Test Cases | Complexity | Notes |
|----------|----------|------------|------------|-------|
| P1 | `POST /cloudapi/v1/lanes/` | 1 | Low | Device pairing |
| P1 | `DELETE /cloudapi/v1/lanes/{laneId}` | 1 | Low | Device unpairing |
| P1 | `GET /cloudapi/v1/lanes/{laneId}/connectionstatus` | 0 | Low | Health check |

### Phase 3: Additional Features (Optional but Recommended)

| Priority | Endpoint | Complexity | Notes |
|----------|----------|------------|-------|
| P2 | `POST /api/v1/cancel` | Low | Cancel ongoing transaction |
| P2 | `POST /api/v1/display` | Low | Show custom text on PIN Pad |
| P2 | `POST /api/v1/idle` | Low | Return to idle screen |
| P2 | `GET /api/v1/input/{laneId}` | Medium | Get keypad input from cardholder |
| P2 | `GET /api/v1/selection/{laneId}` | Medium | Get selection from cardholder |
| P2 | `GET /api/v1/signature/{laneId}` | Medium | Capture signature |
| P2 | `GET /api/v1/status/host` | Low | Host connectivity check |
| P2 | `GET /api/v1/status/triPOS/{echo}` | Low | triPOS service health |
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
