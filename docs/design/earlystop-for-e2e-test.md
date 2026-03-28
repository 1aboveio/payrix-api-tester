# Design: Early Stop and Execution Order for E2E Tests

**Issue:** [#42](https://github.com/1aboveio/payrix-api-tester/issues/42)  
**Status:** `status:planned`  
**Author:** Alo  
**Date:** 2026-03-28

---

## 1. Scope

The E2E suite currently runs all tests in parallel with no enforced execution order. When early failures occur (e.g. auth broken, settings not persisting), downstream tests keep running and produce a noisy failure report that obscures the root cause. This design covers:

1. **Early stop** — halt the suite after N consecutive/total failures
2. **Execution order** — define which test groups run first so failures in foundational tests abort before dependent tests burn time

Non-goals:
- No changes to test assertions or test logic
- No changes to CI infrastructure (Cloud Build, GitHub Actions)
- No new test coverage

---

## 2. Goals

1. Fail fast: stop the suite as soon as it's clear the run is doomed
2. Surface the root-cause failure without noise from cascading downstream failures
3. Make test priority explicit and maintainable in one place
4. Keep the implementation minimal — Playwright-native, no custom runner

---

## 3. Current State

`playwright.config.ts` today:

```ts
fullyParallel: true,
workers: process.env.PLAYWRIGHT_WORKERS ? parseInt(...) : 4,
maxFailures: process.env.CI ? 5 : 0,  // 5 on CI, unlimited locally
```

**Problems:**
- `fullyParallel: true` + 4 workers means smoke and auth tests run in parallel with payment-flow, history, etc. A broken auth state produces failures in 10+ spec files simultaneously.
- `maxFailures: 5` is better than unlimited but still allows 5 failures across randomly-ordered parallel tests before stopping — not 5 in a meaningful order.
- No explicit priority tiers — a flaky pagination test can exhaust the `maxFailures` budget before a critical smoke failure is even reported.

---

## 4. Architecture

### 4.1 Test Execution Tiers

Tests are grouped into three tiers executed sequentially. Within each tier, tests run in parallel.

| Tier | Purpose | Spec files |
|------|---------|-----------|
| **T1 — Smoke** | App loads, navigation works, no crash on load | `smoke.spec.ts` |
| **T2 — Auth + Config** | Settings persist, credentials resolve, auth state valid | `auth.spec.ts`, `default-prefill.spec.ts` |
| **T3 — Functional** | All transactional and feature flows | Everything else |

**Rule:** if T1 fails → stop, never run T2 or T3. If T2 fails → stop, never run T3.

This ensures the failure report always contains the highest-signal test, not whichever parallel worker happened to finish last.

### 4.2 Playwright Projects for Tier Sequencing

Playwright's `projects` + `dependencies` API implements this natively — no custom runner needed.

```ts
// playwright.config.ts
projects: [
  {
    name: 'smoke',
    testMatch: /smoke\.spec\.ts/,
  },
  {
    name: 'auth-config',
    testMatch: /(auth|default-prefill)\.spec\.ts/,
    dependencies: ['smoke'],  // only runs if smoke passes
  },
  {
    name: 'functional',
    testMatch: /(?!smoke|auth|default-prefill).*\.spec\.ts/,
    dependencies: ['auth-config'],  // only runs if auth-config passes
  },
],
```

`dependencies` in Playwright means: if the depended-upon project has any failure, skip this project entirely.

### 4.3 Early Stop (`maxFailures`)

Lower the `maxFailures` threshold and make it configurable:

```ts
maxFailures: process.env.MAX_FAILURES
  ? parseInt(process.env.MAX_FAILURES, 10)
  : process.env.CI ? 3 : 0,
```

Rationale for `3` on CI (down from `5`):
- T1 has ~7 tests. If 3 fail, smoke is clearly broken — no value in running T2/T3.
- Locally, `0` = unlimited (keep existing developer experience).

### 4.4 Parallelism

Within each tier, `fullyParallel: true` is preserved. The sequencing is at the project level, not the worker level.

```ts
fullyParallel: true,   // keep — within-tier parallelism
workers: process.env.PLAYWRIGHT_WORKERS ? parseInt(...) : 4,
```

---

## 5. Configuration Changes

**`playwright.config.ts` — full diff summary:**

| Field | Before | After |
|-------|--------|-------|
| `projects` | single `chromium` project | 3 tiered projects with `dependencies` |
| `maxFailures` | `CI ? 5 : 0` | `MAX_FAILURES env ?? (CI ? 3 : 0)` |
| `fullyParallel` | `true` | `true` (unchanged) |
| `workers` | `PLAYWRIGHT_WORKERS ?? 4` | unchanged |

**No changes required to:**
- Any spec file
- `cloudbuild-e2e.yaml`
- GitHub Actions workflows
- `Dockerfile.e2e`

---

## 6. Key Decisions

| Decision | Rationale |
|----------|-----------|
| Playwright `projects` + `dependencies` over custom ordering | Native API, no third-party tooling, zero maintenance overhead |
| 3 tiers (smoke → auth → functional) | Mirrors the natural dependency graph: app must load → auth must work → features depend on both |
| `maxFailures: 3` on CI | Tight enough to stop fast, loose enough for minor flakiness in a single tier |
| `MAX_FAILURES` env var override | Allows ad-hoc override in Cloud Build or local runs without code change |
| `fullyParallel: true` preserved within tiers | Maintains fast within-tier execution; sequencing is only at tier boundaries |
| No changes to spec files | Tier membership is declared in `playwright.config.ts` via `testMatch` — zero spec file edits required |

---

## 7. Acceptance Criteria

- [ ] `playwright.config.ts` updated with 3 tiered projects and `dependencies`
- [ ] `maxFailures` lowered to 3 on CI; configurable via `MAX_FAILURES` env var
- [ ] Running `pnpm exec playwright test` locally passes without regression
- [ ] CI run with a deliberately broken smoke test stops before running functional tests
- [ ] CI run with a deliberately broken auth test stops before running functional tests
- [ ] Full passing run completes in the same or less time than current

---

## 8. Assignment

| Role | Owner |
|------|-------|
| Architecture + review | Alo |
| Implementation | Cory |
