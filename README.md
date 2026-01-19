# create-ai-kit

[![npm version](https://badge.fury.io/js/create-ai-kit.svg)](https://www.npmjs.com/package/create-ai-kit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Scaffold **AI Kit** — an AI-friendly documentation and workflow system for [Cursor IDE](https://cursor.sh).

## Quick Start

```bash
npx create-ai-kit
```

## What It Does

1. **Scaffolds** `.cursor/commands/` with 11 workflow commands (plan, build, verify, etc.)
2. **Creates** `AGENTS.md` skeleton with AI_FILL tokens for project-specific content
3. **Installs** docs-update scripts for weekly documentation maintenance
4. **Adds** a hydration placeholder check script
5. **Adds** a hydration verification script (files + config + placeholders)
6. **Copies** a hydration prompt to your clipboard and saves it to `docs/hydration-prompt.md`

## Usage

### Fresh Install

```bash
npx create-ai-kit
```

### Preview Changes

```bash
npx create-ai-kit --dry-run
```

### Upgrade Existing Installation

```bash
npx create-ai-kit --force
```

User-modified files will create `.new` versions instead of overwriting.

If a `.cursor` folder already exists without a manifest, running without `--force` will do a safe upgrade and create `.new` files for any conflicts.

## How It Works (Simple)

1. Run `npx create-ai-kit` in your project.
2. The CLI copies templates, renames `_cursor` → `.cursor`, and writes files.
3. A manifest (`.ai-kit-manifest.json`) tracks checksums for safe upgrades.
4. If a file was modified, the CLI writes a `.new` version instead of overwriting.
5. Your hydration prompt is copied to the clipboard when possible and saved to `docs/hydration-prompt.md`.

## What You Get (Output)

- Created files and folders (see the list below)
- `.ai-kit-manifest.json` with version + checksums
- Added npm scripts for docs update and hydration checks
- CLI console output listing created/updated/conflicting files

## After Installation

1. Open Cursor (Cmd+Shift+I for Composer)
2. Paste the hydration prompt (clipboard or `docs/hydration-prompt.md`)
3. Let the AI configure your project by filling in `<!-- AI_FILL: ... -->` blocks
4. Note: hydration on large projects can take a while — let it finish
5. If the agent cannot write to `.cursor/`, run the steps locally or grant permission
6. Run `npm run hydrate:verify` (or `node scripts/hydrate-verify.js`) to confirm required files, config, and placeholders

## Files Created

```
.cursor/
├── commands/          # Workflow commands
│   ├── build.md
│   ├── commit.md
│   ├── debug.md
│   ├── discuss.md
│   ├── explain.md
│   ├── fix.md
│   ├── hydrate-check.md
│   ├── hydrate-verify.md
│   ├── plan.md
│   ├── refactor.md
│   ├── review.md
│   └── verify.md
├── rules/
│   ├── main.mdc       # Main rule file
│   ├── app-context.mdc # Minimal app context (always on)
│   └── _template.mdc  # Template for new rules
└── HYDRATE.md         # Hydration prompt (delete after use)

scripts/
├── docs-update/       # Documentation maintenance scripts
│   ├── generate-context.js
│   ├── check-markers.js
│   ├── verify-inline.js
│   ├── file-doc-map.json
│   ├── prompt-template.md
│   ├── MARKER-GUIDE.md
│   └── README.md
├── placeholder-check.js # Internal placeholder scan (used by hydrate-verify)
└── hydrate-verify.js    # Hydration verification (files + config + placeholders)

AGENTS.md              # Agent onboarding guide
docs/
├── README.md          # Documentation index
├── hydration-prompt.md # Generated hydration prompt fallback
└── templates/
    ├── DOCS-TEMPLATE.md         # Documentation template
    └── WEEKLY-UPDATE-INPUT.md   # Weekly update input template
```

## CLI Options

| Option      | Description                             |
| ----------- | --------------------------------------- |
| `--dry-run` | Preview changes without writing files   |
| `--force`   | Overwrite/upgrade existing installation |
| `--yes`     | Skip confirmation prompts               |

## How It Works

AI Kit uses a **two-phase setup**:

1. **Scaffold** — CLI creates generic templates with `<!-- AI_FILL: ... -->` placeholders
2. **Hydrate** — You paste a prompt in Cursor, and AI fills in project-specific details

This approach means:

- No manual configuration needed
- AI understands your specific tech stack
- Templates stay updatable without losing customizations

## Docs Update Markers

Markers are the default for doc-worthy changes (new exports, breaking changes, new patterns).
The agent auto-adds markers during `/plan` and `/commit`.

`// @docs-update(YYYY-MM-DD): path/to/doc.md - description`

Manual shortcut: use the VS Code snippet `docs-upd`.

These markers are temporary. The docs update tooling collects them, helps you
decide which docs to change, and then you remove the markers once docs are updated.

## Docs Update Workflow

1. Run `npm run docs:check` to see all markers.
2. Fill `docs/templates/WEEKLY-UPDATE-INPUT.md` with period + tasks.
3. Run `npm run docs:update` to generate `scripts/docs-update/update-context.json`.
4. Paste that JSON into `scripts/docs-update/prompt-template.md`.
5. Use your AI tool to draft doc updates, then apply them manually.
6. Remove the markers.

Enforcement:

- Days 1–7: OK
- Days 8–14: warning
- Day 15+: error

## Optional Inline Docs (rare)

For tiny, low-risk changes, you can update the relevant `DOCS.md` or `docs/*.md`
in the same PR. Markers are still the default for doc-worthy changes.

## Extending Your Docs Setup

As your project grows, extend the docs system in three places:

1. **Add docs:** Create new `docs/*.md` files or `DOCS.md` in feature folders.
2. **Map code → docs:** Update `scripts/docs-update/file-doc-map.json` with new patterns.
3. **Add rules (optional):** Create `.cursor/rules/<feature>.mdc` for conventions.

This keeps the update workflow accurate without making it heavier.

## Scripts Overview

Common scripts added to `package.json`:

- `hydrate:verify` → unified hydration check (files + config + placeholders)
- `hydrate:check` → alias of `hydrate:verify` (kept for compatibility)
- `docs:update` → build the context for doc updates
- `docs:check` → check marker age/format
- `docs:check:ci` → fail CI if expired markers exist
- `docs:verify-inline` → verify inline doc references

## What's Included

| Component              | Purpose                              |
| ---------------------- | ------------------------------------ |
| `/plan`                | Create implementation blueprints     |
| `/build`               | Production-ready code generation     |
| `/verify`              | Code review and safety checks        |
| `/hydrate-check`       | Deprecated alias of `/hydrate-verify` |
| `/hydrate-verify`      | Hydration verification (files + config) |
| `/debug`               | Root cause analysis                  |
| `/commit`              | Git commit with best practices       |
| `AGENTS.md`            | AI onboarding guide for your project |
| `docs-update/`         | Weekly documentation sync scripts    |
| `placeholder-check.js` | Internal placeholder scan (used by hydrate-verify) |
| `hydrate-verify.js`    | Required files + config + placeholders |

## Real-World Learnings (Universe Repo)

Observed issues that this kit now documents, but does not enforce:

- Placeholders (`AI_FILL`) left in AGENTS/docs after hydration
- Template file drift (`DOCS-TEMPLATE.md` and `.template.*` files left behind)
- Manifest drift (`.ai-kit-manifest.json` not updated after manual template edits)
- Docs drift (template docs out of sync with actual project patterns)
- Lockfile conflicts during upgrades (install time noise)

## Requirements

- Node.js 14+
- [Cursor IDE](https://cursor.sh) (for AI hydration)

## Contributing

Issues and PRs welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT
