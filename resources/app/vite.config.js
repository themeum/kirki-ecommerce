import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

import babelPluginScopedAutoLabel from './scripts/babel-plugin-scoped-auto-label.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react({
      jsxImportSource: '@emotion/react',
      babel: {
        plugins: [
          [
            '@emotion/babel-plugin',
            {
              autoLabel: 'dev-only',
              labelFormat: ({ name }) => (name === 'scoped' ? '' : name),
            },
          ],
          babelPluginScopedAutoLabel,
        ],
      },
    }),
  ],
  root: __dirname,
  resolve: {
    alias: {
      '@': path.resolve(__dirname),
      '@data': path.resolve(__dirname, '../data'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    cors: true,
    origin: 'http://localhost:20100',
    fs: {
      allow: [path.resolve(__dirname, '..')],
    },
  },
  build: {
    outDir: path.resolve(__dirname, '../../assets'),
    emptyOutDir: false,
    cssCodeSplit: false,
    rollupOptions: {
      input: path.resolve(__dirname, 'main.tsx'),
      output: {
        entryFileNames: 'js/kirki-ecommerce.bundle.js',
        chunkFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'kirki-ecommerce.vendor') {
            return 'js/kirki-ecommerce.vendor.js';
          }
          return 'js/pages/[name]-[hash].chunk.js';
        },
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'css/kirki-ecommerce.bundle.css';
          }
          return 'assets/[name]-[hash][extname]';
        },
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'kirki-ecommerce.vendor';
          }
        },
      },
    },
  },
});
