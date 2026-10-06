# Translations

How the plugin's strings get to translators and back to the screen. PHP strings
work the standard WordPress way. JS strings in the admin app (`resources/app`) and
the storefront script (`resources/site`) need more care: the build must keep their
`__()` calls readable, and the admin app must load the translations for code that
WordPress never enqueues.

- [1. Quick start](#1-quick-start)
- [2. Where the strings come from](#2-where-the-strings-come-from)
- [3. How JS translations load](#3-how-js-translations-load)
- [4. Writing translatable JS](#4-writing-translatable-js)
- [5. Checking the build after a tooling upgrade](#5-checking-the-build-after-a-tooling-upgrade)
- [6. Limits you should know about](#6-limits-you-should-know-about)

---

## 1. Quick start

Generate the translation template after a frontend build:

```bash
npm run make:pot
```

This writes `languages/kirki-ecommerce.pot`. The file is gitignored, so there is
nothing to commit. The command stops with an error when `assets/.vite/manifest.json`
or `assets/js/site.js` is missing. In that case, build the frontend first
(`npm run build` in `resources/app` and in `resources/site`).

Neither package command makes a template for now. `npm run make:org-package` also
removes any `languages/kirki-ecommerce.pot` from the zip, so an outdated local
template never ships.

The template is for translators who work outside translate.wordpress.org
(Poedit, Loco Translate). translate.wordpress.org does not need it: it runs its
own `make-pot` over the code in SVN. Both get the same strings, because both scan
the same shipped files.

## 2. Where the strings come from

`bin/make-pot.sh` runs `wp i18n make-pot` over the repository with the
`kirki-ecommerce` text domain. It scans:

- **PHP**: `app/`, `resources/views/`, `resources/data/` and the other PHP that
  ships.
- **JS**: the built bundles in `assets/js`, not the TypeScript source. `make-pot`
  cannot read `.ts` or `.tsx`, and translate.wordpress.org only sees the bundles.

It skips `payments/`, because the wordpress.org package does not ship the gateway
add-ons, and it skips the TypeScript source in `resources/app` and `resources/site`.

A JS reference in the template names the shipped file, for example
`assets/js/site.js:1` or `assets/js/pages/orders-Bx1c9.chunk.js:3`. Line numbers
are lines in the minified file. The file path matters: `wp i18n make-json` names
each JSON file with the md5 of that path, and WordPress looks up the JSON for a
script by the same md5.

Code that no entry imports, and exports that nothing uses, are not in the bundles,
so their strings are not in the template either. This is correct: those strings
never show on screen.

### What keeps the bundles readable

Both Vite configs minify with terser and set three options:

| Option                                        | Without it                                                   |
| --------------------------------------------- | ------------------------------------------------------------ |
| `mangle.reserved: ['__', '_x', '_n', '_nx']`  | `__("Orders", …)` ships as `e("Orders", …)`. Not extracted.  |
| `compress.conditionals: false`                | `c ? __('A', d) : __('B', d)` ships as `__(c ? 'A' : 'B', d)`. Neither string is extracted. |
| `format.comments: /translators:/i`            | All `translators:` comments are removed.                     |

## 3. How JS translations load

### Storefront

`EnqueueSiteScripts` enqueues `assets/js/site.js` with a `wp-i18n` dependency and
calls `wp_set_script_translations()`. WordPress finds the JSON file for `site.js`
and gives it to `wp.i18n` before the script runs.

### Admin app

The admin app is an entry bundle, a vendor chunk and about 130 chunks that load
through `import()`. WordPress enqueues only the entry bundle and the vendor chunk,
so `wp_set_script_translations()` on the entry alone would miss most strings.

`EnqueueAdminScripts::enqueue_production_scripts()` does this instead:

1. It adds `wp-i18n` to the entry bundle's dependencies.
2. For every `.js` file in the Vite manifest, it registers a temporary handle and
   calls core's `load_script_textdomain()`. Core finds the JSON file in the
   language packs directory or in the plugin's `languages/` directory. The handle
   is removed right after the lookup and is never printed.
3. It prints each JSON file found as an inline script before the entry bundle,
   with the same snippet core uses. `wp.i18n.setLocaleData()` merges them into one
   dictionary for the `kirki-ecommerce` domain.

The `@/wpi18n` wrapper reads `window.wp.i18n` when the bundle starts. At that time
all chunk translations are already loaded, so a lazy page shows translated strings
without another request.

## 4. Writing translatable JS

`make-pot` reads the bundles, not your source. It finds a call only when the
bundle keeps a recognized function name and literal arguments. Follow these rules:

- **Import the functions by their own names.** Use
  `import { __, _n } from '@/wpi18n'` in the admin app, and
  `const { __ } = window.wp.i18n` in the storefront. Do not rename them
  (`import { __ as t }`) and do not call them through another variable. The
  minifier keeps only the four reserved names.
- **Use literal strings and the literal domain.** `__(label, 'kirki-ecommerce')`
  and `__('Hello', DOMAIN)` cannot be extracted.
- **Put the `translators:` comment directly before the call**, inside the
  `sprintf()` arguments when there is one:

  ```tsx
  {sprintf(
    /* translators: %s: number of items */
    __('Items (%s)', 'kirki-ecommerce'),
    count,
  )}
  ```

  A comment above a `return`, above a ternary, or in its own `{/* */}` JSX block
  does not attach. The minifier can also remove a comment that is not next to the
  call.
- **Give each branch of a condition its own call and comment.**

  ```ts
  isActive
    ? /* translators: %s: currency code */
      __('Deactivate %s?', 'kirki-ecommerce')
    : /* translators: %s: currency code */
      __('Activate %s?', 'kirki-ecommerce');
  ```

## 5. Checking the build after a tooling upgrade

A new terser or Vite version can add a transform that breaks extraction. After an
upgrade, build the frontend and run these two checks from the repository root. Both
must print nothing.

Calls that the minifier renamed:

```bash
grep -rhoE '[A-Za-z0-9_$.]+\([^()]{0,300},"kirki-ecommerce"\)' assets/js | grep -vE '^(.*\.)?(__|_x|_n|_nx)\('
```

Calls whose first argument is not a literal string (for example, merged
conditionals):

```bash
grep -rhoE "(^|[^A-Za-z0-9_\$])(__|_x|_n|_nx)\([^\"'][^()]{0,300},\"kirki-ecommerce\"\)" assets/js
```

Then run `npm run make:pot` and compare the number of strings with the last
release's template. A large drop means something still breaks extraction.

## 6. Limits you should know about

- **No translations in dev mode.** The Vite dev server serves the TypeScript
  source. No JSON file matches those URLs, so `npm run dev` always shows English.
- **Settings search is English only.** The search index is built from the English
  source copy. With a translated admin, the screen shows translated text, but
  search still matches the English words. See
  [Settings Search § 12](settings-search.md#12-limits-you-should-know-about).
- **Language packs follow the build.** Chunk file names have a content hash, so
  the JSON file names change in every release. translate.wordpress.org rebuilds
  the language packs for each release. Translations follow the string, not the
  file, so no translation is lost. Until the new packs are built, strings in
  changed chunks can show in English.
- **About 55 placeholder strings have no `translators:` comment.** `make-pot`
  lists them as warnings. Add the comments when you work on those files.
