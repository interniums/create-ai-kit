# Hydrate Verify

Unified hydration check (files + config + placeholders).

## When to Use

- Right after hydration is complete
- Before release or template updates
- After resolving placeholder findings

## Notes

- Large projects can take a while to scan. Let the check finish.
- If the agent cannot write to `.cursor/`, run the steps locally or grant the required permission.
- `/hydrate-check` is a deprecated alias of this command.

## Protocol

1. **Run hydrate verification:**

   ```bash
   node scripts/hydrate-verify.js
   ```

2. **Fix failures:**
   - Create any missing required files
   - Remove or rename template-only files
   - Ensure `.cursor/ai-kit.config.json` has real `sourceRoots`
   - Resolve any placeholders reported by the placeholder check

## Scope

- Required files exist
- Template-only files removed
- `sourceRoots` is non-empty
- Placeholder check passes

## Output Format

```markdown
## Hydration Verify

### Findings

- [ ] missing required files (list)
- [ ] template files present (list)
- [ ] empty sourceRoots
- [ ] placeholders found

### Summary

- Verdict: PASS / NEEDS FIXES
```
