import type { AIProviderConfig, AIProviderType, TranslationSource } from './storage';

// ─── Message Protocol (port-based, for streaming) ───────────────────

export type TranslateRequest = {
  type: 'translate';
  text: string;
  sources: TranslationSource[];
};

export type TranslateChunk =
  | { type: 'chunk'; sourceKey: string; text: string }
  | { type: 'source-done'; sourceKey: string }
  | { type: 'source-error'; sourceKey: string; message: string }
  | { type: 'all-done' };

// ─── Message Protocol (one-shot, for test) ──────────────────────────

export type TestRequest = {
  type: 'test-provider';
  provider: AIProviderType;
  config: AIProviderConfig;
};

export type TestResponse =
  | { type: 'test-success'; result: string }
  | { type: 'test-error'; message: string };

// ─── Shared Utils ───────────────────────────────────────────────────

/** Unique key for a translation source. */
export function sourceKey(source: TranslationSource): string {
  return source.type === 'ai' ? `ai:${source.provider}` : `dict:${source.id}`;
}
