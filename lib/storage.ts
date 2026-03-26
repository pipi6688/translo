// `storage` is auto-imported globally by WXT from wxt/utils/storage

import type { DictionaryId } from './dictionaries';

export type AIProviderType = 'openai' | 'anthropic' | 'google' | 'deepseek';

export interface AIProviderConfig {
  apiKey: string;
  model: string;
  baseURL?: string;
  systemPrompt: string;
  prompt: string;
  temperature: number;
}

export type TranslationSource =
  | { type: 'ai'; provider: AIProviderType }
  | { type: 'dictionary'; id: DictionaryId };

export interface Settings {
  aiProviders: Partial<Record<AIProviderType, AIProviderConfig>>;
  enabledDictionaries: DictionaryId[];
  defaultSource: TranslationSource;
  autoTranslate: boolean;
  /** Target language code for translation (e.g. "zh-CN", "ja", "ko"). */
  targetLanguage: string;
}

export const DEFAULT_MODELS: Record<AIProviderType, string> = {
  openai: 'gpt-4o-mini',
  anthropic: 'claude-sonnet-4-20250514',
  google: 'gemini-2.0-flash',
  deepseek: 'deepseek-chat',
};

export const DEFAULT_SYSTEM_PROMPT =
  'You are a professional, authentic machine translation engine.';

export const DEFAULT_PROMPT =
  'Treat next line as plain text input and translate it into {{to}}. Output translation ONLY. If translation is unnecessary (e.g. proper nouns, codes, etc.), return the original text. NO explanations. NO notes. Input:\n{{text}}';

export function defaultProviderConfig(id: AIProviderType): AIProviderConfig {
  return {
    apiKey: '',
    model: DEFAULT_MODELS[id],
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    prompt: DEFAULT_PROMPT,
    temperature: 0,
  };
}

export const AI_PROVIDERS: {
  id: AIProviderType;
  name: string;
  website: string;
  defaultBaseURL: string;
}[] = [
  { id: 'openai', name: 'OpenAI', website: 'https://platform.openai.com', defaultBaseURL: 'https://api.openai.com/v1' },
  { id: 'anthropic', name: 'Anthropic', website: 'https://console.anthropic.com', defaultBaseURL: 'https://api.anthropic.com' },
  { id: 'google', name: 'Google AI', website: 'https://aistudio.google.com', defaultBaseURL: 'https://generativelanguage.googleapis.com/v1beta' },
  { id: 'deepseek', name: 'DeepSeek', website: 'https://platform.deepseek.com', defaultBaseURL: 'https://api.deepseek.com/v1' },
];

/** Common target languages. */
export const TARGET_LANGUAGES = [
  { code: 'zh-CN', label: 'Chinese (Simplified)', labelZh: '简体中文' },
  { code: 'zh-TW', label: 'Chinese (Traditional)', labelZh: '繁体中文' },
  { code: 'en', label: 'English', labelZh: '英语' },
  { code: 'ja', label: 'Japanese', labelZh: '日语' },
  { code: 'ko', label: 'Korean', labelZh: '韩语' },
  { code: 'fr', label: 'French', labelZh: '法语' },
  { code: 'de', label: 'German', labelZh: '德语' },
  { code: 'es', label: 'Spanish', labelZh: '西班牙语' },
  { code: 'ru', label: 'Russian', labelZh: '俄语' },
  { code: 'pt', label: 'Portuguese', labelZh: '葡萄牙语' },
];

const DEFAULT_SETTINGS: Settings = {
  aiProviders: {},
  enabledDictionaries: ['google'],
  defaultSource: { type: 'dictionary', id: 'google' },
  autoTranslate: true,
  targetLanguage: 'zh-CN',
};

const settingsItem = storage.defineItem<Settings>('local:settings', {
  defaultValue: DEFAULT_SETTINGS,
});

export async function getSettings(): Promise<Settings> {
  return settingsItem.getValue();
}

export async function updateSettings(partial: Partial<Settings>): Promise<void> {
  const current = await getSettings();
  await settingsItem.setValue({ ...current, ...partial });
}

export function watchSettings(cb: (settings: Settings) => void) {
  return settingsItem.watch(cb);
}

/** Map language code to human-readable name for AI prompts. */
export function languageName(code: string): string {
  return TARGET_LANGUAGES.find((l) => l.code === code)?.label ?? code;
}

export function renderPrompt(
  template: string,
  vars: { text: string; from: string; to: string },
): string {
  return template
    .replace(/\{\{text\}\}/g, vars.text)
    .replace(/\{\{from\}\}/g, languageName(vars.from))
    .replace(/\{\{to\}\}/g, languageName(vars.to));
}

export function getSourceName(source: TranslationSource): string {
  if (source.type === 'ai') {
    return AI_PROVIDERS.find((p) => p.id === source.provider)?.name ?? source.provider;
  }
  return source.id === 'google' ? 'Google Translate' : source.id;
}
