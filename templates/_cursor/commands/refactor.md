# Refactor

Improve code quality without changing behavior.

## When to Use

- Code smells, duplication, unclear structure, tech debt
- Skip if: behavior change needed → that's a feature, use `/plan`

## When NOT to Refactor

- **Production-stable code** without a reason (if it works, consider leaving it)
- **Unclear requirements** - refactoring assumptions may be wrong
- **Active development** - coordinate with team to avoid conflicts
- **Before understanding** - use `/explain` first if code is unfamiliar

## Refactoring Pattern Catalog

| Pattern | When to Use | Risk Level | Example |
| --- | --- | --- | --- |
| **Rename** | Unclear variable/function names | 🟢 Safe | `data` → `userProfile` |
| **Extract Function** | Duplication, >15 lines, complex logic | 🟢 Safe | Pull out validation logic |
| **Extract Component** | JSX duplication, >50 lines | 🟡 Medium | Extract `<Card>` |
| **Introduce Parameter Object** | Function has >3 params | 🟢 Safe | `(a,b,c,d)` → `(options)` |
| **Consolidate Handlers** | Multiple similar event handlers | 🟡 Medium | Merge `onClick` handlers |
| **Extract Service** | Business logic in components | 🟡 Medium | Move logic to service |
| **Replace Conditional with Polymorphism** | Long if/else or switch | 🟠 Risky | Strategy pattern |
| **Inline Function** | One-liner called once | 🟢 Safe | Remove unnecessary abstraction |
| **Move to Shared** | Used in 3+ places | 🟡 Medium | Move to `@/utils` or `@/hooks` |
| **Add Types** | `any` or missing types | 🟢 Safe | Add proper TypeScript types |

### Risk Levels

- 🟢 **Safe**: Rename, add types, extract small functions - low chance of breaking
- 🟡 **Medium**: Extract components/services, change structure - test thoroughly
- 🟠 **Risky**: Architecture changes, polymorphism - needs careful testing and review

## Protocol

1. **Establish Baseline (required before any changes):**

   - Run lint and type checks — **abort if either fails**
   - If code is already broken, use `/fix` first, then return to refactor

2. **Read Context:** Understand current implementation, its callers, and dependencies.

3. **Identify Issues:**

   - Duplication (same code in multiple places)
   - Excessive complexity (deeply nested conditionals, >50 line functions)
   - Poor naming (unclear what variables/functions do)
   - Tight coupling (hard to change one thing without changing others)
   - Missing types (`any`, untyped params)
   - Anti-patterns (from `AGENTS.md`)

4. **Select Pattern:** Choose refactoring pattern(s) from catalog above.

5. **Plan Incremental Steps:**

   - Break large refactors into safe, testable steps
   - Each step should compile and pass tests
   - Example: Rename → Extract → Move (not all at once)

6. **Transform:** Group related atomic refactors into a single coherent change.

   - Extract function/component
   - Rename for clarity
   - Consolidate duplicates
   - Add/narrow types

   _Note: "One pattern at a time" means don't mix unrelated refactors (e.g., renaming + architecture change). Related changes to the same code path should be a single commit._

7. **Verify (execute, don't assume):**

   - Run lint and type checks — must pass
   - Manually verify behavior unchanged (check UI, API responses, etc.)

8. **Document:** If significant, add `// @docs-update:` marker.

## Output Format

```markdown
## Refactor: [Target]

### Baseline

- [x] Types pass
- [x] Lint clean

### Issues Found

1. [Issue] → [Refactoring pattern to apply]
2. [Issue] → [Refactoring pattern to apply]

### Selected Patterns

- [Pattern name] (Risk: 🟢/🟡/🟠)

### Incremental Steps

1. [Step 1 - what will change]
2. [Step 2 - what will change]
3. [Verify between each step]

### Changes Made

- `file/path.ts`: [What changed]
- `file/path2.ts`: [What changed]

### Verification

- [x] Type check passes
- [x] Lint check passes
- [x] Manual verification passed (describe what was checked)
```

## Common Refactoring Triggers

| Code Smell | Pattern to Apply | Example |
| --- | --- | --- |
| Duplicate code in 3+ places | Extract Function or Component | Same validation logic repeated |
| Function >30 lines | Extract Function | Break into smaller pieces |
| Component >100 lines | Extract Component | Split into smaller components |
| Unclear variable name | Rename | `data` → `userProfile` |
| >3 function parameters | Introduce Parameter Object | `{...options}` |
| Long if/else chains | Extract Function or Strategy | Pull logic into named functions |
| Business logic in components | Extract Service | Move to `@/services/` |
| Tight coupling | Dependency Injection | Pass dependencies as params |
| Missing types | Add Types | Replace `any` with proper types |

## Project Scripts

<!-- AI_FILL: Add project specific scripts here -->
