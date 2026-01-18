#!/usr/bin/env node
/**
 * Verify Inline Documentation
 *
 * Checks that all DOCS.md files referenced in documentation exist.
 * Run with: npm run docs:verify-inline
 *
 * Exit codes:
 * - 0: All references valid
 * - 1: Missing DOCS.md files found
 */

/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../..');
const DOCS_DIR = path.join(ROOT_DIR, 'docs');

// Patterns to extract DOCS.md references from markdown files
// Only match specific paths, not glob patterns (skip paths with *)
const DOCS_REF_PATTERN = /`(src\/[^`*]+\/DOCS\.md)`/g;
const LINK_PATTERN = /\]\((src\/[^)*]+\/DOCS\.md)\)/g;

/**
 * @typedef {Object} VerificationResult
 * @property {string} file
 * @property {string} reference
 * @property {boolean} exists
 */

function extractReferences(content) {
  const refs = [];

  // Extract backtick references
  const backtickMatches = content.matchAll(DOCS_REF_PATTERN);
  for (const match of backtickMatches) {
    refs.push(match[1]);
  }

  // Extract markdown link references
  const linkMatches = content.matchAll(LINK_PATTERN);
  for (const match of linkMatches) {
    refs.push(match[1]);
  }

  return [...new Set(refs)]; // Deduplicate
}

function findMarkdownFiles(dir) {
  const files = [];

  if (!fs.existsSync(dir)) {
    return files;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Skip node_modules and .git
      if (entry.name !== 'node_modules' && entry.name !== '.git') {
        files.push(...findMarkdownFiles(fullPath));
      }
    } else if (entry.name.endsWith('.md')) {
      files.push(fullPath);
    }
  }

  return files;
}

function verifyReferences() {
  const results = [];

  // Check docs/ folder
  const docsFiles = findMarkdownFiles(DOCS_DIR);

  // Check AGENTS.md
  const agentsPath = path.join(ROOT_DIR, 'AGENTS.md');
  if (fs.existsSync(agentsPath)) {
    docsFiles.push(agentsPath);
  }

  // Check .cursor/rules/*.mdc
  const rulesDir = path.join(ROOT_DIR, '.cursor', 'rules');
  if (fs.existsSync(rulesDir)) {
    const ruleFiles = fs.readdirSync(rulesDir).filter((f) => f.endsWith('.mdc'));
    for (const file of ruleFiles) {
      docsFiles.push(path.join(rulesDir, file));
    }
  }

  for (const file of docsFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const references = extractReferences(content);

    for (const ref of references) {
      const absolutePath = path.join(ROOT_DIR, ref);
      results.push({
        file: path.relative(ROOT_DIR, file),
        reference: ref,
        exists: fs.existsSync(absolutePath),
      });
    }
  }

  return results;
}

function main() {
  console.log('🔍 Verifying inline documentation references...\n');

  const results = verifyReferences();
  const missing = results.filter((r) => !r.exists);

  if (missing.length === 0) {
    console.log('✅ All DOCS.md references are valid!\n');
    console.log(`Checked ${results.length} references across documentation files.`);
    process.exit(0);
  }

  console.log('❌ Missing DOCS.md files found:\n');

  for (const item of missing) {
    console.log(`  File: ${item.file}`);
    console.log(`  Missing: ${item.reference}\n`);
  }

  console.log(`\n${missing.length} missing reference(s) found.`);
  console.log('Please create the missing DOCS.md files or update the references.');
  process.exit(1);
}

main();
