# E2E_SETUP Documentation Updates Needed

## Summary

The E2E_SETUP refactor is complete in code, but documentation files still reference E2E_RUNNING as the entry point. Here's what needs updating:

## Files Needing Updates

### 1. step-patterns.md ❌

**Current issues:**
- **Start States** list: `E2E_RUNNING` should be `E2E_SETUP`
- **Active States** list: Missing `E2E_SETUP`
- **Missing section**: No `## E2E_SETUP` section before `## E2E_RUNNING`
- **E2E_RUNNING section**: Contains IAP token generation code (should be removed, now in E2E_SETUP)

**Location**: `skills/cicd-pipeline/references/step-patterns.md`

**Required changes:**

Line 9:
```diff
- **Start States:** BUILDING_LOCAL, PUSHING, CI_BUILDING, E2E_RUNNING, E2E_FIXING
+ **Start States:** BUILDING_LOCAL, PUSHING, CI_BUILDING, E2E_SETUP, E2E_FIXING
```

Line 10:
```diff
- **Active States:** BUILDING_LOCAL, PUSHING, CI_BUILDING, E2E_RUNNING, E2E_TIMEOUT_RETRY, E2E_VERIFYING, E2E_FIXING
+ **Active States:** BUILDING_LOCAL, PUSHING, CI_BUILDING, E2E_SETUP, E2E_RUNNING, E2E_TIMEOUT_RETRY, E2E_VERIFYING, E2E_FIXING
```

**New section needed** (before line 111 `## E2E_RUNNING`):

```markdown
## E2E_SETUP

**Goal:** Verify E2E prerequisites once. Advance to E2E_RUNNING or ESCALATED.

### ✅ Patterns

**One-shot verification** — runs fail-fast checks before any E2E execution:

1. **Verify playwright.config.ts exists**
2. **Verify Browserless configured** in config (checks for `wsEndpoint` or `PLAYWRIGHT_BROWSER_WS_ENDPOINT`)
3. **Verify test:e2e script exists** in package.json
4. **Verify Browserless container running** (auto-detect port from `podman ps` or `docker ps`)
5. **Generate IAP token** (if service is IAP-protected)
6. **Detect package manager** (npm/pnpm/yarn)

**Cache in state** for reuse by execution steps:
```json
{
  "iapToken": "eyJhbGc...",
  "iapEnabled": true,
  "packageManager": "npm run"
}
```

**Route based on verification results:**
- All checks pass → write `step: "E2E_RUNNING"`
- Any check fails → write `step: "ESCALATED"` with actionable error message

**IAP Token Generation** (if service is IAP-protected):

```bash
# 1. Detect IAP from service URL (checks for iap-enabled annotation)
IAP_ENABLED=$(gcloud run services describe $SERVICE \
  --region=$REGION \
  --format="value(metadata.annotations.'run.googleapis.com/ingress')" | \
  grep -q "internal-and-cloud-load-balancing" && echo "true" || echo "false")

# 2. Generate signed JWT token
SA_EMAIL=$(gcloud auth list --filter="status:ACTIVE" --format="value(account)")
JWT_PAYLOAD=$(printf '{"iss":"%s","sub":"%s","aud":"%s/*","iat":%d,"exp":%d}' \
  "$SA_EMAIL" "$SA_EMAIL" "$serviceUrl" "$(date +%s)" "$(($(date +%s)+3600))")

IAP_TOKEN=$(gcloud iam service-accounts sign-jwt \
  --iam-account="$SA_EMAIL" \
  /dev/stdin /dev/stdout <<< "$JWT_PAYLOAD")

# 3. Verify access with preflight check
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $IAP_TOKEN" "$serviceUrl/")

if [ "$HTTP_CODE" = "403" ]; then
  # Escalate immediately with fix commands
  exit 99
fi

# 4. Store in state
jq '.iapToken = $token | .iapEnabled = true' \
  --arg token "$IAP_TOKEN" state.json > state.tmp && mv state.tmp state.json
```

**Package Manager Detection:**

```bash
if [[ -f "pnpm-lock.yaml" ]]; then
  PACKAGE_MANAGER="pnpm"
elif [[ -f "yarn.lock" ]]; then
  PACKAGE_MANAGER="yarn"
else
  PACKAGE_MANAGER="npm run"  # npm needs 'run' prefix
fi

# Store in state
jq '.packageManager = $pm' --arg pm "$PACKAGE_MANAGER" state.json > state.tmp && mv state.tmp state.json
```

**Fail-fast escalation messages:**

Each verification failure should provide actionable fix commands:

- **Config missing**: `"playwright.config.ts not found at {path}"`
- **Browserless not configured**: `"playwright.config.ts missing wsEndpoint or PLAYWRIGHT_BROWSER_WS_ENDPOINT"`
- **Script missing**: `"test:e2e script not defined in package.json"`
- **Container not running**: Include `podman run` command with detected port
- **IAP access failed**: Include `gcloud beta iap web add-iam-policy-binding` command

### ❌ Anti-Patterns

- **Never skip verification** — even if "it worked last time"
- **Never regenerate IAP token** in E2E_RUNNING — use cached value from state
- **Never proceed to E2E_RUNNING** if any verification fails
- **Never cache stale tokens** — ensure TTL is within test execution window

---
```

**E2E_RUNNING section updates** (line 111):

Remove IAP token generation section (lines 113-172), replace with:

```markdown
## E2E_RUNNING

**Goal:** Execute E2E tests in background tmux. Wait for completion. Advance to DONE, E2E_TIMEOUT_RETRY, E2E_FIXING, or ESCALATED.

**Prerequisites**: E2E_SETUP has already verified prerequisites and cached `.iapToken`, `.iapEnabled`, `.packageManager` in state.

### Execution Pattern

**Two-branch flow:**

**Branch 1 - First entry (e2eRunning=false):**
1. Read cached values from state (iapToken, iapEnabled, packageManager)
2. Launch tests in background tmux session `e2e-tests`
3. Set `.e2eRunning = true`
4. Exit (~5s)

**Branch 2 - Status check (e2eRunning=true):**
1. Check if tmux session alive
2. If alive → exit (wait for next tick)
3. If dead → parse results, route to next state
4. Clear `.e2eRunning = false`

### Launch Tests (Branch 1)

```bash
# Read from state (set by E2E_SETUP)
IAP_TOKEN=$(jq -r '.iapToken // ""' state.json)
IAP_ENABLED=$(jq -r '.iapEnabled // false' state.json)
PACKAGE_MANAGER=$(jq -r '.packageManager // "npm run"' state.json)

# Build command
CMD="cd $PROJECT_DIR && "
CMD+="export PLAYWRIGHT_BROWSER_WS_ENDPOINT='$BROWSERLESS_URL' && "
CMD+="export PLAYWRIGHT_BASE_URL='$SERVICE_URL' && "

if [[ "$IAP_ENABLED" == "true" ]]; then
  CMD+="export IAP_ID_TOKEN='$IAP_TOKEN' && "
fi

CMD+="$PACKAGE_MANAGER test:e2e 2>&1 | tee /tmp/e2e-output.log; echo \$? > /tmp/e2e-output.log.exit"

# Launch in background
tmux new-session -d -s e2e-tests "$CMD"

# Mark running
jq '.e2eRunning = true' state.json > state.tmp && mv state.tmp state.json
```

### Check Status (Branch 2)

```bash
# Check session alive
if tmux has-session -t e2e-tests 2>/dev/null; then
  # Still running - exit
  exit 0
fi

# Dead - parse results
EXIT_CODE=$(cat /tmp/e2e-output.log.exit)

# Route based on results...
```

### Parse Results and Route

[Keep existing routing logic from line 173 onwards]
```

### 2. start-logic.md ❌

**Current issues:**
- Line 9: `E2E_RUNNING` should be `E2E_SETUP`
- Line 16: Missing `E2E_SETUP` in active states

**Location**: `skills/cicd-pipeline/references/start-logic.md`

**Required changes:**

Line 9:
```diff
- - `E2E_RUNNING` — already deployed, run E2E tests
+ - `E2E_SETUP` — already deployed, verify prerequisites and run E2E tests
```

Line 16 (add after `CI_BUILDING`):
```diff
  - `CI_BUILDING` — polling Cloud Build status
+ - `E2E_SETUP` — verifying E2E prerequisites (Browserless, config, IAP token)
  - `E2E_RUNNING` — running E2E tests (Playwright)
```

Line 193:
```diff
- - **E2E_RUNNING** — will re-run tests (idempotent)
+ - **E2E_SETUP** — will re-verify and re-run tests (idempotent)
```

### 3. SKILL.md ✅

**Status**: Already updated (commit d9140c2)

## Discussion Points

### 1. Should E2E_RUNNING still document IAP token generation?

**Current**: E2E_RUNNING section has ~60 lines of IAP token generation code  
**Reality**: IAP token is now generated by E2E_SETUP and cached in state

**Options:**
- **A**: Remove entirely, reference E2E_SETUP
- **B**: Keep as reference, note it's handled by E2E_SETUP
- **C**: Move to E2E_SETUP section, link from E2E_RUNNING

**Recommendation**: Option A - Remove and reference E2E_SETUP. Keep DRY.

### 2. Should we add IAP token regeneration to E2E_VERIFYING docs?

**Current**: No mention of IAP token regeneration  
**Reality**: E2E_VERIFYING regenerates IAP token (may have expired after fixes)

**Recommendation**: Add note to E2E_VERIFYING section:
```markdown
**Note**: IAP token is regenerated (not reused from E2E_SETUP) because:
- Tokens expire after 1 hour
- Fixes may take longer than token TTL
- Ensures fresh token for verification tests
```

### 3. Should we add E2E_SETUP to terminal state cleanup examples?

**Current**: Examples mention E2E_RUNNING as entry point  
**Reality**: E2E_SETUP is now the entry point

**Recommendation**: Update examples to start from E2E_SETUP.

### 4. Step script naming convention?

**Current**: `e2e_setup.sh` (lowercase with underscore)  
**State field**: `E2E_SETUP` (uppercase)  
**Monitor logic**: Converts to lowercase: `${step,,}.sh`

**Status**: ✅ Already consistent (monitor.sh does lowercase conversion)

## Priority

**High Priority** (user-facing):
1. ✅ SKILL.md natural language guide (done)
2. ❌ step-patterns.md Start States list
3. ❌ step-patterns.md E2E_SETUP section
4. ❌ start-logic.md Start States list

**Medium Priority** (developer-facing):
5. ❌ step-patterns.md E2E_RUNNING section cleanup
6. ❌ step-patterns.md Active States list
7. ❌ start-logic.md Active States list

**Low Priority** (nice-to-have):
8. ❌ E2E_VERIFYING IAP regeneration note
9. ❌ Terminal state cleanup examples

## Recommended Action

**Option 1 - Update all now** (comprehensive, prevents confusion)  
**Option 2 - Update critical only** (Start States + E2E_SETUP section)  
**Option 3 - Defer to testing** (wait for first run, update based on issues)

**My recommendation**: Option 1 - Update all documentation now. The refactor is complete, docs should match reality.

---

**Next Steps** (if approved):
1. Update step-patterns.md (add E2E_SETUP section, update lists, clean E2E_RUNNING)
2. Update start-logic.md (update Start/Active States lists)
3. Commit documentation updates
4. Test with "start from E2E" command

**Estimated time**: ~30 minutes for all updates
