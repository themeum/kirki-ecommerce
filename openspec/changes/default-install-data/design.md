## Context

See proposal.md — Why. The constraints that shape the approach:

- `KirkiEcommerce::handle_activation()` already boots the app (`require bootstrap/app.php`) before
  calling `migrator()->run()` and `Scheduler::setup()`, so the container, models, and facades are
  all available at install time. There is a place to hook in and no bootstrapping work to invent.
- `Migrator::run()` has its history write commented out and every migration is `Schema::create`,
  so migrations already re-run harmlessly on every activation. The installer has to reach the same
  bar, but its work is `INSERT`s, which are not naturally idempotent.
- `Scheduler::create_async_worker_key()` is the existing idempotency precedent in this codebase:
  `if (!Option::get($key)) { Option::set(...); }`. Nothing more elaborate exists to follow.
- `AppSettings::refresh()` resolves every settings section as
  `array_merge(resources/data/settings/<key>.json, Option::get(<key>))`. Defaults are already
  read-time and file-based, and a stored option only needs to hold the keys that differ.
- `database/` is in `OPTIONAL_PATHS` in `bin/make-package.sh`, so `database/seeders/` ships in the
  production zip and is callable at runtime.
- The default data the installer needs already exists, as arrays inside `CurrencySeeder`,
  `ProductSchemaSeeder`, `ShippingProfilesSeeder`, `TaxProfilesSeeder`, and `ShippingBoxesSeeder`.

## Goals / Non-Goals

**Goals:**

- One source for each kind of default: settings defaults stay in the JSON files, row defaults stay
  in the seeder classes. The installer orchestrates; it does not hold its own copy of either.
- Keep stored options sparse. After activation, a settings section's stored option should contain
  only values the installer actually computed (page IDs), never a materialized copy of the shipped
  defaults — otherwise a merchant who installed at 1.0.0 stops receiving new default keys added in
  1.1.0.
- One home for page references: `advance.pages`, and nowhere else.
- Make repeated activation a no-op, and make a version bump able to add a new default without
  duplicating the old ones.

**Non-Goals:**

- The merchant-facing page selection UI. Advance settings has a placeholder screen and no form;
  building the four selects there, and removing the Products screen's shop-page field, is a
  scheduled follow-up.
- Uninstall/cleanup. `handle_uninstallation()` stays an empty stub and `ERASE_DATA_UPON_UNINSTALL`
  stays unwired — that is its own change.
- A migration path for existing dev installs. Anyone with a database seeded by `wp kirki db:seed`
  already has this data.
- Multisite network-activation correctness (see Risks).

## Decisions

### A thin `Installer` that delegates to the existing seeders

`app/Installer.php`, a class with `run()` plus one protected method per concern, called from
`handle_activation()` after `migrator()->run()`. Roughly:

```
handle_activation()
  ├─ migrator()->run()
  ├─ Installer::run()          ← new
  │    ├─ version gate
  │    ├─ seed_default_records()   → 5 seeder ->run() calls
  │    ├─ create_storefront_pages()
  │    └─ mark_installed()
  └─ Scheduler::setup()
```

The row-level defaults stay where they are, in `database/seeders/*.php`. The installer calls
`(new CurrencySeeder())->run()` and friends directly rather than through `Seeder::call()` /
`__invoke()`, because that API carries static `$called`/`$resolved` state meant for the CLI's
drain loop and buys nothing here.

*Alternative considered:* move the default arrays into `app/Installation/*` and reduce the seeders
to delegating shells. Correct layering — app code calling `database/seeders` is backwards — but it
churns five files to relocate data that is already fine where it is, and `database/` ships in the
package anyway. Not worth it for this change.

*Alternative considered:* a step-class-per-concern installer (`Steps/SeedCurrencies.php`, …). Five
short protected methods do not need an interface and a registry.

### Idempotency: a version gate in front, natural-key guards behind

Two layers, because they answer different questions.

**Version gate** (`Option::get(OptionKeys::INSTALLED_VERSION) === KIRKI_ECOMMERCE_VERSION` → return
early) handles the common case: deactivate/reactivate at the same version does nothing at all. It
is also what makes "merchant deleted a default shipping profile, then reactivated" behave — the
record is not resurrected, because the installer never runs.

**Natural-key guards inside each seeder** handle the upgrade case, where the version changed and
the installer does run against a database that already has most of the defaults:

| Seeder | Natural key |
|---|---|
| `CurrencySeeder` | `code` (already `UNIQUE` on the table) |
| `ShippingProfilesSeeder` | `name` |
| `TaxProfilesSeeder` | `name` |
| `ShippingBoxesSeeder` | `name` |
| `ProductSchemaSeeder` | `name` |

Each seeder's blind `Model::query()->insert($rows)` becomes: read the existing natural-key values,
filter the candidate rows down to the ones absent, insert only those (and skip the insert entirely
if nothing is left). This also fixes a latent bug — running `wp kirki db:seed` twice today throws
on `currencies.code`'s unique index.

`CurrencySeeder` additionally drops its hardcoded `"id" => 1`, which would collide with any
merchant-created currency, and only claims `is_base` if no base currency exists yet — so a merchant
who switched their base to EUR keeps it across an upgrade.

*Alternative considered:* version gate alone, no per-row guards. Fails the first time a version adds
a sixth shipping profile: the whole array gets re-inserted and the original five are duplicated.

*Alternative considered:* per-row guards alone, no version gate. Then deleting a default silently
recreates it on the next activation, which is hostile.

### Storefront pages: created by the installer, mapped in advance settings

Four pages — Shop, Cart, Checkout, My Account — created with `wp_insert_post` as published pages
with empty content, and their IDs written to `advance.pages`:

```json
{ "pages": { "shop": 12, "cart": 13, "checkout": 14, "account": 15 } }
```

Titles and slugs live in a new `app/Constants/StorefrontPages.php` (a constants-only class, so
`final` per the project's PHP conventions), keyed by the same `shop`/`cart`/`checkout`/`account`
identifiers used in the map. `resources/data/settings/advance.json` grows the same shape with
`null` values, so the map is always present and complete when read.

Per-page idempotency is by lookup, not by the version gate: for each view, if the mapped ID still
resolves to a page that exists and is not trashed, leave it alone; otherwise create a replacement
and update that one entry. This is what makes "merchant deleted the cart page" recoverable while
leaving the other three mappings untouched.

Pages render nothing today — there is no `add_shortcode`, `register_block_type`, or
`template_include` anywhere in `app/`. That is deliberate: the IDs are recorded now so the renderer,
when it lands, resolves a request to a view through this map rather than needing its own install
step.

`advance.pages` is the *only* place a page reference lives. The installer does not write
`product.shop_page`, and that key is removed outright (next decision). A renderer resolving "which
page is the shop" must have one answer, and a merchant-facing selector in one section plus a
renderer map in another is the same two-sources-of-truth problem this change exists to remove.

*Alternative considered:* keep `product.shop_page` as the merchant's shop selector and mirror it
into `advance.pages`. Mirroring needs a sync direction, and the two drift the moment anything writes
one without the other — exactly how `SettingsSeeder` and the JSON defaults ended up disagreeing.

### Deprecating `product.shop_page`

Removed from `resources/data/settings/product.json` and from
`SettingsUpdateRequest::get_product_settings_rules()` / `get_product_settings_filters()`.

The filters removal is what actually stops it persisting. `Sanitizer` starts with an empty result
array and populates only keys named in the rules it was given, so a `shop_page` in the request body
is dropped before it reaches `AppSettings::set()`. The default removal stops it appearing in reads.

The Products settings form is not touched in this change, so its shop-page field keeps rendering.
Its behavior after this change: the value submits, is discarded server-side, and the form resets
from the response — where `shop_page` is now absent and `schemas/catalog/settings.ts` types it
`.nullish()`, so the response still validates and the field clears. Visibly inert rather than
silently wrong, which is the tolerable version of this interim state.

*Alternative considered:* migrate the UI in this change — build the advance settings form and strip
the Products field. Correct end state, but it pulls a new form schema, its payload test, backend
`ADVANCE_SETTINGS` rules and filters, and a settings screen into what is otherwise a PHP
install-path change. Split by explicit decision.

### Writing settings via `Option::set`, not `Settings::update`

The installer writes exactly one settings value: `advance.pages`.

It does **not** go through `SettingsFactory::update()` / `AppSettings::set()`. Those call
`array_merge($this->to_array(), $value)`, and `to_array()` is defaults-plus-stored — so writing one
key materializes that entire section's shipped defaults into `wp_options`. A merchant installing at
1.0.0 would then never see a default key added to that section in 1.1.0, because their stored
option shadows all of it. `advance.json` is nearly empty today, but the section will grow, and this
is the rule the install path should follow regardless of which section it writes.

Instead the installer read-modify-writes the *stored* option only:

```
$stored = Option::get(OptionKeys::ADVANCE_SETTINGS) ?? [];
$stored['pages'] = $page_map;
Option::set(OptionKeys::ADVANCE_SETTINGS, $stored);
```

`AppSettings::refresh()`'s merge fills in everything else at read time. Reading from the stored
option rather than starting fresh means a reactivation cannot clobber settings the merchant has
already saved.

Side effect worth noting: this bypasses the `SettingsChanged` event. That is harmless here — the
only listener is `UpdateCurrencyRates`, which early-returns for any key other than `currency`, and
firing an exchange-rate HTTP sync during plugin activation would be undesirable anyway.

Reading from the stored option rather than starting fresh also means a reactivation cannot clobber
advance settings a merchant has already saved.

### Removing `SettingsSeeder`

Deleted, and dropped from `DatabaseSeeder`'s list. It writes the same conceptual data as
`resources/data/settings/*.json` into `wp_options`, and the two have already diverged
(`store_logo: 7` vs `null`; `offline_payments[]` vs `payment_gateways[]`; no `industry`; different
currency keys). Keeping both means every future settings default has to be added twice, and the
seeder's copy actively defeats the read-time merge for any developer who runs `db:seed`.

### Neutralizing the shipped settings defaults

Two files change, minimally:

- `general.json` — `store_email` becomes `null`. It currently ships `info@kirki.com` to every store.
- `tax.json` — `is_enabled_taxed_price`, `is_tax_inclusive_price`, and `is_shipping_tax_enabled`
  become `false`, and each entry in `tax_regions` gets `is_enabled: false`. The region definitions
  themselves stay, so the merchant has something to switch on rather than build from scratch.

`shipping.json` is left exactly as-is, including its Bangladesh zone, so shipping stays testable.
`store_name: "Kirki Ecommerce"` also stays — it is a functional placeholder, not a wrong contact
detail, and onboarding overwrites it.

`SettingResource` iterates `$data['shipping_zones']` unconditionally for the shipping key; since
that array is untouched, nothing there is affected.

## Corrections during implementation

**The install-version marker cannot live in `OptionKeys`.** That class doubles as the allow-list
for `GET /settings/{key}` (`'in:' . implode(',', OptionKeys::get_constant_values())`), and
`SettingsController::get()` calls `->to_array()` on whatever `SettingsFactory` resolves — `null`
for any constant that is not a settings section. Adding `INSTALLED_VERSION` there turned
`GET /settings/installed_version` into an uncaught `Call to a member function to_array() on null`.
It lives in a new `app/Constants/Install.php`. `MIGRATIONS` and `ERASE_DATA_UPON_UNINSTALL` sit in
`OptionKeys` today with the same latent hole — pre-existing, not widened, not fixed here.

**Only the base currency is seeded, not a "common currency set."** Every *active* currency row is
selectable as a display currency and converts by its stored `exchange_rate`
(`MoneyManager::resolve_requested_currency()`), so seeding EUR/GBP at the column default of
`1.000000` would render dollar amounts labelled as euros. The 155-entry
`resources/data/currencies.json` is already the merchant's picker, served by
`GET /currencies/list`, where a real rate is supplied.

**`CurrencyService::set_base()` had to change for onboarding to remain useful.** With only USD
provisioned, every other code threw `NotFoundException`, so onboarding could only ever pick the
currency it started with. It now stocks an unstocked-but-supported code from the reference
catalogue before switching. A base currency's rate is 1 by definition, so no rate guesswork is
involved. (Switching the base still leaves other currencies' rates stale relative to the new base
— pre-existing, untouched.)

**`shipping.json` was never migrated to the `base_*` money convention.** It shipped `amount` and
`free_shipping_min_amount` while `SettingsUpdateRequest`, `SettingResource`, and `ShippingService`
all read `base_amount` / `base_free_shipping_min_amount`. Nothing read the shipped values, so
checkout on a fresh install died on `Undefined index: base_amount`. Renamed in place and converted
to the minor units the request layer stores (`amount: 10` → `base_amount: 1000`). The zone itself
is untouched, per the decision to keep shipping testable — this is what makes it testable at all.

## Pre-existing defects found and fixed

Both blocked this change's own "a fresh install is functional" requirement, so they are fixed here
rather than deferred.

- `SettingResource` read `$method['base_amount']` unconditionally for the shipping section, so
  `GET /settings/shipping` returned 500 on any install with no stored shipping option. Money reads
  are now null-coalesced and the two `foreach`es guarded.
- `ShippingService::get_calculated_decision_context()` had `((int) $method['base_amount'] ?? null)`
  — the `??` applies to the cast result, so it never guarded the undefined index. Now
  `(int) ($method['base_amount'] ?? 0)`.

## Pre-existing defects found and left alone

- `CartApiTest::test_get_cart_returns_empty_cart_initially`,
  `CartApiTest::test_cart_item_and_address_lifecycle`, and
  `OrderApiTest::test_create_refund_on_order` fail on `main` as well — verified by stashing this
  change and re-running against the pristine tree.
- `GET /settings/migrations` and `GET /settings/kirki_ecommerce_erase_upon_uninstall` fatal for
  the reason described in the first correction above.

## Risks / Trade-offs

**Activation fires before `init`, where the plugin normally boots** → `handle_activation()` already
requires `bootstrap/app.php` directly and the existing `migrator()->run()` proves the container
works in that context. The new work (models, `Option`, `wp_insert_post`) needs nothing that
migrations don't already need.

**An exception mid-install leaves a partial state and a stale version marker** → `mark_installed()`
is the last statement in `run()`, so a failure leaves the marker unset and the next activation
retries from the top. Combined with the natural-key guards, the retry completes what the first pass
missed instead of duplicating what it finished. Not wrapped in a transaction: `wp_insert_post` is
outside the plugin's `DB` layer, so a transaction would give false assurance.

**Multisite network activation runs the hook once, not per site** → out of scope, and no worse than
the status quo (migrations have the same gap). Called out here so it is not mistaken for solved.

**Four pages that render nothing** → visible in the merchant's Pages list before the storefront
exists. Accepted deliberately: the IDs need to be stable and recorded now so the renderer inherits
a working map. Pages are created as published rather than draft so their IDs are usable and the
merchant can see what will become their storefront.

**An inert shop-page field on the Products settings screen** → between this change and the
follow-up, the field renders and accepts input but clears on save. Deliberate, and the reason the
mitigation is scheduling rather than code: the alternative was either leaving two competing page
references in settings, or pulling a whole settings form into a PHP install change. The follow-up
that removes the field and adds the four selects to `/settings/advanced` should land in the same
release.

**A merchant who had already set `product.shop_page`** → the stored value stays in `wp_options` but
stops being read or writable, and does not carry over into `advance.pages`. On a fresh install
there is nothing to carry; on a dev install it is one value to re-pick once the advance UI exists.
No migration written for it, since the plugin has not shipped.

**`shipping.json` still ships a Bangladesh zone with placeholder state IDs to every install** →
knowingly retained so shipping remains testable. It should be neutralized before release; noted
here rather than fixed so the decision is explicit and traceable. Note the zone covers only `BD`,
so a fresh install offers no shipping method to any other country until the merchant edits it.

**App code depending on `database/seeders/`** → inverted layering, and it breaks if `database/` is
ever dropped from `make-package.sh`'s `OPTIONAL_PATHS`. Mitigation is a note in the package script;
the proper fix is the relocation rejected above, deferred until a second consumer justifies it.

## Migration Plan

No data migration. Existing dev installs already have the seeded data; on first activation after
this change the version marker is absent, so the installer runs, the natural-key guards find
everything present, and only the storefront pages and settings writes are new.

Rollback is reverting the code. The rows and pages the installer created are ordinary records a
merchant can delete; the only orphan is the install-version option.
