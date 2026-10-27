## Context

See proposal.md for motivation. Current state:

- **Admin app** (`resources/app`): Vite 6, default esbuild minifier. Source code
  imports `__`, `_x`, `_n`, `_nx` from `@/wpi18n`, a wrapper that reads
  `window.wp.i18n` at import time and falls back to identity functions. The build
  writes an entry bundle, a vendor chunk and about 130 hashed chunks
  (`assets/js/pages/*.chunk.js` for lazy pages, `assets/js/chunks/*.chunk.js`
  for shared code). `EnqueueAdminScripts::enqueue_production_scripts()` enqueues
  only the vendor chunk and the entry bundle as ES modules. The other chunks load
  through `import()`, and WordPress never sees them. The bundle does not depend on
  `wp-i18n` and never calls `wp_set_script_translations()`.
- **Storefront** (`resources/site`): one output file, `assets/js/site.js`.
  Modules destructure `const { __ } = window.wp.i18n`. PHP already enqueues it
  with a `wp-i18n` dependency and `wp_set_script_translations()`.
- **Minified output today**: esbuild renames the i18n bindings
  (`e("Country is required","kirki-ecommerce")`). Only a call written as
  `window.wp.i18n.__(...)` survives, which is why the current extraction from
  `assets/js` finds a single string ("Region").
- **How translations reach users**: translate.wordpress.org makes its own POT by
  running `make-pot` over the plugin code in SVN; it does not use a shipped `.pot`.
  It then builds one JSON file per referenced JS file, named
  `kirki-ecommerce-{locale}-{md5(path)}.json`. `wp i18n make-json` (and core's
  `load_script_textdomain()`) only handles references that end in `.js`, and the
  path must be the path of the shipped file.
- **Uncommitted predecessor work**: `npm run make:org-package` and
  `npm run make:pot` exist. `make:pot` currently transpiles the TS source with
  `bin/transpile-for-pot.mjs` and references `.ts`/`.tsx` files, so it produces
  no usable JS JSON files.

### Pre-design experiment

Both apps were built into a scratch directory with terser, and `make-pot` was run
on the output. The results were compared with the source extraction (1,522 JS
msgids):

| Build                                                        | Extracted | Missing | `translators:` kept |
| ------------------------------------------------------------ | --------- | ------- | ------------------- |
| terser, `mangle.reserved` for the i18n names, translator comments kept | 1,452 | 70 | 18 / 18 |
| same, plus `compress.conditionals: false`                    | 1,498     | 24      | 18 / 18             |

- The first 46 missing strings came from terser merging
  `c ? __('A', d) : __('B', d)` into `__(c ? 'A' : 'B', d)`, which `make-pot`
  cannot read. `conditionals: false` stops this.
- The last 24 are in modules that no entry imports (for example
  `settings/products/pages/review.tsx`, `shipping-career.tsx`,
  `seller-tax-id.tsx`). They do not ship, so they are correctly absent.
- No string was extracted that is absent from the source.
- Admin JS size: 2,528 KB with terser compared with 2,648 KB with esbuild.

## Goals / Non-Goals

**Goals:**

- The shipped `assets/js` files are the single source of truth for JS strings,
  for both translate.wordpress.org and our own `make:pot`.
- Translations for every admin chunk, including lazy pages, are in `wp.i18n`
  before the app starts.

**Non-Goals:**

- Translations in Vite dev mode. The dev server serves TS source, so no JSON file
  can match it.
- Translating the settings search index. The doc is updated to say that the gap
  is now live (see Risks).
- Adding the ~55 missing `translators:` comments in TS source.
- An automated CI check that compares built and source extraction.

## Decisions

### D1. Minify with terser, keep the i18n names and translator comments

Both Vite configs set `build.minify: 'terser'` with:

- `mangle.reserved: ['__', '_x', '_n', '_nx']`: local bindings with these names
  are never renamed. Rollup keeps the local name of a cross-chunk import
  (`import { a as __ }`), so the call sites stay `__(...)`.
- `compress.conditionals: false`: stops the merge of two translated branches into
  one call.
- `format.comments: /translators:/i`: keeps translator comments next to their
  calls. This is the same setting that `@wordpress/scripts` uses.

`terser` is added as a dev dependency of both packages. Vite requires it for
`minify: 'terser'`.

Alternatives considered:

- **Rewrite calls to `wp.i18n.__(...)` with a build transform.** Property access
  is never renamed, but the conditional merge still happens. It also adds a
  custom Babel/Vite plugin for each app. Rejected: more code, same remaining
  problem.
- **esbuild with `minifyIdentifiers: false`.** It turns off all renaming, so
  output is much larger, and esbuild's syntax minifier also merges conditional
  calls. Rejected.
- **No minification.** This is the simplest, but the bundle is much larger for
  every merchant. Rejected.

### D2. Load admin translations for the entry and every chunk

`enqueue_production_scripts()`:

1. Adds `wp-i18n` to the entry bundle's dependencies.
2. Walks every manifest record that has a `.js` `file` (the entry, the vendor
   chunk, shared chunks and lazy pages). For each one it registers a script
   handle (registered only, never enqueued) with that file's URL, and calls
   `load_script_textdomain( $handle, 'kirki-ecommerce', <plugin>/languages )`.
3. For each JSON string returned, it adds an inline `before` script to the
   entry bundle that passes the locale data to
   `wp.i18n.setLocaleData( data, 'kirki-ecommerce' )`. This is the same snippet
   that core prints for `wp_set_script_translations()`. `setLocaleData` merges,
   so the result is one combined dictionary.

Inline `before` scripts are classic scripts. They run before the deferred module
bundle and before `@/wpi18n` reads `window.wp.i18n`, so the wrapper sees
translated data from the first render. Lazy pages need no runtime work: their
strings are already in the shared dictionary.

Alternatives considered:

- **One combined JSON through `make-json --use-map`.** Rejected: language packs
  from translate.wordpress.org are always one JSON file per referenced file, so a
  combined file would only work for our own builds.
- **Find the JSON files by hand (md5 of the path).** Rejected: it copies core
  logic and skips core's `load_script_translation_file` and
  `pre_load_script_translations` filters.
- **Enqueue the chunks with `wp_set_script_translations()`.** Rejected: printing
  chunk tags would run the module code a second time. The existing comment in
  `enqueue_production_scripts()` describes this problem for the vendor chunk.

### D3. `make:pot` scans the shipped bundles

`bin/make-pot.sh` runs one `make-pot` pass over the repo root. `assets/js` is no
longer excluded. `resources/app` and `resources/site` stay excluded, because
they are TS source that `make-pot` cannot read and that does not ship. The
script exits with a clear error when `assets/.vite/manifest.json` or
`assets/js/site.js` is missing ("run a frontend build first").
`bin/transpile-for-pot.mjs` is deleted.

This changes the earlier choice to transpile the TS source. Alternative: keep the
transpile step and map each source file to its chunk through the Vite manifest.
Rejected because it is more code, and its output could differ from what
translate.wordpress.org extracts.

### D4. Storefront needs no PHP change

The terser change in D1 makes `site.js` extractable. With D3 its references are
`assets/js/site.js`, which matches the existing `wp_set_script_translations()`
call. This fixes the regression from the uncommitted `make:pot` work.

### D5. Fix misplaced translator comments

These three comments do not sit directly before their call, so no extractor
attaches them. Each one moves to directly before the call:

- `features/settings/multi-currency/pages/available-currency-list.tsx` (comment
  above a ternary)
- `features/orders/pages/order-details.tsx` and
  `features/orders/components/order-create/payment-summary-card.tsx` (comment in
  its own `{/* */}` JSX block)

## Risks / Trade-offs

- [A later terser release adds another transform that merges or rewrites i18n
  calls] → `docs/translations.md` gives the manual check from the experiment
  (compare `make-pot` over `assets/js` with the source). Run it after a terser or
  Vite upgrade.
- [Code that aliases the import (`import { __ as t }`) or calls through a
  variable cannot be extracted] → `docs/translations.md` states the rules for
  developers.
- [Builds get slower: terser is slower than esbuild] → This applies only to
  production builds. Measure the time during apply and record it.
- [About 130 `load_script_textdomain()` calls on each plugin admin page] → Each
  call is a few `file_exists` checks, and they run only on the plugin's own
  admin pages. Chunks that have no JSON file add nothing to the page.
- [Hashed chunk names change on every release, so JSON file names change too] →
  translate.wordpress.org rebuilds language packs for each release from the new
  code. Translations follow the msgid, not the file, so no translation is lost.
- [Settings search matches English text while the admin UI is translated] →
  Accepted. `docs/settings-search.md` is updated to say this is now live, and a
  follow-up change handles translated search. No locale is affected until
  language packs exist.

## Migration Plan

No data migration. Deploy with the next release. Roll back by reverting the
Vite minifier options and the enqueue change. Old bundles still work, but they
are not translated.

## Correction during implementation

- **Size figure.** The pre-design experiment reported 2,528 KB for the admin JS. That
  number came from a scratch build directory. The real in-place build measures:

  | Build (clean `assets/js`) | Admin build | Site build | `assets/js` size |
  | ------------------------- | ----------- | ---------- | ---------------- |
  | esbuild (before)          | ~4 s        | <1 s       | 2,648 KB         |
  | terser (after)            | ~5 s        | ~2 s       | 2,644 KB         |

- **A fourth misplaced comment.** The check in task 1.5 found that the comment on
  `%1$s (%2$s%% off)` in `payment-summary-card.tsx` (`getCouponLabel`) sat above
  `return sprintf(`. Source extraction attached it, but terser rewrites the
  `if … return` into an expression and drops it. It now sits directly before the
  `__()` call, like the three in D5. After the fix, all 22 source `translators:`
  comments reach the POT from the bundles.
- **Missing strings include unused exports, not only unused modules.** The 24 msgids
  not found in the bundles come from 8 modules that nothing imports, plus
  `useUpdateAttributeMutation` in `features/products/services/attribute.ts` and the
  `slug` validator in `schemas/forms/shared/validators.ts`, which nothing uses. Tree
  shaking removes both kinds. The js-translations spec scenario now says "code that
  the build includes" instead of "source module that the build includes".
- **Test seam and test URL layout.** `enqueue_production_scripts()` now reads the
  manifest through a protected `get_manifest()`, so the integration test can supply
  a fake manifest. The test WordPress loads the plugin from outside its own
  `WP_PLUGIN_DIR`, so `KIRKI_ECOMMERCE_ASSETS_URL` and `plugins_url()` both give a
  broken URL there, and core cannot cut the script URL down to `assets/js/...`. The
  test uses core's `load_script_textdomain_relative_path` filter to give core the
  path a standard install produces. Production code is unchanged by this.
- **POT generation removed from the org build (user decision, after apply).**
  `npm run make:org-package` no longer runs `make:pot`, and it removes any
  `languages/kirki-ecommerce.pot` from the staged package, so an outdated local
  template never ships. `npm run make:pot` is unchanged and still scans the
  shipped bundles (D3). The plugin-packaging delta now states that the org
  package ships no template; the template requirements moved to js-translations.
  Task 3.3 checked the template when the org build still generated it.
