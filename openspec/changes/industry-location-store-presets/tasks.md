## 0. Prerequisite

- [x] 0.1 Confirm `move-runtime-setup-out-of-seeders` is applied (setup classes in `app/Setup/`, namespace `Kirki\Ecommerce\App\Setup`) before any task below

## 1. Phase 1 — Loader, context and fixture data

- [x] 1.1 Create `resources/data/presets.json` with the shape in design.md §2 and a small fixture set: full `common`, `blocs.EU` + `blocs.GCC`, industries `fashion-and-apparel` and `food-beverage-and-gourmet`, countries `GB`, `DE`, `FR`, `US` (Texas only), `CA` (all provinces), `BD` — each country with `source` and `verified_at`
- [x] 1.2 Create `app/Setup/Presets/PresetRepository` (`get_common`, `get_industry`, `get_country`, `get_bloc`); a missing or invalid file returns empty arrays and logs once
- [x] 1.3 Create `app/Setup/Presets/PresetContext` DTO (`industry`, `country`, `state`, `currency`, `is_tax_collected`) with a `from_setup(StoreSetupDTO)` factory
- [x] 1.4 Change `StoreSetupService::apply_presets()` to take `PresetContext`, and call it from `setup()` with the context built from the DTO
- [x] 1.5 Unit test: repository returns sections; missing file and invalid JSON give empty arrays; every country entry with `tax` has `source` and `verified_at`; every `profile_rates` key and `shipping_rules.profile` refers to a profile key that exists
- [x] 1.6 Verify: `composer test:docker:unit`, then `npm run typecheck && npm test` from `resources/app/`

## 2. Phase 1 — Catalog presets (attributes, schema, coupon)

- [x] 2.1 `AttributePresets`: create `common.attributes` + industry attributes, guard per slug; skip industry data for `other` or unknown industry
- [x] 2.2 `SchemaProfilePresets`: create `common.schema_profiles` when no row exists (encode `schema` as JSON, as `ProductSchemaSeeder` did)
- [x] 2.3 `CouponPresets`: create `WELCOME50` per design.md §8, guard on code; check the required fields against the coupon create request and `CouponService`, and set any that are missing
- [x] 2.4 Remove `AttributeSeeder` and `ProductSchemaSeeder` from `OnBoardingSeeder`; delete both classes and `OnBoardingCatalog::get_attributes()`, `get_colors()`, `get_schema_profiles()`
- [x] 2.5 `ProductSeeder`: add its demo attribute catalog and find-or-create each attribute (by slug) and value (by label) before it builds products
- [x] 2.6 Integration tests: fashion store gets Color + Size; `other` gets Color only; one default schema profile with every picker field; coupon inactive with 50% off the order; retry creates no duplicates; sample data on a store with Color but no Material creates Material and reuses Color
- [x] 2.7 Verify: `composer test:docker`, then `npm run typecheck && npm test` from `resources/app/`

## 3. Phase 1 — Profiles and legal

- [x] 3.1 `ShippingProfilePresets`: create `General` (default) + industry profiles, find-by-name to reuse ids; return the key → id map
- [x] 3.2 `TaxProfilePresets`: create `Standard` (default) + industry profiles, same lookup; return the key → id map
- [x] 3.3 `LegalPresets`: create missing pages by slug (published, placeholder body); reuse a published `wp_page_for_privacy_policy` page; write consents (UUID ids, enabled) with `{page:<key>}` replaced by `{<slug>}`, and `gdpr_method` used when the country has `gdpr: true`; skip consents when any exist
- [x] 3.4 Integration tests: one default shipping and tax profile each; `DE` privacy consent is mandatory and `BD` is display-only; consent token renders a link to the Terms page; existing consents and pages are not changed
- [x] 3.5 Verify: `composer test:docker`, then `npm run typecheck && npm test` from `resources/app/`

## 4. Phase 1 — Shipping zones, methods and rules

- [x] 4.1 Read `resources/app/features/settings/shipping/schemas/forms/shipping-rule-form.ts` and the method form; record the exact saved `operator`/`value` format for a `shipping_profile` condition and the method field set, and record any difference from design.md §2 as a correction note in design.md _(Recorded under "Corrections during implementation" in design.md: relation `AND`, operator `=`, profile id as a string; flat-rate methods need `is_taxable` and a non-null `base_amount`.)_
- [x] 4.2 `ShippingZonePresets`: build Domestic, Regional (from `bloc`), Rest of World (all `countries.php` codes minus earlier zones), in that order, UUID ids, enabled; skip when any zone exists
- [x] 4.3 Methods: country methods or the generic set; apply amounts and `free_over` only when the base currency is the same as the country currency, else disabled with `base_amount` 0
- [x] 4.4 Rules: expand industry `shipping_rules` templates onto the matching zone kind and method key, with the profile key resolved to its id
- [x] 4.5 Integration tests: `DE` gets 3 zones in order with the right destinations; `BD` gets 2; `GB`+`GBP` methods enabled with amounts; `GB`+`USD` disabled with 0; a Perishable cart is not offered Rest of World; a store with a zone gets no preset zones; Home shipping step is preconfigured
- [x] 4.6 Verify: `composer test:docker`, then `npm run typecheck && npm test` from `resources/app/`

## 5. Phase 1 — Tax region, profile rules and EU fix

- [x] 5.1 `EUTaxStrategy::get_rate()`: use the store address country for `micro_business` and the shopper's country for `oss`; remove the TODO; add micro-business and OSS cases to `tests/Unit/Tax/EUTaxStrategyTest.php`
- [x] 5.2 `TaxRegionPresets`: skip when tax is off or any region exists; build the `country`, `states` (`scope` home/all, `home_extra`, address state matched by `states.php` id) and `eu` (micro_business, all 27 member rates from `blocs.EU`) regions per design.md §2
- [x] 5.3 Tax profile rules per design.md §5 (rate → `set_product_tax_rate`, exempt → `set_product_tax_exempt`), placed on region rules or the home state's rules; check the saved condition format against `tax-rules-form.ts` as in 4.1
- [x] 5.4 Integration tests: `FR` + tax on → EU micro_business region with 27 rates; `US` + Texas → one state at 6.25; `US` with no state → no region; `CA` + BC → all provinces, BC = GST + PST; `BD` → country-wide; tax off → no region but profiles exist; `DE` food → rule at 7; Home tax step is preconfigured
- [x] 5.5 Verify: `composer test:docker`, then `npm run typecheck && npm test` from `resources/app/`

## 6. Phase 1 — Wiring and docs

- [x] 6.1 Run the appliers from `apply_presets()` in the order in design.md §1 (attributes → schema → coupon → shipping profiles → tax profiles → legal → zones → tax region)
- [x] 6.2 Extend `tests/Integration/OnboardingApiTest.php`: full setup for `fashion-and-apparel`/`GB`/`GBP`/tax on writes every preset kind; a retry after a forced failure in the middle finishes without duplicates; order and invoice number settings keep their defaults
- [x] 6.3 Update `docs/onboarding.md`: presets section (data file, sections, what is written, conditions on currency and tax, `other`, retry safety), new `apply_presets(PresetContext)` signature, and the "Where this differs" section (data accuracy and `verified_at`, US local tax not included, shipping tax uses the product rate, English-only text, no numbering presets and why, EU rules on a change to OSS, micro_business behavior change)
- [x] 6.4 Verify: `composer test:docker`, then `npm run typecheck && npm test` from `resources/app/`

## 7. Phase 2 — Full common and industry data

- [x] 7.1 Write industry entries for all 15 onboarding industries (attributes, shipping profiles + rule templates, tax profiles), using the slugs from `resources/app/features/onboarding/lib/steps.ts`
- [x] 7.2 Check the `common` section content (Color values, consent messages, placeholder page text, generic method names)
- [x] 7.3 Unit test: every non-`other` industry slug in `steps.ts` has an industry entry
- [x] 7.4 Verify: `composer test:docker`, then `npm run typecheck && npm test` from `resources/app/`

## 8. Phase 3 — Full country data

- [x] 8.1 Add `tax` entries for every country with a national VAT/GST (standard rate, `profile_rates` where known), each with `source` and `verified_at` _(97 countries with tax data: EU-27, US, CA, BD, GB and about 60 from the vatupdate July 2026 table. Unclear or conflicting rows were left out; see the design corrections.)_
- [x] 8.2 Add `bloc` and `gdpr` flags (EU/EEA, GB, CH and other countries with GDPR-style law), and decide the open question on other trade blocs _(Blocs: EU and GCC only (customs unions). gdpr: EU-27, GB, CH, NO, IS, LI.)_
- [x] 8.3 Add local-currency `shipping` method amounts for the countries that get them; all other countries use the generic disabled set _(Amounts for GB, US, CA, BD, DE, FR, ES, IT, NL, CH, AU, NZ, IN, JP, SG, AE.)_
- [x] 8.4 Add the remaining US states (`scope: home`) and confirm the CA provincial data _(45 states + DC from the Tax Foundation July 2026 table; exact statutory values for MN, MO, NJ, NM. AK, DE, MT, NH, OR have no state tax and no entry.)_
- [x] 8.5 Re-run the data checks from 1.5 against the full file
- [x] 8.6 Verify: `composer test:docker`, then `npm run typecheck && npm test` from `resources/app/`

## 9. Revision 2 — Preset source and contract

- [x] 9.1 Create `PresetSource` interface (`fetch(PresetContext): ?array`) and bind it in the container: `RemotePresetSource` when the URL (constant `KIRKI_ECOMMERCE_PRESETS_URL`, filter `kirki_ecommerce_presets_url`) is not empty, else `LocalPresetSource` (design.md §10)
- [x] 9.2 `RemotePresetSource`: `wp_safe_remote_get` with `industry`, `country`, `state`, `currency`, `tax`, `version`, timeout 10 s; transport error, non-2xx, invalid JSON or unknown `version` → null + one `Log::warning`
- [x] 9.3 `LocalPresetSource`: move the build logic out of the appliers into local builders that return the response of design.md §11 (categories, attributes, schema profiles, coupons, profiles, legal with GDPR resolved, zones with destinations, methods, amounts/`is_enabled` and `{profile, action}` rules, `tax_region` or null)
- [x] 9.4 Add `PresetContext::from_settings()` (industry, country, state, base currency, tax switch from saved settings)
- [x] 9.5 Unit tests: URL selects the source; remote failure cases return null; local source response for `DE`/food/tax on, `GB`+`USD`, `US` without state, `other` _(Integration tests, not unit tests: the remote source needs the WordPress HTTP API. `StorePresetsTest` covers the URL filter, a timed-out server and a server response; the local cases run through the presets request; `LocalPresetSourceTest` covers per-state rules against a fixture file.)_
- [x] 9.6 Verify: `bash kirki-test unit`

## 10. Revision 2 — Inserters, service and endpoint

- [x] 10.1 Change each applier to an inserter `apply(array $presets, PresetContext $context)` that reads only its key, validates and sanitizes per design.md §12, resolves `{profile, action}` rules to the stored format, adds UUIDs, and keeps its guard
- [x] 10.2 Create `StorePresetService::apply(PresetContext)`: fetch once, run inserters in order, each in `try`/`catch` with a log, then `record_preconfigured()`, then set `kirki_ecommerce_presets_applied` _(The flag is the option `presets_applied_at` (`OptionKeys::PRESETS_APPLIED_AT`). The service gets `PresetSource` from the container in `apply()`, because the router builds controllers without container bindings. Store setup still calls `record_preconfigured()` too, so the checklist is right if the presets request never runs.)_
- [x] 10.3 Remove `apply_presets()` and the `record_preconfigured()` call from `StoreSetupService::setup()`
- [x] 10.4 Add `POST /onboarding/presets` (`OnboardingController::apply_presets`): 409 before onboarding is complete; success with no work when the flag is set; else run the service and return success
- [x] 10.5 Rework `tests/Integration/StorePresetsTest.php` and `OnboardingApiTest` to the new flow; add: unreachable remote writes nothing and returns success (fake source), malformed zone skipped, one inserter throws and the rest are written, second request changes nothing, request before setup gets 409, setup alone writes no presets
- [x] 10.6 Verify: `bash kirki-test all`

## 11. Revision 2 — Categories and no Rest of World

- [x] 11.1 Add `categories` (two levels) to all 15 industry entries in `presets.json`
- [x] 11.2 Create `CategoryPresets` (insert one level at a time, unique slugs, skip when any category exists); delete `CategorySeeder` and `OnBoardingCatalog::get_categories()`; `OnBoardingSeeder` runs `SettingsSeeder` only _(Rows are created one by one, parents first, with `Category::generate_unique_slug()`: a repeated name gets a numbered slug.)_
- [x] 11.3 `ProductSeeder`: resolve each `category_path` by name within its parent and create the missing nodes
- [x] 11.4 Remove Rest of World: the zone kind, `zone_titles.rest_of_world`, `common.shipping_methods.rest_of_world`, each country's `shipping.rest_of_world`, and `rest_of_world` from every rule template (drop templates that only targeted it)
- [x] 11.5 Tests: fashion gets its tree; `other` gets none; existing category blocks the tree; `DE` gets 2 zones and `BD` 1; sample data on a store with no categories creates no categories; repository test: every industry except `other` has categories, no rule targets `rest_of_world`
- [x] 11.6 Verify: `bash kirki-test all`

## 12. Revision 2 — Tax rules for every taxed country

- [x] 12.1 Support `tax.states.<id>.profile_rates` and country-wide `profile_rates` on every listed state (design.md §15) in the local builder; allow `tax.sources` as a list
- [x] 12.2 Research each taxed country × each preset tax profile; add `profile_rates` (lower, zero, exempt or higher) only with a source; add US state grocery and higher-rate entries and Canada's country-wide zero-rated groceries; add a tax profile to an industry only when needed _(Partly done. 37 countries now have profile rules. Added: investment gold exempt in all EU-27 (VAT Directive Art. 346); one 2026 rate per category for 20 EU members (hellotax, 30 June 2026); South Africa basic food 0; Canada groceries 0 in every province, plus Ontario, Nova Scotia, PEI, New Brunswick and Newfoundland book and children's goods rebates (CRA); US grocery treatment for 38 states (TaxJar, 1 May 2026) and Minnesota alcohol at 9.375%. Not added: the ~60 other taxed countries, because no reachable source gives their rates by category; categories with more than one rate in a country (for example food in ES, IT, IE, HU, PL, PT, HR, SK); and rows where the source conflicts with a 2026 change we know of (FI, SE food, SK, SI and CZ books, US IL, VA, AL, MD). No new tax profiles were needed.)_
- [x] 12.3 Tests: a higher state rate gives a rule above the standard rate; `CA` zero-rated profile appears on every province; a state rate replaces the country-wide rate; repository test accepts `source` or `sources`
- [x] 12.4 Verify: `bash kirki-test all`

## 13. Revision 2 — Configurations row

- [x] 13.1 Add `ONBOARDING_PRESETS` endpoint and `useApplyPresetsMutation` in `resources/app/features/onboarding/services/onboarding.ts`
- [x] 13.2 Wizard: send the presets request once after `createStore` succeeds (also after a successful retry); add the "Configurations" row ("Essentials, Shipping, Tax, Legal pages", Tax only when tax is collected); keep it in progress until the request settles; any result completes it; actions wait for it
- [x] 13.3 Tests for the wizard and the rows hook: row text with and without tax, spinner while presets run, completed after an error, actions disabled until then, no presets request after a setup failure _(Wizard tests only: the rows hook did not change. The wizard holds the setup status at `pending` until the presets request settles, so the hook keeps the last row in progress.)_
- [x] 13.4 Verify: `npm run typecheck && npm test` from `resources/app/`

## 14. Revision 2 — Docs

- [x] 14.1 Update `docs/onboarding.md`: two-request flow, preset source and URL constant/filter, response contract, silent skip and once-per-store flag, categories, no Rest of World, tax rule coverage, Configurations row; "Where this differs": no fallback when the server fails, no Rest of World, presets lost if the page closes between requests, excise not modelled
- [x] 14.2 Verify: `openspec validate industry-location-store-presets --strict`, `bash kirki-test all`, `npm run typecheck && npm test`

## 15. Revision 3 — Starter coupon moves to sample data

- [x] 15.1 Remove `common.coupons` from `presets.json` and `coupons` from the `LocalPresetSource` response; delete `CouponPresets` and remove it from `StorePresetService`
- [x] 15.2 Add `OnBoardingCatalog::get_coupons()` with the `WELCOME50` fields of design.md §8, and a `CouponSeeder` in `app/Setup/` that creates each coupon whose code is free, inactive, with `start_datetime` now and `created_by`/`updated_by` the current user
- [x] 15.3 Run `CouponSeeder` from `SampleDataImporter::import()` only when the demo products are created (no products before the import); update the importer docblock
- [x] 15.4 Tests: move the coupon tests from `StorePresetsTest` to the sample data tests (inactive, 50% off the order, all products, no end date; existing `WELCOME50` unchanged); a store that already has products gets no coupon; the presets request creates no coupon; update `OnboardingApiTest` assertions that expect a coupon after presets
- [x] 15.5 Update `docs/onboarding.md`: remove the coupon from the presets sections and the contract; add it to "Loading sample data"
- [x] 15.6 Verify: `openspec validate industry-location-store-presets --strict`, `bash kirki-test all`, phpcs on the changed PHP files

## 16. Revision 4 — Bundled data only, presets in store setup

- [x] 16.1 Rename `resources/data/presets.json` to `resources/data/preconfigured-data.json`; update `PresetRepository` and every reference in code, tests and docs
- [x] 16.2 Delete `RemotePresetSource`, the `PresetSource` interface, `DevHookNames::PRESETS_URL`, the `KIRKI_ECOMMERCE_PRESETS_URL` lookup, and the binding and `make_preset_source()` in `AppServiceProvider`; `LocalPresetSource` implements nothing and drops `version` from its records (design.md §18)
- [x] 16.3 `StorePresetService::apply()` gets `LocalPresetSource` from the container and no longer calls `record_preconfigured()`; `StoreSetupService::setup()` applies the presets (`PresetContext::from_settings()`, only when not applied) after the storefront pages and before `record_preconfigured()` and the store-created hook
- [x] 16.4 Remove `POST /onboarding/presets` and `OnboardingController::apply_presets()`
- [x] 16.5 Frontend: remove `ONBOARDING_PRESETS`, `applyPresets` and `useApplyPresetsMutation`, and the wizard's wait for the presets; the Configurations row stays and completes with the other rows; update the wizard and page tests
- [x] 16.6 PHP tests: setup writes every preset kind; setup that runs again changes nothing; a missing data file gives a successful setup with no presets; a malformed record is skipped (fake `LocalPresetSource`); a failing kind does not stop the others or fail setup; remove the presets-request and preset-server tests
- [x] 16.7 Docs: `docs/onboarding.md` drops the preset server, URL constant and filter, response contract, the second request and the remote call; uses the new file name
- [x] 16.8 Verify: `openspec validate industry-location-store-presets --strict`, `bash kirki-test all`, phpcs on the changed PHP files, `npm run typecheck && npm test` and eslint in `resources/app/`

## 17. Revision 5 — Micro-business region holds one country

- [x] 17.1 `TaxRegionBuilder::make_eu_region()`: write only the store's country with its standard rate (design.md §19)
- [x] 17.2 `EUTaxStrategy::get_rate()`: for `micro_business`, use the rate of the region's one country (first `countries` entry); 0 when there is none; drop the store address lookup
- [x] 17.3 Tests: `EUTaxStrategyTest` micro-business cases (one country, country differs from the store address, no country); preset test: an EU store's region holds only its country; check the other preset tests that expect 27 countries
- [x] 17.4 Docs: `docs/onboarding.md` EU preset text and the micro-business note in "Where this differs"
- [x] 17.5 Verify: `openspec validate industry-location-store-presets --strict`, `bash kirki-test all`, phpcs on the changed PHP files
