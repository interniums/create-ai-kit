# Agent Guide

> **Your onboarding manual.** Read this first to understand the project, then use the Documentation Index to find detailed information.

## Project Overview

<!-- AI_FILL: Summarize the project based on package.json and file structure.
     Include: what is built, tech stack, key libraries.
     Keep each AI_FILL block short (aim for ~5-15 lines). -->

---

## Machine-Readable Schema

<!-- AI_KIT_SCHEMA_START -->

```yaml
aiKitSchemaVersion: 1
project:
  name: 'AI_FILL: project name'
  type: 'AI_FILL: app/service/library'
stack:
  primary: 'AI_FILL: primary framework'
  languages: ['AI_FILL: language list']
entrypoints:
  - 'AI_FILL: entry file or command'
docs:
  index: 'docs/README.md'
  domainsRoot: 'docs/domains'
  updateWorkflow: 'scripts/docs-update/README.md'
```

<!-- AI_KIT_SCHEMA_END -->

---

## Documentation Index

Use this table to find relevant documentation. **Read the docs before modifying core systems.**

| Keywords                       | Documentation                                       | When to Read                            |
| :----------------------------- | :-------------------------------------------------- | :-------------------------------------- |
| `example`, `domain`, `service` | `docs/domains/<domain>.md` → `src/<domain>/DOCS.md` | Example format — replace with real docs |

<!-- AI_FILL: detailed table of documentation files based on project structure -->

Use keywords that show up in requests (feature names, services, flows). Start with `docs/README.md` for the docs system overview.

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
// @docs-update(2024-01-15): src/services/auth/DOCS.md - Added OAuth support
// @docs-update(2024-01-15): docs/auth.md - New provider added
```

Markers are the default for doc-worthy changes and are auto-added during `/build` and `/commit`.
Keep 1–3 markers per commit to avoid spam.
Manual shortcut: use the VS Code snippet `docs-upd`.

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
Hydration done? → /hydrate-verify
Code review? → /verify
Plan validation? → /review
```

**Quick reference:**

| Command           | When to Use                                            |
| :---------------- | :----------------------------------------------------- |
| `/plan`           | Large/ambiguous task, architectural decision           |
| `/review`         | After `/plan`, validate before implementation          |
| `/build`          | Well-defined task, after planning                      |
| `/fix`            | Obvious bug, clear root cause                          |
| `/debug`          | Unclear bug, needs investigation                       |
| `/verify`         | Code review, before commit                             |
| `/hydrate-verify` | Hydration verification (files + config + placeholders) |
| `/refactor`       | Improve existing code quality                          |
| `/explain`        | Understand existing code                               |

---

## File Discovery

When you need to find files:

- **Inline docs**: Look for `DOCS.md` in the folder you're working in
- **Baseline docs**: Check `docs/` for architecture overviews
- **Domain docs**: Start at `docs/domains/README.md`, then `docs/domains/<domain>.md`
- **File headers**: Some files have `@docs` comments pointing to docs
