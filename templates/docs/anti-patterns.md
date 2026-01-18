# Anti-Patterns Reference

> Critical patterns to avoid in this codebase. Read before making changes.

<!-- AI_FILL: Generate anti-patterns specific to the detected tech stack.
     Include the most relevant sections below based on what frameworks are used. -->

## General

| ❌ Anti-Pattern            | ✅ Do Instead                 | Why                                           |
| -------------------------- | ----------------------------- | --------------------------------------------- |
| Silently swallowing errors | Log or propagate with context | Hidden failures are impossible to debug       |
| Magic strings/numbers      | Use constants or enums        | Typos cause silent bugs, harder to refactor   |
| God files (500+ lines)     | Split by responsibility       | Harder to test, review, and maintain          |
| Premature abstraction      | Wait for 3+ use cases         | Wrong abstractions are worse than duplication |
| Comments explaining what   | Comments explaining why       | Code should be self-documenting for "what"    |

## React / Frontend

<!-- AI_FILL: Remove this section if not a React/frontend project -->

| ❌ Anti-Pattern               | ✅ Do Instead                  | Why                                     |
| ----------------------------- | ------------------------------ | --------------------------------------- |
| Logic in onClick handlers     | Extract to named functions     | Testability, reuse, readability         |
| Prop drilling > 2 levels      | Context or composition         | Maintenance nightmare, brittle          |
| useEffect for derived state   | useMemo or compute inline      | Unnecessary re-renders, race conditions |
| Index as key in dynamic lists | Stable unique IDs              | Breaks reconciliation, causes bugs      |
| Inline styles for theming     | CSS variables or design tokens | Inconsistency, hard to maintain         |
| Any type in TypeScript        | Narrow types or generics       | Defeats type safety purpose             |

## Node.js / Backend

<!-- AI_FILL: Remove this section if not a Node.js/backend project -->

| ❌ Anti-Pattern                  | ✅ Do Instead          | Why                                 |
| -------------------------------- | ---------------------- | ----------------------------------- |
| Async without error handling     | try/catch or .catch()  | Unhandled rejections crash the app  |
| Secrets in code                  | Environment variables  | Security risk, leaks in git history |
| N+1 queries                      | Batch queries or joins | Performance disaster at scale       |
| Mixing business logic in routes  | Service layer          | Untestable, hard to reuse           |
| Synchronous file I/O in requests | Async operations       | Blocks event loop, kills throughput |

## Database / Data

<!-- AI_FILL: Remove this section if no database usage -->

| ❌ Anti-Pattern                  | ✅ Do Instead             | Why                                  |
| -------------------------------- | ------------------------- | ------------------------------------ |
| Raw SQL without parameterization | Prepared statements / ORM | SQL injection vulnerability          |
| Missing indexes on foreign keys  | Add indexes               | Query performance degrades with data |
| Storing derived data             | Compute at query time     | Data inconsistency, update anomalies |
| Wide SELECT \* queries           | Select specific columns   | Network overhead, memory waste       |

## Testing

| ❌ Anti-Pattern                    | ✅ Do Instead                               | Why                                                 |
| ---------------------------------- | ------------------------------------------- | --------------------------------------------------- |
| Testing implementation details     | Test behavior/outcomes                      | Brittle tests that break on refactor                |
| No assertions in tests             | Explicit expect statements                  | False positives, tests that pass but verify nothing |
| Shared mutable state between tests | Fresh setup per test                        | Flaky tests, order-dependent failures               |
| Over-mocking                       | Prefer integration tests for critical paths | Mocks can drift from reality                        |

---

## Project-Specific Anti-Patterns

<!-- AI_FILL: Add any project-specific anti-patterns discovered in this codebase.
     These are patterns that might seem reasonable but cause problems in THIS project. -->

---

**Last Updated**: <!-- AI_FILL: Current date -->
