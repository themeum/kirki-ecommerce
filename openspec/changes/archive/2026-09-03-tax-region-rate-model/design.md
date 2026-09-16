## Context

See proposal.md — Why. The tax-region feature is entirely on the
`tax-settings-improvement` branch; nothing has shipped (`1.0.0-alpha.3`), so
there is no persisted data to migrate and the broken name-keyed shape can be
replaced outright.

Relevant current state:

- Tax regions live as an array inside the `tax` settings option blob. All writes
  go through `PUT /settings` → `SettingsController@update` →
  `SettingsUpdateRequest` (rules + filters) → `Settings::get('tax')->set($data)`
  (shallow top-level merge, so the whole `tax_regions` array is replaced).
- Checkout: `RecalculateCartAction` → `Tax::get_tax_strategy($shipping_address)`
  → `TaxStrategyFactory::make()` picks `DefaultTaxStrategy` (non-EU) or
  `EUTaxStrategy`. `DefaultTaxStrategy::get_rate()` reads
  `settings['is_central_tax_enabled']` then either `central_*` or scans
  `settings['product_tax']` / `['shipping_tax']` for `entry['state'] === address['state']`.
  `EUTaxStrategy::get_rate()` scans for `entry['country'] === address['country']`.
- `address['state']` at checkout is `String(state.id)` — set by
  `components/state-selector.tsx`. `address['country']` is the ISO code.
- Form-schema pattern (openspec/project.md): `XxxFormShape` (plain zod) →
  `prepareFormSchema(shape).transform(...)` on the terminal schema only;
  conditional "required" via `requiredWhen()` from `@/libs/zod` reading root
  values; one payload `.test.ts` per form schema.
- `RegionsDialog` (`components/regions-dialog.tsx`, 569 lines) is shared by tax,
  shipping zones, and coupon targeting; it does country + per-state selection.

## Goals / Non-Goals

**Goals:**

- One persisted tax-region shape, keyed only by country code / state id, that
  `DefaultTaxStrategy` and `EUTaxStrategy` can consume **without change**.
- Per-state product *and* shipping rate, edited as expandable rows (Editor A).
- Save validation that enforces "country-wide rates" xor "per-state rates" on
  both the form and the backend.

**Non-Goals:**

- Changing the tax calculation strategies or the `PUT /settings` transport.
- Merging `product_tax` / `shipping_tax` into one array (rejected below).
- A dedicated tax-region REST resource.
- Reworking EU VAT collection behaviour (OSS / micro-business) — EU is touched
  only for the shared model cleanup.
- Any production data migration.

## Decisions

### 1. Persisted region shape

```jsonc
{
  "code": "BD",                    // ISO country code, or "EU"
  "is_enabled": true,
  "type": null,                    // EU only: "oss" | "micro_business"
  "is_central_tax_enabled": true,  // general only
  "central_product_tax": 0,        // number, present when central mode
  "central_shipping_tax": 0,
  "product_tax":  [ { "state": "1200", "rate": 20 } ],  // general: state id; EU: country code under "country"
  "shipping_tax": [ { "state": "1200", "rate": 5 } ],
  "rules": []
}
```

Dropped vs current: `name`, `flag`, `states: [{id,title,flag}]`. A general
region's state set is exactly `product_tax`'s keys (kept identical to
`shipping_tax`'s keys by the editor and validation).

*Why:* the country dataset (`useCountriesQuery`, `countries.json`) already
carries names/flags/state names for display; persisting them duplicates a
source of truth and was the vector for the name-vs-id bug. *Alternative
considered:* keep `states` as a bare `["1200","1250"]` id list — rejected, it is
fully derivable from `product_tax` and adds a second thing to keep in sync.

### 2. Two rate arrays, not one

Keep `product_tax` and `shipping_tax` as separate `[{state,rate}]` arrays.

*Why:* both tax strategies already read `settings['product_tax']` /
`settings['shipping_tax']` by name via `calculate_tax($type, ...)`. A merged
`[{state, product_rate, shipping_rate}]` array would require rewriting
`get_rate()` in both strategies — code that computes checkout money — for no
functional gain. The editor and the form schema present the two arrays as one
row per state; the redundant state key is kept consistent by construction.

### 3. Add-region flow is country-only → central region

The add-region control offers only countries (+ EU). Adding country `X` creates:

```jsonc
{ "code": "X", "is_enabled": true, "type": null,
  "is_central_tax_enabled": true, "central_product_tax": 0, "central_shipping_tax": 0,
  "product_tax": [], "shipping_tax": [], "rules": [] }
```

Per-state configuration is reachable only by turning off "apply one rate for the
entire country" on the edit page.

*Why:* "pick a country, no states" maps cleanly to "one rate for the whole
country". It removes the pre-validation seeding problem entirely — a new region
is valid on arrival (central mode, `central_*` = 0). Seeding of zero-rate rows
now happens **only** when the merchant adds states on the edit page.

*Shared-component decision:* add a `countryOnly` (name TBD) prop to
`RegionsDialog` that hides the per-state expander and forces each picked country
to contribute itself (no state ids). Shipping-zone and coupon-targeting callers
omit the prop and are unaffected. *Alternative:* a separate lightweight tax
country picker — rejected as duplicate search/EU-grouping/disabled-country
logic; revisit only if the prop turns the dialog into spaghetti.

### 4. Editor A — expandable per-state rows

`general-edit-region.tsx` renders, in per-state mode, one collapsible row per
state. Collapsed: state name + current product/shipping rate. Expanded: a
Product tax rate and a Shipping tax rate number field. "+ Add" opens the
add-states dialog (candidates = `countries.json` states for `region.code` minus
states already having a row). Trash removes a row (both arrays).

Form-state shape (single source the UI binds to):

```ts
type StateRateRow = { state: string; product_rate: number | string; shipping_rate: number | string };
```

`TaxRegionGeneralFormShape` becomes:

```ts
{
  is_central_tax_enabled: z.boolean().default(true),
  central_product_tax: requiredWhen(z.union([z.number(), z.string()]), central-on),
  central_shipping_tax: requiredWhen(z.union([z.number(), z.string()]), central-on),
  state_rates: requiredWhen(z.array(stateRateRow), central-off, "non-empty"),
}
```

`.transform()` on the terminal schema splits `state_rates` into
`product_tax: [{state, rate: product_rate}]` and
`shipping_tax: [{state, rate: shipping_rate}]` (or clears both when central), and
passes `central_*` through. Its payload `.test.ts` is updated in the same task.

*Why one `state_rates` field:* guarantees the two output arrays share a state
set and keeps the `requiredWhen` non-empty check on one field.

### 4a. state id ↔ name

The editor resolves display names from `useCountriesQuery({ limit: -1 })` —
`countries.find(c => c.code === regionCode).states.find(s => String(s.id) === row.state).name`.
The add-states dialog and the row list both key on `String(state.id)`.
`mergeCitiesIntoTaxRates` in `lib/region-tax.ts` changes from `state: city.title`
to `state: String(city.id)` and appends to both arrays.

### 5. Backend validation (`get_tax_settings_rules` / `get_tax_settings_filters`)

- Remove `data.tax_regions.*.name` (rule + filter). No `states` rule (not
  persisted).
- Central-on requires both central fields:
  ```
  data.tax_regions.*.central_product_tax  => required_if:is_central_tax_enabled,true|number
  data.tax_regions.*.central_shipping_tax => required_if:is_central_tax_enabled,true|number
  ```
- Central-off requires non-empty per-state arrays. `required_unless` exists
  (`libraries/framework/Validation/Rules/RequiredUnlessRule.php`) and resolves a
  sibling under the `*` wildcard the same way the existing
  `required_if:is_central_tax_enabled,true` does. Non-emptiness has no built-in
  `min:` rule, so use an element-level closure keyed on
  `data.tax_regions.*` (precedent: the `data.shipping_zones.*.shipping_methods.*`
  closure that conditionally requires `is_taxable`):
  ```
  data.tax_regions.*.product_tax  => 'required_unless:is_central_tax_enabled,true|array'
  data.tax_regions.*.shipping_tax => 'required_unless:is_central_tax_enabled,true|array'
  data.tax_regions.*ᐧᐧᐧ (closure): when is_central_tax_enabled !== true,
      product_tax and shipping_tax must each be a non-empty array
  data.tax_regions.*.product_tax.*.state  => 'required|string'
  data.tax_regions.*.product_tax.*.rate   => 'required|number'
  (same for shipping_tax.*)
  ```
- Backend normalization in `passed_validation()`: when
  `is_central_tax_enabled` is truthy, force `product_tax` / `shipping_tax` to
  `[]` (defensive — the form already does this; protects non-UI callers and
  keeps the blob clean).

> **Shipped correction.** The completeness checks above (central fields required
> when central-on, non-empty per-state / EU-country arrays, every rate present)
> ship **client-side only**, in the region form schemas. `SettingsUpdateRequest`
> type-checks each field (`required|number`, `Sanitizer::FLOAT`, array rules) and
> normalizes `states` to `[]` in central mode, but does **not** enforce
> cross-field completeness — a well-typed but incomplete region posted directly
> to `PUT /settings` is persisted as-is. See the "The settings API validates
> field types, not region completeness" requirement in the tax-settings spec.

### 6. Seed data reshape

`resources/data/settings/tax.json` already ships `tax_regions: []`, so no change
there. `database/seeders/SettingsSeeder.php` `create_tax_settings` is rewritten
to the new shape: BD as a per-state region with `product_tax`/`shipping_tax`
keyed by real state ids from `countries.json`, EU unchanged in structure (drop
`name`). Onboarding seed (`onboarding-seed-data`) if it seeds tax — verify.

## Risks / Trade-offs

- **`RegionsDialog` is shared** → a regression in `countryOnly` mode could break
  shipping zones / coupon targeting. Mitigation: the prop only *removes* the
  state expander and defaults selection to whole-country; add a payload test and
  manually exercise all three callers' add flows in the verification step.

- **Framework validator gaps** → `required_unless` under a wildcard, and
  sibling-relative resolution in a closure, were assumed to work from the
  `required_if` precedent but not proven. Resolved by not relying on them: the
  endpoint enforces only field types, and completeness lives in the region form
  schemas (see §5 "Shipped correction"). The integration tests that asserted a
  422 for an incomplete-but-well-typed region were removed with that decision.

- **Dev data with the old shape** → anyone who already clicked through the old
  tax UI on this branch has a name-keyed blob; after this change their general
  per-state tax silently stays 0 until they re-save. Acceptable (unreleased,
  internal). Called out in the archive summary.

- **`central_*` type** → the form shape uses `z.union([z.number(), z.string()])`
  and the backend rule is `number`; an empty string from a cleared field would
  fail `number`. Mitigation: the `.transform()` coerces `central_*` to a number
  (or the field defaults to `0`), matching today's `central_product_tax || 0`.

- **`is_central_tax_enabled` default flips to `true`** for new regions (was
  `false`). Any code assuming a fresh region is per-state must be checked —
  `tax-region.tsx` region card ("Entire country" vs "%d states") keys off this
  and `product_tax.length`, so update it in the same task.

## Open Questions

- Exact name for the `RegionsDialog` country-only prop (`countryOnly`,
  `selectionLevel="country"`, `hideStates`) — cosmetic, decide during
  implementation.
- Whether turning off "apply one rate for the entire country" should auto-open
  the add-states dialog or just show the empty prompt — UX polish, does not
  affect the spec or data model.

## Correction during implementation

**After the implementation above landed, the persisted shape and the per-state
editor were reworked.** The name-vs-id bug (Why) is real and the fix still keys
matching by id/code — but three follow-on requirements (a per-state *shipping*
rate, per-state tax *rules*, and a dedicated page per state) all want a single
per-state object rather than two parallel arrays plus a derived state set.
Decisions 1, 2, and 4 are superseded by Decisions 7–11 below. The original
decisions are left in place as the record of what was built first.

### Decision 7 — one per-entry rate object, not parallel arrays (supersedes 1 & 2)

A **general** region persists:

```jsonc
{
  "code": "BD", "name": "Bangladesh", "flag": "🇧🇩",
  "is_enabled": true,
  "is_central_tax_enabled": true,
  "central_product_tax": 0, "central_shipping_tax": 0,
  "rules": [],                          // country-wide rules — applied only when is_central_tax_enabled = true
  "states": [                           // present only when is_central_tax_enabled = false
    { "id": "771", "name": "Dhaka District",
      "product_tax_rate": 20, "shipping_tax_rate": 5, "rules": [ /* TaxRule[] */ ] }
  ]
}
```

> **A state has no `flag`.** This entry originally carried one. No state in
> `resources/data/countries.json` has a flag — all 4,991 states across 250
> countries are `{ id, name }`, and only the country level carries `flag`. So a
> `states[]` entry is `{ id, name, product_tax_rate, shipping_tax_rate, rules }`,
> and Decision 8 below applies to the region's own `name`/`flag` and to each
> `countries[]` entry (EU members really do have flags), not to states.

The **EU** region persists a symmetric array (VAT is per member country, so
there is no central mode and no per-entry `rules` — EU rules stay region-level):

```jsonc
{
  "code": "EU", "name": "European Union", "flag": "🇪🇺",
  "is_enabled": true, "type": "oss",
  "rules": [],
  "countries": [
    { "code": "AT", "name": "Austria", "flag": "🇦🇹",
      "product_tax_rate": 20, "shipping_tax_rate": 20 }
  ]
}
```

`product_tax` / `shipping_tax` are **removed** from both region kinds.

*Why the reversal of Decision 2:* Decision 2 kept two arrays specifically to
avoid editing `get_rate()` in the tax strategies. Per-state rules force that edit
anyway (`calculate_tax` must resolve *which* rule set applies per matched state),
so the "no functional gain" argument no longer holds. One object per state also
makes the redundant-key-sync problem disappear and is the shape the new state
page binds to directly.

*Backend impact (checkout money — the main risk):*
- `DefaultTaxStrategy::get_rate()` loops `settings['states']` matching
  `(string)$state['id'] === (string)$this->address['state']` and reads
  `product_tax_rate` / `shipping_tax_rate`.
- `DefaultTaxStrategy::calculate_tax()` uses `settings['rules']` when central,
  else the matched state's `rules` (strict XOR — see Decision 9).
- `EUTaxStrategy::get_rate()` loops `settings['countries']` matching
  `(string)$country['code'] === (string)$this->address['country']`.
- `EUTaxStrategy` rules block is unchanged (region-level).
- Validation: `SettingsUpdateRequest` type-checks each rate (`required|number`)
  and `passed_validation()` clears `states` when `is_central_tax_enabled` is
  truthy. Non-empty `states` / `countries` and "every rate present" are enforced
  by the region form schemas, not the endpoint (see §5 "Shipped correction").

### Decision 8 — persist `name` and `flag` (supersedes 1's removal)

`name` and `flag` are stored on the region and on each `countries[]` entry (a
`states[]` entry stores `name` only — see the note under Decision 7), and sent in
the payload. They are **display copies only**: every match
(region selection in `TaxStrategyFactory`, `get_rate`, every rule condition) keys
on `code` / `id`. The editor re-resolves `name`/`flag` from `useCountriesQuery`
whenever the code is known and falls back to the persisted copy only for an
unknown code. This reintroduces the stale-copy vector Decision 1 removed; it is
accepted because the vector for the original bug was *matching* on name, not
*storing* it, and matching now never touches name.

### Decision 9 — tax rules are country-wide XOR per-state (general regions)

`is_central_tax_enabled = true` → the region edit page shows one region-level Tax
Rules section bound to `region.rules`. `is_central_tax_enabled = false` → that
section is **hidden**; rules are edited on each state's page, bound to
`state.rules`. At checkout `calculate_tax` applies exactly one set: the region's
in central mode, the matched state's in per-state mode. Toggling back to central
mode does **not** clear `region.rules` (it lies dormant), so the toggle is
reversible; toggling to central mode *does* clear `states` (matches the existing
`passed_validation` behaviour for the old arrays). The asymmetry is deliberate —
`states` is a large structure the merchant re-populates via a dialog, `rules` is
a small one worth preserving silently.

### Decision 10 — per-state editing is a route, not an accordion (supersedes 4)

Adding `EditTaxRegionState` → `defineRoute('/region/:code/:state')` under
`TaxSettings` (`route-config.ts`) and a flat lazy route entry
(`features/settings/routes.tsx`), rendered by a new
`pages/tax-region/general-edit-region-state.tsx`. The general region page's
per-state area becomes a plain clickable-row list (state name + `%s%% product ·
%s%% shipping`, trash to remove). "+ Add" opens the existing cities dialog,
persists the new zero-rate `states[]` entries, then navigates to the first new
state. The state page has a Product tax rate field, a Shipping tax rate field
(`single-tax-rate.tsx`, made generic), and `<TaxRules>` bound to `state.rules`
with the full country state list for the `destination_region` picker. Rates save
through `useSettingsPageActions`; rules save silently, mirroring today's
`updateTaxRules('delete')` path. `single-tax-rate.tsx` is kept (central mode +
reused here); `tax-rate-list.tsx`'s accordion body and `state_rates` field array
are removed.

*Add-states dialog:* `add-cities-dialog.tsx` now receives the **full** country
state list plus a `disabledIds` set and renders already-added states as a
disabled checkbox under an "Already in use" tooltip — the same pattern
`components/regions-dialog.tsx` uses for already-added countries (`RegionsDialog`
itself is not touched).

### Decision 11 — zod-first region schemas

`schemas/catalog/tax.ts` defines `TaxRuleConditionSchema`, `TaxRuleActionSchema`,
`TaxRuleSchema` (replacing the borrowed `ShippingRuleSchema`), `StateTaxRateSchema`,
`CountryTaxRateSchema`, `GeneralTaxRegionSchema`, `EuTaxRegionSchema`, and
`TaxRegionSchema = z.union([EuTaxRegionSchema, GeneralTaxRegionSchema])` (EU's
`z.literal('EU')` on `code` discriminates; union tries EU first). Every level
stays lenient — `.nullish()` on optional fields, `.passthrough()` on objects —
per `openspec/project.md`, so backend drift or a half-saved region degrades
rather than throwing in `parseData`. All TS types come from `z.infer` /
`z.input` / `z.output`; `lib/utils.ts` drops its hand-written `TaxRate`,
`TaxRule`, `TaxRegion`, `TaxRegionDisplay`, `StateRateRow` and re-exports the
inferred types. Form schemas (`tax-region-general-form.ts`, new
`tax-region-state-form.ts`, `tax-region-eu-form.ts`, `vat-collection-form.ts`)
keep the canonical `prepareFormSchema(shape).transform(...)` pattern and map form
state to the persisted shape.

### Non-Goals — correction

The original Non-Goal "Reworking EU VAT collection behaviour" is **partially
lifted**: the EU region's persisted rate shape moves to `countries[]` and
`EUTaxStrategy::get_rate()` is rewritten. Still out of scope: the OSS /
micro-business *process* semantics, and any per-country rule UI for EU.
