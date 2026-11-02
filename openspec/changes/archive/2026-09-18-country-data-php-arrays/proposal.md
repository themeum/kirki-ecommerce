## Why

The country/state dataset lives in a single 552KB `resources/data/countries.json` that is
read with `file_get_contents` + `json_decode` on **every** call, with no caching anywhere:
`Utils::get_countries()` re-reads the file each time it is invoked, and `OrderResource`
calls `CountryService::find()` twice per order with no singleton binding. Lookups by
country code linear-scan all 250 entries. The file ships inside the plugin zip even though
only the decoded form is ever used.

The format also blocks two things we want next: the names cannot be picked up by
`wp i18n make-pot` (JSON is not scanned for gettext calls, so all 250 country names are
permanently English), and there is no way to serve the country list without also serving
all 4,991 states.

This change converts the dataset to generated PHP arrays and splits countries from states,
as a behaviour-preserving refactor that unblocks both follow-ups without taking on their risk.

## What Changes

- **Source moves out of the shipped tree.** `resources/data/countries.json` moves to a new
  `data-src/countries.json` at the repo root. `bin/make-package.sh` copies `resources/data`
  wholesale, so relocating the source is what keeps the authoring file out of the package.

  **Corrected after measuring:** the planning notes framed this as "the zip drops 552KB".
  That was wrong - it counted the 564,924-byte JSON leaving but not the 522,047 bytes of
  generated PHP arriving. The real package saving is 42,877 bytes (7%). The value of this
  change is at runtime (OPcache, no per-call decode, O(1) lookup), not in package size.
- **Two generated PHP files replace it**, both committed:
  - `resources/data/countries.php` — index keyed by ISO code, with a `has_states` flag, no
    nested states.
  - `resources/data/states.php` — keyed by country code; each state carries `id` (the
    existing opaque numeric id) and `name`.

  **Revised during implementation:** the plan was for state entries to also carry an ISO
  3166-2 `code`. The source dataset turns out to hold only `id` and `name` for all 4,991
  states, and an ISO code cannot be derived from a state name, so the field would have been
  null everywhere. It is dropped; the stable-identifier problem is deferred to a future
  dataset re-import, which is the only point at which real codes can be supplied.
- **`bin/generate-country-data.php`** regenerates both from the source JSON, with a CI check
  asserting regeneration produces no git diff so the two cannot drift.
- **Loading becomes lazy and memoized.** Data is resolved on first access and cached in a
  static, never at file scope — so `__()` can be added later without tripping WordPress 6.7+'s
  `_doing_it_wrong` notice for translations triggered before `init`.
- **`CountryService` gains an O(1) keyed lookup** internally and is bound as a singleton.
- **`CurrencySwitcherService` stops loading all 4,991 states** to resolve a flag emoji; it
  reads only the index.
- **Public output shapes are unchanged.** `Utils::get_countries()` and `GET /countries`,
  `GET /countries/{code}` return the identical nested structure they return today. The split
  is internal, reassembled and memoized. No TypeScript changes at all.
- **BREAKING (bug fix): `GET /countries?group=eu` now returns a JSON array.** It currently
  returns a JSON *object* keyed by source array positions (`{"14":{…},"20":{…},"33":{…}}`),
  because `CountryService::all()` filters with a key-preserving `array_filter`. No caller
  passes `group` — all ten admin call sites request `{ limit: -1 }` only — so this is
  unreachable from the product today. The same method also mutates `$this->data` while
  filtering, which becomes a real cross-request leak once the service is a singleton, so
  it must be fixed as part of this change rather than deferred.

### Explicitly out of scope

- The ~235KB inline checkout payload. `PageInlineScript` keeps inlining the full dataset
  exactly as today. No lazy state loading, no new public REST endpoint, no storefront JS
  changes. That is a follow-up change this one enables.
- Wrapping names in `__()`, locale-aware sorting, and combobox search — a separate change.
- Changing the value persisted to `addresses.state` / `orders.shipping_state` /
  `orders.billing_state`. It stays the numeric `id`. No schema change (columns are already
  `string(100)`), and no stable alternative key is introduced - see the revision note above.
- `currencies.json`, `european_union_countries.json`, `order-state-matrix.json`, and
  `resources/data/settings/` are untouched.

## Capabilities

### New Capabilities

- `country-reference-data`: how the country/state dataset is stored, generated, loaded, and
  served — the storage contract (generated PHP, not shipped JSON), the guarantee that the
  public output shape is stable, and the response shape of the country endpoints including
  the `group` filter.

### Modified Capabilities

<!-- None. No existing spec covers the country dataset. -->

## Impact

**Data / tooling**
- `resources/data/countries.json` → `data-src/countries.json` (no longer packaged)
- new `resources/data/countries.php`, `resources/data/states.php` (generated, committed)
- new `bin/generate-country-data.php`
- `.github/workflows/tests.yml` — new regeneration-drift check

**PHP call sites**
- `app/Services/CountryService.php` — keyed lookup, singleton, `all()` mutation + key-preservation fix
- `app/Supports/Utils.php:357` `get_countries()` — memoized
- `app/Services/CurrencySwitcherService.php:148` — index only
- `app/Resources/Site/Order/OrderResource.php:129-130` — benefits from the singleton binding
- `app/Hooks/Filters/PageInlineScript.php:86,141` — unchanged output, verify
- `app/Http/Controllers/Site/SiteController.php:217`, `AccountController.php:198` — unchanged output, verify
- `app/Http/Controllers/Api/CountryController.php`, `app/Resources/Country/{CountryListResource,CountryResource}.php` — response shape must not change

**Views (shape preserved, verify only)**
- `resources/views/site/checkout/parts/{shipping,billing}-form.php`
- `resources/views/site/account/parts/{address-form,address-modal}.php`

**Not touched**
- All storefront and admin TypeScript, and their Vitest suites, must pass unchanged.

**Verification**
- New PHPUnit test asserting the migrated `Utils::get_countries()` output is identical to
  `json_decode` of the preserved source JSON.
- `composer test`, `composer phpcs:wporg`, `npm run typecheck:app`, `npm test` in `resources/app/`.
