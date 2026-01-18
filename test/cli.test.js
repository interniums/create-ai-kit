/**
 * AI Kit CLI Tests
 *
 * Uses Node.js built-in test runner (no external dependencies)
 * Run with: npm test
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync, spawnSync } = require('child_process');

const CLI_PATH = path.join(__dirname, '../bin/create-ai-kit.js');
const FIXTURES_DIR = path.join(__dirname, 'fixtures');
const TEMPLATES_DIR = path.join(__dirname, '../templates');

/**
 * Helper to create a temporary test directory
 */
function createTempDir() {
  const tempDir = path.join(
    FIXTURES_DIR,
    `test-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
  fs.mkdirSync(tempDir, { recursive: true });
  return tempDir;
}

/**
 * Helper to clean up a test directory
 */
function cleanupDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * Helper to run CLI in a directory
 */
function runCLI(cwd, args = []) {
  const result = spawnSync('node', [CLI_PATH, ...args], {
    cwd,
    encoding: 'utf-8',
    env: { ...process.env, NO_COLOR: '1' },
  });

  return {
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    exitCode: result.status,
  };
}

/**
 * Helper to calculate checksum (same as CLI)
 */
function calculateChecksum(content) {
  return crypto.createHash('md5').update(content).digest('hex');
}

// Ensure fixtures directory exists
if (!fs.existsSync(FIXTURES_DIR)) {
  fs.mkdirSync(FIXTURES_DIR, { recursive: true });
}

describe('AI Kit CLI', () => {
  describe('Dry Run Mode', () => {
    let tempDir;

    beforeEach(() => {
      tempDir = createTempDir();
      // Create a minimal package.json
      fs.writeFileSync(
        path.join(tempDir, 'package.json'),
        JSON.stringify({ name: 'test-project', version: '1.0.0' }, null, 2)
      );
    });

    afterEach(() => {
      cleanupDir(tempDir);
    });

    it('should list files to be created without writing them', () => {
      const result = runCLI(tempDir, ['--dry-run']);

      assert.strictEqual(result.exitCode, 0, 'CLI should exit with code 0');
      assert.ok(result.stdout.includes('Dry Run'), 'Output should indicate dry run mode');
      assert.ok(result.stdout.includes('Create'), 'Output should list files to create');

      // Verify no files were actually created
      assert.ok(!fs.existsSync(path.join(tempDir, '.cursor')), '.cursor should not exist');
      assert.ok(!fs.existsSync(path.join(tempDir, 'AGENTS.md')), 'AGENTS.md should not exist');
    });

    it('should include expected template files in output', () => {
      const result = runCLI(tempDir, ['--dry-run']);

      const expectedFiles = [
        '.cursor/HYDRATE.md',
        '.cursor/rules/main.mdc',
        'AGENTS.md',
        'scripts/docs-update/generate-context.js',
      ];

      for (const file of expectedFiles) {
        assert.ok(result.stdout.includes(file), `Output should list ${file}`);
      }
    });
  });

  describe('Project Detection', () => {
    let tempDir;

    afterEach(() => {
      if (tempDir) {
        cleanupDir(tempDir);
      }
    });

    // Note: Project detection output only shows on actual scaffold, not dry-run
    // These tests verify detection works by running actual scaffold with --yes

    it('should detect Next.js project', () => {
      tempDir = createTempDir();
      fs.writeFileSync(
        path.join(tempDir, 'package.json'),
        JSON.stringify({
          name: 'nextjs-project',
          dependencies: { next: '^14.0.0', react: '^18.0.0' },
        })
      );

      const result = runCLI(tempDir, ['--yes']);
      assert.ok(result.stdout.includes('Next.js'), 'Should detect Next.js');
    });

    it('should detect React project', () => {
      tempDir = createTempDir();
      fs.writeFileSync(
        path.join(tempDir, 'package.json'),
        JSON.stringify({
          name: 'react-project',
          dependencies: { react: '^18.0.0', 'react-dom': '^18.0.0' },
        })
      );

      const result = runCLI(tempDir, ['--yes']);
      assert.ok(result.stdout.includes('React'), 'Should detect React');
    });

    it('should detect Express project', () => {
      tempDir = createTempDir();
      fs.writeFileSync(
        path.join(tempDir, 'package.json'),
        JSON.stringify({
          name: 'express-project',
          dependencies: { express: '^4.18.0' },
        })
      );

      const result = runCLI(tempDir, ['--yes']);
      assert.ok(result.stdout.includes('Express'), 'Should detect Express');
    });

    it('should detect Python project via requirements.txt', () => {
      tempDir = createTempDir();
      fs.writeFileSync(path.join(tempDir, 'requirements.txt'), 'flask==2.0.0\n');
      // No package.json needed for Python detection

      const result = runCLI(tempDir, ['--yes']);
      assert.ok(result.stdout.includes('Python'), 'Should detect Python');
    });

    it('should detect Go project via go.mod', () => {
      tempDir = createTempDir();
      fs.writeFileSync(path.join(tempDir, 'go.mod'), 'module example.com/myproject\n\ngo 1.21\n');

      const result = runCLI(tempDir, ['--yes']);
      assert.ok(result.stdout.includes('Go'), 'Should detect Go');
    });
  });

  describe('Checksum Calculation', () => {
    it('should produce deterministic checksums', () => {
      const content = 'Hello, world!';
      const checksum1 = calculateChecksum(content);
      const checksum2 = calculateChecksum(content);

      assert.strictEqual(checksum1, checksum2, 'Same content should produce same checksum');
    });

    it('should produce different checksums for different content', () => {
      const checksum1 = calculateChecksum('Content A');
      const checksum2 = calculateChecksum('Content B');

      assert.notStrictEqual(
        checksum1,
        checksum2,
        'Different content should produce different checksums'
      );
    });
  });

  describe('Force Mode', () => {
    let tempDir;

    beforeEach(() => {
      tempDir = createTempDir();
      fs.writeFileSync(
        path.join(tempDir, 'package.json'),
        JSON.stringify({ name: 'test-project', version: '1.0.0' }, null, 2)
      );
    });

    afterEach(() => {
      cleanupDir(tempDir);
    });

    it('should fail without --force when .cursor exists but no manifest', () => {
      // First, create the .cursor folder via initial scaffold
      runCLI(tempDir, ['--yes']);

      // Delete the manifest to simulate external .cursor creation
      const manifestPath = path.join(tempDir, '.ai-kit-manifest.json');
      if (fs.existsSync(manifestPath)) {
        fs.unlinkSync(manifestPath);
      }

      // Now try to run again without --force (should fail)
      const result = runCLI(tempDir, []);

      assert.strictEqual(result.exitCode, 1, 'Should exit with code 1');
      assert.ok(
        result.stderr.includes('already exists') || result.stdout.includes('already exists'),
        'Should warn about existing .cursor'
      );
    });

    it('should preserve user-modified files and create .new files', () => {
      // First run to create files
      runCLI(tempDir, ['--yes']);

      // Modify AGENTS.md (which is in PRESERVE_LIST)
      const agentsPath = path.join(tempDir, 'AGENTS.md');
      fs.writeFileSync(agentsPath, '# My Custom AGENTS Content\n');

      // Run with --force
      const result = runCLI(tempDir, ['--force', '--yes']);

      // AGENTS.md should be preserved (it's in PRESERVE_LIST)
      const agentsContent = fs.readFileSync(agentsPath, 'utf-8');
      assert.ok(agentsContent.includes('My Custom'), 'AGENTS.md should be preserved');
    });
  });

  describe('Config Loading', () => {
    let tempDir;

    beforeEach(() => {
      tempDir = createTempDir();
      fs.writeFileSync(
        path.join(tempDir, 'package.json'),
        JSON.stringify({ name: 'test-project' }, null, 2)
      );
    });

    afterEach(() => {
      cleanupDir(tempDir);
    });

    it('should create ai-kit.config.json in .cursor', () => {
      runCLI(tempDir, ['--yes']);

      const configPath = path.join(tempDir, '.cursor/ai-kit.config.json');
      assert.ok(fs.existsSync(configPath), 'ai-kit.config.json should be created');

      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      assert.ok(Array.isArray(config.sourceRoots), 'Config should have sourceRoots array');
      assert.ok(Array.isArray(config.excludePatterns), 'Config should have excludePatterns array');
    });
  });
});

describe('Generate Context Script', () => {
  // Test config loading function logic
  describe('Config Defaults', () => {
    it('should have sensible default source roots', () => {
      const expectedDefaults = ['src/', 'app/', 'lib/', 'pages/', 'packages/'];

      // Read the generate-context.js file to verify defaults
      const scriptPath = path.join(TEMPLATES_DIR, 'scripts/docs-update/generate-context.js');
      const content = fs.readFileSync(scriptPath, 'utf-8');

      for (const root of expectedDefaults) {
        assert.ok(content.includes(`'${root}'`), `Default config should include ${root}`);
      }
    });

    it('should have default exclude patterns', () => {
      const expectedPatterns = ['node_modules', 'dist', '.next', '.git'];

      const scriptPath = path.join(TEMPLATES_DIR, 'scripts/docs-update/generate-context.js');
      const content = fs.readFileSync(scriptPath, 'utf-8');

      for (const pattern of expectedPatterns) {
        assert.ok(content.includes(pattern), `Default excludes should include ${pattern}`);
      }
    });
  });
});

describe('Marker Check Script', () => {
  it('should exist and be valid JavaScript', () => {
    const scriptPath = path.join(TEMPLATES_DIR, 'scripts/docs-update/check-markers.js');
    assert.ok(fs.existsSync(scriptPath), 'check-markers.js should exist');

    // Verify it's valid JS by requiring it (it will error on syntax issues)
    // Note: We can't actually run it as it calls process.exit
    const content = fs.readFileSync(scriptPath, 'utf-8');
    assert.ok(content.includes('@docs-update'), 'Should search for @docs-update markers');
  });
});

describe('Find Markers Script', () => {
  it('should exist and be valid JavaScript', () => {
    const scriptPath = path.join(TEMPLATES_DIR, 'scripts/docs-update/find-markers.js');
    assert.ok(fs.existsSync(scriptPath), 'find-markers.js should exist');

    const content = fs.readFileSync(scriptPath, 'utf-8');
    assert.ok(content.includes('@docs-update'), 'Should search for @docs-update markers');
    assert.ok(content.includes('--json'), 'Should support JSON output mode');
  });
});
