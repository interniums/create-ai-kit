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
    hints: [
      'Consider creating .cursor/rules/app-router.mdc for App Router conventions',
      'Consider creating .cursor/rules/pages-router.mdc for Pages Router conventions',
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

// Files to always preserve during upgrade (never overwrite with template)
const PRESERVE_LIST = [
  'AGENTS.md',
  '.cursor/rules/main.mdc',
  '.cursor/HYDRATE.md', // Should not exist usually, but if it does
];

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

function resolveHydrationPromptPath(projectRoot) {
  const preferred = path.join(projectRoot, 'docs', 'hydration-prompt.md');
  const fallback = path.join(projectRoot, '.cursor', 'HYDRATE.md');
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
  const isCompact = outputMode === OUTPUT_MODES.COMPACT;

  logger.log(chalk.blue('🚀 Initializing AI Kit...'));

  if (!fs.existsSync(projectRoot)) {
    fse.ensureDirSync(projectRoot);
    logger.log(chalk.gray(`  Created target directory: ${projectRoot}`));
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
  const cursorDir = path.join(projectRoot, '.cursor');
  const manifestPath = path.join(projectRoot, MANIFEST_FILE);
  const hasCursor = fs.existsSync(cursorDir);
  const hasManifest = fs.existsSync(manifestPath);
  const safeUpgradeWithoutManifest = hasCursor && !hasManifest && !options.force;

  if (safeUpgradeWithoutManifest) {
    logger.warn(chalk.yellow('⚠️  A .cursor folder already exists without a manifest.'));
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
            '⚠️  Zero-config requested on an existing install. Keeping manifest entries to avoid data loss.'
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
    const targetPath = path.join(projectRoot, targetRelPath);

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
    // Write creations
    for (const f of creations) {
      fse.outputFileSync(path.join(projectRoot, f.path), f.content);
      manifest.files[f.path] = f.checksum;
      logger.log(chalk.green(`  Created: ${f.path}`));
    }
    // Write updates
    for (const f of updates) {
      fse.outputFileSync(path.join(projectRoot, f.path), f.content);
      manifest.files[f.path] = f.checksum;
      logger.log(chalk.blue(`  Updated: ${f.path}`));
    }
    // Write .new files
    for (const f of newFiles) {
      fse.outputFileSync(path.join(projectRoot, f.path), f.content);
      logger.log(chalk.yellow(`  Created: ${f.path}`));
    }

    // Write Manifest
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

    // Update .gitignore
    if (options.gitignore) {
      const gitignorePath = path.join(projectRoot, '.gitignore');
      const ignoreEntries = ['.cursor/HYDRATE.md', 'docs/hydration-prompt.md'];
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
    }

    // Add scripts to package.json
    if (!options.zeroConfig) {
      const pkgPath = path.join(projectRoot, 'package.json');
      if (fs.existsSync(pkgPath)) {
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
      }
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
          if (router === 'app') {
            return [p.hints[0]];
          }
          if (router === 'pages') {
            return [p.hints[1]];
          }
          return [];
        }
        return p.hints || [];
      });
      if (hints.length > 0 && !isCompact) {
        logger.log(chalk.gray('\nSuggestions based on your stack:'));
        hints.slice(0, 3).forEach((hint) => {
          logger.log(chalk.gray(`  • ${hint}`));
        });
      }
    }

    // Read Hydration prompt, save fallback, and copy to clipboard
    const hydratePath = path.join(projectRoot, '.cursor/HYDRATE.md');
    if (fs.existsSync(hydratePath)) {
      const hydrateContent = fs.readFileSync(hydratePath, 'utf-8');
      const docsHydratePath = path.join(projectRoot, 'docs', 'hydration-prompt.md');
      const docsHydrateContent = [
        '# Hydration Prompt (Generated)',
        '',
        'This file is generated by create-ai-kit.',
        'Source of truth: .cursor/HYDRATE.md.',
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
        logger.log(chalk.gray('   Note: AI hydration can make mistakes. Review docs after.'));
      }
    }

    if (!options.quiet && !options.ci) {
      logger.log('\nNext steps:');
      logger.log('  1. Open Cursor (Cmd+Shift+I for Composer)');
      logger.log('  2. Paste the prompt (Cmd+V or docs/hydration-prompt.md)');
      logger.log('  3. Run it in Plan mode for better hydration');
      logger.log('  4. Let the AI configure your project');
      logger.log('  5. Review hydrated docs for accuracy (AI can make mistakes)');
      if (!options.zeroConfig) {
        logger.log('  6. Run npm run ai-kit:verify after hydration');
      }
    }
  }
}

async function runLint(options) {
  const outputMode = getOutputMode(options);
  const logger = createLogger(outputMode);
  const targetPath = options.file
    ? path.resolve(process.cwd(), options.file)
    : resolveHydrationPromptPath(process.cwd());

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

async function main() {
  program
    .name('create-ai-kit')
    .version(pkg.version)
    .option('--force', 'Overwrite existing files or upgrade')
    .option('--dry-run', 'Preview changes without writing')
    .option('--yes', 'Skip confirmation prompts')
    .option('--no-gitignore', 'Skip .gitignore updates')
    .option('--quiet', 'Limit output (CI-friendly)')
    .option('--ci', 'Disable prompts and clipboard output')
    .option('--zero-config', 'Install only .cursor/rules + minimal docs')
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
    .option('--max-lines <number>', 'Maximum line count', (val) => Number.parseInt(val, 10))
    .option('--max-chars <number>', 'Maximum character count', (val) => Number.parseInt(val, 10))
    .option('--max-repeated-lines <number>', 'Minimum repeats to flag a line', (val) =>
      Number.parseInt(val, 10)
    )
    .action(async (options) => {
      await runLint(options);
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
