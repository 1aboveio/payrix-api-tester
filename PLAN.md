# [DRAFT] Payrix API Tester — Issue #1 Implementation Plan

## TL;DR
- Add **Transaction List** page using existing `transactionQuery` endpoint with required filters.
- Add **Transaction Detail** page that renders grouped fields + raw JSON view.
- Use **TanStack Table** for list with column visibility toggles.
- Introduce a **DAL layer** for calling `transactionQueryAction` from backend.

## Scope (from Issue #1)
### Transaction List Page
- Mandatory filters: `terminalId`, `startDate`, `endDate`
- Optional filters: `transactionId`, `referenceNumber`
- Table with all response columns; column visibility toggles

### Transaction Detail Page
- Full detail view of a single transaction
- Fields grouped by type
- Raw JSON textarea/verbatim

## Proposed Information Architecture
- **Route:** `/transactions` (list + filters)
- **Route:** `/transactions/[id]` (detail)
  - Accept navigation from list row click
  - Fallback: allow direct input of `transactionId` to fetch detail

## Data Flow & API Calls
- Reuse existing server action `transactionQueryAction` in `src/actions/payrix.ts`.
- Add **DAL layer** in backend (e.g. `src/lib/payrix/dal/transactions.ts`) to encapsulate:
  - request building
  - calling `transactionQueryAction`
  - normalization + error handling
- Request payload derived from filters:
  - Required: `terminalId`, `startDate`, `endDate`
  - Optional: `transactionId`, `referenceNumber`
- **List page** calls DAL to fetch list; store both parsed list and raw JSON.
- **Detail page** calls DAL with `transactionId` filter to fetch one transaction (or alternatively leverage list row payload if already in-memory).

## UI/UX Design
### List Page Layout
1. **Filter Form**
   - Fields: Terminal ID, Start Date, End Date, Transaction ID (optional), Reference Number (optional)
   - Validation: required fields must be present before submit
2. **Result Summary**
   - Total count + response metadata
3. **TanStack Table**
   - Columns include all response fields (flattened)
   - Column visibility toggles (checkbox dropdown)
   - Row click → detail page
4. **Raw JSON Panel** (optional collapse)
   - Show response JSON for debugging

### Detail Page Layout
1. **Transaction Header** (basic identifiers)
2. **Grouped Fields**
   - Group by semantic category (e.g., IDs, amounts, card info, timestamps, status)
3. **Raw JSON**
   - Read-only textarea or code block with full JSON

## Data Modeling & Column Strategy
- Create a **flattened transaction record** for table display.
- Maintain original nested JSON for raw view.
- Column definitions derived from flattened keys; default visible set for common fields, with full list toggleable.

## Component/Module Changes
- **Pages**
  - `src/app/transactions/page.tsx` (new)
  - `src/app/transactions/[id]/page.tsx` (new)
- **Components**
  - `TransactionFilters.tsx` (new): form + validation
  - `TransactionTable.tsx` (new): TanStack table + visibility toggles
  - `TransactionDetail.tsx` (new): grouped fields + raw JSON
- **Lib**
  - `src/lib/payrix/dal/transactions.ts` (new): DAL wrapper for `transactionQueryAction`
  - `src/lib/payrix/transaction-utils.ts` (new): flattening + group helpers

## Validation Rules
- Required inputs enforced before server action call
- Date range sanity check (start <= end)

## Error/Empty States
- Invalid config → show actionable error (reuse existing patterns)
- No results → empty state with guidance
- API error → display status + error payload

## Implementation Steps
1. Add new routes + navigation entry in sidebar (if needed)
2. Add DAL wrapper for `transactionQueryAction`
3. Build filter form + validation
4. Wire list page to DAL for results
5. Implement TanStack table with visibility toggles
6. Add detail page with grouped fields + raw JSON (via DAL)
7. Add utility helpers for flattening/grouping
8. Basic styling + empty/error states
9. Manual QA with sample payloads

## Testing Plan
- Manual test:
  - Missing required filters → validation error
  - Successful query → table rows render
  - Toggle columns on/off
  - Click row → detail view
  - Raw JSON displayed
- (Optional) Add minimal unit test for flattening/grouping helpers

## Open Questions
- Confirm which **transactionQuery response fields** are considered mandatory for the table defaults
- Confirm date/time format preference for filters (ISO vs local)

## Next Steps
- Review this PLAN.md with Jonas
- Confirm UI default columns + field grouping
- Implement in a feature branch
