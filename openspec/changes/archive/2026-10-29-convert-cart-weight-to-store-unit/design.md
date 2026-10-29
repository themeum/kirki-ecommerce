# Design

## Context

- `ShippingService` sums `weight * quantity` in two places: `prepare_decision_context()`
  (`cart_weight` for `CartWeightCondition`) and `calculate_weight_based_cost()`. Neither
  looks at a unit.
- `CalculationItemDTO` has `weight` but no `weight_unit`. It is built in three places:
  `CalculationContextDTO::from_cart()`, and two methods in
  `OrderCalculationContextService` (new line from a variant, and stored order line).
- The variant and the order item both store `weight_unit`. The store unit is
  `settings('product')->weight_unit` (seeded as `kg`).
- `Constants\WeightUnit` lists the supported units (g, kg, lb, oz) and is used by the
  request validation. `Constants\Product\UnitConversion` holds unit price factors that
  the admin UI mirrors in TypeScript; it has no lb or oz.
- `Supports\UnitPrice` is the existing pattern for a small static calculation helper.

## Goals / Non-Goals

**Goals:**
- One place that converts a weight between supported units.
- `cart_weight` and the weight-based cost always use the store unit.

**Non-Goals:**
- No migration of saved rule values or weight ranges when the store unit changes.
- No change to how weights are stored on variants or order items.
- No change to the admin UI. The rule value field already means "store unit".
- No `total_weight` on the calculation result (docs note it is not filled today).

## Decisions

**1. A static `Supports\Weight` class, not a facade and manager.**
The conversion is a pure function with one setting read. A facade, manager and container
binding add three files for one method. `UnitPrice` already sets the pattern. Alternative:
a `Money`-style facade; rejected as too heavy for this size.

**2. Gram factors live on `Weight`, not in `UnitConversion` or `WeightUnit`.**
`UnitConversion` mirrors a TypeScript table, and the TypeScript unit price picker has no
lb or oz. Adding them there would make PHP accept units the UI rejects. The factors are
`Weight::GRAMS_PER_UNIT` (grams per unit: g 1, kg 1000, lb 453.59237, oz 28.349523125),
keyed by the `WeightUnit` constants. Alternative: extend `UnitConversion` and the
TypeScript mirror; rejected as a wider change.

**3. `Weight::convert($value, $from, $to = null)`.**
`$to` defaults to the store unit. Result is `value * FACTORS[from] / FACTORS[to]`. If
`$from` is empty or either unit is not in `Weight::GRAMS_PER_UNIT`, return `$value`
unchanged. Pass-through is chosen over an exception because variant units are already
validated on write, and a stale or empty unit must not break a shipping quote.
The store unit is read once per call. Callers that loop pass `$to` once to avoid reading
the setting per line.

**4. Convert per line, then multiply by quantity.**
Per-line conversion is needed because lines can differ in unit. Quantity is applied after,
so the result is the same either way, and rounding happens only once per line.

**5. One shared total in `ShippingService`.**
Both call sites need the same total. Add one protected method that returns the total
weight of a context in the store unit, and use it in `prepare_decision_context()` and
`calculate_weight_based_cost()`. This keeps the two values from drifting again.
`prepare_decision_context()` keeps its own item loop for profiles and categories; only the
weight sum moves.

**6. `weight_unit` on `CalculationItemDTO`.**
Filled in the three builders: from the variant, and for a stored order line from the
variant when it exists, else from the order item snapshot (same rule as `weight`).

## Correction during implementation

The first plan put the factors on `WeightUnit`. That class uses `HasConstants`, whose
`get_constant_values()` and `join()` read every class constant. A `FACTORS` array there
would put "Array" into the `in:` validation lists of the product and variant requests.
The factors moved to `Weight::GRAMS_PER_UNIT`. The proposal and task 1.1 were updated.

## Risks / Trade-offs

- [Store unit changed later] Saved rule values and weight ranges keep their numbers and
  are read in the new unit → documented as a known limit; a later change can store the
  unit with the rule.
- [Floating point] lb and oz factors are not exact in binary → compare uses the same
  floats the rule uses; no rounding is added, matching how weight is handled today.
- [Pass-through hides bad data] An unknown unit is silently treated as the store unit →
  accepted; write-time validation already limits units.
- [Behaviour change for mixed-unit carts] Carts with a non-store unit will now match
  different rules than before → this is the fix; mention it in the docs.
