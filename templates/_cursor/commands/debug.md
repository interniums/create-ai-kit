# Debug

Root cause analysis for non-obvious issues.

## When to Use

- Error origin unclear
- Unexpected behavior
- Investigation needed

## Debugging Strategy

### 1. **Classify the Issue**

| Type | Characteristics | Tools | Strategy |
| --- | --- | --- | --- |
| **Known Error** | Stack trace, error message | Read error, check line | Direct to source |
| **Mystery** | Works sometimes, fails others | Logging, reproduction | Hypothesis-driven |
| **Performance** | Slow, frozen, memory leak | Profiler, Network tab | Measure first |
| **Hydration** | "Text content mismatch" | Browser console | SSR vs client diff |

### 2. **Gather Evidence**

- **Read terminal output / error messages** (exact text, not paraphrased)
- **Check logs:** Server logs, browser console, network requests
- **Identify trigger:** What input/action causes it? Is it reproducible?
- **Note expectations:** What should happen vs. what actually happened?

### 3. **Reproduce**

Create minimal reproduction case:

- Isolate the minimal steps to trigger the issue
- Remove unrelated code/actions
- Document: "Open page X → click Y → error appears"

### 4. **Form Hypotheses (Multiple)**

List 2-3 possible causes, ordered by likelihood:

1. Hypothesis A: [most likely cause]
2. Hypothesis B: [alternative]
3. Hypothesis C: [edge case]

### 5. **Test Hypotheses (Binary Search)**

Use logging/breakpoints to narrow down:

- **Logging strategy:** Add logs at boundaries (function entry/exit, before/after async operations)
- **Binary search:** If 10 steps, log at step 5. If works until 5, problem is in 6-10. Repeat.
- **Tools:**
  - Browser DevTools: Console, Network, Performance
  - Server: logger logs, API route debugging
  - Framework Logs: Check terminal output

### 6. **Root Cause**

- **Why:** One sentence explaining the fundamental reason (e.g., "Race condition between auth check and redirect")
- **How:** The code-level mechanism (e.g., "`user` is fetched async but accessed sync before promise resolves")

### 7. **Fix**

Provide the corrected code block with explanation of what changed.

### 8. **Verify**

- Reproduction steps: "To verify, do X and confirm Y no longer happens"
- Run checks (lint/types) to confirm no errors
- Check browser console / network tab for the error
- The fix is not complete until verification is defined.

### 9. **Prevention**

Suggest a type, guard, test, or rule to prevent this class of error.

## Output Format

```markdown
## Debug: [Error/Issue Summary]

### Evidence

- Error: `[exact error message]`
- Location: `path/to/file.ts:line`
- Expected: [what should happen]
- Actual: [what actually happened]
- Reproducible: [always/sometimes/once]

### Reproduction Steps

1. [Step 1]
2. [Step 2]
3. [Error appears]

### Hypotheses

1. [Most likely] - [reasoning]
2. [Alternative] - [reasoning]
3. [Edge case] - [reasoning]

### Investigation

- Tested hypothesis 1: [result]
- Tested hypothesis 2: [result]
- **Confirmed:** [which hypothesis was correct]

### Root Cause

**Why:** [One sentence: the fundamental reason]

**How:** [Code-level mechanism: what specifically went wrong]

### Fix

[Code block with correction + brief explanation]

### Verification

[Steps to confirm the fix works - reproduction, test command, or manual check]

### Prevention

[Type/guard/test/rule to prevent recurrence]
```

## Framework-Specific Issues

| Error | Likely Cause | Fix |
| --- | --- | --- |
| Hydration mismatch | Server/client render difference | Check `typeof window`, Date.now(), Math.random(), conditional rendering |
| "Cannot read property of undefined" in SSR | Client-only API (window, localStorage) | Add `typeof window !== 'undefined'` guard |
| Middleware infinite loop | Redirect to same URL | Check middleware logic, add conditions |
| API route CORS error | Missing CORS headers | Add CORS middleware to API route |
| Server timeout | Slow database query, external API | Add timeout, check query performance |

## Common Debugging Patterns

| Symptom | Likely Cause | Check |
| --- | --- | --- |
| "undefined is not a function" | Missing import or wrong export | Check import path, named vs default export |
| "Cannot read property X of undefined" | Async data accessed before load | Check loading states, optional chaining |
| "Hydration mismatch" | Server/client render difference | Check for `typeof window`, date/random usage |
| "Network error" | CORS, wrong URL, server down | Check browser Network tab, API route exists |
| Silent failure | Swallowed error in catch block | Check for empty catch blocks, add logging |
