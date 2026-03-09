# Issue #60 — Implementation Plan: Complete Platform Invoices Integration

## Current State Assessment

The `feat/invoices` branch has foundational work done but several features are **incomplete or missing**. Here's what exists vs what's needed:

### ✅ Done (Foundation)
- `PlatformClient` class with all CRUD methods (invoices, merchants, customers)
- Platform types (`types.ts`) — Invoice, Merchant, Customer, search/pagination
- Server actions (`actions/platform.ts`) — all endpoint actions wired
- Config extension (`platformApiKey`, `platformEnvironment` in settings)
- Module switcher in app-shell (tripos ↔ platform navigation)
- Settings page: Platform API Credentials card
- Basic E2E spec (`platform-endpoints.spec.ts`) — 9 UI smoke tests

### ❌ Missing / Incomplete

| # | Feature | Status | Priority |
|---|---------|--------|----------|
| 1 | Invoice edit page — **stub only** (50 lines, placeholder text) | NOT DONE | P1 |
| 2 | cURL preview / EndpointInfo — **zero** platform pages show request preview | NOT DONE | P1 |
| 3 | ApiResultPanel — **zero** platform pages show raw API response | NOT DONE | P1 |
| 4 | History integration — platform calls don't appear in `/history` page | NOT DONE | P2 |
| 5 | Invoice line items — detail page doesn't show/manage line items | NOT DONE | P1 |
| 6 | Pagination controls — component exists but may not be wired in all lists | VERIFY | P2 |
| 7 | E2E tests against real API — current tests use dummy key, no actual API calls | NOT DONE | P1 |
| 8 | Search header format — needs validation against actual API behavior | VERIFY | P2 |
| 9 | `invoiceItems` (catalog) CRUD — client has list/create but no UI | NOT DONE | P3 |
| 10 | `invoiceLineItems` direct endpoint — client missing, only nested in create | NOT DONE | P3 |

---

## Implementation Plan

### PR 1: Invoice Edit Page (P1)
**Scope:** Replace the edit page stub with a real editable form.

**Files to create/modify:**
- `src/app/platform/invoices/[id]/edit/page.tsx` — Full edit form
  - Fetch existing invoice data on mount via `getInvoiceAction`
  - Pre-populate all editable fields
  - Submit via `updateInvoiceAction`
  - Show success/error toast
  - Redirect to detail page on success
  - Fields: `number`, `title`, `message`, `emails`, `status`, `type`, `dueDate`, `expirationDate`, `sendOn`, `tax`, `discount`, `allowedPaymentMethods`
  - Do NOT allow editing `login` or `merchant` (immutable after creation)

**Estimated LoC:** ~250
**Test:** Add E2E test for edit flow (navigate to edit, change field, verify)

---

### PR 2: cURL Preview + API Response Panel for All Platform Pages (P1)
**Scope:** Add request preview and raw API response display to all platform pages, matching triPOS UX.

**Files to modify:**
- `src/lib/platform/curl.ts` — Extend `buildPlatformCurlCommand()` to handle all methods (GET/POST/PUT/DELETE) with proper `APIKEY` header
- `src/app/platform/invoices/page.tsx` — Add EndpointInfo + ApiResultPanel
- `src/app/platform/invoices/create/page.tsx` — Add EndpointInfo + ApiResultPanel
- `src/app/platform/invoices/[id]/page.tsx` — Add EndpointInfo + ApiResultPanel
- `src/app/platform/invoices/[id]/edit/page.tsx` — Add EndpointInfo + ApiResultPanel
- `src/app/platform/merchants/page.tsx` — Add EndpointInfo + ApiResultPanel
- `src/app/platform/merchants/[id]/page.tsx` — Add EndpointInfo + ApiResultPanel
- `src/app/platform/customers/page.tsx` — Add EndpointInfo + ApiResultPanel
- `src/app/platform/customers/create/page.tsx` — Add EndpointInfo + ApiResultPanel
- `src/app/platform/customers/[id]/page.tsx` — Add EndpointInfo + ApiResultPanel (if detail fetches data)

**Pattern:** Each page should show:
1. **Endpoint info** — method, URL, docs link
2. **cURL command** — copyable, with actual headers/body (API key redacted in display)
3. **Request preview** — JSON body being sent
4. **API response panel** — raw response after action executes

**Estimated LoC:** ~300
**Test:** E2E: verify cURL panel visible after action on invoice list page

---

### PR 3: Invoice Line Items in Detail Page (P1)
**Scope:** Show and manage line items on the invoice detail page.

**Files to modify:**
- `src/app/platform/invoices/[id]/page.tsx` — Add line items section
  - Fetch line items via `listInvoiceItemsAction` with filter `invoice[eq]=<id>`
  - Display in a table: item name, description, quantity, price, taxable
  - Add "Add Line Item" button with inline form or modal
  - Delete line item button per row
- `src/lib/platform/client.ts` — Add `deleteInvoiceItem(id)` method
- `src/actions/platform.ts` — Add `createInvoiceItemAction`, `deleteInvoiceItemAction`
- `src/lib/platform/types.ts` — Verify `InvoiceLineItem` matches actual API response

**Estimated LoC:** ~200
**Test:** E2E: verify line items section renders on detail page

---

### PR 4: History Integration (P2)
**Scope:** Platform API calls should appear in the `/history` page with proper `source: 'platform'` badge.

**Files to verify/modify:**
- `src/actions/platform.ts` — Already calls `addToServerHistory` with `source: 'platform'` ✅
- `src/app/history/page.tsx` — Verify platform entries render correctly
  - Add source badge/filter (tripos vs platform)
  - Verify entry click shows full request/response detail
- `src/lib/storage.ts` — Verify `HistoryEntry` with `source` field is handled

**Estimated LoC:** ~50-100
**Test:** E2E: perform a platform action, verify it appears in history

---

### PR 5: Pagination Wiring + Search Validation (P2)
**Scope:** Ensure pagination works end-to-end on all list pages.

**Files to verify/modify:**
- `src/app/platform/invoices/page.tsx` — Wire `PaginationControls` component
- `src/app/platform/merchants/page.tsx` — Wire pagination
- `src/app/platform/customers/page.tsx` — Wire pagination
- `src/lib/platform/client.ts` — Verify `search` header format against real API
  - Test with actual API key: does Payrix use `search` header or query params for filtering?
  - Adjust `buildSearchHeader()` if needed

**Estimated LoC:** ~100
**Test:** E2E: verify pagination controls appear and page changes work

---

### PR 6: Real API E2E Tests (P1)
**Scope:** E2E tests that actually call `test-api.payrix.com` to validate the integration works.

**Files to create/modify:**
- `e2e/platform-invoices.spec.ts` — New comprehensive E2E
- `e2e/utils/test-data.ts` — Add platform seed config with real API key from env

**Test cases (minimum):**
1. **Settings**: Save platform API key, verify persistence
2. **Invoice list**: Load list from real API, verify table renders with data
3. **Create invoice**: Fill form, submit, verify success response
4. **Invoice detail**: Click invoice row, verify detail loads
5. **Edit invoice**: Change a field, submit, verify updated
6. **Delete invoice**: Delete a test invoice, verify removed
7. **Line items**: Add line item to invoice, verify appears
8. **Merchants list**: Load merchants, verify table renders
9. **Customers list**: Load customers, verify table renders
10. **Create customer**: Fill form, submit, verify success
11. **Module switcher**: Switch between triPOS and Platform, verify nav changes
12. **History**: Perform platform action, verify appears in history

**Environment:**
- API key: `~/.openclaw/credentials/payrix_api_key` (for local dev)
- CI: Use `TEST_PLATFORM_API_KEY` env var or GCP Secret Manager
- Base URL: `test-api.payrix.com`

**Estimated LoC:** ~300
**Important:** Tests must clean up created resources (delete test invoices/customers after test)

---

## Implementation Order

```
PR 1: Invoice Edit Page ──────────────────► merge to dev
PR 2: cURL + API Response Panels ─────────► merge to dev
PR 3: Invoice Line Items ─────────────────► merge to dev
PR 4: History Integration ────────────────► merge to dev
PR 5: Pagination + Search Validation ─────► merge to dev
PR 6: Real API E2E Tests ─────────────────► merge to dev
                                              │
                                    Full E2E validation
                                              │
                                    dev → main sync PR
```

## Verification Checklist

Before closing Issue #60, ALL of these must be verified:

- [ ] Module switcher works (triPOS ↔ Platform)
- [ ] Platform API key saved in settings and persists
- [ ] Invoice list loads from real API with pagination
- [ ] Create invoice works — new invoice appears in list
- [ ] Invoice detail page shows all fields + line items
- [ ] Edit invoice works — changes reflected
- [ ] Delete invoice works — removed from list
- [ ] Line items can be added/viewed on invoice detail
- [ ] Merchants list loads from real API
- [ ] Merchant detail page shows info
- [ ] Customers list loads from real API
- [ ] Create customer works
- [ ] Customer detail page shows info
- [ ] cURL preview shown on all platform pages
- [ ] API response panel shown after every action
- [ ] Platform actions appear in `/history` with `platform` source
- [ ] All E2E tests pass against `test-api.payrix.com`
- [ ] All existing triPOS E2E tests still pass (no regression)
- [ ] `pnpm exec tsc --noEmit` passes
- [ ] `pnpm exec next build` succeeds
- [ ] Cloud Build succeeds on dev

## Notes for Cory

1. **API key location:** `~/.openclaw/credentials/payrix_api_key`
2. **Always rebase from latest `dev`** before starting each PR
3. **Run `tsc --noEmit` + `next build`** before pushing
4. **Keep PRs < 300 LoC** — split if larger
5. **Test against real API** — don't assume mock behavior matches
6. **cURL preview must redact API key** — show `[APIKEY]` placeholder in display
7. **Clean up test data** — E2E tests should delete any invoices/customers they create
