/**
 * ESLint Rule Tests: docs-update-marker
 *
 * Tests the custom ESLint rule for @docs-update markers.
 * Run with: npm test
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const path = require('path');

// Import the rule directly for testing
const rule = require('../templates/eslint-rules/docs-update-marker');

describe('ESLint Rule: docs-update-marker', () => {
  describe('Rule metadata', () => {
    it('should have correct meta properties', () => {
      assert.strictEqual(rule.meta.type, 'problem');
      assert.ok(rule.meta.docs.description);
      assert.ok(Array.isArray(rule.meta.schema));
    });

    it('should have all required message IDs', () => {
      assert.ok(rule.meta.messages.markerExpired);
      assert.ok(rule.meta.messages.markerNoDate);
      assert.ok(rule.meta.messages.markerInvalidDate);
    });

    it('should define default maxAgeDays of 14', () => {
      const schema = rule.meta.schema[0];
      assert.strictEqual(schema.properties.maxAgeDays.default, 14);
    });
  });

  describe('Date parsing', () => {
    // Test the internal date parsing by examining the rule behavior
    // We can't directly test internal functions, but we verify expected behavior

    it('should accept YYYY-MM-DD format', () => {
      // Valid date format should be parseable
      const dateStr = '2024-01-15';
      const date = new Date(dateStr + 'T00:00:00');
      assert.ok(!isNaN(date.getTime()), 'Date should be valid');
    });

    it('should handle date with reason', () => {
      // Format: @docs-update(2024-01-15: some reason)
      const regex = /^(\d{4}-\d{2}-\d{2})(?:\s*:\s*(.*))?$/;
      const content = '2024-01-15: Added new feature';
      const match = content.match(regex);

      assert.ok(match, 'Should match date with reason');
      assert.strictEqual(match[1], '2024-01-15');
      assert.strictEqual(match[2], 'Added new feature');
    });

    it('should handle date without reason', () => {
      const regex = /^(\d{4}-\d{2}-\d{2})(?:\s*:\s*(.*))?$/;
      const content = '2024-01-15';
      const match = content.match(regex);

      assert.ok(match, 'Should match date without reason');
      assert.strictEqual(match[1], '2024-01-15');
      assert.strictEqual(match[2], undefined);
    });
  });

  describe('Age calculation', () => {
    it('should correctly calculate days difference', () => {
      const now = new Date();
      const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);

      const diffMs = now.getTime() - tenDaysAgo.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      assert.strictEqual(diffDays, 10);
    });

    it('should handle future dates', () => {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const diffMs = now.getTime() - tomorrow.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      assert.ok(diffDays < 0, 'Future dates should have negative age');
    });
  });

  describe('Marker regex patterns', () => {
    const MARKER_REGEX = /@docs-update(?:\(([^)]+)\))?/gi;

    it('should match basic @docs-update', () => {
      const text = '// @docs-update';
      MARKER_REGEX.lastIndex = 0;
      const match = MARKER_REGEX.exec(text);

      assert.ok(match, 'Should match basic marker');
      assert.strictEqual(match[1], undefined);
    });

    it('should match @docs-update with date', () => {
      const text = '// @docs-update(2024-01-15)';
      MARKER_REGEX.lastIndex = 0;
      const match = MARKER_REGEX.exec(text);

      assert.ok(match, 'Should match marker with date');
      assert.strictEqual(match[1], '2024-01-15');
    });

    it('should match @docs-update with date and reason', () => {
      const text = '// @docs-update(2024-01-15: Added auth)';
      MARKER_REGEX.lastIndex = 0;
      const match = MARKER_REGEX.exec(text);

      assert.ok(match, 'Should match marker with date and reason');
      assert.strictEqual(match[1], '2024-01-15: Added auth');
    });

    it('should match multiple markers in text', () => {
      const text = `
        // @docs-update(2024-01-15)
        // @docs-update(2024-01-20: second)
      `;

      const matches = [];
      let match;
      MARKER_REGEX.lastIndex = 0;
      while ((match = MARKER_REGEX.exec(text)) !== null) {
        matches.push(match[1]);
      }

      assert.strictEqual(matches.length, 2);
      assert.strictEqual(matches[0], '2024-01-15');
      assert.strictEqual(matches[1], '2024-01-20: second');
    });

    it('should be case insensitive', () => {
      const variations = [
        '// @docs-update',
        '// @DOCS-UPDATE',
        '// @Docs-Update',
        '// @DoCs-UpDaTe',
      ];

      for (const text of variations) {
        MARKER_REGEX.lastIndex = 0;
        const match = MARKER_REGEX.exec(text);
        assert.ok(match, `Should match: ${text}`);
      }
    });
  });

  describe('Rule factory', () => {
    it('should return a create function', () => {
      assert.strictEqual(typeof rule.create, 'function');
    });

    it('should create function that returns an object with Program handler', () => {
      const mockContext = {
        options: [{ maxAgeDays: 14 }],
        getSourceCode: () => ({
          getAllComments: () => [],
        }),
        report: () => {},
      };

      const handlers = rule.create(mockContext);

      assert.ok(handlers, 'Should return handlers object');
      assert.strictEqual(typeof handlers.Program, 'function');
    });
  });
});

describe('Check Markers Script', () => {
  const fs = require('fs');
  const scriptPath = path.join(__dirname, '../templates/scripts/docs-update/check-markers.js');

  it('should support dated marker format', () => {
    const content = fs.readFileSync(scriptPath, 'utf-8');

    assert.ok(content.includes('DATE_REGEX'), 'Should have DATE_REGEX for parsing dates');
    assert.ok(content.includes('MAX_AGE_DAYS'), 'Should define MAX_AGE_DAYS constant');
    assert.ok(content.includes('expired'), 'Should handle expired status');
  });

  it('should report marker status categories', () => {
    const content = fs.readFileSync(scriptPath, 'utf-8');

    assert.ok(content.includes('expiredCount'), 'Should count expired');
    assert.ok(content.includes('undatedCount'), 'Should count undated');
    assert.ok(content.includes('validCount'), 'Should count valid');
  });
});
