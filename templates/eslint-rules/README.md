# AI Kit ESLint Rules

Custom ESLint rules to enforce documentation workflow discipline.

## Quick Setup

```bash
npx create-ai-kit eslint-setup
```

This command auto-detects your ESLint config format and adds the rules. Supports `.eslintrc.json`, `.eslintrc.js`, `eslint.config.js`, `package.json` eslintConfig, and YAML configs (with manual instructions).

## Rules

### `docs-marker-expiry` (error)

Errors when `@docs-update` markers are expired, missing timestamps, or invalid.

### `docs-marker-expiring` (warning)

Warns when `@docs-update` markers are approaching expiration.

**Why?** Stale markers indicate documentation drift. These rules keep updates timely without forcing real-time doc edits.

## Marker Format

Use dated markers by default:

```javascript
// @docs-update(2024-01-15): docs/security.md - Added new auth flow
```

Note: the rules scan line-by-line. Multi-line markers (splitting the marker across lines)
are not supported and will be ignored.

## Setup

### Option 1: ESLint Flat Config (eslint.config.js)

```javascript
const localRules = require('./eslint-rules');

module.exports = [
  {
    plugins: {
      'local-rules': localRules,
    },
    rules: {
      'local-rules/docs-marker-expiry': ['error', { maxDays: 14 }],
      'local-rules/docs-marker-expiring': ['warn', { maxDays: 14, warnDays: 7 }],
    },
  },
];
```

### Option 2: Legacy Config (.eslintrc.js)

```javascript
module.exports = {
  plugins: ['./eslint-rules'],
  rules: {
    './eslint-rules/docs-marker-expiry': ['error', { maxDays: 14 }],
    './eslint-rules/docs-marker-expiring': ['warn', { maxDays: 14, warnDays: 7 }],
  },
};
```

### Option 3: Add to package.json (eslintConfig)

```json
{
  "eslintConfig": {
    "plugins": ["./eslint-rules"],
    "rules": {
      "./eslint-rules/docs-marker-expiry": ["error", { "maxDays": 14 }],
      "./eslint-rules/docs-marker-expiring": ["warn", { "maxDays": 14, "warnDays": 7 }]
    }
  }
}
```

## Configuration Options

### `docs-marker-expiry`

| Option    | Type   | Default | Description                                 |
| --------- | ------ | ------- | ------------------------------------------- |
| `maxDays` | number | 14      | Days before a dated marker becomes an error |

### `docs-marker-expiring`

| Option     | Type   | Default | Description                             |
| ---------- | ------ | ------- | --------------------------------------- |
| `maxDays`  | number | 14      | Max age in days before marker expires   |
| `warnDays` | number | 7       | Days before expiration to start warning |

### Examples

```javascript
// Strict mode - 14-day expiry with 7-day warnings
'local-rules/docs-marker-expiry': ['error', { maxDays: 14 }]
'local-rules/docs-marker-expiring': ['warn', { maxDays: 14, warnDays: 7 }]
```

## Workflow

1. **Add marker when making changes:**

   ```javascript
   // @docs-update(2024-01-15): docs/security.md - Refactored auth to use JWT
   function authenticate() { ... }
   ```

2. **Update docs before marker expires:**
   - Run `npm run docs:update` to generate context
   - Update relevant documentation
   - Remove the marker

3. **If you need more time:**
   - Update the date to extend the deadline
   - Keep the description accurate

## CI Integration

Add to your CI pipeline to fail builds with stale markers:

```yaml
# .github/workflows/lint.yml
- name: Lint
  run: npm run lint
```

The `docs-marker-expiry` rule will cause `eslint` to exit with code 1 if any markers are expired or invalid.
