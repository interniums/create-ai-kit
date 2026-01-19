/**
 * ESLint Rule Tests: docs-marker-expiry / docs-marker-expiring
 *
 * Tests the custom ESLint rules for @docs-update markers.
 * Run with: npm test
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const path = require('path');

const expiryRule = require('../templates/eslint-rules/docs-marker-expiry');
const expiringRule = require('../templates/eslint-rules/docs-marker-expiring');

describe('ESLint Rule: docs-marker-expiry', () => {
  describe('Rule metadata', () => {
    it('should have correct meta properties', () => {
      assert.strictEqual(expiryRule.meta.type, 'problem');
      assert.ok(expiryRule.meta.docs.description);
      assert.ok(Array.isArray(expiryRule.meta.schema));
    });

    it('should have all required message IDs', () => {
      assert.ok(expiryRule.meta.messages.expired);
      assert.ok(expiryRule.meta.messages.missingTimestamp);
      assert.ok(expiryRule.meta.messages.invalidDate);
      assert.ok(expiryRule.meta.messages.futureDate);
    });

    it('should define default maxDays of 14', () => {
      const schema = expiryRule.meta.schema[0];
      assert.strictEqual(schema.properties.maxDays.default, 14);
    });
  });

  describe('Rule factory', () => {
    it('should return a create function', () => {
      assert.strictEqual(typeof expiryRule.create, 'function');
    });

    it('should create function that returns an object with Program handler', () => {
      const mockContext = {
        options: [{ maxDays: 14 }],
        getSourceCode: () => ({
          getAllComments: () => [],
        }),
        report: () => {},
      };

      const handlers = expiryRule.create(mockContext);

      assert.ok(handlers, 'Should return handlers object');
      assert.strictEqual(typeof handlers.Program, 'function');
    });
  });
});

describe('ESLint Rule: docs-marker-expiring', () => {
  describe('Rule metadata', () => {
    it('should have correct meta properties', () => {
      assert.strictEqual(expiringRule.meta.type, 'suggestion');
      assert.ok(expiringRule.meta.docs.description);
      assert.ok(Array.isArray(expiringRule.meta.schema));
    });

    it('should have expiringSoon message ID', () => {
      assert.ok(expiringRule.meta.messages.expiringSoon);
    });

    it('should define default maxDays and warnDays', () => {
      const schema = expiringRule.meta.schema[0];
      assert.strictEqual(schema.properties.maxDays.default, 14);
      assert.strictEqual(schema.properties.warnDays.default, 7);
    });
  });
});

describe('Check Markers Script', () => {
  const fs = require('fs');
  const scriptPath = path.join(
    __dirname,
    '../templates/scripts/docs-update/check-markers.js',
  );

  it('should support CLI flags and status buckets', () => {
    const content = fs.readFileSync(scriptPath, 'utf-8');

    assert.ok(content.includes('--max-days'), 'Should support --max-days');
    assert.ok(content.includes('--warn-days'), 'Should support --warn-days');
    assert.ok(content.includes('--json'), 'Should support --json');
    assert.ok(content.includes('missing-date'), 'Should handle missing-date');
    assert.ok(content.includes('invalid-date'), 'Should handle invalid-date');
  });
});
