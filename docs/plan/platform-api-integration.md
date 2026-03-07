# Plan: Integrate Payrix Platform APIs with Module-Based Navigation

## Context

The Payrix API Tester currently only supports **TriPOS cloud APIs** (terminal-based payment processing). The user wants to add **Payrix Platform REST APIs** (invoices, merchants, customers) as a second module. These two API families differ fundamentally:

| Aspect | TriPOS (existing) | Platform (new) |
|--------|-------------------|----------------|
| Base URL | `triposcert.vantiv.com` | `test-api.payrix.com` / `api.payrix.com` |
| Auth | `tp-authorization` + `tp-express-*` headers | `APIKEY` header |
| Search | POST body | `search` header (`field[operator]=value`) |
| Pagination | Custom | `page[number]` + `page[limit]` query params |
| Response | Flat | `{ response: { data[], details: { page }, errors[] } }` |

The navigation must be refactored to support two distinct modules with a clean module switcher.

---

## 1. Navigation Refactor — Module Switcher

**File:** `src/components/layout/app-shell.tsx`

Add a module switcher (Select dropdown) at the top of the sidebar. The active module is derived from the URL pathname (`/platform/*` = Platform, everything else = TriPOS). Clicking a module navigates to its root route.

```
Module Switcher: [TriPOS Cloud ▼] / [Payrix Platform ▼]

TriPOS nav (existing, unchanged):
  Lanes → /lanes/*
  Transactions → /transactions/*
  Reversals → /reversals/*
  Utility → /utility/*

Platform nav (new):
  Invoices:
    - Invoice List       /platform/invoices
    - Create Invoice     /platform/invoices/create
  Merchants:
    - Merchant List      /platform/merchants
  Customers:
    - Customer List      /platform/customers
    - Create Customer    /platform/customers/create
```

- Define `triposNavSections` (current `navSections`) and `platformNavSections` (new)
- Derive `activeModule` from `pathname.startsWith('/platform')`
- Module switcher navigates to `/transactions/sale` (TriPOS) or `/platform/invoices` (Platform)
- Header badge shows relevant environment per module
- Import new icons: `FileText`, `Building2`, `Users` from lucide-react

---

## 2. Config Extension

### `src/lib/payrix/types.ts` — Add fields to `PayrixConfig`:
```typescript
platformApiKey: string;
platformEnvironment: 'test' | 'prod';
```
No `defaultMerchantId` or `defaultLoginId` — these will be fetched dynamically from the API using the API key (e.g., querying `/merchants` and `/logins` endpoints). The create invoice form will provide dropdowns populated from API data.

### `src/lib/config.ts` — Add defaults + platform base URL helper:
```typescript
platformApiKey: '',
platformEnvironment: 'test',
```
Add `getPlatformBaseUrl(env)` → `test-api.payrix.com` / `api.payrix.com`

### `src/lib/payrix/types.ts` — Add `source` to `HistoryEntry`:
```typescript
source?: 'tripos' | 'platform';
```

### `src/app/settings/page.tsx` — Add new Card section:
"Platform API Credentials" with fields: API Key, Platform Environment (test/prod).

---

## 3. Platform Client

**New file:** `src/lib/platform/client.ts`

Separate `PlatformClient` class (not extending PayrixClient — auth, headers, response format all differ).

Key design:
- Constructor takes `{ apiKey, environment }` from config
- `buildHeaders(searchFilters?)` → `{ APIKEY, Content-Type, search? }`
- `buildSearchHeader(filters: PlatformSearchFilter[])` → converts to `field[op]=value` format
- Private `request<T>(options)` → handles the `{ response: { data, details, errors } }` envelope
- Returns `PlatformRequestResult<T>` containing typed data, pagination info, raw response, and sent headers

Methods:
- `listInvoices(filters?, pagination?)`
- `getInvoice(id)` / `createInvoice(body)` / `updateInvoice(id, body)` / `deleteInvoice(id)`
- `listInvoiceItems(filters?)` / `createInvoiceItem(body)`
- `createInvoiceLineItem(body)` — for adding items to invoices
- `getMerchant(id)` / `listMerchants(filters?, pagination?)`
- `listCustomers(filters?, pagination?)` / `createCustomer(body)`

---

## 4. Platform Types

**New file:** `src/lib/platform/types.ts`

```typescript
// API envelope
interface PlatformApiEnvelope<T> { response: { data: T[]; details: { page, requestId }; errors[] } }

// Invoice (response shape)
interface Invoice {
  id, login, merchant, customer?, subscription?, number, title?, message?,
  emails?, total?, tax?, discount?, type?, status, dueDate?, expirationDate?,
  sendOn?, emailStatus?, allowedPaymentMethods?, inactive, frozen,
  created?, modified?
}

type InvoiceStatus = 'pending'|'cancelled'|'expired'|'viewed'|'paid'|'confirmed'|'refunded'|'rejected'
type InvoiceType = 'single'|'multiUse'|'recurring'

// CreateInvoiceRequest (writable fields only — no total, no emailStatus)
interface CreateInvoiceRequest {
  login, merchant, number, status (required)
  customer?, type?, title?, message?, emails?, tax?, discount?,
  dueDate?, expirationDate?, sendOn?, allowedPaymentMethods?,
  invoiceLineItems? (nested create)
}

// InvoiceItem, InvoiceLineItem, Merchant, Customer types
// PlatformSearchFilter { field, operator, value }
// PlatformPagination { page, limit }
```

---

## 5. Server Actions

**New file:** `src/actions/platform.ts`

Follow the same pattern as `src/actions/payrix.ts`:
- `runPlatformAction<T>(...)` wrapper — validates `platformApiKey`, times request, creates `HistoryEntry` (with `source: 'platform'`), pushes to shared `serverHistory`
- Reuse existing `ServerActionResult<T>`, `ApiResponse<T>`, `HistoryEntry` types

Actions: `listInvoicesAction`, `getInvoiceAction`, `createInvoiceAction`, `updateInvoiceAction`, `deleteInvoiceAction`, `listMerchantsAction`, `getMerchantAction`, `listCustomersAction`, `createCustomerAction`, `listInvoiceItemsAction`

---

## 6. DAL Layer

**New files:**
- `src/lib/platform/dal/invoices.ts` — `queryInvoices(config, filters)`, `getInvoiceById(config, id)`
- `src/lib/platform/dal/merchants.ts` — `queryMerchants(config, filters)`
- `src/lib/platform/dal/customers.ts` — `queryCustomers(config, filters)`

---

## 7. Platform Pages

**New directory:** `src/app/platform/`

| Route | Page | Description |
|-------|------|-------------|
| `/platform/invoices` | Invoice list | TanStack table + filters + pagination |
| `/platform/invoices/create` | Create invoice | Form with all writable fields |
| `/platform/invoices/[id]` | Invoice detail | Read-only detail + line items + actions |
| `/platform/invoices/[id]/edit` | Edit invoice | PUT form |
| `/platform/merchants` | Merchant list | TanStack table |
| `/platform/merchants/[id]` | Merchant detail | Read-only detail |
| `/platform/customers` | Customer list | TanStack table |
| `/platform/customers/create` | Create customer | Form |

---

## 8. Platform Components

**New directory:** `src/components/platform/`

| Component | Purpose |
|-----------|---------|
| `invoice-table.tsx` | TanStack Table (columns: number, title, status, type, total, dueDate, emailStatus) |
| `invoice-filters.tsx` | Search form (status, merchant, date range) |
| `invoice-form.tsx` | Shared create/edit form (fetches merchant/login/customer lists from API for dropdowns) |
| `invoice-detail.tsx` | Detail card with grouped fields + line items section |
| `merchant-table.tsx` | TanStack Table for merchants |
| `customer-table.tsx` | TanStack Table for customers |
| `pagination-controls.tsx` | Reusable page nav (current/last page, page size selector) |

**Reuse existing components directly:**
- `EndpointInfo` — works as-is (method, endpoint, docsUrl)
- `ApiResultPanel` — works as-is (normalize platform response into `ApiResponse<T>`)
- All shadcn/ui primitives

---

## 9. File Structure Summary

```
src/
  lib/platform/           # NEW — parallel to lib/payrix/
    types.ts
    client.ts
    curl.ts
    dal/
      invoices.ts
      merchants.ts
      customers.ts
  actions/
    platform.ts            # NEW — platform server actions
  components/platform/     # NEW — platform-specific components
    invoice-table.tsx
    invoice-filters.tsx
    invoice-form.tsx
    invoice-detail.tsx
    merchant-table.tsx
    customer-table.tsx
    pagination-controls.tsx
  app/platform/            # NEW — platform pages
    invoices/
      page.tsx
      create/page.tsx
      [id]/page.tsx
      [id]/edit/page.tsx
    merchants/
      page.tsx
      [id]/page.tsx
    customers/
      page.tsx
      create/page.tsx

Modified files:
  src/components/layout/app-shell.tsx    # Module switcher + platform nav
  src/lib/payrix/types.ts                # Extend PayrixConfig + HistoryEntry
  src/lib/config.ts                      # Platform defaults + getPlatformBaseUrl
  src/app/settings/page.tsx              # Platform credentials card
```

---

## 10. Implementation Order

1. **Foundation** — types.ts, client.ts, config extension
2. **Server actions** — platform.ts + DAL files
3. **Navigation refactor** — app-shell.tsx module switcher
4. **Settings** — Platform credentials card
5. **Invoice list page** — table + filters + pagination (core feature)
6. **Create invoice page** — form with validation
7. **Invoice detail + edit** — detail view, edit form, delete action
8. **Merchants** — list + detail pages
9. **Customers** — list + create pages
10. **E2E tests** — platform-invoices.spec.ts + smoke test updates

---

## 11. E2E Tests

**New file:** `e2e/platform-invoices.spec.ts`

Follows existing patterns from `e2e/smoke.spec.ts` and `e2e/payment-flow.spec.ts` — uses `waitForAppReady`, `seedConfig`, `clearTestData` from `e2e/utils/test-data.ts`.

### Update `e2e/utils/test-data.ts`:
- Add `platformCredentials` to `TEST_DATA`:
  ```typescript
  platformCredentials: {
    apiKey: process.env.TEST_PLATFORM_API_KEY || 'test-platform-key',
  }
  ```
- Update `seedConfig` to accept optional platform fields (`platformApiKey`, `platformEnvironment`)

### Test cases for `e2e/platform-invoices.spec.ts`:

```
describe('Platform Module Navigation')
  - module switcher is visible and defaults to TriPOS
  - switching to Platform shows platform nav sections (Invoices, Merchants, Customers)
  - switching back to TriPOS restores original nav sections
  - platform nav links navigate to correct routes

describe('Platform Settings')
  - settings page shows Platform API Credentials card
  - API key persists after save

describe('Invoice List')
  - beforeEach: seedConfig with platform credentials
  - invoice list page loads at /platform/invoices
  - invoice table renders with expected columns (number, title, status, total, dueDate)
  - pagination controls are visible
  - clicking an invoice row navigates to detail page

describe('Create Invoice')
  - beforeEach: seedConfig with platform credentials
  - create invoice page loads at /platform/invoices/create
  - form has required fields (login, merchant, number, status)
  - merchant/login/customer dropdowns are populated from API
  - form submits successfully and redirects to invoice list or detail
  - form validates required fields before submit

describe('Invoice Detail')
  - detail page loads for a valid invoice ID
  - displays invoice fields (number, title, status, total, dueDate, emails)
  - shows line items section
  - edit and delete action buttons are visible
```

### Update `e2e/smoke.spec.ts`:
- Add test: module switcher renders in sidebar
- Add test: `/platform/invoices` route loads without error

---

## 12. Verification

1. **Config**: Add platform API key in settings, verify it persists in localStorage
2. **Module switcher**: Navigate between TriPOS and Platform modules, verify sidebar nav changes and URL routing works
3. **Invoice list**: Load `/platform/invoices`, verify invoices from the API appear in the table with working pagination
4. **Create invoice**: Submit the create form, verify the invoice appears in the list
5. **Invoice detail**: Click an invoice row, verify detail view loads correctly
6. **History**: Verify platform API calls appear in `/history` with `source: platform`
7. **Existing TriPOS**: Verify all existing TriPOS pages still work unchanged
8. **E2E**: Run `npx playwright test e2e/platform-invoices.spec.ts` — all tests pass
9. **Regression**: Run `npx playwright test` — all existing e2e tests still pass
