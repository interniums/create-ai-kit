# Docs Update Marker Guide

Use dated markers to flag documentation work.

## Format

```
@docs-update(YYYY-MM-DD): path/to/doc.md - short description
```

## Examples

```typescript
// @docs-update(2024-01-15): docs/auth.md - Added OAuth flow
// @docs-update(2024-01-15): src/services/auth/DOCS.md - New token rules
```

## Guidelines

- Use today's date when adding a marker.
- Include the doc path and a short description.
- Keep 1–3 markers per commit to avoid spam.
- Remove the marker after docs are updated.

## Editor Snippet

Use the VS Code snippet `docs-upd` to insert the marker format quickly.
