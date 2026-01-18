/**
 * ESLint Rule: docs-update-marker
 *
 * Enforces that @docs-update markers are addressed within a configurable timeframe.
 * Markers older than maxAgeDays (default: 14) are flagged as errors.
 *
 * Marker format:
 *   @docs-update(YYYY-MM-DD)           - with date
 *   @docs-update(YYYY-MM-DD: reason)   - with date and reason
 *   @docs-update                       - without date (always warns)
 *
 * Usage in .eslintrc:
 *   {
 *     "plugins": ["local-rules"],
 *     "rules": {
 *       "local-rules/docs-update-marker": ["error", { "maxAgeDays": 14 }]
 *     }
 *   }
 */

'use strict';

// Regex to match @docs-update markers with optional date and reason
const MARKER_REGEX = /@docs-update(?:\(([^)]+)\))?/gi;
const DATE_REGEX = /^(\d{4}-\d{2}-\d{2})(?:\s*:\s*(.*))?$/;

/**
 * Parse a marker and extract date and reason
 * @param {string} markerContent - Content inside parentheses, or null
 * @returns {{ date: Date | null, reason: string | null }}
 */
function parseMarker(markerContent) {
  if (!markerContent) {
    return { date: null, reason: null };
  }

  const match = markerContent.trim().match(DATE_REGEX);
  if (match) {
    const [, dateStr, reason] = match;
    const date = new Date(dateStr + 'T00:00:00');
    // Validate the date is real
    if (!isNaN(date.getTime())) {
      return { date, reason: reason?.trim() || null };
    }
  }

  // If no valid date, treat entire content as reason
  return { date: null, reason: markerContent.trim() };
}

/**
 * Calculate age in days from a date
 * @param {Date} date
 * @returns {number}
 */
function getAgeDays(date) {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Format date for display
 * @param {Date} date
 * @returns {string}
 */
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce @docs-update markers are addressed within a time limit',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: null,
    schema: [
      {
        type: 'object',
        properties: {
          maxAgeDays: {
            type: 'number',
            default: 14,
            minimum: 1,
          },
          requireDate: {
            type: 'boolean',
            default: false,
          },
          warnWithoutDate: {
            type: 'boolean',
            default: true,
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      markerExpired:
        '@docs-update marker from {{date}} is {{age}} days old (max: {{maxAge}}). Update docs or remove marker.',
      markerNoDate: '@docs-update marker has no date. Add date: @docs-update({{today}}{{reason}})',
      markerInvalidDate:
        '@docs-update marker has invalid date format. Use: @docs-update(YYYY-MM-DD)',
    },
  },

  create(context) {
    const options = context.options[0] || {};
    const maxAgeDays = options.maxAgeDays ?? 14;
    const requireDate = options.requireDate ?? false;
    const warnWithoutDate = options.warnWithoutDate ?? true;

    const sourceCode = context.getSourceCode();

    /**
     * Check a comment for @docs-update markers
     */
    function checkComment(comment) {
      const text = comment.value;
      let match;

      // Reset regex state
      MARKER_REGEX.lastIndex = 0;

      while ((match = MARKER_REGEX.exec(text)) !== null) {
        const fullMatch = match[0];
        const markerContent = match[1];
        const { date, reason } = parseMarker(markerContent);

        // Calculate position within comment
        const matchStart = match.index;
        const commentStart = comment.range[0];

        // Adjust for comment syntax (// or /*)
        const syntaxOffset = comment.type === 'Line' ? 2 : 2;

        const loc = {
          start: {
            line: comment.loc.start.line,
            column: comment.loc.start.column + syntaxOffset + matchStart,
          },
          end: {
            line: comment.loc.start.line,
            column: comment.loc.start.column + syntaxOffset + matchStart + fullMatch.length,
          },
        };

        if (date) {
          // Check if marker is expired
          const ageDays = getAgeDays(date);

          if (ageDays > maxAgeDays) {
            context.report({
              loc,
              messageId: 'markerExpired',
              data: {
                date: formatDate(date),
                age: ageDays,
                maxAge: maxAgeDays,
              },
            });
          }
        } else {
          // No date provided
          if (requireDate) {
            context.report({
              loc,
              messageId: 'markerNoDate',
              data: {
                today: formatDate(new Date()),
                reason: reason ? `: ${reason}` : '',
              },
            });
          } else if (warnWithoutDate) {
            context.report({
              loc,
              messageId: 'markerNoDate',
              data: {
                today: formatDate(new Date()),
                reason: reason ? `: ${reason}` : '',
              },
            });
          }
        }
      }
    }

    return {
      Program() {
        const comments = sourceCode.getAllComments();
        comments.forEach(checkComment);
      },
    };
  },
};
