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

const DEFAULT_CONFIG = {
  excludePatterns: [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/.next/**',
    '**/.git/**',
    '**/coverage/**',
  ],
};

const INTERNAL_IGNORE_PREFIXES = ['scripts/docs-update/', '.cursor/commands/'];

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
  const normalizedPath = filePath.replace(/\\/g, '/');

  return excludePatterns.some((pattern) => {
    const normalizedPattern = pattern.replace(/\\/g, '/');
    const hasTrailingGlob = normalizedPattern.endsWith('/**');

    if (hasTrailingGlob) {
      const basePattern = normalizedPattern.slice(0, -3);
      const baseRegex = new RegExp(globToRegex(basePattern));
      if (baseRegex.test(normalizedPath)) {
        return true;
      }
    }

    const regex = new RegExp(globToRegex(normalizedPattern));
    return regex.test(normalizedPath);
  });
}

function globToRegex(globPattern) {
  return globPattern
    .replace(/\*\*\/?/g, '__GLOBSTAR__')
    .replace(/\*/g, '[^/]*')
    .replace(/__GLOBSTAR__/g, '.*');
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
function findTextFiles(dir, config, files = []) {
  if (!fs.existsSync(dir)) {
    return files;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(process.cwd(), fullPath);

    if (INTERNAL_IGNORE_PREFIXES.some((prefix) => relativePath.startsWith(prefix))) {
      continue;
    }

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

/**
 * Main function
 */
function main() {
  const config = loadConfig();
  const root = process.cwd();
  const results = [];

  console.log('🔍 Checking for hydration placeholders...\n');

  const files = findTextFiles(root, config);

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
