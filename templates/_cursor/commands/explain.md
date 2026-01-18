# Explain

Code walkthrough without making changes.

## When to Use

- Understanding existing code
- Onboarding / knowledge transfer
- "How does X work?"

## What to Look For (Checklist)

When explaining code, always identify:

### Critical Elements

- [ ] **Entry points**: Where does execution start? (page component, API route, function call)
- [ ] **Data flow**: Where does data come from? How does it transform? Where does it go?
- [ ] **State mutations**: What changes over time? (component state, database, external services)
- [ ] **Side effects**: API calls, database writes, localStorage, cookies, analytics events
- [ ] **Error handling**: How are errors caught and handled? What happens on failure?
- [ ] **Auth/security checks**: Is there authentication? Authorization? Input validation?
- [ ] **Dependencies**: What external modules, services, or context does it rely on?
- [ ] **Performance concerns**: N+1 queries, large loops, unnecessary re-renders, heavy computations

### Code Quality Observations

- [ ] **Patterns used**: Identify standard patterns (Factory, Observer, HOC, hooks pattern, etc.)
- [ ] **Assumptions**: What does code assume about inputs, state, or environment?
- [ ] **Edge cases**: Are nulls, empty arrays, boundary values handled?
- [ ] **Coupling**: How tightly is this coupled to other code? Can it be tested/changed independently?
- [ ] **Complexity**: Deeply nested conditionals, long functions, many responsibilities?

## Protocol

1. **Read:** Load the relevant files/functions.

2. **Define Boundaries:**
   - Identify the scope: single function, module, or feature
   - Stop tracing at: external libraries, API boundaries, database calls
   - If scope is unclear, ask: "Should I trace into X or treat it as a black box?"

3. **Trace:** Follow the execution flow from entry point within boundaries.
   - Note the happy path first
   - Then note error/edge case paths

4. **Explain:** Break down in plain language:
   - **What it does:** Purpose in one sentence
   - **How it works:** Step-by-step mechanism
   - **Patterns used:** Identify standard patterns (Factory, Observer, HOC, etc.) rather than guessing original author's intent
   - **Key dependencies:** External modules, services, context it relies on
   - **Side effects:** State changes, API calls, localStorage, cookies, etc.

5. **Assess Code Quality:**
   - Security: Auth checks present? Input validation? Data exposure risks?
   - Performance: Any obvious bottlenecks? N+1 queries? Unnecessary re-renders?
   - Maintainability: Clear naming? Reasonable complexity? Good separation of concerns?
   - Edge cases: Null handling? Empty states? Boundary conditions?

6. **Flag Gotchas:** Highlight potential issues observed during the read:
   - Edge cases that might not be handled
   - Performance concerns (N+1 queries, unnecessary re-renders, large loops)
   - Assumptions in the code that could break (e.g., "assumes user is always logged in")
   - Coupling or complexity that could cause maintenance issues
   - Security concerns (missing auth, no input validation, exposed data)

7. **Diagram:** For complex flows, provide ASCII or mermaid diagram:

   ```mermaid
   flowchart TD
       A[Entry] --> B{Decision}
       B -->|Yes| C[Path A]
       B -->|No| D[Path B]
   ```

## Output Format

```markdown
## Explanation: [Function/Module Name]

### Summary

[One sentence: what this code does]

### Scope & Boundaries

- Tracing: [entry point] → [boundary]
- Treating as black box: [external libs, APIs]

### How It Works

1. [Step 1]
2. [Step 2]
3. ...

### Data Flow

- Input: [where data comes from]
- Transforms: [how data changes]
- Output: [where data goes]

### State & Side Effects

- State mutations: [what changes]
- Side effects: [API calls, DB writes, localStorage, etc.]

### Patterns Used

- [Pattern name]: [where/how it's used]

### Dependencies

- External modules: [libraries, packages]
- Internal services: [other modules/services]
- Context/state: [React context, global state, etc.]

### Code Quality Assessment

**Security:**

- Auth/authorization: [present/missing/concerns]
- Input validation: [present/missing/concerns]

**Performance:**

- [Any concerns or optimizations noted]

**Maintainability:**

- [Code quality observations]

### Gotchas

- ⚠️ [Potential issue or edge case]
- ⚠️ [Performance concern]
- ⚠️ [Security concern]
- ⚠️ [Missing error handling]

### Diagram (if complex)

[mermaid or ASCII]
```

## Domain-Specific Guidance

When explaining:

### Payment/Webhook Code

- Check webhook signature verification
- Look for idempotency handling
- Note sensitive data handling (don't log full payloads)
- Check transaction boundaries

### API Routes

- Check auth middleware
- Look for input validation
- Note error responses
- Check rate limiting

### React Components

- Identify state management pattern
- Note useEffect dependencies
- Check for unnecessary re-renders
- Look for memory leaks (event listeners, subscriptions)

### Database Queries

- Check for N+1 queries
- Look for missing indexes
- Note transaction usage
- Check for SQL injection vectors

## Note

This is read-only - no code changes. If you want changes after understanding, use `/build` or `/refactor`.
