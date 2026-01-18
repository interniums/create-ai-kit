# AI Kit v1.0.0 Release Plan

**Package:** `create-ai-kit`  
**Target Date:** January 2026  
**Version:** 1.0.0 (Initial Release)

---

## 📋 Pre-Release Checklist

### 1. Code & Documentation Quality

- [ ] All template files have valid syntax
- [ ] CLI script tested with `--dry-run` mode
- [ ] README.md accurately describes features and usage
- [ ] LICENSE file has correct copyright information
- [ ] No hardcoded paths or secrets in codebase

### 2. Package Configuration

- [ ] `package.json` has correct metadata:
  - [ ] `name`: `create-ai-kit`
  - [ ] `version`: `1.0.0`
  - [ ] `description`: Updated
  - [ ] `author`: Fill in your name/email
  - [ ] `repository`: Update `YOUR_USERNAME` with actual GitHub username
  - [ ] `bugs`/`homepage`: Update URLs
- [ ] `bin` field points to `./bin/create-ai-kit.js`
- [ ] `files` array includes all necessary files
- [ ] `engines.node` requirement: `>=14`

### 3. CLI Executable Setup

```bash
# Make CLI executable
chmod +x bin/create-ai-kit.js

# Verify shebang is present
head -1 bin/create-ai-kit.js
# Should show: #!/usr/bin/env node
```

---

## 🧪 Testing Phase

### Local Tests (Execute in Order)

```bash
# 1. Install dependencies
cd /path/to/ai-kit
npm install

# 2. Dry run test
node bin/create-ai-kit.js --dry-run

# 3. Fresh install test
mkdir /tmp/test-ai-kit && cd /tmp/test-ai-kit
npm init -y
node /path/to/ai-kit/bin/create-ai-kit.js --yes
ls -la .cursor/
cat AGENTS.md

# 4. Collision detection
node /path/to/ai-kit/bin/create-ai-kit.js
# Should warn about existing .cursor folder

# 5. Force upgrade test
echo "# Modified" >> .cursor/commands/build.md
node /path/to/ai-kit/bin/create-ai-kit.js --force --yes
ls .cursor/commands/*.new

# 6. Global link test
cd /path/to/ai-kit
npm link
cd /tmp/test-global && npm init -y
create-ai-kit --dry-run
npm unlink -g create-ai-kit

# 7. Package tarball test
npm pack
mkdir /tmp/tarball-test && cd /tmp/tarball-test
npm init -y
npm install /path/to/create-ai-kit-1.0.0.tgz
npx create-ai-kit --dry-run
```

### Test Results Log

| Test                | Status | Notes |
| ------------------- | ------ | ----- |
| Dry run             | ⬜     |       |
| Fresh install       | ⬜     |       |
| Collision detection | ⬜     |       |
| Force upgrade       | ⬜     |       |
| Global link         | ⬜     |       |
| Package tarball     | ⬜     |       |

---

## 📦 npm Publishing

### Step 1: npm Account Setup

```bash
# Login to npm (if not already)
npm login

# Verify login
npm whoami
```

### Step 2: Preview Package

```bash
npm pack --dry-run
```

**Verify these files are included:**

- `bin/create-ai-kit.js`
- `templates/` (entire folder)
- `README.md`
- `LICENSE`

**Verify these are NOT included:**

- `node_modules/`
- `.env` or any secrets
- Test files

### Step 3: Publish

```bash
# First-time publish
npm publish

# If name is taken, use scoped package:
# 1. Update package.json name to "@yourname/create-ai-kit"
# 2. npm publish --access public
```

### Step 4: Verify Publication

```bash
# Check package exists
npm view create-ai-kit

# Test via npx
npx create-ai-kit --dry-run
```

---

## 🐙 GitHub Setup

### Repository Creation

1. Go to [github.com/new](https://github.com/new)
2. Repository name: `create-ai-kit`
3. Description: `AI-friendly documentation and workflow system for Cursor IDE`
4. Visibility: Public
5. Initialize: **No** (we have existing code)

### Push Code

```bash
cd /path/to/ai-kit
git init
git add .
git commit -m "feat: initial release v1.0.0

- CLI scaffolding tool for Cursor IDE
- 10 workflow commands (/plan, /build, /verify, etc.)
- AI hydration system for project-specific setup
- Documentation maintenance scripts
- Safe upgrade mechanism with checksums"

git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/create-ai-kit.git
git push -u origin main
```

### Create Release Tag

```bash
git tag -a v1.0.0 -m "v1.0.0 - Initial Release"
git push origin v1.0.0
```

### GitHub Release Notes

Go to: Releases → "Create a new release"

**Tag:** `v1.0.0`  
**Title:** `v1.0.0 - Initial Release`

**Description:**

````markdown
## 🎉 Initial Release

AI Kit scaffolding tool for Cursor IDE.

### Features

- 10 workflow commands (`/plan`, `/build`, `/verify`, `/fix`, `/debug`, `/refactor`, `/commit`, `/discuss`, `/explain`, `/review`)
- AI hydration system for automatic project-specific configuration
- Documentation maintenance scripts with weekly update workflow
- Safe upgrade mechanism using checksums (preserves user modifications)
- Manifest-based version tracking

### Usage

```bash
npx create-ai-kit
```
````

### Requirements

- Node.js 14+
- [Cursor IDE](https://cursor.sh) (for AI hydration)

### Files Created

- `.cursor/commands/` - 10 workflow command definitions
- `.cursor/rules/` - AI behavior rules
- `AGENTS.md` - Agent onboarding guide
- `scripts/docs-update/` - Documentation maintenance tools

````

---

## 📊 Post-Release Verification

### Checklist

- [ ] `npm view create-ai-kit` returns package info
- [ ] `npx create-ai-kit --dry-run` works from any directory
- [ ] GitHub release is visible and tagged
- [ ] README badges work (npm version, license)
- [ ] Package can be installed in a fresh project

### Smoke Test Script

```bash
# Run this after publishing
mkdir /tmp/post-release-test && cd /tmp/post-release-test
npm init -y
npx create-ai-kit --yes

# Verify core files
test -d .cursor/commands && echo "✓ Commands folder exists"
test -f AGENTS.md && echo "✓ AGENTS.md exists"
test -f .ai-kit-manifest.json && echo "✓ Manifest exists"
test -d scripts/docs-update && echo "✓ Docs scripts exist"

echo "Post-release verification complete!"
````

---

## 📅 Release Timeline

| Phase            | Duration  | Tasks                         |
| ---------------- | --------- | ----------------------------- |
| **Pre-release**  | 1-2 hours | Update metadata, test locally |
| **Testing**      | 2-3 hours | Run all test scenarios        |
| **npm Publish**  | 15 min    | Publish and verify            |
| **GitHub Setup** | 30 min    | Repo, release, tags           |
| **Post-release** | 30 min    | Verification, announcements   |

**Total estimated time:** ~5 hours

---

## 🔄 Future Release Process

For subsequent releases:

```bash
# 1. Make changes

# 2. Update version
npm version patch  # or minor/major

# 3. Update embedded version in templates/_cursor/rules/main.mdc
# <!-- ai-kit-version: X.X.X -->

# 4. Publish
npm publish

# 5. Push to GitHub
git push && git push --tags

# 6. Create GitHub release with changelog
```

---

## 📝 Notes

- The package name `create-ai-kit` follows the `create-*` convention for npm init/npx scaffolding tools
- The manifest file `.ai-kit-manifest.json` tracks installed file checksums for safe upgrades
- User-modified files are preserved during upgrades (creates `.new` versions instead)
- The hydration system allows AI to configure project-specific details after scaffolding

---

**Status:** Ready for Release ✅
