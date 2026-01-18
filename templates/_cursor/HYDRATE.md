# AI Kit Hydration

You are configuring the AI Kit for this project. I have just installed
template files that contain `<!-- AI_FILL: ... -->` blocks.

## Your Tasks

1. **Read the project context (be specific, save tokens):**

   - Read `package.json` dependencies to identify framework (Next.js, Express, Vite, etc.)
   - Check for entry files: `src/index.ts`, `src/App.tsx`, `pages/_app.tsx`, `src/server.js`, `main.py`, `go.mod`
   - From entry points, identify the architecture pattern (pages router, app router, feature modules, MVC, etc.)
   - Do NOT scan entire directory tree - focus on entry points and immediate children

2. **Hydrate the templates:**

   - Open `AGENTS.md` and replace all `<!-- AI_FILL: ... -->` blocks with specific content for this project.
   - Open `.cursor/rules/main.mdc` and fill in project-specific details if needed.
   - If you identify major features (auth, payments, API), create
     corresponding `.cursor/rules/<feature>.mdc` files **only** when there is
     clear evidence in code or docs.

3. **Generate inline docs:**

   - For each major directory in `src/` (or equivalent), consider if a `DOCS.md` would help.
   - Only create DOCS.md files for complex modules (not trivial ones).
   - Use `docs/_TEMPLATE.md` as a guide but delete the template file if not needed.

4. **Configure maintenance scripts:**

   - Open `scripts/docs-update/file-doc-map.json` (renamed from `.template.json`)
   - Fill in `mappings` based on this project's structure (e.g. mapping `src/features/*` to docs).
   - Ensure the JSON is valid.

5. **Cleanup:**
   - Remove all `<!-- AI_FILL: ... -->` comments after filling them.
   - Delete `.cursor/HYDRATE.md` when done.

## Constraints

- Do NOT invent features that don't exist in the codebase.
- Keep documentation concise (agents have limited context windows).
- Prefer links to files over duplicating content.
- Focus on existing patterns.
