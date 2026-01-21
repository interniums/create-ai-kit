# Verify

Code review and safety check.

## Scope

Files touched in current task, or files explicitly mentioned.

## When to Use

- After `/build`, before committing
- For PR review

## Fast Path

If the change touches 1–2 files, keep output brief and skip redundant checklist items.

## Protocol

1. **Plan Compliance (if plan exists):** Cross-check implementation against the original plan:
   - All planned steps implemented?
   - Any requirements missed or partially done?
   - Scope respected (no unplanned changes)?
   - Edge cases from plan addressed?

   _Skip if: no plan exists (quick fix, ad-hoc task)_

2. **Static Analysis:** Check for unused imports, dead code, type mismatches.

3. **Logic Check:** Look for:
   - Race conditions, unhandled promises, infinite loops
   - **Security:** Input sanitization on user data, auth checks on new API routes, exposed secrets, SQL/NoSQL injection vectors, XSS in rendered content

4. **Convention Check:** Match against project patterns:
   - Component patterns, handler extraction
   - Type conventions, naming
   - API handler patterns
   - Route building patterns

5. **Anti-Pattern Check:** Verify against `AGENTS.md` → Critical Anti-Patterns.

6. **Project Risk Checks (apply when relevant):**

<!-- AI_FILL: Add project specific risk checks (e.g. payments, analytics, etc.) -->

7. **Local Checks:**
   - Run lint check if it exists — must pass
   - Run type check if it exists — must pass
   - Run hydrate verify — `npm run ai-kit:verify` (or `node scripts/hydrate-verify.js`)
   - Manually verify behavior changes (check UI, API responses, database state, etc.)

8. **Auto-Fix Before Reporting:**

   If a CRITICAL or WARN issue is **deterministically fixable** (e.g., unused import, missing type, obvious typo), **fix it immediately** before generating the report. Only report issues that require human judgment or design decisions.

   _Deterministic fixes:_ unused imports, missing `async`/`await`, obvious type narrowing, lint auto-fixes
   _Non-deterministic (report only):_ architecture concerns, naming debates, missing error handling strategy

## Output Format

```markdown
## Verification: [File/Feature Name]

### Plan Compliance

- [x] All planned steps implemented
- [x] No requirements missed
- [x] Scope respected
- [x] Edge cases addressed
- (or: "No plan—ad-hoc task")

### Files Checked

- `path/to/file.ts`

### Auto-Fixed

- [List of issues fixed automatically, or "None"]

### Findings

**CRITICAL** (must fix)

- [ ] Issue description → suggested fix

**WARN** (should fix)

- [ ] Issue description → suggested fix

**INFO** (nice to have)

- [ ] Issue description → suggested fix

### Manual Verification

- [x] Behavior verified manually (describe what was checked)

### Summary

- Critical: N | Warn: N | Info: N
- Auto-fixed: N
- Verdict: PASS / NEEDS FIXES
```

## Project Scripts

<!-- AI_FILL: Add project specific scripts here -->
