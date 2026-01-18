# Review

Validate a plan before implementation.

## When to Use

- After `/plan`, before `/build`
- When plan feels incomplete or over-engineered
- For complex multi-step implementations
- Skip if: plan is trivial (1-2 obvious steps)

## Protocol

Run through this checklist systematically:

| Category          | Checks                                                       | How to Verify                                                   |
| ----------------- | ------------------------------------------------------------ | --------------------------------------------------------------- |
| **Completeness**  | All requirements mapped to steps? Missing functionality?     | List requirements → check each has a step                       |
| **Order**         | Dependencies respected? Optimal sequence?                    | Draw dependency graph, check if earlier steps enable later ones |
| **Redundancy**    | Duplicate steps? Unnecessary work?                           | Look for repeated actions or overlapping steps                  |
| **Edge Cases**    | Error paths handled? Boundary conditions? Rollback strategy? | Check plan mentions: null/empty, failures, timeouts, rollback   |
| **Risks**         | All risks identified? Mitigation strategies adequate?        | Each risk has: probability, impact, mitigation, rollback        |
| **Verification**  | Test plan covers critical paths? Manual checks specified?    | Check plan has verification steps for key functionality         |
| **Scope**         | Matches requirements? Over/under-engineered?                 | Compare implementation complexity to problem complexity         |
| **Context**       | All relevant docs were read? Code verified against docs?     | Check "Context Read" section lists relevant docs                |
| **Anti-patterns** | Plan avoids documented anti-patterns from `AGENTS.md`?       | Cross-reference against Critical Anti-Patterns table            |
| **Blockers**      | Blockers truly blocking? Can any be resolved now?            | For each blocker, can it be answered with docs or code read?    |

## Specific Checks by Category

### Completeness

- List all user requirements
- For each requirement, find the corresponding implementation step
- Check for implicit requirements (auth, logging, error handling, analytics)

### Order

- Identify dependencies: "Step B needs Step A to be done first"
- Check if database migrations come before code that uses new schema
- Verify feature flags are set up before code that uses them

### Edge Cases

- Null/undefined/empty values handled?
- Network failures, timeouts, retries?
- Concurrent operations (what if two users do X at same time)?
- Partial failures (what if step 3 of 5 fails)?
- Rollback plan exists?

### Risks

- Each risk should have:
  - Impact (High/Med/Low)
  - Probability (High/Med/Low)
  - Mitigation strategy
  - Rollback plan
- High-impact risks must have mitigation

### Security

- Auth/authorization at each boundary?
- Input validation on all user data?
- No sensitive data exposure?
- CSRF/XSS vectors checked?

### Performance

- Will this cause N+1 queries?
- Bundle size impact acceptable?
- Caching strategy considered?
- Server load under concurrent users?

## Output Format

```markdown
## Review: [Plan Name]

### Checklist

- [x] Completeness - all requirements covered
- [x] Order - dependencies respected
- [ ] Redundancy - found issues
- [x] Edge Cases - error handling specified
- [x] Risks - identified with mitigations
- [x] Verification - test plan included
- [x] Scope - appropriate for requirements
- [x] Context - relevant docs read
- [x] Anti-patterns - none detected
- [x] Blockers - none blocking

### Findings

**MISSING** (must add before building)

- [ ] Issue description → Suggested addition

**OPTIMIZE** (recommended improvements)

- [ ] Issue description → Suggested change

**WARN** (potential risks to monitor)

- [ ] Issue description → Mitigation strategy

### Verdict

APPROVED / NEEDS REVISION [with reason]
```

## Guidelines

1. **Be Specific:** Don't just say "edge cases missing" — specify which ones.

2. **Prioritize:** Focus on issues that would cause rework if discovered during build.

3. **Quick Wins:** Note any optimizations that are trivial to add now but would be annoying later.

4. **Read Referenced Docs:** If plan mentions docs, verify the plan matches what docs say.

5. **Anti-Pattern Check:** Cross-reference against `AGENTS.md` Critical Anti-Patterns table.

6. **Execute Checks:** Don't assume - actually verify each checklist item.

## Example Review

```markdown
## Review: Add Auth Support

### Checklist

- [x] Completeness - all flows covered
- [x] Order - dependencies respected
- [x] Redundancy - no duplicates
- [ ] Edge Cases - missing fallback
- [x] Risks - identified
- [x] Verification - test plan included
- [x] Scope - matches requirements
- [x] Context - docs/auth.md read
- [x] Anti-patterns - none
- [x] Blockers - none

### Findings

**MISSING**

- [ ] Fallback for unsupported browsers → Add detection
- [ ] What happens if user cancels dialog? → Add cancellation handling

**OPTIMIZE**

- [ ] Steps 3 and 4 can be combined → Single PR for API endpoint + webhook handler

**WARN**

- [ ] Sandbox testing requires setup → Document manual test procedure

### Verdict

NEEDS REVISION - Add browser fallback and cancellation handling before building
```

## Comparison with `/verify`

| Aspect      | `/review`                  | `/verify`                    |
| ----------- | -------------------------- | ---------------------------- |
| **Stage**   | After plan, before build   | After build, before commit   |
| **Input**   | Plan document              | Code files                   |
| **Focus**   | Completeness, order, scope | Logic, security, conventions |
| **Output**  | MISSING/OPTIMIZE/WARN      | CRITICAL/WARN/INFO           |
| **Verdict** | APPROVED / NEEDS REVISION  | PASS / NEEDS FIXES           |
