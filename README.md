---

# create-ai-kit

**Scaffold a self-documenting workflow for Cursor IDE.**

AI Kit creates a bridge between your codebase and your AI editor. Instead of writing long, repetitive prompts to explain your project context, AI Kit installs a structured documentation system (`AGENTS.md`, rules, and keyword pointers) that allows the AI to "read" your project's intent automatically.

## Quick Start

The setup is a two-step process: **Install** the structure, then **Hydrate** (fill in) the context.

### 1. Scaffold

Run the command in your terminal. You can run this at the root or point to a specific subdirectory.

```bash
npx create-ai-kit
# OR
npx create-ai-kit ./apps/my-project

```

### 2. Hydrate

The installation generates a prompt specifically designed to teach the AI about your project.

1. Open **Cursor Composer** (`Cmd+Shift+I`) in "Plan" mode.
2. Paste the content of `docs/hydration-prompt.md` (it is automatically copied to your clipboard during install).
3. Let the AI run. It will fill in all `` blocks in your configuration.
4. Once finished, verify the setup:

```bash
npm run ai-kit:verify

```
5. Optional: add ESLint rules (run this yourself):

```bash
npx create-ai-kit eslint-setup
```

## How It Works

This system reduces prompt fatigue by strictly separating **context** from **instructions**.

When you install AI Kit, you get a set of Slash Commands (like `/plan` or `/build`) in your `.cursor/commands` folder. These commands act as specific agents. When you type `/plan`, the system automatically retrieves your `AGENTS.md` and relevant design rules, ensuring the AI knows your tech stack before it writes a single line of code.

### The Command Lifecycle

Instead of free-typing requests, use the installed workflow commands to maintain consistency:

Suggested flow: `/discuss` → `/plan` → `/review` → `/build` → `/verify` → `/commit`

| Command | Usage |
| --- | --- |
| **`/discuss`** | Brainstorming and architectural decisions. |
| **`/plan`** | Generates a step-by-step implementation blueprint. |
| **`/review`** | Critiques the plan before code is written. |
| **`/build`** | Generates production-ready code based on the plan. |
| **`/verify`** | Runs tests and safety checks on the new code. |
| **`/commit`** | Formats the git commit message using best practices. |
| **`/fix`** | Quick bug fixes and targeted repairs. |
| **`/debug`** | Root cause analysis and troubleshooting. |
| **`/explain`** | Clear explanations of code, decisions, or behavior. |
| **`/refactor`** | Safer refactors with clearer structure. |
| **`/hydrate-verify`** | Checks hydration files, config, and placeholders. |

## Documentation Maintenance

Keeping docs in sync with code is usually a burden. AI Kit solves this using **Time-Based Markers**.

When you change code, you (or the AI) add a simple marker:
`// @docs-update(YYYY-MM-DD): path/to/doc.md - description`

You do not need to context-switch to update documentation immediately. Weekly, you run the update workflow:

1. `npm run docs:check` scans for markers.
2. `npm run docs:update` aggregates these markers into a context file.
3. You pass this context to the AI, which batches all documentation updates in one go.

## CLI Reference

### Common Options

| Flag | Function |
| --- | --- |
| `--dry-run` | Preview which files will be created without writing them. |
| `--force` | Upgrade an existing installation. Creates `.new` files if conflicts exist. |
| `--zero-config` | Minimal install. Skips maintenance scripts and only installs rules. |
| `--print-prompt` | Outputs the hydration prompt to stdout (useful for piping). |

### Advanced Subcommands

**`npx create-ai-kit lint`**
Checks your hydration prompt for redundancy or excessive token usage.

**`npx create-ai-kit eslint-setup`**
Injects AI Kit rules into your ESLint config. It supports JSON, JS, and `eslint.config.js`. If you use a complex configuration, run this manually rather than letting the agent do it.

## Troubleshooting & Edge Cases

**Monorepos**
We recommend installing at the root to keep rules consistent. If you need package-specific contexts, you can run the installer inside individual package folders.

**Folder Permissions**
If the CLI cannot write to `.cursor/` (common in some restricted environments), it falls back to creating a `cursor-copy/` folder. You must manually move this folder to `.cursor/` for the IDE to recognize the commands.

**Performance**
On very large repositories, the hydration verification scan might be slow. You can edit `.cursor/ai-kit.config.json` to exclude heavy directories via `excludePatterns` or limit the scan scope using `sourceRoots`.

## Files Created

The installer scaffolds the following structure:

* **`.cursor/commands/`**: The workflow engines (`/plan`, `/build`, etc.).
* **`.cursor/rules/`**: Contextual rules (`.mdc` files) that trigger based on file types.
* **`AGENTS.md`**: The master instruction file for the AI.
* **`scripts/docs-update/`**: Tooling to manage the documentation lifecycle.
* **`docs/hydration-prompt.md`**: The initial setup prompt (safe to delete after hydration).

---
