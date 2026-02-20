# Tmux Progress Monitoring - Implementation Complete

**Date**: 2026-02-20  
**Commit**: `5b84009` - "Add tmux progress monitoring and hung test detection"  
**Status**: Implemented and deployed

## Overview

Added live progress tracking for E2E tests running in background tmux sessions. Now we capture and parse test progress on every cron tick, providing visibility into long-running test execution.

## Implementation

### 1. New Functions in common.sh

**parse_e2e_progress()**
```bash
# Usage: parse_e2e_progress "tmux-session-name"
# Returns: current total passed failed test_name (space-separated)
```

What it does:
- Captures last 50 lines from tmux pane
- Parses Playwright progress: `[15/33] test-name`
- Counts pass/fail indicators: `✓` and `✘`
- Extracts current test name
- Returns 5 values: current, total, passed, failed, test_name

**check_hung_test()**
```bash
# Usage: check_hung_test "last_progress_at_iso" threshold_seconds
# Returns: 0 if hung, 1 if ok
```

What it does:
- Checks elapsed time since last progress
- Default threshold: 600 seconds (10 minutes)
- Returns 0 if hung (exceeds threshold)
- Handles null/empty timestamps gracefully

### 2. Enhanced e2e_running.sh

**Status check branch (e2eRunning=true)**

Before:
```bash
if tmux has-session -t "$TMUX_SESSION" 2>/dev/null; then
    log "Tmux session still alive - tests running"
    return 0
fi
```

After:
```bash
if tmux has-session -t "$TMUX_SESSION" 2>/dev/null; then
    log "Tmux session still alive"
    
    # Parse progress from tmux
    read -r current total passed failed test_name < <(parse_e2e_progress "$TMUX_SESSION")
    
    if [[ $current -gt 0 && $total -gt 0 ]]; then
        log "Progress: ${current}/${total} tests (${passed} passed, ${failed} failed)"
        log "Current: ${test_name}"
        
        # Update state with progress
        update_state_raw ".lastProgress = \"${current}/${total}\" | ..."
    else
        log "Tests initializing (no progress yet)"
    fi
    
    # Check for hung tests
    if check_hung_test "$last_progress_at" 600; then
        log "⚠ WARNING: Tests may be hung (no progress for ${elapsed}s)"
    fi
    
    return 0
fi
```

**Launch tests branch (e2eRunning=false)**

Initialize progress fields:
```bash
update_state_raw \
    ".e2eRunning = true | \
     .lastProgress = null | \
     .lastProgressAt = \"$(now_iso)\" | \
     .lastTestName = null | \
     .testsPassedSoFar = 0 | \
     .testsFailedSoFar = 0 | \
     .updatedAt = \"$(now_iso)\""
```

**Tests complete**

Clear progress fields:
```bash
update_state_raw \
    ".e2eRunning = false | \
     .lastProgress = null | \
     .lastProgressAt = null | \
     .lastTestName = null | \
     .testsPassedSoFar = 0 | \
     .testsFailedSoFar = 0 | \
     .updatedAt = \"$(now_iso)\""
```

## New State Fields

Added to `cicd-pipeline-state.json`:

```json
{
  "lastProgress": "15/33",
  "lastProgressAt": "2026-02-20T12:34:56Z",
  "lastTestName": "cover-gen.spec.ts > generates cover",
  "testsPassedSoFar": 12,
  "testsFailedSoFar": 3
}
```

## Benefits

### 1. User Visibility

**Before**:
```
E2E_RUNNING: tests running
E2E_RUNNING: tests running  
E2E_RUNNING: tests running
```

**After**:
```
E2E_RUNNING: 5/33 tests (5 passed) - auth.spec.ts > login
E2E_RUNNING: 15/33 tests (13 passed, 2 failed) - payment.spec.ts
E2E_RUNNING: 28/33 tests (25 passed, 3 failed) - cover-gen.spec.ts
```

### 2. Hung Test Detection

Automatically detects when tests make no progress for 10+ minutes:

```
⚠ WARNING: Tests may be hung (no progress for 612s)
Last known progress: 15/33
Last test: slow-api.spec.ts > payment flow
```

**Note**: Warns only, doesn't auto-escalate (tests might just be slow)

### 3. Early Failure Detection

See failures accumulating before completion:
- "15/33 tests (13 passed, 2 failed)" → know early something is wrong
- Can decide whether to wait or intervene

### 4. Better Debugging

Know exactly where tests are when checking status:
- Which test is currently running
- How far through the suite
- How many have failed so far

## Parsing Details

### Playwright Output Patterns

```
Running 33 tests using 5 workers

  [1/33] auth.spec.ts:5:5 › login flow
  ✓ [1/33] auth.spec.ts:5:5 › login flow (2.3s)
  
  [2/33] auth.spec.ts:12:5 › logout flow
  ✓ [2/33] auth.spec.ts:12:5 › logout flow (1.1s)
  
  [3/33] payment.spec.ts:8:5 › checkout
  ✘ [3/33] payment.spec.ts:8:5 › checkout (5.2s)
```

### Regex Patterns

- Current/Total: `\[\K\d+(?=/\d+\])` and `\[\d+/\K\d+(?=\])`
- Passed: Count of `✓`
- Failed: Count of `✘`
- Test name: `\[\d+/\d+\] \K.*`

### Edge Cases Handled

1. **No progress yet**: Returns "0 0 0 0" if parsing fails
2. **Session dead**: Returns early if tmux session not found
3. **Tests initializing**: Detects when no `[N/N]` pattern yet
4. **Null timestamps**: check_hung_test handles null gracefully

## Configuration

### Hung Test Threshold

Default: 600 seconds (10 minutes)

Can be changed by modifying the call:
```bash
check_hung_test "$last_progress_at" 300  # 5 minutes
```

### Tmux Capture Lines

Default: 50 lines

Can be changed in parse_e2e_progress:
```bash
tmux capture-pane -t "$session" -p -S -100  # Last 100 lines
```

## Limitations

1. **Playwright-specific**: Parsing assumes Playwright output format
2. **Terminal output only**: No JSON reporter integration (yet)
3. **Last test only**: Captures only the most recent test name
4. **Warn only**: Hung test detection warns but doesn't auto-escalate

## Future Enhancements

### Short-term (if needed)
1. Add to E2E_VERIFYING and E2E_TIMEOUT_RETRY scripts
2. Make hung threshold configurable via state
3. Add auto-escalation option for hung tests

### Long-term (nice-to-have)
1. JSON reporter integration for more accurate parsing
2. Track test duration per test
3. Detect specific test patterns (e.g., all login tests failing)
4. Graph progress over time

## Testing Checklist

When testing with cover-gen:

- [ ] Monitor logs show progress updates: "15/33 tests"
- [ ] State file contains progress fields
- [ ] Progress updates on each cron tick (~3 min intervals)
- [ ] Test names captured correctly
- [ ] Hung test warning appears if appropriate
- [ ] Progress fields cleared when tests complete
- [ ] No errors in monitor log
- [ ] Tmux capture doesn't interfere with test execution

## Example Monitor Log Output

```
[2026-02-20T12:30:00] E2E_RUNNING step started
[2026-02-20T12:30:00] E2E tests already running - checking status...
[2026-02-20T12:30:00] Tmux session 'e2e-tests' still alive
[2026-02-20T12:30:00] Progress: 8/33 tests (8 passed, 0 failed)
[2026-02-20T12:30:00] Current: auth.spec.ts:12:5 › logout flow
[2026-02-20T12:30:00] Will check again on next cron tick

[2026-02-20T12:33:00] E2E_RUNNING step started
[2026-02-20T12:33:00] E2E tests already running - checking status...
[2026-02-20T12:33:00] Tmux session 'e2e-tests' still alive
[2026-02-20T12:33:00] Progress: 18/33 tests (16 passed, 2 failed)
[2026-02-20T12:33:00] Current: payment.spec.ts:25:5 › refund flow
[2026-02-20T12:33:00] Will check again on next cron tick

[2026-02-20T12:36:00] E2E_RUNNING step started
[2026-02-20T12:36:00] E2E tests already running - checking status...
[2026-02-20T12:36:00] Tmux session 'e2e-tests' dead - tests complete
[2026-02-20T12:36:00] Test exit code: 1
[2026-02-20T12:36:00] Tests failed - parsing output
[2026-02-20T12:36:00] Failed tests: 2
[2026-02-20T12:36:00] Test failures detected - routing to E2E_FIXING
```

## Commit Details

**Commit**: `5b84009`  
**Files**: 2 changed (+110, -4 lines)
- `skills/cicd-pipeline/scripts/common.sh` (+51 lines)
- `skills/cicd-pipeline/scripts/steps/e2e_running.sh` (+59, -4 lines)

**Branch**: main (pushed)

---

**Status**: ✅ Implemented and deployed  
**Next**: Test with cover-gen pipeline execution  
**Scope**: E2E_RUNNING only (can extend to VERIFYING/TIMEOUT_RETRY later)
