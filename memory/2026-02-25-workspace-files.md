# Session: 2026-02-25 04:56:58 UTC

- **Session Key**: agent:main:telegram:default:direct:1285568720
- **Session ID**: 5f46c033-cc16-4a33-b6e5-77bdd5317920
- **Source**: telegram

## Conversation Summary

user: why did you not read it? I thought AGENTS.md was loaded at every new session
assistant: You're right, I apologize. The workspace AGENTS.md explicitly says to read `~/.openclaw/shared/office-openclaw/AGENTS.md` at session start, but I only read the local workspace context that was injected. I should have read the shared file proactively — my bad.
user: have you read the SOUL.md?
assistant: Yes — SOUL.md was included in the workspace context at the top of this session. I read it along with AGENTS.md, USER.md, TOOLS.md, etc. It's the "who I am" file with the core truths, boundaries, and vibe guidance.
user: can you debug why is the ~/.openclaw/shared/office-openclaw/AGENTS.md not read during new session start?
assistant: Good question. Let me investigate how OpenClaw determines which files to load at session start.

assistant: Found the issue. The workspace AGENTS.md explicitly says to read `~/.openclaw/shared/office-openclaw/AGENTS.md` in step 5 of the session startup, but:

**The workspace context injection only loads files from the workspace directory** (`/home/exoulster/.openclaw/workspace/`). Files outside that directory aren't automatically included.

The shared AGENTS.md at `~/.openclaw/shared/office-openclaw/AGENTS.md` is not in the workspace — it's in a sibling `shared/office-openclaw/` directory, so it never gets injected.

**Options to fix:**

1. **Symlink** the shared AGENTS.md into the workspace: `ln -s ~/.openclaw/shared/office-openclaw/AGENTS.md /home/exoulster/.openclaw/workspace/SHARED_AGENTS.md`
2. **Copy** it to workspace on setup/sync
3. **Update the workspace AGENTS.md** to note this must be done manually (less ideal)
4. **Add a bootstrap hook** in OpenClaw to inject additional files

Which would you prefer?
user: can you research openclaw official document and github to confirm?
assistant: Confirmed. The OpenClaw source code shows:

**`loadWorkspaceBootstrapFiles()`** in `src/agents/workspace.ts` only loads from the **workspace directory** (`~/.openclaw/workspace`):

```typescript
const resolvedDir = resolveUserPath(dir);
const entries = [
  { name: DEFAULT_AGENTS_FILENAME, filePath: path.join(resolvedDir, DEFAULT_AGENTS_FILENAME) },
  // ... other files
]
```

There's no built-in mechanism to inject files from `~/.openclaw/shared/` or other directories into the bootstrap context.

**This is by design** — OpenClaw treats the workspace as an isolated unit. The shared AGENTS.md at `~/.openclaw/shared/office-openclaw/AGENTS.md` is a sibling directory, not part of the workspace.

**Your options:**
1. **Symlink** it into the workspace (quick fix)
2. **Copy** it during setup (e.g., in a sync script)
3. **Request a feature** in OpenClaw to support extra bootstrap directories

Want me to create a symlink to fix this?
user: can we use relative path?
assistant: The bootstrap system doesn't support relative paths to external files — it only looks for files by name inside the workspace directory.

But you could:

1. **Symlink** the shared file into workspace:
   ```bash
   ln -s ~/.openclaw/shared/office-openclaw/AGENTS.md /home/exoulster/.openclaw/workspace/SHARED_AGENTS.md
   ```

2. **Or use a different filename** — create a symlink with a different name so it doesn't conflict:
   ```bash
   ln -s ~/.openclaw/shared/office-openclaw/AGENTS.md /home/exoulster/.openclaw/workspace/OFFICE_AGENTS.md
   ```

The second option might be cleaner since you'd have both `AGENTS.md` (workspace-specific) and `OFFICE_AGENTS.md` (shared).

Want me to set that up?
user: ok. let's do symlink
assistant: Done! Symlink created at `workspace/SHARED_AGENTS.md`.

**But a caveat:** OpenClaw only auto-injects files with specific names (AGENTS.md, SOUL.md, etc.). SHARED_AGENTS.md won't be auto-loaded into session context.

You'll need to either:
1. **Manually read it** at session start
2. **Or update workspace AGENTS.md** to include a note telling future sessions to read SHARED_AGENTS.md

Want me to update the workspace AGENTS.md to add that instruction?
user: 2. update workspace AGENTS.md
assistant: Done! Updated step 5 to mention the symlink. Now future sessions will know to read SHARED_AGENTS.md from the workspace.
