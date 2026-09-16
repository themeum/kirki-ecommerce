## 1. Unit conversion table

- [x] 1.1 Create `app/Constants/Product/UnitConversion.php`: `final class` with `FACTORS` and
      `GROUPS` public constants, mirroring `resources/app/features/products/lib/price/utils.tsx`'s
      `normalizedUnit`/`unitGroups` exactly (see design.md - Decisions #1 for the literal table).
- [x] 1.2 Verify: `composer phpcs:wporg` passes for the new file.

## 2. Unit price calculation and formatting

- [x] 2.1 Create `app/Supports/UnitPrice.php` with a `make($variant, string $display_currency): ?string`
      method implementing the formula in design.md - Decisions #3: resolve factors/groups from
      `UnitConversion`, compute `number_of_base_units`, fail soft to `null` per every rule in
      `specs/variant-unit-price-display/spec.md` (disabled flag, missing fields, unrecognized unit,
      incompatible groups, zero `base_unit_amount`), otherwise compute `unit_price_minor` from
      `base_sale_price ?? base_price`, format via `Money::prepare_amount_object_from_minor()`, and
      return `"{money_object->display}/{base_unit_amount}{base_unit}"`.
- [x] 2.2 Verify: `composer phpcs:wporg` passes for the new file.

## 3. Wire into VariantResource

- [x] 3.1 In `app/Resources/Variant/VariantResource.php`, add `'display_unit_price' => UnitPrice::make($this->resource, $display_currency)`
      to the array returned by `to_array()`, near the other `display_*` price fields.
- [x] 3.2 Verify: `composer phpcs:wporg` passes for the modified file.

## 4. Tests

- [x] 4.1 Add `tests/Unit/Supports/UnitPriceTest.php` covering every scenario in
      `specs/variant-unit-price-display/spec.md`: compatible units, sale-price preference, unit
      normalization within a group, `show_unit_price = false`, unrecognized unit code,
      incompatible unit groups, zero `base_unit_amount`, missing unit fields. (Display-currency
      conversion itself is exercised at the integration level per the "Correction during
      implementation" note in design.md — see 4.2.)
- [x] 4.2 Add two cases to `tests/Integration/VariantApiTest.php`: a unit-priced variant asserting
      `display_unit_price` in the `GET variants/{id}` response, and a variant with
      `show_unit_price` unset asserting it is `null`.
- [x] 4.3 Verify: `composer test:unit` and `bash kirki-test integration --filter=VariantApiTest`
      both pass (full local suite run deferred to 5.2).

## 5. Final verification

- [x] 5.1 Run `composer phpcs:wporg` across the full diff.
- [x] 5.2 Run `composer test` (full suite) and confirm no regressions. (Ran unit suite locally via
      `bash bin/phpunit --testsuite Unit` — 267/267 passing — and the full integration suite via
      `bash kirki-test integration`, the local WP-tests-lib not being installed outside Docker —
      382/382 passing, 8733 assertions.)
