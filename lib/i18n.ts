const en = {
  settings: 'Settings',
  defaultSource: 'Default source',
  targetLanguage: 'Target language',
  aiProviders: 'AI Providers',
  apiKey: 'API Key',
  model: 'Model',
  baseUrl: 'Base URL',
  baseUrlHint: 'OpenAI-compatible endpoint',
  systemPrompt: 'System Prompt',
  prompt: 'Prompt',
  promptVars: '{{text}} {{from}} {{to}}',
  temperature: 'Temperature',
  precise: 'Precise',
  creative: 'Creative',
  getApiKey: 'Get API key',
  test: 'Test',
  testing: 'Testing...',
  testPassed: 'Test passed!',
  testFailed: 'Test failed:',
  noApiKey: 'No API key configured.',
  keySet: 'Key set',
  copy: 'Copy',
  copied: 'Copied',
  translating: 'Translating...',
  translationFailed: 'Translation failed',
};

const zh: typeof en = {
  settings: '设置',
  defaultSource: '默认翻译源',
  targetLanguage: '目标语言',
  aiProviders: 'AI 翻译服务',
  apiKey: 'API Key',
  model: '模型',
  baseUrl: 'Base URL',
  baseUrlHint: 'OpenAI 兼容接口',
  systemPrompt: '系统提示词',
  prompt: '翻译提示词',
  promptVars: '{{text}} {{from}} {{to}}',
  temperature: '温度',
  precise: '精确',
  creative: '创意',
  getApiKey: '获取 API Key',
  test: '测试',
  testing: '测试中...',
  testPassed: '测试通过！',
  testFailed: '测试失败：',
  noApiKey: '未配置 API Key',
  keySet: '已配置',
  copy: '复制',
  copied: '已复制',
  translating: '翻译中...',
  translationFailed: '翻译失败',
};

const locales: Record<string, typeof en> = { en, zh };

function detectLocale(): string {
  const lang = navigator.language.toLowerCase();
  if (lang.startsWith('zh')) return 'zh';
  return 'en';
}

let current: typeof en = locales[detectLocale()] ?? en;

export function t<K extends keyof typeof en>(key: K): string {
  return current[key];
}

export function setLocale(locale: string) {
  current = locales[locale] ?? en;
}
