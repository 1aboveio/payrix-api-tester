# CI/CD Pipeline Recovery Guide

## Current Issue: FAILED State with projectDir: null

**Error:** `error: src refspec dev does not match any`

**Root cause:** The pipeline was started without setting `projectDir`, so it defaulted to `~/.openclaw/workspace` which doesn't have the `dev` branch.

---

## How to Fix This Instance

### Option 1: Delete the failed state and restart properly

```bash
# 1. Remove the failed state file
rm ~/.openclaw/workspace/cicd-pipeline-state.json

# 2. Start a new pipeline with proper projectDir
# (Use the cicd-pipeline skill and let it create the state with auto-detection)
```

Then tell the agent: "Start the pipeline for cover-gen"

### Option 2: Manually fix the state file

```bash
# Edit the state file to add projectDir
cat > ~/.openclaw/workspace/cicd-pipeline-state.json <<'EOF'
{
  "step": "PUSHING",
  "branch": "dev",
  "service": "cover-gen-dev",
  "region": "us-central1",
  "projectDir": "/home/exoulster/cover-gen",
  "buildId": null,
  "serviceUrl": "https://cover-gen-dev-czwo4jlhdq-uc.a.run.app",
  "failedTestIds": [],
  "timedOutTestIds": [],
  "fixAttempts": 0,
  "timeoutRetries": 0,
  "maxTimeoutRetries": 2,
  "maxVerifyAttempts": 3,
  "monitorCronId": null,
  "notifyChannel": "telegram",
  "notifyTo": "telegram:1285568720",
  "startedAt": "2026-02-20T02:00:00Z",
  "updatedAt": "2026-02-20T02:10:00Z",
  "lastAction": "Manually fixed projectDir",
  "result": null,
  "error": null
}
EOF
```

Then the monitor will pick it up on the next cron tick.

---

## How to Properly Start the Pipeline

The cicd-pipeline skill has smart defaults that auto-detect these fields:

### Required Fields (minimal)

```json
{
  "step": "BUILDING_LOCAL",  // or "PUSHING" to skip local build
  "branch": "dev",
  "service": "cover-gen-dev"
}
```

### Auto-Detected Fields

The skill's start logic will automatically fill in:

- **`projectDir`** → Defaults to `~/.openclaw/workspace` (or current working directory if in a git repo)
- **`serviceUrl`** → Queried from `gcloud run services describe`
- **`region`** → Defaults to `us-central1`

### Recommended: Always Set projectDir Explicitly

```json
{
  "step": "BUILDING_LOCAL",
  "branch": "dev",
  "service": "cover-gen-dev",
  "projectDir": "/home/exoulster/cover-gen"  // ← Explicit is better!
}
```

---

## Prevention: New Validation in Scripts

**As of commit 3eca4cd**, the scripts now validate `projectDir` before execution:

### building_local.sh checks:
- ✅ Project directory exists
- ✅ Can cd into it

### pushing.sh checks:
- ✅ Directory has a `.git` folder
- ✅ Branch exists locally
- ✅ Not trying to push to `main`

**Result:** Instead of cryptic git errors, you get clear escalation messages:

```
ESCALATED: Branch 'dev' does not exist in /home/exoulster/.openclaw/workspace.
Available branches: 
Set projectDir in state to a valid git repository.
```

---

## Quick Recovery Command

```bash
# Clean up and restart
rm ~/.openclaw/workspace/cicd-pipeline-state*.json

# Then tell the agent:
"Start the pipeline for cover-gen from PUSHING step"
# (The skill will auto-detect projectDir based on cwd or ask you)
```

---

## Summary

**What went wrong:**
- Pipeline started with `projectDir: null`
- Defaulted to `~/.openclaw/workspace`
- That directory has no `dev` branch
- Got cryptic error: `src refspec dev does not match any`

**What's fixed:**
- Scripts now validate projectDir early
- Clear error messages when misconfigured
- Escalates instead of failing with git errors

**Best practice:**
- Always set `projectDir` explicitly in state
- Or let the skill's start logic detect it from current directory
- Never start a pipeline with `projectDir: null` manually
