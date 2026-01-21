# 3-Tier Roadmap Plan

## Context

This roadmap responds to feedback about adoption friction, architectural design,
and long-term viability. The plan prioritizes reducing onboarding friction while
keeping the "safe upgrades" and hydration model intact.

Additional context from the review:

- The current workflow is seen as **process-heavy** at first install; the roadmap
  focuses on reducing this initial "tax" without removing long-term guardrails.
- The **manifest + `.new` file upgrade path** is a differentiator to preserve;
  all tiers avoid changes that would weaken safe upgrades.

## Assumptions

- Short-term goal: reduce time-to-first-value for new users.
- Mid-term goal: broaden adoption beyond Node-only repos.
- The CLI remains the primary entry point for installation and updates.

## Tier 1 (Now) — Friction Killers

**Goal:** Make the first-run experience smoother with minimal scope changes.

### Scope

1.  **Prompt output modes**
    - Default to saving the prompt in `docs/hydration-prompt.md`.
    - Suppress the full prompt by default; print only with `--print-prompt`.
    - Keep TTY/CI output compact and reference the fallback file.
2.  **Reduce package.json noise**
    - Introduce a single CLI entry point for check/verify operations
      (e.g., `npm run ai-kit:verify`).
    - Keep scripts optional or opt-in; avoid injecting multiple scripts by
      default.
    - Provide a compatibility path for existing script users.
3.  **Hardcode safe excludes for scanning**
    - Enforce default excludes in `hydrate-verify.js`:
      `.git`, `node_modules`, `dist`, `vendor`, `build`, `.turbo`, `.next`.
    - Excludes should be non-removable to prevent runaway scans.
    - Avoid following symlinks and stop at nested repos/submodules.
4.  **Progress + double-run guardrails**
    - Show progress for long scans.
    - Prevent concurrent verify runs with a lock or process guard.

### Key Touchpoints

- CLI: `bin/create-ai-kit.js`
- Scripts: `templates/scripts/hydrate-verify.js`
- Docs: `README.md`, `templates/_cursor/HYDRATE.md`,
  internal release checklist (private), `ai-kit-release-guide.md`

### Deliverables

- Prompt saved to `docs/hydration-prompt.md` with optional `--print-prompt`.
- New CLI subcommand for checks/verify, minimizing scripts in `package.json`.
- Compatibility option for existing script-based workflows.
- Default excludes enforced in `hydrate-verify.js`, including symlink safety.
- Progress output and double-run protection for long operations.
- Updated docs to reflect new flow and output modes.
- Release checklist and release guide updated for new behaviors.

### Acceptance Criteria

- New install flow can be completed using the saved prompt file by default.
- No more than 1 script injected into `package.json` by default.
- `hydrate-verify` does not scan excluded directories even if user config
  includes them.
- `hydrate-verify` skips symlinks and stops at nested repos/submodules.
- Running verify twice in parallel exits safely with a clear message.

### Testing

- Update/add CLI tests in `test/cli.test.js`.
- Add unit coverage for exclude behavior in `hydrate-verify.js` if feasible.
- Add tests for TTY vs non-TTY output modes.
- Add a test for verify lock behavior (if supported in tests).

## Tier 2 (Next) — Adoption Expansion

**Goal:** Offer a "lighter" entry point and reduce structural assumptions.

### Scope

1.  **Zero-config mode**
    - Install only `.cursor/rules` (or the `cursor-copy/` fallback / custom cursor dir) and minimal docs.
    - Explicitly optional: hydration scripts and markers.
    - Record only installed files in the manifest for safe upgrades.
2.  **Monorepo strategy**
    - Add README section with recommended root/app placement.
    - Document multi-package flow and best defaults.
    - Define a default placement rule (root-first, with opt-in per package).
3.  **Machine-readable AGENTS**
    - Add YAML or JSON blocks in `templates/AGENTS.md` for deterministic
      parsing.
    - Define a minimal schema for stable parsing.

### Key Touchpoints

- Templates: `templates/_cursor/rules/*`, `templates/AGENTS.md`
- Docs: `README.md`, `templates/docs/README.md`

### Deliverables

- New CLI flag (e.g., `--zero-config`) documented and tested.
- Monorepo guidance documented with examples.
- Structured blocks added to `AGENTS.md`.
- Manifest behavior documented for zero-config installs.

### Acceptance Criteria

- Zero-config install completes without scripts or hydration checks.
- Monorepo section is present and referenced in main README.
- AGENTS file remains human-readable and machine-parsable.
- Zero-config upgrades preserve only the files recorded in the manifest.

### Testing

- CLI tests for zero-config flag.
- Snapshot test for AGENTS structure (if applicable).

## Tier 3 (Later) — Long-Term Viability

**Goal:** Improve prompt quality tooling and broaden ecosystem reach.

### Scope

1.  **Prompt linter**
    - Detect prompt bloat, repeated phrases, and size thresholds.
2.  **Standalone installer**
    - Explore Go/Rust binary for install/update without Node.
    - Maintain JS scripts for runtime tasks where needed.
    - Clarify whether the binary replaces install only or full CLI flow.

### Deliverables

- `ai-kit lint` subcommand with basic warnings.
- Feasibility doc for binary distribution and CI packaging.
- Decision doc for binary scope, maintenance cost, and ownership.

### Acceptance Criteria

- Linter provides actionable warnings with minimal false positives.
- Binary install supports at least macOS + Linux.

### Testing

- Linter unit tests for rule examples.
- Release CI validation for binary builds.

## Release Sequencing

- **vNext (Tier 1):** Ship friction killers first.
- **vNext+1 (Tier 2):** Zero-config + monorepo docs.
- **vNext+2 (Tier 3):** Linter + binary feasibility.
