---
name: create-component
description: Create a new React component with TypeScript and Tailwind CSS for the Chrome extension
---

Create a new React component at the specified path.

## Steps

1. Create the component file with a named export matching the filename
2. Define a `{ComponentName}Props` interface for props
3. Use functional component with hooks
4. Style with Tailwind CSS utility classes only
5. If the component will be used in a content script, ensure it works inside Shadow DOM
6. If the component contains non-trivial logic, write unit tests in a `.test.tsx` file
7. Run `pnpm compile` to verify types
