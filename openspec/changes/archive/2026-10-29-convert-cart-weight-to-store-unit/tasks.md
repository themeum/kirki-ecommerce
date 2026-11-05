# Tasks

## 1. Weight conversion

- [x] 1.1 ~~Add `FACTORS` to `app/Constants/WeightUnit.php`~~ Premise was wrong: `HasConstants` reads every constant, so an array there would leak "Array" into the `in:` validation lists. The factors (grams per unit: g 1, kg 1000, lb 453.59237, oz 28.349523125) are `Weight::GRAMS_PER_UNIT` instead; `WeightUnit` is unchanged, so `WeightUnit::join()` still returns `g,kg,lb,oz`.
- [x] 1.2 Create `app/Supports/Weight.php` with `convert($value, $from, $to = null)` following design decisions 3: default target is the store weight unit from the product settings, empty or unknown units return the value unchanged. Follow the PHP standards (docblocks, `protected`, `static::`, snake_case); verify `composer phpcs:docblocks` and `composer phpcs:wporg` pass for the file. (Done; the only docblock error `composer phpcs:docblocks` reports is `get_message` at line 224 of a file this change does not touch.)
- [x] 1.3 Add `tests/Unit/Supports/WeightTest.php` covering every scenario in `specs/weight-unit-conversion/spec.md` (unit pairs, same unit, store default target for kg and lb, empty unit, non-weight unit, unknown target); verify `composer test:unit -- --filter WeightTest` passes.

## 2. Carry the unit on calculation items

- [x] 2.1 Add `weight_unit` to `app/DTO/Calculation/CalculationItemDTO.php` with a `@var` docblock; verify the DTO test suite (`tests/Unit/DTO`) still passes.
- [x] 2.2 Fill `weight_unit` in `CalculationContextDTO::from_cart()` and in both item builders of `OrderCalculationContextService` (variant first, else the order item snapshot, same rule as `weight`); verify `composer test:unit -- --filter OrderCalculationContextServiceTest` passes and add an assertion that the unit is set for a variant line and a stored line without a variant.

## 3. Use the store unit in shipping

- [x] 3.1 Add a protected method in `app/Services/ShippingService.php` that returns the total weight of a calculation context in the store unit (convert each line, then multiply by quantity; read the store unit once). Use it in `prepare_decision_context()` for `cart_weight` and in `calculate_weight_based_cost()`; verify no other `weight * quantity` sum remains in the file (`grep -n "weight" app/Services/ShippingService.php`).
- [x] 3.2 Add a unit test (`tests/Unit/Services/ShippingServiceWeightTest.php`, using an anonymous subclass to reach the protected methods, because `prepare_decision_context()` needs the database) for the scenarios in `specs/shipping-rule-conditions/spec.md` (500 g + 1 kg with a kg store gives 1.5, 3 x 250 g gives 0.75, 2 lb against "less than 1", a variant without a unit, and the 800 g + 400 g weight range); verify it passes with `composer test:unit`, and that `CartWeightCondition` itself is unchanged.
- [x] 3.3 Update `docs/order-data-and-calculations.md` (the shipping fee step and the variant weight row): weights are converted to the store weight unit, weight rule values and ranges are read in the store unit, a missing or unknown unit counts as the store unit. Add a short "Where this differs" note that changing the store unit later does not convert saved rule values. Verify the doc has no text that says weights are summed without a unit.

## 4. Integration check

- [x] 4.1 Run `composer test:unit`, `composer phpcs:wporg` and `composer phpcs:docblocks`; verify all pass. (Unit: 593 tests pass. No finding in any file this change touches. Two findings were already in the repo and are not from this change: `composer phpcs:docblocks` reports a missing docblock for `get_message` in `app/Actions/Order/PerformOrderAction.php:224`, and `composer phpcs:wporg` reports warnings such as `mt_rand()` in other files. The integration suite was not run; it needs the WordPress test environment.)
- [x] 4.2 Run `npm run typecheck && npm test` in `resources/app/`; verify they pass. This change has no frontend code, so this only confirms nothing else broke.

## Workflow follow-up

- Archive the change after review.
