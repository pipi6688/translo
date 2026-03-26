---
paths:
  - "**/*.tsx"
---

# React Rules

- Functional components only, with hooks.
- Props interface named `{ComponentName}Props`.
- Extract logic into custom hooks when a component exceeds ~80 lines.
- Use `React.memo` only when profiling confirms a perf issue, not preemptively.
- Tailwind classes only — no inline styles unless dynamic values require it.
