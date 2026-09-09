## Context

See proposal.md — Why. Two independent refinements land together because the VAT
dialog is the one place that motivates both: it needs the single rate field, and
it needs `InputGroupField` to clamp `0–100` properly.

Current EU shape (`schemas/catalog/tax.ts`, `SettingsSeeder`, `EUTaxStrategy`):
`countries: [{ code, name?, flag?, product_tax_rate?, shipping_tax_rate? }]`.
The two rate fields always hold the same number in practice — EU VAT taxes
shipping at the rate of the goods.

`clampValue` exists today only as a local closure in `NumberField`
([number-field.tsx:46-56](../../../resources/app/components/form/number-field.tsx)),
applied in the `onBlur` handler. `InputGroupField` forwards `min`/`max` to
`InputGroupInput` as native `<input>` attributes, which only affect the step
buttons.

## Goals / Non-Goals

**Goals:**
- One `rate` per EU member country across schema, form, UI, validation, seed,
  checkout strategy, and the `tax-settings` spec.
- A shared `clampValue(value, min, max)` used by both `NumberField` and
  `InputGroupField`; `InputGroupField` clamps number input on blur.

**Non-Goals:**
- General-region `states[]` rate shape — stays `product_tax_rate` +
  `shipping_tax_rate`.
- `DefaultTaxStrategy`, the rules engine, `AbstractTaxStrategy`, response
  envelope handling — untouched.
- Any production data migration — feature is unreleased.
- Redesigning the VAT dialog beyond the field swap.

## Decisions

### 1. Field name `rate` (not `vat_rate` / keeping `product_tax_rate`)

`rate` matches the user's request and the `TaxRuleAction` / breakdown vocabulary
(`TaxItemResultDTO` already emits `'rate'`). It is deliberately **not** money-
prefixed — it is a percentage, which CLAUDE.md explicitly lists as bare
(`tax_rate`, `discount_amount_percentage`). Alternative `vat_rate` rejected: the
schema type is `CountryTaxRate`, the persisted region is generic, and no other
rate field in this domain carries the tax-kind prefix.

### 2. `CountryTaxRateSchema` stays lenient

Per project.md, catalog/response schemas stay `.nullish()` / `.passthrough()`.
`rate: z.union([z.number(), z.string()]).nullish()` — same looseness the two
fields had. The form schema (`vat-collection-form.ts`) is where `rate` becomes
required:

```ts
rate: required(
  z.union([z.string(), z.number()]).default(''),
  __('VAT rate is required', 'kirki-ecommerce'),
),
```

`.default('')` is carried over from the fields it replaces (both had it), so no
input-type widening regression (project.md hard constraint). Transform:
`rate: Number(values.rate) || 0`.

### 3. Dialog uses `InputGroupField`, not `TextField`

The single field renders with a trailing `%` addon
(`endContent={<InputGroupText>%</InputGroupText>}`) and `type="number"
min={0} max={100}` — which is exactly the case Decision 5 makes safe. This also
removes the `TextField` import if nothing else in the file uses it.
`buttonState` (the Done/Update disable guard) collapses from three checks to
`codeValue === '' || rateValue === ''`.

### 4. `EUTaxStrategy::get_rate()` ignores `$type`

`get_rate(string $type)` keeps its signature (callers pass `'product_tax'` /
`'shipping_tax'`, and `$type` is still the rules-context key in `calculate_tax`),
but the body drops the `$rate_key` branch and reads
`(float) ($country['rate'] ?? 0)`. Both product and shipping resolve to the same
number — which is the intended EU behavior.

### 5. Shared `clampValue` in `utils/number.ts`

New `resources/app/utils/number.ts`:

```ts
import { isDefined } from '@/utils/object';

export const clampValue = (
  value: number,
  min?: number | null,
  max?: number | null,
): number => {
  if (isDefined(min) && value < min) return min;
  if (isDefined(max) && value > max) return max;
  return value;
};
```

(Written with braces per the project's control-flow rule.) `NumberField` deletes
its local copy and imports this; behavior is identical. `InputGroupField`:
- `min?`/`max?` typed `number | null`
- stop passing `min`/`max` to `InputGroupInput`
- in the non-multiline number branch, wrap `onBlur`: after `field.onBlur()`,
  parse `event.target.value`, bail on `''`/`NaN`, else `clampValue(entered, min,
  max)` and `field.onChange` + `onValueChange?.` only when it changed.

Alternative — clamp inside `handleChange` on every keystroke — rejected: it
fights the user mid-type (typing `1` toward `15` when `min` is `10`), the same
reason `NumberField` clamps on blur.

A one-file `utils/number.ts` for a single helper is justified by two consumers
and matches `utils/pagination.ts` (also small, also tested).

### 6. Backend validation

`SettingsUpdateRequest`: replace the two
`data.tax_regions.*.countries.*.{product_tax_rate,shipping_tax_rate}` leaves with
`data.tax_regions.*.countries.*.rate` — `'required|number'` in
`get_tax_settings_rules`, `Sanitizer::FLOAT` in `get_tax_settings_filters`. The
`passed_validation` central-mode `states` clearing is unrelated and stays.

## Risks / Trade-offs

- [Stale persisted EU regions with the old two-field shape] → Feature unreleased;
  `SettingsSeeder` is reshaped and any dev environment reseeds. `CountryTaxRate`
  is `.passthrough()`, so a leftover `product_tax_rate` key is ignored, not a
  crash; `get_rate` returns 0 for a missing `rate` until re-saved.
- [`InputGroupField` blur-clamp changes behavior for future consumers] → Only
  `single-tax-rate.tsx` uses it today (with `min`/`max`), and its intent is
  exactly to bound `0–100`; the change makes that bound actually work.
- [Someone later needs distinct EU product vs shipping rates] → Considered
  unlikely under EU VAT rules; re-splitting is a schema-additive change if it
  ever happens.

## Migration Plan

No data migration. Ship schema + form + UI + backend + seed together; reseed dev
data. Rollback is a straight revert (no persisted production data depends on the
new shape).
