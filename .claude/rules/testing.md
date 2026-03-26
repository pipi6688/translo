---
paths:
  - "**/*.test.ts"
  - "**/*.test.tsx"
---

# Testing Rules

- Arrange → Act → Assert structure.
- Test behavior, not implementation details.
- Pure functions and core business logic must have tests.
- No tests needed for: UI components, config files, type definitions, glue code.
- After writing tests, run them and fix failures before marking done.
