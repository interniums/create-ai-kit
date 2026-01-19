/**
 * ESLint Rule: docs-marker-expiry
 *
 * Enforces that @docs-update markers include a timestamp and haven't expired.
 *
 * Valid format: // @docs-update(YYYY-MM-DD): path/to/doc.md - Description
 *
 * Errors when:
 * - Marker is older than maxDays (default: 14)
 * - Marker uses old format without timestamp
 * - Marker date is invalid or in the future
 */

'use strict';

const MARKER_PATTERN = /@docs-update(?:\((\d{4}-\d{2}-\d{2})\))?:\s*(.+)/;
const OLD_FORMAT_PATTERN = /@docs-update:\s*(.+)/;

/**
 * Parse a date string in YYYY-MM-DD format
 * @param {string} dateStr
 * @returns {Date|null}
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
 * @param {Date} from
 * @param {Date} to
 * @returns {number}
 */
function daysBetween(from, to) {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((to - from) / msPerDay);
}

/**
 * Get today's date at midnight (for consistent comparisons)
 * @returns {Date}
 */
function getToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Enforce @docs-update markers have timestamps and are not expired',
      category: 'Best Practices',
      recommended: true,
    },
    messages: {
      expired:
        'Documentation marker expired {{ daysAgo }} days ago (max: {{ maxDays }} days). Update docs and remove marker, or refresh the date if still WIP.',
      missingTimestamp:
        '@docs-update marker missing timestamp. Use format: @docs-update({{ today }}): path - description',
      invalidDate:
        '@docs-update marker has invalid date "{{ date }}". Use format: YYYY-MM-DD',
      futureDate:
        '@docs-update marker has future date "{{ date }}". Use today\'s date or earlier.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          maxDays: {
            type: 'number',
            minimum: 1,
            default: 14,
            description: 'Maximum age in days before marker expires (error)',
          },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    const options = context.options[0] || {};
    const maxDays = options.maxDays ?? 14;
    const today = getToday();
    const todayStr = today.toISOString().split('T')[0];

    /**
     * Check a comment for @docs-update markers
     * @param {import('eslint').AST.Token} comment
     */
    function checkComment(comment) {
      const text = comment.value;

      const markerMatch = text.match(MARKER_PATTERN);
      if (!markerMatch) {
        if (OLD_FORMAT_PATTERN.test(text) && !MARKER_PATTERN.test(text)) {
          const oldFormatCheck = text.match(/@docs-update(?!\s*\()/);
          if (oldFormatCheck) {
            context.report({
              loc: comment.loc,
              messageId: 'missingTimestamp',
              data: { today: todayStr },
            });
          }
        }
        return;
      }

      const [, dateStr] = markerMatch;

      if (!dateStr) {
        context.report({
          loc: comment.loc,
          messageId: 'missingTimestamp',
          data: { today: todayStr },
        });
        return;
      }

      const markerDate = parseDate(dateStr);
      if (!markerDate) {
        context.report({
          loc: comment.loc,
          messageId: 'invalidDate',
          data: { date: dateStr },
        });
        return;
      }

      if (markerDate > today) {
        context.report({
          loc: comment.loc,
          messageId: 'futureDate',
          data: { date: dateStr },
        });
        return;
      }

      const daysOld = daysBetween(markerDate, today);

      if (daysOld > maxDays) {
        context.report({
          loc: comment.loc,
          messageId: 'expired',
          data: {
            daysAgo: daysOld,
            maxDays,
          },
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
