# Docs Update Marker Guide

Use dated markers to flag documentation work.

## Format

```
@docs-update(YYYY-MM-DD: short reason and doc path)
```

## Examples

```typescript
// @docs-update(2024-01-15: docs/auth.md - Added OAuth flow)
// @docs-update(2024-01-15: src/services/auth/DOCS.md - New token rules)
```

## Guidelines

- Use today's date when adding a marker.
- Include the doc path in the reason.
- Remove the marker after docs are updated.
