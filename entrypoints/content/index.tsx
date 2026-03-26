import './style.css';
import ReactDOM from 'react-dom/client';
import { TranslationPanel } from '@/components/TranslationPanel';
import { shouldTranslate } from '@/lib/filter';

const PANEL_HOST_TAG = 'claw-translate-panel';

export default defineContentScript({
  matches: ['<all_urls>'],
  cssInjectionMode: 'ui',

  async main(ctx) {
    let currentUI: Awaited<ReturnType<typeof createShadowRootUi>> | null = null;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    function getSelectionPosition(): { x: number; y: number } | null {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return null;
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return null;
      return {
        x: rect.left + rect.width / 2,
        y: rect.bottom + 8,
      };
    }

    /** Check if an event target is inside our shadow DOM panel. */
    function isInsidePanel(target: EventTarget | null): boolean {
      if (!target || !(target instanceof Node)) return false;

      // Walk up from target — if we hit our shadow host element, it's inside the panel
      let node: Node | null = target;
      while (node) {
        if (node instanceof ShadowRoot) {
          // Check if the shadow host is our panel
          if ((node.host as HTMLElement)?.tagName?.toLowerCase() === PANEL_HOST_TAG) {
            return true;
          }
        }
        // getRootNode() returns the shadow root if inside one, or the document
        const root = node.getRootNode();
        if (root instanceof ShadowRoot) {
          if ((root.host as HTMLElement)?.tagName?.toLowerCase() === PANEL_HOST_TAG) {
            return true;
          }
          node = root.host;
        } else {
          break;
        }
      }
      return false;
    }

    function closePanel() {
      currentUI?.remove();
      currentUI = null;
    }

    async function showTranslation(text: string, x: number, y: number) {
      closePanel();

      const ui = await createShadowRootUi(ctx, {
        name: PANEL_HOST_TAG,
        position: 'overlay',
        alignment: 'top-left',
        onMount: (container) => {
          container.addEventListener('mousedown', (e) => e.stopPropagation());

          const wrapper = document.createElement('div');
          container.append(wrapper);

          const root = ReactDOM.createRoot(wrapper);
          root.render(
            <TranslationPanel text={text} x={x} y={y} onClose={closePanel} />,
          );
          return root;
        },
        onRemove: (root) => {
          root?.unmount();
        },
      });

      ui.mount();
      currentUI = ui;
    }

    // Listen for text selection — 150ms debounce
    document.addEventListener('mouseup', (e) => {
      if (isInsidePanel(e.target)) return;

      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const selection = window.getSelection();
        const text = selection?.toString().trim() ?? '';

        if (!text || !shouldTranslate(text)) return;

        const pos = getSelectionPosition();
        if (!pos) return;

        showTranslation(text, pos.x, pos.y);
      }, 150);
    });

    // Close panel when clicking outside
    document.addEventListener('mousedown', (e) => {
      if (!currentUI) return;
      if (isInsidePanel(e.target)) return;
      closePanel();
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && currentUI) closePanel();
    });
  },
});
