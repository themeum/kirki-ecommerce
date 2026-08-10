import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

import babelPluginScopedAutoLabel from './scripts/babel-plugin-scoped-auto-label.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const EAGER_CORE_PACKAGES = new Set([
  'react',
  'react-dom',
  'scheduler',
  'react-router',
  'axios',
  'sonner',
]);

const EAGER_CORE_SCOPES = ['@emotion/', '@tanstack/'];

const resolvePackageName = (id) => {
  const marker = 'node_modules/';
  const markerIndex = id.lastIndexOf(marker);

  if (markerIndex === -1) {
    return null;
  }

  const segments = id.slice(markerIndex + marker.length).split('/');

  if (segments[0].startsWith('@')) {
    return `${segments[0]}/${segments[1]}`;
  }

  return segments[0];
};

const isEagerCorePackage = (packageName) => {
  if (EAGER_CORE_PACKAGES.has(packageName)) {
    return true;
  }

  return EAGER_CORE_SCOPES.some((scope) => packageName.startsWith(scope));
};

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
    strictPort: false,
    cors: true,
    origin: 'http://localhost:20100',
    fs: {
      allow: [path.resolve(__dirname, '..')],
    },
  },
  experimental: {
    renderBuiltUrl() {
      return { relative: true };
    },
  },
  build: {
    outDir: path.resolve(__dirname, '../../assets'),
    emptyOutDir: false,
    rollupOptions: {
      input: path.resolve(__dirname, 'main.tsx'),
      output: {
        entryFileNames: 'js/kirki-ecommerce.bundle.js',
        chunkFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'kirki-ecommerce.vendor') {
            return 'js/kirki-ecommerce.vendor.js';
          }

          if (chunkInfo.isDynamicEntry) {
            return 'js/pages/[name]-[hash].chunk.js';
          }

          return 'js/chunks/[name]-[hash].chunk.js';
        },
        assetFileNames: 'assets/[name]-[hash][extname]',
        manualChunks(id) {
          const packageName = resolvePackageName(id);

          if (packageName && isEagerCorePackage(packageName)) {
            return 'kirki-ecommerce.vendor';
          }
        },
      },
    },
  },
});
