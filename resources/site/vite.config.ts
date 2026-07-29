import path from 'path';
import { fileURLToPath } from 'url';
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
    watch: {
      include: ['ts/**', 'scss/**'],
    },
    rollupOptions: {
      input: {
        site: path.resolve(__dirname, 'ts/index.ts'),
      },
      output: {
        entryFileNames: 'js/kirki-ecommerce-site.bundle.js',
        assetFileNames: (assetInfo) => {
          // assetInfo.names is the non-deprecated API (Rollup 3+)
          const names = assetInfo.names ?? [];
          const isCss = names.some((n) => n.endsWith('.css'));
          if (isCss) {
            return 'css/kirki-ecommerce-site.bundle.css';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
  },
});
