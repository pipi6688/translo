---
paths:
  - "**/*.ts"
  - "**/*.tsx"
---

# TypeScript Rules

- No `any` type — use `unknown` + type narrowing or explicit interfaces.
- Export types alongside implementations, not in separate files.
- Prefer `satisfies` over `as` for type assertions.
- Use `type` for object shapes, `interface` for extensible contracts.
