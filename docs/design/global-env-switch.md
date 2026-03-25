# Design: Global Environment Switch (Test / Live)

**Issue:** #293  
**Date:** 2026-03-24  
**Author:** Alo  
**Status:** Draft — pending Jonas approval

---

## Problem

Currently TriPOS (`environment: 'cert' | 'prod'`) and Payrix Platform (`platformEnvironment: 'test' | 'prod'`) are switched independently via the Settings page. There is no single top-level control to flip both systems between test and live at once.

This creates friction: a tester switching environments must hunt through two separate settings, increasing the risk of accidental mismatches (e.g., TriPOS on prod, Platform still on test).

---

## Goal

A single **global environment toggle** in the top header/navbar that:
- Switches both TriPOS (`cert` ↔ `prod`) and Payrix Platform (`test` ↔ `prod`) in one click
- Swaps the corresponding API keys and endpoints for both modules simultaneously
- Makes the active environment immediately and unmistakably obvious via visual theming
- Persists to `localStorage`, defaulting to `test`

---

## Design

### 1. New `globalEnvironment` field in `PayrixConfig`

```ts
// src/lib/payrix/types.ts
export type GlobalEnvironment = 'test' | 'live';

export interface PayrixConfig {
  // NEW: top-level global switch
  globalEnvironment: GlobalEnvironment;

  // Existing per-module fields remain for backward compatibility
  environment: PayrixEnvironment;           // 'cert' | 'prod'
  platformEnvironment: 'test' | 'prod';
  // ... rest unchanged
}
```

`globalEnvironment` is the source of truth going forward. The per-module fields (`environment`, `platformEnvironment`) are **derived** from it at read time via a helper, not independently settable from the UI.

The Settings page per-module environment selects are **removed** (the global switch replaces them). All existing env-reading code already goes through `config.environment` / `config.platformEnvironment` — we update those derived values when the global switch fires.

**Default in `lib/config.ts`:**
```ts
globalEnvironment: 'test',
environment: 'cert',
platformEnvironment: 'test',
```

**Migration on load:** If a stored config has no `globalEnvironment`, infer it:
- If either `environment === 'prod'` or `platformEnvironment === 'prod'` → `'live'`
- Otherwise → `'test'`

---

### 2. Global switch in `AppShell` header

Add a toggle/button group in the header (right side, before the History/Settings buttons):

```
[ TEST | LIVE ]   ← segmented button group or toggle switch
```

On click to **LIVE**: show a confirmation `AlertDialog` before applying.

```
⚠️ Switch to Live Environment?
TriPOS and Payrix Platform will make real API calls.
Real transactions will be processed.

[Cancel]  [Switch to Live]
```

On confirm: call `updateConfig` with `globalEnvironment: 'live'`, `environment: 'prod'`, `platformEnvironment: 'prod'`.

On switch back to TEST: no confirmation needed (safe direction), apply immediately.

---

### 3. Visual theming — test vs live

| Element | TEST mode | LIVE mode |
|---|---|---|
| Header/navbar background | Orange tint `bg-orange-50 dark:bg-orange-950/40` | Default (`bg-background`) |
| Header border | `border-orange-400` | `border-border` |
| Env badge | Orange "test" (`bg-orange-100 text-orange-700`) | Destructive (red) "live" |
| Existing prod warning banner | Keep as-is | Keep as-is |
| SidebarHeader accent | `border-l-4 border-orange-400` on sidebar top | None |

**Rationale:** Orange on TEST is a persistent "you're in sandbox" visual cue — the tester's default state. LIVE/prod uses the normal app chrome (clean, no accent) so there's no extra visual noise in production. The existing red destructive badge + warning banner already call out prod sufficiently.

Implementation: add a `data-env` attribute on `<SidebarInset>` and the `<header>`, conditionally apply classes based on `config.globalEnvironment`.

---

### 4. Settings page cleanup

The "Environment" card (TriPOS env select) and the equivalent Platform environment select are **removed** from Settings, replaced by a read-only info row:

```
Environment: TEST  (change via the header toggle)
```

This prevents the per-module env selects from going out of sync with the global switch.

---

### 5. API key swap

When switching to `live`, the app needs live-mode API keys. These are already stored in `PayrixConfig`:
- TriPOS live: `expressAcceptorId`, `expressAccountId`, `expressAccountToken`
- Platform live: `platformApiKey`

**Phase 1 (this issue):** The switch just changes environment flags. If the user has configured credentials in Settings, they're used. No separate test/live key storage yet.

**Phase 2 (future):** Store separate test-mode and live-mode key sets (`tripos.test.*`, `tripos.live.*`, `platform.test.key`, `platform.live.key`) and auto-swap them on toggle. This avoids having to re-enter credentials on each switch.

Phase 2 is out of scope for this issue. File a follow-up if needed.

---

## Files to change

| File | Change |
|---|---|
| `src/lib/payrix/types.ts` | Add `GlobalEnvironment` type + `globalEnvironment` field to `PayrixConfig` |
| `src/lib/config.ts` | Add `globalEnvironment: 'test'` default; add migration logic on `getConfig()`; update `saveConfig` |
| `src/hooks/use-payrix-config.ts` | Add `setGlobalEnvironment(env: GlobalEnvironment)` helper that updates all three env fields atomically |
| `src/components/layout/app-shell.tsx` | Add env toggle to header; add confirmation `AlertDialog` for live switch; apply conditional theming classes |
| `src/app/settings/page.tsx` | Remove per-module environment selects; add read-only env info row |

No new files needed. No backend changes (localStorage only).

---

## E2E test impact

`platform-real-api.spec.ts` tests against live endpoints explicitly. Those are unaffected.

`e2e/default-prefill.spec.ts` and `payment-flow.spec.ts` rely on `cert` environment being the default. After this change the default is still `test`/`cert`, so existing tests are unaffected.

A new E2E test should cover: switch to live → confirmation dialog appears → cancel → env remains test.

---

## Out of scope

- Per-module independent env overrides (removed by design — global switch is the UX)
- Phase 2 dual key storage
- Server-side env state (localStorage is sufficient for a testing tool)

---

## Open questions

None — all answered by Jonas.
