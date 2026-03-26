import { useState, useEffect, useRef, useCallback } from 'react';
import type { TranslateRequest, TranslateChunk } from '@/lib/shared';
import { sourceKey } from '@/lib/shared';
import {
  getSettings,
  getSourceName,
  type TranslationSource,
  type Settings,
} from '@/lib/storage';
import { t } from '@/lib/i18n';

interface TranslationPanelProps {
  text: string;
  x: number;
  y: number;
  onClose: () => void;
}

interface SourceResult {
  source: TranslationSource;
  key: string;
  name: string;
  text: string;
  status: 'loading' | 'done' | 'error';
  error?: string;
}

export function TranslationPanel({ text, x, y, onClose }: TranslationPanelProps) {
  const [sources, setSources] = useState<SourceResult[]>([]);
  const [copied, setCopied] = useState(false);
  const portRef = useRef<browser.Runtime.Port | null>(null);

  // Compute position once: prefer the side with more space
  const halfW = 210; // 420px / 2
  const pos = useRef<{ x: number; y: number; maxH: number; above: boolean } | null>(null);
  if (!pos.current) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let ax = x;
    if (ax + halfW > vw - 12) ax = vw - halfW - 12;
    if (ax - halfW < 12) ax = halfW + 12;

    const spaceBelow = vh - y - 12;
    const spaceAbove = y - 12;

    if (spaceAbove > spaceBelow) {
      // Show above selection
      pos.current = { x: ax, y: y - 16, maxH: Math.min(spaceAbove - 16, 480), above: true };
    } else {
      pos.current = { x: ax, y, maxH: Math.min(spaceBelow, 480), above: false };
    }
  }

  // Load settings + start translation
  useEffect(() => {
    let cancelled = false;

    getSettings().then((settings: Settings) => {
      if (cancelled) return;

      const sourceList: TranslationSource[] = [];
      const seen = new Set<string>();

      sourceList.push(settings.defaultSource);
      seen.add(sourceKey(settings.defaultSource));

      for (const id of settings.enabledDictionaries) {
        const src: TranslationSource = { type: 'dictionary', id };
        const k = sourceKey(src);
        if (!seen.has(k)) { sourceList.push(src); seen.add(k); }
      }

      for (const [provider, config] of Object.entries(settings.aiProviders)) {
        if (!config?.apiKey) continue;
        const src: TranslationSource = { type: 'ai', provider: provider as any };
        const k = sourceKey(src);
        if (!seen.has(k)) { sourceList.push(src); seen.add(k); }
      }

      setSources(sourceList.map((src) => ({
        source: src,
        key: sourceKey(src),
        name: getSourceName(src),
        text: '',
        status: 'loading' as const,
      })));

      const port = browser.runtime.connect({ name: 'translate' });
      portRef.current = port;

      port.onMessage.addListener((msg: TranslateChunk) => {
        if (cancelled) return;
        switch (msg.type) {
          case 'chunk':
            setSources((prev) =>
              prev.map((s) => s.key === msg.sourceKey ? { ...s, text: s.text + msg.text } : s));
            break;
          case 'source-done':
            setSources((prev) =>
              prev.map((s) => s.key === msg.sourceKey ? { ...s, status: 'done' } : s));
            break;
          case 'source-error':
            setSources((prev) =>
              prev.map((s) => s.key === msg.sourceKey ? { ...s, status: 'error', error: msg.message } : s));
            break;
        }
      });

      port.postMessage({ type: 'translate', text, sources: sourceList } satisfies TranslateRequest);
    });

    return () => {
      cancelled = true;
      portRef.current?.disconnect();
      portRef.current = null;
    };
  }, [text]);

  const handleCopy = useCallback((t: string) => {
    navigator.clipboard.writeText(t);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }, []);

  if (sources.length === 0) return null;

  const { x: px, y: py, maxH, above } = pos.current!;

  return (
    <div
      style={{
        position: 'fixed',
        left: `${px}px`,
        top: `${py}px`,
        transform: above ? 'translate(-50%, -100%)' : 'translateX(-50%)',
        zIndex: 2147483647,
        maxHeight: `${maxH}px`,
      }}
      className="flex w-[420px] min-h-[200px] flex-col overflow-hidden rounded-xl border border-gray-200/80 bg-white shadow-2xl"
    >
      {/* Source text */}
      <div className="shrink-0 border-b border-gray-100 px-4 pt-3 pb-2">
        <div className="max-h-16 overflow-y-auto text-xs leading-relaxed text-gray-400 break-words select-text">
          {text.length > 300 ? text.slice(0, 300) + '…' : text}
        </div>
      </div>

      {/* Results — scrollable */}
      <div className="min-h-0 flex-1 divide-y divide-gray-50 overflow-y-auto">
        {sources.map((src) => (
          <SourceResultRow
            key={src.key}
            source={src}
            copied={copied}
            onCopy={() => handleCopy(src.text)}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Source Result Row ───────────────────────────────────────────────

function SourceResultRow({
  source,
  copied,
  onCopy,
}: {
  source: SourceResult;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="px-4 py-2.5">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-gray-400">
          <StatusDot status={source.status} />
          {source.name}
        </span>
        {source.status === 'done' && source.text && (
          <button
            onClick={onCopy}
            className="cursor-pointer rounded px-2 py-0.5 text-[11px] text-gray-300 transition-colors hover:bg-gray-100 hover:text-gray-500"
          >
            {copied ? t('copied') : t('copy')}
          </button>
        )}
      </div>
      {source.status === 'error' ? (
        <div className="text-xs leading-relaxed text-red-400">{source.error || t('translationFailed')}</div>
      ) : source.text ? (
        <div className="text-sm leading-relaxed text-gray-800 break-words select-text">{source.text}</div>
      ) : (
        <div className="flex items-center gap-1.5 text-xs text-gray-300">
          <LoadingDots /> {t('translating')}
        </div>
      )}
    </div>
  );
}

function StatusDot({ status }: { status: SourceResult['status'] }) {
  const color = {
    loading: 'bg-blue-400 animate-pulse',
    done: 'bg-green-400',
    error: 'bg-red-400',
  }[status];
  return <span className={`inline-block h-1.5 w-1.5 rounded-full ${color}`} />;
}

function LoadingDots() {
  return (
    <span className="inline-flex gap-0.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1 w-1 animate-pulse rounded-full bg-gray-300"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </span>
  );
}
