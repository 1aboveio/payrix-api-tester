# E2E Background Execution Proposal

## Problem

Currently, E2E test steps (`e2e_running.sh`, `e2e_timeout_retry.sh`, `e2e_verifying.sh`) run tests **synchronously** and block the cron job:

**Current flow:**
```
Cron fires → Monitor runs → e2e_running.sh executes
  → Runs tests (blocks for 2-5 minutes) →  Parses results → Updates state
  → Cron completes (after 2-5 min)
```

**Problems:**
1. **Blocks cron job** for entire test duration (2-5+ minutes)
2. **Risks timeout** if tests exceed 300s (cron payload timeout)
3. **Can't monitor** other state changes while tests run
4. **Wastes resources** keeping cron session alive while waiting

---

## Solution: Background Tmux Pattern

Use the same pattern as `coding-workflow` CODING/FIXING steps:

**New flow:**
```
Tick 1:
  Cron fires → e2e_running.sh
    → Launches tests in tmux
    → Writes state: e2eRunning=true, e2eTmuxSession="e2e-tests"
    → Exits immediately

Tick 2 (3 min later):
  Cron fires → e2e_running.sh
    → Checks tmux session: ALIVE
    → Logs elapsed time
    → Exits (continue monitoring)

Tick 3 (6 min later):
  Cron fires → e2e_running.sh
    → Checks tmux session: DEAD
    → Captures output
    → Parses results
    → Routes to next state (DONE/E2E_FIXING/E2E_TIMEOUT_RETRY)
```

**Benefits:**
1. **Non-blocking** — Cron job exits in <10s
2. **No timeout risk** — Tests can run as long as needed
3. **Continuous monitoring** — Can handle other state changes
4. **Resource efficient** — Cron session not kept alive

---

## Implementation

### State Schema Changes

Add three new fields to state:

```json
{
  "step": "E2E_RUNNING",
  "e2eRunning": true,              // NEW: Tests running in background
  "e2eTmuxSession": "e2e-tests",   // NEW: Tmux session name
  "e2eStartedAt": "2026-02-20T12:00:00Z",  // NEW: When tests started
  // ... existing fields
}
```

### Updated Step Logic

**e2e_running.sh:**

```bash
# Check if already running
if [[ "$e2eRunning" == "true" && -n "$e2eTmuxSession" ]]; then
    # BRANCH 1: Check status of running tests
    if tmux has-session -t "$e2eTmuxSession" 2>/dev/null; then
        # Still running - log elapsed time and exit
        log "Tests still running (${elapsed}s)"
        return 0
    else
        # Tests completed - capture output and parse results
        parse_results_and_route
    fi
else
    # BRANCH 2: First entry - start tests in background
    setup_environment
    tmux new-session -d -s "e2e-tests"
    tmux send-keys "cd $projectDir && $pm_cmd test:e2e 2>&1 | tee $TEST_OUTPUT; echo \$? > $TEST_OUTPUT.exit" Enter
    
    update_state e2eRunning=true e2eTmuxSession="e2e-tests" e2eStartedAt="$(now_iso)"
    log "Tests started in background - exiting"
    return 0
fi
```

**Apply same pattern to:**
- `e2e_timeout_retry.sh` (runs subset with 2x timeout)
- `e2e_verifying.sh` (runs previously failed tests)

---

## Monitoring & Recovery

### Hung Test Detection

```bash
# In monitor check (BRANCH 1)
local elapsed=$(elapsed_seconds "$e2eStartedAt")

if [[ $elapsed -gt 600 ]]; then  # 10 minutes
    log "⚠ Tests running for ${elapsed}s (>10 min) - may be hung"
fi

if [[ $elapsed -gt 1800 ]]; then  # 30 minutes
    log "ERROR: Tests hung for 30+ minutes - killing tmux session"
    tmux kill-session -t "$e2eTmuxSession"
    
    escalate "E2E tests hung for 30+ minutes

Tests failed to complete in reasonable time. Possible causes:
1. Infinite loop in test code
2. Network timeout (service unreachable)
3. Browserless container crashed

Tmux session killed. Review logs and retry."
fi
```

### Terminal State Cleanup

Update `done.sh`, `escalated.sh`, `failed.sh` to kill E2E tmux session:

```bash
# In terminal state scripts
local e2e_tmux_session=$(get_state_field "e2eTmuxSession")

if [[ -n "$e2e_tmux_session" && "$e2e_tmux_session" != "null" ]]; then
    log "Killing E2E tmux session: ${e2e_tmux_session}"
    tmux kill-session -t "$e2e_tmux_session" 2>/dev/null || true
fi
```

---

## Edge Cases

### 1. Gateway Restart During Tests

**Problem:** Tmux session persists, state file exists, but monitor may not resume.

**Solution:** Monitor checks tmux session on any E2E_RUNNING state:
- If `e2eRunning=false` but tmux session exists → orphaned session
- Kill orphaned session and re-run tests

### 2. Multiple Parallel E2E Steps

**Problem:** e2e_timeout_retry and e2e_verifying also run tests.

**Solution:** Use unique tmux session names:
- `e2e_running.sh` → tmux session `e2e-tests`
- `e2e_timeout_retry.sh` → tmux session `e2e-retry`
- `e2e_verifying.sh` → tmux session `e2e-verify`

State tracks which one is running:
```json
{
  "step": "E2E_TIMEOUT_RETRY",
  "e2eRunning": true,
  "e2eTmuxSession": "e2e-retry",  // Different session name
}
```

### 3. Test Output Capture

**Problem:** Tmux session ends before we can capture pane output.

**Solution:** Write output to file during test run:
```bash
# In tmux:
$pm_cmd test:e2e 2>&1 | tee $TEST_OUTPUT
echo $? > $TEST_OUTPUT.exit  # Capture exit code
```

Then read from file when tmux session is DEAD.

---

## Testing Plan

### Phase 1: Implement e2e_running.sh
1. Refactor script to use tmux pattern
2. Test with short E2E run (passes quickly)
3. Test with long E2E run (2+ minutes)
4. Test with failures (parsing works correctly)
5. Test with timeout (session detection works)

### Phase 2: Implement e2e_timeout_retry.sh and e2e_verifying.sh
1. Apply same pattern with unique tmux session names
2. Test retry flow
3. Test verify flow

### Phase 3: Terminal State Cleanup
1. Update done.sh, escalated.sh, failed.sh
2. Test cleanup on success
3. Test cleanup on failure
4. Test cleanup on escalation

### Phase 4: Hung Test Detection
1. Add elapsed time checks
2. Test 30-minute timeout
3. Test escalation message

---

## Migration

**Backwards Compatibility:**
- If `e2eRunning` field doesn't exist → treat as first entry (BRANCH 2)
- Old state files work without modification

**Rollback:**
- Keep old synchronous version as `e2e_running_sync.sh`
- Easy to switch back if needed

---

## Files to Update

1. **Scripts:**
   - `skills/cicd-pipeline/scripts/steps/e2e_running.sh` (refactor)
   - `skills/cicd-pipeline/scripts/steps/e2e_timeout_retry.sh` (refactor)
   - `skills/cicd-pipeline/scripts/steps/e2e_verifying.sh` (refactor)
   - `skills/cicd-pipeline/scripts/steps/done.sh` (add E2E tmux cleanup)
   - `skills/cicd-pipeline/scripts/steps/escalated.sh` (add E2E tmux cleanup)
   - `skills/cicd-pipeline/scripts/steps/failed.sh` (add E2E tmux cleanup)

2. **Documentation:**
   - `skills/cicd-pipeline/references/step-patterns.md` (update E2E steps)
   - `skills/cicd-pipeline/SKILL.md` (update state schema)

---

## Risk Assessment

**Low Risk:**
- Pattern already proven in coding-workflow
- Easy to test incrementally
- Clean rollback path

**Medium Risk:**
- Output capture timing (mitigated by writing to file)
- Tmux session lifecycle (mitigated by explicit cleanup)

**High Risk:**
- None identified

---

## Recommendation

**Proceed with implementation:**
1. Start with `e2e_running.sh` only
2. Test thoroughly with cover-gen
3. If successful, apply to e2e_timeout_retry.sh and e2e_verifying.sh
4. Update terminal state cleanup
5. Add hung test detection

**Estimated effort:** 2-3 hours (implementation + testing)

**Expected improvement:** 
- Cron execution time: 2-5 min → <10s (98% faster)
- No timeout risk
- Better monitoring capability
