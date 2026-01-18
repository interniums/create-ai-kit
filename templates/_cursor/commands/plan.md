# Plan

Create an architectural blueprint before coding.

## When to Use

- New features or multi-file changes
- Unclear requirements that need breakdown
- Skip if: single-file change with < 3 obvious steps

## Protocol

1. **Read Context:**

   - Read `AGENTS.md` → use the Documentation Index to find relevant docs
   - Match task keywords to docs (e.g., "auth" → `docs/auth.md` → `src/services/auth/DOCS.md`)
   - Check inline `DOCS.md` in folders you'll touch

2. **Verify Against Code (required):**

   - Read actual type definitions and interfaces in `src/` that the plan depends on
   - If docs contradict code, **code wins**—note the discrepancy and plan based on actual signatures
   - Check existing implementations for behavior assumptions

3. **Deep Analysis:**

   - **Corner Cases:** Empty/null, race conditions, boundaries (min/max/zero), partial failures, network timeouts
   - **Security:** Auth at each boundary, input validation, data exposure, rate limiting needs
   - **Performance:** Query complexity, bundle impact, caching strategy, server load
   - **Data Integrity:** Transaction boundaries, consistency, race conditions, late webhooks
   - **Risks:** Probability × Impact, mitigation strategies, rollback plan
   - **Backward Compatibility:** Breaking changes, migration path, feature flags

4. **Output:** Generate a Markdown checklist of implementation steps

5. **Constraint Check:** Verify against `AGENTS.md` → Critical Anti-Patterns table

6. **Blockers:** List any missing information or decisions needed

## Output Format

```markdown
## Plan: [Task Name]

### Context Read

- [x] AGENTS.md
- [x] [relevant DOCS.md files]
- [x] Verified interfaces in src/ (list key files checked)

### Implementation Steps

- [ ] Step 1: ...
- [ ] Step 2: ...

### Corner Cases Analyzed

- [ ] Null/undefined/empty states
- [ ] Concurrent operations & race conditions
- [ ] Network failures & timeouts
- [ ] Partial failures (what if step X fails mid-flow?)
- [ ] Boundary values (zero, max, overflow)

### Security Review

- [ ] Auth/authorization at each boundary
- [ ] Input validation & sanitization
- [ ] Data exposure risks identified
- [ ] CSRF/XSS vectors checked

### Performance Impact

- Query complexity: [N+1 risks, indexing needs]
- Bundle size: [KB added, lazy loading plan]
- Caching: [what to cache, invalidation strategy]
- Server load: [concurrent users, rate limiting]

### Data Integrity

- Transaction boundaries: [where rollback needed]
- Consistency model: [eventual vs strong]
- Race condition handling: [optimistic locking, retries]

### Risks & Mitigation

| Risk | Impact | Probability | Mitigation | Rollback Plan |
| --- | --- | --- | --- | --- |
| ... | High/Med/Low | High/Med/Low | ... | ... |

### Backward Compatibility

- [ ] Breaking changes: [none / list them]
- [ ] Migration needed: [yes/no, what data/code]
- [ ] Feature flag: [yes/no, flag name]

### Verification Strategy

- [ ] Manual check: [e.g., "verify via API call", "check UI state", "test payment flow"]

### Anti-Pattern Check

- [ ] No `any` types needed
- [ ] Using route builders (not hardcoded URLs)
- [ ] No inline handler logic

### Blockers (if any)

- Need clarification on: ...
```

## Parameters

### `force`

Proceed past blockers by making assumptions. Use with caution.

- **Required:** List every assumption explicitly in the plan under a `### Assumptions Made` section
- **Forbidden:** Do not assume API shapes, auth flows, or data schemas—these must be verified in code
- **Example:** `/plan force implement user authentication`
