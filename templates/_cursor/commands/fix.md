# Fix

Quick targeted correction for obvious issues.

## When to Use

- User points to exact problem, cause is clear
- Skip if: root cause unclear → use `/debug` instead

## Protocol

1. **Evidence (required):** State the exact file + line/function and the one-sentence root cause.

   - If you cannot produce this confidently, use `/debug` instead.

2. **Locate:** Find the exact line/function causing the issue.

3. **Correct:** Apply minimal change to fix the problem.

4. **Verify (both):**

   - **Syntax/Lint:** Run project lint command (e.g. `npm run lint`)
   - **Types:** Run project type-check command (e.g. `npm run type-check`)
   - **Logic:** Manually verify the bug is fixed (check UI, API response, logs, etc.)

5. **Escalate if stuck:** If the fix fails verification or introduces new issues after **one retry**, stop and escalate to `/debug`. Do not loop.

6. **Explain:** One-sentence summary of what was wrong and how it's fixed.

## Project Scripts

<!-- AI_FILL: Add project specific scripts here -->
