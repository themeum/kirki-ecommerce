import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: __dirname,
  resolve: {
    alias: {
      '@': path.resolve(__dirname),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        // Additional global SCSS imports can be added here if needed
      },
    },
  },
  build: {
    outDir: path.resolve(__dirname, '../../assets'),
    emptyOutDir: false,
    cssCodeSplit: false,
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
      input: {
        site: path.resolve(__dirname, 'ts/index.ts'),
      },
      output: {
        entryFileNames: 'js/site.js',
        assetFileNames: (assetInfo) => {
          // assetInfo.names is the non-deprecated API (Rollup 3+)
          const names = assetInfo.names ?? [];
          const isCss = names.some((n) => n.endsWith('.css'));
          if (isCss) {
            return 'css/site.css';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
  },
});
