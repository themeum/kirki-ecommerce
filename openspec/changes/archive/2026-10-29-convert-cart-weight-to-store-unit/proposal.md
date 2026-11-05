# Proposal

## Why

A merchant can enter a variant weight in any supported unit (g, kg, lb, oz), but
shipping adds `weight * quantity` as plain numbers and ignores the unit. A 500 g line
and a 1 kg line add up to 501. `CartWeightCondition` and the weight-based shipping
rates then compare that number with values the merchant typed in the store's weight
unit, so the rule matches wrongly. The weight unit is lost because
`CalculationItemDTO` has no `weight_unit` field.

## What Changes

- Add a `Weight` support class that converts a value between weight units. When no
  target unit is given, it converts to the store's default weight unit
  (`settings('product')->weight_unit`).
- Keep the gram factors for g, kg, lb and oz on the `Weight` class, keyed by the
  `WeightUnit` constants. The unit price table (`UnitConversion`) stays as it is,
  because the admin UI mirrors it.
- Carry `weight_unit` on `CalculationItemDTO` and fill it wherever a calculation item
  is built from a variant or an order item.
- Convert each line's weight to the store unit before it is summed, for both the
  `cart_weight` decision context value and the weight-based shipping cost.
- `CartWeightCondition` does not change. It compares `cart_weight`, and that value is
  now always in the store unit.
- A missing or unknown unit leaves the weight as it is (treated as the store unit), so
  bad data cannot break a shipping quote.
- Document the behaviour in the order calculation doc.

## Capabilities

### New Capabilities
- `weight-unit-conversion`: Converting a weight between supported units, with the
  store's default weight unit as the default target.

### Modified Capabilities
- `shipping-rule-conditions`: Cart weight values are compared in the store's weight
  unit, whatever unit each variant uses.

## Impact

- New: `app/Supports/Weight.php`, `tests/Unit/Supports/WeightTest.php`.
- Changed: `app/DTO/Calculation/CalculationItemDTO.php`,
  `app/DTO/Calculation/CalculationContextDTO.php`,
  `app/Services/OrderCalculationContextService.php`,
  `app/Services/ShippingService.php`, `docs/order-data-and-calculations.md`.
- No database change and no API change. Existing rule values keep their numbers.
- Known limit: if a merchant changes the store weight unit later, saved rule values
  keep their old numbers and are read in the new unit. This change does not migrate
  them.
