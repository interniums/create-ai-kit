# Documentation Update Automation

Weekly human-triggered documentation update workflow.

## Overview

This system helps keep documentation in sync with code changes:

1. **Markers added**: Agent adds dated markers for doc-worthy changes
2. **Human provides**: Period dates + completed tasks
3. **Script analyzes**: Git diff + maps to affected docs
4. **AI generates**: Draft documentation updates with confidence scores
5. **Human reviews**: Approves, modifies, or rejects updates

## Files

| File                  | Description                                 |
| --------------------- | ------------------------------------------- |
| `file-doc-map.json`   | Maps file patterns to related documentation |
| `generate-context.js` | Generates context package for AI analysis   |
| `prompt-template.md`  | Base prompt for AI doc updates              |
| `MARKER-GUIDE.md`     | Marker format reference                     |
| `update-context.json` | Generated output (gitignored)               |

## Usage

### 1. Add Markers (default)

Markers are the default for doc-worthy changes (new exports, breaking changes, new patterns).
The agent adds them during `/plan` and `/commit`.
Keep 1–3 markers per commit to avoid spam.

Manual shortcut (devs): use the VS Code snippet `docs-upd` to insert:
`// @docs-update(YYYY-MM-DD): path/to/doc.md - description`

### 2. Prepare Input

Edit `docs/templates/WEEKLY-UPDATE-INPUT.md` with:

- Period dates (from/to)
- Completed tasks with types ([FEAT], [FIX], [REFACTOR], etc.)
- Optional notes

### 3. Generate Context

```bash
# Run the context generator
node scripts/docs-update/generate-context.js

# Or with npm script
npm run docs:update
```

The script will:

- Prompt for period dates
- Ask to use the WEEKLY-UPDATE-INPUT.md file
- Analyze git changes for that period
- Map changed files to affected docs
- Collect `@docs-update(YYYY-MM-DD): path/to/doc.md - description` markers from code comments
- Output `update-context.json`

### 4. Generate Doc Updates

1. Copy contents of `update-context.json`
2. Open `scripts/docs-update/prompt-template.md`
3. Use with your preferred AI assistant (Claude, GPT, etc.)
4. Paste the context into the prompt
5. AI generates doc updates with confidence scores

### 5. Review and Apply

- **HIGH confidence**: Merge recommended
- **MEDIUM confidence**: Review carefully
- **LOW confidence**: Optional, verify accuracy
- **SKIP**: No update needed

Apply changes manually or create a PR.

## File-Doc Mapping

The `file-doc-map.json` contains patterns that map source files to documentation:

```json
{
  "pattern": "src/services/auth/**",
  "docs": ["src/services/auth/DOCS.md", "docs/auth.md"],
  "keywords": ["auth", "login", "user"]
}
```

### Adding New Mappings

When you add a new service or feature:

1. Add an entry to `file-doc-map.json`
2. Include both inline doc and baseline doc paths
3. Add relevant keywords for better matching

## Doc Update Markers

Developers and AI can mark code that needs doc updates:

```typescript
// @docs-update(2024-01-15): src/services/auth/DOCS.md - Added OAuth support
// @docs-update(2024-01-15): docs/auth.md - New provider section
```

See `scripts/docs-update/MARKER-GUIDE.md` for format details.

### Finding Markers

Run `npm run docs:check` to list all markers with status.

## Weekly Flow (recommended)

1. Run `npm run docs:check` to see marker status
2. Run `npm run docs:update` to generate update context
3. Apply doc changes and remove markers

## Enforcement

- Days 1–7: OK
- Days 8–14: warning
- Day 15+: error

## Optional Strict Enforcement

- Add ESLint rules from `eslint-rules/README.md` to warn/error on stale markers
- Use `npm run docs:check:ci` in CI to fail on expired markers
