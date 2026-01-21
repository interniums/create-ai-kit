# Build

Production-ready implementation.

## When to Use

- After `/plan`, or for well-defined tasks
- Skip if: task needs clarification → use `/plan` first

## Fast Path

If the change touches 1–2 files, keep output brief and skip redundant checklist items.

## Protocol

1. **No Placeholders:** Write full, functional code. No `// ... rest of code`.

2. **Type Safety:** Strict typing (no `any`, use `unknown` if needed).

3. **Route Safety:** Use route builders (if available), never hardcode URLs.

4. **State Management:**
   - Simple local state: `useState` (or equivalent)
   - Complex logic: Extract to custom hooks/composables
   - Shared state: Use existing Context/Store
   - Never put complex business logic inside effects in components

5. **Frontend-only guardrails (if this is a frontend project):**
   - **Handler Safety:** Extract all logic from UI handlers into named functions
   - **UI & Styling:** Use UI library components + theme tokens; no inline styles unless standard
   - **Data Fetching:** Use service layer functions, no raw fetch/axios in components
   - **State UX:** Handle loading and error states explicitly

6. **Anti-Patterns:**
   See full table in `AGENTS.md` → Critical Anti-Patterns section. Key ones:
   - No `any` types
   - No hardcoded routes
   - No inline handler logic
   - No `console.log` (use logger)
   - No silent error swallowing
   - No `fetch()` in components
   - No raw strings in URLs

7. **Frontend-only UX guardrails (if this is a frontend project):**
   - Prevent double-submits for async actions
   - Confirm destructive actions
   - Accessibility: keyboard support, visible focus
   - Provide clear states: loading, empty, error, success

8. **Docs Marker:** If changing exports or patterns, add marker comment:

    ```typescript
    // @docs-update(2024-01-15): path/to/DOCS.md - Description of change
    ```

    These markers are temporary - they're collected by the docs update script.

9. **Verification:** Run lint and type checks if scripts exist; otherwise report missing.

## Project Scripts

- `npm run ai-kit:verify` (or `node scripts/hydrate-verify.js`) — verify hydration completeness

<!-- AI_FILL: Add project specific scripts here (e.g. npm run lint, npm run type-check) -->
