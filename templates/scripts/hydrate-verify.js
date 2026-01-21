#!/usr/bin/env node

/**
 * Hydrate Verify
 *
 * Verifies hydration completeness:
 * - Required docs exist
 * - Template-only files removed
 * - Cursor config directory has non-empty sourceRoots
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
const { resolveCursorDir } = require('./ai-kit-paths');

const CURSOR_DIR = resolveCursorDir();

const DEFAULT_REQUIRED_DOCS = [
  'AGENTS.md',
  'docs/domains/README.md',
  `${CURSOR_DIR}/ai-kit.config.json`,
  `${CURSOR_DIR}/rules/app-context.mdc`,
  `${CURSOR_DIR}/rules/main.mdc`,
  `${CURSOR_DIR}/commands/build.md`,
  `${CURSOR_DIR}/commands/commit.md`,
  `${CURSOR_DIR}/commands/debug.md`,
  `${CURSOR_DIR}/commands/discuss.md`,
  `${CURSOR_DIR}/commands/explain.md`,
  `${CURSOR_DIR}/commands/fix.md`,
  `${CURSOR_DIR}/commands/hydrate-verify.md`,
  `${CURSOR_DIR}/commands/plan.md`,
  `${CURSOR_DIR}/commands/refactor.md`,
  `${CURSOR_DIR}/commands/review.md`,
  `${CURSOR_DIR}/commands/verify.md`,
  'scripts/docs-update/file-doc-map.json',
];

const DEFAULT_FORBIDDEN_FILES = [
  `${CURSOR_DIR}/HYDRATE.md`,
  `${CURSOR_DIR}/rules/_template.mdc`,
  'docs/templates/DOCS-TEMPLATE.md',
  'scripts/docs-update/file-doc-map.template.json',
];

function normalizePath(filePath) {
  return filePath.replace(/\\/g, '/');
}

function readConfig() {
  const configPath = path.join(process.cwd(), CURSOR_DIR, 'ai-kit.config.json');
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
    // Filter out placeholder values
    const isPlaceholder =
      trimmed.includes('AI_FILL') || trimmed === 'PLACEHOLDER' || trimmed.length === 0;
    return !isPlaceholder;
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

function checkManifestDrift() {
  const manifestPath = path.join(process.cwd(), '.ai-kit-manifest.json');
  if (!fs.existsSync(manifestPath)) {
    return { missing: [], parseError: null };
  }

  try {
    const content = fs.readFileSync(manifestPath, 'utf-8');
    const manifest = JSON.parse(content);
    const files = manifest?.files ? Object.keys(manifest.files) : [];
    const missing = files.filter((filePath) =>
      !fs.existsSync(path.join(process.cwd(), filePath))
    );
    return { missing, parseError: null };
  } catch (error) {
    return { missing: [], parseError: error };
  }
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

  const cursorDirPath = path.join(process.cwd(), CURSOR_DIR);
  const hasCursorDir = fs.existsSync(cursorDirPath);

  const { config, configPath, parseError } = readConfig();
  const requiredDocs = resolveRequiredDocs(config);
  const missingDocs = getMissingFiles(requiredDocs);
  const forbiddenFiles = getForbiddenFiles(DEFAULT_FORBIDDEN_FILES);

  const filteredSourceRoots = filterSourceRoots(config?.sourceRoots);
  const hasValidSourceRoots = filteredSourceRoots.length > 0;
  const missingSourceRoots = getMissingSourceRoots(filteredSourceRoots);

  if (!hasCursorDir) {
    console.log(`Missing cursor directory: ${normalizePath(cursorDirPath)}`);
    console.log('Re-run hydration to generate cursor rules and commands.');
    console.log('');
  }

  if (parseError) {
    console.log(`⚠️  Failed to parse ${normalizePath(configPath)}.`);
    console.log(`   ${parseError.message}`);
    console.log('');
  }

  printList('Missing required files:', missingDocs);
  printList('Template-only files to remove or rename:', forbiddenFiles);

  if (!hasValidSourceRoots) {
    console.log(`Missing or empty sourceRoots in ${CURSOR_DIR}/ai-kit.config.json.`);
    console.log('Add real source directories (e.g., "src/", "app/").');
    console.log('');
  }

  if (missingSourceRoots.length > 0) {
    printList('sourceRoots directories not found:', missingSourceRoots);
  }

  const { missing: missingManifestFiles, parseError: manifestParseError } = checkManifestDrift();
  if (manifestParseError) {
    console.log('⚠️  Failed to parse .ai-kit-manifest.json.');
    console.log(`   ${manifestParseError.message}`);
    console.log('');
  }

  if (missingManifestFiles.length > 0) {
    printList('Manifest drift (files missing from .ai-kit-manifest.json):', missingManifestFiles);
    console.log('Regenerate the manifest via CLI upgrade or delete it.');
    console.log('');
  }

  const placeholderStatus = runPlaceholderCheck();
  const hasPlaceholderIssues = placeholderStatus !== 0;

  const hasFailures =
    !hasCursorDir ||
    parseError ||
    manifestParseError ||
    missingDocs.length > 0 ||
    forbiddenFiles.length > 0 ||
    missingManifestFiles.length > 0 ||
    !hasValidSourceRoots ||
    missingSourceRoots.length > 0 ||
    hasPlaceholderIssues;

  console.log('---');
  console.log(`Hydration verify: ${hasFailures ? 'FAIL' : 'PASS'}`);
  console.log(`- Cursor dir: ${hasCursorDir ? 'PASS' : 'FAIL'}`);
  console.log(`- Required files: ${missingDocs.length > 0 ? 'FAIL' : 'PASS'}`);
  console.log(`- Template files: ${forbiddenFiles.length > 0 ? 'FAIL' : 'PASS'}`);
  console.log(`- Manifest drift: ${missingManifestFiles.length > 0 ? 'FAIL' : 'PASS'}`);
  console.log(`- sourceRoots: ${hasValidSourceRoots ? 'PASS' : 'FAIL'}`);
  console.log(`- sourceRoots exist: ${missingSourceRoots.length > 0 ? 'FAIL' : 'PASS'}`);
  console.log(`- Placeholders: ${hasPlaceholderIssues ? 'FAIL' : 'PASS'}`);
  console.log('');

  process.exit(hasFailures ? 1 : 0);
}

main();
