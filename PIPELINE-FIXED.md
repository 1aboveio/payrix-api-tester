# ✅ CI/CD Pipeline - Fixed and Ready

## What Was Wrong

**Original Error:**
```
State: FAILED
Error: src refspec dev does not match any
```

**Root Cause:**
- Pipeline state had `projectDir: null`
- Scripts defaulted to `~/.openclaw/workspace`
- That directory doesn't have a `dev` branch
- Git push failed with cryptic error

---

## What Was Fixed

### 1. Script Validation (Commit 3eca4cd)

**pushing.sh now validates:**
- ✅ `projectDir` is not null (treats "null" string as empty)
- ✅ Directory has a `.git` folder
- ✅ Branch exists locally before attempting push
- ✅ Not trying to push to `main` (safety check)

**building_local.sh now validates:**
- ✅ `projectDir` is not null
- ✅ Directory exists before cd

**Error messages are now actionable:**
```
Before: error: src refspec dev does not match any

After: ESCALATED: Branch 'dev' does not exist in /home/exoulster/.openclaw/workspace.
       Available branches: main
       Set projectDir in state to a valid git repository.
```

### 2. Test State Cleaned Up

- ✅ Removed leftover test state file
- ✅ No active cron monitors running
- ✅ Ready for fresh pipeline start

---

## How to Use the Pipeline (Correctly)

### Starting a Pipeline

The cicd-pipeline skill has **smart defaults** - it will auto-detect most fields. You only need to provide the essentials:

```json
{
  "step": "BUILDING_LOCAL",  // or "PUSHING" to skip local build
  "branch": "dev",
  "service": "cover-gen-dev"
}
```

**The skill will auto-detect:**
- `projectDir` → Current working directory (if in a git repo) or defaults to workspace
- `serviceUrl` → Queries from `gcloud run services describe`
- `region` → Defaults to `us-central1`

### Recommended: Be Explicit

**Best practice** - always set `projectDir` explicitly:

```json
{
  "step": "PUSHING",
  "branch": "dev",
  "service": "cover-gen-dev",
  "projectDir": "/home/exoulster/cover-gen",  // ← Explicit!
  "region": "us-central1",
  "serviceUrl": "https://cover-gen-dev-czwo4jlhdq-uc.a.run.app"
}
```

---

## Example: Start Pipeline for cover-gen

**Tell the agent:**
```
Start the CI/CD pipeline for cover-gen service, dev branch, from PUSHING step
```

**Or manually create state:**
```bash
cat > ~/.openclaw/workspace/cicd-pipeline-state.json <<'EOF'
{
  "step": "PUSHING",
  "branch": "dev",
  "service": "cover-gen-dev",
  "region": "us-central1",
  "projectDir": "/home/exoulster/cover-gen",
  "serviceUrl": "https://cover-gen-dev-czwo4jlhdq-uc.a.run.app",
  "buildId": null,
  "failedTestIds": [],
  "timedOutTestIds": [],
  "fixAttempts": 0,
  "timeoutRetries": 0,
  "maxTimeoutRetries": 2,
  "maxVerifyAttempts": 3,
  "notifyChannel": "telegram",
  "notifyTo": "telegram:1285568720",
  "startedAt": "$(date -Iseconds)",
  "updatedAt": "$(date -Iseconds)",
  "lastAction": "Pipeline started manually"
}
EOF

# Create monitor cron
openclaw cron add --job '{
  "name": "pipeline-monitor",
  "agentId": "cron-worker",
  "schedule": { "kind": "every", "everyMs": 180000 },
  "sessionTarget": "isolated",
  "payload": {
    "kind": "agentTurn",
    "message": "Monitor cicd-pipeline state machine:\n\n1. Check for agent step markers: ls ~/.openclaw/workspace/.agent-step-*.marker\n\n2. If marker found:\n   - Read marker JSON (contains step, stateFile, workflow)\n   - Read state from stateFile path\n   - Execute that step following cicd-pipeline skill'\''s references/step-patterns.md\n   - Update state file with results\n   - Delete marker file\n   - Continue to step 3\n\n3. Run bash monitor: bash ~/.openclaw/shared/office-openclaw/skills/cicd-pipeline/scripts/monitor.sh\n   - Orchestrates state machine: reads state, executes step scripts (scripts/steps/*.sh)\n   - Detects advancement and repeats within MAX_DURATION or until terminal state\n   - If step script missing: writes marker for next tick (agent fallback)\n\nThis hybrid approach uses bash scripts for implemented steps (fast, deterministic) and agent execution for missing steps (flexible fallback).",
    "timeoutSeconds": 300
  }
}'

# Write the cronId to state
CRON_ID="<id from above>"
jq ".monitorCronId = \"$CRON_ID\"" cicd-pipeline-state.json > cicd-pipeline-state.json.tmp
mv cicd-pipeline-state.json.tmp cicd-pipeline-state.json
```

---

## Current Status

✅ **Scripts fixed** - All validation in place  
✅ **Test states cleaned** - Ready for fresh start  
✅ **cover-gen repo** - Clean, on dev branch, in sync with origin  
✅ **No active monitors** - Can start fresh anytime  

---

## What's Been Tested

| Script | Status | Notes |
|--------|--------|-------|
| building_local.sh | ✅ Tested | Auto-detects E2E-only repos |
| pushing.sh | ✅ Tested | Git push + buildId capture + safety checks |
| ci_building.sh | ✅ Tested | Build polling |
| e2e_running.sh | ✅ Tested | Full E2E with npm detection |
| e2e_timeout_retry.sh | ✅ Syntax | Valid bash |
| e2e_verifying.sh | ✅ Syntax | Valid bash |

**Package manager support:**
- ✅ npm (tested with cover-gen)
- ✅ pnpm (supported)
- ✅ yarn (supported)

---

## Summary

**What happened:**
- Pipeline failed due to `projectDir: null`
- Got cryptic git error

**What's fixed:**
- Scripts now validate early
- Clear error messages
- Test states cleaned up

**What to do:**
- Start a fresh pipeline when ready
- Always set `projectDir` explicitly (or let skill auto-detect from cwd)
- Scripts will catch misconfiguration early now

**The pipeline is ready to use! 🚀**
