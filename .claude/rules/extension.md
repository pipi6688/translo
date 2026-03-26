---
paths:
  - "entrypoints/**"
---

# Chrome Extension Rules

- Manifest V3 only. Service worker for background, not persistent pages.
- Never import from `entrypoints/background.ts` in content script or popup — shared code goes in `lib/`.
- Content script UI must use Shadow DOM (`createShadowRootUi`) for style isolation.
- Use `chrome.runtime.connect` (ports) for streaming data, `chrome.runtime.sendMessage` for one-shot.
- All storage via `chrome.storage.local` through WXT `storage` global — never `localStorage`.
- Minimize permissions declared in manifest.
