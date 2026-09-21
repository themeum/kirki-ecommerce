## 1. Sequence source

- [x] 1.1 ~~Add `LAST_SKU_SEQUENCE` to `app/Constants/OptionKeys.php`~~ — reverted: the persisted counter was removed after review (see design decision 2), so no option key exists
- [x] 1.2 ~~Seed it to `0` in `database/seeders/SettingsSeeder.php`~~ — reverted with 1.1; both files are back to their original contents
- [x] 1.3 Verify: an existing install needs no migration — the sequence is read from whatever is already in `variants.sku`, covered by `test_sequence_continues_across_products` and `test_sku_without_a_numeric_tail_does_not_raise_the_sequence`

## 2. `SkuGenerator`

- [x] 2.1 Create `app/Supports/SkuGenerator.php` modelled on `app/Supports/OrderNumberGenerator.php` (`Kirki\Ecommerce\App\Supports` namespace, `defined('ABSPATH') || exit;`, `protected`/`static::`, snake_case methods)
- [x] 2.2 Implement the segment rule: `remove_accents()` → strip everything outside `A-Z0-9` → uppercase → first 3 characters; a source that normalizes to an empty string returns no segment
- [x] 2.3 Implement `next_sequence()` as one past `MAX(CAST(SUBSTRING_INDEX(sku, '-', -1) AS UNSIGNED))` over `variants` — `SUBSTRING_INDEX` rather than `REGEXP_SUBSTR` to stay within the MySQL 5.7 floor. Nothing is persisted, so an abandoned SKU consumes no number
- [x] 2.8 Verify the sequence query on MySQL 5.7.44 with stock `sql_mode` (`ONLY_FULL_GROUP_BY`, `STRICT_TRANS_TABLES`): extraction, `MAX`, empty table, non-numeric tail and oversized tail all behave as designed — the harness runs MariaDB, which does not enable `ONLY_FULL_GROUP_BY`, so this could not be caught there
- [x] 2.9 Make that coverage permanent: `.github/workflows/tests.yml` runs `integration-tests` as a matrix over `mariadb:10.6` and `mysql:5.7` with `fail-fast: false`, so a 5.7-only regression fails a PR instead of a release
- [x] 2.4 Implement sequence rendering: `str_pad` to a minimum width of 3, natural width beyond 999
- [x] 2.5 Implement composition: title, then one segment per attribute value in assigned order (`value ?? color`), then brand name, then first category name, then the sequence — joined by `-`, omitted segments taking their separator with them
- [x] 2.6 ~~Implement the bounded collision retry~~ — removed: with the number read from stored SKUs it is strictly above every stored number, so the retry branch is unreachable (design decision 5)
- [x] 2.7 Verify: `composer test:docker:integration` with `tests/Integration/SkuGeneratorTest.php` covering every scenario in `specs/sku-generation/spec.md` — segment rules, omitted segments, the Bangla-only case, padding and widening, sequence continuation, abandoned generates, released numbers and non-numeric tails — 17/17 green

## 3. API endpoint

- [x] 3.1 Create `app/Http/Requests/Variant/GenerateSkuRequest.php` with rules for `variant_id` (integer, nullable), `title` (string, nullable, max 255), `brand_id` (integer, nullable), `category_ids` / `category_ids.*`, `attribute_value_ids` / `attribute_value_ids.*`, and matching `Sanitizer` filters
- [x] 3.2 Add `generate_sku()` to `app/Http/Controllers/Api/VariantController.php`: when `variant_id` is present, load the variant with `product.brand`, `product.categories` and `attribute_values` and ignore the draft fields; otherwise resolve brand, category and attribute-value names from the submitted ids
- [x] 3.3 Register `Route::post('/variants/generate-sku', [VariantController::class, 'generate_sku']);` in `routes/api.php` **above** the `/variants/{id}` routes so the literal segment is not swallowed by the id pattern
- [x] 3.4 Return `{ data: { sku }, message }` via `response()->json()`, matching the shape the other variant actions return
- [x] 3.5 Verify: `composer test:docker:integration` with a new `tests/Integration/SkuApiTest.php` covering the saved-variant path, the draft path, first-category-only, non-persistence, sequence advance, the collision retry, saving with an empty SKU, a missing variant (404) and the unauthenticated rejection (401) — 9/9 green
- [x] 3.6 Verify: `phpcs --standard=phpcs-wporg.xml.dist` exits 0 with no findings across all six touched PHP files

## 4. Frontend plumbing

- [x] 4.1 Add `VARIANT_GENERATE_SKU: '/variants/generate-sku'` to `resources/app/config/endpoints.ts`
- [x] 4.2 Add a response schema (`z.object({ sku: z.string() })`) and a `generateSku` service function + `useGenerateSkuMutation` in `resources/app/features/inventory/services/inventory.ts`, using `apiClient.post`, **`parseResponse`** and `toastMutationError` like the neighbouring functions — corrected from `parseData`: per `openspec/project.md`, `parseData` is for `useQuery` (it toasts directly) and `parseResponse` is the mutation primitive
- [x] 4.3 Verify: `npm run typecheck` in `resources/app/`

## 5. Wire both wands

- [x] 5.1 Product form (`resources/app/features/products/components/product-form/sections/inventory/inventory.tsx`): replace `handleGenerateSku` with the mutation, reading `title`, `brand`, `categories` and `variants.0.attribute_values` out of form state; disable the wand while in flight; leave `variants.0.sku` untouched on failure
- [x] 5.2 Variant form (`resources/app/features/inventory/components/variant-form/sections/inventory.tsx`): replace `handleGenerateSku` with the mutation, sending only the variant id; same in-flight and failure handling
- [x] 5.3 Delete `generateSku()` and `randomSkuSegment()` (and the now-unused `SKU_ALPHANUMERIC`) from `resources/app/features/products/lib/utils.ts`, and their two imports
- [x] 5.4 Verify: `npm run typecheck` clean; `npm run lint` leaves only 5 pre-existing errors in files this change does not touch; `npm test` 1100/1101 passing, the single failure being the pre-existing `consent-form.test.ts` case in the untouched legal feature; no reference to the old `generateSku` remains

## 6. Close out

- [x] 6.1 Re-read `specs/sku-generation/spec.md` and `specs/product-inventory-card/spec.md` and confirm every scenario is covered by a test or a deliberate manual check — audit added three missing cases (sibling variants differing beyond the sequence, a deleted variant not releasing its number, saving with an empty SKU generating nothing); all 21 `sku-generation` scenarios now have a test, and `product-inventory-card`'s 4 UI scenarios are deliberate manual checks (task 6.2) since project rule 0 forbids driving the UI from here and the card has no component test
- [x] 6.2 Ask the user to confirm the wand behaviour in the browser (per project rule 0, no dev-server preview is run from here) — asked at the end of the apply session

## 7. Bulk edit grid

- [x] 7.1 Add `SkuGenerator::generate_many()` — one `next_sequence()` read, advanced in memory per entry, results keyed the way the caller keyed its input. A batch is necessary rather than convenient: nothing is persisted, so N single calls would each read the same maximum and return the same number N times
- [x] 7.2 Create `app/Http/Requests/Variant/GenerateSkusRequest.php` with `variant_ids` (`required|array|min:1`) and `variant_ids.*` (integer), plus matching `Sanitizer` filters
- [x] 7.3 Add `generate_skus()` to `VariantController`, extracting the existing per-variant source mapping into `sources_from_variant_record()` so the single and batch paths share it; load every requested variant in one query, preserve the submitted order, and skip ids with no matching variant rather than failing the batch
- [x] 7.4 Register `Route::post('/variants/generate-skus', ...)`. WordPress anchors `register_rest_route` patterns, so this does not shadow or get shadowed by `/variants/generate-sku`
- [x] 7.5 Add `VARIANTS_GENERATE_SKUS` to `endpoints.ts` and a `generateVariantSkus` service + `useGenerateVariantSkusMutation` in `features/bulk-edit/services/bulk-edit.ts` (its only consumer), parsing through `parseResponse` and a `z.array(z.object({ variant_id, sku }))` schema
- [x] 7.6 Add `getSelectedRows(field)` to the cell-selection actions and a `useSelectedRowCount(field)` subscription hook. The count is what components subscribe to, because `selectionRange()` builds a fresh array per call and `useSyncExternalStore` would treat that as a change on every store notification
- [x] 7.7 Add `SkuGenerateAction`, rendered in the SKU column header and hidden while `useSelectedRowCount('sku')` is 0
- [x] 7.8 Route `handleFillCommit` for the `sku` field into `handleGenerateSkus(payload.rows)` instead of copying the origin value, so a fill-drag gives each row its own rule-based SKU. The whole range, not the usual `targetRows`: other columns exclude the origin because it is the source of the copy, but SKU copies nothing, so excluding it merely skipped the cell the drag started from
- [x] 7.9 Widen the SKU column from 160 to 260 so a full `BLU-RED-SMA-NIK-APP-010` is legible
- [x] 7.11 Position the generate action absolutely within the SKU header. In flow it grew the shared header row from the label's 18px line box to the `xs` button's fixed 24px, stepping the whole grid down 6px whenever a SKU cell was selected; out of flow it contributes no height in any state, so no height matching has to be maintained against future `Button` changes
- [x] 7.10 Verify: 12 new PHP tests (5 in `SkuGeneratorTest`, 7 in `SkuApiTest`) — `bash kirki-test integration --filter Sku` green at 38 tests / 740 assertions; 3 new cases in `bulk-edit-table.test.tsx` — `vitest run features/bulk-edit` green at 48; `npm run typecheck` and `eslint features/bulk-edit` clean; `composer phpcs:wporg` reports 0 errors
