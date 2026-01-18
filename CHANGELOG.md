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

---

## Version History Summary

| Version | Date       | Highlights                          |
| ------- | ---------- | ----------------------------------- |
| 1.2.0   | 2026-01-18 | Safe upgrade without manifest       |
| 1.1.0   | 2026-01-XX | ESLint rules, marker scripts, tests |
| 1.0.0   | 2026-01-XX | Initial release                     |

---

[Unreleased]: https://github.com/interniums/create-ai-kit/compare/v1.2.0...HEAD
[1.2.0]: https://github.com/interniums/create-ai-kit/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/interniums/create-ai-kit/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/interniums/create-ai-kit/releases/tag/v1.0.0
