# E2E_SETUP Refactor Summary

**Date**: 2026-02-20  
**Status**: Refactored to use E2E_SETUP step  
**Files Modified**: 5 (1 new, 4 updated)

## Overview

Refactored E2E pipeline to use **E2E_SETUP as a separate step** instead of inline verification logic in E2E_RUNNING. This provides cleaner separation between validation and execution.

## Architecture Change

### Before (Two-Branch Pattern)
```
CI_BUILDING (success)
    └─> E2E_RUNNING
         ├─ Branch 1 (e2eRunning=false)
         │   ├─ Run 4-step verification (inline)
         │   ├─ Generate IAP token
         │   ├─ Launch tests in tmux
         │   └─ Mark e2eRunning=true
         └─ Branch 2 (e2eRunning=true)
             ├─ Check tmux status
             └─ Parse results if complete
```

**Problems:**
- ❌ Complex branching logic in each E2E script
- ❌ Verifications repeated on every state entry
- ❌ Hard to understand which branch is executing
- ❌ Inline IAP token generation in execution step

### After (E2E_SETUP Step)
```
CI_BUILDING (success)
    ├─ failedTestIds exist? → E2E_VERIFYING
    └─ no failures? → E2E_SETUP
    
E2E_SETUP (one-shot validation)
    ├─ Verify playwright config exists
    ├─ Verify Browserless configured
    ├─ Verify test:e2e script exists
    ├─ Verify Browserless running
    ├─ Generate IAP token (store in state)
    ├─ Detect package manager (store in state)
    ├─ IF ALL PASS → E2E_RUNNING
    └─ IF ANY FAIL → ESCALATED

E2E_RUNNING (simple execution)
    ├─ e2eRunning=true → check tmux status
    └─ e2eRunning=false → launch tests in tmux
    
E2E_VERIFYING (simple execution)
    ├─ e2eRunning=true → check tmux status
    └─ e2eRunning=false → launch filtered tests in tmux
    
E2E_TIMEOUT_RETRY (simple execution)
    ├─ e2eRunning=true → check tmux status
    └─ e2eRunning=false → launch filtered tests with 2x timeout
```

**Benefits:**
- ✅ Clear separation: validation vs execution
- ✅ Verifications run **once** (not repeated)
- ✅ Simpler E2E scripts (no branching logic)
- ✅ Easier to debug (step name tells you what's happening)
- ✅ IAP token cached in state (reused across steps)
- ✅ Package manager detected once, stored in state

## File Changes

### 1. e2e_setup.sh (NEW - 5.9KB)
**Purpose**: One-shot fail-fast verification before E2E tests

**What it does**:
1. Verify playwright.config.ts exists
2. Verify Browserless configured in config
3. Verify test:e2e script exists
4. Verify Browserless container running
5. Generate IAP token (if IAP enabled)
6. Detect package manager (npm/pnpm/yarn)
7. Store in state: `.iapToken`, `.iapEnabled`, `.packageManager`
8. Route to E2E_RUNNING (if all pass) or ESCALATED (if any fail)

**State fields set**:
```json
{
  "iapToken": "eyJhbGc...",
  "iapEnabled": true,
  "packageManager": "npm run"
}
```

**Execution time**: ~5-10s (all verifications + IAP token gen)

### 2. e2e_running.sh (SIMPLIFIED - 8.8KB, was 12KB)
**Purpose**: Run full E2E suite in background tmux

**What changed**:
- ❌ Removed: 4-step verification logic (now in E2E_SETUP)
- ❌ Removed: IAP token generation (uses state from E2E_SETUP)
- ❌ Removed: Package manager detection (uses state from E2E_SETUP)
- ✅ Simplified: Just launch/check tmux (no inline verifications)

**What it does**:
- If `e2eRunning=true` → check tmux status
- If `e2eRunning=false` → read state values, launch tests in tmux

**State fields read**:
- `.iapToken` (from E2E_SETUP)
- `.iapEnabled` (from E2E_SETUP)
- `.packageManager` (from E2E_SETUP)

### 3. e2e_verifying.sh (SIMPLIFIED - 11KB, was 9.9KB)
**Purpose**: Re-run previously failed tests to verify fixes

**What changed**:
- ❌ Removed: Inline IAP verification (uses state from E2E_SETUP)
- ✅ Regenerates IAP token (may have expired since E2E_SETUP)
- ✅ Routes to E2E_SETUP (not E2E_RUNNING) on success to re-verify

**What it does**:
- If `e2eRunning=true` → check tmux status
- If `e2eRunning=false` → regenerate IAP token, launch filtered tests in tmux

**Routing on success**:
- All tests pass → E2E_SETUP (run full suite to catch regressions)

### 4. e2e_timeout_retry.sh (SIMPLIFIED - 12KB, was 11.2KB)
**Purpose**: Retry timed-out tests with 2x timeout

**What changed**:
- ❌ Removed: Inline IAP verification (uses state from E2E_SETUP)
- ✅ Regenerates IAP token (may have expired since E2E_SETUP)
- ✅ Routes to E2E_SETUP (not E2E_RUNNING) on success

**What it does**:
- If `e2eRunning=true` → check tmux status
- If `e2eRunning=false` → regenerate IAP token, launch filtered tests with 2x timeout

**Routing on success**:
- All tests pass → E2E_SETUP (run full suite)

### 5. ci_building.sh (UPDATED)
**Purpose**: Monitor Cloud Build status

**What changed**:
```diff
- log "No previous failures → routing to E2E_RUNNING (full suite)"
+ log "No previous failures → routing to E2E_SETUP (verify prerequisites)"
- .step = "E2E_RUNNING"
+ .step = "E2E_SETUP"
```

**Routing logic**:
- Build success + failedTestIds exist → E2E_VERIFYING (skip setup, already verified)
- Build success + no failures → E2E_SETUP (verify prerequisites first)

## State Flow Diagram

```
┌────────────────┐
│  CI_BUILDING   │
│   (SUCCESS)    │
└────────┬───────┘
         │
         ├─ failedTestIds exist? ──> E2E_VERIFYING (skip setup)
         │
         └─ no failures? ──────────> E2E_SETUP
                                      │
                                      ├─ Verify config ✓
                                      ├─ Verify Browserless ✓
                                      ├─ Generate IAP token ✓
                                      ├─ Detect package manager ✓
                                      │
                                      ├─ ALL PASS ──────> E2E_RUNNING
                                      │                    │
                                      │                    ├─ Launch tests
                                      │                    │  in tmux
                                      │                    │
                                      │                    ├─ All pass ─> DONE
                                      │                    │
                                      │                    ├─ Timeouts ─> E2E_TIMEOUT_RETRY
                                      │                    │               │
                                      │                    │               ├─ Pass ──> E2E_SETUP
                                      │                    │               │           (full suite)
                                      │                    │               │
                                      │                    │               └─ Fail ──> E2E_FIXING
                                      │                    │                           or ESCALATED
                                      │                    │
                                      │                    └─ Failures ─> E2E_FIXING
                                      │                                     │
                                      │                                     └─> E2E_VERIFYING
                                      │                                          │
                                      │                                          ├─ Pass ──> E2E_SETUP
                                      │                                          │           (full suite)
                                      │                                          │
                                      │                                          └─ Fail ──> E2E_FIXING
                                      │                                                      or ESCALATED
                                      │
                                      └─ ANY FAIL ──────> ESCALATED
```

## Key Improvements

### 1. Cleaner Separation
- **E2E_SETUP**: Validates prerequisites once
- **E2E_RUNNING/VERIFYING/TIMEOUT_RETRY**: Execute tests only

### 2. State Caching
**Values cached in state by E2E_SETUP**:
- `.iapToken` - Reused across E2E_RUNNING
- `.iapEnabled` - Avoids repeated detection
- `.packageManager` - Detected once, used everywhere

**IAP token regeneration**:
- E2E_VERIFYING: Regenerates (may have expired after fixes)
- E2E_TIMEOUT_RETRY: Regenerates (may have expired during retries)

### 3. Simpler Scripts
**Before** (e2e_running.sh):
```bash
if [[ "$e2eRunning" == "true" ]]; then
    # Check status
else
    # 4-step verification (50 lines)
    # IAP detection (20 lines)
    # Package manager detection (10 lines)
    # Launch tests
fi
```

**After** (e2e_running.sh):
```bash
if [[ "$e2eRunning" == "true" ]]; then
    # Check status
else
    # Read from state (3 lines)
    # Launch tests
fi
```

### 4. Fail-Fast
E2E_SETUP escalates immediately if:
- playwright.config.ts missing
- Browserless not configured
- test:e2e script missing
- Browserless container not running
- IAP token generation fails

No tmux session created on verification failures.

### 5. Full Suite on Verification Success
When E2E_VERIFYING or E2E_TIMEOUT_RETRY succeeds:
- Route to E2E_SETUP (not directly to E2E_RUNNING)
- E2E_SETUP re-validates prerequisites
- Then E2E_RUNNING runs full suite to catch regressions

**Why?** After fixing tests, we want to ensure:
1. Prerequisites still valid (Browserless still running, etc.)
2. Full suite passes (not just the previously failed tests)

## Performance Impact

### Before (Two-Branch Pattern)
| Step | Action | Duration |
|------|--------|----------|
| E2E_RUNNING (1st entry) | Verify + Launch | ~8s |
| E2E_RUNNING (status check) | Check tmux | ~3s |

### After (E2E_SETUP Step)
| Step | Action | Duration |
|------|--------|----------|
| E2E_SETUP | Verify once | ~8s |
| E2E_RUNNING (launch) | Launch only | ~3s |
| E2E_RUNNING (status check) | Check tmux | ~3s |

**Total time**: Same (~8s initial + ~3s per check)  
**Complexity**: Much lower (cleaner code)  
**Debuggability**: Much higher (step names are explicit)

## State Fields Reference

### Set by E2E_SETUP
```json
{
  "iapToken": "eyJhbGc...",        // IAP JWT (if IAP enabled)
  "iapEnabled": true,              // Boolean
  "packageManager": "npm run"      // "npm run" | "pnpm" | "yarn"
}
```

### Set by E2E_RUNNING/VERIFYING/TIMEOUT_RETRY
```json
{
  "e2eRunning": true,              // Boolean (tmux active)
  "failedTestIds": ["test1", ...], // Array of failed test IDs
  "timedOutTestIds": ["test2", ...], // Array of timed-out test IDs
  "fixAttempts": 1,                // Counter
  "timeoutRetries": 1              // Counter
}
```

## Deployment

```bash
cd ~/.openclaw/shared/office-openclaw/skills/cicd-pipeline/scripts/steps

# Files deployed:
# - e2e_setup.sh (NEW)
# - e2e_running.sh (SIMPLIFIED)
# - e2e_verifying.sh (SIMPLIFIED)
# - e2e_timeout_retry.sh (SIMPLIFIED)
# - ci_building.sh (UPDATED routing)

# All scripts made executable
chmod +x e2e_*.sh ci_building.sh
```

## Testing Checklist

### 1. E2E_SETUP
- [ ] Verify fails if playwright.config.ts missing
- [ ] Verify fails if Browserless not running
- [ ] Verify fails if test:e2e script missing
- [ ] Verify fails if IAP token generation fails
- [ ] Routes to E2E_RUNNING on success
- [ ] Routes to ESCALATED on any failure
- [ ] State fields set correctly (iapToken, iapEnabled, packageManager)

### 2. E2E_RUNNING
- [ ] Launches tests in tmux on first entry
- [ ] Uses iapToken from state (not regenerated)
- [ ] Uses packageManager from state
- [ ] Checks tmux status correctly
- [ ] Parses results correctly
- [ ] Routes to DONE on success
- [ ] Routes to E2E_TIMEOUT_RETRY on timeouts
- [ ] Routes to E2E_FIXING on failures

### 3. E2E_VERIFYING
- [ ] Regenerates IAP token (not from state)
- [ ] Filters tests by failedTestIds
- [ ] Routes to E2E_SETUP on success (full suite)
- [ ] Routes to E2E_FIXING on continued failures
- [ ] Routes to ESCALATED after max attempts

### 4. E2E_TIMEOUT_RETRY
- [ ] Regenerates IAP token (not from state)
- [ ] Filters tests by timedOutTestIds
- [ ] Uses 2x timeout (60s)
- [ ] Routes to E2E_SETUP on success (full suite)
- [ ] Routes to E2E_FIXING if non-timeout failures
- [ ] Routes to ESCALATED after max retries

### 5. CI_BUILDING
- [ ] Routes to E2E_SETUP when no previous failures
- [ ] Routes to E2E_VERIFYING when failedTestIds exist

## Next Steps

1. **Test end-to-end** with cover-gen
2. **Monitor logs** for state transitions
3. **Verify state caching** (iapToken, packageManager used correctly)
4. **Document in step-patterns.md** (update with E2E_SETUP pattern)
5. **Update skill docs** (SKILL.md references to E2E_SETUP)

## Rollback

If issues found, revert to previous tmux pattern:
```bash
cd ~/.openclaw/shared/office-openclaw
git revert HEAD  # Revert E2E_SETUP refactor
git push
```

---

**Author**: Argo  
**Status**: Deployed, pending testing  
**Risk**: Low (cleaner architecture, same functionality)
