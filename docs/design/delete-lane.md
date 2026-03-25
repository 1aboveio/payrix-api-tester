# Design: Delete Lane

**Issue:** #297  
**Date:** 2026-03-24  
**Author:** Alo  
**Status:** Draft — pending Jonas approval

---

## Problem

The Lanes page (`/lanes`) currently supports List Lanes and Get Lane. There is no way to delete a lane from the UI — the user has to use a raw API call or external tool.

---

## Goal

Add a **Delete Lane** action to the existing Lanes management page, backed by the `DELETE /v1/lanes/{laneId}` endpoint in the triPOS Cloud Lane API.

---

## API

**Endpoint:** `DELETE /cloudapi/v1/lanes/{laneId}`  
**Headers:** Standard tp-express-acceptor-id / account-id / account-token + tp-request-id  
**Body:** None  
**Response 200:** Empty body (no JSON payload) — `200 OK` means success  
**Response 400:** Bad request  
**Response 401:** Unauthorized  
**Response 404:** Lane not found  
**Response 500:** Server error

---

## Design

### 1. Server action: `deleteLaneAction`

New function in `src/actions/payrix.ts`:

```ts
export async function deleteLaneAction({
  config,
  requestId,
  laneId,
}: LaneByIdInput): Promise<ServerActionResult<DeleteLaneResponse>>
```

- `DELETE https://{cloudBaseUrl}/cloudapi/v1/lanes/{laneId}`
- Headers: standard tp-* credentials (no `tp-authorization` required for Lane API, consistent with existing `listLanesAction` / `getLaneAction`)
- Returns `{ success: true }` on 200, error on 4xx/5xx
- Saves to history

`DeleteLaneResponse` type already exists in `src/lib/payrix/types.ts`:
```ts
export interface DeleteLaneResponse {
  success?: boolean;
  message?: string;
  [key: string]: unknown;
}
```

### 2. UI: Add to the existing Lanes page (`/lanes`)

Add a new section below the existing List/Get section — a separate card titled **"Delete Lane"**:

```
┌─────────────────────────────────┐
│ Delete Lane                     │
├─────────────────────────────────┤
│ Lane ID  [________________]     │
│                                 │
│ [Delete Lane]  ← destructive    │
│                                 │
│ ⚠️ Confirmation dialog before   │
│    executing                    │
└─────────────────────────────────┘
```

- The Delete button uses `variant="destructive"` to make the danger visually clear
- **Confirmation `AlertDialog`** required before executing (same pattern as the live env switch):
  > *"Delete lane {laneId}? This will unpair the device and cannot be undone."*
  > [Cancel] [Delete Lane]
- After success: show result in the shared `ApiResultPanel`
- The Lane ID input in this section is independent of the Get Lane input (they can have different values in flight)

### 3. CURL preview

Update `curlCommand` memo to handle `lastAction === 'delete'`:
```ts
buildCurlCommand({
  config,
  endpoint: `/cloudapi/v1/lanes/${encodeURIComponent(submittedLaneId)}`,
  method: 'DELETE',
  body: undefined,
  includeAuthorization: false,
});
```

---

## Files to change

| File | Change |
|---|---|
| `src/actions/payrix.ts` | Add `deleteLaneAction` |
| `src/app/lanes/page.tsx` | Add Delete Lane card + AlertDialog + wire to action |

No new files. No type changes needed (`DeleteLaneResponse` already exists).

---

## Out of scope

- Bulk delete
- Delete from the connection-status page

---

## Open questions

None.
