import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import vitest from '@vitest/eslint-plugin';
import importPlugin from 'eslint-plugin-import';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// The features/ restructure (see openspec/changes/restructure-app-features)
// was migrated feature by feature with this at `warn`, so violations were a
// visible, shrinking count rather than an all-or-nothing gate. Every feature
// has now moved (0 warnings as of group 7) — promoted to `error`.
const FEATURE_BOUNDARY_SEVERITY = 'error';

const FEATURES = [
  'brands',
  'tags',
  'categories',
  'collections',
  'customers',
  'coupons',
  'inventory',
  'bulk-edit',
  'orders',
  'products',
  'settings',
  'system',
];

const SHARED_ROOT_DIRS = [
  'components',
  'hooks',
  'utils',
  'libs',
  'theme',
  'types',
  'schemas',
  'services',
  'contexts',
  'config',
];

const featureBoundaryConfigs = FEATURES.map((feature) => ({
  name: `kirki/feature-boundary-${feature}`,
  files: ['**/*.{ts,tsx}'],
  ignores: [`features/${feature}/**`],
  rules: {
    'no-restricted-imports': [
      FEATURE_BOUNDARY_SEVERITY,
      {
        patterns: [
          {
            group: [`@/features/${feature}/*`, `@/features/${feature}/**`],
            message: `Import from '@/features/${feature}' (its public API) instead of reaching into its internals.`,
          },
        ],
      },
    ],
  },
}));

const sharedNoFeatureImportConfig = {
  name: 'kirki/shared-no-feature-import',
  files: SHARED_ROOT_DIRS.map((dir) => `${dir}/**/*.{ts,tsx}`),
  rules: {
    'no-restricted-imports': [
      FEATURE_BOUNDARY_SEVERITY,
      {
        patterns: [
          {
            group: ['@/features/*', '@/features/**'],
            message: 'Shared code may not depend on a feature. Move this file into the feature that owns the data it needs.',
          },
        ],
      },
    ],
  },
};

const importNoCycleConfig = {
  name: 'kirki/import-no-cycle',
  files: ['**/*.{ts,tsx}'],
  plugins: { import: importPlugin },
  settings: {
    'import/resolver': {
      typescript: { project: './tsconfig.json' },
    },
  },
  rules: {
    // Not gated by FEATURE_BOUNDARY_SEVERITY — a cycle is always a real
    // defect (undefined at module init), never a migration-in-progress
    // warning.
    'import/no-cycle': 'error',
  },
};

export default tseslint.config(
  {
    ignores: [
      '.vite/**',
      'node_modules/**',
      '../../assets/**',
      'scripts/*.mjs',
    ],
  },

  {
    name: 'kirki/javascript',
    files: ['**/*.{js,mjs,cjs}'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: globals.node,
    },
  },

  {
    name: 'kirki/typescript-react',
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommendedTypeChecked,
      tseslint.configs.stylisticTypeChecked,
      react.configs.flat.recommended,
      react.configs.flat['jsx-runtime'],
      reactHooks.configs.flat.recommended,
      jsxA11y.flatConfigs.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: {
      react: { version: 'detect' },
    },
    plugins: {
      '@stylistic': stylistic,
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            ['^node:', '^@?\\w'],
            ['^@/', '^@data/'],
            ['^\\.'],
            ['^\\u0000'],
          ],
        },
      ],
      'simple-import-sort/exports': 'error',

      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
      ],
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/no-empty-object-type': [
        'error',
        { allowObjectTypes: 'always' },
      ],
      '@typescript-eslint/prefer-nullish-coalescing': [
        'error',
        { ignorePrimitives: { string: true, boolean: true } },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'after-used',
          ignoreRestSiblings: true,
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/prefer-promise-reject-errors': [
        'error',
        { allowThrowingUnknown: true },
      ],
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { attributes: false, properties: false } },
      ],
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        { allowNumber: true },
      ],

      'react/prop-types': 'off',
      'react/no-unknown-property': ['error', { ignore: ['css'] }],
      'react/jsx-curly-brace-presence': ['error', 'never'],
      'react/self-closing-comp': 'error',

      'jsx-a11y/no-static-element-interactions': 'warn',
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/no-noninteractive-element-interactions': 'warn',

      'react-refresh/only-export-components': [
        'error',
        { allowConstantExport: true },
      ],

      // eslint-plugin-react-hooks v7 turns on a second family of rules powered
      // by the React Compiler. They report where the compiler would bail out of
      // auto-memoizing. This build does not run the compiler (see vite.config.js
      // — only @emotion/babel-plugin and the scoped-auto-label plugin), so they
      // describe an optimization that never happens. Turn them back on when the
      // compiler is adopted; the classic rules-of-hooks and exhaustive-deps
      // rules stay on as errors below.
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/incompatible-library': 'off',
      'react-hooks/exhaustive-deps': 'error',

      curly: ['error', 'all'],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'object-shorthand': ['error', 'properties'],
      'prefer-const': ['error', { destructuring: 'all' }],

      '@stylistic/quotes': [
        'error',
        'single',
        { avoidEscape: true, allowTemplateLiterals: 'always' },
      ],
      '@stylistic/jsx-quotes': ['error', 'prefer-double'],
      '@stylistic/comma-spacing': ['error', { before: false, after: true }],
      '@stylistic/comma-dangle': ['error', 'always-multiline'],
    },
  },

  {
    // A route manifest is a data module, not a component module — the lazy()
    // route entries it declares are never the thing Fast Refresh reloads.
    name: 'kirki/route-manifest',
    files: ['**/routes.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },

  {
    // Context modules deliberately export their consumer hook next to the
    // provider; splitting them across files to satisfy Fast Refresh would make
    // the API worse than the HMR cost it saves.
    name: 'kirki/context-modules',
    files: [
      'contexts/**/*.tsx',
      '**/*-context.tsx',
      'components/ui/stacked-items.tsx',
    ],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },

  {
    // A list table's columns.tsx module-scope ColumnDef[] is deliberately
    // paired with the small cell components that need hooks (e.g. a cell
    // that navigates or fires a mutation) — see list-table-composition spec.
    // Splitting those components into their own files would separate a
    // column from the one thing its cell renders.
    name: 'kirki/data-table-columns',
    files: ['**/columns.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },

  {
    name: 'kirki/declaration-files',
    files: ['**/*.d.ts'],
    rules: {
      '@typescript-eslint/consistent-type-definitions': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },

  {
    name: 'kirki/tests',
    files: ['**/*.test.{ts,tsx}'],
    extends: [vitest.configs.recommended],
    languageOptions: {
      globals: vitest.environments.env.globals,
    },
  },

  {
    name: 'kirki/config-files',
    files: ['*.config.{js,ts}', 'vitest.setup.ts'],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },

  importNoCycleConfig,
  ...featureBoundaryConfigs,
  sharedNoFeatureImportConfig,

  {
    // `lazy(() => import(...))` needs a concrete file target for its own
    // code-split chunk, which is a structurally different dependency than a
    // feature's internals being reused elsewhere — route composition is
    // exempt from the deep-import boundary rules for that reason. Must come
    // after the boundary configs above: flat config resolves per-rule by
    // last-matching block, and this is the one place that reopens a rule
    // those configs close.
    name: 'kirki/route-manifest-lazy-imports',
    files: ['**/routes.tsx'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
);
