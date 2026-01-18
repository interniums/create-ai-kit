# Agent Guide

> **Your onboarding manual.** Read this first to understand the project, then use the Documentation Index to find detailed information.

## Project Overview

<!-- AI_FILL: Summarize the project based on package.json and file structure.
     Include: what is built, tech stack, key libraries. -->

---

## Documentation Index

Use this table to find relevant documentation. **Read the docs before modifying core systems.**

| Keywords | Documentation | When to Read |
| :------- | :------------ | :----------- |

<!-- AI_FILL: detailed table of documentation files based on project structure -->

---

## Architecture Quick Reference

```
src/
<!-- AI_FILL: ASCII tree of the src/ directory structure -->
```

**Feature Module Pattern:**

<!-- AI_FILL: Describe the feature module pattern if detected, or the primary architectural pattern used. -->

---

## Intelligent Dissent Protocol

You are authorized—and encouraged—to **challenge** documented patterns when you identify a solution that is:

1. **More secure** (fixes a vulnerability, improves auth)
2. **More performant** (reduces bundle size, improves load time)
3. **More modern** (uses newer React patterns, better TypeScript)
4. **Simpler** (removes unnecessary abstraction)

### How to Dissent

When you find a better approach:

1. **Acknowledge the documented pattern**: "The docs recommend X..."
2. **Present your alternative**: "However, I suggest Y because..."
3. **Explain the tradeoff**: Security/performance/maintainability gains vs. migration cost
4. **Ask for permission**: "Should I proceed with the modern approach?"

---

## Documentation Policy

**DO NOT** update documentation in real-time during feature development. This creates noise, merge conflicts, and token waste.

**Instead:** Use the batch update workflow.

**When making significant changes** (new exports, breaking changes, new patterns), add a marker comment:

```typescript
// @docs-update(2024-01-15: src/services/auth/DOCS.md - Added OAuth support)
// @docs-update(2024-01-15: docs/auth.md - New provider added)
```

These markers are automatically found during weekly updates.

---

## Critical Anti-Patterns

> **Full reference:** `docs/anti-patterns.md`

Never do these, regardless of what seems convenient:

<!-- AI_FILL: Extract or generate a table of critical anti-patterns relevant to the tech stack (e.g. React, Node, Python). -->

---

## Command Flow

```
Task unclear? → /discuss → /plan → /review → /build → /verify → /commit
Bug found? → /fix (obvious) or /debug (unclear) → /verify
Existing code? → /explain → then /refactor or /build
Hydration done? → /hydrate-check
Code review? → /verify
Plan validation? → /review
```

**Quick reference:**

| Command          | When to Use                                   |
| :--------------- | :-------------------------------------------- |
| `/plan`          | Large/ambiguous task, architectural decision  |
| `/review`        | After `/plan`, validate before implementation |
| `/build`         | Well-defined task, after planning             |
| `/fix`           | Obvious bug, clear root cause                 |
| `/debug`         | Unclear bug, needs investigation              |
| `/verify`        | Code review, before commit                    |
| `/hydrate-check` | Hydration placeholder scan                    |
| `/refactor`      | Improve existing code quality                 |
| `/explain`       | Understand existing code                      |

---

## File Discovery

When you need to find files:

- **Inline docs**: Look for `DOCS.md` in the folder you're working in
- **Baseline docs**: Check `docs/` for architecture overviews
- **File headers**: Some files have `@docs` comments pointing to docs
