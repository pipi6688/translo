# Translo

Lightweight AI-powered translation Chrome extension for developers. Select English text → instant translation from multiple sources (AI + Google Translate).

## Stack

- **Framework**: WXT 0.20 (Manifest V3)
- **UI**: React 19 + TypeScript + Tailwind CSS 4
- **AI**: Vercel AI SDK 6 (`ai`, `@ai-sdk/openai`, `@ai-sdk/anthropic`, `@ai-sdk/google`, `@ai-sdk/deepseek`)
- **Test**: Vitest
- **Package manager**: pnpm

## Commands

```bash
pnpm dev              # Dev mode with HMR, auto-loads to Chrome
pnpm build            # Production build → .output/chrome-mv3/
pnpm vitest run       # Run tests
pnpm compile          # TypeScript type check
```

## Architecture

```
entrypoints/
  background.ts              # Service worker: translation dispatch, AI streaming
  content/index.tsx           # Text selection detection, mounts translation panel via Shadow DOM
  popup/                      # Extension icon click → quick settings
  options/                    # Full settings page (opened from popup or chrome://extensions)
components/
  TranslationPanel.tsx        # Floating overlay rendered in Shadow DOM on page
lib/
  filter.ts                   # Text selection filter (English only, skip passwords/URLs/code)
  dictionaries.ts             # Free translation providers (Google, Bing, Youdao, Baidu, DeepL)
  translator.ts               # AI translation via Vercel AI SDK streamText
  storage.ts                  # chrome.storage wrapper with typed settings
  shared.ts                   # Shared utilities (sourceKey, etc.)
```

## Conventions

- **All UI text in English.** No Chinese in labels, buttons, descriptions, error messages, toasts.
- WXT auto-imports: `storage`, `browser`, `defineBackground`, `defineContentScript`, `createShadowRootUi`, React hooks — no manual imports needed for these.
- Content script UI runs inside Shadow DOM — styles are isolated, `document.querySelector` from page cannot reach our elements.
- Keep translation panel minimal and fast. It's a floating overlay on every web page.
- Prefer lazy behavior: only fire network requests when the user explicitly needs the result.
- Never import from `entrypoints/background.ts` in other entrypoints — shared code goes in `lib/`.

## Key Patterns

- **Message passing**: Content script ↔ Background uses `chrome.runtime.connect` (port) for streaming, typed as `TranslateRequest` / `TranslateChunk` in `lib/shared.ts`.
- **Settings**: All persisted via `storage.defineItem<Settings>('local:settings')`, typed in `lib/storage.ts`.
- **Dictionary providers**: Each implements `(text, from, to) => Promise<string>`, registered in `DICTIONARIES` map.

## Git

- **Personal GitHub account**: All claw projects use personal account `pipi6688`.
- **SSH Host**: Use `github-personal` (not `github.com`) — e.g. `git@github-personal:pipi6688/translo.git`.
- **Commit identity**: `user.name = pipi6688`, `user.email = pipi6688@users.noreply.github.com` (already set in local git config).

## Gotchas

- `wxt/storage` is not a valid import path in WXT 0.20 — `storage` is a global auto-import from `wxt/utils/storage`.
- Shadow DOM isolates CSS but also isolates `element.closest()` — cannot traverse past shadow boundary.
- Chrome extension service workers support `fetch` but not `localStorage` — use `chrome.storage` only.
- Free dictionary APIs (Bing, Baidu) extract tokens from HTML pages — fragile, may break on upstream changes.
