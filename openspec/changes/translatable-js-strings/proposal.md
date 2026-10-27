## Why

The admin React app and the storefront script call `__()` in about 400 source
files, but none of those strings can be translated today. The production build
minifies the i18n function names (`__("Country is required", …)` ships as
`e("Country is required", …)`), so the `make-pot` run that translate.wordpress.org
does on the shipped code finds only one JS string. The admin app also never loads
translations at runtime. The plugin is going to the wordpress.org directory, so
its language packs must cover the whole interface, not only PHP.

## What Changes

- The production builds of `resources/app` and `resources/site` keep the i18n
  function names (`__`, `_x`, `_n`, `_nx`) and the `translators:` comments in the
  minified output, so `wp i18n make-pot` can extract every JS string from
  `assets/js`.
- The admin app loads its JS translations at runtime: the entry bundle depends on
  `wp-i18n`, and the translations for the entry bundle and every chunk listed in
  the Vite manifest (including lazy-loaded pages) are given to `wp.i18n` before
  the app starts.
- `npm run make:pot` scans the built `assets/js` files instead of the TypeScript
  source. JS references in the POT then point at the shipped script files (for
  example `assets/js/site.js`), which is what `wp i18n make-json` needs.
  This also fixes the regression where the storefront strings were referenced as
  `resources/site/ts/...` and could not produce a JSON translation file.
- `bin/transpile-for-pot.mjs` is removed. It is no longer needed.
- The three `translators:` comments that do not sit directly before their
  translation call are moved so that extraction attaches them.

## Capabilities

### New Capabilities

- `js-translations`: JS strings in the admin app and the storefront script are
  extractable from the shipped bundles and are translated at runtime.

### Modified Capabilities

- `plugin-packaging`: the wordpress.org package (`npm run make:org-package`) does
  not generate or ship a translation template for now.

## Impact

- **Build config**: `resources/app/vite.config.js`, `resources/site/vite.config.ts`
  (minifier options). New dev dependency `terser` in both `package.json` files.
- **PHP**: `app/Wordpress/Hooks/Actions/EnqueueAdminScripts.php` (`wp-i18n`
  dependency and translation loading for the entry and its chunks).
- **Scripts**: `bin/make-pot.sh` (scan `assets/js`), `bin/transpile-for-pot.mjs`
  (deleted), `bin/make-package.sh` (the org build no longer runs `make:pot`).
  `npm run make:pot` now needs a frontend build first.
- **Source**: three TSX/TS files get a moved `translators:` comment.
- **Bundle size**: terser output can be slightly larger or smaller than esbuild
  output; the build also gets slower.
- **Not in scope**: the ~55 placeholder strings in TS source that have no
  `translators:` comment at all.
