---
name: debug-extension
description: Debug Chrome extension issues — manifest errors, messaging failures, permission problems, content script injection
---

Debug the described extension issue.

## Steps

1. Check `wxt.config.ts` and the generated `.output/chrome-mv3/manifest.json` for manifest issues
2. Verify permissions are declared for the APIs being used
3. Check service worker code for errors (no `localStorage`, no DOM access)
4. Verify content script matches patterns and injection timing
5. Check message passing: are types consistent between sender and receiver?
6. Check Shadow DOM boundaries if UI isn't rendering correctly
7. Run `pnpm build` to verify the extension compiles
8. Report findings and propose a fix
