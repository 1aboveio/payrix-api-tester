# E2E Background Execution - Flow Diagram

## Complete Flow (All Ticks)

```
┌─────────────────────────────────────────────────────────────────┐
│ TICK 1: Start Tests                                             │
└─────────────────────────────────────────────────────────────────┘
   │
   ├─ Read state: e2eRunning = false (first entry)
   │
   ├─ FAIL-FAST VERIFICATIONS (synchronous, <10s):
   │   │
   │   ├─ [1/4] playwright.config.ts exists? ────────┐
   │   ├─ [2/4] Browserless configured in config? ───┤
   │   ├─ [3/4] test:e2e script exists? ─────────────┤
   │   ├─ [4/4] Browserless container running? ──────┤
   │   │                                               │
   │   ├─ IAP detection (curl preflight)              │
   │   ├─ IAP token generation (gcloud sign-jwt)      │
   │   ├─ IAP access check (curl with token)          │
   │   │                                               │
   │   └─ Package manager detection (lockfile check)  │
   │                                                   │
   │   ┌───────────────────────────────────────────────┘
   │   │
   │   ▼
   │   ANY VERIFICATION FAILS?
   │   ├─ YES → escalate() immediately ❌ (no tmux created)
   │   └─ NO  → Continue ✓
   │
   ├─ ALL VERIFICATIONS PASSED ✓
   │
   ├─ Create tmux session "e2e-tests"
   ├─ Send environment variables to tmux
   ├─ Start: pnpm test:e2e 2>&1 | tee /tmp/e2e-output.log
   ├─ Write state:
   │   {
   │     "e2eRunning": true,
   │     "e2eTmuxSession": "e2e-tests",
   │     "e2eStartedAt": "2026-02-20T12:00:00Z"
   │   }
   └─ Exit (cron job completes in <10s) ✓


┌─────────────────────────────────────────────────────────────────┐
│ TICK 2: Monitor Running Tests (3 min later)                     │
└─────────────────────────────────────────────────────────────────┘
   │
   ├─ Read state: e2eRunning = true
   │
   ├─ Check: tmux has-session -t "e2e-tests" ?
   │
   ├─ ALIVE ✓
   │   │
   │   ├─ Calculate elapsed time: 180s
   │   ├─ Log: "Tests still running (180s elapsed)"
   │   ├─ Check if hung (>600s) → No
   │   └─ Exit (continue monitoring) ✓
   │
   └─ (Tests continue running in background...)


┌─────────────────────────────────────────────────────────────────┐
│ TICK 3: Monitor Running Tests (6 min later)                     │
└─────────────────────────────────────────────────────────────────┘
   │
   ├─ Read state: e2eRunning = true
   │
   ├─ Check: tmux has-session -t "e2e-tests" ?
   │
   ├─ ALIVE ✓
   │   │
   │   ├─ Calculate elapsed time: 360s
   │   ├─ Log: "Tests still running (360s elapsed)"
   │   ├─ Check if hung (>600s) → No
   │   └─ Exit (continue monitoring) ✓
   │
   └─ (Tests continue running in background...)


┌─────────────────────────────────────────────────────────────────┐
│ TICK 4: Tests Complete (9 min later)                            │
└─────────────────────────────────────────────────────────────────┘
   │
   ├─ Read state: e2eRunning = true
   │
   ├─ Check: tmux has-session -t "e2e-tests" ?
   │
   ├─ DEAD ✓ (tests completed)
   │
   ├─ Read output: cat /tmp/e2e-output.log
   ├─ Read exit code: cat /tmp/e2e-output.log.exit
   │
   ├─ Parse results:
   │   │
   │   ├─ exit_code == 0 ?
   │   │   └─ YES → Write state: step="DONE" ✓
   │   │
   │   ├─ IAP errors (403/Forbidden) ?
   │   │   └─ YES → escalate("IAP authentication failure") ❌
   │   │
   │   ├─ Timeouts detected ?
   │   │   └─ YES → Write state: step="E2E_TIMEOUT_RETRY" 🔄
   │   │
   │   └─ Regular failures ?
   │       └─ YES → Write state: step="E2E_FIXING" 🔧
   │
   └─ Exit ✓
```

---

## Key Points

### ✅ FAIL-FAST Verifications (BEFORE tmux)

All verification steps run **synchronously** before creating tmux session:

1. **Playwright config checks** (instant)
2. **Browserless checks** (curl, <1s)
3. **IAP detection + token** (gcloud commands, 2-3s)
4. **Package manager detection** (file check, instant)

**Total verification time:** ~5-10 seconds

**If any fails:**
- → `escalate()` immediately
- → **No tmux session created** (clean failure)
- → User gets actionable error message

**If all pass:**
- → Create tmux session
- → Start tests in background
- → Exit immediately

### ⏱️ Timing

| Event | When | Cron Duration | Test Duration |
|-------|------|---------------|---------------|
| Tick 1 | 0:00 | <10s | 0s → 540s |
| Tick 2 | 3:00 | <5s | 180s → 540s |
| Tick 3 | 6:00 | <5s | 360s → 540s |
| Tick 4 | 9:00 | <10s | Complete (540s) |

**Total pipeline time:** Same as before (tests take 9 min)  
**Cron blocking time:** <10s per tick (vs 540s in old version)  
**Improvement:** 98% reduction in cron blocking time

### 🔒 No Orphaned Sessions

**Old (synchronous):**
```
Verification fails mid-script → Script crashes → Cleanup code never runs
```

**New (fail-fast before tmux):**
```
Verification fails → escalate() immediately → No tmux created yet ✓
```

**Result:** Impossible to create orphaned tmux sessions from failed verifications.

### 🔁 Hung Test Detection

If tests run > 30 minutes (1800s):
```bash
if [[ $elapsed -gt 1800 ]]; then
    log "ERROR: Tests hung for 30+ minutes"
    tmux kill-session -t "$e2eTmuxSession"
    escalate "E2E tests hung - tmux session killed"
fi
```

Prevents indefinite zombie sessions.

---

## Comparison: Old vs New

### Old Flow (Synchronous)

```
Cron fires (0:00)
  ↓
Monitor runs
  ↓
e2e_running.sh starts
  ↓
Verifications (5s)
  ↓
Run tests (blocking, 540s) ⏸️  ← BLOCKS HERE
  ↓
Parse results (2s)
  ↓
Update state
  ↓
Cron completes (9:07 total) ⏰ SLOW
```

**Problems:**
- ❌ Cron blocks for 9+ minutes
- ❌ Risks timeout if tests > 5 min
- ❌ Can't monitor other states

### New Flow (Background)

```
Tick 1 (0:00):
  Cron → Verifications (5s) → Start tmux → Exit ✓ (7s total)
  
  Background: Tests running...

Tick 2 (3:00):
  Cron → Check tmux: ALIVE → Exit ✓ (3s total)
  
  Background: Tests running...

Tick 3 (6:00):
  Cron → Check tmux: ALIVE → Exit ✓ (3s total)
  
  Background: Tests running...

Tick 4 (9:00):
  Cron → Check tmux: DEAD → Parse results → Route ✓ (8s total)
```

**Benefits:**
- ✅ Cron never blocks (max 10s per tick)
- ✅ No timeout risk (tests can run indefinitely)
- ✅ Can monitor other states
- ✅ Resource efficient
