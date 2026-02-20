# Step Patterns Requirements Audit
## Date: 2026-02-20
## Checked by: Argo

This audit cross-checks implemented scripts against requirements in step-patterns.md for both cicd-pipeline and coding-workflow skills.

---

## cicd-pipeline Scripts

### ✅ building_local.sh
**Requirements from step-patterns.md:**
- ✅ Run tests directly (no tmux)
- ✅ Check exit code (0 = pass, non-zero = fail)
- ✅ Pass → write `step: "PUSHING"`
- ✅ Fail → write `step: "FAILED"`, capture error
- ✅ Never push if local tests failed

**Status:** COMPLETE

---

### ✅ pushing.sh
**Requirements from step-patterns.md:**
- ✅ Run `git push origin <branch>`
- ✅ Only push to feature branches and `dev`, never `main`
- ✅ Wait for build trigger, capture buildId
- ✅ Retry capture once if no build found
- ✅ Write buildId to state before advancing
- ✅ Advance to CI_BUILDING only with buildId

**Status:** COMPLETE

---

### ✅ ci_building.sh
**Requirements from step-patterns.md:**
- ✅ Capture buildId if missing from state
- ✅ Poll build status via `gcloud builds describe`
- ✅ WORKING/QUEUED → do nothing, exit
- ✅ SUCCESS → route to E2E_RUNNING (first run) or E2E_VERIFYING (has failedTestIds)
- ✅ FAILURE → capture log, write `step: "FAILED"`
- ✅ TIMEOUT/CANCELLED → treat as FAILURE

**Status:** COMPLETE

---

### ⚠️ e2e_running.sh
**Requirements from step-patterns.md:**

✅ **IAP Setup:**
- ✅ Detect IAP via curl preflight (200 = public, 403/302 = IAP)
- ✅ Generate JWT token via `gcloud iam service-accounts sign-jwt`
- ✅ Preflight check with token (fail-fast on 403)
- ✅ Export IAP_ID_TOKEN for Playwright

✅ **4-Step Verification:**
- ✅ Check playwright.config.ts exists
- ✅ Check Browserless configuration in config
- ✅ Check test:e2e script exists
- ✅ Check Browserless container running

✅ **Run Tests:**
- ✅ Set PLAYWRIGHT_BROWSER_WS_ENDPOINT, PLAYWRIGHT_BASE_URL, IAP_ID_TOKEN
- ✅ Run tests with package manager auto-detection (npm/pnpm/yarn)
- ✅ Capture output to file

❌ **MISSING - IAP Failure Detection in Test Output:**
```bash
# Should check test output for IAP failures BEFORE parsing regular failures
if grep -q "403\|Forbidden\|IAP" /tmp/e2e-output.log && [ $EXIT_CODE -ne 0 ]; then
  # IAP failure detected — escalate immediately
  escalate "IAP authentication failure detected in test output..."
fi
```
**Why:** Tests can fail with IAP errors that aren't caught by preflight check (e.g. token expiry during test run, missing resource-level permissions).

✅ **Parse and Route:**
- ✅ Exit 0 → DONE
- ✅ Timeouts → E2E_TIMEOUT_RETRY
- ✅ Regular failures → E2E_FIXING (increment fixAttempts)
- ✅ Extract test IDs separately (timedOutTestIds, failedTestIds)

**Status:** MOSTLY COMPLETE (missing IAP failure detection in test output)

---

### ✅ e2e_timeout_retry.sh
**Requirements from step-patterns.md:**
- ✅ Increment timeoutRetries BEFORE running tests
- ✅ Build grep pattern from timedOutTestIds
- ✅ Run with 2x timeout (60s)
- ✅ IAP token + preflight check
- ✅ Package manager detection
- ✅ Parse results: still timeout vs regular failures
- ✅ Route: pass → E2E_RUNNING, still timeout → check limit (escalate or retry), failures → E2E_FIXING
- ✅ Never retry more than maxTimeoutRetries (default 2)

**Status:** COMPLETE

---

### ❌ e2e_verifying.sh
**Requirements from step-patterns.md:**
- ✅ Run only previously failed tests (--grep filter from failedTestIds)
- ✅ IAP token + preflight check
- ✅ Package manager detection
- ✅ Parse results
- ❌ **WRONG ROUTING:** Exit 0 → should go to **E2E_RUNNING** (run full suite to catch regressions), not DONE
- ✅ Timeouts → E2E_TIMEOUT_RETRY
- ✅ Still failing → check max attempts, escalate or back to E2E_FIXING
- ✅ Increment fixAttempts before routing back

**Issue:** When previously failed tests pass, script routes to DONE instead of E2E_RUNNING. This skips the regression check (running full suite to ensure other tests didn't break).

**Fix Required:**
```bash
# Line 135 should be:
update_state_raw \
    '.step = "E2E_RUNNING" | \
     .failedTestIds = [] | \
     .failedTestCount = 0 | \
     .lastAction = "E2E_VERIFYING: previously failed tests now pass → running full suite" | \
     .updatedAt = "'"$(now_iso)"'"'
```

**Status:** ROUTING BUG (critical: skips regression testing)

---

### ✅ done.sh
**Requirements from step-patterns.md:**
- ✅ Commit changes (with error handling)
- ✅ Disable monitor cron
- ✅ Kill tmux session
- ✅ Archive state file (with timestamp + success suffix)
- ✅ Return completion message (no message tool call)

**Status:** COMPLETE

---

### ✅ escalated.sh
**Requirements from step-patterns.md:**
- ✅ Disable monitor cron
- ✅ Kill tmux session
- ✅ Archive state (with escalated suffix)
- ✅ Return escalation message (format varies by escalation reason: IAP failure, timeout, max fix attempts)

**Status:** COMPLETE (checked via head output)

---

### ✅ failed.sh
**Requirements from step-patterns.md:**
- ✅ Disable monitor cron
- ✅ Kill tmux session
- ✅ Archive state (with failed suffix)
- ✅ Return failure message

**Status:** COMPLETE (checked via head output)

---

## coding-workflow Scripts

### 📝 coding.sh
**Status:** Uses agent fallback (no script implementation required)

---

### 📝 building.sh
**Status:** Uses agent fallback (no script implementation required)

---

### ✅ testing.sh
**Requirements from step-patterns.md:**
- ✅ Run unit tests first
- ✅ Skip integration if unit fails → route to FIXING
- ✅ Run integration tests after unit passes
- ✅ Capture full output + exit code
- ✅ Pass → DONE
- ✅ Fail → FIXING (with error capture)
- ✅ Support all stacks (python, nextjs, monorepo)

⚠️ **Note on fixAttempts increment:**
- Script increments fixAttempts before routing to FIXING
- This is correct (consistent with cicd-pipeline E2E steps)
- Step-patterns.md is slightly confusing about who increments (describes both TESTING incrementing and FIXING incrementing)

**Status:** COMPLETE (step-patterns.md description could be clarified about increment timing)

---

### 📝 fixing.sh
**Status:** Uses agent fallback (no script implementation required)

**Expected agent behavior (from step-patterns.md):**
1. Check fixAttempts (already incremented by TESTING)
2. If >= 3 → escalate
3. Otherwise → launch coding agent (claude or codex per state.codingAgent)
4. After fix → route to BUILDING (not PUSHING)

---

### 📝 done.sh
**Status:** Uses agent fallback (no script implementation required)

**Expected behavior:**
- Commit changes
- Disable cron
- Kill tmux
- Remove state file (coding-workflow removes instead of archiving)
- Return completion message

---

### 📝 escalated.sh
**Status:** Uses agent fallback (no script implementation required)

**Expected behavior:**
- Disable cron
- Kill tmux
- Archive state (with escalated suffix)
- Return escalation message

---

## Summary

### cicd-pipeline
- **Total scripts:** 9 (7 implemented, 2 use agent fallback: e2e_fixing)
- **Issues found:** 2
  1. ❌ **e2e_running.sh:** Missing IAP failure detection in test output (should check for 403/Forbidden/IAP in logs after tests run)
  2. ❌ **e2e_verifying.sh:** Wrong routing on success (DONE instead of E2E_RUNNING) — skips regression testing

### coding-workflow
- **Total scripts:** 6 (1 implemented, 5 use agent fallback)
- **Issues found:** 0 (testing.sh is correct, step-patterns.md description could be clearer about fixAttempts increment timing)

---

## Recommended Actions

### Priority 1: Fix e2e_verifying.sh routing bug
**Impact:** High - skips full regression test suite after fixes
**Effort:** Low - one-line change

```bash
# File: /home/exoulster/.openclaw/shared/office-openclaw/skills/cicd-pipeline/scripts/steps/e2e_verifying.sh
# Line ~135

# BEFORE:
update_state_raw '.step = "DONE" | .updatedAt = "'"$(now_iso)"'"'

# AFTER:
update_state_raw \
    '.step = "E2E_RUNNING" | \
     .failedTestIds = [] | \
     .failedTestCount = 0 | \
     .lastAction = "E2E_VERIFYING: previously failed tests now pass → running full suite" | \
     .updatedAt = "'"$(now_iso)"'"'
```

### Priority 2: Add IAP failure detection in e2e_running.sh
**Impact:** Medium - prevents wasted fix attempts on infrastructure issues
**Effort:** Low - add check after test run, before parsing

```bash
# File: /home/exoulster/.openclaw/shared/office-openclaw/skills/cicd-pipeline/scripts/steps/e2e_running.sh
# After line ~166 (after test run, before "if [[ $exit_code -eq 0 ]]")

# Check for IAP authentication failures in test output (fail-fast)
if [[ $exit_code -ne 0 ]]; then
    if grep -qE "403|Forbidden|IAP.*unauthorized|IAP.*authentication.*failed" "$TEST_OUTPUT"; then
        log "IAP authentication failure detected in test output"
        escalate "IAP authentication failure detected during E2E tests

Tests failed with IAP-related errors. This indicates missing permissions
or token issues that occurred during the test run.

Check:
1. Service account has roles/iap.httpsResourceAccessor on the service
2. IAP token hasn't expired during test execution
3. Resource-level IAP policies allow the service account

Required fix:
gcloud beta iap web add-iam-policy-binding \\
  --member=\"serviceAccount:${IAP_SA_EMAIL}\" \\
  --role=\"roles/iap.httpsResourceAccessor\" \\
  --resource-type=cloud-run \\
  --service=${service} \\
  --region=${region}"
    fi
fi
```

### Priority 3: Clarify step-patterns.md increment timing
**Impact:** Low - documentation clarity
**Effort:** Low - add note to step-patterns.md

Add to both cicd-pipeline and coding-workflow step-patterns.md:

```markdown
### Note on fixAttempts Increment Timing

The routing step (E2E_RUNNING, E2E_VERIFYING, TESTING) increments `fixAttempts`
before writing the state transition to FIXING.

This means the FIXING step (agent or script) sees `fixAttempts` already
incremented and should:
1. Check if fixAttempts >= max → escalate
2. Otherwise → launch fix (don't increment again)

Example flow:
- E2E_RUNNING sees failure → increments to 1 → routes to E2E_FIXING
- E2E_FIXING sees fixAttempts=1 → check if >=3 (no) → launch fix
- After fix → BUILDING_LOCAL → ... → E2E_VERIFYING
- E2E_VERIFYING sees still failing → increments to 2 → routes to E2E_FIXING
- E2E_FIXING sees fixAttempts=2 → check if >=3 (no) → launch fix
- ... repeat ...
- E2E_VERIFYING sees still failing → increments to 3 → routes to E2E_FIXING
- E2E_FIXING sees fixAttempts=3 → check if >=3 (yes) → escalate
```
