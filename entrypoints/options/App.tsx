import { useState, useEffect, useCallback, useRef } from 'react';
import {
  type Settings,
  type AIProviderType,
  type AIProviderConfig,
  type TranslationSource,
  getSettings,
  updateSettings,
  defaultProviderConfig,
  AI_PROVIDERS,
  TARGET_LANGUAGES,
} from '@/lib/storage';
import { sourceKey } from '@/lib/shared';
import type { TestRequest, TestResponse } from '@/lib/shared';
import { t } from '@/lib/i18n';

// ─── Debounced save ─────────────────────────────────────────────────

function useDebouncedSave(delay = 600) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  const save = useCallback(
    (patch: Partial<Settings>) => {
      setSettings((prev) => (prev ? { ...prev, ...patch } : prev));
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => updateSettings(patch), delay);
    },
    [delay],
  );

  const saveNow = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => (prev ? { ...prev, ...patch } : prev));
    updateSettings(patch);
  }, []);

  return { settings, save, saveNow };
}

// ─── App ────────────────────────────────────────────────────────────

export function App() {
  const { settings, save, saveNow } = useDebouncedSave();

  if (!settings) {
    return <div className="flex h-screen items-center justify-center text-gray-300">Loading…</div>;
  }

  const allSources: { source: TranslationSource; name: string; key: string }[] = [
    { source: { type: 'dictionary', id: 'google' }, name: 'Google Translate', key: 'dict:google' },
    ...AI_PROVIDERS.filter((p) => settings.aiProviders[p.id]?.apiKey).map((p) => ({
      source: { type: 'ai' as const, provider: p.id },
      name: p.name,
      key: sourceKey({ type: 'ai', provider: p.id }),
    })),
  ];

  const currentKey = sourceKey(settings.defaultSource);

  const updateProvider = (id: AIProviderType, patch: Partial<AIProviderConfig>) => {
    const current = settings.aiProviders[id] ?? defaultProviderConfig(id);
    save({ aiProviders: { ...settings.aiProviders, [id]: { ...current, ...patch } } });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-xl px-6 py-12">
        <header className="mb-12">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Translo</h1>
          <p className="mt-1 text-sm text-gray-400">{t('settings')}</p>
        </header>

        {/* Target language */}
        <section className="mb-10">
          <Label>{t('targetLanguage')}</Label>
          <select
            value={settings.targetLanguage}
            onChange={(e) => saveNow({ targetLanguage: e.target.value })}
            className="mt-2 cursor-pointer rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
          >
            {TARGET_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.label}
              </option>
            ))}
          </select>
        </section>

        {/* Default source */}
        <section className="mb-10">
          <Label>{t('defaultSource')}</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {allSources.map((s) => (
              <button
                key={s.key}
                onClick={() => saveNow({ defaultSource: s.source })}
                className={`cursor-pointer rounded-full px-4 py-1.5 text-sm transition-colors ${
                  currentKey === s.key
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-500 ring-1 ring-gray-200 hover:ring-gray-300'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </section>

        {/* AI Providers */}
        <section>
          <Label>{t('aiProviders')}</Label>
          <div className="mt-3 space-y-3">
            {AI_PROVIDERS.map((p) => (
              <ProviderCard
                key={p.id}
                provider={p}
                config={settings.aiProviders[p.id]}
                onChange={(patch) => updateProvider(p.id, patch)}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

// ─── Provider Card ──────────────────────────────────────────────────

function ProviderCard({
  provider,
  config,
  onChange,
}: {
  provider: (typeof AI_PROVIDERS)[number];
  config: AIProviderConfig | undefined;
  onChange: (patch: Partial<AIProviderConfig>) => void;
}) {
  const [open, setOpen] = useState(false);
  const defaults = defaultProviderConfig(provider.id);
  const hasKey = !!config?.apiKey;

  return (
    <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-gray-200">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full cursor-pointer items-center justify-between px-5 py-4"
      >
        <div className="flex items-center gap-2.5">
          <span className={`h-1.5 w-1.5 rounded-full ${hasKey ? 'bg-gray-400' : 'bg-gray-200'}`} />
          <span className="text-sm font-medium text-gray-900">{provider.name}</span>
          {hasKey && <span className="text-[11px] text-gray-400">{t('keySet')}</span>}
        </div>
        <svg
          className={`h-4 w-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="space-y-4 border-t border-gray-100 px-5 pt-4 pb-5">
          <Field label={t('apiKey')}>
            <input type="password" value={config?.apiKey ?? ''} onChange={(e) => onChange({ apiKey: e.target.value })} placeholder="sk-..." className="input" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('model')}>
              <input value={config?.model ?? defaults.model} onChange={(e) => onChange({ model: e.target.value })} className="input" />
            </Field>
            <Field label={t('baseUrl')} hint={t('baseUrlHint')}>
              <input value={config?.baseURL ?? ''} onChange={(e) => onChange({ baseURL: e.target.value || undefined })} placeholder={provider.defaultBaseURL} className="input" />
            </Field>
          </div>
          <Field label={t('systemPrompt')}>
            <textarea value={config?.systemPrompt ?? defaults.systemPrompt} onChange={(e) => onChange({ systemPrompt: e.target.value })} rows={2} className="input" />
          </Field>
          <Field label={t('prompt')} hint={t('promptVars')}>
            <textarea value={config?.prompt ?? defaults.prompt} onChange={(e) => onChange({ prompt: e.target.value })} rows={3} className="input" />
          </Field>
          <Field label={`${t('temperature')}: ${config?.temperature ?? defaults.temperature}`}>
            <input type="range" min="0" max="2" step="0.1" value={config?.temperature ?? defaults.temperature} onChange={(e) => onChange({ temperature: parseFloat(e.target.value) })} className="w-full accent-gray-900" />
            <div className="flex justify-between text-[10px] text-gray-300">
              <span>{t('precise')}</span>
              <span>{t('creative')}</span>
            </div>
          </Field>
          <div className="flex items-center justify-between pt-1">
            <a href={provider.website} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 underline decoration-gray-300 hover:text-gray-600">{t('getApiKey')}</a>
            <TestButton provider={provider.id} config={config ?? defaults} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Test Button ────────────────────────────────────────────────────

function TestButton({ provider, config }: { provider: AIProviderType; config: AIProviderConfig }) {
  const [status, setStatus] = useState<'idle' | 'testing'>('idle');

  const test = async () => {
    if (!config.apiKey) { window.alert(t('noApiKey')); return; }
    setStatus('testing');
    try {
      const res: TestResponse = await browser.runtime.sendMessage({
        type: 'test-provider', provider, config,
      } satisfies TestRequest);
      if (res.type === 'test-success') {
        window.alert(`${t('testPassed')}\n\n"Hello, world!" → ${res.result}`);
      } else {
        window.alert(`${t('testFailed')}\n${res.message}`);
      }
    } catch (err) {
      window.alert(`${t('testFailed')}\n${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setStatus('idle');
    }
  };

  return (
    <button onClick={test} disabled={status === 'testing'} className="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 ring-1 ring-gray-200 transition-colors hover:bg-gray-50 disabled:opacity-50">
      {status === 'testing' ? t('testing') : t('test')}
    </button>
  );
}

// ─── Primitives ─────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-xs font-medium tracking-wide text-gray-400 uppercase">{children}</div>;
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 flex items-baseline gap-1.5 text-xs text-gray-500">
        {label}
        {hint && <span className="text-gray-300">{hint}</span>}
      </label>
      {children}
    </div>
  );
}
