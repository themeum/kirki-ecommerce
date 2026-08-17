import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vitest/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react({ jsxImportSource: '@emotion/react' })],
  resolve: {
    alias: {
      '@': path.resolve(__dirname),
      '@data': path.resolve(__dirname, '../data'),
    },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'node',
          setupFiles: ['./vitest.setup.ts', './tests/msw/setup.ts'],
          include: ['**/*.test.ts'],
          exclude: ['node_modules'],
        },
      },
      {
        extends: true,
        test: {
          name: 'dom',
          environment: 'jsdom',
          setupFiles: ['./vitest.setup.dom.ts', './tests/msw/setup.ts'],
          include: ['**/*.test.tsx'],
          exclude: ['node_modules'],
        },
      },
    ],
  },
});
