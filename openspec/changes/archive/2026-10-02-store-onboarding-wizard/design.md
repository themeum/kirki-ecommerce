## Context

See proposal.md for motivation. This section covers only the current state that
shapes the approach.

- **Install-time seeding.** `config/version-updates.php` runs the migrator before every
  version entry. Its `1.0.0-alpha.1` entry calls `Utils::generate_site_pages()` and the
  `OnBoardingSeeder` queue: Currency, Category, Attribute, ProductSchema, Settings and
  Product seeders. Each child seeder already guards its own target, so they are
  idempotent.
- **Settings seeding.** `SettingsSeeder::seed()` writes a settings group only when its
  option is `null`. `AppSettings::set()` merges into the stored array.
- **Existing onboarding endpoint.** `OnboardingController::store` (`POST /onboarding`,
  behind `AuthMiddleware` and `AdminMiddleware`) exists but nothing calls it. It
  requires a full address, and it calls `CurrencyService::set_base()`, which throws
  when no row exists for the code.
- **Plugin admin page.** `Root` (`?page=kirki-ecommerce`) mounts the SPA, which uses a
  hash router (`createHashRouter` in `resources/app/routes.tsx`). Boot config reaches
  the SPA as `window.kirki_ecommerce`, built by `Assets::get_kirki_ecommerce_configs()`.
- **Activation hook.** `KirkiEcommerce::handle_activation()` is a no-op today.
- **Reference data.**
  - Countries: `resources/data/countries.php`, where each entry carries `currency` and
    an emoji `flag`.
  - Currencies: `resources/data/currencies.json` with `code`, `symbol`, `name` and
    `locale`, and no flag.
  - `CountrySelector` already renders emoji flags.
- **Tax switches.** Tax on/off is `general.is_tax_calculation_enabled`. Tax-inclusive
  pricing is `tax.is_tax_inclusive_price`. `tax.tax_ids` exists but the tax page
  always resets it to `[]`, so it is not a usable home for a Tax ID.
- **Currency settings.** `currency.json` has no base-code key. The base currency is
  carried only by `currencies.is_base`. The current spec's "currency settings name
  USD" scenario is stale, and this change removes that requirement.

## Goals / Non-Goals

**Goals:**
- The gate decision is server-authoritative but costs no extra request. It is read
  from the boot config.
- Store setup is one request that can be retried safely.
- Seams exist for the out-of-scope work: industry/location presets and the remote
  sample data import.

**Non-Goals:**
- Printing the Tax ID on invoices.
- Real industry/location presets.
- Remote sample data import.
- A "re-run onboarding" tool.
- Persisting the wizard draft on the server.

## Decisions

### D1. Completion record: `OptionKeys::ONBOARDING_COMPLETED_AT`

Store the Unix timestamp through the `Option` facade. A timestamp and a boolean cost
the same, and the timestamp is useful for support. The gate checks for existence
(`!empty`).

A small `Onboarding` helper (`app/Supports/Onboarding.php`) exposes
`is_completed()` and `mark_completed()`. The helper is needed because the activation
hook, the boot config, both controllers and the version-update logic all read the
flag.

### D2. Activation redirect: transient set on activation, consumed on `admin_init`

`handle_activation($network_wide)` sets a 30-second transient
`kirki_ecommerce_activation_redirect`. It does not set it when:
- `$network_wide` is true;
- the request comes from `WP_CLI`;
- onboarding is already complete.

A new action class, `app/Wordpress/Hooks/Actions/RedirectToOnboarding.php`, is
registered in `config/hooks.php` on `admin_init`. It:
1. reads and **always deletes** the transient (one-shot);
2. bails out on AJAX requests, on `activate-multi` (bulk activation), when the user
   lacks `manage_options`, or when onboarding is complete;
3. otherwise calls `wp_safe_redirect(admin_url('admin.php?page=kirki-ecommerce#/onboarding'))`.

A `Location` header keeps the fragment, so the hash route is reached directly.

The standard alternative is a redirect inside the activation hook. It is not possible:
activation runs inside `plugins.php`, before output, and in the bulk path.

### D3. Route gating in the SPA, not PHP

The boot config gains `is_onboarded: bool`. `routes.tsx` changes as follows:
- `/onboarding/*` becomes a top-level sibling route, outside
  `UnsavedChangesController`, rendered by `OnboardingLayout`.
- The existing children are wrapped by an `OnboardingGate` layout element. It renders
  `<Navigate to="/onboarding" replace />` while not onboarded, otherwise `<Outlet />`.
- `OnboardingLayout` does the reverse, redirecting to `/` once onboarded.

The client-side flag lives in a tiny module store (`features/onboarding/lib/onboarding-status.ts`).
It is seeded from `window.kirki_ecommerce.is_onboarded` and set to `true` by the
create mutation's `onSuccess`, so the gate opens without a reload.

A PHP-side redirect cannot see the hash and so cannot gate per route. Gating the whole
`?page=kirki-ecommerce` request would need a separate admin page, which was rejected
in grilling.

The wp-admin menu links are bare hash changes. The existing `Root` menu handler hands
them to the router, so they hit the gate too.

### D4. Full-screen shell

`OnboardingLayout` renders a `position: fixed; inset: 0` container. Its `z-index` sits
above `#wpadminbar` (99999) and `#adminmenuwrap`, with the page background colour.
Inside, a centred column about 640px wide holds:
- the logo, as `<img>` of `assets/images/kirki-ecommerce.svg` (URL from
  `KIRKI_ECOMMERCE_ASSETS_URL`, exposed as `assets_url` in the boot config if not
  already there), `height: 20px`;
- the step header, using the existing `ProgressBar` UI component;
- a `Card` with a fixed minimum height, so the actions stay anchored at the bottom
  without layout shift between steps.

Leaving admin chrome in the DOM and covering it avoids touching WordPress markup.

### D5. One form across the steps, with per-step validation

`features/onboarding/schemas/forms/onboarding-form.ts` follows the canonical
`prepareFormSchema(...).transform(...)` pattern and has a payload test.

- Fields: `store_name`, `industry` (defaults to `'other'`), `country`,
  `store_address` (line 1, line 2, city, state, postal code — all optional),
  `currency`, `is_tax_collected` (defaults to `false`), `is_tax_inclusive_price`
  (defaults to `false`), `store_tax_id`.
- The transform trims strings, nulls empty address fields, and zeroes
  `is_tax_inclusive_price` and `store_tax_id` when tax is not collected.
- Each step's Continue calls `form.trigger(STEP_FIELDS[step])` before advancing.
  `requiredWhen()` is not needed: the only conditional fields are optional.
- The industry list is a constant of `{ value: slug, label: __() }` pairs, rendered
  with the existing `Combobox` (it has search, matching screenshot 5).
- Yes/No and the pricing choice use the `button-group` radio pattern.

### D6. Draft persistence

The wizard keeps `{ step, values }` under the sessionStorage key
`kirki-ecommerce:onboarding-draft`.
- It is written on `watch` (debounced) and on step change, and read once for
  `defaultValues`.
- Every access is wrapped in try/catch, so storage that throws or is disabled
  degrades to in-memory only.
- The key is removed in the create mutation's `onSuccess`.
- Steps 4+ are never persisted; the completion screen is reached only through
  Create Store.

### D7. Detection runs once, on first entry to a step

- **Country.** Detected only when `country` is empty on entering step 2. This covers
  the "Back keeps the override" scenario and a restored draft.
- **Currency.** Derived on entering step 3 only when `currency` is empty and has never
  been set. A `currency_touched` flag lives in the draft but not in the payload, so a
  later country change never overwrites the merchant's choice.

The timezone table is a bundled `zone → ISO2` map (`features/onboarding/lib/timezone-countries.ts`)
generated from tzdb's `zone1970.tab`/`backward` aliases, about 400 entries and a few KB.
Fallback: the region subtag of `navigator.languages[0]`, found with `Intl.Locale`.
Either result is accepted only if it exists in the loaded country list.

### D8. Currency list and flags

The list comes from the existing `GET /currencies/list` endpoint (the bundled
`currencies.json`), the same source the multi-currency "Add currency" dialog uses. The flag is the regional-indicator emoji of
`code.slice(0, 2)`. It is shown only when that pair is a country code in the loaded
country list, or `EU`. ISO 4217 codes start with the issuing region for national
currencies, and supranational `X**` codes (XAF, XOF, XDR…) correctly fall through to
"no flag".

A per-currency flag table would add maintenance for no visible gain.

### D9. Server: `StoreSetupService` behind a reworked `OnboardingController`

`OnboardingRequest` validates:
- `store_name`: required string;
- `industry`: nullable;
- `country`: required, and must exist in the countries data (closure or custom rule;
  the framework has no `in:` usage to lean on);
- `currency`: required, and must exist in `CurrencyService::list()`;
- `store_address.*`: nullable;
- `is_tax_collected` and `is_tax_inclusive_price`: booleans;
- `store_tax_id`: nullable text.

`store()` does the following:
1. If `Onboarding::is_completed()`, respond 409 (spec: setup after completion is
   rejected).
2. Call `StoreSetupService::setup(StoreSetupDTO)`, which runs, in order:
   1. `seed_baseline()` — queue and drain Category, Attribute, ProductSchema and
      Settings seeders. Settings come first so wizard writes merge over the defaults.
   2. `save_general_settings()` — one `Settings::get(GENERAL)->set([...])` with the
      name, industry, tax ID, `store_address` (country injected) and
      `is_tax_calculation_enabled`.
   3. `save_tax_settings()` — `is_tax_inclusive_price`.
   4. `set_base_currency()` — inside `with_demoted_bases`-style logic: find by code or
      create from the `list()` definition (rate 1, active), then mark it base and
      demote the others. This adds a `CurrencyService::ensure_base(string $code)`
      instead of changing `set_base()`, whose throw-on-missing contract the currency
      settings page relies on.
   5. `Utils::generate_site_pages()` — already idempotent.
   6. `apply_presets($industry, $country)` — empty body.
   7. `do_action(DevHookNames::STORE_CREATED, $payload)` — a new constant
      `'kirki_ecommerce_store_created'`, alongside `ORDER_PLACED`.
3. Call `Onboarding::mark_completed()` only after `setup()` returns.

Writes are not wrapped in one DB transaction. Options, posts and custom tables cross
transaction boundaries in WordPress, so retry-safety (every step is idempotent)
replaces atomicity.

The response returns the resolved summary: country name, currency code and symbol, and
page titles. Screen 4 renders from server truth rather than from form state.

### D10. Sample data: `SampleDataImporter::import()`

`POST /onboarding/sample-data` returns 409 when not onboarded. Otherwise it calls
`SampleDataImporter::import()`, which currently queues and drains the onboarding
`ProductSeeder` only. Its guard (no products), media reuse and bundled-image cleanup
carry over unchanged.

The class docblock marks the body as the replacement point for the remote import.

`ProductSeeder::resolve_base_currency_id()` already uses whichever currency is base,
so demo prices are numerically the USD catalog values in the merchant's currency. This
is accepted for demo data; see Risks.

### D11. Seeder entry points and version updates

- `OnBoardingSeeder` is renamed in role to the baseline queue. It drops
  `CurrencySeeder` and `ProductSeeder` from its `call()` list.
- `CurrencySeeder` (onboarding) is deleted. Its only caller is gone, and its USD
  behaviour is superseded.
- `config/version-updates.php` becomes `before_each` (migrator) plus
  `'1.0.0-beta.1' => function () {}`. The comment keeps "needed for running the
  migrator".

### D12. Tax ID in General settings

- `store_tax_id` is added to `resources/data/settings/general.json` as `null`.
- It is added to `GeneralSettingsFormShape` and its transform (`|| null`), with the
  payload test updated.
- A `TextField` is added to the store details card on the General settings page.
- The settings search index entry is updated if that card is indexed by keywords.

## Risks / Trade-offs

- **[Risk] Demo product prices are USD numbers shown in another currency** (e.g. ৳25
  for a hoodie). → Accepted for demo data, and documented in `docs/onboarding.md`.
  The remote import replaces the bundled seeder later.
- **[Risk] A long store-setup request** (seeding plus page inserts) could hit a slow
  host's timeout. → The baseline seeds are small and contain no media (media is only
  in sample data). Retry is safe by design.
- **[Risk] A full-screen overlay hides admin notices**, such as those from other
  plugins. → Acceptable for a three-step wizard. Notices reappear on the next page.
- **[Risk] Timezone detection picks the wrong country for travellers.** → The country
  is an editable preselection, never auto-submitted.
- **[Trade-off] No transaction around setup.** → Each step is idempotent and
  completion is written last, so a crash leaves a retryable, not-onboarded store.
- **[Risk] An emoji flag renders as two letters on Windows Chrome.** → Same behaviour
  as the existing `CountrySelector`, so it is consistent rather than new.
- **[Trade-off] The gate is client-side.** A merchant could call plugin REST endpoints
  before onboarding. → That is harmless: the gate is a UX guarantee, not a security
  boundary. REST stays protected by `AdminMiddleware`.

## Migration Plan

- No data migration. Alpha installs are unsupported (decided during grilling). Dev
  databases can be reset, or `ONBOARDING_COMPLETED_AT` can be set by hand to skip
  the wizard.
- Rollback means reverting the change. No schema migrations are introduced.


## Corrections during implementation

- **D3, the wizard's own redirect.** "`OnboardingLayout` redirects to `/` once onboarded"
  was wrong as written. The client flag flips when Create Store succeeds, which would
  eject the merchant from the completion screen before they could choose "Go to
  dashboard" or "Load sample data". The client store
  (`features/onboarding/lib/onboarding-status.ts`) now also tracks a setup session:
  - it begins on Create Store and ends when the merchant leaves the completion screen;
  - the layout redirects only when onboarded **and** no session is active;
  - a reload starts with no session, so "refreshing the completion screen redirects
    to `/`" still holds.
- **D7, `currency_touched`.** Dropped. Preselecting the currency only while the field
  is empty already gives "a later country change keeps the chosen currency". The
  extra flag would only have changed behaviour after the merchant cleared the field
  by hand.
- **D9, test isolation (not a product change).** `CurrencyService::with_demoted_bases()`
  issues `START TRANSACTION` on WordPress's connection. In the WP test harness this
  implicitly commits the per-test transaction, so options written earlier in the same
  request survive the rollback. Store setup's options then leaked
  `is_tax_calculation_enabled = false` into `OrderApiTest`. `OnboardingApiTest::tearDown`
  deletes and commits those options after the rollback. This is pre-existing harness
  behaviour; other tests that create a base currency are exposed to it too.
- **Step navigation layout.** Steps two and three first had Back and the primary
  action side by side in the footer. Back is now an icon button (`ChevronLeft`,
  `aria-label` "Back") beside the step title, rendered by `StepLayout` when it gets
  an `onBack` prop. The footer holds only the primary action, at full width. Step
  one passes no `onBack`, so its title has no button.
