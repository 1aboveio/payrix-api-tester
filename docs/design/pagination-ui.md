# Design: Pagination UI for Transaction Endpoints

- **Issue:** [#375](https://github.com/1aboveio/payrix-api-tester/issues/375)
- **Status:** Draft
- **Author:** Alo
- **Created:** 2026-03-26

---

## Context

The payrix-api-tester portal currently has inconsistent and incomplete pagination across its transaction pages:

1. **TriPOS transactions** (`/transactions`) — No pagination UI at all. Uses `POST /api/v1/transactionQuery` with `pageSize` in the request body. Results are loaded once and displayed; no next/prev navigation.

2. **Platform transactions** (`/platform/transactions`) — Has `PaginationControls` component, but sends `page[number]` AND `page[limit]` as separate URL params. Jonas's preferred format uses only `page[limit]`.

3. **Terminal transactions** — No dedicated portal page. The platform API supports `/terminalTxns` but there's no UI to query it.

Jonas provided the target API format via curl example:

```bash
curl -s --max-time 30 -w "\nHTTP_STATUS: %{http_code}\n" \
  -H "APIKEY: {placeholder}" \
  -H "Content-Type: application/json" \
  -H "search: created[greater]=2026-03-20" \
  "https://api.payrix.com/terminalTxns?page%5Blimit%5D=5"
```

Key format elements:
- `?page[limit]=N` as URL query param (square brackets, URL-encoded as `%5B`/`%5D`)
- `search: created[greater]=YYYY-MM-DD` as HTTP header (date filtering)
- Operators: `greater`, `less`, `eq`, `contains`, etc.

---

## Proposed Changes

### 1. TriPOS Transactions — Add Pagination

**Page:** `src/app/transactions/page.tsx`

**Current:** POST body with `pageSize`, no navigation.

**Changes:**

1. **Add `pageLimit` state** — initial value from filter form (default 100), exposed via a page-size selector.

2. **Add `currentOffset` state** — tracks the current page offset for offset-based pagination.

3. **Add pagination navigation** — prev/next buttons. Each request advances by `pageLimit`:
   - Next: `offset = offset + pageLimit`
   - Prev: `offset = offset - pageLimit`
   - Disable prev when `offset === 0`

4. **Change request format:** Currently uses `POST /api/v1/transactionQuery` with `pageSize` in body. The backend (`transactionQueryAction`) proxies to the Payrix API. We need to check if the Payrix API supports `?page[limit]=N` as a query param for this endpoint, and if so, switch to GET with URL params instead of POST with body pagination.

   **Decision point:** If the TriPOS `/api/v1/transactionQuery` endpoint supports `page[limit]` as a URL param, add it to the client and update the UI. If it only supports POST body pagination, keep the body format but add client-side prev/next navigation using the response's `next` cursor or total count.

5. **Update `TransactionTable`** — show current range (e.g., "Showing 1–100 of 247") if total is available.

6. **Update request preview** — show actual URL + headers in the API result panel.

**API format to match:**
- `?page[limit]=N` URL param
- `search: created[greater]=YYYY-MM-DD` header

---

### 2. Platform Transactions — Align Pagination Format

**Page:** `src/app/platform/transactions/page.tsx`

**Current:** Sends `page[number]` + `page[limit]` as separate URL params.

**Changes:**

1. **Update `PlatformClient.buildQueryParams`** — remove `page[number]`; only send `page[limit]`:
   ```ts
   // Before
   params.set('page[number]', String(pagination.page));
   params.set('page[limit]', String(pagination.limit));
   
   // After
   params.set('page[limit]', String(pagination.limit));
   ```

2. **Verify platform API behavior** — confirm that removing `page[number]` doesn't break the platform API. The platform API may use offset-based pagination (`page[offset]`) instead of page-number-based. Check the API contract and adjust accordingly.

3. **If platform API uses offset-based pagination:** Use `page[offset]=N&page[limit]=M` where offset is calculated as `(page - 1) * limit`.

4. **Update `PaginationControls`** — the component currently shows "Page N of M". If switching to offset-based or limit-only, adjust the display label accordingly.

5. **Update `PlatformApiResultPanel`** — show the actual URL with correct params.

---

### 3. Terminal Transactions Page (New)

**New page:** `src/app/platform/terminal-transactions/page.tsx`

**Approach:**

1. **Check platform API support** — verify `/terminalTxns` is accessible via the platform client. Look at `src/lib/platform/client.ts` — if no `listTerminalTransactions` method exists, add it:
   ```ts
   async listTerminalTransactions(
     filters?: PlatformSearchFilter[],
     pagination?: PlatformPagination
   ): Promise<PlatformRequestResult<TerminalTransaction>> {
     return this.request<TerminalTransaction>('/terminalTxns?embed=merchant,terminal', {
       searchFilters: filters,
       pagination,
     });
   }
   ```

2. **Add action** in `src/actions/platform.ts`:
   ```ts
   export async function listTerminalTransactionsAction(
     context: PlatformActionContext,
     filters?: PlatformSearchFilter[],
     pagination?: PlatformPagination
   ): Promise<ServerActionResult<unknown>> {
     return runPlatformAction(
       context,
       (client) => client.listTerminalTransactions(filters, pagination),
       '/terminalTxns',
       'GET'
     );
   }
   ```

3. **Build the page** — reuse the platform transactions page layout, adapting for terminal transaction fields.

4. **Navigation** — add a link to the terminal transactions page in the platform sidebar/nav.

5. **Pagination** — use the same `page[limit]` format as the platform transactions page.

---

### 4. API Result Panel Updates

**Component:** `src/components/platform/api-result-panel.tsx`

All transaction pages show an API result panel. Ensure the preview correctly reflects:
- `?page[limit]=N` URL param
- `search: field[operator]=value` header
- Full reconstructed curl example

---

## Files Affected

| File | Changes |
|------|---------|
| `src/lib/payrix/dal/transactions.ts` | Add offset/limit support to `queryTransactions` |
| `src/app/transactions/page.tsx` | Add pagination state and controls |
| `src/components/payrix/transaction-filters.tsx` | Add date-based search filter support |
| `src/lib/platform/client.ts` | Fix `page[limit]` format; add `listTerminalTransactions` |
| `src/app/platform/transactions/page.tsx` | Align with offset-based pagination |
| `src/app/platform/terminal-transactions/page.tsx` | **New file** |
| `src/actions/platform.ts` | Add `listTerminalTransactionsAction` |
| `src/components/platform/api-result-panel.tsx` | Show correct URL + header format |
| `src/lib/platform/types.ts` | Add `TerminalTransaction` type if missing |
| `src/app/platform/` (sidebar nav) | Add link to terminal transactions |

---

## E2E Coverage

Add pagination E2E tests:
1. TriPOS transactions — load results, navigate to next page, verify data changes
2. Platform transactions — verify `page[limit]` param in API result panel
3. Terminal transactions — load page, verify pagination controls work

---

## Acceptance Criteria

1. TriPOS transactions page has working prev/next pagination with `page[limit]` URL param
2. Platform transactions uses `page[limit]` (not `page[number]+page[limit]`)
3. Terminal transactions page exists and is accessible from the platform nav
4. All request previews show correct URL params and `search` headers
5. E2E tests cover pagination flows for all three pages
6. No regressions in existing transaction functionality
