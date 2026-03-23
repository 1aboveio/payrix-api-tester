# Design: Terminal Transactions — Payrix Pro (#268)

## Summary

Add a new Terminal Transactions page under the Platform section for the Payrix Pro `/terminalTxns` API. This is **separate** from the existing triPOS integration — it's the Payrix-native API for terminal transaction management (create, query, update).

## API Reference

OpenAPI spec: `docs/payrix-openapi31.yaml` (lines 59556–61600)

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/terminalTxns` | List/query terminal transactions |
| GET | `/terminalTxns/{id}` | Get single terminal transaction |
| POST | `/terminalTxns` | Create terminal transaction |
| PUT | `/terminalTxns/{id}` | Update terminal transaction |

### Related endpoints (read-only, phase 2)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/terminalTxnResults` | Transaction results |
| GET | `/terminalTxnResults/{id}` | Single result |
| GET | `/terminalTxnDatas` | Transaction data |
| GET | `/terminalTxnDatas/{id}` | Single data record |
| GET | `/terminalTxnMetadatas` | Transaction metadata |
| GET | `/terminalTxnMetadatas/{id}` | Single metadata |
| POST | `/terminalTxnRefs` | Create reference code |

## Page Location

`/platform/terminal-txns` — added to Platform sidebar navigation.

## Phase 1: List + Create

### List View

- Table with pagination (`page[number]`, `page[limit]` max 100)
- Search/filter via `search` header (e.g., `created[greater]=2025-01-01`, `type=1`)
- Columns:
  - ID
  - Type (Sale/Auth/Reverse/Refund/Batch Out — mapped from enum)
  - Status
  - Total (cents → dollars display)
  - Currency
  - BIN Type (CREDIT/DEBIT/PREPAID)
  - Entry Mode
  - Auth Code
  - Created
- Click row → detail view (expandable or drawer)
- Pagination controls (page number + limit selector)

### Create Form

Required fields (from `terminalTxnsPostRequest`):

| Field | Type | Description |
|-------|------|-------------|
| `type` | enum | 1=Sale, 2=Auth, 4=Reverse Auth, 5=Refund, 13=Batch Out |
| `total` | integer | Amount in cents |
| `currency` | string | ISO currency code (default: USD) |
| `fundingCurrency` | string | ISO currency code (default: USD) |
| `merchant` | string | Merchant ID |
| `mid` | string | Merchant identification number |
| `origin` | enum | 1=Terminal, 2=eComm, 3=MOTO, etc. |
| `pos` | enum | 0=Internal, 1=External |
| `binType` | enum | CREDIT, DEBIT, PREPAID |
| `swiped` | integer | 0 or 1 |
| `pin` | integer | 0 or 1 |
| `signature` | integer | 0 or 1 |
| `reserved` | integer | Reserved amount in cents |
| `status` | integer | 1=active |
| `inactive` | integer | 0 or 1 |
| `frozen` | integer | 0 or 1 |

Optional fields (grouped in collapsible sections):

**Transaction details:**
- `tip` — tip amount in cents
- `cashback` — cashback in cents
- `expiration` — MMYY format
- `authCode` — authorization code (0-20 chars)
- `authDate` — YYYYMMDD integer
- `traceNumber` — sequential integer
- `description`, `order`
- `receipt` — noReceipt, merchant, customer, both
- `token` — token record ID
- `txn` — related transaction ID
- `forterminalTxn` — related terminal txn ID (for refunds)

**Cardholder info:**
- `first`, `middle`, `last`, `company`
- `email`, `phone`
- `address1`, `address2`, `city`, `state`, `zip`, `country`

**Terminal/POS info:**
- `tid` — terminal ID (0-50 chars)
- `paymentNumber` — last 4 digits
- `paymentMethod` — payment method enum
- `posApplicationId`, `posApplicationName`, `posApplicationVersion`
- `customerReferenceNumber`, `gatewayTransactionId`, `customerTicketNumber`
- `cardNetworkTransactionId`, `omnitoken`
- `originatingApp`, `OEMTTxnRefNumber`

**Fees:**
- `convenienceFee` — in cents
- `surcharge` — in cents

### Create form UX

- Group required fields at top
- Optional fields in collapsible "Advanced" sections
- Amount fields: input in dollars, convert to cents on submit
- Enum fields: dropdown selects with human-readable labels
- Pre-fill sensible defaults (currency: USD, origin: 1, pos: 1, status: 1, inactive: 0, frozen: 0)
- Show JSON preview of request payload (like existing sale page)

## Phase 2: Update + Detail View

### Update (PUT)

- Same form as create, pre-filled with existing values
- Follow `terminalTxnsPutRequest` schema for which fields are updatable
- Accessible from detail view "Edit" button

### Detail View

- Full field display for the terminal transaction
- Expandable sections for related data:
  - Transaction Results (`/terminalTxnResults?search=terminalTxn={id}`)
  - Transaction Data (`/terminalTxnDatas?search=terminalTxn={id}`)
  - Transaction Metadata (`/terminalTxnMetadatas?search=terminalTxn={id}`)
  - Transaction References (`/terminalTxnRefs?search=terminalTxn={id}`)

## Implementation

### New files

- `src/app/platform/terminal-txns/page.tsx` — main page (list + create)
- `src/app/platform/terminal-txns/[id]/page.tsx` — detail + edit (phase 2)
- `src/actions/terminal-txns.ts` — server actions
- `src/lib/payrix/terminal-txns-types.ts` — TypeScript types from OpenAPI spec

### Modified files

- `src/components/layout/sidebar.tsx` (or equivalent) — add nav item
- `src/lib/payrix/types.ts` — export shared types if needed

### Server actions

```typescript
// src/actions/terminal-txns.ts
'use server';

export async function listTerminalTxns(params: {
  search?: string;
  page?: number;
  limit?: number;
}): Promise<...>

export async function getTerminalTxn(id: string): Promise<...>

export async function createTerminalTxn(data: TerminalTxnCreateInput): Promise<...>

export async function updateTerminalTxn(id: string, data: TerminalTxnUpdateInput): Promise<...>
```

### API client pattern

Use the existing Payrix Pro API client pattern:
- Base URL from config (Settings page)
- API key in header
- `Content-Type: application/json`
- Handle pagination via `page[number]` and `page[limit]` query params
- Handle search via `search` header

## Navigation

Add to Platform sidebar:
```
Platform
├── Transactions (existing)
├── Terminal Transactions (NEW)
├── Merchants
├── Customers
├── Invoices
├── Alerts
├── Printer
└── Webhooks
```

## Acceptance Criteria

### Phase 1
- [ ] `/platform/terminal-txns` page exists and is accessible from sidebar
- [ ] List view displays terminal transactions with pagination
- [ ] Search/filter works via search input
- [ ] Create form with all required fields + validation
- [ ] Optional fields in collapsible sections
- [ ] Amount fields accept dollars, send cents
- [ ] JSON request preview
- [ ] Success/error toast on create

### Phase 2
- [ ] Detail view for single terminal transaction
- [ ] Edit/update form pre-filled with existing values
- [ ] Related data sections (results, data, metadata, refs)
- [ ] Delete capability if API supports it
