#!/usr/bin/env node

/**
 * Documentation Marker Checker
 *
 * Scans source files for @docs-update markers and reports them.
 * Exit codes:
 *   0 - No markers found
 *   1 - Markers found (docs need updating)
 *
 * Usage:
 *   node scripts/docs-update/check-markers.js
 *   npm run docs:check
 */

/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');

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
  ],
};

// Marker patterns to search for
const MARKER_PATTERNS = [
  /@docs-update(?:\([^)]*\))?/i,
  /\/\/\s*TODO:\s*docs/i,
  /\/\*\s*TODO:\s*docs/i,
  /#\s*TODO:\s*docs/i,
];

// Date extraction from @docs-update(YYYY-MM-DD) or @docs-update(YYYY-MM-DD: reason)
const DATE_REGEX = /@docs-update\((\d{4}-\d{2}-\d{2})(?:\s*:\s*[^)]*)?\)/i;
const MAX_AGE_DAYS = 14;

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
        if (config.sourceRoots.length === 0) {
          config.sourceRoots = DEFAULT_CONFIG.sourceRoots;
        }
      }

      return { ...DEFAULT_CONFIG, ...config };
    } catch {
      return DEFAULT_CONFIG;
    }
  }

  return DEFAULT_CONFIG;
}

/**
 * Check if path should be excluded
 */
function isExcluded(filePath, excludePatterns) {
  return excludePatterns.some((pattern) => {
    const regex = new RegExp(pattern.replace(/\*\*\/?/g, '.*').replace(/\*/g, '[^/]*'));
    return regex.test(filePath);
  });
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
    const relativePath = path.relative(process.cwd(), fullPath);

    if (isExcluded(relativePath, config.excludePatterns)) {
      continue;
    }

    if (entry.isDirectory()) {
      findSourceFiles(fullPath, config, files);
    } else if (entry.isFile() && isSourceFile(fullPath)) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Calculate age in days from a date string
 */
function getAgeDays(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  if (isNaN(date.getTime())) return null;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Scan a file for markers
 */
function scanFileForMarkers(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const markers = [];

  lines.forEach((line, index) => {
    for (const pattern of MARKER_PATTERNS) {
      if (pattern.test(line)) {
        // Check for dated marker
        const dateMatch = line.match(DATE_REGEX);
        let status = 'undated';
        let ageDays = null;

        if (dateMatch) {
          ageDays = getAgeDays(dateMatch[1]);
          if (ageDays !== null) {
            status = ageDays > MAX_AGE_DAYS ? 'expired' : 'valid';
          }
        }

        markers.push({
          line: index + 1,
          content: line.trim(),
          status,
          ageDays,
        });
        break; // Only report once per line
      }
    }
  });

  return markers;
}

/**
 * Main function
 */
function main() {
  const config = loadConfig();
  const allMarkers = [];

  console.log('🔍 Scanning for documentation markers...\n');

  // Scan each source root
  for (const root of config.sourceRoots) {
    const rootPath = path.join(process.cwd(), root);
    const files = findSourceFiles(rootPath, config);

    for (const file of files) {
      const markers = scanFileForMarkers(file);

      if (markers.length > 0) {
        const relativePath = path.relative(process.cwd(), file);
        allMarkers.push({
          file: relativePath,
          markers,
        });
      }
    }
  }

  // Categorize markers
  let expiredCount = 0;
  let undatedCount = 0;
  let validCount = 0;

  for (const fileResult of allMarkers) {
    for (const marker of fileResult.markers) {
      if (marker.status === 'expired') expiredCount++;
      else if (marker.status === 'undated') undatedCount++;
      else validCount++;
    }
  }

  // Report results
  if (allMarkers.length === 0) {
    console.log('✅ No documentation markers found.\n');
    process.exit(0);
  }

  const totalMarkers = expiredCount + undatedCount + validCount;
  console.log(`Found ${totalMarkers} marker(s) in ${allMarkers.length} file(s):\n`);

  for (const fileResult of allMarkers) {
    console.log(`  📄 ${fileResult.file}`);
    for (const marker of fileResult.markers) {
      let statusIcon = '⚪';
      let statusText = '';

      if (marker.status === 'expired') {
        statusIcon = '🔴';
        statusText = ` [EXPIRED: ${marker.ageDays} days old]`;
      } else if (marker.status === 'undated') {
        statusIcon = '🟡';
        statusText = ' [no date]';
      } else if (marker.status === 'valid') {
        statusIcon = '🟢';
        statusText = ` [${marker.ageDays} days]`;
      }

      console.log(`     ${statusIcon} Line ${marker.line}${statusText}`);
      console.log(`        ${marker.content}`);
    }
    console.log('');
  }

  // Summary
  if (expiredCount > 0) {
    console.log(`❌ ${expiredCount} expired marker(s) (older than ${MAX_AGE_DAYS} days)`);
  }
  if (undatedCount > 0) {
    console.log(`⚠️  ${undatedCount} marker(s) without dates`);
  }
  if (validCount > 0) {
    console.log(`✅ ${validCount} valid marker(s)`);
  }

  console.log('\n💡 Run `npm run docs:update` to generate update context.');
  console.log('💡 Use @docs-update(YYYY-MM-DD) format to track marker age.\n');

  // Exit with error if any expired markers
  process.exit(expiredCount > 0 ? 1 : 0);
}

main();
