## 1. Extractable production bundles

- [x] 1.1 Add `terser` as a dev dependency in `resources/app/package.json` and `resources/site/package.json` (update both lockfiles)
- [x] 1.2 In `resources/app/vite.config.js`, set `build.minify: 'terser'` with `mangle.reserved: ['__', '_x', '_n', '_nx']`, `compress.conditionals: false` and `format.comments: /translators:/i` (design D1)
- [x] 1.3 Apply the same minifier options in `resources/site/vite.config.ts`
- [x] 1.4 Move the misplaced `translators:` comments directly before their calls in `available-currency-list.tsx`, `order-details.tsx` and `payment-summary-card.tsx` (design D5)
- [x] 1.5 Build both apps. Run `wp i18n make-pot` over `assets/js` and compare its msgids with a source extraction: no extra msgids, and the only missing ones come from modules that no entry imports. Confirm that the translator comments, including the three from 1.4, are attached. Record the build time and `assets/js` size before and after in design.md _(found and fixed a fourth misplaced comment in `getCouponLabel`; missing msgids also come from unused exports; see design.md "Correction during implementation")_
- [x] 1.6 Verify: `npm run typecheck && npm test` from `resources/app/` _(typecheck passes; 1427/1428 tests pass. The one failure, `features/home/tests/lib/steps.test.ts` "routes both payment buttons to Payment settings", already exists on `dev`: commit 058e728a removed the "Cash on delivery" step button and did not update the test. It is not related to this change)_

## 2. Admin runtime translation loading

- [x] 2.1 In `EnqueueAdminScripts::enqueue_production_scripts()`, add `wp-i18n` to the entry bundle's dependencies
- [x] 2.2 Add a method that takes the manifest and the entry handle. For each manifest record with a `.js` file, it registers a handle (registered only, never enqueued), calls `load_script_textdomain()` with the plugin `languages` path, and adds the core-style `wp.i18n.setLocaleData()` snippet as an inline `before` script on the entry handle. Call it from `enqueue_production_scripts()` (design D2)
- [x] 2.3 Add an integration test. Use a fake manifest with an entry and a lazy page chunk, and serve JSON files through the `load_script_translation_file` filter. Assert that the entry handle depends on `wp-i18n`, that its inline `before` data has the strings of both files, and that no inline data is added when no JSON exists
- [x] 2.4 Verify: `composer test:docker` passes, then `npm run typecheck && npm test` from `resources/app/` _(PHP: 440 unit and 782 integration tests OK; `phpcs:wporg` adds no new warnings. App: typecheck clean; same pre-existing `steps.test.ts` failure as 1.6)_

## 3. POT from the shipped bundles

- [x] 3.1 Rewrite `bin/make-pot.sh` to one `make-pot` pass over the repo root that includes `assets/js` and still excludes `resources/app` and `resources/site`. Exit with a clear error when `assets/.vite/manifest.json` or `assets/js/site.js` is missing (design D3)
- [x] 3.2 Delete `bin/transpile-for-pot.mjs`
- [x] 3.3 Run `npm run make:org-package` and check the shipped `languages/kirki-ecommerce.pot`: all JS references name files under `assets/js` that are in the package, there are no `.ts`/`.tsx` and no `payments/` references, and storefront strings reference `assets/js/site.js`
- [x] 3.4 Translate a few strings from the entry bundle, one lazy page and `site.js` into a test `.po` file, and run `wp i18n make-json`. Confirm that one JSON file is written for each of those scripts, named with the md5 of its package path
- [x] 3.5 Verify: `npm run typecheck && npm test` from `resources/app/` _(typecheck clean; same pre-existing `steps.test.ts` failure as 1.6. Ran `composer install` after the org build, because `make-package.sh` leaves the repo `vendor/` in `--no-dev` state)_

## 4. Documentation

- [x] 4.1 Write `docs/translations.md` (structure like `docs/cache.md`) _(`docs/cache.md` does not exist; used the structure of `docs/settings-search.md` instead. The manual check uses two `grep` commands; a count comparison does not work because `make-pot` merges references on one minified line)_: quick start (`make:pot`, `make:org-package`), how JS strings are extracted from the bundles, how admin and storefront translations load, developer rules (import `__` without an alias, put the `translators:` comment directly before the call, keep literal string arguments), the manual extraction check to run after a terser or Vite upgrade, and known limitations (no dev-mode translations, settings search is English only)
- [x] 4.2 Update the "English only" note in `docs/settings-search.md`: admin translations now ship, so translated UI with English search is a live limitation, and a follow-up change will fix it
- [x] 4.3 Verify: `npm run typecheck && npm test` from `resources/app/` _(typecheck clean; same pre-existing `steps.test.ts` failure as 1.6)_

## 5. Remove POT generation from the org build

- [x] 5.1 Remove the `make-pot.sh` call from the `--org` path of `bin/make-package.sh`, and remove `languages/kirki-ecommerce.pot` from the staged package in that path
- [x] 5.2 Run `npm run make:org-package` with a local `languages/kirki-ecommerce.pot` present: the build does not generate a template and the zip has `languages/` without the `.pot`
- [x] 5.3 Update `docs/translations.md` quick start and the `.gitignore` comment
- [x] 5.4 Verify: `npm run typecheck && npm test` from `resources/app/`
