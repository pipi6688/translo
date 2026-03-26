import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Translo',
    description: 'Lightweight AI-powered translation for developers',
    permissions: ['storage'],
    action: {},
  },
  vite: () => ({
    plugins: [tailwindcss()],
  }),
});
