# AI Kit Hydration

You are configuring the AI Kit for this project. I have just installed
template files that contain `<!-- AI_FILL: ... -->` blocks.

If you need to reference this prompt later, it is saved to `docs/hydration-prompt.md`.
In TTY terminals, the installer also prints a copyable prompt block. Non-TTY and CI
modes keep output compact, so rely on the file fallback.

## Important Notes

- Hydration on large projects can take a long time. Let the agent finish its scan.
- Some environments block writing to `.cursor/`. If that happens, run the hydration steps locally or grant the agent permission to write to `.cursor/`.
- If AI Kit was installed with `--zero-config`, docs-update and verification scripts are not included.

## Your Tasks

### 1. Read the project context (be specific, save tokens)

- Read `package.json` dependencies to identify framework (Next.js, Express, Vite, etc.)
- Check for entry files: `src/index.ts`, `src/App.tsx`, `pages/_app.tsx`, `app/layout.tsx`, `src/server.js`, `main.py`, `go.mod`
- From entry points, identify the architecture pattern (pages router, app router, feature modules, MVC, etc.)
- Do NOT scan entire directory tree - focus on entry points and immediate children

### 2. Hydrate the templates

- Open `AGENTS.md` and replace all `<!-- AI_FILL: ... -->` blocks with specific content for this project
- Fill `.cursor/rules/app-context.mdc` with a minimal app snapshot (keep it minimal)
- The `.cursor/rules/main.mdc` file has `alwaysApply: true` - it loads for every conversation. Keep it focused on navigation (pointing to AGENTS.md) and available commands
- If you identify major features (auth, payments, API), create corresponding `.cursor/rules/<feature>.mdc` files **only** when there is clear evidence in code or docs
- Domain examples when applicable: `payments.mdc`, `analytics.mdc`, `api-routes.mdc`, `database.mdc`, `react.mdc`, `typescript.mdc`

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

### 4. Generate inline docs

- For each major directory in `src/` (or equivalent), consider if a `DOCS.md` would help
- Only create DOCS.md files for complex modules (not trivial ones)
- Use `docs/templates/DOCS-TEMPLATE.md` as a guide but delete the template file if not needed

### 5. Configure source roots

- Open `.cursor/ai-kit.config.json`
- Replace the `sourceRoots` placeholder with actual project directories (e.g., `["src/", "app/", "lib/"]`)
- Adjust `excludePatterns` if needed for your project structure
- This config is used by the docs-update scripts to scan for changes
- Optional: set `requiredDocs` to override the default required files for hydration verification

### 6. Configure file-doc mappings

- Open `scripts/docs-update/file-doc-map.json` (renamed from `.template.json`)
- Fill in `mappings` based on this project's structure (e.g. mapping `src/features/*` to docs)
- Ensure the JSON is valid

### 7. Configure ESLint rules (optional, strict mode)

Add the docs marker rules to enforce documentation hygiene:

```javascript
// eslint.config.js (flat config)
const localRules = require('./eslint-rules');

module.exports = [
  {
    plugins: { 'local-rules': localRules },
    rules: {
      'local-rules/docs-marker-expiry': ['error', { maxDays: 14 }],
      'local-rules/docs-marker-expiring': ['warn', { maxDays: 14, warnDays: 7 }],
    },
  },
];
```

These rules:

- Error on `@docs-update` markers older than `maxDays`
- Error on missing/invalid timestamps
- Warn when markers are close to expiring
- Use format: `@docs-update(2024-01-15): path/to/doc.md - description`

See `eslint-rules/README.md` for more options.

### 8. Populate anti-patterns

- Open `docs/anti-patterns.md` and fill in the `<!-- AI_FILL: ... -->` blocks
- Remove sections that don't apply to this tech stack (e.g., remove React section for a Python project)
- Add any project-specific anti-patterns discovered in the codebase

### 9. Cleanup

- Remove all `<!-- AI_FILL: ... -->` comments after filling them
- Delete `.cursor/HYDRATE.md` when done
- Delete `docs/templates/DOCS-TEMPLATE.md` if not needed
- Delete `.cursor/rules/_template.mdc` after using it as reference

### 10. Verify hydration completeness

- Run `npm run ai-kit:verify` (or `node scripts/hydrate-verify.js`) to verify required files, config, and placeholders
- If any placeholders remain, ask the AI to fill in the missing sections listed by the script
- Re-run until the check reports no placeholders

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
