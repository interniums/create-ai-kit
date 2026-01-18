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
 *          'local-rules/docs-update-marker': ['error', { maxAgeDays: 14 }]
 *        }
 *      }
 *    ];
 *
 * 2. For .eslintrc.js (legacy config):
 *    module.exports = {
 *      plugins: ['./eslint-rules'],
 *      rules: {
 *        './eslint-rules/docs-update-marker': ['error', { maxAgeDays: 14 }]
 *      }
 *    };
 */

'use strict';

const docsUpdateMarker = require('./docs-update-marker');

module.exports = {
  rules: {
    'docs-update-marker': docsUpdateMarker,
  },
};
