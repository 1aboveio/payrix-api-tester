# E2E Scripts Tmux Refactor Summary

## Goal
Refactor all E2E step scripts to use background tmux sessions for non-blocking execution, preventing cron timeout issues when tests take longer than the cron's MAX_DURATION (120s).

## Problem
- E2E tests can take 2+ minutes (cover-gen has 33 tests)
- Cron monitor has 120s MAX_DURATION limit
- Blocking execution would cause cron timeout before tests complete
- Need non-blocking pattern to allow tests to run as long as needed

## Solution: Two-Branch Tmux Pattern
All E2E scripts now use a consistent two-branch pattern:

### Branch 1: First Entry (e2eRunning=false)
1. **Fail-fast verifications** (E2E_RUNNING only):
   - Playwright config exists
   - Browserless configured
   - test:e2e script exists
   - Browserless container running
   - IAP token generation and verification (if IAP enabled)

2. **Launch tests in background**:
   - Clean up old tmux session
   - Build single command string with all env vars
   - Launch via `tmux new-session -d -s "$TMUX_SESSION" "$full_cmd"`
   - Capture both stdout and exit code to files

3. **Update state**:
   - Set `.e2eRunning = true`
   - Set descriptive `.lastAction`
   - Exit quickly (~10s)

### Branch 2: Subsequent Checks (e2eRunning=true)
1. **Check tmux session status**:
   - If alive → log status, exit (wait for next tick)
   - If dead → tests complete, parse results

2. **Parse results**:
   - Read exit code from `.exit` file
   - Parse test output for failures/timeouts
   - Route to appropriate next state

3. **Update state**:
   - Clear `.e2eRunning = false`
   - Advance to next step or terminal state

## Refactored Scripts

### 1. e2e_running.sh
**Purpose**: Run full E2E test suite  
**Session name**: `e2e-tests`  
**Output**: `/tmp/e2e-output.log`

**First entry**:
- 4-step verification (config, Browserless, script, container)
- IAP detection + token generation
- Package manager detection (npm/pnpm/yarn)
- Launch full suite: `$pm_cmd test:e2e`

**Status check**:
- Parse exit code
- Check for IAP failures (403/Forbidden) → escalate
- Route to: DONE (pass) | E2E_TIMEOUT_RETRY (timeouts) | E2E_FIXING (failures)

### 2. e2e_verifying.sh
**Purpose**: Re-run previously failed tests after fixes  
**Session name**: `e2e-verify`  
**Output**: `/tmp/e2e-verify.log`

**First entry**:
- Build test filter from `state.failedTestIds`
- IAP detection + token generation
- Launch filtered suite: `$pm_cmd test:e2e --grep "$test_filter"`

**Status check**:
- Parse exit code
- If all pass → advance to E2E_RUNNING (full suite to catch regressions)
- If timeouts → route to E2E_TIMEOUT_RETRY
- If still failing → increment fixAttempts, check max (3), route back to E2E_FIXING or ESCALATED

### 3. e2e_timeout_retry.sh
**Purpose**: Retry timed-out tests with 2x timeout  
**Session name**: `e2e-timeout-retry`  
**Output**: `/tmp/e2e-timeout-retry.log`

**First entry**:
- Increment `timeoutRetries` counter
- Build test filter from `state.timedOutTestIds`
- IAP detection + token generation
- Launch with 2x timeout: `$pm_cmd test:e2e --grep "$test_filter" --timeout=60000`

**Status check**:
- Parse exit code
- If all pass → advance to E2E_RUNNING (full suite)
- If still timing out → check max retries (2), stay in E2E_TIMEOUT_RETRY or ESCALATED
- If failing (not timeout) → timeout was symptom of bug, route to E2E_FIXING

## Consistency Improvements

### State Tracking
All scripts use single flag: `.e2eRunning = true|false`
- No separate session name tracking (hardcoded per script)
- Simpler state management

### Command Building Pattern
All scripts use consistent pattern:
```bash
local full_cmd="cd $project_dir && "
full_cmd+="export PLAYWRIGHT_BROWSER_WS_ENDPOINT='$BROWSERLESS_URL' && "
full_cmd+="export PLAYWRIGHT_BASE_URL='$service_url' && "
if [[ "$iap_enabled" == "true" ]]; then
    full_cmd+="export IAP_ID_TOKEN='$iap_token' && "
fi
full_cmd+="$test_cmd 2>&1 | tee $TEST_OUTPUT; echo \$? > ${TEST_OUTPUT}.exit"
```

### Exit Code Capture
All scripts capture exit code to `.exit` file:
```bash
$test_cmd 2>&1 | tee $TEST_OUTPUT; echo $? > ${TEST_OUTPUT}.exit
```

Then read it:
```bash
local exit_code=1
if [[ -f "${TEST_OUTPUT}.exit" ]]; then
    exit_code=$(cat "${TEST_OUTPUT}.exit")
fi
```

### Cleanup Pattern
All scripts clean up before launching:
```bash
if tmux has-session -t "$TMUX_SESSION" 2>/dev/null; then
    tmux kill-session -t "$TMUX_SESSION"
fi
rm -f "$TEST_OUTPUT" "${TEST_OUTPUT}.exit"
```

## Benefits

### Performance
- **Cron execution**: ~5-10s per tick (just status check)
- **Test execution**: Unlimited (runs in background until complete)
- **No timeout risk**: Tests can take hours if needed

### Reliability
- **Fail-fast**: Verifications run before tmux creation
- **No orphaned sessions**: Clean up old sessions before launch
- **Atomic state updates**: Clear flags immediately when tests complete

### Observability
- **Tmux session names**: Easy to identify (`e2e-tests`, `e2e-verify`, `e2e-timeout-retry`)
- **Log files**: Persistent output for debugging
- **Exit codes**: Captured for accurate routing

### Maintainability
- **Consistent pattern**: Same two-branch flow across all scripts
- **Shared helpers**: IAP, Browserless, package manager detection in common.sh
- **Clear separation**: Verification logic vs execution logic

## Testing Plan

1. **Dry run all three scripts**:
   ```bash
   cd ~/.openclaw/shared/office-openclaw/skills/cicd-pipeline/scripts/steps
   chmod +x e2e_running.sh e2e_verifying.sh e2e_timeout_retry.sh
   ```

2. **Test with cover-gen**:
   - Start pipeline with `cicd-pipeline:start-from E2E_RUNNING`
   - Monitor cron execution times (should be <10s)
   - Verify tests run to completion in tmux
   - Check state routing for pass/fail/timeout scenarios

3. **Verify cleanup**:
   - Check no orphaned tmux sessions after completion
   - Verify state files cleaned up on terminal states
   - Check archive directory populated correctly

4. **Test failure scenarios**:
   - Introduce test failure → verify E2E_FIXING routing
   - Introduce timeout → verify E2E_TIMEOUT_RETRY routing
   - Max retries → verify ESCALATED routing

## Deployment

```bash
# Backup current scripts
cd ~/.openclaw/shared/office-openclaw/skills/cicd-pipeline/scripts/steps
cp e2e_running.sh e2e_running.sh.backup
cp e2e_verifying.sh e2e_verifying.sh.backup
cp e2e_timeout_retry.sh e2e_timeout_retry.sh.backup

# Copy refactored versions
cp /tmp/e2e_running_refactored.sh e2e_running.sh
cp /tmp/e2e_verifying_refactored.sh e2e_verifying.sh
cp /tmp/e2e_timeout_retry_refactored.sh e2e_timeout_retry.sh

# Make executable
chmod +x e2e_running.sh e2e_verifying.sh e2e_timeout_retry.sh

# Test dry run
./e2e_running.sh  # Should show two-branch logic
```

## Next Steps

1. Deploy refactored scripts
2. Test with cover-gen end-to-end
3. Update step-patterns.md with tmux pattern documentation
4. Consider applying same pattern to coding-workflow (TESTING step if tests take >120s)
5. Monitor production usage for any edge cases

## Related Files

- `/tmp/e2e_running_refactored.sh` (11.7KB)
- `/tmp/e2e_verifying_refactored.sh` (9.9KB)
- `/tmp/e2e_timeout_retry_refactored.sh` (11.2KB)
- Original scripts backed up with `.backup` suffix
- Common helpers in `../common.sh`
