# Hydrate Check

Verify hydration completeness and remove placeholders.

## When to Use

- Right after hydration
- Before release or template updates

## Protocol

1. **Run the placeholder check:**

   ```bash
   node scripts/placeholder-check.js
   # or: npm run hydrate:check
   ```

2. **Resolve findings:**
   - Replace `AI_FILL` blocks with real project content
   - Remove or rename template-only files (`DOCS-TEMPLATE.md`, `_template.mdc`, `.template.*`)
   - Delete `.cursor/HYDRATE.md` once hydration is complete

3. **Re-run until clean:**
   - The command should exit 0 with “No placeholders found”

## Output Format

```markdown
## Hydration Check

### Findings

- [ ] placeholders remain (list files + lines)
- [x] no placeholders found

### Remediation

- [ ] AI_FILL blocks replaced
- [ ] template files removed/renamed
- [ ] HYDRATE.md deleted

### Summary

- Verdict: PASS / NEEDS FIXES
```
