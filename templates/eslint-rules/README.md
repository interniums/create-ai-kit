# AI Kit ESLint Rules

Custom ESLint rules to enforce documentation workflow discipline.

## Rules

### `docs-update-marker`

Enforces that `@docs-update` markers are addressed within a configurable timeframe.

**Why?** Markers left in code for too long indicate stale documentation. This rule ensures markers are either resolved (docs updated) or consciously renewed.

## Marker Format

```javascript
// Basic marker (triggers warning by default - no date)
// @docs-update

// With date - will error if older than maxAgeDays
// @docs-update(2024-01-15)

// With date and reason
// @docs-update(2024-01-15: Added new auth flow, update security.md)
```

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
      'local-rules/docs-update-marker': ['error', { maxAgeDays: 14 }],
    },
  },
];
```

### Option 2: Legacy Config (.eslintrc.js)

```javascript
module.exports = {
  plugins: ['./eslint-rules'],
  rules: {
    './eslint-rules/docs-update-marker': ['error', { maxAgeDays: 14 }],
  },
};
```

### Option 3: Add to package.json (eslintConfig)

```json
{
  "eslintConfig": {
    "plugins": ["./eslint-rules"],
    "rules": {
      "./eslint-rules/docs-update-marker": ["error", { "maxAgeDays": 14 }]
    }
  }
}
```

## Configuration Options

| Option            | Type    | Default | Description                                     |
| ----------------- | ------- | ------- | ----------------------------------------------- |
| `maxAgeDays`      | number  | 14      | Days before a dated marker becomes an error     |
| `requireDate`     | boolean | false   | If true, markers without dates are errors       |
| `warnWithoutDate` | boolean | true    | If true, markers without dates trigger warnings |

### Examples

```javascript
// Strict mode - require dates on all markers
'local-rules/docs-update-marker': ['error', {
  maxAgeDays: 7,
  requireDate: true
}]

// Lenient mode - only check dated markers
'local-rules/docs-update-marker': ['warn', {
  maxAgeDays: 30,
  warnWithoutDate: false
}]
```

## Workflow

1. **Add marker when making changes:**

   ```javascript
   // @docs-update(2024-01-15: Refactored auth to use JWT)
   function authenticate() { ... }
   ```

2. **Update docs before marker expires:**
   - Run `npm run docs:update` to generate context
   - Update relevant documentation
   - Remove the marker

3. **If you need more time:**
   - Update the date to extend the deadline
   - Add a reason explaining the delay

## CI Integration

Add to your CI pipeline to fail builds with stale markers:

```yaml
# .github/workflows/lint.yml
- name: Lint
  run: npm run lint
```

The rule will cause `eslint` to exit with code 1 if any markers are expired.
