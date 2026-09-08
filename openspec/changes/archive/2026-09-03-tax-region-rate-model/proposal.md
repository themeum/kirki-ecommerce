## Why

The tax-region editor (unreleased, `tax-settings-improvement` branch) persists
per-state tax rates keyed by the **state name** while checkout addresses identify
a state by its **numeric id** — so `DefaultTaxStrategy::get_rate()` never matches
and general per-state tax silently resolves to 0. The editor also only manages a
product rate per state (never a shipping rate), yet both are meant to be
collected, and a region can be saved with no usable tax configuration at all.
Because nothing has shipped, we can fix the data model outright instead of
carrying the broken shape forward.

The persisted-region section below was reworked partway through implementation —
see design.md's *Correction during implementation*. The direction it now
describes is: one per-entry rate object as the source of truth (`states[]` for a
general region, `countries[]` for the EU region), display `name`/`flag` persisted
alongside, per-state tax rules, and a dedicated route per state instead of an
accordion.

## What Changes

- **BREAKING (pre-release):** a general region persists a single
  `states: [{ id, name, product_tax_rate, shipping_tax_rate, rules }]`
  array as the per-state source of truth (no `flag` — the country dataset has
  none for any state; see design.md's note under Decision 7). The EU region persists a symmetric
  `countries: [{ code, name, flag, product_tax_rate, shipping_tax_rate }]` array.
  The old `product_tax` / `shipping_tax` `[{state|country, rate}]` arrays are
  removed from both. Per-state rates are keyed by **state id**, per-country VAT
  by **country code** — never a name. Seed data (`SettingsSeeder`) is reshaped.
- **BREAKING (pre-release):** the persisted region **keeps** `name` and `flag`
  (display copies, re-resolved from the country dataset when the code is known;
  the persisted copy is only a fallback for an unknown code). Nothing is matched
  by `name` at checkout or in the rules engine.
- The **Add Region** dialog stays country-only. Adding a country creates a
  region with `is_central_tax_enabled: true` and empty `states`; per-state
  configuration happens on the edit page.
- **Per-state editing moves to its own route** `/settings/tax/region/:code/:state`.
  The general region edit page lists state rows; opening one navigates to that
  state's page, which has a Product tax rate field, a Shipping tax rate field,
  and a per-state Tax Rules section. Adding states seeds zero-rate rows and
  navigates straight to the first new state.
- **Tax rules are country-wide XOR per-state** for a general region. When
  `is_central_tax_enabled` is true the region page shows one region-level Tax
  Rules section (bound to `region.rules`); when false that section is hidden and
  rules are edited per state (bound to `state.rules`). In per-state mode the
  checkout applies only the matched state's rules; `region.rules` lies dormant.
- The **add-states dialog** shows states that already have a rate row as
  **disabled** ("Already in use"), the same pattern the region dialog uses for
  already-added countries — instead of filtering them out.
- **Save validation** (backend + form):
  - General, `is_central_tax_enabled` true → `central_product_tax` **and**
    `central_shipping_tax` required (numbers); `states` forced empty.
  - General, `is_central_tax_enabled` false → non-empty `states`, each entry with
    a string `id` and numeric `product_tax_rate` **and** `shipping_tax_rate`.
  - EU → non-empty `countries`, each with a string `code` and both numeric rates.
- **Schema layer becomes zod-first.** `schemas/catalog/tax.ts` defines a real
  `TaxRuleSchema` (no longer borrowing `ShippingRuleSchema`), `StateTaxRateSchema`
  / `CountryTaxRateSchema`, and separate `GeneralTaxRegionSchema` /
  `EuTaxRegionSchema` combined as `TaxRegionSchema = z.union([...])`. Every TS
  type is derived via `z.infer` / `z.input` / `z.output`; the hand-written
  region/rate/rule types (and `TaxRegionDisplay`) are deleted from
  `lib/utils.ts`. Union members stay lenient (`.nullish()`, `.passthrough()`).
- No production data migration: the feature is unreleased (`1.0.0-alpha.3`).

## Capabilities

### New Capabilities

- `tax-settings`: how a merchant defines tax regions and the product/shipping tax
  rates and rules collected within them — what each region form requires before
  it can be saved, what is persisted, and how a shopper's address is matched to a
  region, a rate, and a rule set at checkout.

### Modified Capabilities

<!-- none: no tax spec exists yet -->

## Impact

- **Backend:** `app/Http/Requests/Settings/SettingsUpdateRequest.php`
  (`get_tax_settings_rules` / `get_tax_settings_filters` reshaped for `states[]`
  and `countries[]`, the `data.tax_regions.*` closure, drop the `product_tax` /
  `shipping_tax` leaves, `passed_validation` clears `states` in central mode);
  **`app/Tax/Strategies/DefaultTaxStrategy.php`** (`get_rate` loops `states[]` by
  id; `calculate_tax` resolves the matched state's `rules` in per-state mode) and
  **`app/Tax/Strategies/EUTaxStrategy.php`** (`get_rate` loops `countries[]` by
  code) — both compute checkout money; `database/seeders/SettingsSeeder.php`
  (reshaped seed). `AbstractTaxStrategy` / `TaxStrategyFactory` unchanged.
- **Frontend (`resources/app/features/settings/tax/`):** `tax-region.tsx` (region
  card counts, `handleAddRegion` shapes), new
  `pages/tax-region/general-edit-region-state.tsx` + route, `general-edit-region.tsx`
  (central vs per-state, add→navigate, region rules only in central mode),
  `tax-rate-list.tsx` → navigable state-row list, `add-cities-dialog.tsx`
  (disabled rows), `tax-rules/*` (generalized to `{ rules, states }` props),
  `edit-region-eu.tsx` + `vat-collection/*` (`countries[]`, keyed by code),
  `lib/region-tax.ts` + `lib/utils.ts`, `schemas/catalog/tax.ts`,
  `schemas/forms/{tax-region-general-form,tax-region-state-form (new),
  tax-region-eu-form,vat-collection-form,tax-settings-form}.ts` and their payload
  tests.
- **Shared:** `components/regions-dialog.tsx` is **not** changed — the add-region
  flow is untouched. `TaxRules` (rendered by the general page, the new state
  page, and the EU page) is generalized in one pass.
- **Routing:** `resources/app/config/route-config.ts` +
  `resources/app/features/settings/routes.tsx` gain
  `EditTaxRegionState` (`/region/:code/:state`).
- No production data migration: unreleased (`1.0.0-alpha.3`).
