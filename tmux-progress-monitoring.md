# Tmux Progress Monitoring Enhancement

## Problem

Currently, when E2E tests run in background tmux:
- ❌ We only check if session is alive/dead
- ❌ No visibility into test progress during execution
- ❌ User sees "tests running" for 2+ minutes with no updates
- ❌ Can't detect hung tests (session alive but no progress)

## Solution: Capture and Parse Tmux Output

On each cron tick, capture the last N lines from tmux and parse for progress indicators.

### Implementation Pattern

```bash
# Branch 2 - Status check (e2eRunning=true)
if [[ "${e2eRunning:-false}" == "true" ]]; then
    log "E2E tests running - checking progress..."
    
    # Check if tmux session is still alive
    if tmux has-session -t "$TMUX_SESSION" 2>/dev/null; then
        log "Tmux session '${TMUX_SESSION}' still alive"
        
        # Capture last 50 lines from tmux pane
        TMUX_OUTPUT=$(tmux capture-pane -t "$TMUX_SESSION" -p | tail -50)
        
        # Parse Playwright progress
        # Example output: "Running 15 tests using 5 workers"
        #                 "[15/33] cover-gen.spec.ts > generates cover"
        
        # Extract current test number
        CURRENT_TEST=$(echo "$TMUX_OUTPUT" | grep -oP '\[\K\d+(?=/\d+\])' | tail -1)
        TOTAL_TESTS=$(echo "$TMUX_OUTPUT" | grep -oP '\[\d+/\K\d+(?=\])' | tail -1)
        
        # Extract test name
        CURRENT_TEST_NAME=$(echo "$TMUX_OUTPUT" | grep -oP '\[\d+/\d+\] \K.*' | tail -1)
        
        # Count pass/fail indicators
        PASSED=$(echo "$TMUX_OUTPUT" | grep -c "✓" || echo 0)
        FAILED=$(echo "$TMUX_OUTPUT" | grep -c "✘" || echo 0)
        
        if [[ -n "$CURRENT_TEST" && -n "$TOTAL_TESTS" ]]; then
            log "Progress: ${CURRENT_TEST}/${TOTAL_TESTS} tests"
            log "Current: ${CURRENT_TEST_NAME}"
            log "Passed: ${PASSED}, Failed: ${FAILED}"
            
            # Update state with progress
            update_state_raw \
                ".lastProgress = \"${CURRENT_TEST}/${TOTAL_TESTS}\" | \
                 .lastProgressAt = \"$(now_iso)\" | \
                 .lastTestName = \"${CURRENT_TEST_NAME}\" | \
                 .testsPassedSoFar = ${PASSED} | \
                 .testsFailedSoFar = ${FAILED} | \
                 .updatedAt = \"$(now_iso)\""
        else
            # No progress detected yet (tests starting up)
            log "Tests initializing..."
            update_state_raw ".lastAction = \"E2E_RUNNING: tests initializing\" | .updatedAt = \"$(now_iso)\""
        fi
        
        # Detect hung tests (no progress for 5+ minutes)
        LAST_PROGRESS_AT=$(get_state_field "lastProgressAt")
        if [[ -n "$LAST_PROGRESS_AT" ]]; then
            ELAPSED=$(elapsed_seconds "$LAST_PROGRESS_AT")
            if [[ $ELAPSED -gt 300 ]]; then
                log "⚠ No progress for ${ELAPSED}s - tests may be hung"
                # Could escalate or kill session here
            fi
        fi
        
        return 0  # Wait for next tick
    fi
    
    # Session dead - parse final results...
fi
```

### Example Playwright Output Parsing

Playwright test output looks like:

```
Running 33 tests using 5 workers

  [1/33] auth.spec.ts:5:5 › login flow
  ✓ [1/33] auth.spec.ts:5:5 › login flow (2.3s)
  
  [2/33] auth.spec.ts:12:5 › logout flow
  ✓ [2/33] auth.spec.ts:12:5 › logout flow (1.1s)
  
  [3/33] payment.spec.ts:8:5 › checkout
  ✘ [3/33] payment.spec.ts:8:5 › checkout (5.2s)
    Error: Expected "Success" but got "Error"
```

Parse patterns:
- `Running (\d+) tests` → total count
- `\[(\d+)/(\d+)\]` → current/total
- `✓` → passed test
- `✘` → failed test
- `\[(\d+)/\d+\] (.*)` → test name

### State Fields

Add to state:

```json
{
  "lastProgress": "15/33",
  "lastProgressAt": "2026-02-20T12:34:56Z",
  "lastTestName": "cover-gen.spec.ts > generates cover",
  "testsPassedSoFar": 12,
  "testsFailedSoFar": 3,
  "e2eRunning": true
}
```

### Benefits

1. **User visibility**: "Tests at 20/33, 3 failures so far"
2. **Hung test detection**: No progress for 5 minutes → alert or kill
3. **Better logs**: Monitor log shows actual progress, not just "running"
4. **Early failure detection**: See failures accumulating before completion
5. **Debugging**: Can see which test is currently running when checking status

### Enhanced Status Updates

With progress tracking, status updates become much more informative:

**Before**:
```
E2E_RUNNING: tests running (waiting for completion)
E2E_RUNNING: tests running (waiting for completion)
E2E_RUNNING: tests running (waiting for completion)
```

**After**:
```
E2E_RUNNING: 5/33 tests - auth.spec.ts > login (2 passed)
E2E_RUNNING: 12/33 tests - payment.spec.ts > checkout (10 passed, 2 failed)
E2E_RUNNING: 20/33 tests - cover-gen.spec.ts > generates (18 passed, 2 failed)
```

### Hung Test Detection

```bash
# If lastProgressAt is more than 5 minutes old
if [[ $ELAPSED -gt 300 ]]; then
    log "⚠ Tests hung - no progress for ${ELAPSED}s"
    
    # Option 1: Kill session and escalate
    tmux kill-session -t "$TMUX_SESSION"
    update_state_raw \
        ".step = \"ESCALATED\" | \
         .error = \"Tests hung - no progress for ${ELAPSED}s. Last test: ${CURRENT_TEST_NAME}\" | \
         .escalationReason = \"Infrastructure issue: tests hung\" | \
         .updatedAt = \"$(now_iso)\""
    
    # Option 2: Just warn (let session continue)
    update_state_raw \
        ".lastAction = \"⚠ WARNING: No progress for ${ELAPSED}s\" | \
         .updatedAt = \"$(now_iso)\""
fi
```

### Integration Points

Update all E2E execution scripts:
1. **e2e_running.sh** - Full suite progress
2. **e2e_verifying.sh** - Verification test progress
3. **e2e_timeout_retry.sh** - Retry test progress

### Implementation Steps

1. Add progress parsing function to `common.sh`
2. Update E2E scripts to capture and parse tmux output
3. Add state fields for progress tracking
4. Update monitor log format to show progress
5. Optional: Add hung test detection with configurable threshold

### Alternative: JSON Reporter

Instead of parsing terminal output, use Playwright's JSON reporter:

```typescript
// playwright.config.ts
export default {
  reporter: [
    ['json', { outputFile: '/tmp/e2e-progress.json' }],
    ['list']  // Still show terminal output
  ]
}
```

Then parse JSON on each tick:

```bash
if [[ -f /tmp/e2e-progress.json ]]; then
    TOTAL=$(jq '.stats.expected' /tmp/e2e-progress.json)
    PASSED=$(jq '.stats.ok' /tmp/e2e-progress.json)
    FAILED=$(jq '.stats.unexpected' /tmp/e2e-progress.json)
    
    log "Progress: ${PASSED} passed, ${FAILED} failed out of ${TOTAL} tests"
fi
```

**Pros**: More reliable parsing, structured data  
**Cons**: JSON file only written at end (not during execution)

### Recommendation

**Hybrid approach**:
1. Use `tmux capture-pane` for live progress (during execution)
2. Use JSON reporter for final accurate counts (after completion)
3. Add hung test detection (no progress for 5+ minutes)
4. Update state with progress on each tick

This gives the best user experience:
- Live progress updates during execution
- Accurate final counts from JSON
- Early detection of hung tests

## Example Implementation

```bash
# In e2e_running.sh, status check branch:

if tmux has-session -t "$TMUX_SESSION" 2>/dev/null; then
    # Capture and parse progress
    TMUX_OUTPUT=$(tmux capture-pane -t "$TMUX_SESSION" -p -S -50)
    
    # Parse current test number
    if CURRENT=$(echo "$TMUX_OUTPUT" | grep -oP '\[\K\d+(?=/\d+\])' | tail -1) && \
       TOTAL=$(echo "$TMUX_OUTPUT" | grep -oP '\[\d+/\K\d+(?=\])' | tail -1); then
        
        PASSED=$(echo "$TMUX_OUTPUT" | grep -c "✓" || echo 0)
        FAILED=$(echo "$TMUX_OUTPUT" | grep -c "✘" || echo 0)
        
        log "Progress: ${CURRENT}/${TOTAL} (${PASSED} passed, ${FAILED} failed)"
        
        update_state_raw \
            ".lastProgress = \"${CURRENT}/${TOTAL}\" | \
             .testsPassedSoFar = ${PASSED} | \
             .testsFailedSoFar = ${FAILED} | \
             .lastProgressAt = \"$(now_iso)\" | \
             .updatedAt = \"$(now_iso)\""
    fi
    
    return 0
fi
```

## Discussion

**Questions**:
1. Should we add this to all E2E scripts or just E2E_RUNNING?
2. What's the hung test timeout threshold? (5 min? 10 min?)
3. Should we escalate on hung tests or just warn?
4. Do we want JSON reporter in addition to terminal parsing?

**My recommendation**:
- Add to all E2E scripts (RUNNING, VERIFYING, TIMEOUT_RETRY)
- Hung threshold: 10 minutes (generous for slow tests)
- Warn only (don't auto-escalate, tests might just be slow)
- Terminal parsing only for now (simpler, works during execution)
