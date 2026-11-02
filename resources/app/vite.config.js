import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

import babelPluginScopedAutoLabel from './scripts/babel-plugin-scoped-auto-label.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// bin/dev-up saves this worktree's Docker ports in the root .env.
const readRootEnv = (key) => {
  try {
    const text = fs.readFileSync(path.resolve(__dirname, '../../.env'), 'utf8');

    return text.match(new RegExp(`^${key}=(.+)$`, 'm'))?.[1].trim();
  } catch {
    return undefined;
  }
};

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
    port: Number(readRootEnv('VITE_PORT') ?? 5173),
    // Another port would not match the one the plugin loads scripts from.
    strictPort: true,
    cors: true,
    origin: `http://localhost:${readRootEnv('NGINX_HTTP_PORT') ?? 20100}`,
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
    // Not the default .vite/manifest.json: wordpress.org does not allow hidden
    // files or directories in the plugin package.
    manifest: 'manifest.json',
    // Keep the i18n calls readable for `wp i18n make-pot`, which
    // translate.wordpress.org runs over the shipped files: never rename the
    // i18n functions, never merge `c ? __('A') : __('B')` into `__(c ? 'A' : 'B')`,
    // and keep the translator comments. See docs/translations.md.
    minify: 'terser',
    terserOptions: {
      compress: { conditionals: false },
      mangle: { reserved: ['__', '_x', '_n', '_nx'] },
      format: { comments: /translators:/i },
    },
    rollupOptions: {
      input: path.resolve(__dirname, 'main.tsx'),
      output: {
        entryFileNames: 'js/kirki-ecommerce.bundle-[hash].js',
        chunkFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'kirki-ecommerce.vendor') {
            return 'js/kirki-ecommerce.vendor-[hash].js';
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
