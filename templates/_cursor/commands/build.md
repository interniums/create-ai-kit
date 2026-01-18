# Build

Production-ready implementation.

## When to Use

- After `/plan`, or for well-defined tasks
- Skip if: task needs clarification → use `/plan` first

## Protocol

1. **No Placeholders:** Write full, functional code. No `// ... rest of code`.

2. **Type Safety:** Strict typing (no `any`, use `unknown` if needed).

3. **Route Safety:** Use route builders (if available), never hardcode URLs.

4. **Handler Safety:** Extract all logic from UI handlers into named functions.

5. **State Management:**

   - Simple local state: `useState` (or equivalent)
   - Complex logic: Extract to custom hooks/composables
   - Shared state: Use existing Context/Store
   - Never put complex business logic inside effects in components

6. **UI & Styling:**

   - Use project's UI library components
   - Use theme tokens (colors, spacing)
   - No inline styles, no raw CSS (unless project standard)
   - Reuse components; don't invent new primitives unless explicitly asked

7. **Data Fetching:**

   - Use service layer functions
   - Never use raw fetch/axios in components
   - Handle loading and error states explicitly

8. **Anti-Patterns:**
   See full table in `AGENTS.md` → Critical Anti-Patterns section. Key ones:

   - No `any` types
   - No hardcoded routes
   - No inline handler logic
   - No `console.log` (use logger)
   - No silent error swallowing
   - No `fetch()` in components
   - No raw strings in URLs

9. **UI Guardrails:**

   - Prevent double-submits for async actions
   - Confirm destructive actions
   - Accessibility: keyboard support, visible focus
   - Provide clear states: loading, empty, error, success

10. **Docs Marker:** If changing exports or patterns, add marker comment:

    ```typescript
    // @docs-update: path/to/DOCS.md - Description of change
    ```

    These markers are temporary - they're collected by the docs update script.

11. **Verification:** Run lint and type checks, fix introduced issues before finishing.

## Project Scripts

<!-- AI_FILL: Add project specific scripts here (e.g. npm run lint, npm run type-check) -->
