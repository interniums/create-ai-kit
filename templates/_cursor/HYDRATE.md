# AI Kit Hydration

You are configuring the AI Kit for this project. I have just installed
template files that contain `<!-- AI_FILL: ... -->` blocks.

If you need to reference this prompt later, it is saved to `docs/hydration-prompt.md`.
In TTY terminals, the installer also prints a copyable prompt block. Non-TTY and CI
modes keep output compact, so rely on the file fallback.

## Important Notes

- Hydration on large projects can take a long time. Let the agent finish its scan.
- Run this prompt in Plan mode for better hydration quality.
- Some `.cursor/` folders can be write-protected. If the agent cannot write there, the CLI falls back to `cursor-copy/`. You can also set `--cursor-dir cursor` (or `AI_KIT_CURSOR_DIR=cursor`), hydrate there, then copy it to `.cursor/` locally.
- If you set `--cursor-dir` or `AI_KIT_CURSOR_DIR`, replace `.cursor` references below with that folder.
- If AI Kit was installed with `--zero-config`, docs-update and verification scripts are not included.
- During hydration, the agent may ask for confirmation before making changes. Approve when ready.

## Your Tasks

### 1. Read the project context (be specific, save tokens)

- Read `package.json` dependencies to identify framework (Next.js, Express, Vite, etc.)
- Check for entry files: `src/index.ts`, `src/App.tsx`, `pages/_app.tsx`, `app/layout.tsx`, `src/server.js`, `main.py`, `go.mod`
- From entry points, identify the architecture pattern (pages router, app router, feature modules, MVC, etc.)
- Do NOT scan entire directory tree - focus on entry points and immediate children

### 2. Hydrate the templates

- Open `AGENTS.md` and replace all `<!-- AI_FILL: ... -->` blocks with specific content for this project
- Fill `.cursor/rules/app-context.mdc` with a minimal app snapshot (keep it minimal). If using `--cursor-dir` or `AI_KIT_CURSOR_DIR`, replace `.cursor` with that value.
- The `.cursor/rules/main.mdc` file has `alwaysApply: true` - it loads for every conversation. Keep it focused on navigation (pointing to AGENTS.md) and available commands. If using `--cursor-dir` or `AI_KIT_CURSOR_DIR`, update that folder instead.
- If you identify major features (auth, payments, API), create corresponding `.cursor/rules/<feature>.mdc` files **only** when there is clear evidence in code or docs
- Domain examples when applicable: `payments.mdc`, `analytics.mdc`, `api-routes.mdc`, `database.mdc`, `react.mdc`, `typescript.mdc`
- For each major domain identified, create `docs/domains/<domain>.md` (use the template structure in `docs/domains/README.md`) and update the domains table

**Plan mode note:** Hydrate `AGENTS.md` and `.cursor/rules/app-context.mdc` first to improve context coverage.

### 3. Create feature-specific rules (optional)

Use `.cursor/rules/_template.mdc` as a starting point. Each rule file needs proper frontmatter:

```yaml
---
description: Brief summary for Cursor's rule list
globs: ['**/*.tsx', 'src/components/**'] # File patterns that trigger this rule
alwaysApply: false # Usually false for feature rules
---
```

**When to create a rule file:**

- Complex feature with specific patterns (auth, payments, API routes)
- Tech-specific conventions (React hooks, database queries)
- Team conventions that differ from defaults

**Skip rule files for:**

- Obvious patterns covered by linters
- One-off edge cases
- Patterns already in AGENTS.md

### 4. Optional: Inline docs (only if useful)

- Skip unless the module is complex or easy to get wrong
- Use `docs/templates/DOCS-TEMPLATE.md` as a guide
- Keep `DOCS.md` short and link back to the baseline doc

<details>
<summary>Optional: inline docs prompt</summary>

```
Create inline `DOCS.md` only for complex modules. Keep each doc short, link to the baseline doc, and skip trivial folders. Use docs/templates/DOCS-TEMPLATE.md as a guide.
```

</details>

### 5. Review source roots (auto-detected)

The CLI auto-detects source directories and pre-fills `.cursor/ai-kit.config.json`.

- **Usually no action needed** — verify the detected `sourceRoots` are correct
- Adjust `excludePatterns` if needed for your project structure
- Optional: set `requiredDocs` to override default required files for hydration verification

### 6. Configure file-doc mappings

- Open `scripts/docs-update/file-doc-map.json` (renamed from `.template.json`)
- Fill in `mappings` based on this project's structure (e.g. mapping `src/features/*` to docs)
- Ensure the JSON is valid

### 7. Configure ESLint rules (optional — skip if no ESLint)

**SKIP this step** if the project does not have ESLint configured (no `eslint.config.js`, `.eslintrc.*`, or eslint in package.json).

If ESLint IS configured, run this yourself (do not delegate to the agent): `npx create-ai-kit eslint-setup`

This will automatically detect your ESLint config format and add the AI Kit rules.

### 8. Populate command templates

- Fill in project-specific sections in `.cursor/commands/*` (scripts, risk checks, etc.)
- Remove any `<!-- AI_FILL: ... -->` comments after filling them

### 9. Populate anti-patterns

- Open `docs/anti-patterns.md` and fill in the `<!-- AI_FILL: ... -->` blocks
- Remove sections that don't apply to this tech stack (e.g., remove React section for a Python project)
- Add any project-specific anti-patterns discovered in the codebase

### 10. Cleanup

- Remove all `<!-- AI_FILL: ... -->` comments after filling them
- Delete `.cursor/HYDRATE.md` when done
- Delete `docs/templates/DOCS-TEMPLATE.md` if not needed
- Delete `.cursor/rules/_template.mdc` after using it as reference

### 11. Verify hydration completeness

- Run `npm run ai-kit:verify` (or `node scripts/hydrate-verify.js`) to verify required files, config, placeholders, and manifest drift
- If any placeholders remain, ask the AI to fill in the missing sections listed by the script
- Re-run until the check reports no placeholders

Note: Verification now checks that `.cursor/commands/*` exists and warns on `.ai-kit-manifest.json` drift. If you intentionally keep a manifest, regenerate it after cleanup.

## Cursor-Specific Notes

### Rule Loading Behavior

- **alwaysApply: true** - Rule loads for every conversation (use sparingly, adds to context)
- **globs defined** - Rule auto-loads when matching files are in context
- **globs empty** - Rule only loads when explicitly @-mentioned or via commands

### Context Window Optimization

Keep `.cursor/rules/main.mdc` **under 50 lines**. It loads on EVERY conversation.

**DO include:**

- Navigation pointers ("read AGENTS.md for X")
- List of available commands
- Critical one-liner constraints

**DON'T include:**

- Detailed patterns (put in feature-specific rules)
- Full anti-pattern tables (link to docs/anti-patterns.md)
- Architecture descriptions (keep in AGENTS.md, load on demand)

**Why this matters:** Every token in `main.mdc` is sent with every message. A bloated main rule can consume 10-20% of your context window before you even start.

### Context Management

Cursor has limited context windows. To optimize:

- Keep `main.mdc` minimal (just navigation and commands)
- Put detailed patterns in feature-specific rules that only load when needed
- Use inline `DOCS.md` files instead of duplicating info in rules

### Commands vs Rules

- **Commands** (`.cursor/commands/`) - Invoked explicitly with `/command`, good for workflows
- **Rules** (`.cursor/rules/`) - Auto-load based on file patterns, good for conventions

## Constraints

- Do NOT invent features that don't exist in the codebase
- Keep documentation concise (agents have limited context windows)
- Prefer links to files over duplicating content
- Focus on existing patterns, not aspirational ones
