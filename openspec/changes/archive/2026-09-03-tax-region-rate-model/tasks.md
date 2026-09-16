## 1. Backend validation & normalization

- [x] 1.1 Add an integration test to `tests/Integration/SettingsApiTest.php` that
  `PUT /settings` (`key=tax`) with a central-off region missing `shipping_tax`
  rejects with 422 on that field; and a central-on region missing
  `central_shipping_tax` rejects with 422. Run it red first to confirm the
  framework's `required_unless`-under-wildcard + closure behaviour; if the
  declarative rule misbehaves, note it and use a pure element-level closure.
  → Confirmed red-first that `required_if` / `required_unless` **cannot resolve a
  sibling under a `*` wildcard** (`deep_get` is given the full payload, not the
  region slice), so used a pure element-level closure on `data.tax_regions.*`
  (same pattern as the existing `shipping_methods.*` `is_taxable` closure).
- [x] 1.2 In `app/Http/Requests/Settings/SettingsUpdateRequest.php`
  `get_tax_settings_rules()`: removed `data.tax_regions.*.name`; `type` and
  `central_*` relaxed to `nullable`; `product_tax` / `shipping_tax` /
  `*.country` relaxed to `nullable` (structural only); kept
  `*.rate => required|number`; added the `data.tax_regions.*` closure — EU
  skipped, central-on requires numeric `central_product_tax` +
  `central_shipping_tax`, central-off requires non-empty `product_tax` +
  `shipping_tax` arrays.
- [x] 1.3 In `get_tax_settings_filters()`: dropped `data.tax_regions.*.name`;
  left `product_tax` / `shipping_tax` / `central_*` filters as they are.
- [x] 1.4 Added `passed_validation()`: when a region's `is_central_tax_enabled`
  is truthy, forces its `product_tax` and `shipping_tax` to `[]`, then
  `$this->merge(['data' => $data])`.
- [x] 1.5 Added integration tests: new central region round-trips with
  `product_tax`/`shipping_tax` = `[]`; a central-off region with two per-state
  rows in each array round-trips unchanged; toggling a stored per-state region to
  central clears both arrays on save.
- [x] 1.6 Verify: `bash kirki-test integration` — 248 tests green.
  `bin/phpcs` does not exist in this repo (no `phpcs`/`cs` script or binary);
  matched existing file style instead.

## 2. Seed data reshape

- [x] 2.1 Rewrote `database/seeders/SettingsSeeder.php` `create_tax_settings`:
  BD is now a per-state region (`is_central_tax_enabled: false`, no `central_*`)
  with `product_tax` / `shipping_tax` keyed by real BD state ids
  (`771` Dhaka, `785` Chittagong) from `resources/data/countries.json`; EU
  structure unchanged but with `name` removed. `resources/data/settings/tax.json`
  already ships `tax_regions: []` — no change.
- [x] 2.2 Grepped `database/seeders` and onboarding seeders / controller /
  request for tax-region seeding — none found elsewhere.
- [x] 2.3 Verify: `bash kirki-test integration` (re-seeds settings) — 248 green;
  no `name`/`states` keys in the seeded shape.

## 3. Shared types & response schema

- [x] 3.1 `lib/utils.ts`: `TaxRegion` lost `name`, `flag`, `states` (persisted
  shape now `code` + `is_enabled?` + `type?` + `is_central_tax_enabled?` +
  `central_*?` + `product_tax?`/`shipping_tax?` + `rules?`). `TaxRegionState`
  kept as a display type; added `TaxRegionDisplay` (region + optional
  name/flag/states) and `StateRateRow`. `TaxRate` keeps `flag?` — see Deviations
  under §8.
- [x] 3.2 `schemas/catalog/tax.ts`: `TaxRegionSchema` dropped `name`, gained
  explicit `is_enabled` / `is_central_tax_enabled` / `central_*` (stays
  `.passthrough()`). Updated `tests/schemas/catalog/tax.test.ts` (dropped `name`
  from the fixture, added general per-state + country-wide cases).
- [x] 3.3 Verify: `npm run typecheck` clean; tax tests pass. (Full-suite
  greenness only reachable once §4–8 also land — see §9.)

## 4. RegionsDialog country-only mode

- [x] 4.1 Added `countryOnly` prop to `resources/app/components/regions-dialog.tsx`:
  hides the per-state expander (`hasStates` forced false), row click selects the
  whole country, each picked country contributes `states: []`, and a country in
  `disabledRegions` is disabled outright (`isCountryFullyDisabled` short-circuits).
- [x] 4.2 `RegionSchema` already validates a country-only payload (`states` is a
  possibly-empty array). Added a `region.test.ts` assertion for it.
- [x] 4.3 `countryOnly` defaults to `false` and only gates new branches, so
  shipping-zone / coupon-targeting callers (prop omitted) are unchanged —
  verified by full `npm test` + typecheck.
- [x] 4.4 Verify: `npm run typecheck` clean; `npm test` 750 pass.

## 5. Add-region flow

- [x] 5.1 `tax-region.tsx`: passes `countryOnly` to `RegionsDialog`;
  `handleAddRegion` now creates `{ code, is_enabled: true, type: null,
  is_central_tax_enabled: true, central_product_tax: 0, central_shipping_tax: 0,
  product_tax: [], shipping_tax: [], rules: [] }` for non-EU and
  `{ code: 'EU', is_enabled: true, type: 'oss', product_tax: [], shipping_tax: [],
  rules: [] }` for EU (no `name`/`flag`/`states`).
- [x] 5.2 Region card: `resolveRegionMeta` resolves name + flag from
  `useCountriesQuery` (EU special-cased); shows "Entire country" when
  `is_central_tax_enabled` or `product_tax.length === 0`, else `%d states` from
  `product_tax.length`.
- [x] 5.3 `disabledRegions` is now `taxRegions.map(r => ({ country: r.code,
  states: [] }))` — no dependency on persisted `region.states`.
- [x] 5.4 Verify: `npm run typecheck` clean; `npm test` 750 pass.

## 6. General region form schema

- [x] 6.1 Rewrote `schemas/forms/tax-region-general-form.ts`: shape is
  `{ is_central_tax_enabled: boolean (default true), central_product_tax,
  central_shipping_tax, state_rates: { state, product_rate, shipping_rate }[] }`;
  `requiredWhen` on both central fields (central-on + empty), `requiredWhen` on
  `state_rates` (central-off + empty). `.transform()` splits `state_rates` into
  `product_tax` / `shipping_tax` (or `[]` in central mode) and coerces `central_*`
  with `Number(...) || 0`.
- [x] 6.2 Rewrote `tax-region-general-form.test.ts` — central-on (arrays cleared,
  rates coerced), per-state (split), defaults, and both `safeParse` failure cases.
- [x] 6.3 Verify: `npm run typecheck` clean; tax tests 50 pass.

## 7. Editor A — per-state expandable rows

- [x] 7.1 Rewrote `tax-rate-list.tsx` as a collapsible `Accordion` per-state list
  bound via `useFieldArray({ name: 'state_rates' })`: collapsed shows the
  resolved state name + `%s%% product · %s%% shipping`; expanded shows a Product
  and a Shipping `InputGroupField` (0–100) plus a remove button; empty state +
  array-level `requiredWhen` error rendered.
- [x] 7.2 `add-cities-dialog.tsx`: dropped the `taxRates` prop; candidates come
  pre-filtered from the parent (`countries.json` states minus those already in
  `state_rates`); selection compares on `String(id)`; labels use `name ?? title`.
- [x] 7.3 `lib/region-tax.ts`: `mergeCitiesIntoTaxRates` appends
  `{ state: String(city.id), product_rate: 0, shipping_rate: 0 }` skipping known
  ids; `applyRegionTaxUpdate` takes the transformed general payload and writes
  `is_central_tax_enabled` / `central_*` / `product_tax` / `shipping_tax`; added
  `buildStateRateRows` (zips the two stored arrays into editor rows by state id).
  Rewrote `region-tax.test.ts` accordingly.
- [x] 7.4 `general-edit-region.tsx`: `CheckboxField` bound to
  `is_central_tax_enabled` (default true); central-on renders the two
  `SingleTaxRate` fields, central-off renders `TaxRateList` + the "Add" button;
  hydration and post-save `form.reset` rebuild `state_rates` via
  `buildStateRateRows`; save/discard through `useSettingsPageActions`; name/flag/
  states resolved from `useCountriesQuery` and passed to `TaxRules` as a
  `TaxRegionDisplay`.
- [x] 7.5 Verify: `npm run typecheck` clean; tax tests 50 pass.

## 8. tax-settings form schema & EU cleanup

- [x] 8.1 `schemas/forms/tax-settings-form.ts`: `TaxRegionFormShape` no longer
  extends with `states`/`flag` (and `TaxRegionSchema` lost `name`); removed the
  now-unused `TaxRegionStateShape` / `TaxRegionStateForm`. Updated
  `tax-settings-form.test.ts` region fixture to the new shape.
- [x] 8.2 `tax-region-eu-form.ts` has no `name`/`states` reliance (no-op). Per
  the change's Non-Goals, EU VAT collection behaviour (still `state`-keyed in the
  dialog, the pre-existing wart noted in `openspec/project.md`) is left as-is;
  the seed persists EU rates keyed by `country`.
- [x] 8.3 `edit-region-eu.tsx` sources EU member countries from
  `useCountriesQuery` (`group === 'eu'`) and hands `VatCollection` / `TaxRules` an
  enriched `TaxRegionDisplay` instead of a persisted `region.states`.
- [x] 8.4 Verify: `npm run typecheck` clean; `npm test` 750 pass.

### Deviations from the plan

- **`TaxRate` keeps an optional `flag?`** (task 3.1 said drop it): the EU
  VAT-collection dialog (`vat-collection-form.ts`) carries `flag` on its rows and
  reworking that is an explicit Non-Goal. Documented inline as a transient
  display field.
- **`TaxRegion` keeps no display fields**, but a sibling `TaxRegionDisplay`
  (`= TaxRegion & { name?; flag?; states? }`) is added for the rules / VAT
  sub-views, which the edit pages populate from the country dataset.

## 9. End-to-end verification

- [x] 9.1 `npm run typecheck` — clean (pre-existing `@tanstack/react-virtual`
  error in `bulk-edit-table.tsx` is unrelated). `npm test` — 750 pass, 1
  pre-existing suite (`bulk-edit-table.test.tsx`) fails to load on the same
  missing dep.
- [x] 9.2 `bash kirki-test integration` — 248 pass. `bash kirki-test unit` — 2
  pre-existing failures in `AvailabilityServiceTest` (variant-count label,
  unrelated; identical on a clean stash).
- [ ] 9.3 Manual walkthrough — **not run** (this project forbids browser-based
  verification; needs a human): add a country → central region created; set
  country-wide product + shipping rates → saves; turn off "one rate for entire
  country" → prompted for states → add 2 states → each row expands to product +
  shipping fields, seeded 0 → set rates → saves; reload → rates persist by state
  id; disable region from list → rates retained.
  → **Waived, not verified.** `CLAUDE.md` §0 forbids browser-based verification
  in this project, so no automated agent can run this step; it needs a human.
  Consciously left unchecked (not forgotten) at archive time. Note this task's
  own premise ("each row expands to product + shipping fields") describes
  Editor A, which groups 10+ superseded with the dedicated per-state route
  (Decision 10) — 25.5 is the walkthrough that matches what actually shipped.

---

# Revision — states[]/countries[] model, per-state rules, state route, zod-first schemas

Groups 1–9 above are the record of the first implementation. Groups 10+ carry the
correction recorded in design.md's *Correction during implementation* (Decisions
7–11). Backend groups (11–14) are independent of frontend groups (15–24);
frontend order: 15 → 16 → 17 → 18 → 19 → 20 → (21, 22) → 23 → 24 → 25.

## 10. OpenSpec artifact revision

- [x] 10.1 `proposal.md` — rewrote **What Changes** / **Capabilities** / **Impact**
  for the reversed direction (states[]/countries[], persisted name/flag, per-state
  route + rules, zod-first schema union, both tax strategies now touched).
- [x] 10.2 `design.md` — appended `## Correction during implementation` with
  Decisions 7–11 and a Non-Goals correction; Decisions 1–6 left in place.
- [x] 10.3 `specs/tax-settings/spec.md` — replaced the expandable-row requirement
  with "Each state is configured on its own page"; added "Tax rules are
  configured country-wide or per state" and "The EU region collects VAT per
  member country"; amended the persistence and checkout-match requirements for
  states[]/countries[] and rules XOR.
- [x] 10.4 Verify: `openspec validate tax-region-rate-model --strict` passes.

## 11. Backend validation & normalization — `app/Http/Requests/Settings/SettingsUpdateRequest.php`

- [x] 11.1 Extract the nested `rules.*` leaf rules (relation / conditions.* /
  action.*) into a reusable array so they apply to both `tax_regions.*.rules.*`
  and `tax_regions.*.states.*.rules.*`.
  → Added `get_tax_rules_rules($prefix)` / `get_tax_rules_filters($prefix)`, merged
  into both settings arrays via `array_merge`.
- [x] 11.2 `get_tax_settings_rules()`: add `tax_regions.*.name|flag =>
  nullable|string`; add the general `states` leaves (`states => nullable|array`,
  `states.*.id => required|string`, `states.*.name|flag => nullable|string`,
  `states.*.product_tax_rate|shipping_tax_rate => required|number`,
  `states.*.rules => nullable|array` + helper); add the EU `countries` leaves
  (`countries => nullable|array`, `countries.*.code => required|string`,
  `countries.*.name|flag => nullable|string`,
  `countries.*.product_tax_rate|shipping_tax_rate => required|number`); drop the
  general and EU `product_tax` / `shipping_tax` leaves.
  → No `states.*.flag` leaf: **no state in `resources/data/countries.json` has a
  flag** (all 4,991 states across 250 countries are `{id, name}`; only countries
  carry one), so a state entry is `{ id, name, product_tax_rate,
  shipping_tax_rate, rules }`. `countries.*.flag` is kept — EU members do have
  flags. See the design.md correction.
- [x] 11.3 Rewrite the `data.tax_regions.*` closure: EU → non-empty `countries`,
  each with string `code` + numeric rates; general central-on → numeric
  `central_product_tax` + `central_shipping_tax`; general central-off →
  non-empty `states`, each with string `id` + numeric rates.
  → The two non-empty-array branches share a `validate_tax_rate_entries($entries,
  $identifier, $key)` helper, which reports the offending index and field
  (`…states.0.shipping_tax_rate`) rather than just the array.
- [x] 11.4 `get_tax_settings_filters()`: parallel `Sanitizer` entries for every
  new leaf; remove the dropped ones.
- [x] 11.5 `passed_validation()`: general region + truthy `is_central_tax_enabled`
  → force `states => []`. EU untouched.
- [x] 11.6 Verify: `bash kirki-test integration` (assertions land in group 14).
  → 253 tests green.

## 12. Tax strategies (checkout money) — `DefaultTaxStrategy.php`, `EUTaxStrategy.php`

- [x] 12.1 `DefaultTaxStrategy`: add `get_matched_state()` (null when central,
  else first `states[]` entry where `(string)$state['id'] ===
  (string)$this->address['state']`); rewrite `get_rate()` to read the matched
  state's `product_tax_rate` / `shipping_tax_rate`; in `calculate_tax()` resolve
  the rule set — central → `settings['rules']`, per-state → matched state's
  `rules` (strict XOR). `calculate_shipping_tax()` keeps its `[]` context.
  → The XOR lives in a `get_rules()` helper `calculate_tax()` calls, so the
  central/per-state branch is written once and both `get_rate()` and the rule
  lookup agree on the matched state.
- [x] 12.2 `EUTaxStrategy`: rewrite `get_rate()` to take `$type`, loop
  `settings['countries']` matching `(string)$country['code'] ===
  (string)$this->address['country']`, return the matching rate; update both
  `calculate_tax` call sites. Rules block unchanged (region-level).
  → One call site, not two — `calculate_tax()` resolves the rate once for both
  product and shipping via its `$type` argument.
- [x] 12.3 Confirm `AbstractTaxStrategy` / `TaxStrategyFactory` /
  `config/tax-strategies.php` need no change.
  → Confirmed: the factory already matches a region by `code`, and a grep of
  `app/`, `database/`, `config/` finds no remaining reader of the persisted
  `product_tax` / `shipping_tax` arrays (the surviving hits are the
  `DecisionContext` keys of the same name, unrelated).
- [x] 12.4 Verify: `bash kirki-test integration`. → 253 green.

## 13. Seeder — `database/seeders/SettingsSeeder.php::create_tax_settings()`

- [x] 13.1 BD → `states[]` (`771` Dhaka, `785` Chittagong, real flags from
  `resources/data/countries.json`, per-state rates, the example rule moved onto a
  state), add `name`/`flag`, drop `product_tax`/`shipping_tax`.
  → **No state flags** — `countries.json` has none for any state (see 11.2).
  Names are taken verbatim (`Dhaka District`, `Chittagong District`); the region
  itself gets `name: Bangladesh` / `flag: 🇧🇩`, the `shipping_profile` example rule
  moves onto state `771`, and `region.rules` is seeded `[]` (it lies dormant in
  per-state mode, per Decision 9).
- [x] 13.2 EU → `countries[]` (`AT`, `BE` with both rates, names/flags from
  `countries.json`), add `name`/`flag`, keep region-level `rules`, drop
  `product_tax`/`shipping_tax`.
- [x] 13.3 Verify: `bash kirki-test integration`; grep the seeded blob for
  `states[]` / `countries[]` and no `product_tax` on either region. → 253 green
  (the suite re-seeds settings); no `product_tax`/`shipping_tax` key remains in
  `create_tax_settings()`.

## 14. Backend tests — `tests/Integration/SettingsApiTest.php`, new `tests/Unit/Tax/{DefaultTaxStrategyTest,EUTaxStrategyTest}.php`

- [x] 14.1 Rewrite `tax_settings_payload()` + the 5 tax tests for the new shape:
  general per-state round-trip (asserts `states[0]['id'] === '771'`), general
  central round-trip, general central-off empty `states` → 422, general
  central-on missing `central_shipping_tax` → 422, per-state→central clears
  `states`. Add: EU `countries[]` round-trip (`countries[0]['code'] === 'AT'`),
  EU empty `countries` → 422, `name`/`flag` round-trip, non-numeric rate → 422.
  → `tax_settings_payload()` itself needed no change (it only wraps one region).
  10 tax tests now: the 5 rewritten + the 4 added + one more for a state missing
  `shipping_tax_rate` → 422, which is the per-entry counterpart of the old
  "missing `shipping_tax`" case. The per-state round-trip also asserts the state's
  own `rules` survive.
- [x] 14.2 `DefaultTaxStrategyTest`: per-state match / non-match(→0) / country-wide
  ignores `state` / per-state rule fires / region-level rule does NOT fire in
  per-state mode.
  → Plus a sixth case: the region-level rule *does* fire in country-wide mode (the
  positive half of the XOR). Stayed in `tests/Unit/` as planned — the strategies
  are plain constructor-injected, and a new
  `tests/Support/BindsTaxDependencies` trait binds the `money` alias and the
  `DecisionEngine` onto the container `TestCase::bind_money_dependencies()`
  builds, so no DB is needed (10 tests run in 27ms).
- [x] 14.3 `EUTaxStrategyTest`: country match → that country's product & shipping
  rate; non-match → 0; region-level rule fires.
  → Plus a per-country case asserting BE gets its own rates, not AT's.
- [x] 14.4 Verify: `bash kirki-test integration` + `bash kirki-test unit`.
  → integration 253 green; unit 183 with the 2 pre-existing
  `AvailabilityServiceTest` failures (variant-count label markup, unrelated).

## 15. Region schema restructure (zod-first) — `schemas/catalog/tax.ts`, `lib/utils.ts` (+ `tests/schemas/catalog/tax.test.ts`)

- [x] 15.1 `tax.ts`: add `TaxRuleConditionSchema`, `TaxRuleActionSchema`,
  `TaxRuleSchema` (replaces the borrowed `ShippingRuleSchema`),
  `StateTaxRateSchema`, `CountryTaxRateSchema`, `GeneralTaxRegionSchema`,
  `EuTaxRegionSchema` (`code: z.literal('EU')`),
  `TaxRegionSchema = z.union([EuTaxRegionSchema, GeneralTaxRegionSchema])`. Every
  level lenient (`.nullish()`, `.passthrough()`). Export types via `z.infer`.
  → `StateTaxRateSchema` has **no `flag`** (see 11.2); `code` on both members and
  `id`/`code` on the rate entries stay `required` — they are the match keys, and a
  region with no code is unusable rather than degraded. `TaxRateSchema` deleted.
- [x] 15.2 `lib/utils.ts`: delete `TaxRate`, `TaxRule`, `TaxRegion`,
  `TaxRegionDisplay`, `StateRateRow`; re-export the inferred types. Keep the
  UI-only helpers (`SelectOption`, `taxRuleConditionOptions`,
  `taxRuleActionOptionsArray`, `TaxConditionRow`).
  → Also re-exports `GeneralTaxRegion` / `EuTaxRegion`: reading `states` or
  `countries` off the `TaxRegionSchema` union needs the member type, because
  `.passthrough()`'s index signature defeats `in`-narrowing on the union.
  `TaxRegionState` kept (the display shape the dialogs and `TaxRules` bind to).
- [x] 15.3 `tax.test.ts`: fixtures for a general per-state region, a general
  country-wide region, an EU `countries[]` region; assert lenient parse of a
  malformed rule (passthrough, not throw).
  → 15 cases; also asserts the union resolves an `EU` payload to the EU member.
- [x] 15.4 Verify: `npm run typecheck`; tax schema tests. → schema tests green.
  **Typecheck is red from here until group 24** — 15.2 deletes the types every
  page still consumes, so it cannot be green mid-flight. Verified instead that
  every remaining error names a file scheduled for groups 19–24; see 17.7.

## 16. `lib/region-tax.ts` helpers (+ `tests/lib/region-tax.test.ts`)

- [x] 16.1 Delete `buildStateRateRows`; add `addStatesToRegion(states, picked)`
  (append `{ id: String(city.id), name, product_tax_rate: 0,
  shipping_tax_rate: 0, rules: [] }` for new ids — no `flag`, see 11.2).
  → `mergeCitiesIntoTaxRates` deleted too: `addStatesToRegion` replaces it
  outright (same job, new entry shape), so leaving it would strand it.
- [x] 16.2 Rewrite `applyRegionTaxUpdate` for the new general payload (write
  `is_central_tax_enabled` / `central_*` / `states`, delete
  `product_tax`/`shipping_tax`, keep `rules`/`name`/`flag`); add
  `updateRegionState(regions, code, stateId, patch)`.
- [x] 16.3 Rewrite `applyEuRegionUpdate` / `deriveEuRegion` for `countries[]`;
  `resolveVatProcessChange` collapses `countries` for `micro_business`. Keep
  `applyRegionRules`.
- [x] 16.4 Rewrite `region-tax.test.ts`. → 17 cases, including that
  `applyRegionTaxUpdate` preserves `name`/`flag`/`rules` and that
  `updateRegionState` touches only the addressed state of the addressed region.
- [x] 16.5 Verify: `npm run typecheck`; `region-tax.test.ts`. → tests green;
  typecheck red by design (see 15.4).

## 17. Form schemas (+ one payload `.test.ts` each)

- [x] 17.1 `tax-region-general-form.ts`: shape `{ is_central_tax_enabled (default
  true), central_product_tax / central_shipping_tax (requiredWhen central-on &
  empty), states: requiredWhen(array, central-off & empty) }`; remove old
  `state_rates`/`StateRateRowShape`; terminal transform → `{ is_central_tax_enabled,
  central_*: Number()||0, states: central ? [] : states }`.
  → `states` binds `StateTaxRateSchema` directly, so the form validates the
  persisted entry shape (a state with no `id` is rejected) rather than a parallel
  editor row type. `requiredWhen` (not `.min(1)`, per the project's hard
  constraints) because the non-empty check is conditional on central being off.
- [x] 17.2 New `tax-region-state-form.ts`: `{ product_tax_rate, shipping_tax_rate
  }` (`required` union, `Number()||0` transform).
  → Note `required()` wraps in `.nullish()`, so the inner `.default(0)` seeds
  `getDefaults()` (the form's initial value) but does **not** make
  `.parse({})` succeed — a missing rate is rejected, which is the intended
  contract. The payload test asserts both halves of that.
- [x] 17.3 `tax-region-eu-form.ts`: shape `{ type: z.enum(['oss','micro_business'])
  .catch('oss').default('oss'), countries: array }`; transform → `{ type,
  countries }`.
  → Exports the inferred `VatProcess` type; `vat-process-field.tsx` needs it to
  keep `setValue('type', ...)` well-typed now that `type` is no longer
  `z.string()` (see the addition to 23.6).
- [x] 17.4 `vat-collection-form.ts`: `{ state, rate, flag }` → `{ code, name,
  flag, product_tax_rate, shipping_tax_rate }`.
- [x] 17.5 `tax-settings-form.ts`: `TaxRegionFormShape` derives from the new
  `TaxRegionSchema` union; confirm the transform passes `tax_regions` through.
  → `TaxRegionFormShape` is **removed**, not re-derived: it existed only to
  `.extend()` the old region schema with `is_enabled` / `central_*` /
  `is_central_tax_enabled`, which now live inside `GeneralTaxRegionSchema`. zod v3
  has no `.extend()` on `ZodUnion` anyway. `TaxRegionForm` is now
  `z.infer<typeof TaxRegionSchema>`; `getDefaults`/`pickFormValues` are unaffected
  (both walk only the top-level object).
- [x] 17.6 Update the payload `.test.ts` for every schema above (central-on clears
  `states`; per-state passes `states`; EU passes `countries`; both `safeParse`
  failure cases). → Includes a new `tax-region-state-form.test.ts`; the
  `tax-settings-form` fixture now carries one general and one EU region so the
  union is exercised on both branches.
- [x] 17.7 Verify: `npm run typecheck`; all `tests/schemas/forms/*.test.ts`.
  → `npm test` 778 pass / 102 files, all green (the `bulk-edit-table.test.tsx`
  load failure noted in 9.1 no longer reproduces — its `@tanstack/react-virtual`
  dep resolves now). `npx tsc --noEmit` red as expected: the errors name exactly
  the 10 files scheduled for groups 19–24 —
  `general-edit-region.tsx`, `tax-rate-list.tsx`, `tax-rules/{tax-rules,
  tax-rules-dialog,condition-row}.tsx`, `edit-region-eu.tsx`,
  `vat-collection/{vat-collection,vat-collection-dialog}.tsx`,
  `vat-process-field.tsx`, `tax-region.tsx` — and nothing else.

## 18. New route + state page

- [x] 18.1 `config/route-config.ts`: add `EditTaxRegionState:
  defineRoute('/region/:code/:state')` under `TaxSettings`.
- [x] 18.2 `features/settings/routes.tsx`: lazy-import + flat route entry for the
  new `general-edit-region-state.tsx` (after `EditTaxRegion` / `EditRegionEU`;
  confirm `/region/eu` still ranks above `/region/:code`).
- [x] 18.3 New `pages/tax-region/general-edit-region-state.tsx`: `useParams()`
  `{ code, state }`; hydrate from `useSettingsQuery('tax')`; form on
  `tax-region-state-form.ts`; `SettingsPageHeader` (resolved state name, back →
  region page); two `<SingleTaxRate>` + `<TaxRules rules={storedState?.rules ??
  []} states={countryStates} updateRules={updateStateRules} />`; save via
  `useSettingsPageActions` (`updateRegionState` → full `TaxSettingsFormPayload` →
  `saveSettings`); `updateStateRules` silent-saves; redirect to the region page
  when the state id is unknown after load.
- [x] 18.4 Verify: `npm run typecheck`; `npm test`. → see 25.1.

## 19. `general-edit-region.tsx` rework

- [x] 19.1 Drop `displayRegion` / `TaxRegionDisplay` / `buildStateRateRows` /
  `state_rates`; hydrate/reset with `states: region?.states ?? []`.
- [x] 19.2 Render: `<CheckboxField name="is_central_tax_enabled">`; central-on →
  two `<SingleTaxRate>` (`central_*`) + `<TaxRules>` (region-level); central-off
  → navigable state-row list (group 20) + "+ Add", **no region-level `<TaxRules>`**.
  → Turning central off shows the empty prompt rather than auto-opening the
  add-states dialog (design.md's open question #2, settled the way the existing
  UI already behaves).
- [x] 19.3 `handleAddCities`: `addStatesToRegion` → persist full payload →
  `invalidateTaxSettings()` → `navigate(EditTaxRegionState.buildLink({ code,
  state: String(firstNewId) }))`.
  → Persists through the silent (`'delete'`) path, since the merchant is
  navigated away immediately and there is no form left to report errors into.
- [x] 19.4 `handleSaveData`: `applyRegionTaxUpdate` → save → reset.
  `updateRegionLevelRules` (central only): `applyRegionRules` → silent save.
- [x] 19.5 Header title/icon: `useCountriesQuery`, fall back to persisted
  `name`/`flag`, then `code`.
- [x] 19.6 Verify: `npm run typecheck`; `npm test`. → see 25.1.

## 20. Navigable state-row list — `tax-rate-list.tsx` → `tax-state-rows.tsx`, `single-tax-rate.tsx`

- [x] 20.1 Rewrite as a clickable-`Card` list over `useWatch({ name: 'states' })`:
  state name + `%s%% product · %s%% shipping` + chevron/trash; row click →
  `navigate(EditTaxRegionState.buildLink({ code, state: String(row.id) }))`; trash
  → `useFieldArray({ name: 'states' })` `remove(index)`. Keep the empty state and
  the array-level `requiredWhen` error. Remove the `Accordion`.
  → The file is **renamed** `tax-rate-list.tsx` → `tax-state-rows.tsx`: nothing
  about it is a rate list any more. Trash stops propagation so it doesn't also
  navigate. Row markup mirrors the region cards in `tax-region.tsx`.
- [x] 20.2 `single-tax-rate.tsx`: make `name` generic
  (`<T extends FieldValues>` / `FieldPath<FieldValues>`).
  → Both call sites pass the generic explicitly
  (`<SingleTaxRate<TaxRegionStateFormInput>>`) so the field name is still
  checked against the right form.
- [x] 20.3 Verify: `npm run typecheck`; `npm test`. → see 25.1.

## 21. `add-cities-dialog.tsx` disabled rows

- [x] 21.1 `cityList` = full country state list; add `disabledIds: Set<string>`;
  `general-edit-region.tsx` passes `countryStates` + `new Set(region.states?.map(s
  => String(s.id)))`; drop the `availableStates` pre-filter.
  → `disabledIds` is derived from the **form's** `states` (via `useWatch`), not
  the persisted region, so a state removed but not yet saved becomes re-addable
  immediately.
- [x] 21.2 Already-added rows → `<Checkbox disabled checked>` under a `<Tooltip
  tip={__('Already in use', 'kirki-ecommerce')}>`; exclude disabled ids from
  select-all / partial math and `handleToggleCity`.
  → Reuses `regions-dialog.tsx`'s `disabledRowTrigger` styling verbatim.
  Select-all counts against a `selectableCities` list rather than the full one,
  so it can still reach a "checked" state when some rows are disabled.
- [x] 21.3 Verify: `npm run typecheck`; `npm test`. → see 25.1.

## 22. `TaxRules` generalization — `tax-rules/{tax-rules,tax-rules-dialog,condition-row,add-state-dialog}.tsx`

- [x] 22.1 `TaxRules` props: `region?: TaxRegionDisplay` → `rules: TaxRule[]` +
  `states: TaxRegionState[]` (+ `updateRules`); seed `rulesObj` from `rules`.
  → Also takes `destinationLabel`, which replaces the `region?.code` the
  add-destination dialog used as its group heading (the EU page wants "EU", the
  general pages want the country name).
- [x] 22.2 `tax-rules-dialog.tsx` / `condition-row.tsx`: pass `states` through;
  `<AddStatePopup countryList={states}>`.
  → Fixed two latent bugs the stricter `TaxRuleSchema` exposed in the lines being
  rewritten: `existingRule.conditions` is nullable (it was dereferenced
  unguarded), and a condition's `type` can be null where the form input wants
  `string | undefined`.
- [x] 22.3 `add-state-dialog.tsx`: toggle selection on `String(item.id)` /
  `item.code`, not `country.title`.
  → This is the last name-keyed match in the feature: a `destination_region`
  condition now stores state ids / country codes, matching what the decision
  engine compares at checkout.
- [x] 22.4 Call sites: `general-edit-region.tsx` (central) → `states={countryStates}`;
  new state page → `states={countryStates}`; `edit-region-eu.tsx` →
  `states={euMemberCountries}` (keyed by code).
- [x] 22.5 Verify: `npm run typecheck`; `npm test`. → see 25.1.

## 23. EU page + VAT collection rework — `edit-region-eu.tsx`, `vat-collection/{vat-collection,vat-collection-dialog}.tsx`

- [x] 23.1 `edit-region-eu.tsx`: form on reshaped `tax-region-eu-form.ts` (`type`,
  `countries`); `euMemberCountries` mapped `{ id: code, code, name, flag }` (was
  `id: name`); `deriveEuRegion` overlays `type` + `countries`; hand
  `VatCollection` / `TaxRules` explicit `countries` / `rules` / `states` props.
  → Hydration normalizes a stored `type` to one of the two processes
  (`eu?.type === 'micro_business' ? … : 'oss'`), which is what lets the form
  schema use a plain enum (see 23.7).
- [x] 23.2 `vat-collection.tsx`: list `countries[]` rows (name + product% ·
  shipping%); `filteredCountries` excludes used codes; "Collect VAT" hidden for
  `micro_business` with ≥1 entry.
  → Row name/flag come from `resolveCountryMeta`, which prefers the country
  dataset and falls back to the persisted copy — the same refresh rule the
  region cards follow. Delete now matches on `code` alone (it used to compare
  name **and** rate, so editing a rate could orphan the row).
- [x] 23.3 `vat-collection-dialog.tsx`: country `SelectField` + Product rate +
  Shipping rate; `onAdd({ code, name, flag, product_tax_rate, shipping_tax_rate
  }, editIndex)`.
  → The form binds only `code`; `name`/`flag` are resolved from the option list
  at submit time so they can never drift from the picked country.
- [x] 23.4 Grep the tax feature for `TaxRegionDisplay` — must be zero. → zero.
- [x] 23.5 Verify: `npm run typecheck`; `npm test`; `vat-collection-form.test.ts`,
  `tax-region-eu-form.test.ts`. → see 25.1.
- [x] 23.6 `components/fields/vat-process-field.tsx` — **added during group 17**,
  which is what breaks it: it reads `getValues('product_tax')` (now `countries`)
  and calls `setValue('type', String(value))` (now the `VatProcess` enum exported
  by `tax-region-eu-form.ts`, not `z.string()`). It binds `TaxRegionEuFormInput`
  and belongs with the rest of the EU UI; it appeared in no group before.
- [x] 23.7 **Correction to 17.3** — `type` is `z.enum([...]).default('oss')` with
  **no `.catch()`**. `.catch()` widens zod's *input* type to `unknown`, which left
  every `useWatch`/`field.value` on the EU form untyped and cascaded four
  otherwise-unfixable errors through `edit-region-eu.tsx` and
  `vat-process-field.tsx`. Drift is still absorbed on the read path
  (`EuTaxRegionSchema.type` is a lenient string) and on hydration (23.1), so the
  `.catch()` bought nothing the page wasn't already doing. Its payload test now
  asserts an unrecognized process is rejected instead of coerced.

## 24. `tax-region.tsx` region list

- [x] 24.1 `handleAddRegion`: non-EU → `{ code, name, flag, is_enabled: true,
  is_central_tax_enabled: true, central_product_tax: 0, central_shipping_tax: 0,
  rules: [], states: [] }`; EU → `{ code: 'EU', name: 'European Union', flag:
  '🇪🇺', is_enabled: true, type: 'oss', rules: [], countries: [] }`.
- [x] 24.2 Region card subtitle: general → `states.length` ("Entire country" when
  `is_central_tax_enabled || length === 0`, else `%d states`); EU → `%d countries`.
  → Extracted as `resolveRegionSummary`, since the EU and general branches no
  longer share a count.
- [x] 24.3 `resolveRegionMeta`: `useCountriesQuery` lookup, fall back to persisted
  `name`/`flag`, then `code`.
- [x] 24.4 Verify: `npm run typecheck`; `npm test`. → see 25.1.

## 25. End-to-end verification + artifact reconciliation

- [x] 25.1 From `resources/app/`: `npm run typecheck` (allow the pre-existing
  `@tanstack/react-virtual` error), `npm test` (allow the pre-existing
  `bulk-edit-table.test.tsx` load failure).
  → **`npm run typecheck` is fully clean** — the `@tanstack/react-virtual` error
  no longer reproduces (the dep resolves now), so no allowance was needed.
  `npm test` 778 pass / 102 files, likewise with no allowance.
- [x] 25.2 `bash kirki-test integration` + `bash kirki-test unit` (allow 2
  pre-existing `AvailabilityServiceTest` failures).
  → integration 253 / 4872 assertions green; unit 183 with exactly those 2
  pre-existing failures (variant-count label markup, unrelated).
- [x] 25.3 `npx knip` — confirm nothing stranded (`buildStateRateRows`,
  `TaxRegionDisplay`, `StateRateRow`, old accordion internals, the
  `ShippingRuleSchema` import in `tax.ts`).
  → All five named items are gone. Two findings:
  (a) removed the now-unused `TaxRuleAction` / `TaxRuleCondition` re-exports this
  change had added to `lib/utils.ts`;
  (b) **`ShippingRuleSchema` (`features/settings/shipping/schemas/catalog/shipping.ts:46`)
  is now an unused *export*** — `tax.ts` was its only external consumer. It is
  still used inside its own file (`ShippingMethodSchema.shipping_rules`), so
  only the `export` keyword is redundant. Left alone: it is another feature's
  file and outside this change's scope. Its siblings
  `ShippingRuleConditionSchema` / `ShippingRuleActionSchema` / `ShippingRule`
  were *already* flagged the same way before this change, so the four new
  composed schema exports in `tax.ts` (`TaxRuleConditionSchema`,
  `TaxRuleActionSchema`, `GeneralTaxRegionSchema`, `EuTaxRegionSchema`) match the
  established, knip-tolerated pattern and were kept.
- [x] 25.4 Finalize the `→` notes in groups 10–24 and any further `design.md`
  corrections; re-run `openspec validate tax-region-rate-model --strict`.
- [ ] 25.5 Manual walkthrough — **not run** (needs a human): add country → central
  region with persisted name/flag; country-wide rates + one country-wide rule →
  save; turn off "one rate for entire country" → add 2 states → navigated to the
  first → set rates + a per-state rule → save → Back → both rows visible → open
  the second → set rates → reload → persists by state id → re-open add-states
  dialog → both shown disabled "Already in use" → checkout with an address in
  state `771` → per-state rate + per-state rule applied, region-level rule NOT
  applied. EU: add EU → Collect VAT → pick Austria, set both rates → save →
  reload → persisted in `countries[]` by code → checkout with an Austrian address
  → that country's rates applied.
  → **Waived, not verified.** `CLAUDE.md` §0 forbids browser-based verification
  in this project, so this step needs a human and cannot be run by an agent.
  Consciously left unchecked at archive time rather than skipped silently —
  everything automatable (typecheck, `npm test` 778/778, `bash kirki-test
  integration` 253/253, `bash kirki-test unit` less the 2 pre-existing
  `AvailabilityServiceTest` failures) is green. Run this script by hand before
  treating per-state/EU tax calculation as production-verified.

## Post-archive addendum — server-side completeness validation backed out

Tasks 1.1–1.5, 11.3–11.5, and 24.x describe a `data.tax_regions.*` element-level
closure in `SettingsUpdateRequest` (plus `validate_tax_rate_entries` and matching
`SettingsApiTest` cases asserting 422 for an incomplete-but-well-typed region).
That closure was later removed: the endpoint now type-checks each field
(`required|number` on rates, array rules, `prepare_for_validation` clearing
`states` in central mode) but does **not** enforce cross-field completeness —
non-empty `states` / `countries` and "every rate present" are enforced only by
the region form schemas (`schemas/forms/tax-region-*-form.ts`). The four
integration tests that asserted those 422s were deleted with the closure. The
tax-settings spec was reworded to match (form-level checks + the new "The
settings API validates field types, not region completeness" requirement), and
the delta specs / `design.md` §5 carry the same correction.
