/**
 * Documentation Update Context Generator
 *
 * Generates context package for AI analysis of code changes.
 * Input: period dates, task descriptions from WEEKLY-UPDATE-INPUT.md
 * Output: JSON with git diff, affected files, related docs
 *
 * Usage:
 *   node scripts/docs-update/generate-context.js
 *   npm run docs:update
 */

/* eslint-disable no-console */
/* eslint-disable no-param-reassign */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { resolveCursorDir } = require('../ai-kit-paths');
let picomatch = null;
try {
  picomatch = require('picomatch');
} catch {
  picomatch = null;
}

/**
 * @typedef {Object} TaskDescription
 * @property {string} type
 * @property {string} title
 * @property {string[]} description
 */

/**
 * @typedef {Object} ChangedFile
 * @property {string} path
 * @property {number} additions
 * @property {number} deletions
 * @property {'added' | 'modified' | 'deleted' | 'renamed'} status
 */

/**
 * @typedef {Object} DocMapping
 * @property {string} pattern
 * @property {string[]} docs
 * @property {string[]} keywords
 */

/**
 * @typedef {Object} UpdateContext
 * @property {{from: string, to: string}} period
 * @property {TaskDescription[]} tasks
 * @property {{changedFiles: ChangedFile[], stats: {additions: number, deletions: number, filesChanged: number}}} gitDiff
 * @property {string[]} affectedDocs
 * @property {Record<string, {path: string, exists: boolean, lastUpdated?: string}>} existingDocState
 */

// Default config values
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
  docsRoot: 'docs/',
};

/**
 * Load AI Kit config from the cursor config directory
 * Falls back to sensible defaults if not found
 */
function loadConfig() {
  const cursorDir = resolveCursorDir();
  const configPath = path.join(process.cwd(), cursorDir, 'ai-kit.config.json');

  if (fs.existsSync(configPath)) {
    try {
      const content = fs.readFileSync(configPath, 'utf-8');
      const config = JSON.parse(content);

      // Filter out AI_FILL placeholder entries
      if (config.sourceRoots) {
        config.sourceRoots = config.sourceRoots.filter((root) => !root.includes('AI_FILL'));
        // Fall back to defaults if all entries were placeholders
        if (config.sourceRoots.length === 0) {
          console.warn('⚠️  No source roots configured in ai-kit.config.json. Using defaults.');
          config.sourceRoots = DEFAULT_CONFIG.sourceRoots;
        }
      }

      if (config.sourceRoots) {
        config.sourceRoots = config.sourceRoots.map((root) => root.replace(/\\/g, '/'));
      }
      if (config.excludePatterns) {
        config.excludePatterns = config.excludePatterns.map((pattern) =>
          pattern.replace(/\\/g, '/')
        );
      }
      return {
        ...DEFAULT_CONFIG,
        ...config,
        excludePatterns: [...DEFAULT_CONFIG.excludePatterns, ...(config.excludePatterns || [])],
      };
    } catch (e) {
      console.warn('⚠️  Could not parse ai-kit.config.json. Using defaults.');
      return DEFAULT_CONFIG;
    }
  }

  return DEFAULT_CONFIG;
}

// Load file-doc mapping
function loadDocMapping() {
  const mapPath = path.join(__dirname, 'file-doc-map.json');

  if (!fs.existsSync(mapPath)) {
    console.error(`❌ Missing file-doc-map.json at: ${mapPath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(mapPath, 'utf-8');
  const data = JSON.parse(content);
  return data.mappings;
}

// Validate date format (YYYY-MM-DD)
function isValidDate(dateStr) {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
}

/**
 * Check if a file path matches any exclude pattern
 * @param {string} filePath
 * @param {string[]} excludePatterns
 * @returns {boolean}
 */
function isExcluded(filePath, excludePatterns) {
  if (picomatch) {
    return picomatch(excludePatterns, { dot: true })(filePath);
  }
  return fallbackMatch(filePath, excludePatterns);
}

/**
 * Check if a file is in one of the configured source roots
 * @param {string} filePath
 * @param {string[]} sourceRoots
 * @returns {boolean}
 */
function isInSourceRoot(filePath, sourceRoots) {
  return sourceRoots.some((root) => filePath.startsWith(root));
}

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

function ensureGitAvailable() {
  try {
    execSync('git --version', { stdio: 'ignore' });
  } catch {
    console.error('❌ Git is not available on PATH. Install git and re-run.');
    process.exit(1);
  }
}

// Get git diff for period
function getGitDiff(fromDate, toDate, config) {
  if (!isValidDate(fromDate) || !isValidDate(toDate)) {
    console.error('Invalid date format. Use YYYY-MM-DD.');
    return [];
  }

  try {
    const output = execSync(
      `git log --since="${fromDate}" --until="${toDate}T23:59:59" --pretty=format: --name-status --diff-filter=ACDMR`,
      { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
    );

    const files = new Map();
    const statusMap = {
      A: 'added',
      M: 'modified',
      D: 'deleted',
      R: 'renamed',
    };

    output
      .split('\n')
      .filter(Boolean)
      .forEach((line) => {
        const [status, filePath, newPath] = line.split('\t');
        const actualPath = normalizePath(newPath || filePath);

        // Use config-based filtering instead of hardcoded paths
        if (
          actualPath &&
          isInSourceRoot(actualPath, config.sourceRoots) &&
          !isExcluded(actualPath, config.excludePatterns)
        ) {
          files.set(actualPath, {
            path: actualPath,
            additions: 0,
            deletions: 0,
            status: statusMap[status[0]] || 'modified',
          });
        }
      });

    return Array.from(files.values());
  } catch (error) {
    console.error('Error getting git diff:', error);
    return [];
  }
}

// Get git diff stats
function getGitStats(fromDate, toDate) {
  if (!isValidDate(fromDate) || !isValidDate(toDate)) {
    return { additions: 0, deletions: 0, filesChanged: 0 };
  }

  try {
    const output = execSync(
      `git log --since="${fromDate}" --until="${toDate}T23:59:59" --pretty=tformat: --shortstat`,
      { encoding: 'utf-8' }
    );

    return output
      .split('\n')
      .filter(Boolean)
      .reduce(
        (acc, line) => {
          const insertMatch = line.match(/(\d+) insertion/);
          const deleteMatch = line.match(/(\d+) deletion/);
          const fileMatch = line.match(/(\d+) file/);
          const additions = insertMatch ? parseInt(insertMatch[1], 10) : 0;
          const deletions = deleteMatch ? parseInt(deleteMatch[1], 10) : 0;
          const filesChanged = fileMatch ? parseInt(fileMatch[1], 10) : 0;

          return {
            additions: acc.additions + additions,
            deletions: acc.deletions + deletions,
            filesChanged: acc.filesChanged + filesChanged,
          };
        },
        { additions: 0, deletions: 0, filesChanged: 0 }
      );
  } catch {
    return { additions: 0, deletions: 0, filesChanged: 0 };
  }
}

// Match file to docs using glob patterns
function matchFileToDocs(filePath, mappings) {
  const matchedDocs = new Set();

  mappings.forEach((mapping) => {
    if (picomatch) {
      if (picomatch(mapping.pattern, { dot: true })(filePath)) {
        mapping.docs.forEach((doc) => matchedDocs.add(doc));
      }
      return;
    }
    const regex = new RegExp(`^${globToRegex(mapping.pattern)}`);
    if (regex.test(filePath)) {
      mapping.docs.forEach((doc) => matchedDocs.add(doc));
    }
  });

  return Array.from(matchedDocs);
}

// Find all affected docs from changed files
function findAffectedDocs(changedFiles, mappings) {
  const affectedDocs = new Set();

  changedFiles.forEach((file) => {
    const docs = matchFileToDocs(file.path, mappings);
    docs.forEach((doc) => affectedDocs.add(doc));
  });

  return Array.from(affectedDocs).sort();
}

// Check if doc exists and get last updated date
function getDocState(docPath) {
  const fullPath = path.join(process.cwd(), docPath);

  if (!fs.existsSync(fullPath)) {
    return { path: docPath, exists: false };
  }

  const content = fs.readFileSync(fullPath, 'utf-8');
  const lastUpdatedMatch = content.match(/\*\*Last Updated\*\*:\s*(.+)/);

  return {
    path: docPath,
    exists: true,
    lastUpdated: lastUpdatedMatch ? lastUpdatedMatch[1].trim() : undefined,
  };
}

// Parse tasks from input (simple parser)
function parseTasks(input) {
  const tasks = [];
  // More lenient regex to handle whitespace variations
  const taskRegex = /###\s*Task\s+\d+\s*:\s*\[(\w+)\]\s+(.+)\n([\s\S]*?)(?=###\s*Task|\n##\s+|$)/g;

  let match;
  while ((match = taskRegex.exec(input)) !== null) {
    const [, type, title, descriptionBlock] = match;
    const description = descriptionBlock
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.startsWith('-'))
      .map((line) => line.slice(1).trim());

    tasks.push({ type, title, description });
  }

  return tasks;
}

// Main function
async function main() {
  ensureGitAvailable();
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (prompt) =>
    new Promise((resolve) => {
      rl.question(prompt, resolve);
    });

  console.log('\n📚 Documentation Update Context Generator\n');

  // Get period
  const fromDate = await question('From date (YYYY-MM-DD): ');
  const toDate = await question('To date (YYYY-MM-DD): ');

  // Check for input file
  const inputPath = path.join(process.cwd(), 'docs/templates/WEEKLY-UPDATE-INPUT.md');
  let tasks = [];

  if (fs.existsSync(inputPath)) {
    const useFile = await question('Use docs/templates/WEEKLY-UPDATE-INPUT.md? (y/n): ');
    if (useFile.toLowerCase() === 'y') {
      const content = fs.readFileSync(inputPath, 'utf-8');
      tasks = parseTasks(content);
      console.log(`\nParsed ${tasks.length} tasks from input file.`);
    }
  }

  if (tasks.length === 0) {
    console.log('\nEnter tasks (empty line to finish):');
    let taskNum = 1;
    while (true) {
      const taskInput = await question(`Task ${taskNum} (e.g., "[FEAT] Add Login"): `);
      if (!taskInput.trim()) break;

      const match = taskInput.match(/\[(\w+)\]\s+(.+)/);
      if (match) {
        tasks.push({
          type: match[1],
          title: match[2],
          description: [],
        });
        taskNum++;
      } else {
        // Fallback if format is not matched perfectly
        tasks.push({
          type: 'MISC',
          title: taskInput,
          description: [],
        });
        taskNum++;
      }
    }
  }

  rl.close();

  console.log('\n🔍 Analyzing git changes...');

  // Load config and mappings
  const config = loadConfig();
  const mappings = loadDocMapping();

  console.log(`   Using source roots: ${config.sourceRoots.join(', ')}`);

  // Get git data
  const changedFiles = getGitDiff(fromDate, toDate, config);
  const stats = getGitStats(fromDate, toDate);

  console.log(`   Found ${changedFiles.length} changed files`);
  console.log(`   ${stats.additions} additions, ${stats.deletions} deletions`);

  // Find affected docs
  const affectedDocs = findAffectedDocs(changedFiles, mappings);
  console.log(`   ${affectedDocs.length} docs may need updating`);

  // Get doc states
  const existingDocState = affectedDocs.reduce((acc, doc) => {
    acc[doc] = getDocState(doc);
    return acc;
  }, {});

  // Build context
  const context = {
    period: { from: fromDate, to: toDate },
    tasks,
    gitDiff: {
      changedFiles,
      stats,
    },
    affectedDocs,
    existingDocState,
  };

  // Output context
  const outputPath = path.join(__dirname, 'update-context.json');
  fs.writeFileSync(outputPath, JSON.stringify(context, null, 2));

  console.log(`\n✅ Context saved to: ${outputPath}`);
  console.log('\n📋 Summary:');
  console.log(`   Period: ${fromDate} to ${toDate}`);
  console.log(`   Tasks: ${tasks.length}`);
  console.log(`   Changed Files: ${changedFiles.length}`);
  console.log(`   Affected Docs: ${affectedDocs.length}`);

  if (affectedDocs.length > 0) {
    console.log('\n📄 Docs to review:');
    affectedDocs.forEach((doc) => {
      const state = existingDocState[doc];
      const status = state.exists ? '✓' : '✗ (missing)';
      console.log(`   ${status} ${doc}`);
    });
  }

  console.log('\n🤖 Next steps:');
  console.log('   1. Review scripts/docs-update/update-context.json');
  console.log('   2. Use prompt-template.md with an AI to generate doc updates');
  console.log('   3. Review and commit the changes');
}

main().catch(console.error);
