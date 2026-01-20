# Pre-Release Checklist

**Package:** `create-ai-kit`  
**Applies to:** Every release (major, minor, patch)

This checklist must be completed before every release. No exceptions.

---

## Overview

| Section                     | Est. Time |
| --------------------------- | --------- |
| 1. Version & Changelog      | 5 min     |
| 2. Code Quality             | 15 min    |
| 3. Security Audit           | 10 min    |
| 4. Documentation            | 10 min    |
| 5. Package Configuration    | 5 min     |
| 6. Automated Tests          | 5 min     |
| 7. Manual Testing           | 20 min    |
| 8. Pre-Publish Verification | 10 min    |
| 9. Final Sanity Checks      | 5 min     |
| **Total**                   | ~85 min   |

---

## 1. Version & Changelog

### Version Bump

- [x] Version in `package.json` is updated appropriately:
  - **Patch** (`x.x.X`): Bug fixes, typo corrections, minor improvements
  - **Minor** (`x.X.0`): New features, new commands, new templates
  - **Major** (`X.0.0`): Breaking changes, major rewrites, removed features
- [x] Version follows semver strictly (no arbitrary bumps)
- [ ] If this is a breaking change, documented in BREAKING CHANGES section

### Changelog

- [x] CHANGELOG.md exists and is updated (or create one if missing)
- [x] New version section added with:
  - [x] Date of release
  - [x] List of changes categorized: Added, Changed, Fixed, Removed, Security
  - [ ] Breaking changes highlighted with ⚠️
  - [ ] Migration notes if applicable

---

## 2. Code Quality

### Syntax & Linting

- [x] `npm run format` executed (Prettier)
- [ ] No syntax errors in any `.js` files
- [ ] No syntax errors in any `.md` template files
- [ ] All JSON files are valid (`package.json`, config files, etc.)

### Code Review

- [ ] No `console.log` debugging statements left in production code
- [ ] No commented-out code blocks (remove or convert to proper comments)
- [ ] No TODO comments without associated issue/ticket
- [ ] No hardcoded absolute paths (only relative paths or `process.cwd()`)
- [ ] No hardcoded secrets, API keys, or credentials
- [ ] Error handling is comprehensive (no silent failures)
- [ ] All promises have proper `.catch()` or try/catch blocks

### CLI-Specific Code Quality

- [ ] `bin/create-ai-kit.js` has shebang: `#!/usr/bin/env node`
- [ ] CLI is executable: `chmod +x bin/create-ai-kit.js`
- [ ] All CLI options work as documented (--dry-run, --force, --yes)
- [ ] Exit codes are correct (0 for success, non-zero for errors)
- [ ] Error messages are user-friendly and actionable
- [ ] Chalk colors degrade gracefully in non-TTY environments

### Template Quality

- [ ] All template files in `templates/` have valid syntax
- [ ] `<!-- AI_FILL: ... -->` placeholders are properly formatted
- [ ] No broken relative paths within templates
- [ ] Template markdown renders correctly
- [ ] No orphaned or unused template files
- [ ] Hydration verify passes in a hydrated test project (`node scripts/hydrate-verify.js`)

---

## 3. Security Audit

### Secrets & Sensitive Data

- [ ] No secrets in codebase (grep for: password, secret, key, token, api)
- [ ] No `.env` files committed
- [ ] No private keys or certificates
- [ ] No internal URLs or IPs

### Dependencies

- [x] `npm audit` shows no high/critical vulnerabilities
- [ ] Dependencies are up to date (check for major version updates)
- [ ] No unnecessary dependencies (review `package.json`)
- [ ] All dependencies have appropriate licenses (MIT, Apache, BSD)

### File Permissions

- [ ] No files with overly permissive modes (777)
- [ ] Sensitive files are in `.gitignore`
- [ ] `.npmignore` or `files` array excludes sensitive files

---

## 4. Documentation

### README.md

- [ ] Quick start example works exactly as shown
- [ ] All CLI options are documented
- [ ] All created files/folders are listed
- [ ] Requirements (Node.js version) are accurate
- [ ] Links work (no broken URLs)
- [ ] Badges display correct information

### Template Documentation

- [ ] `templates/scripts/docs-update/README.md` is accurate
- [ ] `AGENTS.md` template is coherent and useful
- [ ] `HYDRATE.md` prompt is clear and complete
- [ ] Command templates (`.cursor/commands/`) are well-documented

### Other Documentation

- [ ] `CONTRIBUTING.md` is up to date
- [ ] `LICENSE` has correct year and copyright holder
- [ ] Any API changes are documented

---

## 5. Package Configuration

### package.json Verification

```bash
# Run this to verify package.json structure
node -e "console.log(JSON.stringify(require('./package.json'), null, 2))"
```

- [ ] `name`: Correct (`create-ai-kit`)
- [ ] `version`: Matches intended release version
- [ ] `description`: Accurate and complete
- [ ] `main`: Not needed for CLI-only packages
- [ ] `bin`: Points to `./bin/create-ai-kit.js`
- [ ] `scripts`: All scripts work
- [ ] `keywords`: Relevant and complete
- [ ] `author`: Correct name and email
- [ ] `license`: Matches LICENSE file
- [ ] `repository`: Correct GitHub URL
- [ ] `bugs.url`: Valid issues URL
- [ ] `homepage`: Valid URL
- [ ] `engines.node`: Appropriate version requirement (>=14)
- [ ] `files`: Includes all necessary files, excludes test/dev files

### Files Array Verification

- [ ] `bin/` included
- [ ] `templates/` included
- [ ] `README.md` included
- [ ] `LICENSE` included
- [ ] `test/` included (for published test runs)
- [ ] `.prettierrc` NOT included
- [ ] Development configs NOT included

---

## 6. Automated Tests

### Run Test Suite

```bash
npm test
```

- [x] All tests pass
- [ ] No skipped tests without documented reason
- [ ] Test coverage is adequate for critical paths:
  - [ ] Dry run mode
  - [ ] Fresh install
  - [ ] Force upgrade
  - [ ] Project detection
  - [ ] Checksum calculation
  - [ ] Config loading

### Test Specific Scenarios

- [ ] Tests run in isolation (no shared state between tests)
- [ ] Tests clean up their fixtures (no orphaned test directories)
- [ ] Tests don't depend on network access

---

## 7. Manual Testing

### Environment Preparation

```bash
# Clean npm cache for accurate testing
npm cache clean --force

# Create isolated test directory
mkdir -p /tmp/ai-kit-release-test
cd /tmp/ai-kit-release-test
```

### Test Matrix

Run all tests below. Record results in the table.

| #   | Test                          | Command                                        | Status | Notes |
| --- | ----------------------------- | ---------------------------------------------- | ------ | ----- |
| 1   | Dry run                       | `node /path/to/bin/create-ai-kit.js --dry-run` | ⬜     |       |
| 2   | Fresh install (with pkg.json) | `npm init -y && node ... --yes`                | ⬜     |       |
| 3   | Fresh install (no pkg.json)   | `node ... --yes` (in empty dir)                | ⬜     |       |
| 4   | Re-run behavior (no-op)       | Run again without --force                      | ⬜     |       |
| 4b  | Safe upgrade (no manifest)    | Delete manifest, run again without --force     | ⬜     |       |
| 5   | Force upgrade                 | `node ... --force --yes`                       | ⬜     |       |
| 6   | User modification preserved   | Modify file, --force, check .new               | ⬜     |       |
| 7   | Manifest integrity            | Check .ai-kit-manifest.json is valid           | ⬜     |       |
| 8   | .gitignore update             | Verify HYDRATE.md entry added                  | ⬜     |       |
| 9   | package.json scripts          | Verify docs:\* scripts added                   | ⬜     |       |
| 10  | Project detection (Next.js)   | Create with next dep, verify detection         | ⬜     |       |
| 11  | Project detection (React)     | Create with react dep, verify detection        | ⬜     |       |
| 12  | Project detection (Python)    | Create requirements.txt, verify detection      | ⬜     |       |
| 13  | Clipboard copy                | Verify HYDRATE.md copied to clipboard          | ⬜     |       |
| 14  | Prompt fallback file          | `docs/hydration-prompt.md` created on install  | ⬜     |       |
| 15  | Hydration verify              | `node scripts/hydrate-verify.js`               | ⬜     |       |
| 16  | Global link test              | `npm link` then `create-ai-kit --dry-run`      | ⬜     |       |
| 17  | Target dir argument           | `node ... ./path` creates target dir           | ⬜     |       |
| 18  | --no-gitignore flag           | No `.gitignore` updates or creation            | ⬜     |       |

### Detailed Test Scripts

```bash
# Test 1: Dry run
mkdir -p /tmp/test-dry-run && cd /tmp/test-dry-run
npm init -y
node /path/to/ai-kit/bin/create-ai-kit.js --dry-run
# Verify: No files created (including docs/hydration-prompt.md), output lists files

# Test 2: Fresh install
mkdir -p /tmp/test-fresh && cd /tmp/test-fresh
npm init -y
node /path/to/ai-kit/bin/create-ai-kit.js --yes
# Verify: .cursor/, AGENTS.md, scripts/, manifest exist, docs/hydration-prompt.md created

# Test 4: Re-run without --force (should be a no-op)
node /path/to/ai-kit/bin/create-ai-kit.js --yes
# Verify: exits 0, no .new files created

# Test 4b: Safe upgrade when manifest is missing
rm -f .ai-kit-manifest.json
echo "# Modified" >> .cursor/commands/build.md
node /path/to/ai-kit/bin/create-ai-kit.js
# Verify: safe-upgrade message printed, .new file created for modified file

# Test 5: Force upgrade
cd /tmp/test-fresh
echo "# Modified" >> .cursor/commands/build.md
node /path/to/ai-kit/bin/create-ai-kit.js --force --yes
# Verify: build.md.new created if build.md was in manifest

# Test 17: Target directory argument
node /path/to/ai-kit/bin/create-ai-kit.js /tmp/test-target-dir --yes
# Verify: directory created and scaffolded

# Test 18: --no-gitignore flag
mkdir -p /tmp/test-no-gitignore && cd /tmp/test-no-gitignore
npm init -y
node /path/to/ai-kit/bin/create-ai-kit.js --yes --no-gitignore
# Verify: .gitignore not created or modified

# Test 15: Global link
cd /path/to/ai-kit
npm link
mkdir -p /tmp/test-global && cd /tmp/test-global
create-ai-kit --dry-run
npm unlink -g create-ai-kit
```

### File Structure Verification

After fresh install, verify all expected files exist:

```bash
# Run in project that had AI Kit installed
test -d .cursor/commands && echo "✓ .cursor/commands/"
test -d .cursor/rules && echo "✓ .cursor/rules/"
test -f .cursor/HYDRATE.md && echo "✓ .cursor/HYDRATE.md"
test -f .cursor/ai-kit.config.json && echo "✓ .cursor/ai-kit.config.json"
test -f AGENTS.md && echo "✓ AGENTS.md"
test -d scripts/docs-update && echo "✓ scripts/docs-update/"
test -f scripts/placeholder-check.js && echo "✓ scripts/placeholder-check.js"
test -f scripts/hydrate-verify.js && echo "✓ scripts/hydrate-verify.js"
test -f .ai-kit-manifest.json && echo "✓ .ai-kit-manifest.json"
```

Expected command files:

- [ ] `.cursor/commands/build.md`
- [ ] `.cursor/commands/commit.md`
- [ ] `.cursor/commands/debug.md`
- [ ] `.cursor/commands/discuss.md`
- [ ] `.cursor/commands/explain.md`
- [ ] `.cursor/commands/fix.md`
- [ ] `.cursor/commands/hydrate-check.md`
- [ ] `.cursor/commands/hydrate-verify.md`
- [ ] `.cursor/commands/plan.md`
- [ ] `.cursor/commands/refactor.md`
- [ ] `.cursor/commands/review.md`
- [ ] `.cursor/commands/verify.md`

---

## 8. Pre-Publish Verification

### Package Tarball Inspection

```bash
cd /path/to/ai-kit
npm pack --dry-run
```

- [x] Output lists expected files
- [ ] No test files included
- [ ] No .env or secret files included
- [ ] Package size is reasonable (< 500KB)

### Actual Pack Test

```bash
npm pack
ls -la create-ai-kit-*.tgz
# Should be small, e.g., < 100KB
```

- [ ] Tarball created successfully
- [ ] Size is acceptable

### Tarball Installation Test

```bash
mkdir -p /tmp/test-tarball && cd /tmp/test-tarball
npm init -y
npm install /path/to/create-ai-kit-X.X.X.tgz
npx create-ai-kit --dry-run
```

- [ ] Installation succeeds
- [ ] CLI runs from npx
- [ ] Output is correct

### npm Login Verification

```bash
npm whoami
```

- [ ] Logged in as correct npm account
- [ ] Has publish permissions for the package

---

## 9. Final Sanity Checks

### Git Status

```bash
git status
git log -3 --oneline
```

- [ ] Working directory is clean (all changes committed)
- [ ] On correct branch (main/master)
- [ ] No uncommitted changes
- [ ] Most recent commit is release-ready

### Version Tag Preparation

- [ ] Tag will be created: `v{version}` (e.g., `v1.2.0`)
- [ ] Tag message prepared

### Release Notes Prepared

- [ ] GitHub release notes drafted
- [ ] Features highlighted
- [ ] Breaking changes called out
- [ ] Upgrade instructions included (if applicable)

---

## Sign-Off

| Check                         | Verified | Date | Initials |
| ----------------------------- | -------- | ---- | -------- |
| All checklist items completed | ⬜       |      |          |
| All automated tests pass      | ⬜       |      |          |
| All manual tests pass         | ⬜       |      |          |
| No security vulnerabilities   | ⬜       |      |          |
| Documentation is current      | ⬜       |      |          |
| Ready for `npm publish`       | ⬜       |      |          |

---

## Post-Release Checklist

After publishing, complete these steps:

### Verification

```bash
# Wait 1-2 minutes after publish
npm view create-ai-kit
npx create-ai-kit@latest --dry-run
```

- [ ] Package visible on npm
- [ ] Version is correct
- [ ] npx runs the new version

### Git & GitHub

```bash
git tag -a vX.X.X -m "vX.X.X - Release description"
git push origin vX.X.X
```

- [ ] Version tag pushed
- [ ] GitHub release created
- [ ] Release notes published

### Final Smoke Test

```bash
mkdir -p /tmp/post-release-test && cd /tmp/post-release-test
npm init -y
npx create-ai-kit@latest --yes
```

- [ ] Fresh install from npm works
- [ ] All files created correctly
- [ ] HYDRATE.md copied to clipboard

---

## Quick Reference Commands

```bash
# Format code
npm run format

# Run tests
npm test

# Preview CLI output
npm run preview

# Check npm audit
npm audit

# Pack without publishing
npm pack --dry-run

# Publish (after all checks pass)
npm publish

# Create and push tag
git tag -a vX.X.X -m "vX.X.X"
git push origin vX.X.X
```

---

## Rollback Procedure

If issues are discovered post-release:

1. **Deprecate the version** (don't unpublish):

   ```bash
   npm deprecate create-ai-kit@X.X.X "Critical bug, use X.X.Y instead"
   ```

2. **Fix the issue** and bump version (even for hotfix)

3. **Publish the fix** following this checklist

4. **Update GitHub release** to note the issue

---

**Last Updated:** January 2026  
**Checklist Version:** 1.0
