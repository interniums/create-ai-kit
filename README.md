# create-ai-kit

[![npm version](https://img.shields.io/npm/v/create-ai-kit)](https://www.npmjs.com/package/create-ai-kit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Scaffold **AI Kit** — a small, AI-ready docs + workflow system for [Cursor IDE](https://cursor.sh). It gives you a complete structure: `AGENTS.md` and rules guide the agent, keywords point to the right docs, and commands reduce prompt boilerplate.

## Quick Start

```bash
npx create-ai-kit
```

```bash
# scaffold into a subdirectory
npx create-ai-kit ./apps/my-project
```

## The System It Creates

- **Commands:** `.cursor/commands/` with clear workflows (`/plan`, `/build`, `/verify`, etc.).
- **Docs layers:** `AGENTS.md` keyword index → `.cursor/rules/*.mdc` → `docs/` baseline.
- **Docs maintenance:** markers + scripts for weekly updates.

## How It Helps

- **Faster context:** the agent follows `AGENTS.md` pointers to the right docs quickly.
- **Smaller prompts:** commands replace boilerplate instructions and keep outputs consistent.
- **Safer upgrades:** manifest tracking and `.new` files avoid overwrites.

## What It Does NOT Do

- It does **not** modify your application source code.
- It does **not** run AI hydration for you (you paste the prompt in Cursor).
- `docs:update` uses **git history only** (no uncommitted changes).

## Using Commands

Commands live in `.cursor/commands/` (or your `--cursor-dir`) and are invoked in Cursor by typing `/`.

- Suggested flow: `/discuss` → `/plan` → `/review` → `/build` → `/verify` → `/commit`
- Helpers: `/fix`, `/debug`, `/explain`
- Commands guide the agent to relevant docs, so it pulls the right context fast
- Outputs are structured and clear (sections, checklists, next steps)

## Usage (Simple Path)

1. Install:

```bash
npx create-ai-kit
```

2. Open Cursor and paste the hydration prompt (`docs/hydration-prompt.md` or clipboard).
3. Let the AI fill `<!-- AI_FILL: ... -->` blocks.
4. Verify hydration:

```bash
npm run ai-kit:verify
```

That’s the default path for most users.

## Usage (Advanced)

### Preview Changes

```bash
npx create-ai-kit --dry-run
```

### Upgrade Existing Installation

```bash
npx create-ai-kit --force
```

User-modified files will create `.new` versions instead of overwriting.
If the cursor folder already exists without a manifest, running without `--force` will do a safe upgrade.

### Minimal Install (Zero-Config)

```bash
npx create-ai-kit --zero-config
```

Installs `.cursor/rules/` and `.cursor/HYDRATE.md` (or your `--cursor-dir`), plus minimal docs (AGENTS.md + generated `docs/hydration-prompt.md`).
Docs-update scripts and hydration verification are skipped in this mode.

### Lint the Hydration Prompt

```bash
npx create-ai-kit lint
```

Optional file override:

```bash
npx create-ai-kit lint --file .cursor/HYDRATE.md
```

If you use `--cursor-dir` or the CLI fell back to `cursor-copy/`, point to that folder instead.

### Add ESLint Rules (Optional)

```bash
npx create-ai-kit eslint-setup
```

Run this yourself (do not delegate to the agent). It detects your ESLint config format and adds the AI Kit docs-marker rules. Supports `.eslintrc.json`, `.eslintrc.js`, `eslint.config.js`, and `package.json` eslintConfig.
For `.eslintrc.js`, the CLI prints instructions — apply the changes manually.

### Show Help

```bash
npx create-ai-kit --help
```

## How It Works

1. **Scaffold:** run `npx create-ai-kit` to copy templates and create `.cursor/` (or `--cursor-dir` / `AI_KIT_CURSOR_DIR`).
2. **Hydrate:** paste the prompt in Cursor; the AI fills `<!-- AI_FILL: ... -->` blocks.
3. **Track:** a manifest (`.ai-kit-manifest.json`) keeps upgrades safe; edited files get `.new` copies.
4. **Reuse:** the prompt is saved to `docs/hydration-prompt.md` and copied to the clipboard when possible.
5. **Print (optional):** use `--print-prompt` to send it to stdout.

## What You Get (Output)

- Created files and folders (see the list below)
- `.ai-kit-manifest.json` with version + checksums
- Added npm scripts for docs update and hydration checks
- CLI console output listing created/updated/conflicting files

## After Installation

Tip: Open Cursor Composer (Cmd+Shift+I) in Plan mode and paste the hydration prompt (`docs/hydration-prompt.md` or clipboard). Hydration can take a while on large projects. The agent may ask for confirmation on some changes. Review hydrated docs after.

Verify: `npm run ai-kit:verify` (or `node scripts/hydrate-verify.js`). This now checks `.cursor` placeholders and manifest drift.

If ESLint is configured, run yourself: `npx create-ai-kit eslint-setup`.

Notes:

- If the agent cannot write to `.cursor/`, the CLI falls back to `cursor-copy/`. You can force a folder with `--cursor-dir` (or `AI_KIT_CURSOR_DIR=cursor`). After hydration, copy the folder to `.cursor/` locally.
- If you installed with `--zero-config`, skip verification (scripts are not installed).
- `.gitignore` is updated by default to ignore `.cursor/HYDRATE.md` (or your `--cursor-dir` / `cursor-copy/`) and `docs/hydration-prompt.md` (use `--no-gitignore` to skip).

## Files Created

```
<cursor-dir>/  # default: .cursor/ (fallback: cursor-copy/)
├── commands/          # Workflow commands
│   ├── build.md
│   ├── commit.md
│   ├── debug.md
│   ├── discuss.md
│   ├── explain.md
│   ├── fix.md
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
├── domains/
│   └── README.md       # Domain docs entry point
└── templates/
    ├── DOCS-TEMPLATE.md         # Documentation template
    └── WEEKLY-UPDATE-INPUT.md   # Weekly update input template
```

Zero-config installs `.cursor/rules/` and `.cursor/HYDRATE.md` (or your `--cursor-dir` / `cursor-copy/`), plus `AGENTS.md`.
It still writes `docs/hydration-prompt.md` as a fallback prompt source.

## CLI Options

| Option               | Description                                                                      |
| -------------------- | -------------------------------------------------------------------------------- |
| `--dry-run`          | Preview changes without writing files                                            |
| `--force`            | Overwrite/upgrade existing installation                                          |
| `--yes`              | Skip confirmation prompts                                                        |
| `--no-gitignore`     | Skip `.gitignore` updates                                                        |
| `--cursor-dir <dir>` | Use a custom Cursor directory                                                    |
| `--zero-config`      | Install only `.cursor/rules` (or `--cursor-dir` / `cursor-copy/`) + minimal docs |
| `--quiet`            | Limit output (CI-friendly)                                                       |
| `--ci`               | Non-interactive, compact output                                                  |
| `--print-prompt`     | Print full hydration prompt to stdout                                            |
| `[targetDir]`        | Optional target directory                                                        |

## Subcommands

| Command        | Description                                     |
| -------------- | ----------------------------------------------- |
| `lint`         | Lint hydration prompt for size and repetition   |
| `eslint-setup` | Add AI Kit ESLint rules to your existing config |

## Monorepo Guidance

- Default install at the repo root. This keeps rules and docs consistent across packages.
- For per-package installs, run `npx create-ai-kit ./packages/<name>` explicitly.
- Mixed mode is OK: keep root rules + add package-specific rules only when needed.

## Docs Update Markers

Markers are the default for doc-worthy changes (new exports, breaking changes, new patterns).
The agent auto-adds markers during `/build` and `/commit`.

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
3. **Add rules (optional):** Create `<cursor-dir>/rules/<feature>.mdc` for conventions (default: `.cursor/`).

This keeps the update workflow accurate without making it heavier.

## Scripts Overview

Common scripts added to `package.json`:

- `ai-kit:verify` → unified hydration check (files + config + placeholders)
- `docs:update` → build the context for doc updates
- `docs:check` → check marker age/format
- `docs:check:ci` → fail CI if expired markers exist
- `docs:verify-inline` → verify inline doc references

Note: the placeholder scan uses a `.ai-kit-placeholder-check.lock` file. If a scan is killed,
remove the lock and re-run.

## What's Included

| Component              | Purpose                                            |
| ---------------------- | -------------------------------------------------- |
| `/plan`                | Create implementation blueprints                   |
| `/build`               | Production-ready code generation                   |
| `/verify`              | Code review and safety checks                      |
| `/hydrate-verify`      | Hydration verification (files + config)            |
| `/debug`               | Root cause analysis                                |
| `/commit`              | Git commit with best practices                     |
| `AGENTS.md`            | AI onboarding guide for your project               |
| `docs-update/`         | Weekly documentation sync scripts                  |
| `placeholder-check.js` | Internal placeholder scan (used by hydrate-verify) |
| `hydrate-verify.js`    | Required files + config + placeholders             |

## Real-World Learnings (Universe Repo)

Observed issues that this kit now documents, but does not enforce:

- Placeholders (`AI_FILL`) left in AGENTS/docs after hydration
- Template file drift (`DOCS-TEMPLATE.md` and `.template.*` files left behind)
- Manifest drift (`.ai-kit-manifest.json` not updated after manual template edits)
- Docs drift (template docs out of sync with actual project patterns)
- Lockfile conflicts during upgrades (install time noise)

## Requirements

- Node.js 14+ (Node 16+ recommended)
- [Cursor IDE](https://cursor.sh) (for AI hydration)

## Revert / Cleanup

If you want to undo an install:

1. Remove `<cursor-dir>/` (default: `.cursor/`, fallback: `cursor-copy/`)
2. Delete `.ai-kit-manifest.json`
3. Delete `docs/hydration-prompt.md`
4. Remove any `.new` files created during upgrades

Tip: if you want to keep docs, only remove the generated prompt file.

## Performance Notes (Large Repos)

If hydration checks are slow, adjust these in `.cursor/ai-kit.config.json` (or your `--cursor-dir`):

- `sourceRoots`: limit to the directories you want scanned
- `excludePatterns`: add large folders that shouldn’t be scanned

## Contributing

Issues and PRs welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT
