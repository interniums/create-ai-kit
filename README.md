# create-ai-kit

[![npm version](https://badge.fury.io/js/create-ai-kit.svg)](https://www.npmjs.com/package/create-ai-kit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Scaffold **AI Kit** — an AI-friendly documentation and workflow system for [Cursor IDE](https://cursor.sh).

## Quick Start

```bash
npx create-ai-kit
```

## What It Does

1. **Scaffolds** `.cursor/commands/` with 10 workflow commands (plan, build, verify, etc.)
2. **Creates** `AGENTS.md` skeleton with AI_FILL tokens for project-specific content
3. **Installs** docs-update scripts for weekly documentation maintenance
4. **Copies** a hydration prompt to your clipboard

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

## After Installation

1. Open Cursor (Cmd+Shift+I for Composer)
2. Paste the hydration prompt (already in clipboard)
3. Let the AI configure your project by filling in `<!-- AI_FILL: ... -->` blocks

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
│   ├── plan.md
│   ├── refactor.md
│   ├── review.md
│   └── verify.md
├── rules/
│   ├── main.mdc       # Main rule file
│   └── _template.mdc  # Template for new rules
└── HYDRATE.md         # Hydration prompt (delete after use)

scripts/
└── docs-update/       # Documentation maintenance scripts
    ├── generate-context.js
    ├── verify-inline.js
    ├── find-markers.sh
    ├── file-doc-map.json
    └── README.md

AGENTS.md              # Agent onboarding guide
docs/
└── _TEMPLATE.md       # Documentation template
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

## What's Included

| Component      | Purpose                              |
| -------------- | ------------------------------------ |
| `/plan`        | Create implementation blueprints     |
| `/build`       | Production-ready code generation     |
| `/verify`      | Code review and safety checks        |
| `/debug`       | Root cause analysis                  |
| `/commit`      | Git commit with best practices       |
| `AGENTS.md`    | AI onboarding guide for your project |
| `docs-update/` | Weekly documentation sync scripts    |

## Requirements

- Node.js 14+
- [Cursor IDE](https://cursor.sh) (for AI hydration)

## Contributing

Issues and PRs welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT
