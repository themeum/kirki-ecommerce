## Why

The EU tax region persists a separate `product_tax_rate` and `shipping_tax_rate`
for every member country, mirroring the shape used for general-region states. In
the EU, shipping is an ancillary supply taxed at the rate of the goods it
delivers — a member country has **one** VAT rate, not two. Carrying two rates is
misleading in the UI, invites inconsistent data, and adds a field the merchant
must fill twice with the same number. The feature is unreleased
(`1.0.0-alpha.x`), so the data model can be corrected outright.

Separately, `InputGroupField` forwards `min`/`max` to the native `<input>`, which
does not stop a merchant typing an out-of-range value (only the step buttons
respect it). `NumberField` already clamps on blur via a local `clampValue`
helper; that helper should be shared and applied here too.

## What Changes

- **BREAKING (pre-release):** the EU region persists one rate per member country —
  `countries: [{ code, name, flag, rate }]` — replacing the
  `product_tax_rate` / `shipping_tax_rate` pair. General-region `states[]` keep
  both rates unchanged. Seed data (`SettingsSeeder`) is reshaped.
- The **Collect VAT** dialog shows a single "VAT (%)" field (was two: Product VAT
  and Shipping VAT), rendered with `InputGroupField` (a `%` addon) instead of a
  bare `TextField`.
- The VAT-collection list row summary shows one rate (`"20% VAT"`) instead of
  `"20% product · 20% shipping"`.
- **Checkout:** `EUTaxStrategy::get_rate()` reads the member country's single
  `rate` for both product and shipping tax. Rules evaluation is unchanged.
- **Save validation** (backend + form): each configured EU member country
  requires one numeric `rate`; the EU region still cannot be saved with no
  member country.
- `clampValue` moves to `resources/app/utils/number.ts`; `NumberField` imports it
  instead of defining its own. `InputGroupField` stops forwarding native
  `min`/`max`, types them `number | null`, and clamps a number value on blur via
  `clampValue`.
- No production data migration: unreleased.

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `tax-settings`: the EU region collects **one VAT rate per member country**
  (not a product rate and a shipping rate); the persisted EU region and the
  checkout EU-match behavior are restated for a single rate.

## Impact

- **Backend:** `app/Tax/Strategies/EUTaxStrategy.php` (`get_rate` reads
  `country['rate']`); `app/Http/Requests/Settings/SettingsUpdateRequest.php`
  (`get_tax_settings_rules` / `get_tax_settings_filters` —
  `data.tax_regions.*.countries.*.rate` replaces the two rate leaves);
  `database/seeders/SettingsSeeder.php` (EU `countries` seed).
- **Frontend (`resources/app/features/settings/tax/`):**
  `schemas/catalog/tax.ts` (`CountryTaxRateSchema`),
  `schemas/forms/vat-collection-form.ts` + its payload test,
  `pages/tax-region/vat-collection/vat-collection-dialog.tsx`,
  `pages/tax-region/vat-collection/vat-collection.tsx`,
  `tests/schemas/catalog/tax.test.ts` fixtures.
- **Shared components:** `resources/app/utils/number.ts` (new),
  `resources/app/components/form/number-field.tsx`,
  `resources/app/components/form/input-group-field.tsx`. Sole `InputGroupField`
  consumer `pages/tax-region/single-tax-rate.tsx` is unaffected.
- **Not changed:** `tax-region-eu-form.ts`, `lib/region-tax.ts`,
  `edit-region-eu.tsx`, `tax-region.tsx` — they pass `CountryTaxRate[]` around or
  count its length, with no rate-field references. General-region state rates,
  `DefaultTaxStrategy`, and the rules engine are untouched.
