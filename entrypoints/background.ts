import { getSettings, type Settings } from '@/lib/storage';
import { translateStream, testTranslate } from '@/lib/translator';
import { DICTIONARIES } from '@/lib/dictionaries';
import type { TranslateRequest, TranslateChunk, TestRequest, TestResponse } from '@/lib/shared';
import { sourceKey } from '@/lib/shared';

// ─── Translation Logic ──────────────────────────────────────────────

async function handleTranslation(
  port: browser.Runtime.Port,
  msg: TranslateRequest,
  settings: Settings,
) {
  const sources = msg.sources;
  let pending = sources.length;

  const finish = () => {
    pending--;
    if (pending <= 0) {
      port.postMessage({ type: 'all-done' } satisfies TranslateChunk);
    }
  };

  for (const source of sources) {
    const key = sourceKey(source);

    if (source.type === 'dictionary') {
      const dict = DICTIONARIES[source.id];
      if (!dict) {
        port.postMessage({
          type: 'source-error',
          sourceKey: key,
          message: `Unknown dictionary: ${source.id}`,
        } satisfies TranslateChunk);
        finish();
        continue;
      }

      dict
        .translate(msg.text, 'en', settings.targetLanguage)
        .then((result) => {
          port.postMessage({ type: 'chunk', sourceKey: key, text: result } satisfies TranslateChunk);
          port.postMessage({ type: 'source-done', sourceKey: key } satisfies TranslateChunk);
        })
        .catch((err) => {
          port.postMessage({
            type: 'source-error',
            sourceKey: key,
            message: err instanceof Error ? err.message : String(err),
          } satisfies TranslateChunk);
        })
        .finally(finish);
    } else {
      const config = settings.aiProviders[source.provider];
      if (!config?.apiKey) {
        port.postMessage({
          type: 'source-error',
          sourceKey: key,
          message: `No API key for ${source.provider}`,
        } satisfies TranslateChunk);
        finish();
        continue;
      }

      (async () => {
        try {
          const stream = translateStream(msg.text, source.provider, config, settings.targetLanguage);
          for await (const chunk of stream) {
            port.postMessage({ type: 'chunk', sourceKey: key, text: chunk } satisfies TranslateChunk);
          }
          port.postMessage({ type: 'source-done', sourceKey: key } satisfies TranslateChunk);
        } catch (err) {
          port.postMessage({
            type: 'source-error',
            sourceKey: key,
            message: err instanceof Error ? err.message : String(err),
          } satisfies TranslateChunk);
        } finally {
          finish();
        }
      })();
    }
  }
}

// ─── Entry ──────────────────────────────────────────────────────────

export default defineBackground(() => {
  // Click extension icon → open settings page
  browser.action.onClicked.addListener(() => {
    browser.runtime.openOptionsPage();
  });

  // Port-based streaming for translation
  browser.runtime.onConnect.addListener((port) => {
    if (port.name !== 'translate') return;

    port.onMessage.addListener(async (msg: TranslateRequest) => {
      if (msg.type !== 'translate') return;
      const settings = await getSettings();
      handleTranslation(port, msg, settings);
    });
  });

  // One-shot message for testing provider
  browser.runtime.onMessage.addListener((msg: TestRequest, _sender, sendResponse) => {
    if (msg.type !== 'test-provider') return false;

    getSettings().then(s => testTranslate(msg.provider, msg.config, s.targetLanguage))
      .then((result) => {
        sendResponse({ type: 'test-success', result } satisfies TestResponse);
      })
      .catch((err) => {
        // AI SDK errors often have nested cause or responseBody
        let message = 'Unknown error';
        if (err instanceof Error) {
          message = err.message || '';
          if ('cause' in err && err.cause) {
            message += ` — ${err.cause instanceof Error ? err.cause.message : String(err.cause)}`;
          }
          if ('responseBody' in err) {
            message += ` ${String((err as Record<string, unknown>).responseBody)}`;
          }
        } else {
          message = String(err);
        }
        sendResponse({
          type: 'test-error',
          message: message || JSON.stringify(err),
        } satisfies TestResponse);
      });

    return true; // keep message channel open for async response
  });
});
