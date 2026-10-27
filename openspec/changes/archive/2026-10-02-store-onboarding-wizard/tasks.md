## 1. Onboarding state and seed entry points (PHP)

- [x] 1.1 Add `OptionKeys::ONBOARDING_COMPLETED_AT` and an `app/Supports/Onboarding.php` helper with `is_completed()` / `mark_completed()` (stores a Unix timestamp via the `Option` facade) (design D1)
- [x] 1.2 Collapse `config/version-updates.php` to `before_each` (migrator) + a single no-op `'1.0.0-beta.1'` entry; drop the `OnBoardingSeeder` / `Utils` imports it no longer uses (design D11)
- [x] 1.3 Remove `CurrencySeeder` and `ProductSeeder` from `OnBoardingSeeder::run()`'s `call()` list, ordering `SettingsSeeder` first, then Category, Attribute, ProductSchema; update its docblock to describe the baseline queue
- [x] 1.4 Delete `database/seeders/OnBoarding/CurrencySeeder.php` (its only caller is gone)
- [x] 1.5 Add `store_tax_id: null` to `resources/data/settings/general.json`
- [x] 1.6 Verify: `composer test:docker:unit` passes, then `npm run typecheck && npm test` in `resources/app/`

## 2. Store setup service and API (PHP)

- [x] 2.1 Add `CurrencyService::ensure_base(string $code)`: find-or-create the currency from the bundled `list()` definition (exchange rate 1, active) and make it the sole base, demoting others; leave `set_base()` untouched (design D9.4)
- [x] 2.2 Add `DevHookNames::STORE_CREATED = 'kirki_ecommerce_store_created'`
- [x] 2.3 Create `StoreSetupDTO` and `app/Services/StoreSetupService.php` with `setup()` running `seed_baseline()` → `save_general_settings()` (name, industry, tax ID, address with injected country, `is_tax_calculation_enabled`) → `save_tax_settings()` (`is_tax_inclusive_price`) → `ensure_base` → `Utils::generate_site_pages()` → empty `apply_presets($industry, $country)` → `do_action(DevHookNames::STORE_CREATED, $payload)`
- [x] 2.4 Rework `OnboardingRequest`: `store_name` required; `industry` nullable (default `other`); `country` required and present in `resources/data/countries.php`; `currency` required and present in `CurrencyService::list()`; all `store_address.*` nullable with no `store_address.country`; `is_tax_collected`, `is_tax_inclusive_price` booleans; `store_tax_id` nullable; drop `default_currency` / `should_import_samples`
- [x] 2.5 Rework `OnboardingController::store`: 409 when `Onboarding::is_completed()`; ignore tax-inclusive / tax ID when tax not collected; call `StoreSetupService::setup()`; `Onboarding::mark_completed()` only after success; respond with the resolved summary (country name, currency code + symbol, page titles, tax mode)
- [x] 2.6 Create `app/Services/SampleDataImporter.php` with `import()` queuing and draining the onboarding `ProductSeeder`; docblock marks the body as the future remote-import replacement point (design D10)
- [x] 2.7 Add `OnboardingController::import_sample_data` (409 when not onboarded) and register `POST /onboarding/sample-data` in `routes/api.php` inside the Auth+Admin middleware group
- [x] 2.8 Integration tests (`tests/Integration/OnboardingApiTest.php`): validation errors (missing name, unknown country/currency); successful setup writes general/tax settings, preserves an existing `store_email`, creates one base currency, creates the four pages, seeds baseline data, does not create products, writes the completion option, fires `kirki_ecommerce_store_created` once; retry after partial run creates no duplicates; setup after completion returns 409 and changes nothing; non-admin rejected; sample-data rejected before onboarding, seeds products after, no-op when products exist
- [x] 2.9 Verify: `composer test:docker` passes, then `npm run typecheck && npm test` in `resources/app/`

## 3. Activation redirect and boot config (PHP)

- [x] 3.1 `KirkiEcommerce::handle_activation($network_wide = false)`: set a 30s `kirki_ecommerce_activation_redirect` transient unless network-wide, `WP_CLI`, or already onboarded (design D2)
- [x] 3.2 Add `app/Wordpress/Hooks/Actions/RedirectToOnboarding.php` on `admin_init`: always delete the transient; bail on AJAX, `activate-multi`, missing `manage_options`, or completed onboarding; else `wp_safe_redirect(admin_url('admin.php?page=kirki-ecommerce#/onboarding'))` + `exit`; register it in `config/hooks.php`
- [x] 3.3 Add `is_onboarded` (and `assets_url` if absent) to `Assets::get_kirki_ecommerce_configs()`; add both to `KirkiEcommerceConfig` in `resources/app/global.d.ts`
- [x] 3.4 Integration tests for the redirect action: single activation redirects once; bulk activation, CLI, and completed onboarding do not
- [x] 3.5 Verify: `composer test:docker` passes, then `npm run typecheck && npm test` in `resources/app/`

## 4. Tax ID in General settings (React)

- [x] 4.1 Add `store_tax_id` to `GeneralSettingsFormShape` and its transform (`|| null`), and update `general-settings-form` payload test for it _(also needed: `data.store_tax_id` validation rule + sanitizer in `SettingsUpdateRequest`, otherwise the General settings save would pass it through unsanitized)_
- [x] 4.2 Add a "Tax ID" `TextField` to the store details card on the General settings page; update its `data-search-keywords` / settings search index entry if the card is indexed _(added to Store Contact Details; the "prints on your invoices" note was left off the settings field because its word "print" fuzzy-matched "points" and broke a search-relevance test; the index is generated and gitignored)_
- [x] 4.3 Verify: `npm run typecheck && npm test` in `resources/app/`

## 5. Onboarding feature foundation (React)

- [x] 5.1 Create `features/onboarding/` with `routes.tsx`, `pages/`, `schemas/forms/`, `services/`, `lib/`
- [x] 5.2 Add `schemas/forms/onboarding-form.ts` per the canonical pattern (fields, defaults, transform that trims, nulls empty address fields, and clears tax-inclusive / tax ID when tax is off) plus `onboarding-form.test.ts` covering defaults, the tax-off clearing, and the address nulling (design D5)
- [x] 5.3 Add the industry option constant (slug + `__()` label, `other` last) and a `STEP_FIELDS` map for per-step `form.trigger`
- [x] 5.4 Add `lib/onboarding-status.ts` (module store seeded from `window.kirki_ecommerce.is_onboarded`, with a hook to read and a setter) (design D3)
- [x] 5.5 Add `lib/timezone-countries.ts` (tzdb zone → ISO2 map) and `lib/detect-country.ts` (timezone, then `navigator.languages[0]` region, accepted only if in the given country list), with `detect-country.test.ts` covering `Asia/Dhaka`→BD, `UTC`+`en-GB`→GB, and nothing-detectable→empty (design D7)
- [x] 5.6 Add `lib/currency-flag.ts` (regional-indicator emoji from the first two code letters when that pair is a known country code or `EU`, else none) with a test for USD, EUR, XAF (design D8)
- [x] 5.7 Add `lib/onboarding-draft.ts` (sessionStorage read/write/clear under `kirki-ecommerce:onboarding-draft`, every access in try/catch) with a test including throwing storage (design D6)
- [x] 5.8 Add `services/onboarding.ts` with `useCreateStoreMutation` (`POST /onboarding`, on success: clear draft, set onboarded) and `useLoadSampleDataMutation` (`POST /onboarding/sample-data`), parsing responses with the existing `parseData`/`parseResponse` helpers
- [x] 5.9 Verify: `npm run typecheck && npm test` in `resources/app/`

## 6. Gate and full-screen shell (React)

- [x] 6.1 Add `OnboardingGate` layout element (`<Navigate to="/onboarding" replace />` while not onboarded, else `<Outlet />`) and wrap the existing route children with it in `routes.tsx`
- [x] 6.2 Add `OnboardingLayout` as a top-level sibling route at `/onboarding` outside `UnsavedChangesController`, redirecting to `/` when onboarded _(split as page `pages/onboarding.tsx` (redirect guard, which also requires no active setup session, see design corrections) + `components/onboarding-shell.tsx`; admin bar/menu hidden via a Global style because no z-index fits between `#wpadminbar` (99999) and app dropdowns (100000); new `theme.zIndex.fullscreen`; gate covered by `tests/components/onboarding-gate.test.tsx`)_; render the fixed full-screen overlay (above `#wpadminbar`), the 20px logo, the step header (`ProgressBar`, "Step N of 3", step name / "Setup complete"), and a fixed-min-height card (design D4)
- [x] 6.3 Add a route-config entry for onboarding in `config/route-config`
- [x] 6.4 Verify: `npm run typecheck && npm test` in `resources/app/`

## 7. Wizard screens (React)

- [x] 7.1 Wizard container: one `useForm` with `zodResolver(OnboardingFormSchema)`, defaults merged from the restored draft, step state restored from the draft, debounced draft writes on value/step change, Back/Continue wired through `STEP_FIELDS`
- [x] 7.2 Step 1 "Let's set up your store": store name `TextField` (placeholder "e.g., Acme Store"), industry via `Combobox` with search (empty → `other` on Continue), Continue only
- [x] 7.3 Step 2 "Where do you sell from?": `CountryField` labelled "Country", country detection on first entry when empty, "+ Add address" toggle revealing line 1, line 2, city, postcode, and `StateField` driven by the selected country, Back/Continue
- [x] 7.4 Step 3 "Setup the essentials": searchable currency select (flag, code, name, symbol) from `GET /currencies/list`, preselected from the country's currency only when untouched; "Collect sales tax?" Yes / No, not yet (default No) as a button-group radio; when Yes: "Prices on your storefront" (default "Tax added at checkout") and optional Tax ID with "The Tax ID prints on your invoices."; info note about Shop/Cart/Checkout/Account pages; Back / Create Store (guarded against double submit)
- [x] 7.5 Completion screen "Your store is almost ready" / "Here's what we set up for you": rows for Location (country name), Currency ("USD ($)"), Store pages, Tax (only when collected) with spinner → check states from the create mutation; error state with "Try again" resubmitting the same payload; "Go to dashboard" → `/`; "Load sample data" with loading state → `/` on success, error toast on failure; both disabled while setup runs
- [x] 7.6 Verify: `npm run typecheck && npm test` in `resources/app/`, plus `npm run lint` _(lint: 3 errors, all pre-existing in untouched `components/ui/accordion.tsx` and `components/ui/text.tsx`; none in this change)_

## 8. Docs and specs housekeeping

- [x] 8.1 Write `docs/onboarding.md` following `docs/cache.md`'s structure _(`docs/cache.md` does not exist in this repo; followed the sibling `docs/legal-consents.md` / `docs/emails.md` structure, with a "Where this differs from WooCommerce's setup wizard" section)_: TOC, quick start (activation → wizard → Create Store), what Create Store writes, the completion option, the gate, extension points (`kirki_ecommerce_store_created`, `apply_presets`, `SampleDataImporter`), resetting onboarding in development, and known limitations (demo prices are USD figures in the base currency; Tax ID not yet printed on invoices)
- [x] 8.2 Run `openspec validate store-onboarding-wizard --strict` and fix any reported issues
- [x] 8.3 Verify: `npm run typecheck && npm test` in `resources/app/`; flag to the user that the wizard's visual layout needs their manual check in wp-admin (browser verification is not used in this project)

## 9. Back button beside the step title

- [x] 9.1 In `components/step-layout.tsx`, add an optional `onBack` prop. When it is set, render a `secondary` `icon-sm` `Button` with `ChevronLeft` and `aria-label` "Back" to the left of the title, vertically centred with it
- [x] 9.2 In `business-info-step.tsx` and `essentials-step.tsx`, pass `onBack` to `StepLayout`, remove the footer Back button and its `Grid`, and keep only the full-width primary button. Remove imports that become unused
- [x] 9.3 Add a test in `tests/components/onboarding-wizard.test.tsx`: on step two the Back icon button returns to step one, and step one has no Back button
- [x] 9.4 Update `docs/onboarding.md` if it describes the Back button placement _(no change: the doc does not describe the button placement)_
- [x] 9.5 Run `npm run typecheck`, lint and `npm test` in `resources/app/`. Ask the user to check the layout visually _(typecheck and lint on `features/onboarding` are clean. 2 tests fail because of earlier user edits outside this group: the new store-name placeholder (`onboarding-wizard.test.tsx`) and the removed "Cash on delivery" button (`features/home/tests/lib/steps.test.ts`))_
