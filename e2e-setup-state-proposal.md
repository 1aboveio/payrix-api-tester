# E2E_SETUP State Proposal

## Problem with Current Approach

**Two-branch logic in E2E_RUNNING is complex:**
- Branch 1: Check running tests (async)
- Branch 2: Verify prerequisites + start tests (mixed sync/async)

**Better separation of concerns:**
- **E2E_SETUP:** Synchronous validation (fast, fail-fast)
- **E2E_RUNNING:** Asynchronous execution (background tmux)

---

## Proposed Solution: Add E2E_SETUP State

### State Machine Flow

```
CI_BUILDING (SUCCESS)
  └─> E2E_SETUP (NEW!)
        │
        ├─ Run all verifications (synchronous)
        │   ├─ playwright.config.ts exists
        │   ├─ Browserless configured
        │   ├─ test:e2e script exists
        │   ├─ Browserless container running
        │   ├─ IAP detection + token generation
        │   └─ Package manager detection
        │
        ├─ If ANY FAIL → ESCALATED ❌
        │
        └─ If ALL PASS → E2E_RUNNING ✓


E2E_RUNNING (simplified - only async logic)
  │
  ├─ First entry (e2eRunning=false):
  │   ├─ Create tmux session
  │   ├─ Start tests in background
  │   ├─ Update state: e2eRunning=true
  │   └─ Exit
  │
  └─ Subsequent entries (e2eRunning=true):
      ├─ Check tmux: ALIVE → Exit (continue monitoring)
      └─ Check tmux: DEAD → Parse results → Route
```

---

## State Definitions

### E2E_SETUP

**Purpose:** Validate environment and prerequisites before running tests

**Type:** Synchronous (completes in single cron tick, ~10s)

**Entry points:**
- `CI_BUILDING` (SUCCESS) → routes here instead of E2E_RUNNING
- `E2E_FIXING` → after fix applied, re-validate before running tests

**Exit routes:**
- ✅ All validations pass → `E2E_RUNNING`
- ❌ Any validation fails → `ESCALATED`

**State fields:**
```json
{
  "step": "E2E_SETUP",
  "setupAttempts": 0,  // Track retries if needed
  "lastSetupError": null
}
```

**Script:** `scripts/steps/e2e_setup.sh`

---

### E2E_RUNNING (Simplified)

**Purpose:** Run E2E tests in background, monitor progress

**Type:** Asynchronous (background tmux execution)

**Entry points:**
- `E2E_SETUP` (SUCCESS) → first time running tests
- `E2E_RUNNING` (self) → monitoring running tests

**Exit routes:**
- ✅ Tests pass → `DONE`
- ⏱️ Timeouts → `E2E_TIMEOUT_RETRY`
- ❌ Regular failures → `E2E_FIXING`
- 🚨 IAP errors → `ESCALATED`

**State fields:**
```json
{
  "step": "E2E_RUNNING",
  "e2eRunning": true,
  "e2eTmuxSession": "e2e-tests",
  "e2eStartedAt": "2026-02-20T12:00:00Z"
}
```

**Script:** `scripts/steps/e2e_running.sh` (simplified - only async logic)

---

## Implementation

### 1. Create e2e_setup.sh

**Location:** `skills/cicd-pipeline/scripts/steps/e2e_setup.sh`

**Logic:**
```bash
#!/bin/bash
# E2E_SETUP: Validate environment before running E2E tests (synchronous)

main() {
    log "=== E2E_SETUP: Validating environment ==="
    
    local service_url=$(get_state_field "serviceUrl")
    local service=$(get_state_field "service")
    local region=$(get_state_field "region")
    local project_dir=$(get_state_field "projectDir")
    
    # Auto-detect Browserless
    read -r BROWSERLESS_URL BROWSERLESS_HTTP < <(get_browserless_urls)
    
    # === STEP 1: Verify Prerequisites ===
    log "Step 1/6: Verifying playwright.config.ts..."
    verify_playwright_config_exists "$project_dir"
    
    log "Step 2/6: Verifying Browserless configuration..."
    verify_browserless_in_config "$project_dir"
    
    log "Step 3/6: Verifying test:e2e script..."
    verify_test_script "$project_dir"
    
    log "Step 4/6: Verifying Browserless container..."
    verify_browserless_running
    
    # === STEP 2: IAP Setup ===
    log "Step 5/6: Setting up IAP authentication..."
    local iap_enabled=$(iap_detection "$service_url")
    local iap_token=""
    
    if [[ "$iap_enabled" == "true" ]]; then
        log "Generating IAP token..."
        if ! iap_token=$(generate_iap_token "$service_url"); then
            escalate "Failed to generate IAP token via gcloud"
        fi
        
        log "Verifying IAP access..."
        check_iap_access "$service_url" "$iap_token"
    fi
    
    # === STEP 3: Package Manager Detection ===
    log "Step 6/6: Detecting package manager..."
    local pm_cmd="npm run"
    if [[ -f "${project_dir}/pnpm-lock.yaml" ]]; then
        pm_cmd="pnpm"
    elif [[ -f "${project_dir}/yarn.lock" ]]; then
        pm_cmd="yarn"
    fi
    log "Detected: ${pm_cmd}"
    
    # === ALL VALIDATIONS PASSED ===
    log ""
    log "✅ All validations passed"
    log "Advancing to E2E_RUNNING"
    
    # Write validated config to state for E2E_RUNNING to use
    update_state_raw \
        ".step = \"E2E_RUNNING\" | \
         .e2eConfig = {
           \"iapEnabled\": \"${iap_enabled}\",
           \"iapToken\": \"${iap_token}\",
           \"packageManager\": \"${pm_cmd}\",
           \"browserlessUrl\": \"${BROWSERLESS_URL}\"
         } | \
         .updatedAt = \"$(now_iso)\""
}

main "$@"
```

---

### 2. Simplify e2e_running.sh

**Remove all validation logic** (now in E2E_SETUP):

```bash
#!/bin/bash
# E2E_RUNNING: Run E2E tests in background (async only)

main() {
    log "=== E2E_RUNNING: Background test execution ==="
    
    local e2e_running=$(get_state_field "e2eRunning")
    local e2e_tmux_session=$(get_state_field "e2eTmuxSession")
    
    # Read pre-validated config from E2E_SETUP
    local e2e_config=$(jq -r '.e2eConfig' "$STATE_FILE")
    local iap_enabled=$(echo "$e2e_config" | jq -r '.iapEnabled')
    local iap_token=$(echo "$e2e_config" | jq -r '.iapToken')
    local pm_cmd=$(echo "$e2e_config" | jq -r '.packageManager')
    local browserless_url=$(echo "$e2e_config" | jq -r '.browserlessUrl')
    
    # BRANCH 1: Tests already running
    if [[ "$e2e_running" == "true" ]]; then
        check_running_tests_and_route
        return $?
    fi
    
    # BRANCH 2: Start tests (skip validation - already done in E2E_SETUP)
    log "Starting tests in background..."
    start_tests_in_tmux
}

main "$@"
```

---

### 3. Update CI_BUILDING Routing

**File:** `scripts/steps/ci_building.sh`

**Before:**
```bash
if [[ "$build_status" == "SUCCESS" ]]; then
    update_state_raw '.step = "E2E_RUNNING" | ...'
fi
```

**After:**
```bash
if [[ "$build_status" == "SUCCESS" ]]; then
    # Route to E2E_SETUP first (validation before execution)
    update_state_raw '.step = "E2E_SETUP" | ...'
fi
```

---

### 4. Update E2E_FIXING Routing

**File:** `scripts/steps/e2e_fixing.sh` (agent fallback)

**After fix applied:**
```bash
# Route back through E2E_SETUP (re-validate environment)
update_state ".step = \"E2E_SETUP\""
```

---

### 5. Update E2E_VERIFYING Routing

**File:** `scripts/steps/e2e_verifying.sh`

**After fixes pass verification:**
```bash
# Run full suite - route through E2E_SETUP
update_state_raw '.step = "E2E_SETUP" | ...'
```

---

### 6. Update State Machine Documentation

**File:** `skills/cicd-pipeline/SKILL.md`

**Add E2E_SETUP to state classifications:**

```markdown
**Start States:**
- `BUILDING_LOCAL` — default, runs full pipeline from local build
- `PUSHING` — skip local build, just push
- `CI_BUILDING` — already pushed, monitor Cloud Build
- `E2E_SETUP` — NEW: validate environment before running E2E tests
- `E2E_RUNNING` — already deployed, tests validated, run E2E tests
- `E2E_FIXING` — fix existing E2E failures

**Active States:**
- `BUILDING_LOCAL`
- `PUSHING`
- `CI_BUILDING`
- `E2E_SETUP` — NEW: synchronous validation (~10s)
- `E2E_RUNNING` — asynchronous background execution
- `E2E_TIMEOUT_RETRY`
- `E2E_VERIFYING`
- `E2E_FIXING`
```

**Update state flow diagram:**
```
CI_BUILDING (SUCCESS)
  ↓
E2E_SETUP (NEW: validate environment)
  ↓
E2E_RUNNING (start tests in background)
  ├─> DONE (all pass)
  ├─> E2E_TIMEOUT_RETRY (timeouts)
  ├─> E2E_FIXING (failures)
  └─> ESCALATED (IAP errors)
```

---

## Benefits

### 1. Clearer Separation of Concerns

**E2E_SETUP:** "Is the environment ready?"
- Synchronous, fast (~10s)
- Fail-fast with actionable errors
- No tmux session created on failure

**E2E_RUNNING:** "Run tests and monitor"
- Asynchronous, background execution
- Simple two-branch logic (running vs completed)
- Always has validated environment from E2E_SETUP

### 2. Easier to Understand

**Before (single state):**
```
E2E_RUNNING has complex branching:
- If e2eRunning=false: validate + start
- If e2eRunning=true: monitor
- Mixed sync/async logic
```

**After (two states):**
```
E2E_SETUP: Validate (sync, simple)
E2E_RUNNING: Execute (async, simple)
```

### 3. Better Error Handling

**Setup failures are distinct from test failures:**
- Setup fails → `ESCALATED` (infrastructure issue)
- Tests fail → `E2E_FIXING` (code issue)

Clear distinction helps debugging.

### 4. Retryable Setup

If environment setup fails transiently (e.g., Browserless restarting):
- User can retry just E2E_SETUP
- Don't need to re-run the whole pipeline

### 5. Reusable Validation

All E2E states can route through E2E_SETUP:
- `CI_BUILDING` → `E2E_SETUP` → `E2E_RUNNING`
- `E2E_FIXING` → `E2E_SETUP` → `E2E_VERIFYING`
- `E2E_TIMEOUT_RETRY` (completed) → `E2E_SETUP` → `E2E_RUNNING`

Consistent validation every time.

---

## Migration Path

### Phase 1: Add E2E_SETUP (New State)
1. Create `scripts/steps/e2e_setup.sh`
2. Update `ci_building.sh` routing
3. Update state machine docs
4. Test with new pipelines

### Phase 2: Simplify E2E_RUNNING
1. Remove validation logic
2. Read pre-validated config from state
3. Keep only async execution logic
4. Test with existing pipelines

### Phase 3: Update Other E2E Steps
1. Update `e2e_fixing.sh` to route through E2E_SETUP
2. Update `e2e_verifying.sh` to route through E2E_SETUP
3. Update `e2e_timeout_retry.sh` if needed

---

## State Schema Changes

**Add to state file:**
```json
{
  "step": "E2E_SETUP" | "E2E_RUNNING" | ...,
  "e2eConfig": {
    "iapEnabled": "true" | "false",
    "iapToken": "eyJhbGci...",
    "packageManager": "pnpm" | "npm run" | "yarn",
    "browserlessUrl": "ws://localhost:3000"
  },
  "e2eRunning": true | false,
  "e2eTmuxSession": "e2e-tests" | null,
  "e2eStartedAt": "2026-02-20T12:00:00Z" | null
}
```

---

## Comparison

| Aspect | Single State (E2E_RUNNING) | Two States (E2E_SETUP + E2E_RUNNING) |
|--------|---------------------------|--------------------------------------|
| Logic complexity | Mixed sync/async | Separated (sync then async) |
| Lines of code | ~250 in one file | ~120 + ~130 (clearer) |
| Error handling | Setup vs test failures mixed | Setup fails → ESCALATED, tests → FIXING |
| Retryability | Must retry whole pipeline | Can retry just setup |
| Debugging | Which phase failed? | Clear state = clear phase |
| Testing | Test both branches in one script | Test each state independently |

---

## Recommendation

**✅ Add E2E_SETUP state**

**Advantages:**
- Clearer code organization
- Easier to understand and maintain
- Better error handling
- Retryable validation
- Consistent pattern for all E2E states

**Minimal cost:**
- One extra state in state machine
- One extra script file
- One extra cron tick (~3s overhead for simple route)

**Net benefit:** Much clearer architecture for small overhead

---

## Next Steps

1. **Create `e2e_setup.sh`** with all validation logic
2. **Simplify `e2e_running.sh`** to only async execution
3. **Update routing** in ci_building.sh and other E2E steps
4. **Update documentation** (state machine diagrams)
5. **Test** with cover-gen pipeline

**Estimated effort:** 1-2 hours (vs 2-3 hours for complex two-branch approach)
