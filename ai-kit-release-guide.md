# AI Kit Release Guide

Complete guide to building, testing, and releasing the `create-ai-kit` npm package.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Package Structure](#package-structure)
3. [Building the Package](#building-the-package)
4. [Local Testing](#local-testing)
5. [Publishing to npm](#publishing-to-npm)
6. [GitHub Repository Setup](#github-repository-setup)
7. [Versioning & Updates](#versioning--updates)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Accounts

- [ ] **npm account** — Create at [npmjs.com/signup](https://www.npmjs.com/signup)
- [ ] **GitHub account** — For hosting the repository

### Required Tools

```bash
# Check Node.js version (need 14+)
node --version

# Check npm version
npm --version

# Login to npm (run once)
npm login
```

### Verify npm Login

```bash
npm whoami
# Should print your npm username
```

---

## Package Structure

```
create-ai-kit/
├── bin/
│   └── create-ai-kit.js      # CLI entry point (executable)
├── templates/
│   ├── _cursor/                 # Renamed to .cursor on install
│   │   ├── commands/            # 11 workflow commands
│   │   │   ├── build.md
│   │   │   ├── commit.md
│   │   │   ├── debug.md
│   │   │   ├── discuss.md
│   │   │   ├── explain.md
│   │   │   ├── fix.md
│   │   │   ├── hydrate-check.md       # Deprecated alias
│   │   │   ├── hydrate-verify.md
│   │   │   ├── plan.md
│   │   │   ├── refactor.md
│   │   │   ├── review.md
│   │   │   └── verify.md
│   │   ├── rules/
│   │   │   ├── main.mdc         # Main rule with version
│   │   │   └── _template.mdc    # Template for new rules
│   │   └── HYDRATE.md           # AI hydration prompt
│   ├── scripts/
│   │   ├── docs-update/
│   │   │   ├── generate-context.js
│   │   │   ├── check-markers.js
│   │   │   ├── verify-inline.js
│   │   │   ├── file-doc-map.template.json
│   │   │   ├── prompt-template.md
│   │   │   ├── MARKER-GUIDE.md
│   │   │   └── README.md
│   │   ├── placeholder-check.js     # Internal (used by hydrate-verify)
│   │   └── hydrate-verify.js
│   ├── docs/
│   │   ├── README.md
│   │   └── templates/
│   │       ├── DOCS-TEMPLATE.md
│   │       └── WEEKLY-UPDATE-INPUT.md
│   └── AGENTS.md                # Agent guide skeleton
├── .gitignore
├── .npmignore                   # (optional) exclude dev files
├── LICENSE
├── package.json
└── README.md
```

---

## Building the Package

### Step 1: Create Package Directory

```bash
mkdir -p create-ai-kit/bin
mkdir -p create-ai-kit/templates/_cursor/commands
mkdir -p create-ai-kit/templates/_cursor/rules
mkdir -p create-ai-kit/templates/scripts/docs-update
mkdir -p create-ai-kit/templates/docs/templates
cd create-ai-kit
```

### Step 2: Create package.json

```json
{
  "name": "create-ai-kit",
  "version": "1.0.0",
  "description": "Scaffold AI Kit - AI-friendly documentation and workflow system for Cursor IDE",
  "bin": {
    "create-ai-kit": "./bin/create-ai-kit.js"
  },
  "scripts": {
    "test": "node bin/create-ai-kit.js --dry-run"
  },
  "keywords": [
    "ai-kit",
    "cursor",
    "ai",
    "scaffold",
    "documentation",
    "workflow",
    "cli",
    "developer-tools"
  ],
  "author": "Your Name <your.email@example.com>",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/YOUR_USERNAME/create-ai-kit.git"
  },
  "bugs": {
    "url": "https://github.com/YOUR_USERNAME/create-ai-kit/issues"
  },
  "homepage": "https://github.com/YOUR_USERNAME/create-ai-kit#readme",
  "dependencies": {
    "chalk": "^4.1.2",
    "commander": "^8.3.0",
    "fs-extra": "^10.0.0",
    "clipboardy": "^2.3.0"
  },
  "engines": {
    "node": ">=14"
  },
  "files": ["bin/", "templates/", "README.md", "LICENSE"]
}
```

### Step 3: Install Dependencies

```bash
npm install
```

### Step 4: Make CLI Executable

```bash
chmod +x bin/create-ai-kit.js
```

### Step 5: Add Shebang to CLI

Ensure `bin/create-ai-kit.js` starts with:

```javascript
#!/usr/bin/env node
```

---

## Local Testing

### Test 1: Dry Run

```bash
# From package directory
node bin/create-ai-kit.js --dry-run
```

Expected output: List of files that would be created.

### Test 2: Fresh Install

```bash
# Create temp test directory
mkdir /tmp/test-project && cd /tmp/test-project
npm init -y

# Run your local CLI
node /path/to/create-ai-kit/bin/create-ai-kit.js

# Verify files created
ls -la .cursor/
ls -la AGENTS.md
ls -la scripts/docs-update/
ls -la scripts/hydrate-verify.js
```

### Test 3: Re-run Behavior (No-op)

```bash
# Run again in same directory (should be a no-op)
node /path/to/create-ai-kit/bin/create-ai-kit.js
# Expected: exits 0, no overwrites
```

### Test 3b: Safe Upgrade (Existing .cursor Without Manifest)

```bash
# Simulate a .cursor folder that exists without a manifest
rm -f .ai-kit-manifest.json

# Optional: modify a file to trigger a conflict
echo "# Modified" >> .cursor/commands/build.md

# Run again without --force (should safe-upgrade)
node /path/to/create-ai-kit/bin/create-ai-kit.js

# Expected:
# - prints a safe-upgrade message about missing manifest
# - creates .new files for conflicts
```

### Test 3c: Placeholder Check (Post-hydration)

```bash
# Run after hydration is complete
node scripts/hydrate-verify.js
```

Expected output: “No placeholders found”.

### Test 4: Force Upgrade

```bash
# Modify a file
echo "# Modified" >> .cursor/commands/build.md

# Run with --force
node /path/to/create-ai-kit/bin/create-ai-kit.js --force --yes

# Check for .new file
ls .cursor/commands/*.new
```

### Test 5: Link and Test as Global

```bash
cd /path/to/create-ai-kit
npm link

# Now test as if installed globally
cd /tmp/another-test && npm init -y
create-ai-kit --dry-run

# Cleanup
npm unlink -g create-ai-kit
```

---

## Publishing to npm

### Pre-Publish Checklist

- [ ] All tests pass locally
- [ ] `package.json` has correct author, repository URLs
- [ ] `LICENSE` file exists with correct copyright
- [ ] `README.md` is complete with badges
- [ ] Version number is correct
- [ ] No secrets or credentials in code

### Step 1: Preview Package Contents

```bash
npm pack --dry-run
```

This shows exactly what files will be published. Verify:

- `bin/create-ai-kit.js` is included
- `templates/` folder is included
- `node_modules/` is NOT included
- No `.env` or secrets

### Step 2: Create Package Tarball (Optional)

```bash
npm pack
# Creates: create-ai-kit-1.0.0.tgz
```

You can inspect this or install it locally:

```bash
cd /tmp/test && npm init -y
npm install /path/to/create-ai-kit-1.0.0.tgz
npx create-ai-kit --dry-run
```

### Step 3: Publish

```bash
# First time publish
npm publish

# If using scoped package (@yourname/create-ai-kit)
npm publish --access public
```

### Step 4: Verify Publication

```bash
# Check it exists
npm view create-ai-kit

# Test installation
npx create-ai-kit --dry-run
```

---

## GitHub Repository Setup

### Option A: New Standalone Repository (Recommended)

```bash
# 1. Create repo on GitHub
#    Go to: github.com/new
#    Name: create-ai-kit
#    Description: AI-friendly documentation and workflow system for Cursor IDE
#    Public: Yes
#    Initialize: No (we'll push existing code)

# 2. Initialize and push
cd create-ai-kit
git init
git add .
git commit -m "feat: initial release v1.0.0"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/create-ai-kit.git
git push -u origin main

# 3. Create release
git tag v1.0.0
git push origin v1.0.0
```

### Option B: Monorepo (Subfolder)

If keeping in a larger monorepo:

```bash
# Publish from subfolder
cd packages/create-ai-kit
npm publish

# Link to monorepo README
# Add entry in root package.json workspaces (if using)
```

### GitHub Release

1. Go to your repo → Releases → "Create a new release"
2. Tag: `v1.0.0`
3. Title: `v1.0.0 - Initial Release`
4. Description:

```markdown
## 🎉 Initial Release

AI Kit scaffolding tool for Cursor IDE.

### Features

- 11 workflow commands (/plan, /build, /verify, /hydrate-verify, etc.)
- AI hydration system for project-specific setup
- Documentation maintenance scripts
- Safe upgrade mechanism with checksums

### Usage

\`\`\`bash
npx create-ai-kit
\`\`\`

### Requirements

- Node.js 14+
- Cursor IDE (for AI hydration)
```

---

## Versioning & Updates

### Semantic Versioning

| Change Type            | Version Bump | Example       |
| ---------------------- | ------------ | ------------- |
| Bug fixes, typos       | PATCH        | 1.0.0 → 1.0.1 |
| New commands, features | MINOR        | 1.0.0 → 1.1.0 |
| Breaking changes       | MAJOR        | 1.0.0 → 2.0.0 |

### Update Workflow

```bash
# 1. Make changes
# 2. Update version
npm version patch  # or minor/major

# 3. Update CHANGELOG (if you have one)

# 4. Commit and tag (npm version does this)

# 5. Publish
npm publish

# 6. Push to GitHub
git push && git push --tags
```

### Update Embedded Version

When releasing, also update the version in `templates/_cursor/rules/main.mdc`:

```markdown
<!-- ai-kit-version: 1.1.0 -->
```

---

## Troubleshooting

### "npm ERR! 403 Forbidden"

Package name already taken. Try:

- Scoped name: `@yourname/create-ai-kit`
- Alternative name: `cursor-ai-kit`, `ai-kit-cli`

### "npm ERR! You must be logged in"

```bash
npm login
npm whoami  # Verify
```

### "Cannot find module 'chalk'"

Dependencies not installed:

```bash
cd create-ai-kit
npm install
```

### "Permission denied" on CLI

```bash
chmod +x bin/create-ai-kit.js
```

### Files Missing from Published Package

Check `files` array in `package.json`:

```json
{
  "files": ["bin/", "templates/", "README.md", "LICENSE"]
}
```

### ".cursor" Folder Not Created

The CLI uses `_cursor` in templates and renames to `.cursor` during install. Verify the rename logic in CLI:

```javascript
if (targetRelPath.startsWith('_cursor')) {
  targetRelPath = targetRelPath.replace('_cursor', '.cursor');
}
```

---

## Quick Reference Commands

```bash
# === DEVELOPMENT ===
npm install                    # Install dependencies
npm test                       # Run dry-run test
npm link                       # Link for global testing
npm unlink -g create-ai-kit    # Cleanup link

# === PUBLISHING ===
npm login                      # Login to npm (once)
npm whoami                     # Verify login
npm pack --dry-run             # Preview package contents
npm version patch              # Bump version
npm publish                    # Publish to npm

# === GITHUB ===
git tag v1.0.0                 # Create version tag
git push origin v1.0.0         # Push tag
```

---

**Last Updated:** January 2026
