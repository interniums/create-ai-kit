# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added

- (Add new features here before release)

### Changed

- (Add changes here)

### Fixed

- (Add bug fixes here)

### Removed

- (Add removed features here)

### Security

- (Add security fixes here)

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
- `hydrate:verify` npm script during scaffolding (with `hydrate:check` as an alias).

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

- Hydration placeholder check script (`scripts/placeholder-check.js`) and `/hydrate-check` command (11 total commands now).
- `hydrate:check` npm script added during scaffolding.

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

| Version | Date       | Highlights                          |
| ------- | ---------- | ----------------------------------- |
| 1.7.0   | 2026-01-20 | Target dir, glob fixes, packaging   |
| 1.6.1   | 2026-01-19 | Updated npm badge source            |
| 1.5.0   | 2026-01-19 | Hydration fallback + app context    |
| 1.4.0   | 2026-01-19 | Marker rules + CI check             |
| 1.3.1   | 2026-01-18 | Cleaned npm bin config              |
| 1.3.0   | 2026-01-18 | Hydration check + docs improvements |
| 1.2.0   | 2026-01-18 | Safe upgrade without manifest       |
| 1.1.0   | 2026-01-XX | ESLint rules, marker scripts, tests |
| 1.0.0   | 2026-01-XX | Initial release                     |

---

[Unreleased]: https://github.com/interniums/create-ai-kit/compare/v1.7.0...HEAD
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
