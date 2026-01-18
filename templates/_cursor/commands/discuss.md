# Discuss

Comparative analysis before committing to an approach.

## When to Use

- Multiple valid approaches exist
- Architectural decisions needed
- Trade-offs are unclear
- User is unsure which path to take

## Protocol

1. **Clarify the Problem:**

   - Restate the goal in one sentence
   - Identify constraints (time, existing code, team familiarity, etc.)

2. **Establish Decision Drivers:**
   Ask or infer what matters most for this decision:

   - Performance vs. simplicity?
   - Speed to ship vs. long-term maintainability?
   - Consistency with existing patterns vs. modern best practices?
   - Risk tolerance (production-critical vs. experimental)?

   State the drivers explicitly: "For this decision, I'll prioritize X over Y because Z."

3. **Present Options (2-3):**
   Include the current/proposed approach plus alternatives.
   If a more modern, secure, or performant approach exists, include it as an option (not separately).

   For each option:

   - One sentence: what it is
   - Pros (relative to decision drivers)
   - Cons (relative to decision drivers)

4. **Trade-off Table:**

   | Aspect | Option A | Option B | Option C |
   | --- | --- | --- | --- |
   | Complexity | Low | Medium | High |
   | Performance | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
   | Maintainability | ⭐⭐⭐ | ⭐⭐ | ⭐ |
   | Migration effort | None | Low | High |
   | Aligns with drivers? | ✅ | ⚠️ | ❌ |

5. **Stress Test (Devil's Advocate):**
   Now that options are visible, argue against each:

   - "Option A fails if..."
   - "Option B breaks when..."
   - "Option C requires X which we don't have..."

6. **Recommendation:**
   State preferred option with reasoning tied to decision drivers.
   Format: "Given [drivers], I recommend [Option] because [reason]."

## Output Format

```markdown
## Discussion: [Decision Summary]

### Problem

[One sentence goal + constraints]

### Decision Drivers

Prioritizing: [X] over [Y]
Because: [reason]

### Options

**Option A: [Name]**

- What: [one sentence]
- Pros: ...
- Cons: ...

**Option B: [Name]**

- What: [one sentence]
- Pros: ...
- Cons: ...

### Trade-off Table

| Aspect | Option A | Option B |
| ------ | -------- | -------- |
| ... | ... | ... |

### Stress Test

- Option A fails if: ...
- Option B fails if: ...

### Recommendation

Given [drivers], I recommend **Option [X]** because [reason].
```

## Note

This is discussion only - no code changes until the user confirms an approach.
