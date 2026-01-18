#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { program } = require('commander');
const chalk = require('chalk');
const fse = require('fs-extra');
const clipboardy = require('clipboardy');
const readline = require('readline');

const PROJECT_ROOT = process.cwd();
const MANIFEST_FILE = '.ai-kit-manifest.json';
const TEMPLATES_DIR = path.join(__dirname, '../templates');

// Files to always preserve during upgrade (never overwrite with template)
const PRESERVE_LIST = [
  'AGENTS.md',
  '.cursor/rules/main.mdc',
  '.cursor/HYDRATE.md' // Should not exist usually, but if it does
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
    .version('1.0.0')
    .option('--force', 'Overwrite existing files or upgrade')
    .option('--dry-run', 'Preview changes without writing')
    .option('--yes', 'Skip confirmation prompts')
    .parse(process.argv);

  const options = program.opts();

  console.log(chalk.blue('🚀 Initializing AI Kit...'));

  // 1. Check for collision
  const cursorDir = path.join(PROJECT_ROOT, '.cursor');
  const manifestPath = path.join(PROJECT_ROOT, MANIFEST_FILE);
  const hasCursor = fs.existsSync(cursorDir);
  const hasManifest = fs.existsSync(manifestPath);

  if (hasCursor && !options.force && !hasManifest) {
    console.error(chalk.red('⚠️  A .cursor folder already exists.'));
    console.error('   Run with --force to upgrade/overwrite.');
    process.exit(1);
  }

  // 2. Load Manifest if exists
  let manifest = { version: '1.0.0', files: {} };
  if (hasManifest) {
    try {
      manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    } catch (e) {
      console.warn('⚠️  Could not read existing manifest.');
    }
  }

  // 3. Confirm if destructive
  if (options.force && !options.yes && !options.dryRun) {
    const confirmed = await confirm(chalk.yellow('⚠️  You used --force. This may overwrite files. Continue? (y/N) '));
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
    if (PRESERVE_LIST.some(p => targetRelPath.endsWith(p)) && fs.existsSync(targetPath)) {
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
        const userModified = lastChecksum && lastChecksum !== currentChecksum;

        if (options.force) {
            if (userModified) {
                // User modified file: create .new
                newFiles.push({ path: targetRelPath + '.new', content: templateContent });
                console.log(chalk.yellow(`  Conflict: ${targetRelPath} modified by user. Creating .new file.`));
            } else {
                // Safe to update
                updates.push({ path: targetRelPath, content: templateContent, checksum: templateChecksum });
            }
        } else {
             console.log(chalk.yellow(`  Skipping existing file: ${targetRelPath} (use --force to overwrite)`));
        }
    } else {
        creations.push({ path: targetRelPath, content: templateContent, checksum: templateChecksum });
    }
  }

  // 5. Apply changes
  if (options.dryRun) {
    console.log('\nDry Run Results:');
    creations.forEach(f => console.log(chalk.green(`  + Create: ${f.path}`)));
    updates.forEach(f => console.log(chalk.blue(`  ~ Update: ${f.path}`)));
    newFiles.forEach(f => console.log(chalk.yellow(`  ? Create: ${f.path}`)));
    skips.forEach(f => console.log(chalk.gray(`  - Skip: ${f.path} (${f.reason})`)));
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
            "docs:update": "node scripts/docs-update/generate-context.js",
            "docs:find-markers": "bash scripts/docs-update/find-markers.sh",
            "docs:verify-inline": "node scripts/docs-update/verify-inline.js"
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
    
    // Read Hydration prompt
    const hydratePath = path.join(PROJECT_ROOT, '.cursor/HYDRATE.md');
    if (fs.existsSync(hydratePath)) {
        const hydrateContent = fs.readFileSync(hydratePath, 'utf-8');
        
        try {
            clipboardy.writeSync(hydrateContent);
            console.log(chalk.cyan('📋 Hydration prompt copied to clipboard!'));
        } catch (e) {
            console.log(chalk.gray('  (Could not copy to clipboard - see .cursor/HYDRATE.md)'));
        }
    }

    console.log('\nNext steps:');
    console.log('  1. Open Cursor (Cmd+Shift+I for Composer)');
    console.log('  2. Paste the prompt (Cmd+V)');
    console.log('  3. Let the AI configure your project');
  }
}

main().catch(e => {
    console.error(chalk.red('Unexpected error:'), e);
    process.exit(1);
});
