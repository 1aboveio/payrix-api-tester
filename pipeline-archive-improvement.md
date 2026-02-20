# Pipeline State Archiving Improvement Proposal

## Problem
Current terminal state scripts (done.sh, escalated.sh, failed.sh) archive state files but:
1. Archives go to workspace root → hard to find among other files
2. `cp` then `rm` is not atomic → can lose state if interrupted
3. No archiving for crashed/interrupted pipelines
4. Minimal context in archive names (just timestamp + status)

## Proposed Solution

### 1. Dedicated Archive Directory
```bash
ARCHIVE_DIR="${HOME}/.openclaw/workspace/pipeline-archive"
mkdir -p "$ARCHIVE_DIR"
```

Structure:
```
~/.openclaw/workspace/pipeline-archive/
├── 2026-02-20/
│   ├── cicd-pipeline-071234-cover-gen-dev-success.json
│   ├── cicd-pipeline-143052-a1-api-dev-escalated.json
│   └── coding-workflow-091823-myproject-done.json
└── 2026-02-19/
    └── cicd-pipeline-234501-cover-gen-dev-failed.json
```

### 2. Atomic Move Instead of Copy+Delete
```bash
# OLD (not atomic):
cp "$STATE_FILE" "$archive_path"
rm -f "$STATE_FILE"

# NEW (atomic):
mv "$STATE_FILE" "$archive_path"
```

If `mv` fails, original state preserved. No risk of losing data.

### 3. Richer Archive Names
```bash
# OLD: cicd-pipeline-state-20260220-071234-success.json
# NEW: cicd-pipeline-071234-cover-gen-dev-success.json
#      └─ workflow    └─ time  └─ context   └─ status

# Include:
local branch=$(get_state_field "branch")
local service=$(get_state_field "service")
local timestamp=$(date +%H%M%S)
local date_dir="${ARCHIVE_DIR}/$(date +%Y-%m-%d)"

mkdir -p "$date_dir"

# For cicd-pipeline:
local archive_name="cicd-pipeline-${timestamp}-${service}-${status}.json"

# For coding-workflow:
local project_name=$(basename "$(get_state_field "projectDir")")
local archive_name="coding-workflow-${timestamp}-${project_name}-${status}.json"
```

### 4. Pre-Terminal Archiving in Monitor

Add periodic archiving to `monitor.sh` so crashed pipelines leave a trace:

```bash
# In monitor.sh, after each step execution:
archive_state_snapshot() {
    local current_step=$(get_state_field "step")
    local snapshot_dir="${HOME}/.openclaw/workspace/pipeline-snapshots"
    mkdir -p "$snapshot_dir"
    
    # Keep only last 3 snapshots (rotate)
    local snapshot_name="cicd-pipeline-snapshot-${current_step}.json"
    cp "$STATE_FILE" "${snapshot_dir}/${snapshot_name}" 2>/dev/null || true
}
```

Snapshots directory has **latest state from each step**. If pipeline crashes:
- Check `pipeline-snapshots/` for last known state
- Move to archive manually or via cleanup script

### 5. Cleanup Command

Add to SKILL.md:

```bash
# List recent archives
ls -lth ~/.openclaw/workspace/pipeline-archive/*/*.json | head -20

# View specific archived state
jq . ~/.openclaw/workspace/pipeline-archive/2026-02-20/cicd-pipeline-071234-cover-gen-dev-failed.json

# Clean up old archives (keep last 30 days)
find ~/.openclaw/workspace/pipeline-archive -type f -name "*.json" -mtime +30 -delete
find ~/.openclaw/workspace/pipeline-archive -type d -empty -delete
```

---

## Implementation Plan

### Phase 1: Terminal State Archiving (High Priority)
- [x] Update done.sh, escalated.sh, failed.sh in cicd-pipeline
- [ ] Update done.sh, escalated.sh in coding-workflow
- [ ] Test atomic move behavior
- [ ] Verify archives created correctly

### Phase 2: Monitor Snapshots (Medium Priority)
- [ ] Add snapshot logic to monitor.sh (both workflows)
- [ ] Implement rotation (keep last 3 snapshots per workflow)
- [ ] Test crash recovery

### Phase 3: Documentation (Low Priority)
- [ ] Update SKILL.md with archive locations
- [ ] Add troubleshooting section with jq queries
- [ ] Document cleanup commands

---

## Benefits

1. **Never lose state** — atomic move + organized storage
2. **Easy debugging** — richer filenames, organized by date
3. **Crash resilience** — snapshots capture intermediate states
4. **Clean workspace** — archives in dedicated directory
5. **Audit trail** — can review pipeline history by date

---

## Migration Notes

Existing behavior is backwards-compatible:
- Old archives (if any) stay in workspace root
- New archives go to pipeline-archive/
- No breaking changes to state file format
