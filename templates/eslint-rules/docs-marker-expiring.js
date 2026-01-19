/**
 * ESLint Rule: docs-marker-expiring
 *
 * Warns when @docs-update markers are approaching expiration.
 * Use alongside docs-marker-expiry (which handles errors for expired markers).
 */

'use strict';

const MARKER_PATTERN = /@docs-update\((\d{4}-\d{2}-\d{2})\):\s*(.+)/;

/**
 * Parse a date string in YYYY-MM-DD format
 */
function parseDate(dateStr) {
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));

  if (
    date.getFullYear() !== Number(year) ||
    date.getMonth() !== Number(month) - 1 ||
    date.getDate() !== Number(day)
  ) {
    return null;
  }

  return date;
}

/**
 * Calculate days between two dates
 */
function daysBetween(from, to) {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((to - from) / msPerDay);
}

/**
 * Get today's date at midnight
 */
function getToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Warn when @docs-update markers are approaching expiration',
      category: 'Best Practices',
      recommended: true,
    },
    messages: {
      expiringSoon:
        'Documentation marker will expire in {{ daysLeft }} days (max: {{ maxDays }}). Plan to update docs soon.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          maxDays: {
            type: 'number',
            minimum: 1,
            default: 14,
            description: 'Maximum age in days before marker expires',
          },
          warnDays: {
            type: 'number',
            minimum: 1,
            default: 7,
            description: 'Days before expiration to start warning',
          },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    const options = context.options[0] || {};
    const maxDays = options.maxDays ?? 14;
    const warnDays = options.warnDays ?? 7;
    const today = getToday();

    function checkComment(comment) {
      const text = comment.value;
      const markerMatch = text.match(MARKER_PATTERN);

      if (!markerMatch) return;

      const [, dateStr] = markerMatch;
      if (!dateStr) return;

      const markerDate = parseDate(dateStr);
      if (!markerDate) return;
      if (markerDate > today) return;

      const daysOld = daysBetween(markerDate, today);
      const daysLeft = maxDays - daysOld;

      if (daysOld <= maxDays && daysLeft <= warnDays) {
        context.report({
          loc: comment.loc,
          messageId: 'expiringSoon',
          data: { daysLeft, maxDays },
        });
      }
    }

    return {
      Program() {
        const sourceCode = context.sourceCode || context.getSourceCode();
        const comments = sourceCode.getAllComments();

        for (const comment of comments) {
          checkComment(comment);
        }
      },
    };
  },
};
