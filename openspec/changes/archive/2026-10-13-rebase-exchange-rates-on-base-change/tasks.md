## 1. Backend recalculation

- [x] 1.1 Add integration tests to `tests/Integration/CurrencyApiTest.php` (they must fail first): "Set as default" via a single-row `PUT` (USD 1, EUR 0.5, GBP 0.25 → EUR 1, USD 2, GBP 0.5); `PUT` on the current base with rate 3 stores 1 and leaves other rates; `POST` creating GBP as base with rate 0.25 (USD 4, EUR 2); first currency created as base stores 1 _(written before the service change, but not run red: `vendor/` had no dev packages at that time)_
- [x] 1.2 Add the `$previous_rate` argument to `CurrencyService::with_demoted_bases()` and recalculate every stored rate (`round(rate / previous_rate, 6)`) before the demotion, only when a base exists and `$previous_rate > 0`; update its docblock
- [x] 1.3 `update()`: write `exchange_rate = 1` when the currency was or becomes the base, and pass the stored rate of the promoted currency to `with_demoted_bases()`
- [x] 1.4 `create()` and `insert()`: write `exchange_rate = 1` on the base item and pass its request rate to `with_demoted_bases()`
- [x] 1.5 `ensure_base()`: pass the stored rate when the currency exists, `null` when it is created
- [x] 1.6 `set_base()`: move onto `with_demoted_bases()` with the stored rate and write `exchange_rate = 1`
- [x] 1.7 Add store-setup integration coverage (existing EUR at 0.5 under base USD → EUR 1, USD 2; new BDT → USD keeps 1) in the onboarding/store-setup integration test
- [x] 1.8 Verify: `composer test:integration` (or `composer test:docker:integration`) passes, `composer phpcs:wporg` and `composer phpcs:docblocks` pass, and `npm run typecheck && npm test` passes in `resources/app/` _(ran `composer install` with dev packages first. Integration 793/793 and unit 440/440 pass. The new tests were confirmed red against the old `CurrencyService` (5 of 6 fail; "keeps other rates" is a guard and passes on both). `phpcs:wporg` on `CurrencyService.php`: 0 errors, 1 old `file_get_contents()` warning that this change did not add. `phpcs:docblocks` passes. npm result as in 2.3)_

## 2. Admin "Set as default" payload

- [x] 2.1 Update the test in `resources/app/features/settings/multi-currency/tests/lib/currency-list.test.ts` ("reassigns is_base across the whole list") to expect only the new base row with `is_base: true`
- [x] 2.2 Change `buildCurrencyUpdatePayload()` in `resources/app/features/settings/multi-currency/lib/currency-list.tsx` so the `is_base` key returns only the selected row (return `null` when the row is not in the list)
- [x] 2.3 Verify: `npm run typecheck && npm test` passes in `resources/app/` _(typecheck and lint pass; 1444/1445 tests pass. The one failure, `ribbon.test.tsx` "updates the preview as the merchant types", is not related and also fails without this change)_

## 3. Documentation

- [x] 3.1 Add `docs/currencies.md` in the `docs/emails.md` structure: quick start, how rates relate to the base, what happens on a base change (with the worked example), request-order rule for `PUT /currencies`, precision limit of 6 decimals, and a "Where this differs from WooCommerce" section
- [x] 3.2 Update step 4 "Base currency" in `docs/onboarding.md` to say when the other rates are recalculated
- [x] 3.3 Verify: `npm run typecheck && npm test` passes in `resources/app/` _(same result as 2.3: only the unrelated `ribbon.test.tsx` failure)_
