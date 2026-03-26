---
name: add-tests
description: Add unit tests for a function, module, or component
---

Write comprehensive tests for the specified target.

## Steps

1. Create a `.test.ts` or `.test.tsx` file next to the source file
2. Cover: happy path, edge cases, error states
3. Use Arrange → Act → Assert structure
4. Mock external dependencies (chrome APIs, fetch), not internal utilities
5. Run `pnpm vitest run` and fix any failures
6. Verify all tests pass before finishing
