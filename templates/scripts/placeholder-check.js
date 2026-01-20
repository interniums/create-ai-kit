#!/usr/bin/env node

/**
 * Placeholder Check
 *
 * Scans the project for hydration placeholders like AI_FILL and template files.
 * Exit codes:
 *   0 - No placeholders found
 *   1 - Placeholders found
 *
 * Usage:
 *   node scripts/placeholder-check.js
 */

/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');
let picomatch = null;
try {
  picomatch = require('picomatch');
} catch {
  picomatch = null;
}

const DEFAULT_EXCLUDE_PATTERNS = [
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**',
  '**/.next/**',
  '**/.git/**',
  '.git',
  '**/coverage/**',
  '**/.cursor/**',
  '**/docs/templates/**',
  '.ai-kit-manifest.json',
  'docs/hydration-prompt.md',
];

const DEFAULT_CONFIG = {
  excludePatterns: DEFAULT_EXCLUDE_PATTERNS,
};

const INTERNAL_IGNORE_PREFIXES = [
  'scripts/docs-update/',
  'scripts/placeholder-check.js',
  'scripts/hydrate-verify.js',
  '.cursor/commands/',
];

const TEXT_EXTENSIONS = new Set([
  '.md',
  '.mdc',
  '.txt',
  '.json',
  '.yml',
  '.yaml',
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
  '.mjs',
  '.cjs',
  '.css',
  '.scss',
  '.html',
  '.py',
  '.rb',
  '.go',
  '.rs',
  '.java',
  '.kt',
  '.swift',
  '.cs',
  '.php',
  '.toml',
]);

const PLACEHOLDER_PATTERNS = [
  { id: 'AI_FILL', regex: /AI_FILL/ },
  { id: '_TEMPLATE', regex: /_TEMPLATE/ },
  { id: 'DOCS-TEMPLATE', regex: /DOCS-TEMPLATE/ },
];

const LOCK_FILE = '.ai-kit-placeholder-check.lock';
const LOCK_TIMEOUT_MS = 30 * 60 * 1000;
const PROGRESS_INTERVAL_MS = 750;

/**
 * Load config from .cursor/ai-kit.config.json
 */
function loadConfig() {
  const configPath = path.join(process.cwd(), '.cursor/ai-kit.config.json');

  if (fs.existsSync(configPath)) {
    try {
      const content = fs.readFileSync(configPath, 'utf-8');
      const config = JSON.parse(content);

      // Filter out AI_FILL placeholders
      if (config.sourceRoots) {
        config.sourceRoots = config.sourceRoots.filter((root) => !root.includes('AI_FILL'));
      }

      if (config.excludePatterns) {
        config.excludePatterns = config.excludePatterns.map((pattern) =>
          pattern.replace(/\\/g, '/')
        );
      }
      const mergedExcludes = [...DEFAULT_EXCLUDE_PATTERNS, ...(config.excludePatterns || [])];
      return {
        ...DEFAULT_CONFIG,
        ...config,
        excludePatterns: [...new Set(mergedExcludes)],
      };
    } catch {
      return DEFAULT_CONFIG;
    }
  }

  return DEFAULT_CONFIG;
}

/**
 * Check if path should be excluded
 */
function normalizePath(filePath) {
  return filePath.replace(/\\/g, '/');
}

function globToRegex(globPattern) {
  return globPattern
    .replace(/\*\*\/?/g, '__GLOBSTAR__')
    .replace(/\*/g, '[^/]*')
    .replace(/__GLOBSTAR__/g, '.*');
}

function fallbackMatch(filePath, patterns) {
  return patterns.some((pattern) => {
    const normalizedPattern = normalizePath(pattern);
    const hasTrailingGlob = normalizedPattern.endsWith('/**');

    if (hasTrailingGlob) {
      const basePattern = normalizedPattern.slice(0, -3);
      const baseRegex = new RegExp(globToRegex(basePattern));
      if (baseRegex.test(filePath)) {
        return true;
      }
    }

    const regex = new RegExp(globToRegex(normalizedPattern));
    return regex.test(filePath);
  });
}

function isExcluded(filePath, excludePatterns) {
  const normalizedPath = normalizePath(filePath);
  if (picomatch) {
    return picomatch(excludePatterns, { dot: true })(normalizedPath);
  }
  return fallbackMatch(normalizedPath, excludePatterns);
}

/**
 * Check if file is likely text-based
 */
function isTextFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return TEXT_EXTENSIONS.has(ext);
}

/**
 * Recursively find all text files
 */
function hasGitMarker(dir) {
  const gitPath = path.join(dir, '.git');
  return fs.existsSync(gitPath);
}

function createProgressReporter() {
  const isTTY = process.stdout.isTTY;
  const interval = isTTY ? PROGRESS_INTERVAL_MS : PROGRESS_INTERVAL_MS * 2;
  let lastUpdate = Date.now();
  let fileCount = 0;
  let dirCount = 0;

  const render = () => {
    const message = `🔎 Scanning... ${fileCount} files, ${dirCount} dirs`;
    if (isTTY) {
      process.stdout.write(`\r${message} (Ctrl+C to stop)`);
    } else {
      console.log(message);
    }
  };

  return {
    tick: (type) => {
      if (type === 'file') {
        fileCount += 1;
      } else if (type === 'dir') {
        dirCount += 1;
      }
      const now = Date.now();
      if (now - lastUpdate >= interval) {
        render();
        lastUpdate = now;
      }
    },
    done: () => {
      if (isTTY) {
        process.stdout.write('\r');
        process.stdout.write(' '.repeat(80));
        process.stdout.write('\r');
      }
    },
  };
}

function findTextFiles(dir, config, files = [], rootDir = dir, progress = null) {
  if (!fs.existsSync(dir)) {
    return files;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = normalizePath(path.relative(process.cwd(), fullPath));

    if (INTERNAL_IGNORE_PREFIXES.some((prefix) => relativePath.startsWith(prefix))) {
      continue;
    }

    if (isExcluded(relativePath, config.excludePatterns)) {
      continue;
    }

    if (entry.isSymbolicLink()) {
      continue;
    }

    if (entry.isDirectory()) {
      if (entry.name === '.git') {
        continue;
      }
      if (fullPath !== rootDir && hasGitMarker(fullPath)) {
        continue;
      }
      progress?.tick('dir');
      findTextFiles(fullPath, config, files, rootDir, progress);
    } else if (entry.isFile() && isTextFile(fullPath)) {
      progress?.tick('file');
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Check for placeholder file names
 */
function scanFileName(filePath) {
  const baseName = path.basename(filePath);
  const isTemplateName =
    baseName.includes('_TEMPLATE') ||
    baseName.includes('DOCS-TEMPLATE') ||
    baseName.toLowerCase().includes('.template.');

  if (!isTemplateName) {
    return [];
  }

  return [
    {
      type: 'filename',
      placeholder: 'TEMPLATE_FILE',
      line: null,
      content: baseName,
    },
  ];
}

/**
 * Scan a file for placeholder markers
 */
function scanFileContent(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const markers = [];

  lines.forEach((line, index) => {
    for (const pattern of PLACEHOLDER_PATTERNS) {
      if (pattern.regex.test(line)) {
        markers.push({
          type: 'content',
          placeholder: pattern.id,
          line: index + 1,
          content: line.trim(),
        });
      }
    }
  });

  return markers;
}

/**
 * Format a remediation prompt for agents
 */
function buildRemediationPrompt(results) {
  const lines = [];

  lines.push('You are finishing AI Kit hydration. Resolve all placeholders below.');
  lines.push('');
  lines.push('Instructions:');
  lines.push('- Replace every AI_FILL block with real project content.');
  lines.push(
    '- Remove or rename template-only files (DOCS-TEMPLATE.md, _template.mdc, .template.*).'
  );
  lines.push('- Delete .cursor/HYDRATE.md after hydration is complete.');
  lines.push('- If you intentionally keep a template file, explain why.');
  lines.push('');
  lines.push('Files to fix:');

  for (const fileResult of results) {
    const entries = fileResult.markers
      .map((marker) => {
        if (marker.type === 'filename') {
          return 'filename placeholder';
        }
        return `line ${marker.line}: ${marker.placeholder}`;
      })
      .join(', ');
    lines.push(`- ${fileResult.file} (${entries})`);
  }

  lines.push('');
  lines.push('When finished:');
  lines.push('- Re-run: node scripts/placeholder-check.js');
  lines.push('- Ensure the script reports no placeholders.');

  return lines.join('\n');
}

function acquireLock() {
  const lockPath = path.join(process.cwd(), LOCK_FILE);

  if (fs.existsSync(lockPath)) {
    const stats = fs.statSync(lockPath);
    const ageMs = Date.now() - stats.mtimeMs;
    if (ageMs < LOCK_TIMEOUT_MS) {
      console.log('⏳ Placeholder check already running.');
      console.log(`   Remove ${LOCK_FILE} if this is a stale lock.`);
      process.exit(1);
    }
    fs.unlinkSync(lockPath);
  }

  fs.writeFileSync(lockPath, JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() }));

  const cleanup = () => {
    if (fs.existsSync(lockPath)) {
      fs.unlinkSync(lockPath);
    }
  };

  process.on('exit', cleanup);
  process.on('SIGINT', () => {
    cleanup();
    process.exit(1);
  });
  process.on('SIGTERM', () => {
    cleanup();
    process.exit(1);
  });
}

/**
 * Main function
 */
function main() {
  acquireLock();
  const config = loadConfig();
  const root = process.cwd();
  const results = [];
  const progress = createProgressReporter();

  console.log('🔍 Checking for hydration placeholders...\n');

  const files = findTextFiles(root, config, [], root, progress);
  progress.done();

  for (const file of files) {
    const markers = [...scanFileName(file), ...scanFileContent(file)];

    if (markers.length > 0) {
      const relativePath = path.relative(process.cwd(), file);
      results.push({
        file: relativePath,
        markers,
      });
    }
  }

  if (results.length === 0) {
    console.log('✅ No placeholders found. Hydration looks complete.\n');
    process.exit(0);
  }

  let totalCount = 0;
  for (const fileResult of results) {
    totalCount += fileResult.markers.length;
  }

  console.log(`Found ${totalCount} placeholder(s) in ${results.length} file(s):\n`);

  for (const fileResult of results) {
    console.log(`  📄 ${fileResult.file}`);
    for (const marker of fileResult.markers) {
      if (marker.type === 'filename') {
        console.log('     ⚠️  TEMPLATE_FILE in filename');
      } else {
        console.log(`     ⚠️  ${marker.placeholder} at line ${marker.line}`);
        console.log(`        ${marker.content}`);
      }
    }
    console.log('');
  }

  console.log('---');
  console.log('🤖 Paste this into your agent:\n');
  console.log(buildRemediationPrompt(results));
  console.log('\n---');
  console.log('❌ Hydration incomplete. Resolve placeholders and re-run.\n');

  process.exit(1);
}

main();
