#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { program } = require('commander');
const chalk = require('chalk');
const fse = require('fs-extra');
const readline = require('readline');

// Version from package.json (single source of truth)
const pkg = require('../package.json');

// Optional clipboard support - gracefully degrade if unavailable
let clipboardy = null;
try {
  clipboardy = require('clipboardy');
} catch {
  // Clipboard not available (e.g., CI environment, missing native deps)
}

const PROJECT_ROOT = process.cwd();
const MANIFEST_FILE = '.ai-kit-manifest.json';
const TEMPLATES_DIR = path.join(__dirname, '../templates');

// Project detection patterns
const PROJECT_SIGNATURES = {
  nextjs: {
    files: ['next.config.js', 'next.config.mjs', 'next.config.ts'],
    deps: ['next'],
    label: 'Next.js',
    hints: [
      'App Router detected - consider creating .cursor/rules/app-router.mdc',
      'Pages Router detected - consider creating .cursor/rules/pages-router.mdc',
    ],
  },
  react: {
    files: ['src/App.tsx', 'src/App.jsx'],
    deps: ['react', 'react-dom'],
    label: 'React',
    hints: ['Consider creating .cursor/rules/components.mdc for component conventions'],
  },
  express: {
    files: ['app.js', 'server.js', 'src/server.ts'],
    deps: ['express'],
    label: 'Express',
    hints: ['Consider creating .cursor/rules/api-routes.mdc for route conventions'],
  },
  nestjs: {
    deps: ['@nestjs/core'],
    label: 'NestJS',
    hints: ['Consider creating .cursor/rules/modules.mdc for module conventions'],
  },
  python: {
    files: ['requirements.txt', 'pyproject.toml', 'setup.py', 'main.py'],
    label: 'Python',
    hints: ['Consider creating .cursor/rules/python.mdc for Python conventions'],
  },
  go: {
    files: ['go.mod', 'main.go'],
    label: 'Go',
    hints: ['Consider creating .cursor/rules/go.mdc for Go conventions'],
  },
  rust: {
    files: ['Cargo.toml'],
    label: 'Rust',
    hints: ['Consider creating .cursor/rules/rust.mdc for Rust conventions'],
  },
};

// Detect project type
function detectProject() {
  const detected = [];
  let pkgDeps = [];

  // Read package.json dependencies
  const pkgPath = path.join(PROJECT_ROOT, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      pkgDeps = [...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.devDependencies || {})];
    } catch (e) {
      // Ignore parse errors
    }
  }

  // Check each signature
  for (const [key, sig] of Object.entries(PROJECT_SIGNATURES)) {
    let matched = false;

    // Check for signature files
    if (sig.files) {
      for (const file of sig.files) {
        if (fs.existsSync(path.join(PROJECT_ROOT, file))) {
          matched = true;
          break;
        }
      }
    }

    // Check for dependencies
    if (!matched && sig.deps) {
      for (const dep of sig.deps) {
        if (pkgDeps.includes(dep)) {
          matched = true;
          break;
        }
      }
    }

    if (matched) {
      detected.push({ key, ...sig });
    }
  }

  return detected;
}

// Files to always preserve during upgrade (never overwrite with template)
const PRESERVE_LIST = [
  'AGENTS.md',
  '.cursor/rules/main.mdc',
  '.cursor/HYDRATE.md', // Should not exist usually, but if it does
];

// Helper to calculate checksum
function calculateChecksum(content) {
  return crypto.createHash('md5').update(content).digest('hex');
}

// Helper for confirmation
function confirm(msg) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(msg, (answer) => {
      rl.close();
      resolve(answer.toLowerCase().startsWith('y'));
    });
  });
}

async function main() {
  program
    .version(pkg.version)
    .option('--force', 'Overwrite existing files or upgrade')
    .option('--dry-run', 'Preview changes without writing')
    .option('--yes', 'Skip confirmation prompts')
    .parse(process.argv);

  const options = program.opts();

  console.log(chalk.blue('🚀 Initializing AI Kit...'));

  // 0. Check if this is a valid project directory
  const pkgJsonPath = path.join(PROJECT_ROOT, 'package.json');
  if (!fs.existsSync(pkgJsonPath)) {
    console.warn(chalk.yellow('\n⚠️  No package.json found in current directory.'));
    console.log(chalk.gray('   AI Kit works best in a project root directory.'));
    console.log(chalk.gray('   If this is intentional, the scaffolding will continue.\n'));
    console.log(chalk.gray('   💡 Run `npm init -y` to create a package.json first.\n'));
  }

  // 1. Check for collision
  const cursorDir = path.join(PROJECT_ROOT, '.cursor');
  const manifestPath = path.join(PROJECT_ROOT, MANIFEST_FILE);
  const hasCursor = fs.existsSync(cursorDir);
  const hasManifest = fs.existsSync(manifestPath);
  const safeUpgradeWithoutManifest = hasCursor && !hasManifest && !options.force;

  if (safeUpgradeWithoutManifest) {
    console.log(chalk.yellow('⚠️  A .cursor folder already exists without a manifest.'));
    console.log(chalk.gray('   Proceeding with a safe upgrade (no overwrites).'));
    console.log(chalk.gray('   Conflicts will be written as .new files.'));
  }

  // 2. Load Manifest if exists
  let manifest = { version: pkg.version, files: {} };
  if (hasManifest) {
    try {
      manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      // Update manifest version to current package version
      manifest.version = pkg.version;
    } catch (e) {
      console.warn(chalk.yellow('⚠️  Could not read existing manifest.'));
      console.warn(chalk.gray('   Try deleting .ai-kit-manifest.json and re-running.'));
    }
  }

  // 3. Confirm if destructive
  if (options.force && !options.yes && !options.dryRun) {
    const confirmed = await confirm(
      chalk.yellow('⚠️  You used --force. This may overwrite files. Continue? (y/N) ')
    );
    if (!confirmed) {
      console.log('Aborted.');
      process.exit(0);
    }
  }

  // 4. Gather files to copy
  const filesToProcess = [];

  // Recursive walk function
  function walk(dir, baseDir = '') {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      const relPath = path.join(baseDir, file);

      if (stat.isDirectory()) {
        walk(fullPath, relPath);
      } else {
        filesToProcess.push(relPath);
      }
    }
  }

  walk(TEMPLATES_DIR);

  const updates = [];
  const creations = [];
  const skips = [];
  const newFiles = [];

  for (const relPath of filesToProcess) {
    let targetRelPath = relPath;

    // Rename _cursor to .cursor
    if (targetRelPath.startsWith('_cursor')) {
      targetRelPath = targetRelPath.replace('_cursor', '.cursor');
    }
    // Rename file-doc-map.template.json
    if (targetRelPath.includes('file-doc-map.template.json')) {
      targetRelPath = targetRelPath.replace('file-doc-map.template.json', 'file-doc-map.json');
    }

    const templatePath = path.join(TEMPLATES_DIR, relPath);
    const targetPath = path.join(PROJECT_ROOT, targetRelPath);

    const templateContent = fs.readFileSync(templatePath);
    const templateChecksum = calculateChecksum(templateContent);

    // Check preserve list
    if (PRESERVE_LIST.some((p) => targetRelPath.endsWith(p)) && fs.existsSync(targetPath)) {
      skips.push({ path: targetRelPath, reason: 'Preserved' });
      // Update manifest with CURRENT file checksum to avoid future diffs
      const currentContent = fs.readFileSync(targetPath);
      manifest.files[targetRelPath] = calculateChecksum(currentContent);
      continue;
    }

    if (fs.existsSync(targetPath)) {
      const currentContent = fs.readFileSync(targetPath);
      const currentChecksum = calculateChecksum(currentContent);

      // If file matches template, no change needed
      if (currentChecksum === templateChecksum) {
        manifest.files[targetRelPath] = templateChecksum; // Ensure manifest is up to date
        continue;
      }

      // Check if file was modified by user compared to LAST manifest
      const lastChecksum = manifest.files[targetRelPath];
      const hasBaseline = Boolean(lastChecksum);
      const userModified =
        (hasBaseline && lastChecksum !== currentChecksum) ||
        (!hasBaseline && safeUpgradeWithoutManifest);

      if (options.force || safeUpgradeWithoutManifest) {
        if (userModified) {
          // User modified file: create .new
          newFiles.push({ path: targetRelPath + '.new', content: templateContent });
          console.log(
            chalk.yellow(`  Conflict: ${targetRelPath} modified by user. Creating .new file.`)
          );
        } else {
          // Safe to update
          updates.push({
            path: targetRelPath,
            content: templateContent,
            checksum: templateChecksum,
          });
        }
      } else {
        console.log(
          chalk.yellow(`  Skipping existing file: ${targetRelPath} (use --force to overwrite)`)
        );
      }
    } else {
      creations.push({ path: targetRelPath, content: templateContent, checksum: templateChecksum });
    }
  }

  // 5. Apply changes
  if (options.dryRun) {
    console.log('\nDry Run Results:');
    creations.forEach((f) => console.log(chalk.green(`  + Create: ${f.path}`)));
    updates.forEach((f) => console.log(chalk.blue(`  ~ Update: ${f.path}`)));
    newFiles.forEach((f) => console.log(chalk.yellow(`  ? Create: ${f.path}`)));
    skips.forEach((f) => console.log(chalk.gray(`  - Skip: ${f.path} (${f.reason})`)));
  } else {
    // Write creations
    for (const f of creations) {
      fse.outputFileSync(path.join(PROJECT_ROOT, f.path), f.content);
      manifest.files[f.path] = f.checksum;
      console.log(chalk.green(`  Created: ${f.path}`));
    }
    // Write updates
    for (const f of updates) {
      fse.outputFileSync(path.join(PROJECT_ROOT, f.path), f.content);
      manifest.files[f.path] = f.checksum;
      console.log(chalk.blue(`  Updated: ${f.path}`));
    }
    // Write .new files
    for (const f of newFiles) {
      fse.outputFileSync(path.join(PROJECT_ROOT, f.path), f.content);
      console.log(chalk.yellow(`  Created: ${f.path}`));
    }

    // Write Manifest
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

    // Update .gitignore
    const gitignorePath = path.join(PROJECT_ROOT, '.gitignore');
    const ignoreEntry = '.cursor/HYDRATE.md';
    if (fs.existsSync(gitignorePath)) {
      const content = fs.readFileSync(gitignorePath, 'utf-8');
      if (!content.includes(ignoreEntry)) {
        fs.appendFileSync(gitignorePath, `\n${ignoreEntry}\n`);
        console.log(chalk.gray('  Updated .gitignore'));
      }
    } else {
      fs.writeFileSync(gitignorePath, `${ignoreEntry}\n`);
      console.log(chalk.green('  Created .gitignore'));
    }

    // Add scripts to package.json
    const pkgPath = path.join(PROJECT_ROOT, 'package.json');
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      pkg.scripts = pkg.scripts || {};

      const newScripts = {
        'hydrate:check': 'node scripts/placeholder-check.js',
        'docs:update': 'node scripts/docs-update/generate-context.js',
        'docs:check': 'node scripts/docs-update/check-markers.js',
        'docs:check:ci': 'node scripts/docs-update/check-markers.js --ci',
        'docs:verify-inline': 'node scripts/docs-update/verify-inline.js',
      };

      let scriptsAdded = false;
      for (const [key, val] of Object.entries(newScripts)) {
        if (!pkg.scripts[key]) {
          pkg.scripts[key] = val;
          scriptsAdded = true;
        } else if (pkg.scripts[key] !== val) {
          console.log(chalk.yellow(`  Skipping script "${key}": already exists`));
        }
      }

      if (scriptsAdded) {
        fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
        console.log(chalk.gray('  Updated package.json scripts'));
      }
    }

    // Success Message & Clipboard
    console.log(chalk.green('\n✅ AI Kit scaffolded successfully!'));

    // Project detection
    const detectedProjects = detectProject();
    if (detectedProjects.length > 0) {
      const labels = detectedProjects.map((p) => p.label).join(', ');
      console.log(chalk.blue(`\n📦 Detected: ${labels}`));

      // Show relevant hints
      const hints = detectedProjects.flatMap((p) => p.hints || []);
      if (hints.length > 0) {
        console.log(chalk.gray('\nSuggestions based on your stack:'));
        hints.slice(0, 3).forEach((hint) => {
          console.log(chalk.gray(`  • ${hint}`));
        });
      }
    }

    // Read Hydration prompt and copy to clipboard
    const hydratePath = path.join(PROJECT_ROOT, '.cursor/HYDRATE.md');
    if (fs.existsSync(hydratePath)) {
      const hydrateContent = fs.readFileSync(hydratePath, 'utf-8');

      if (clipboardy) {
        try {
          clipboardy.writeSync(hydrateContent);
          console.log(chalk.cyan('\n📋 Hydration prompt copied to clipboard!'));
        } catch {
          console.log(chalk.gray('\n📋 Could not copy to clipboard.'));
          console.log(chalk.gray('   Open .cursor/HYDRATE.md and copy the contents manually.'));
        }
      } else {
        console.log(chalk.gray('\n📋 Clipboard not available in this environment.'));
        console.log(chalk.gray('   Open .cursor/HYDRATE.md and copy the contents manually.'));
      }
    }

    console.log('\nNext steps:');
    console.log('  1. Open Cursor (Cmd+Shift+I for Composer)');
    console.log('  2. Paste the prompt (Cmd+V)');
    console.log('  3. Let the AI configure your project');
    console.log('  4. Run node scripts/placeholder-check.js after hydration');
  }
}

main().catch((e) => {
  console.error(chalk.red('\n❌ Unexpected error:'), e.message || e);

  // Provide actionable suggestions based on error type
  if (e.code === 'EACCES' || e.code === 'EPERM') {
    console.log(chalk.yellow('\n💡 Permission denied. Try:'));
    console.log(chalk.gray('   - Check file/folder permissions'));
    console.log(chalk.gray('   - Run from a directory you own'));
  } else if (e.code === 'ENOENT') {
    console.log(chalk.yellow('\n💡 File or directory not found.'));
    console.log(chalk.gray('   - Make sure you are in the correct directory'));
    console.log(chalk.gray('   - Check if the path exists'));
  } else if (e.message && e.message.includes('JSON')) {
    console.log(chalk.yellow('\n💡 JSON parsing error.'));
    console.log(chalk.gray('   - Try deleting .ai-kit-manifest.json and re-running'));
    console.log(chalk.gray('   - Check package.json for syntax errors'));
  }

  process.exit(1);
});
