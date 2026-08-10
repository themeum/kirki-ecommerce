## 1. Make the default-record seeders idempotent

- [x] 1.1 `CurrencySeeder` — drop the hardcoded `"id" => 1`, insert only codes not already
      present, and claim `is_base` only when no base currency exists yet.
      **Corrected:** did NOT expand to a "common currency set". Every active currency row is
      selectable as a display currency and converts by its stored `exchange_rate`
      (`MoneyManager::resolve_requested_currency()`), so seeding EUR/GBP at the column default of
      `1.000000` would show dollar amounts labelled as euros. `GET /currencies/list` already
      serves the 155-entry `resources/data/currencies.json` as the merchant's picker, where they
      supply a real rate. Seeds USD-as-base only, which is all the spec requires.
- [x] 1.2 `ShippingProfilesSeeder` — insert only profiles whose `name` is absent
- [x] 1.3 `TaxProfilesSeeder` — insert only profiles whose `name` is absent
- [x] 1.4 `ShippingBoxesSeeder` — insert only boxes whose `name` is absent; do not add a second
      `is_default` box if one already exists
- [x] 1.5 `ProductSchemaSeeder` — insert only templates whose `name` is absent; do not add a
      second `is_default` template if one already exists
- [x] 1.6 Verify: `CurrencyApiTest`, `ShippingProfileApiTest`, `TaxProfileApiTest`,
      `ShippingBoxApiTest`, `ProductSchemaApiTest` all pass (46 tests, 523 assertions).
      **Corrected:** the double-run check is a new `tests/Integration/SeederIdempotencyTest.php`
      (4 tests) rather than running `wp kirki db:seed` twice — the seed command ignores
      `--class` when `DatabaseSeederContract` is bound, so a double run would also insert two
      rounds of demo products/orders/customers into the dev database. The test covers the real
      property on a clean schema: no duplicates, no unique-constraint error, one default of each
      kind, merchant edits preserved, a deleted default restored without duplicating others.
- [x] 1.7 Verify: `npm run typecheck && npm test` from `resources/app/`

## 2. Remove the duplicate settings-defaults source

- [x] 2.1 Delete `database/seeders/SettingsSeeder.php`
- [x] 2.2 Remove `SettingsSeeder::class` from `DatabaseSeeder`'s `call()` list
- [x] 2.3 Verify: `GET /settings/<key>` returns a complete payload for all 9 keys in
      `OptionKeys` with no settings option stored — covered by
      `SettingsDefaultsTest::test_every_section_resolves_without_a_stored_option`. This test
      surfaced two pre-existing fresh-install fatals; see the note under group 3.
- [x] 2.4 Verify: `npm run typecheck && npm test` from `resources/app/`

## 3. Neutralize the shipped settings defaults

- [x] 3.1 `resources/data/settings/general.json` — set `store_email` to `null`
- [x] 3.2 `resources/data/settings/tax.json` — set `is_enabled_taxed_price`,
      `is_tax_inclusive_price`, and `is_shipping_tax_enabled` to `false`, and `is_enabled` to
      `false` on every entry in `tax_regions`; leave the region definitions themselves in place
- [x] 3.3 `resources/data/settings/advance.json` — add the `pages` map with
      `shop`/`cart`/`checkout`/`account` all `null`
- [x] 3.4 Leave `resources/data/settings/shipping.json` untouched (its Bangladesh zone is
      deliberately retained so shipping stays testable — see design.md, Risks)
- [x] 3.5 Add an integration test asserting a fresh read of `GET /settings/tax` reports tax
      disabled and no enabled region, and `GET /settings/general` returns an empty store email —
      `tests/Integration/SettingsDefaultsTest.php` (6 tests), plus
      `tests/Support/ResetsSettingsState.php` to drop stored options and the static
      `SettingsFactory` cache between tests
- [x] 3.6 Verify: `SettingsDefaultsTest` and `SettingsApiTest` pass
- [x] 3.7 Verify: `npm run typecheck && npm test` from `resources/app/`

**Two pre-existing fresh-install fatals found and fixed here.** `GET /settings/shipping`
returned 500 on any install with no stored shipping option — i.e. every fresh install, the exact
scenario this change's spec requires to work:

1. `Undefined index: base_amount`. `SettingResource` read `$method['base_amount']`
   unconditionally, but no shipping method in the shipped `shipping.json` has that key. Fixed by
   null-coalescing the three money reads (`base_amount`, range `base_amount`,
   `base_free_shipping_min_amount`) and guarding the two `foreach`es. Not a behavior change for
   a stored payload that has the keys.
2. `Trying to get property 'code' of non-object` — `base_currency()->code` with an empty
   `currencies` table. This is the fatal the installer fixes, and it reaches further than
   proposal.md recorded: not just checkout, but any settings section rendering a money value.

## 4. Deprecate `product.shop_page`

- [x] 4.1 Remove `shop_page` from `resources/data/settings/product.json`
- [x] 4.2 Remove `data.shop_page` from `SettingsUpdateRequest::get_product_settings_rules()` and
      `get_product_settings_filters()` — the filters entry is what stops it persisting, since
      `Sanitizer` only emits keys named in the rules it is given
- [x] 4.3 Add an integration test asserting `GET /settings/product` contains no `shop_page`, and
      that a `PUT /settings` for the product key carrying a `shop_page` saves its other values
      without persisting the page reference — `SettingsDefaultsTest`, two tests
- [x] 4.4 Confirm the Products settings screen degrades as designed rather than erroring — the
      response omitting `shop_page` still validates against `schemas/catalog/settings.ts`
      (`.nullish()`), so the field clears on save. No frontend files change in this task
- [x] 4.5 Verify: `SettingsDefaultsTest` and `SettingsApiTest` pass
- [x] 4.6 Verify: `npm run typecheck && npm test` from `resources/app/`

## 5. Storefront page constants and settings keys

- [x] 5.1 Add `app/Constants/StorefrontPages.php` — a constants-only `final` class holding the
      four view identifiers (`shop`, `cart`, `checkout`, `account`) and their default titles and
      slugs
- [x] 5.2 Add the install-version marker constant.
      **Corrected:** NOT in `OptionKeys`. That class doubles as the allow-list for
      `GET /settings/{key}` (`'in:' . implode(',', OptionKeys::get_constant_values())`), and
      `SettingsController::get()` calls `->to_array()` on whatever `SettingsFactory` resolves —
      which is `null` for any constant that is not a settings section. Adding
      `INSTALLED_VERSION` there made `GET /settings/installed_version` an uncaught
      `Call to a member function to_array() on null`, verified by probe. It lives in a new
      `app/Constants/Install.php` instead.
- [x] 5.3 Verify: `npm run typecheck && npm test` from `resources/app/`

## 6. The installer

- [x] 6.1 Add `app/Installer.php` with `run()` and a version gate that returns early when the
      stored install version already equals `KIRKI_ECOMMERCE_VERSION`
- [x] 6.2 `seed_default_records()` — call `run()` on the five seeders from task group 1
- [x] 6.3 `create_storefront_pages()` — for each view, keep the existing mapped page if its ID
      still resolves to a live page, otherwise create a published page and update that one entry.
      A trashed page counts as missing.
- [x] 6.4 Write the resulting map to `advance.pages`, read-modify-writing the stored option
      directly via `Option::get`/`Option::set` rather than `Settings::update` (see design.md —
      Writing settings via `Option::set`). Write no page reference to any other section
- [x] 6.5 `mark_installed()` as the final statement in `run()`, so a mid-install failure leaves
      the marker unset and the next activation retries
- [x] 6.6 Call `Installer::run()` from `KirkiEcommerce::handle_activation()`, after
      `migrator()->run()` and before `Scheduler::setup()`
- [x] 6.7 Verify: `npm run typecheck && npm test` from `resources/app/`

## 7. Install verification

- [x] 7.1 Add an integration test covering a first install — `tests/Integration/InstallerTest.php`
- [x] 7.2 Add an integration test covering re-running the install — same file, covers both the
      same-version no-op and a version bump
- [x] 7.3 Add an integration test covering a deleted page, plus a trashed page
- [x] 7.4 Verify checkout on a fresh install.
      **Corrected:** automated rather than manual — CLAUDE.md §0 forbids browser verification,
      and the property is testable. `tests/Integration/FreshInstallCheckoutTest.php` runs the
      installer, creates a product, and POSTs `/checkout` with no `currency_code`, asserting a
      201. This is the `base_currency()->code` fatal from proposal.md — Why.
- [x] 7.5 Verify onboarding still switches the base currency after install.
      **Required a fix:** with only USD provisioned, `CurrencyService::set_base('EUR')` still
      threw `NotFoundException` — onboarding could only ever pick the currency it started with,
      which defeats its purpose. `set_base()` now stocks an unstocked-but-supported currency
      from the reference catalogue (`resources/data/currencies.json`) at `exchange_rate` 1,
      which is correct by definition for a base currency, before switching to it.
- [x] 7.6 Verify: `./kirki-test all` — 316 tests, 3046 assertions. 3 failures, all
      **pre-existing**: `CartApiTest::test_get_cart_returns_empty_cart_initially`,
      `CartApiTest::test_cart_item_and_address_lifecycle`, and
      `OrderApiTest::test_create_refund_on_order`. Confirmed by stashing this change and running
      them against the pristine tree — identical failures. Not investigated further; out of
      scope.
- [x] 7.7 Verify: `npm run typecheck && npm test` from `resources/app/` — 57 files, 359 tests

## 8. Packaging note

- [x] 8.1 Add a comment in `bin/make-package.sh` next to `OPTIONAL_PATHS` recording that
      `database/` is now a runtime dependency of the installer, not dev-only, so it cannot be
      dropped from the package
- [x] 8.2 Verify: `npm run make:package` produces `build/kirki-ecommerce-1.0.0.zip` containing
      all five seeders, `app/Installer.php`, both new constants classes, and
      `resources/data/settings/advance.json` — and no `SettingsSeeder.php`
