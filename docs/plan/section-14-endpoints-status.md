# Section 14 — Other triPOS Endpoints: Codebase Status

**Date:** 2026-02-23  
**Source:** Payrix TriPOS API 分析 v2.15, Section 14  
**Status:** All endpoints implemented, query params partially supported

---

## Summary

All **9 utility endpoints** from Section 14 are implemented in `PayrixClient`:

| # | Endpoint | Method | Status | Query Params | UI Route |
|---|----------|--------|--------|--------------|----------|
| 14.2 | `/api/v1/display` | POST | ✅ | N/A | `/utility/display` |
| 14.3 | `/api/v1/idle` | POST | ✅ | N/A | `/utility/idle` |
| 14.4 | `/api/v1/input/{laneId}` | GET | ⚠️ | Missing | `/utility/input` |
| 14.5 | `/api/v1/selection/{laneId}` | GET | ⚠️ | Missing | `/utility/selection` |
| 14.6 | `/api/v1/signature/{laneId}` | GET | ⚠️ | Missing | `/utility/signature` |
| 14.7 | `/api/v1/status/host` | GET | ✅ | N/A | `/utility/status` |
| 14.8 | `/api/v1/status/triPOS/{echo}` | GET | ✅ | N/A | `/utility/status` |
| 14.9 | `/api/v1/receipt` | POST | ✅ | N/A | `/receipt` |
| — | `/cloudapi/v1/lanes/{laneId}/connectionstatus` | GET | ✅ | N/A | `/lanes/connection-status` |

**Legend:** ✅ = Complete | ⚠️ = Basic (missing query params)

---

## Detailed Status

### 14.2 POST /api/v1/display — ✅ COMPLETE

**v2.15 Spec:**
- Only supports `laneId` and `text` parameters

**Current Implementation:**
```typescript
async display(request: DisplayRequest, requestId?: string)
// Request: { laneId: string, text?: string }
```

**Status:** ✅ Matches spec exactly

---

### 14.3 POST /api/v1/idle — ✅ COMPLETE

**v2.15 Spec:**
- Only requires `laneId`

**Current Implementation:**
```typescript
async idle(request: IdleRequest, requestId?: string)
// Request: { laneId: string }
```

**Status:** ✅ Matches spec exactly

---

### 14.4 GET /api/v1/input/{laneId} — ⚠️ BASIC (Query Params Missing)

**v2.15 Spec:**
```typescript
GET /api/v1/input/{laneId}?promptType=Amount&formatType=AmountWithDollarCommaDecimal
```

**Query Parameters Required:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `promptType` | string | Recommended | Amount, AccountNumber, ZIPCode, etc. |
| `formatType` | string | Optional | AmountWithDollarCommaDecimal, etc. |

**Current Implementation:**
```typescript
async input(laneId: string, requestId?: string)
// Missing: promptType, formatType query params
```

**Status:** ⚠️ Basic implementation — **query params not supported**

**Fix Required:**
```typescript
async input(
  laneId: string, 
  query?: { promptType?: string; formatType?: string },
  requestId?: string
)
```

---

### 14.5 GET /api/v1/selection/{laneId} — ⚠️ BASIC (Query Params Missing)

**v2.15 Spec:**
```typescript
GET /api/v1/selection/{laneId}?form=MultiOption&text=Choose&options=one|two|three
```

**Query Parameters Required:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `form` | string | **Yes** | `MultiOption` |
| `text` | string | Optional | Single-line prompt text |
| `multiLineText` | string | Optional | Multi-line with `\|` separator |
| `options` | string | **Yes** | Button options with `\|` separator |

**Current Implementation:**
```typescript
async selection(laneId: string, requestId?: string)
// Missing: form, text, multiLineText, options query params
```

**Status:** ⚠️ Basic implementation — **query params not supported**

**Fix Required:**
```typescript
async selection(
  laneId: string,
  query: {
    form: 'MultiOption';
    text?: string;
    multiLineText?: string;
    options: string;  // pipe-separated: "one|two|three"
  },
  requestId?: string
)
```

---

### 14.6 GET /api/v1/signature/{laneId} — ⚠️ BASIC (Query Params Missing)

**v2.15 Spec:**
```typescript
GET /api/v1/signature/{laneId}?form=simple
GET /api/v1/signature/{laneId}?form=contract&header=Title&subHeader=Subtitle&text=Agreement
```

**Query Parameters Required:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `form` | string | **Yes** | `simple` or `contract` |
| `header` | string | Optional | Contract form title |
| `subHeader` | string | Optional | Contract form subtitle |
| `text` | string | Optional | Contract text (max 8,135 chars) |

**Current Implementation:**
```typescript
async signature(laneId: string, requestId?: string)
// Missing: form, header, subHeader, text query params
```

**Status:** ⚠️ Basic implementation — **query params not supported**

**Fix Required:**
```typescript
async signature(
  laneId: string,
  query: {
    form: 'simple' | 'contract';
    header?: string;
    subHeader?: string;
    text?: string;
  },
  requestId?: string
)
```

---

### 14.7 GET /api/v1/status/host — ✅ COMPLETE

**Current Implementation:**
```typescript
async hostStatus(requestId?: string)
```

**Status:** ✅ Complete

---

### 14.8 GET /api/v1/status/triPOS/{echo} — ✅ COMPLETE

**Current Implementation:**
```typescript
async triPosStatus(echo: string, requestId?: string)
```

**Status:** ✅ Complete

---

### 14.9 POST /api/v1/receipt — ✅ COMPLETE

**v2.15 Spec Features:**
- Default template (English/French)
- Custom template support
- Template placeholders: `{{fieldName}}`
- Custom tags: `@{Center}{{ApplicationLabel}}`
- Supported devices: Ingenico Lane5000/7000/8000/Move5000, Verifone Mx915/Mx925

**Current Implementation:**
```typescript
async receipt(request: ReceiptRequest, requestId?: string)
// Request: { laneId, receiptType?, emailAddress?, phoneNumber?, ... }
```

**Status:** ✅ Basic implementation complete

**Note:** Advanced template features may need enhancement for full certification.

---

### Lane Connection Status — ✅ COMPLETE

**Endpoint:** `GET /cloudapi/v1/lanes/{laneId}/connectionstatus`

**Current Implementation:**
```typescript
async laneConnectionStatus(laneId: string, requestId?: string)
```

**Status:** ✅ Complete

---

## Rate Limiting Notice

**v2.15 Spec Warning:**
> Status check requests should be submitted at a maximum rate of no more than one (1) status check every two (2) minutes.

**Applies to:**
- `GET /api/v1/status/host`
- `GET /api/v1/status/triPOS/{echo}`
- `GET /cloudapi/v1/lanes/{laneId}/connectionstatus`

**Current Implementation:** No rate limiting in code — user must manually limit.

**Recommendation:** Add UI warning or implement client-side rate limiting.

---

## Summary of Required Fixes

### High Priority (Query Param Support)
1. **Input endpoint** — Add `promptType` and `formatType` query params
2. **Selection endpoint** — Add `form`, `text`, `multiLineText`, `options` query params
3. **Signature endpoint** — Add `form`, `header`, `subHeader`, `text` query params

### Low Priority
4. **Rate limiting** — Add UI warning or client-side limiting for status checks

---

## File Locations

**Client Methods:** `src/lib/payrix/client.ts` lines ~280-320

**Type Definitions:** `src/lib/payrix/types.ts`
- `InputResponse`
- `SelectionResponse`
- `SignatureResponse`

**UI Pages:**
- `src/app/utility/input/page.tsx`
- `src/app/utility/selection/page.tsx`
- `src/app/utility/signature/page.tsx`

**Server Actions:** `src/actions/payrix.ts`

---

## Next Steps

1. Update `PayrixClient.input()` to accept query params
2. Update `PayrixClient.selection()` to accept query params
3. Update `PayrixClient.signature()` to accept query params
4. Update type definitions in `types.ts`
5. Update UI pages to expose query param inputs
6. Add rate limit warning to status check UI
