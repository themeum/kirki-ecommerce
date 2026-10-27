## 1. Prerequisite

- [x] 1.1 Archive or `opsx:sync` the `country-data-php-arrays` change so `openspec/specs/country-reference-data/spec.md` exists. This change's delta modifies and removes requirements in it and cannot land correctly otherwise.

## 2. Translate the data files

- [x] 2.1 Extend `bin/generate-country-data.php` to emit names as `__('<name>', 'kirki-ecommerce')` in both outputs — raw PHP in the rendered source, not a quoted string. Country `name` and state `name` only; codes, currencies, flags and ids stay literal.
- [x] 2.2 Run the generator. Verify `resources/data/countries.php` contains 250 `__(` occurrences and `resources/data/states.php` contains 4,991.
- [x] 2.3 Spot-check a country with an apostrophe or non-ASCII characters (e.g. `Côte D'Ivoire`, `Åland Islands`) to confirm escaping survives the `__()` wrapping and the file still parses: `php -l resources/data/countries.php`.
- [x] 2.4 Run `composer test:unit`. **Premise corrected:** the identity test did NOT fail — all 314 tests passed. `tests/Support/StubsWordPressFunctions.php:4` stubs `__()` as the identity function, so the wrapped names resolve back to the same literals and the output stayed byte-identical to the JSON. Useful side effect: this proves the `__()` wrapping alone is lossless. The identity test breaks in section 3, when sorting changes the order — not here.

## 3. Sort by translated name

- [x] 3.1 Add a protected sorting helper to `app/Supports/CountryData.php` modelled on `wc_asort_by_locale()`: use `new Collator(get_locale())` inside `try`/`catch (IntlException)` when `class_exists('Collator')`, otherwise fall back to sorting on `remove_accents(html_entity_decode($name))`.
- [x] 3.2 Apply it in `nested()` to order the country list by translated name, and to order each country's states by translated name. Keep the result sequentially indexed. Do not sort `index()` — it is keyed by code and its only consumer is order-insensitive.
- [x] 3.3 Confirm the sort runs once per request, not once per country, by keeping it inside the memoized build. Confirmed for the country list: `build_nested()` is called only from the `nested()` memoization guard. **Qualification:** state sorting sits in `with_states()`, which `find_nested()` also calls outside the memo — so a `find_nested('US')` re-sorts that one country's 66 states per call. Deliberate: it keeps `find_nested()` and `nested()` ordering identical, and sorting one small list is cheaper than memoizing per country.
- [x] 3.4 Verify the storefront needs no edits: `resources/views/site/checkout/parts/{shipping,billing}-form.php` and `resources/views/site/account/parts/{address-form,address-modal}.php` iterate the list they are given, and `resources/site/ts/components/state-field.ts` reads `config.countries` — all downstream of `nested()`.

## 4. Admin search by ISO code

- [x] 4.1 Add `keywords?: string[]` to the `ComboboxOption` type in `resources/app/components/ui/combobox.tsx` and pass `keywords={option.keywords}` to `CommandItem`.
- [x] 4.2 Confirm `resources/app/components/ui/command.tsx` needs no change — **verified**: cmdk 1.1.1's `index.d.ts:84` declares `keywords?: string[]`, and `command.tsx:106-119` types `CommandItemProps` from `ComponentPropsWithoutRef<typeof CommandPrimitive.Item>` and spreads `...rest` into it. File untouched.
- [x] 4.3 In `resources/app/components/country-selector.tsx`, supply `keywords: [country.code]` alongside `label: country.name`.
- [x] 4.4 Add a Vitest case covering search by code and search by translated label. New `resources/app/components/ui/combobox.test.tsx`, 3 tests. **One premise corrected while writing it:** the first draft used `DE`/`Deutschland`, but cmdk scores subsequences, so `DE` matched the label alone and the test proved nothing about `keywords`. Fixture now uses codes absent from their own labels (`DE`/Allemagne, `GB`/Royaume-Uni), plus a contrast case asserting a code does NOT match when no keyword is supplied.
- [x] 4.5 Run `npm run typecheck:app` and `npm test` in `resources/app/`.

## 5. Replace the identity test

- [x] 5.1 Rewrite `tests/Unit/Supports/CountryDataIdentityTest.php` as a structural contract test with no JSON fixture: 250 countries, 4,991 states, exact key order (`name, code, phone_code, currency, currency_name, currency_symbol, flag, states, numeric_code, group`), sequential indexing, state entries carrying exactly `['id','name']`, and `has_states` absent from public output. Renamed to `tests/Unit/Supports/CountryDataContractTest.php` — "Identity" no longer described it.
- [x] 5.2 Add sorting tests: countries ordered by displayed name, states ordered within a country.
- [x] 5.3 Cover the no-`Collator` fallback path. **Decided: both, for different reasons.** The ordering assertions live in `tests/Integration/CountryDataSortFallbackTest.php` against WordPress's real `remove_accents()`, reached by reflection since the Integration job installs intl and the Collator path would otherwise always win. A stub was *also* added to the Unit suite — not for this test, but because the Unit CI jobs (`.github/workflows/tests.yml:23,44`) do NOT install intl, so without it the fallback would fatal the entire Unit suite on CI. Unit sorting assertions deliberately use ASCII-only names, which collate identically down either path.
- [x] 5.4 Re-check `tests/Unit/Services/CountryServiceTest.php`: it asserts 250 countries and 27 `eu` countries, and `find('US')` by code. Confirmed by running the suite: 317 tests pass, including the 250-country and 27-eu-country assertions.
- [x] 5.5 Confirm `tests/Integration/CountryServiceBindingTest.php` passes untouched. Confirmed in the full Integration run — file not edited.

## 6. Consolidate the EU country list

- [x] 6.1 Re-verify the redundancy before deleting anything: every code, name, numeric code and flag in `resources/data/european_union_countries.json` matches `resources/data/countries.php`, and `group` is only ever `eu` (27) or `general` (223). Measured once already — confirm it still holds against the translated files.
- [x] 6.2 Rewrite `load_data()` in `app/Supports/EuropeanCountryChecker.php` to build its member list from `CountryData::index()` filtered on `group === 'eu'`, keeping the existing memoized static. Do not load `nested()` — `index()` alone avoids pulling `states.php`.
- [x] 6.3 Keep `is_eu_by_code()` and `is_eu_by_name()` behaviourally identical for the 27 members. Note in the `is_eu_by_name()` docblock that it now compares translated names against translated names, and that the code is still the better key.
- [x] 6.4 Drop the now-unused `json_decoded_data` / `resource_path` imports if nothing else in the file uses them. Both removed. The `app` import is also unused, but it was unused before this change — flagged, not removed.
- [x] 6.5 Delete `resources/data/european_union_countries.json`.
- [x] 6.6 Update `tests/Unit/Supports/EuropeanCountryCheckerTest.php`: remove the fixture path at line 48, and add a test asserting the exact set of 27 member codes. That test is what now guards the `group` field, since a stray edit to it would silently change tax routing.
- [x] 6.7 Check `tests/Unit/TestCase.php:82` — **kept working by design**: the reflection helpers set `eu_countries` to `[]` to reset and to a non-empty array to inject a fake, both of which depend on the `!empty()` memo guard. So the property's name, `[]` default and guard were all left exactly as they were and only `load_data()`'s body changed. The three fake-injection tests still pass, which is the proof.
- [x] 6.8 Check `tests/Support/BindsTaxDependencies.php:44` — its comment describes the EU dataset loading alongside the tax bindings. Update it if the rewrite makes it inaccurate, and confirm the tax tests still pass.
- [x] 6.9 Confirm no reference to `european_union_countries` survives: `grep -rn "european_union_countries" --include="*.php" --include="*.json" --include="*.sh" .` excluding `openspec/changes/` and `.claude/worktrees/`.

## 7. Delete the migration tooling

- [x] 7.1 Delete `data-src/countries.json` and `bin/generate-country-data.php`. Do this only after section 2 has produced the final generated files.
- [x] 7.2 Do NOT delete `bin/import-address-rules.php`. It targets libaddressinput, a live upstream that changes, so it is re-runnable tooling — a deliberate decision recorded in `openspec/changes/address-field-rules/proposal.md`. Leave it and its header comment intact.
- [x] 7.3 Remove the `country-data-drift` job from `.github/workflows/tests.yml`.
- [x] 7.4 Confirm no reference to `data-src`, `generate-country-data`, or the drift job survives anywhere: `grep -rn "data-src\|generate-country-data\|country-data-drift" --include="*.php" --include="*.yml" --include="*.md" .` excluding `openspec/changes/`. Clean in live code. One deliberate mention remains in `CountryDataContractTest`'s docblock, which explains what the test replaced and why — that is history, not a dangling pointer.
- [x] 7.5 Add a header comment to both generated data files stating they are now maintained by hand, replacing the "generated by bin/generate-country-data.php — do not edit" notice, which would otherwise point at a deleted script.

## 8. Final gates

- [x] 8.1 `composer test` (Unit + Integration; Integration via `composer test:docker:integration`). Unit 318/7,340; Integration 464/9,817 (up from 460 — the four new fallback tests). The first Integration run had one failure, in the new fallback test: **my expected order was wrong, not the code.** `remove_accents('Åland Islands')` gives `Aland Islands`, which sorts *before* `Albania` since `a` precedes `b` at the third letter. Expectation corrected and the test rewritten to assert names rather than positions so the intent is legible.
- [x] 8.2 `composer phpcs:wporg` passes.
- [x] 8.3 `npm run typecheck:app` passes.
- [x] 8.4 `npm test` in `resources/app/` passes.
- [x] 8.5 Sanity-check extraction actually works. **WP-CLI 2.12.0 was available, so this was actually run rather than skipped.** Two adjustments were needed: the default run died with a PHP memory exhaustion inside the JS parser, so it ran with `--skip-js` and `WP_CLI_PHP_ARGS='-d memory_limit=1G'`. Result: 5,919 msgids, with `Germany`, `Japan`, `Curaçao`, `Zimbabwe`, `Alabama`, `Bavaria` and `Cox's Bazar District` all present and referenced to `resources/data/countries.php` / `states.php` — so the apostrophe and non-ASCII escaping survives extraction, not just parsing.
- [x] 8.6 Run the tax suite specifically and confirm EU routing is unchanged, since `TaxStrategyFactory` now depends on `group`.
- [x] 8.7 Re-read the final diff and confirm every changed line traces to this change. Reviewed each touched file. Note on `.github/workflows/tests.yml`: it now shows **no** drift-job lines against HEAD, because that job was added by `country-data-php-arrays` in the same uncommitted tree and removed here — add-then-remove nets to zero. Its only remaining diff is the `storefront-tests` job, which belongs to `address-field-rules`.
