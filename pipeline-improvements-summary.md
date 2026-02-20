# Pipeline Improvements Summary
**Date:** 2026-02-20  
**Session:** Step patterns audit + critical fixes

---

## 🎯 What We Fixed

### 1. ✅ Step Routing Bugs (commit 5269da6)

**Issues Found:**
1. **e2e_verifying.sh** — wrong routing after fixes pass
   - Was: Fixed tests pass → `DONE` ❌
   - Now: Fixed tests pass → `E2E_RUNNING` (full suite to catch regressions) ✅
   
2. **e2e_running.sh** — missing IAP failure detection
   - Was: IAP errors treated as regular test failures → waste 3 fix attempts
   - Now: Detect IAP errors in test output → escalate immediately with fix commands ✅

**Impact:**
- Prevents merging code that breaks other tests
- Fail-fast on infrastructure issues (IAP permissions)
- Saves time and API calls by avoiding pointless fix loops

---

### 2. ✅ State Archiving Improvement (commit 4ae45b5)

**Problem:**
When pipelines fail/crash, state files could disappear without a trace:
- Used `cp` + `rm` (not atomic — could lose data if interrupted)
- Archived to workspace root (hard to find)
- Minimal context in filenames

**Solution:**
```
~/.openclaw/workspace/pipeline-archive/
├── 2026-02-20/
│   ├── cicd-pipeline-071234-a1-portal-dev-success.json
│   ├── cicd-pipeline-143052-cover-gen-dev-escalated.json
│   └── cicd-pipeline-234501-a1-api-dev-failed.json
```

**Changes:**
1. **Atomic move** — `mv` instead of `cp` + `rm` (safer)
2. **Organized by date** — YYYY-MM-DD folders
3. **Rich filenames** — `{workflow}-{HHMMSS}-{service}-{status}.json`
4. **Dedicated directory** — clean workspace, easy browsing
5. **Updated terminal scripts** — done.sh, escalated.sh, failed.sh

**Benefits:**
- Never lose state data
- Easy debugging (organized, clear naming)
- Complete audit trail

---

### 3. ✅ Monitor Cron Self-Disabling (commit 1cf6618)

**Problem:**
Monitor cron jobs keep polling forever (every 3 min) even after pipelines complete or state files are deleted. Wastes API calls and resources.

**Solution:**
Monitor scripts now self-disable their cron jobs when idle:

**Detection:**
```bash
if [[ ! -f "$STATE_FILE" ]]; then
    # Check for agent markers
    if [[ no markers exist ]]; then
        # Pipeline is idle → disable cron
        openclaw cron update --id $MONITOR_CRON_ID --patch '{"enabled": false}'
    fi
fi
```

**Cron Creation Pattern:**
```javascript
// Step 1: Create cron with placeholder <jobId>
const cronResult = await cron({ action: "add", job: {...} });
const jobId = cronResult.jobId;

// Step 2: Update message to replace <jobId> with actual ID
await cron({
  action: "update",
  jobId: jobId,
  patch: { payload: { message: message.replace('<jobId>', jobId) } }
});

// Now monitor script runs with: MONITOR_CRON_ID=<actual-id>
```

**Applied to:**
- cicd-pipeline/scripts/monitor.sh
- coding-workflow/scripts/monitor.sh
- Updated SKILL.md documentation

**Benefits:**
- Zero wasted polling after completion
- Automatic cleanup if state files manually deleted
- Graceful handling of crashed pipelines
- Fallback search by name if env var missing (backwards compatible)

---

## 📊 Complete Audit Results

### cicd-pipeline Scripts Status
- ✅ building_local.sh — **COMPLETE**
- ✅ pushing.sh — **COMPLETE**
- ✅ ci_building.sh — **COMPLETE**
- ✅ e2e_running.sh — **COMPLETE** (fixed IAP detection)
- ✅ e2e_timeout_retry.sh — **COMPLETE**
- ✅ e2e_verifying.sh — **COMPLETE** (fixed routing)
- ✅ done.sh — **COMPLETE** (improved archiving)
- ✅ escalated.sh — **COMPLETE** (improved archiving)
- ✅ failed.sh — **COMPLETE** (improved archiving)

**Coverage:** 100% of critical path implemented

### coding-workflow Scripts Status
- ✅ testing.sh — **COMPLETE**
- 📝 coding.sh, building.sh, fixing.sh, done.sh, escalated.sh — **Agent fallback**

**Coverage:** 1/6 scripts implemented (agent handles rest)

---

## 🔧 Commits Summary

| Commit | Description | Impact |
|--------|-------------|--------|
| `5269da6` | Fix step routing bugs | High — prevents broken merges, saves fix attempts |
| `4ae45b5` | Improve state archiving | High — never lose debug context |
| `1cf6618` | Add cron self-disabling | Medium — eliminates wasteful polling |

---

## 🎓 Lessons Learned

### 1. State Machine Discipline
- **Always route to full regression test** after partial fixes pass
- **Fail-fast on infrastructure issues** — don't waste fix attempts on permissions
- **Terminal states must clean up** — disable cron, kill tmux, archive state

### 2. Archiving Best Practices
- **Atomic operations** — use `mv`, not `cp` + `rm`
- **Organize by date** — easier browsing and cleanup
- **Rich context in names** — service, timestamp, status
- **Dedicated directories** — don't clutter workspace

### 3. Cron Job Hygiene
- **Self-disabling when idle** — prevent wasteful polling
- **Pass own ID via env var** — enables self-management
- **Fallback discovery** — search by name if env var missing
- **Terminal states disable cron** — primary cleanup mechanism

### 4. Safety Nets
Monitor self-disabling is a **safety net** for edge cases:
- State file manually deleted
- Pipeline crashes before terminal state
- Terminal script fails to disable cron

Terminal state scripts are the **primary cleanup** mechanism.

---

## 📝 Documentation Updated

1. **cicd-pipeline/SKILL.md:**
   - Added State Archiving section with examples
   - Updated cron creation with MONITOR_CRON_ID pattern
   - Documented archive location and jq queries

2. **coding-workflow/SKILL.md:**
   - Updated cron creation with MONITOR_CRON_ID pattern
   - Aligned with cicd-pipeline documentation

3. **step-patterns-audit.md:**
   - Complete requirements checklist
   - Identified issues before fixing
   - Recommended fixes (all applied)

---

## ✅ System Status

**All critical issues resolved:**
- ✅ Step routing bugs fixed
- ✅ State archiving improved (atomic + organized)
- ✅ Monitor cron self-disabling implemented
- ✅ Documentation updated

**Ready for production pipeline runs.**

---

## 🔮 Future Enhancements (Optional)

### Phase 2: Crash-Resilient Snapshots
Add periodic snapshots in monitor.sh for pipelines that crash before terminal states:

```bash
# After each step execution:
mkdir -p ~/.openclaw/workspace/pipeline-snapshots
cp "$STATE_FILE" ~/.openclaw/workspace/pipeline-snapshots/cicd-pipeline-snapshot-latest.json
```

**Benefits:**
- Recover last known state after crash
- Debugging mid-run issues
- Manual resume capability

**Priority:** Low (terminal archiving is usually sufficient)

---

## 📦 Files Changed

```
skills/cicd-pipeline/
├── SKILL.md (archiving docs, cron pattern)
├── scripts/
│   ├── monitor.sh (self-disabling logic)
│   └── steps/
│       ├── done.sh (atomic archiving)
│       ├── escalated.sh (atomic archiving)
│       ├── failed.sh (atomic archiving)
│       ├── e2e_running.sh (IAP detection)
│       └── e2e_verifying.sh (routing fix)

skills/coding-workflow/
├── SKILL.md (cron pattern)
└── scripts/
    └── monitor.sh (self-disabling logic)
```

**Total:** 10 files modified, 3 commits, 247 lines changed
