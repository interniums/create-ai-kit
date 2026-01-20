#!/usr/bin/env node

/**
 * Hydrate Verify
 *
 * Verifies hydration completeness:
 * - Required docs exist
 * - Template-only files removed
 * - .cursor/ai-kit.config.json has non-empty sourceRoots
 * - Placeholder check passes
 *
 * Exit codes:
 *   0 - All checks passed
 *   1 - One or more checks failed
 */

/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const DEFAULT_REQUIRED_DOCS = [
  'AGENTS.md',
  '.cursor/ai-kit.config.json',
  '.cursor/rules/app-context.mdc',
  '.cursor/rules/main.mdc',
  'scripts/docs-update/file-doc-map.json',
];

const DEFAULT_FORBIDDEN_FILES = [
  '.cursor/HYDRATE.md',
  '.cursor/rules/_template.mdc',
  'docs/templates/DOCS-TEMPLATE.md',
  'scripts/docs-update/file-doc-map.template.json',
];

function normalizePath(filePath) {
  return filePath.replace(/\\/g, '/');
}

function readConfig() {
  const configPath = path.join(process.cwd(), '.cursor/ai-kit.config.json');
  if (!fs.existsSync(configPath)) {
    return { configPath, config: null, parseError: null };
  }

  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    const config = JSON.parse(content);
    return { configPath, config, parseError: null };
  } catch (error) {
    return { configPath, config: null, parseError: error };
  }
}

function resolveRequiredDocs(config) {
  if (config && Array.isArray(config.requiredDocs) && config.requiredDocs.length > 0) {
    return config.requiredDocs.map(normalizePath);
  }
  return DEFAULT_REQUIRED_DOCS;
}

function filterSourceRoots(sourceRoots) {
  if (!Array.isArray(sourceRoots)) {
    return [];
  }

  return sourceRoots.filter((root) => {
    if (typeof root !== 'string') {
      return false;
    }
    const trimmed = root.trim().replace(/\\/g, '/');
    return trimmed.length > 0 && !trimmed.includes('AI_FILL');
  });
}

function getMissingFiles(files) {
  return files.filter((filePath) => !fs.existsSync(path.join(process.cwd(), filePath)));
}

function getForbiddenFiles(files) {
  return files.filter((filePath) => fs.existsSync(path.join(process.cwd(), filePath)));
}

function getMissingSourceRoots(sourceRoots) {
  return sourceRoots.filter((root) => !fs.existsSync(path.join(process.cwd(), root)));
}

function runPlaceholderCheck() {
  const result = spawnSync('node', ['scripts/placeholder-check.js'], {
    stdio: 'inherit',
  });

  if (typeof result.status === 'number') {
    return result.status;
  }

  return 1;
}

function printList(title, items) {
  if (items.length === 0) {
    return;
  }

  console.log(title);
  for (const item of items) {
    console.log(`- ${item}`);
  }
  console.log('');
}

function main() {
  console.log('🔍 Running hydration verification...\n');

  const { config, configPath, parseError } = readConfig();
  const requiredDocs = resolveRequiredDocs(config);
  const missingDocs = getMissingFiles(requiredDocs);
  const forbiddenFiles = getForbiddenFiles(DEFAULT_FORBIDDEN_FILES);

  const filteredSourceRoots = filterSourceRoots(config?.sourceRoots);
  const hasValidSourceRoots = filteredSourceRoots.length > 0;
  const missingSourceRoots = getMissingSourceRoots(filteredSourceRoots);

  if (parseError) {
    console.log(`⚠️  Failed to parse ${normalizePath(configPath)}.`);
    console.log(`   ${parseError.message}`);
    console.log('');
  }

  printList('Missing required files:', missingDocs);
  printList('Template-only files to remove or rename:', forbiddenFiles);

  if (!hasValidSourceRoots) {
    console.log('Missing or empty sourceRoots in .cursor/ai-kit.config.json.');
    console.log('Add real source directories (e.g., "src/", "app/").');
    console.log('');
  }

  if (missingSourceRoots.length > 0) {
    printList('sourceRoots directories not found:', missingSourceRoots);
  }

  const placeholderStatus = runPlaceholderCheck();
  const hasPlaceholderIssues = placeholderStatus !== 0;

  const hasFailures =
    parseError ||
    missingDocs.length > 0 ||
    forbiddenFiles.length > 0 ||
    !hasValidSourceRoots ||
    missingSourceRoots.length > 0 ||
    hasPlaceholderIssues;

  console.log('---');
  console.log(`Hydration verify: ${hasFailures ? 'FAIL' : 'PASS'}`);
  console.log(`- Required files: ${missingDocs.length > 0 ? 'FAIL' : 'PASS'}`);
  console.log(`- Template files: ${forbiddenFiles.length > 0 ? 'FAIL' : 'PASS'}`);
  console.log(`- sourceRoots: ${hasValidSourceRoots ? 'PASS' : 'FAIL'}`);
  console.log(`- sourceRoots exist: ${missingSourceRoots.length > 0 ? 'FAIL' : 'PASS'}`);
  console.log(`- Placeholders: ${hasPlaceholderIssues ? 'FAIL' : 'PASS'}`);
  console.log('');

  process.exit(hasFailures ? 1 : 0);
}

main();
