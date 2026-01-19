/**
 * AI Kit ESLint Local Rules Plugin
 *
 * Custom ESLint rules for documentation workflow enforcement.
 *
 * Setup in your ESLint config:
 *
 * 1. For eslint.config.js (flat config):
 *    const localRules = require('./eslint-rules');
 *    module.exports = [
 *      {
 *        plugins: { 'local-rules': localRules },
 *        rules: {
 *          'local-rules/docs-marker-expiry': ['error', { maxDays: 14 }],
 *          'local-rules/docs-marker-expiring': ['warn', { maxDays: 14, warnDays: 7 }]
 *        }
 *      }
 *    ];
 *
 * 2. For .eslintrc.js (legacy config):
 *    module.exports = {
 *      plugins: ['./eslint-rules'],
 *      rules: {
 *        './eslint-rules/docs-marker-expiry': ['error', { maxDays: 14 }],
 *        './eslint-rules/docs-marker-expiring': ['warn', { maxDays: 14, warnDays: 7 }]
 *      }
 *    };
 */

'use strict';

const docsMarkerExpiry = require('./docs-marker-expiry');
const docsMarkerExpiring = require('./docs-marker-expiring');

module.exports = {
  rules: {
    'docs-marker-expiry': docsMarkerExpiry,
    'docs-marker-expiring': docsMarkerExpiring,
  },
};
