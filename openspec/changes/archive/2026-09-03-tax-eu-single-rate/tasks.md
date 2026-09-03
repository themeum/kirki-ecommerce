## 1. Shared clampValue helper

- [x] 1.1 Add `resources/app/utils/number.ts` exporting
  `clampValue(value: number, min?: number | null, max?: number | null): number`
  (gated by `isDefined` from `@/utils/object`, braces on every `if` per the
  control-flow rule).
- [x] 1.2 Add `resources/app/utils/number.test.ts` (Vitest, `pagination.test.ts`
  style): below min, above max, within range, `null`/`undefined` bounds.
- [x] 1.3 Refactor `resources/app/components/form/number-field.tsx` to import
  `clampValue` from `@/utils/number` and delete the local closure; call site
  becomes `clampValue(enteredValue, min, max)`. Behavior unchanged.
- [x] 1.4 Run `npm run typecheck && npm test` from `resources/app/`. (typecheck:
  no new errors — 2 pre-existing `region-tax.ts` errors are branch WIP, unrelated;
  new `number.test.ts` passes.)

## 2. InputGroupField clamps on blur

- [x] 2.1 In `resources/app/components/form/input-group-field.tsx`, type
  `min?`/`max?` as `number | null`, stop passing `min`/`max` to
  `InputGroupInput`, and in the non-multiline number branch wrap `onBlur`:
  after `field.onBlur()`, parse `event.target.value`, bail on `''`/`NaN`,
  else `clampValue(entered, min, max)` and call `field.onChange` +
  `onValueChange?.` only when the value changed. Import `clampValue` from
  `@/utils/number`. (Implemented as a `handleNumberBlur` handler wired only
  when `type === 'number'`.)
- [x] 2.2 Confirm `pages/tax-region/single-tax-rate.tsx` still compiles
  unchanged (`min={0} max={100}` now clamps in JS).
- [x] 2.3 Run `npm run typecheck && npm test` from `resources/app/`. (No new
  errors/failures.)

## 3. EU country schema + form: single rate

- [x] 3.1 `schemas/catalog/tax.ts` — `CountryTaxRateSchema`: replace
  `product_tax_rate` / `shipping_tax_rate` with
  `rate: z.union([z.number(), z.string()]).nullish()`; update the doc comment.
- [x] 3.2 `schemas/forms/vat-collection-form.ts` — shape: one required `rate`
  (`z.union([z.string(), z.number()]).default('')`, message
  `__('VAT rate is required', 'kirki-ecommerce')`); drop the two rate fields.
  Transform: `rate: Number(values.rate) || 0`.
- [x] 3.3 Rewrite `tests/schemas/forms/vat-collection-form.test.ts` for the
  single `rate` (exact payload, blank-rate rejection, blank name/flag →
  `undefined`).
- [x] 3.4 Update `tests/schemas/catalog/tax.test.ts` `countries` fixtures
  to use `rate`.
- [x] 3.5 Run `npm run typecheck && npm test` from `resources/app/`. (Tax
  schema/form tests pass; the 2 `region-tax.ts` typecheck errors and the
  `tax-settings-form.test.ts` failure are pre-existing branch WIP, unrelated.)

## 4. EU VAT dialog + list UI

- [x] 4.1 `pages/tax-region/vat-collection/vat-collection-dialog.tsx` — replaced
  the two `<TextField>` blocks with a single
  `<InputGroupField name="rate" type="number" min={0} max={100}
  label={__('VAT (%)', 'kirki-ecommerce')}
  endContent={<InputGroupText>%</InputGroupText>} />`; updated `defaultValues`,
  both `form.reset({...})` calls, the `form.watch` line, `buttonState`. The
  `handleSubmit` payload already spreads `payload`, so no change there.
  `TextField` import dropped; `InputGroupField` / `InputGroupText` added.
- [x] 4.2 `pages/tax-region/vat-collection/vat-collection.tsx` — summary line
  is now `sprintf(__('%s%% VAT', 'kirki-ecommerce'), item?.rate ?? 0)`; the
  two-rate translator comment / second arg dropped.
- [x] 4.3 Run `npm run typecheck && npm test` from `resources/app/`. (No new
  errors/failures.)

## 5. Backend: validation, strategy, seed

- [x] 5.1 `app/Http/Requests/Settings/SettingsUpdateRequest.php` —
  `get_tax_settings_rules()`: replaced
  `data.tax_regions.*.countries.*.product_tax_rate` and `...shipping_tax_rate`
  with `data.tax_regions.*.countries.*.rate => 'required|number'`.
  `get_tax_settings_filters()`: same swap, `Sanitizer::FLOAT`. `states.*`
  rules/filters left alone.
- [x] 5.2 `app/Tax/Strategies/EUTaxStrategy.php` — `get_rate()`: dropped the
  `$rate_key` product/shipping branch; reads `(float) ($country['rate'] ?? 0)`.
  Docblock updated. `calculate_tax()` and the `$type` param left intact.
- [x] 5.3 `database/seeders/SettingsSeeder.php` — the EU `tax_regions[].countries`
  entries now use `"rate" => <n>`. States seed untouched.
- [x] 5.4 PHP suite: `vendor/bin/phpunit` cannot run in this environment (no
  WordPress test library / Docker). `php -l` passes on all five touched files.
  Two branch-WIP PHP tests that asserted the old two-rate model were updated to
  the single `rate`: `tests/Unit/Tax/EUTaxStrategyTest.php` (`eu_region()`
  fixture + the product/shipping test) and
  `tests/Integration/SettingsApiTest.php::test_update_tax_settings_eu_region_round_trips`.
  `DefaultTaxStrategyTest` untouched (its rates are `states.*`).

## 6. Spec sync

- [x] 6.1 After implementation, run `opsx:sync` (or `openspec sync`) to fold
  `specs/tax-settings/spec.md` deltas into `openspec/specs/tax-settings/spec.md`.
  (3 requirements merged: EU-region single rate, persisted-EU-region scenario,
  checkout EU-match. `openspec validate tax-settings --strict` passes.)
- [x] 6.2 `openspec validate tax-eu-single-rate --strict` passes.
