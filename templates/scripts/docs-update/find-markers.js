#!/usr/bin/env node

/**
 * Cross-Platform Documentation Marker Finder
 *
 * Node.js equivalent of find-markers.sh for Windows compatibility.
 * Finds all @docs-update markers in the codebase.
 *
 * Usage:
 *   node scripts/docs-update/find-markers.js
 *   npm run docs:find-markers
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

// Marker pattern
const MARKER_REGEX = /@docs-update(?:\(([^)]+)\))?/gi;

/**
 * Load config from .cursor/ai-kit.config.json
 */
function loadConfig() {
  const configPath = path.join(process.cwd(), '.cursor/ai-kit.config.json');

  if (fs.existsSync(configPath)) {
    try {
      const content = fs.readFileSync(configPath, 'utf-8');
      const config = JSON.parse(content);

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
 * Check if file is a text file we should scan
 */
function isTextFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const textExtensions = [
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
    '.md',
    '.mdx',
    '.txt',
    '.yaml',
    '.yml',
    '.json',
    '.xml',
    '.html',
    '.css',
    '.scss',
    '.less',
    '.sql',
    '.sh',
    '.bash',
    '.zsh',
  ];
  return textExtensions.includes(ext);
}

/**
 * Recursively find all text files
 */
function findTextFiles(dir, config, files = []) {
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
      findTextFiles(fullPath, config, files);
    } else if (entry.isFile() && isTextFile(fullPath)) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Find all markers in a file
 */
function findMarkersInFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const markers = [];

  lines.forEach((line, index) => {
    let match;
    MARKER_REGEX.lastIndex = 0; // Reset regex state

    while ((match = MARKER_REGEX.exec(line)) !== null) {
      markers.push({
        line: index + 1,
        column: match.index + 1,
        fullMatch: match[0],
        reason: match[1] || null,
        context: line.trim(),
      });
    }
  });

  return markers;
}

/**
 * Format output similar to grep
 */
function formatGrepStyle(filePath, markers) {
  return markers.map((m) => `${filePath}:${m.line}: ${m.context}`).join('\n');
}

/**
 * Format output as JSON
 */
function formatJSON(results) {
  return JSON.stringify(results, null, 2);
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  const jsonOutput = args.includes('--json');
  const quietMode = args.includes('--quiet') || args.includes('-q');

  const config = loadConfig();
  const results = [];
  let totalMarkers = 0;

  // Scan each source root
  for (const root of config.sourceRoots) {
    const rootPath = path.join(process.cwd(), root);
    const files = findTextFiles(rootPath, config);

    for (const file of files) {
      const markers = findMarkersInFile(file);

      if (markers.length > 0) {
        const relativePath = path.relative(process.cwd(), file);
        results.push({
          file: relativePath,
          markers,
        });
        totalMarkers += markers.length;
      }
    }
  }

  // Output results
  if (jsonOutput) {
    console.log(formatJSON(results));
  } else if (quietMode) {
    // Just exit with appropriate code
  } else {
    if (results.length === 0) {
      console.log('No @docs-update markers found.');
    } else {
      console.log(`Found ${totalMarkers} marker(s) in ${results.length} file(s):\n`);

      for (const result of results) {
        console.log(formatGrepStyle(result.file, result.markers));
      }

      console.log('\n💡 Use @docs-update(reason) to document why docs need updating.');
    }
  }

  process.exit(results.length > 0 ? 1 : 0);
}

main();
