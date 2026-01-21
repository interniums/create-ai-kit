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

const DEFAULT_CURSOR_DIR = '.cursor';
const FALLBACK_CURSOR_DIR = 'cursor-copy';

function normalizeCursorDirName(value) {
  const trimmed = value.trim().replace(/\\/g, '/').replace(/\/+$/, '');
  return trimmed.length > 0 ? trimmed : DEFAULT_CURSOR_DIR;
}

function resolveCursorDirName(projectRoot, options = {}, { dryRun } = {}) {
  if (options.cursorDir && options.cursorDir.trim().length > 0) {
    return normalizeCursorDirName(options.cursorDir);
  }
  const envValue = process.env.AI_KIT_CURSOR_DIR;
  if (envValue && envValue.trim().length > 0) {
    return normalizeCursorDirName(envValue);
  }
  const cursorConfigPath = path.join(projectRoot, DEFAULT_CURSOR_DIR, 'ai-kit.config.json');
  if (fs.existsSync(cursorConfigPath)) {
    return DEFAULT_CURSOR_DIR;
  }
  const fallbackConfigPath = path.join(projectRoot, FALLBACK_CURSOR_DIR, 'ai-kit.config.json');
  if (fs.existsSync(fallbackConfigPath)) {
    return FALLBACK_CURSOR_DIR;
  }
  if (dryRun) {
    return DEFAULT_CURSOR_DIR;
  }
  const preferredPath = path.join(projectRoot, DEFAULT_CURSOR_DIR);
  if (isWritableDir(preferredPath)) {
    return DEFAULT_CURSOR_DIR;
  }
  return FALLBACK_CURSOR_DIR;
}

// Optional clipboard support - gracefully degrade if unavailable
let clipboardy = null;
try {
  clipboardy = require('clipboardy');
} catch {
  // Clipboard not available (e.g., CI environment, missing native deps)
}

const MANIFEST_FILE = '.ai-kit-manifest.json';
const TEMPLATES_DIR = path.join(__dirname, '../templates');
const ZERO_CONFIG_ALLOWLIST = ['_cursor/rules/', '_cursor/HYDRATE.md', 'AGENTS.md'];

const OUTPUT_MODES = {
  FULL: 'full',
  COMPACT: 'compact',
  QUIET: 'quiet',
};

// Project detection patterns
const PROJECT_SIGNATURES = {
  nextjs: {
    files: ['next.config.js', 'next.config.mjs', 'next.config.ts'],
    deps: ['next'],
    label: 'Next.js',
    hintCandidates: {
      app: { file: 'app-router.mdc', description: 'App Router conventions' },
      pages: { file: 'pages-router.mdc', description: 'Pages Router conventions' },
    },
  },
  react: {
    files: ['src/App.tsx', 'src/App.jsx'],
    deps: ['react', 'react-dom'],
    label: 'React',
    hintCandidate: { file: 'components.mdc', description: 'component conventions' },
  },
  express: {
    files: ['app.js', 'server.js', 'src/server.ts'],
    deps: ['express'],
    label: 'Express',
    hintCandidate: { file: 'api-routes.mdc', description: 'route conventions' },
  },
  nestjs: {
    deps: ['@nestjs/core'],
    label: 'NestJS',
    hintCandidate: { file: 'modules.mdc', description: 'module conventions' },
  },
  python: {
    files: ['requirements.txt', 'pyproject.toml', 'setup.py', 'main.py'],
    label: 'Python',
    hintCandidate: { file: 'python.mdc', description: 'Python conventions' },
  },
  go: {
    files: ['go.mod', 'main.go'],
    label: 'Go',
    hintCandidate: { file: 'go.mdc', description: 'Go conventions' },
  },
  rust: {
    files: ['Cargo.toml'],
    label: 'Rust',
    hintCandidate: { file: 'rust.mdc', description: 'Rust conventions' },
  },
};

// Detect project type
function detectProject(projectRoot) {
  const detected = [];
  let pkgDeps = [];

  // Read package.json dependencies
  const pkgPath = path.join(projectRoot, 'package.json');
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
        if (fs.existsSync(path.join(projectRoot, file))) {
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

function detectNextRouter(projectRoot) {
  const appDir = path.join(projectRoot, 'app');
  const appSrcDir = path.join(projectRoot, 'src', 'app');
  const pagesDir = path.join(projectRoot, 'pages');
  const pagesSrcDir = path.join(projectRoot, 'src', 'pages');

  if (fs.existsSync(appDir)) {
    return 'app';
  }
  if (fs.existsSync(appSrcDir)) {
    return 'app';
  }
  if (fs.existsSync(pagesDir)) {
    return 'pages';
  }
  if (fs.existsSync(pagesSrcDir)) {
    return 'pages';
  }
  return null;
}

// Detect source directories for ai-kit.config.json
function detectSourceRoots(projectRoot) {
  const candidates = [
    'src/',
    'app/',
    'lib/',
    'packages/',
    'components/',
    'pages/',
    'server/',
    'api/',
    'services/',
    'utils/',
    'helpers/',
    'hooks/',
    'features/',
    'modules/',
  ];

  const found = candidates.filter((dir) => {
    const fullPath = path.join(projectRoot, dir.replace(/\/$/, ''));
    return fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory();
  });

  // Return found directories, or fallback to common defaults
  return found.length > 0 ? found : ['src/', 'app/', 'lib/'];
}

function formatHint(cursorRulesDir, hint) {
  return `Consider creating ${cursorRulesDir}/${hint.file} for ${hint.description}`;
}

function isWritableDir(targetPath) {
  try {
    fse.ensureDirSync(targetPath);
    const testFile = path.join(targetPath, `.ai-kit-write-test-${Date.now()}`);
    fs.writeFileSync(testFile, 'ok');
    fs.unlinkSync(testFile);
    return true;
  } catch {
    return false;
  }
}

function getOutputMode(options) {
  if (options.quiet) {
    return OUTPUT_MODES.QUIET;
  }
  if (options.ci || !process.stdout.isTTY) {
    return OUTPUT_MODES.COMPACT;
  }
  return OUTPUT_MODES.FULL;
}

function createLogger(outputMode) {
  const isQuiet = outputMode === OUTPUT_MODES.QUIET;
  return {
    log: (...args) => {
      if (!isQuiet) {
        console.log(...args);
      }
    },
    warn: (...args) => {
      if (!isQuiet) {
        console.warn(...args);
      }
    },
    info: (...args) => {
      if (!isQuiet) {
        console.log(...args);
      }
    },
    error: (...args) => {
      console.error(...args);
    },
  };
}

function shouldIncludeTemplate(relPath, options) {
  if (!options.zeroConfig) {
    return true;
  }
  return ZERO_CONFIG_ALLOWLIST.some((allowed) => relPath.startsWith(allowed));
}

function resolveHydrationPromptPath(projectRoot, cursorDirName) {
  const preferred = path.join(projectRoot, 'docs', 'hydration-prompt.md');
  const fallback = path.join(projectRoot, cursorDirName, 'HYDRATE.md');
  if (fs.existsSync(preferred)) {
    return preferred;
  }
  return fallback;
}

function lintPromptContent(content, { maxLines, maxChars, maxRepeatedLines }) {
  const lines = content.split('\n');
  const trimmedLines = lines.map((line) => line.trim()).filter(Boolean);
  const lineCounts = new Map();

  for (const line of trimmedLines) {
    lineCounts.set(line, (lineCounts.get(line) || 0) + 1);
  }

  const repeatedLines = [...lineCounts.entries()]
    .filter(([, count]) => count >= maxRepeatedLines)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const warnings = [];
  if (lines.length > maxLines) {
    warnings.push(
      `Too many lines: ${lines.length} (max ${maxLines}). Trim the prompt to keep it focused.`
    );
  }
  if (content.length > maxChars) {
    warnings.push(
      `Too many characters: ${content.length} (max ${maxChars}). Trim repeated sections.`
    );
  }
  if (repeatedLines.length > 0) {
    const repeatedSummary = repeatedLines
      .map(([line, count]) => `"${line.slice(0, 72)}"${count > 1 ? ` ×${count}` : ''}`)
      .join('; ');
    warnings.push(`Repeated lines detected: ${repeatedSummary}`);
  }

  return warnings;
}

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

async function runInit(targetDir, options) {
  if (options.ci) {
    options.yes = true;
  }
  const projectRoot = targetDir ? path.resolve(process.cwd(), targetDir) : process.cwd();
  const outputMode = getOutputMode(options);
  const logger = createLogger(outputMode);
  const minimalInstall = options.minimal || options.zeroConfig;
  if (options.zeroConfig && !options.minimal) {
    logger.warn(chalk.yellow('⚠️  --zero-config is deprecated. Use --minimal instead.'));
  }
  options.zeroConfig = minimalInstall;
  const isCompact = outputMode === OUTPUT_MODES.COMPACT;
  const cursorDirName = resolveCursorDirName(projectRoot, options, { dryRun: options.dryRun });
  const cursorRulesDir = `${cursorDirName}/rules`;

  logger.log(chalk.blue('🚀 Initializing AI Kit...'));
  if (cursorDirName !== DEFAULT_CURSOR_DIR && !isCompact) {
    logger.log(chalk.gray(`  Using cursor directory: ${cursorDirName}`));
    if (!options.cursorDir && !process.env.AI_KIT_CURSOR_DIR) {
      logger.log(chalk.gray('  Auto-selected because .cursor is not writable.'));
    }
  }

  if (!fs.existsSync(projectRoot)) {
    if (options.dryRun) {
      logger.log(chalk.gray(`  Would create target directory: ${projectRoot}`));
    } else {
      fse.ensureDirSync(projectRoot);
      logger.log(chalk.gray(`  Created target directory: ${projectRoot}`));
    }
  }

  // 0. Check if this is a valid project directory
  const pkgJsonPath = path.join(projectRoot, 'package.json');
  if (!fs.existsSync(pkgJsonPath)) {
    logger.warn(chalk.yellow('\n⚠️  No package.json found in current directory.'));
    logger.log(chalk.gray('   AI Kit works best in a project root directory.'));
    logger.log(chalk.gray('   If this is intentional, the scaffolding will continue.\n'));
    logger.log(chalk.gray('   💡 Run `npm init -y` to create a package.json first.\n'));
  }

  // 1. Check for collision
  const cursorDir = path.join(projectRoot, cursorDirName);
  const manifestPath = path.join(projectRoot, MANIFEST_FILE);
  const hasCursor = fs.existsSync(cursorDir);
  const hasManifest = fs.existsSync(manifestPath);
  const safeUpgradeWithoutManifest = hasCursor && !hasManifest && !options.force;

  if (safeUpgradeWithoutManifest) {
    logger.warn(chalk.yellow(`⚠️  A ${cursorDirName} folder already exists without a manifest.`));
    logger.log(chalk.gray('   Proceeding with a safe upgrade (no overwrites).'));
    logger.log(chalk.gray('   Conflicts will be written as .new files.'));
  }

  // 2. Load Manifest if exists
  const manifestBaseline = hasManifest
    ? (() => {
        try {
          return JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
        } catch (e) {
          logger.warn(chalk.yellow('⚠️  Could not read existing manifest.'));
          logger.warn(chalk.gray('   Try deleting .ai-kit-manifest.json and re-running.'));
          return null;
        }
      })()
    : null;
  let manifest = { version: pkg.version, files: {} };
  if (manifestBaseline) {
    try {
      const hasExistingFiles =
        manifestBaseline.files && Object.keys(manifestBaseline.files).length > 0;
      if (options.zeroConfig && hasExistingFiles) {
        logger.warn(
          chalk.yellow(
            '⚠️  Minimal install requested on an existing install. Keeping manifest entries to avoid data loss.'
          )
        );
        manifest = {
          version: pkg.version,
          files: { ...manifestBaseline.files },
        };
      } else {
        manifest = {
          version: pkg.version,
          files: options.zeroConfig ? {} : { ...manifestBaseline.files },
        };
      }
    } catch {
      manifest = { version: pkg.version, files: {} };
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
        if (shouldIncludeTemplate(relPath, options)) {
          filesToProcess.push(relPath);
        }
      }
    }
  }

  walk(TEMPLATES_DIR);

  const updates = [];
  const creations = [];
  const skips = [];
  const newFiles = [];
  const preserveList = [
    'AGENTS.md',
    `${cursorRulesDir}/main.mdc`,
    `${cursorDirName}/HYDRATE.md`, // Should not exist usually, but if it does
  ];

  for (const relPath of filesToProcess) {
    let targetRelPath = relPath;

    // Rename _cursor to the target cursor directory
    if (targetRelPath.startsWith('_cursor')) {
      targetRelPath = targetRelPath.replace('_cursor', cursorDirName);
    }
    // Rename file-doc-map.template.json
    if (targetRelPath.includes('file-doc-map.template.json')) {
      targetRelPath = targetRelPath.replace('file-doc-map.template.json', 'file-doc-map.json');
    }

    const templatePath = path.join(TEMPLATES_DIR, relPath);
    const targetPath = path.join(projectRoot, targetRelPath);

    let templateContent = fs.readFileSync(templatePath);

    // Auto-fill sourceRoots in ai-kit.config.json based on detected directories
    if (targetRelPath === `${cursorDirName}/ai-kit.config.json`) {
      const detectedRoots = detectSourceRoots(projectRoot);
      const rootsJson = JSON.stringify(detectedRoots);
      const updated = templateContent.toString('utf-8').replace('["PLACEHOLDER"]', rootsJson);
      templateContent = Buffer.from(updated, 'utf-8');
    }

    // Update cursor dir reference in file-doc-map.json
    if (
      cursorDirName !== DEFAULT_CURSOR_DIR &&
      targetRelPath === 'scripts/docs-update/file-doc-map.json'
    ) {
      const updated = templateContent
        .toString('utf-8')
        .replace('.cursor/rules/**', `${cursorDirName}/rules/**`);
      templateContent = Buffer.from(updated, 'utf-8');
    }

    const templateChecksum = calculateChecksum(templateContent);

    // Check preserve list
    if (preserveList.some((p) => targetRelPath.endsWith(p)) && fs.existsSync(targetPath)) {
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
      const lastChecksum = manifestBaseline?.files?.[targetRelPath];
      const hasBaseline = Boolean(lastChecksum);
      const userModified =
        (hasBaseline && lastChecksum !== currentChecksum) ||
        (!hasBaseline && safeUpgradeWithoutManifest);

      if (options.force || safeUpgradeWithoutManifest) {
        if (userModified) {
          // User modified file: create .new
          newFiles.push({ path: targetRelPath + '.new', content: templateContent });
          logger.warn(
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
        if (hasBaseline) {
          // Record current checksum to avoid repeated diffs on future runs
          manifest.files[targetRelPath] = currentChecksum;
        }
        logger.warn(
          chalk.yellow(`  Skipping existing file: ${targetRelPath} (use --force to overwrite)`)
        );
      }
    } else {
      creations.push({ path: targetRelPath, content: templateContent, checksum: templateChecksum });
    }
  }

  // 5. Apply changes
  if (options.dryRun) {
    logger.log('\nDry Run Results:');
    creations.forEach((f) => logger.log(chalk.green(`  + Create: ${f.path}`)));
    updates.forEach((f) => logger.log(chalk.blue(`  ~ Update: ${f.path}`)));
    newFiles.forEach((f) => logger.log(chalk.yellow(`  ? Create: ${f.path}`)));
    skips.forEach((f) => logger.log(chalk.gray(`  - Skip: ${f.path} (${f.reason})`)));
  } else {
    const criticalFailures = [];
    const optionalFailures = [];
    const recordFailure = (bucket, filePath, error) => {
      bucket.push({ path: filePath, message: error?.message || 'Check file permissions.' });
    };

    // Write creations
    for (const f of creations) {
      const outputPath = path.join(projectRoot, f.path);
      try {
        fse.outputFileSync(outputPath, f.content);
        manifest.files[f.path] = f.checksum;
        logger.log(chalk.green(`  Created: ${f.path}`));
      } catch (error) {
        recordFailure(criticalFailures, f.path, error);
      }
    }
    // Write updates
    for (const f of updates) {
      const outputPath = path.join(projectRoot, f.path);
      try {
        fse.outputFileSync(outputPath, f.content);
        manifest.files[f.path] = f.checksum;
        logger.log(chalk.blue(`  Updated: ${f.path}`));
      } catch (error) {
        recordFailure(criticalFailures, f.path, error);
      }
    }
    // Write .new files
    for (const f of newFiles) {
      const outputPath = path.join(projectRoot, f.path);
      try {
        fse.outputFileSync(outputPath, f.content);
        logger.log(chalk.yellow(`  Created: ${f.path}`));
      } catch (error) {
        recordFailure(criticalFailures, f.path, error);
      }
    }

    // Write Manifest
    try {
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    } catch (error) {
      recordFailure(criticalFailures, path.relative(projectRoot, manifestPath), error);
    }

    // Update .gitignore
    if (options.gitignore) {
      const gitignorePath = path.join(projectRoot, '.gitignore');
      const ignoreEntries = [`${cursorDirName}/HYDRATE.md`, 'docs/hydration-prompt.md'];
      try {
        if (fs.existsSync(gitignorePath)) {
          const content = fs.readFileSync(gitignorePath, 'utf-8');
          const missingEntries = ignoreEntries.filter((entry) => !content.includes(entry));
          if (missingEntries.length > 0) {
            fs.appendFileSync(gitignorePath, `\n${missingEntries.join('\n')}\n`);
            logger.log(chalk.gray('  Updated .gitignore'));
          }
        } else {
          fs.writeFileSync(gitignorePath, `${ignoreEntries.join('\n')}\n`);
          logger.log(chalk.green('  Created .gitignore'));
        }
      } catch (error) {
        recordFailure(optionalFailures, path.relative(projectRoot, gitignorePath), error);
      }
    }

    // Add scripts to package.json
    if (!options.zeroConfig) {
      const pkgPath = path.join(projectRoot, 'package.json');
      if (fs.existsSync(pkgPath)) {
        try {
          const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
          pkg.scripts = pkg.scripts || {};

          const newScripts = {
            'ai-kit:verify': 'node scripts/hydrate-verify.js',
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
              logger.warn(chalk.yellow(`  Skipping script "${key}": already exists`));
            }
          }

          if (scriptsAdded) {
            fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
            logger.log(chalk.gray('  Updated package.json scripts'));
          }
        } catch (error) {
          recordFailure(optionalFailures, path.relative(projectRoot, pkgPath), error);
        }
      }
    }

    if (criticalFailures.length > 0) {
      logger.error(chalk.red('\n❌ Some required files could not be written:'));
      criticalFailures.forEach((failure) => {
        logger.error(chalk.red(`- ${failure.path}: ${failure.message}`));
      });
      logger.error(
        chalk.gray(
          `\n💡 If ${cursorDirName} is locked, retry with --cursor-dir <dir> or AI_KIT_CURSOR_DIR.`
        )
      );
      process.exit(1);
    }

    if (optionalFailures.length > 0) {
      logger.warn(chalk.yellow('\n⚠️  Optional files could not be written:'));
      optionalFailures.forEach((failure) => {
        logger.warn(chalk.yellow(`- ${failure.path}: ${failure.message}`));
      });
      logger.warn(chalk.gray('   You can update these files manually.'));
    }

    // Success Message & Clipboard
    logger.log(chalk.green('\n✅ AI Kit scaffolded successfully!'));

    // Project detection
    const detectedProjects = detectProject(projectRoot);
    if (detectedProjects.length > 0) {
      const labels = detectedProjects.map((p) => p.label).join(', ');
      logger.log(chalk.blue(`\n📦 Detected: ${labels}`));

      // Show relevant hints
      const hints = detectedProjects.flatMap((p) => {
        if (p.key === 'nextjs') {
          const router = detectNextRouter(projectRoot);
          const candidate = router ? p.hintCandidates?.[router] : null;
          return candidate ? [formatHint(cursorRulesDir, candidate)] : [];
        }
        return p.hintCandidate ? [formatHint(cursorRulesDir, p.hintCandidate)] : [];
      });
      if (hints.length > 0 && !isCompact) {
        logger.log(chalk.gray('\nSuggestions based on your stack:'));
        hints.slice(0, 3).forEach((hint) => {
          logger.log(chalk.gray(`  • ${hint}`));
        });
      }
    }

    // Read Hydration prompt, save fallback, and copy to clipboard
    const hydratePath = path.join(projectRoot, cursorDirName, 'HYDRATE.md');
    if (fs.existsSync(hydratePath)) {
      const hydrateContent = fs.readFileSync(hydratePath, 'utf-8');
      const docsHydratePath = path.join(projectRoot, 'docs', 'hydration-prompt.md');
      const docsHydrateContent = [
        '# Hydration Prompt (Generated)',
        '',
        'This file is generated by create-ai-kit.',
        `Source of truth: ${cursorDirName}/HYDRATE.md.`,
        'Use this if your clipboard is empty.',
        'Not part of the docs-update workflow.',
        '',
        '---',
        '',
        hydrateContent.trimEnd(),
        '',
      ].join('\n');

      if (!options.dryRun) {
        try {
          fse.outputFileSync(docsHydratePath, docsHydrateContent);
          logger.log(chalk.gray('\n📄 Hydration prompt saved to docs/hydration-prompt.md'));
        } catch (e) {
          logger.log(chalk.gray('\n📄 Could not save docs/hydration-prompt.md.'));
          logger.log(chalk.gray(`   ${e.message || 'Check file permissions.'}`));
        }
      }

      if (clipboardy && !options.ci) {
        try {
          clipboardy.writeSync(hydrateContent);
          logger.log(chalk.cyan('\n📋 Hydration prompt copied to clipboard!'));
          logger.log(chalk.gray('   If your clipboard is empty, use docs/hydration-prompt.md.'));
        } catch {
          logger.log(chalk.gray('\n📋 Could not copy to clipboard.'));
          logger.log(chalk.gray('   Use docs/hydration-prompt.md instead.'));
        }
      } else if (!options.ci) {
        logger.log(chalk.gray('\n📋 Clipboard not available in this environment.'));
        logger.log(chalk.gray('   Use docs/hydration-prompt.md instead.'));
      }

      if (outputMode === OUTPUT_MODES.FULL && options.printPrompt) {
        logger.log('\n📎 Copyable hydration prompt:');
        logger.log(chalk.gray('--- HYDRATION PROMPT START ---'));
        logger.log(hydrateContent.trimEnd());
        logger.log(chalk.gray('--- HYDRATION PROMPT END ---\n'));
      } else if (outputMode === OUTPUT_MODES.FULL) {
        logger.log(chalk.gray('\n📎 Prompt output suppressed (use --print-prompt to show it).'));
      }
    }

    if (!options.quiet && !options.ci) {
      logger.log(
        chalk.cyan('\n💡 Paste the prompt in Cursor Composer (Cmd+Shift+I) in Plan mode.')
      );
      logger.log(chalk.gray('   The agent may ask for confirmation on some changes.'));
      logger.log(chalk.gray('   Hydration can take a while on large projects.'));
      logger.log(chalk.gray('   Review hydrated docs after — AI can make mistakes.'));
      if (!options.zeroConfig) {
        logger.log(chalk.gray('\n   Verify: npm run ai-kit:verify'));
      }
      logger.log(
        chalk.gray('   ESLint: if configured, run npx create-ai-kit eslint-setup (run yourself)')
      );
    }
  }
}

async function runLint(options) {
  const outputMode = getOutputMode(options);
  const logger = createLogger(outputMode);
  const cursorDirName = resolveCursorDirName(process.cwd(), options, { dryRun: true });
  const targetPath = options.file
    ? path.resolve(process.cwd(), options.file)
    : resolveHydrationPromptPath(process.cwd(), cursorDirName);

  if (!fs.existsSync(targetPath)) {
    logger.error(chalk.red('❌ Hydration prompt not found.'));
    logger.error(chalk.gray('   Provide --file or generate docs/hydration-prompt.md.'));
    process.exit(1);
  }

  const content = fs.readFileSync(targetPath, 'utf-8');
  const warnings = lintPromptContent(content, {
    maxLines: Number.isFinite(options.maxLines) ? options.maxLines : 220,
    maxChars: Number.isFinite(options.maxChars) ? options.maxChars : 20000,
    maxRepeatedLines: Number.isFinite(options.maxRepeatedLines) ? options.maxRepeatedLines : 4,
  });

  logger.log(chalk.blue('🔍 Linting hydration prompt...'));
  logger.log(chalk.gray(`   File: ${path.relative(process.cwd(), targetPath)}`));

  if (warnings.length === 0) {
    logger.log(chalk.green('\n✅ Prompt lint: PASS'));
    process.exit(0);
  }

  logger.warn(chalk.yellow('\n⚠️  Prompt lint: WARN'));
  warnings.forEach((warning) => {
    logger.warn(chalk.yellow(`- ${warning}`));
  });
  process.exit(1);
}

// ESLint config detection and patching
const ESLINT_CONFIG_FILES = [
  { file: 'eslint.config.js', type: 'flat' },
  { file: 'eslint.config.mjs', type: 'flat' },
  { file: 'eslint.config.cjs', type: 'flat' },
  { file: '.eslintrc.js', type: 'legacy-js' },
  { file: '.eslintrc.cjs', type: 'legacy-js' },
  { file: '.eslintrc.json', type: 'legacy-json' },
  { file: '.eslintrc.yml', type: 'legacy-yaml' },
  { file: '.eslintrc.yaml', type: 'legacy-yaml' },
  { file: '.eslintrc', type: 'legacy-json' },
];

function detectEslintConfig(projectRoot) {
  for (const config of ESLINT_CONFIG_FILES) {
    const configPath = path.join(projectRoot, config.file);
    if (fs.existsSync(configPath)) {
      return { ...config, path: configPath };
    }
  }

  // Check package.json for eslintConfig
  const pkgPath = path.join(projectRoot, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      if (pkg.eslintConfig) {
        return { file: 'package.json', type: 'package-json', path: pkgPath };
      }
    } catch {
      // Ignore parse errors
    }
  }

  return null;
}

function generateFlatConfigPatch() {
  return `
// AI Kit ESLint rules - added by create-ai-kit eslint-setup
const aiKitRules = require('./eslint-rules');

// Add this to your config array:
// {
//   plugins: { 'ai-kit': aiKitRules },
//   rules: {
//     'ai-kit/docs-marker-expiry': ['error', { maxDays: 14 }],
//     'ai-kit/docs-marker-expiring': ['warn', { maxDays: 14, warnDays: 7 }],
//   },
// }
`;
}

function generateLegacyJsPatch() {
  return `
// AI Kit ESLint rules - added by create-ai-kit eslint-setup
// Add to your module.exports:
//   plugins: ['./eslint-rules'],
//   rules: {
//     './eslint-rules/docs-marker-expiry': ['error', { maxDays: 14 }],
//     './eslint-rules/docs-marker-expiring': ['warn', { maxDays: 14, warnDays: 7 }],
//   },
`;
}

async function runEslintSetup(options) {
  const projectRoot = process.cwd();
  const outputMode = getOutputMode(options);
  const logger = createLogger(outputMode);

  logger.log(chalk.blue('🔧 Setting up AI Kit ESLint rules...\n'));

  // Check if eslint-rules folder exists
  const eslintRulesPath = path.join(projectRoot, 'eslint-rules');
  if (!fs.existsSync(eslintRulesPath)) {
    logger.error(chalk.red('❌ eslint-rules/ folder not found.'));
    logger.log(chalk.gray('   Run `npx create-ai-kit` first to install AI Kit.'));
    process.exit(1);
  }

  // Detect ESLint config
  const config = detectEslintConfig(projectRoot);

  if (!config) {
    logger.warn(chalk.yellow('⚠️  No ESLint configuration found.'));
    logger.log(chalk.gray('   Create an ESLint config first, then run this command again.'));
    logger.log(
      chalk.gray('   Supported: eslint.config.js, .eslintrc.js, .eslintrc.json, .eslintrc.yml')
    );
    process.exit(1);
  }

  logger.log(chalk.gray(`   Detected: ${config.file} (${config.type})`));

  // Handle different config types
  if (config.type === 'flat') {
    await patchFlatConfig(config, logger, options);
  } else if (config.type === 'legacy-js') {
    await patchLegacyJsConfig(config, logger, options);
  } else if (config.type === 'legacy-json') {
    await patchLegacyJsonConfig(config, logger, options);
  } else if (config.type === 'legacy-yaml') {
    logger.warn(chalk.yellow('\n⚠️  YAML config detected. Manual setup required.'));
    logger.log(chalk.gray('   Add these to your .eslintrc.yml:'));
    logger.log(
      chalk.cyan(`
plugins:
  - ./eslint-rules

rules:
  ./eslint-rules/docs-marker-expiry:
    - error
    - maxDays: 14
  ./eslint-rules/docs-marker-expiring:
    - warn
    - maxDays: 14
      warnDays: 7
`)
    );
    process.exit(0);
  } else if (config.type === 'package-json') {
    await patchPackageJsonConfig(config, logger, options);
  }
}

async function patchFlatConfig(config, logger, options) {
  const content = fs.readFileSync(config.path, 'utf-8');

  // Check if already patched
  if (content.includes('ai-kit') || content.includes('eslint-rules')) {
    logger.log(chalk.green('✅ ESLint config already includes AI Kit rules.'));
    return;
  }

  // Generate the patch
  const importLine = "const aiKitRules = require('./eslint-rules');";
  const configBlock = `  {
    plugins: { 'ai-kit': aiKitRules },
    rules: {
      'ai-kit/docs-marker-expiry': ['error', { maxDays: 14 }],
      'ai-kit/docs-marker-expiring': ['warn', { maxDays: 14, warnDays: 7 }],
    },
  },`;

  // Try to patch automatically
  let patched = content;

  // Add import at the top (after other requires)
  if (!patched.includes(importLine)) {
    const lastRequireMatch = patched.match(/.*require\(.+\);?\s*\n/g);
    if (lastRequireMatch) {
      const lastRequire = lastRequireMatch[lastRequireMatch.length - 1];
      patched = patched.replace(lastRequire, lastRequire + importLine + '\n');
    } else {
      patched = importLine + '\n\n' + patched;
    }
  }

  // Add config block to the array
  const exportMatch = patched.match(/module\.exports\s*=\s*\[/);
  if (exportMatch) {
    patched = patched.replace(/module\.exports\s*=\s*\[/, `module.exports = [\n${configBlock}`);
  } else {
    // Can't auto-patch, show manual instructions
    logger.warn(chalk.yellow('\n⚠️  Could not auto-patch. Add manually:'));
    logger.log(chalk.cyan(`\n// At the top:\n${importLine}\n`));
    logger.log(chalk.cyan(`// In your config array:\n${configBlock}`));
    return;
  }

  if (options.dryRun) {
    logger.log(chalk.gray('\n--- Dry run: would write ---'));
    logger.log(patched);
    return;
  }

  fs.writeFileSync(config.path, patched);
  logger.log(chalk.green(`\n✅ Patched ${config.file}`));
  logger.log(chalk.gray('   Run `npm run lint` to verify.'));
}

async function patchLegacyJsConfig(config, logger, options) {
  const content = fs.readFileSync(config.path, 'utf-8');

  // Check if already patched
  if (content.includes('eslint-rules')) {
    logger.log(chalk.green('✅ ESLint config already includes AI Kit rules.'));
    return;
  }

  // Legacy JS is harder to patch safely - provide instructions
  logger.log(chalk.cyan('\n📝 Add these to your ESLint config:\n'));
  logger.log(chalk.white(`// In ${config.file}, add to module.exports:`));
  logger.log(
    chalk.cyan(`
  plugins: ['./eslint-rules'],
  rules: {
    './eslint-rules/docs-marker-expiry': ['error', { maxDays: 14 }],
    './eslint-rules/docs-marker-expiring': ['warn', { maxDays: 14, warnDays: 7 }],
  },
`)
  );
  logger.log(chalk.gray('If you already have plugins/rules, merge them.'));
}

async function patchLegacyJsonConfig(config, logger, options) {
  let content;
  let jsonConfig;

  try {
    content = fs.readFileSync(config.path, 'utf-8');
    jsonConfig = JSON.parse(content);
  } catch (e) {
    logger.error(chalk.red(`❌ Failed to parse ${config.file}: ${e.message}`));
    process.exit(1);
  }

  // Check if already patched
  const plugins = jsonConfig.plugins || [];
  if (plugins.includes('./eslint-rules')) {
    logger.log(chalk.green('✅ ESLint config already includes AI Kit rules.'));
    return;
  }

  // Patch the config
  jsonConfig.plugins = [...plugins, './eslint-rules'];
  jsonConfig.rules = jsonConfig.rules || {};
  jsonConfig.rules['./eslint-rules/docs-marker-expiry'] = ['error', { maxDays: 14 }];
  jsonConfig.rules['./eslint-rules/docs-marker-expiring'] = ['warn', { maxDays: 14, warnDays: 7 }];

  if (options.dryRun) {
    logger.log(chalk.gray('\n--- Dry run: would write ---'));
    logger.log(JSON.stringify(jsonConfig, null, 2));
    return;
  }

  fs.writeFileSync(config.path, JSON.stringify(jsonConfig, null, 2) + '\n');
  logger.log(chalk.green(`\n✅ Patched ${config.file}`));
  logger.log(chalk.gray('   Run `npm run lint` to verify.'));
}

async function patchPackageJsonConfig(config, logger, options) {
  let content;
  let pkg;

  try {
    content = fs.readFileSync(config.path, 'utf-8');
    pkg = JSON.parse(content);
  } catch (e) {
    logger.error(chalk.red(`❌ Failed to parse package.json: ${e.message}`));
    process.exit(1);
  }

  const eslintConfig = pkg.eslintConfig || {};

  // Check if already patched
  const plugins = eslintConfig.plugins || [];
  if (plugins.includes('./eslint-rules')) {
    logger.log(chalk.green('✅ ESLint config already includes AI Kit rules.'));
    return;
  }

  // Patch the config
  eslintConfig.plugins = [...plugins, './eslint-rules'];
  eslintConfig.rules = eslintConfig.rules || {};
  eslintConfig.rules['./eslint-rules/docs-marker-expiry'] = ['error', { maxDays: 14 }];
  eslintConfig.rules['./eslint-rules/docs-marker-expiring'] = [
    'warn',
    { maxDays: 14, warnDays: 7 },
  ];
  pkg.eslintConfig = eslintConfig;

  if (options.dryRun) {
    logger.log(chalk.gray('\n--- Dry run: would write ---'));
    logger.log(JSON.stringify(pkg, null, 2));
    return;
  }

  fs.writeFileSync(config.path, JSON.stringify(pkg, null, 2) + '\n');
  logger.log(chalk.green('\n✅ Patched package.json eslintConfig'));
  logger.log(chalk.gray('   Run `npm run lint` to verify.'));
}

async function main() {
  program
    .name('create-ai-kit')
    .version(pkg.version)
    .enablePositionalOptions()
    .passThroughOptions()
    .option('--force', 'Overwrite existing files or upgrade')
    .option('--dry-run', 'Preview changes without writing')
    .option('--yes', 'Skip confirmation prompts')
    .option('--no-gitignore', 'Skip .gitignore updates')
    .option('--quiet', 'Limit output (CI-friendly)')
    .option('--ci', 'Disable prompts and clipboard output')
    .option('--cursor-dir <dir>', 'Use custom Cursor directory (default: .cursor)')
    .option('--minimal', 'Install only cursor rules + minimal docs (respects --cursor-dir)')
    .option('--zero-config', 'Deprecated: use --minimal')
    .option('--print-prompt', 'Print full hydration prompt to stdout')
    .argument('[targetDir]', 'Target directory (defaults to current)')
    .action(async (targetDir, options) => {
      await runInit(targetDir, options);
    });

  program
    .command('lint')
    .description('Lint hydration prompt for size and repetition')
    .option('--quiet', 'Limit output (CI-friendly)')
    .option('--ci', 'Disable prompts and clipboard output')
    .option('--file <path>', 'Prompt file to lint')
    .option('--cursor-dir <dir>', 'Use custom Cursor directory (default: .cursor)')
    .option('--max-lines <number>', 'Maximum line count', (val) => Number.parseInt(val, 10))
    .option('--max-chars <number>', 'Maximum character count', (val) => Number.parseInt(val, 10))
    .option('--max-repeated-lines <number>', 'Minimum repeats to flag a line', (val) =>
      Number.parseInt(val, 10)
    )
    .action(async (options) => {
      await runLint(options);
    });

  program
    .command('eslint-setup')
    .description('Add AI Kit ESLint rules to your existing config')
    .option('-n, --dry-run', 'Preview changes without writing')
    .option('-q, --quiet', 'Limit output')
    .action(async (options) => {
      await runEslintSetup(options);
    });

  program.parse(process.argv);
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
