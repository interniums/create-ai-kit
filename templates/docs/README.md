# Documentation Index

> Overview of project documentation and update workflow.

## Purpose

<!-- AI_FILL: Describe the documentation system for this project. Include who owns it, what it covers, and how often it should be updated.
     Keep each AI_FILL block short (aim for ~5-15 lines). -->

---

## 3-Layer Docs System

- **Entry:** `AGENTS.md` (keyword index + quick reference)
- **Rules:** `.cursor/rules/*.mdc` (auto-loaded conventions)
- **Baseline:** `docs/*.md` and `docs/domains/*.md` (architecture and flows)

**How to use:**

1. Start in `AGENTS.md` and match keywords to docs.
2. Read the baseline doc before editing core systems.
3. Let rules auto-load for file-specific conventions.

**Optional inline docs:** For complex modules, add a `DOCS.md` in that folder. Keep it short and link back to the baseline doc.

---

## Documentation Map

Use this table to find the right doc quickly.

| Area | Docs | When to Read |
| :--- | :--- | :----------- |

<!-- AI_FILL: Add doc entries based on actual project structure. -->

---

## Domain Docs

Domain-level documentation lives in `docs/domains/`.
Start with `docs/domains/README.md`, then go to `docs/domains/<domain>.md`.

---

## Doc Update Workflow

Use the batch update workflow for significant changes:

1. Add a marker (default for doc-worthy changes):
   `// @docs-update(YYYY-MM-DD): path/to/doc.md - description`
2. Run `npm run docs:update` to generate context
3. Update the affected docs
4. Remove the marker

Manual shortcut: use the VS Code snippet `docs-upd` to insert the marker.

**Enforcement:**

- Days 1–7: OK
- Days 8–14: warning
- Day 15+: error

Template inputs live in `docs/templates/`.

---

**Last Updated**: <!-- AI_FILL: YYYY-MM-DD -->
