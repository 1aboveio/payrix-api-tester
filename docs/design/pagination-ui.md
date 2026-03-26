# Pagination UI Design Doc

## Overview
Add pagination support to transaction query pages using URL params (`page[limit]`) and search headers per Payrix API conventions.

## Changes

### 1. TriPOS Transactions (`/transactions/page.tsx`)
**Current:** POST body with `pageSize`
**New:** URL params with `?page[limit]=N` + search header for date filters

- Add pagination controls (page number, limit selector, prev/next)
- Change `queryTransactions` DAL to use URL params
- Add `search` header for date filters: `created[greater]=20260320;created[less]=20260326`
- Parse pagination from response for navigation

### 2. Platform Transactions (`/platform/transactions/page.tsx`)
**Current:** `page[number]` + `page[limit]` URL params
**New:** `page[offset]=N&page[limit]=M`

- Update PlatformClient to use offset-based pagination
- Keep `page[offset]=N&page[limit]=M` format
- Update search header format for date filters

### 3. Platform Client (`lib/platform/client.ts`)
- Update `buildQueryParams` for offset-based pagination
- Update `buildSearchHeader` to match API format

### 4. Types
- Update `PlatformPagination` to support offset
- Add pagination response parsing

## API Format

### TriPOS TransactionQuery
```
POST /api/v1/transactionQuery?page[limit]=10
Headers:
  search: created[greater]=20260320;created[less]=20260326
Body:
  { terminalId, ... }
```

### Platform List Transactions
```
GET /txns?page[offset]=0&page[limit]=10
Headers:
  search: status[eq]=1;created[greater]=20260320
```

### Platform Terminal Transactions
```
GET /terminalTxns?page[offset]=0&page[limit]=10
Headers:
  search: created[greater]=20260320
```

## Acceptance Criteria
- [ ] TriPOS transactions have working pagination controls
- [ ] Platform transactions use `page[limit]` format
- [ ] Request previews show correct URL params and search headers
- [ ] Date filters work via search headers
- [ ] Prev/Next navigation works for both
- [ ] Terminal transactions endpoint has UI if supported
