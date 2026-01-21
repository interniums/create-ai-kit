# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.4.2] - 2026-01-21

### Changed

- README rewritten to highlight the system flow, command lifecycle, and maintenance workflow.
- Added ESLint setup step to the hydration flow.

---

## [2.4.1] - 2026-01-21

### Changed

- README copy now emphasizes the system, command flow, and doc-guided context.
- npm package description shortened and clarified.

---

## [2.4.0] - 2026-01-21

### Added

- Hydration tips now call out that large projects can take longer.
- Hydration prompt instructs users to run `npx create-ai-kit eslint-setup` themselves.

### Changed

- CLI output removes a duplicate hydration warning line.

---

## [2.3.0] - 2026-01-21

### Added

- Docs-update context now includes collected `@docs-update` markers (with grouped output).
- Smoke tests for docs-update marker collection, placeholder scanning, and inline docs verification.
- Inline docs verification now detects plain-text `DOCS.md` references.

### Changed

- Command templates now include fast-path guidance and conditional lint/type-check steps.
- Frontend-only guardrails in `/build` are now gated for non-frontend projects.
- `main.mdc` trimmed to a concise navigation + command reference.
- Docs clarify release checklist privacy, ESLint setup behavior, and docs-update limitations.

### Fixed

- `--dry-run` no longer creates missing target directories.
- Placeholder scans include Cursor command files and report on missing cursor dir in verify.

---

## [2.2.0] - 2026-01-21

### Added

- `eslint-setup` subcommand to auto-add AI Kit ESLint rules to existing configs.
- Auto-detection of source directories (`src/`, `app/`, `lib/`, etc.) for `ai-kit.config.json`.
- Domain docs creation instruction in HYDRATE.md.

### Changed

- CLI terminal output changed from 6 numbered steps to concise tip format.
- HYDRATE.md sourceRoots step now shows "auto-detected" since CLI pre-fills values.
- ESLint hydration step now uses `npx create-ai-kit eslint-setup` command.
- eslint-rules README updated with quick setup section.

### Fixed

- Commander subcommand options now properly parsed with `enablePositionalOptions()`.

---

## [2.1.0] - 2026-01-20

### Added

- `--cursor-dir <dir>` CLI flag to override the default `.cursor` location.
- Auto-fallback to `cursor-copy/` when `.cursor/` is not writable.
- CLI messaging and tests covering the fallback behavior.

### Changed

- Hydration and docs tooling now resolve cursor paths from the active folder.
- README and template docs updated to reflect custom cursor folders.

---

## [2.0.0] - 2026-01-20

### Added

- `--print-prompt` CLI flag to print the full hydration prompt.
- `--cursor-dir <dir>` CLI flag to override the default `.cursor` location.
- Domain docs entry point at `docs/domains/README.md`.

### Changed

- Hydration prompt output is suppressed by default; prompt file remains the fallback source.
- README now documents the 3-layer docs system and keyword-based index usage.
- Hydration guidance recommends Plan mode and reviewing hydrated docs for accuracy.
- Installer auto-falls back to `cursor-copy/` when `.cursor/` is not writable, with clear messaging.
- Updated dependencies to latest CJS-compatible versions (commander 10, fs-extra 11, chalk 4, clipboardy 2).

### Breaking Changes

- Hydration prompt is no longer printed by default in TTY output; use `--print-prompt`.

---

## [1.8.0] - 2026-01-20

### Added

- `ai-kit:verify` script and `create-ai-kit lint` command.

### Changed

- CLI output modes for TTY/CI and new zero-config install option.
- Placeholder scan now skips symlinks, nested repos, and shows progress.

### Removed

- Removed legacy `hydrate:*` scripts from scaffolded installs.

---

## [1.7.0] - 2026-01-20

### Added

- Optional target directory argument for `create-ai-kit`.
- `--no-gitignore` flag to skip `.gitignore` updates.
- `picomatch`-based glob matching in placeholder and docs tooling.
- `test/` included in published package for npm test parity.

### Changed

- Default `.gitignore` entries include `docs/hydration-prompt.md`.
- README now documents help output, cleanup steps, and performance tuning.
- Removed hard-coded version tag from template `main.mdc` to avoid drift.
- `clipboardy` moved to optional dependencies for safer installs.

### Fixed

- Inline docs verification respects configured `sourceRoots`.
- Docs-update tooling normalizes paths for cross-platform matching.
- Hydration verify now checks that `sourceRoots` directories exist.
- Docs update generator exits early if git is unavailable.
- Scripts fall back to built-in glob matching when `picomatch` is unavailable.

---

## [1.6.1] - 2026-01-19

### Changed

- Updated npm version badge to use shields.io for fresher registry updates.

---

## [1.6.0] - 2026-01-19

### Added

- Hydration verification script (`scripts/hydrate-verify.js`) and `/hydrate-verify` command.
- `hydrate:verify` npm script during scaffolding.

### Changed

- Hydration instructions now point to the unified verification command.

---

## [1.5.0] - 2026-01-19

### Added

- Generated fallback prompt at `docs/hydration-prompt.md` with source-of-truth note.
- Always-on `app-context.mdc` rule template for minimal app context.
- Optional domain rule examples in `HYDRATE.md`.

### Changed

- CLI messaging now points to the fallback prompt when clipboard is empty.
- Hydration guidance highlights plan-mode sequencing for better context coverage.
- README updated to reflect the fallback prompt and new rule.
- `.gitignore` includes the generated fallback prompt.

### Fixed

- `--dry-run` no longer writes the fallback prompt file.

---

## [1.4.0] - 2026-01-19

### Added

- Dated marker snippet (`docs-upd`) in template VS Code snippets.
- `docs:check:ci` script for CI enforcement of expired markers.
- `docs-marker-expiry` and `docs-marker-expiring` ESLint rules for marker freshness.

### Changed

- Docs-update flow now defaults to agent-added markers in `/plan` and `/commit`.
- Marker format standardized to `// @docs-update(YYYY-MM-DD): path/to/doc.md - description`.
- `check-markers.js` upgraded with status buckets and CLI flags.
- Docs updated to reflect enforcement windows and weekly workflow.

### Removed

- `find-markers.js` and `find-markers.sh` scripts (use `docs:check` instead).

## [1.3.1] - 2026-01-18

### Fixed

- Cleaned `bin` entry in `package.json` to avoid npm publish auto-correction warnings.
- Excluded `scripts/placeholder-check.js` from its own scan to prevent false positives.

---

## [1.3.0] - 2026-01-18

### Added

- Hydration placeholder check script (`scripts/placeholder-check.js`).

### Changed

- Updated docs and release guides to include placeholder verification and real-world learnings.

---

## [1.2.0] - 2026-01-18

### Changed

- CLI now performs a safe upgrade when a `.cursor` folder exists without `.ai-kit-manifest.json` (no overwrites; conflicts become `.new`).

---

## [1.1.0] - 2026-01-XX

### Added

- ESLint rule for docs-update markers (`eslint-rules/`)
- `find-markers.js` script for locating `@docs-update` markers
- `check-markers.js` script for validating marker coverage
- `ai-kit.config.json` for customizable source roots and exclude patterns
- Test suite with Node.js built-in test runner
- ESLint rule tests

### Changed

- Improved project detection with more framework signatures
- Better error messages with actionable suggestions
- Clipboard gracefully degrades in CI environments

### Fixed

- Template path handling for `_cursor` to `.cursor` rename

---

## [1.0.0] - 2026-01-XX

### Added

- Initial release
- CLI scaffolding tool (`npx create-ai-kit`)
- 10 workflow commands: `/plan`, `/build`, `/verify`, `/fix`, `/debug`, `/refactor`, `/commit`, `/discuss`, `/explain`, `/review`
- AI hydration system with `<!-- AI_FILL: ... -->` placeholders
- Safe upgrade mechanism using checksums (preserves user modifications)
- Manifest-based version tracking (`.ai-kit-manifest.json`)
- Documentation maintenance scripts (`docs-update/`)
- Project detection for Next.js, React, Express, NestJS, Python, Go, Rust
- `AGENTS.md` agent onboarding template
- `.cursor/HYDRATE.md` hydration prompt
- Main rule file `.cursor/rules/main.mdc`
- Auto-copy hydration prompt to clipboard

### CLI Options

- `--dry-run`: Preview changes without writing files
- `--force`: Overwrite/upgrade existing installation
- `--yes`: Skip confirmation prompts
- `--no-gitignore`: Skip `.gitignore` updates

---

## Version History Summary

| Version | Date       | Highlights                              |
| ------- | ---------- | --------------------------------------- |
| 2.4.0   | 2026-01-21 | Hydration tips + eslint-setup note      |
| 2.3.0   | 2026-01-21 | Docs/CLI alignment, markers, tests      |
| 2.2.0   | 2026-01-21 | eslint-setup command, auto sourceRoots  |
| 2.1.0   | 2026-01-20 | Custom cursor-dir, fallback support     |
| 2.0.0   | 2026-01-20 | 3-layer docs, domain docs, print-prompt |
| 1.8.0   | 2026-01-20 | ai-kit:verify, zero-config mode         |
| 1.7.0   | 2026-01-20 | Target dir, glob fixes, packaging       |
| 1.6.1   | 2026-01-19 | Updated npm badge source                |
| 1.5.0   | 2026-01-19 | Hydration fallback + app context        |
| 1.4.0   | 2026-01-19 | Marker rules + CI check                 |
| 1.3.1   | 2026-01-18 | Cleaned npm bin config                  |
| 1.3.0   | 2026-01-18 | Hydration check + docs improvements     |
| 1.2.0   | 2026-01-18 | Safe upgrade without manifest           |
| 1.1.0   | 2026-01-XX | ESLint rules, marker scripts, tests     |
| 1.0.0   | 2026-01-XX | Initial release                         |

---

[Unreleased]: https://github.com/interniums/create-ai-kit/compare/v2.4.0...HEAD
[2.4.0]: https://github.com/interniums/create-ai-kit/compare/v2.3.0...v2.4.0
[2.3.0]: https://github.com/interniums/create-ai-kit/compare/v2.2.0...v2.3.0
[2.2.0]: https://github.com/interniums/create-ai-kit/compare/v2.1.0...v2.2.0
[2.1.0]: https://github.com/interniums/create-ai-kit/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/interniums/create-ai-kit/compare/v1.8.0...v2.0.0
[1.8.0]: https://github.com/interniums/create-ai-kit/compare/v1.7.0...v1.8.0
[1.7.0]: https://github.com/interniums/create-ai-kit/compare/v1.6.1...v1.7.0
[1.6.1]: https://github.com/interniums/create-ai-kit/compare/v1.6.0...v1.6.1
[1.6.0]: https://github.com/interniums/create-ai-kit/compare/v1.5.0...v1.6.0
[1.5.0]: https://github.com/interniums/create-ai-kit/compare/v1.4.0...v1.5.0
[1.4.0]: https://github.com/interniums/create-ai-kit/compare/v1.3.1...v1.4.0
[1.3.1]: https://github.com/interniums/create-ai-kit/compare/v1.3.0...v1.3.1
[1.3.0]: https://github.com/interniums/create-ai-kit/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/interniums/create-ai-kit/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/interniums/create-ai-kit/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/interniums/create-ai-kit/releases/tag/v1.0.0
