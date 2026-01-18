# Documentation Index

> Overview of project documentation and update workflow.

## Purpose

<!-- AI_FILL: Describe the documentation system for this project. Include who owns it, what it covers, and how often it should be updated. -->

---

## Documentation Map

Use this table to find the right doc quickly.

| Area | Docs | When to Read |
| :--- | :--- | :----------- |

<!-- AI_FILL: Add doc entries based on actual project structure. -->

---

## Doc Update Workflow

Use the batch update workflow for significant changes:

1. Add a marker with a date and reason:
   `@docs-update(YYYY-MM-DD: what changed and where to update docs)`
2. Run `npm run docs:update` to generate context
3. Update the affected docs
4. Remove the marker

Template inputs live in `docs/templates/`.

---

**Last Updated**: <!-- AI_FILL: YYYY-MM-DD -->
