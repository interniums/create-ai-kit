# Commit

Create a git commit from current working tree changes.

## When to Use

- User explicitly requests a commit

## Commit Quality Framework

### Atomic Commits

A commit should be **one logical change**:

✅ **Good:**

- "Add user authentication flow" (new feature, complete)
- "Fix race condition in webhook" (one bug fix)
- "Refactor helpers for clarity" (one refactoring pattern)

❌ **Bad:**

- "Add auth + fix bug + refactor utils" (three unrelated changes)
- "WIP stuff" (incomplete change)
- "Update files" (no context)

### When to Split Commits

Split across multiple commits if:

- Multiple independent bug fixes
- Feature + unrelated refactoring
- Multiple files from different domains with no connection
- Changes that should be revertable independently

Keep as single commit if:

- Changes are interdependent (won't work without each other)
- Same logical feature across multiple files
- Refactoring + tests for that refactoring

### Commit Message Quality

**Structure:**

```
<type>: <subject>

[optional body]
```

**Types** (match project convention - check git log):

- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code improvement, no behavior change
- `docs`: Documentation only
- `style`: Formatting, no code change
- `test`: Adding/updating tests
- `chore`: Build, dependencies, tooling

**Subject line:**

- Imperative mood ("Add feature" not "Added feature")
- Under 72 characters
- No period at end
- Describe "why" if not obvious from "what"

**Body** (optional, but recommended for complex changes):

- Explain motivation for change
- Describe approach if not obvious
- Note breaking changes or migration needs

## Protocol

1. **Review changes:**
   - Run `git status` to see all changed/untracked files
   - Run `git diff` to review the actual content being committed
   - Run `git log --oneline -n 5` to see recent commit message style

2. **Docs impact check (marker before commit):**
   - Review the diff for public behavior changes, new exports, or contract changes
   - If docs need updates, add a dated marker in the changed code:
     `// @docs-update(YYYY-MM-DD: short reason and doc path)`
   - Keep markers focused (max 1–3 per commit) and avoid marker spam

3. **Security check:** Scan for secrets in both filenames AND diff content.
   - **Suspicious files:** `.env`, `credentials.json`, `*.pem`, `*.key`, config files with "secret" in name
   - **Suspicious patterns in diff:** Look for high-entropy strings like:
     - `sk_live_`, `sk_test_` (Payment Provider)
     - `ghp_`, `gho_` (GitHub tokens)
     - `AKIA` (AWS keys)
     - `-----BEGIN PRIVATE KEY-----`
     - Any string that looks like `API_KEY=`, `SECRET=`, `PASSWORD=`
   - **New config files:** If adding a new config/env-like file, verify it's in `.gitignore`
   - **Action:** Warn user and STOP if secrets detected. Do not proceed without explicit approval.

4. **Atomicity check:**
   - Are these changes one logical change?
   - Can this commit be reverted cleanly without breaking other features?
   - If NO to either: suggest splitting into multiple commits

5. **PR-readiness check:**
   - Does this commit make sense in isolation?
   - Is the commit message clear about what and why?
   - Would a reviewer understand this commit without asking questions?

6. **Stage files:** Use explicit file paths, not blanket commands.
   - Prefer `git add <file1> <file2>` over `git add .`
   - This avoids accidental inclusion of logs, `.DS_Store`, temp files, or untracked files
   - If many files, list them explicitly or use `git add -p` for interactive staging

7. **Write commit message:**
   - Focus on "why", not "what" (the diff shows what)
   - Use imperative mood ("Add feature" not "Added feature")
   - Keep first line under 72 characters
   - Match the convention from step 1 (check git log)
   - Add body if: complex change, breaking change, non-obvious motivation

8. **Do NOT push** unless the user explicitly asks.

## Git Safety

- Never use `--force` or `--no-verify` unless explicitly requested
- Never amend commits that have been pushed
- Never update git config
- If in doubt about what to stage, ask the user

## Output Format

```markdown
## Commit Plan

### Files to Stage

- `path/to/file1.ts`
- `path/to/file2.ts`

### Atomicity Check

- [x] Single logical change
- [x] Can be reverted independently
- [x] Complete (not WIP)

### Security Check

- [x] No secrets detected
- [x] Config files in .gitignore

### Commit Message

**Type:** [feat/fix/refactor/docs/etc]

**Subject:** [imperative, < 72 chars]

**Body** (if needed):
[Why this change, approach, breaking changes]

### Matches Project Style

Recent commits use: [conventional commits / imperative / etc]
```
