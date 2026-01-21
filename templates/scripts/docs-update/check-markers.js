#!/usr/bin/env node
/**
 * Documentation Marker Checker
 *
 * Finds @docs-update markers in the codebase and reports their status.
 *
 * Usage:
 *   node scripts/docs-update/check-markers.js [options]
 *
 * Options:
 *   --max-days <n>    Max age before marker is expired (default: 14)
 *   --warn-days <n>   Days before expiration to warn (default: 7)
 *   --json            Output as JSON
 *   --ci              Exit with error code if expired markers found
 *   --quiet           Only show errors (expired/missing/invalid)
 */

/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');
const { resolveCursorDir } = require('../ai-kit-paths');
let picomatch = null;
try {
  picomatch = require('picomatch');
} catch {
  picomatch = null;
}

// CLI config
const CONFIG = {
  maxDays: 14,
  warnDays: 7,
  json: false,
  ci: false,
  quiet: false,
};

// Default config
const DEFAULT_CONFIG = {
  sourceRoots: ['src/', 'app/', 'lib/', 'pages/', 'packages/'],
  excludePatterns: [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/.next/**',
    '**/.git/**',
    '**/coverage/**',
    '**/scripts/docs-update/**',
    '**/eslint-rules/**',
  ],
};

const IGNORE_EXTENSIONS = ['.json', '.md', '.map', '.lock'];
const IGNORE_FILES = ['scripts/docs-update/check-markers.js'];

// Marker patterns - must start in comment context
const MARKER_WITH_DATE = /(?:\/\/|\/\*|\*)\s*@docs-update\((\d{4}-\d{2}-\d{2})\):\s*(.+)/g;
const MARKER_WITHOUT_DATE = /(?:\/\/|\/\*|\*)\s*@docs-update:\s*(.+)/g;

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--max-days' && args[i + 1]) {
      CONFIG.maxDays = parseInt(args[++i], 10);
    } else if (arg === '--warn-days' && args[i + 1]) {
      CONFIG.warnDays = parseInt(args[++i], 10);
    } else if (arg === '--json') {
      CONFIG.json = true;
    } else if (arg === '--ci') {
      CONFIG.ci = true;
    } else if (arg === '--quiet') {
      CONFIG.quiet = true;
    } else if (arg === '--help') {
      console.log(`
Documentation Marker Checker

Usage: node check-markers.js [options]

Options:
  --max-days <n>    Max age before marker is expired (default: 14)
  --warn-days <n>   Days before expiration to warn (default: 7)
  --json            Output as JSON
  --ci              Exit with error code if expired markers found
  --quiet           Only show errors (expired/missing/invalid)
  --help            Show this help message
`);
      process.exit(0);
    }
  }
}

/**
 * Load config from the cursor config directory
 */
function loadConfig() {
  const cursorDir = resolveCursorDir();
  const configPath = path.join(process.cwd(), cursorDir, 'ai-kit.config.json');

  if (fs.existsSync(configPath)) {
    try {
      const content = fs.readFileSync(configPath, 'utf-8');
      const config = JSON.parse(content);

      // Filter out AI_FILL placeholders
      if (config.sourceRoots) {
        config.sourceRoots = config.sourceRoots.filter((root) => !root.includes('AI_FILL'));
        if (config.sourceRoots.length === 0) {
          config.sourceRoots = DEFAULT_CONFIG.sourceRoots;
        }
      }

      return {
        ...DEFAULT_CONFIG,
        ...config,
        excludePatterns: [...DEFAULT_CONFIG.excludePatterns, ...(config.excludePatterns || [])].map(
          (pattern) => pattern.replace(/\\/g, '/')
        ),
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
 * Check if file is a source file we should scan
 */
function isSourceFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const sourceExtensions = [
    '.js',
    '.jsx',
    '.ts',
    '.tsx',
    '.mjs',
    '.cjs',
    '.vue',
    '.svelte',
    '.py',
    '.rb',
    '.go',
    '.rs',
    '.java',
    '.kt',
    '.swift',
    '.cs',
    '.php',
  ];
  return sourceExtensions.includes(ext);
}

/**
 * Recursively find all source files
 */
function findSourceFiles(dir, config, files = []) {
  if (!fs.existsSync(dir)) {
    return files;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = normalizePath(path.relative(process.cwd(), fullPath));

    if (isExcluded(relativePath, config.excludePatterns)) {
      continue;
    }

    if (entry.isDirectory()) {
      findSourceFiles(fullPath, config, files);
    } else if (entry.isFile() && isSourceFile(fullPath)) {
      const ext = path.extname(entry.name);
      if (!IGNORE_EXTENSIONS.includes(ext)) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

/**
 * Parse a date string in YYYY-MM-DD format
 */
function parseDate(dateStr) {
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));

  if (
    date.getFullYear() !== Number(year) ||
    date.getMonth() !== Number(month) - 1 ||
    date.getDate() !== Number(day)
  ) {
    return null;
  }

  return date;
}

/**
 * Calculate days between two dates
 */
function daysBetween(from, to) {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((to - from) / msPerDay);
}

/**
 * Get marker status
 */
function getMarkerStatus(dateStr, today) {
  if (!dateStr) {
    return { status: 'missing-date', message: 'Missing timestamp' };
  }

  const markerDate = parseDate(dateStr);
  if (!markerDate) {
    return { status: 'invalid-date', message: `Invalid date: ${dateStr}` };
  }

  if (markerDate > today) {
    return { status: 'invalid-date', message: `Future date: ${dateStr}` };
  }

  const daysOld = daysBetween(markerDate, today);
  const daysLeft = CONFIG.maxDays - daysOld;

  if (daysOld > CONFIG.maxDays) {
    return {
      status: 'expired',
      daysOld,
      message: `Expired ${daysOld - CONFIG.maxDays} days ago`,
    };
  }

  if (daysLeft <= CONFIG.warnDays) {
    return {
      status: 'warning',
      daysLeft,
      message: `Expires in ${daysLeft} days`,
    };
  }

  return {
    status: 'ok',
    daysLeft,
    message: `${daysLeft} days remaining`,
  };
}

/**
 * Find markers in a file
 */
function findMarkersInFile(filePath, today) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const markers = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    const withDateMatches = [...line.matchAll(MARKER_WITH_DATE)];
    for (const match of withDateMatches) {
      const [, dateStr, description] = match;
      const status = getMarkerStatus(dateStr, today);

      markers.push({
        file: filePath,
        line: lineNum,
        date: dateStr,
        description: description.trim(),
        ...status,
      });
    }

    MARKER_WITHOUT_DATE.lastIndex = 0;
    const withoutDateMatches = [...line.matchAll(MARKER_WITHOUT_DATE)];
    for (const match of withoutDateMatches) {
      if (withDateMatches.length > 0) continue;

      const [, description] = match;
      const status = getMarkerStatus(null, today);

      markers.push({
        file: filePath,
        line: lineNum,
        date: null,
        description: description.trim(),
        ...status,
      });
    }
  }

  return markers;
}

/**
 * Format output for console
 */
function formatConsoleOutput(markers) {
  const grouped = {
    expired: markers.filter((m) => m.status === 'expired'),
    'missing-date': markers.filter((m) => m.status === 'missing-date'),
    'invalid-date': markers.filter((m) => m.status === 'invalid-date'),
    warning: markers.filter((m) => m.status === 'warning'),
    ok: markers.filter((m) => m.status === 'ok'),
  };

  const today = new Date().toISOString().split('T')[0];
  const lines = [];

  lines.push('');
  lines.push('Documentation Marker Report');
  lines.push('='.repeat(50));
  lines.push('');

  if (grouped.expired.length > 0) {
    lines.push('EXPIRED MARKERS (require immediate action)');
    lines.push('-'.repeat(50));
    for (const m of grouped.expired) {
      lines.push(`  ${m.file}:${m.line}`);
      lines.push(`    Date: ${m.date} (${m.message})`);
      lines.push(`    ${m.description}`);
      lines.push('');
    }
  }

  if (grouped['missing-date'].length > 0) {
    lines.push('MISSING TIMESTAMP (old format - please update)');
    lines.push('-'.repeat(50));
    lines.push(`    New format: @docs-update(${today}): path - description`);
    lines.push('');
    for (const m of grouped['missing-date']) {
      lines.push(`  ${m.file}:${m.line}`);
      lines.push(`    ${m.description}`);
      lines.push('');
    }
  }

  if (grouped['invalid-date'].length > 0) {
    lines.push('INVALID DATE FORMAT');
    lines.push('-'.repeat(50));
    for (const m of grouped['invalid-date']) {
      lines.push(`  ${m.file}:${m.line}`);
      lines.push(`    ${m.message}`);
      lines.push('');
    }
  }

  if (!CONFIG.quiet && grouped.warning.length > 0) {
    lines.push('EXPIRING SOON');
    lines.push('-'.repeat(50));
    for (const m of grouped.warning) {
      lines.push(`  ${m.file}:${m.line}`);
      lines.push(`    Date: ${m.date} (${m.message})`);
      lines.push(`    ${m.description}`);
      lines.push('');
    }
  }

  if (!CONFIG.quiet && grouped.ok.length > 0) {
    lines.push('ACTIVE MARKERS');
    lines.push('-'.repeat(50));
    for (const m of grouped.ok) {
      lines.push(`  ${m.file}:${m.line}`);
      lines.push(`    Date: ${m.date} (${m.message})`);
      lines.push(`    ${m.description}`);
      lines.push('');
    }
  }

  lines.push('='.repeat(50));
  lines.push('Summary:');
  lines.push(`  Total markers: ${markers.length}`);
  lines.push(
    `  Expired: ${
      grouped.expired.length + grouped['missing-date'].length + grouped['invalid-date'].length
    }`
  );
  lines.push(`  Expiring soon: ${grouped.warning.length}`);
  lines.push(`  OK: ${grouped.ok.length}`);
  lines.push('');

  if (markers.length > 0) {
    lines.push('Next: run npm run docs:update');
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Main function
 */
function main() {
  parseArgs();

  const config = loadConfig();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const allMarkers = [];

  for (const root of config.sourceRoots) {
    const rootPath = path.join(process.cwd(), root);
    const files = findSourceFiles(rootPath, config);

    for (const file of files) {
      const relativePath = normalizePath(path.relative(process.cwd(), file));
      if (
        IGNORE_FILES.some((ignored) => relativePath === ignored || relativePath.startsWith(ignored))
      ) {
        continue;
      }

      try {
        const markers = findMarkersInFile(file, today);
        allMarkers.push(...markers);
      } catch {
        // Skip unreadable files
      }
    }
  }

  for (const marker of allMarkers) {
    marker.file = path.relative(process.cwd(), marker.file);
  }

  if (CONFIG.json) {
    console.log(JSON.stringify(allMarkers, null, 2));
  } else {
    console.log(formatConsoleOutput(allMarkers));
  }

  if (CONFIG.ci) {
    const hasErrors = allMarkers.some(
      (m) => m.status === 'expired' || m.status === 'missing-date' || m.status === 'invalid-date'
    );
    process.exit(hasErrors ? 1 : 0);
  }
}

main();
