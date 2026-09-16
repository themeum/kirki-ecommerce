## Context

`VariantResource::to_array()` (`app/Resources/Variant/VariantResource.php`) already resolves
`$display_currency = Money::resolve_display_currency()` and exposes `base_price`/`base_sale_price`
alongside their `display_*` and `*_money_object` counterparts via `Money::prepare_amount_from_minor()`
/ `Money::prepare_amount_object_from_minor()` (`app/Managers/MoneyManager.php:327`, `:340`). It also
already injects a stateless helper directly (`MediaAttachment::make(...)`) and a stateful one via the
container (`app()->make(AvailabilityService::class)`).

The per-unit price formula and its unit-conversion tables exist today only in TypeScript
(`resources/app/features/products/lib/price/utils.tsx`), consumed by `base-unit-popover.tsx`. See
`proposal.md` - Why for why a PHP-side equivalent is needed.

The TS source of truth, to mirror exactly:

```ts
// normalizedUnit — factor to convert each unit to its group's base unit
{ mg: 0.001, g: 1, kg: 1000, ml: 0.001, cl: 0.01, l: 1, m3: 1000, mm: 0.001, cm: 0.01, m: 1, sqft: 1 }

// groups (by which list a unit value belongs to)
weight: [mg, g, kg]
volume: [ml, cl, l, m3]
size:   [mm, cm, m]
area:   [sqft]

// calculateBasePricePerUnit
numberOfBaseUnits = (total_unit_amount * totalFactor) / (base_unit_amount * baseFactor)
unit_price = (base_sale_price || base_price) / numberOfBaseUnits
// null if either factor missing, either amount falsy/non-finite, numberOfBaseUnits <= 0,
// or base_unit is not in total_unit's group list
```

## Goals / Non-Goals

**Goals:**
- Produce a `display_unit_price` value on `VariantResource` that is numerically identical
  (modulo currency-conversion rounding already inherent to `Money::*`) to what
  `calculateBasePricePerUnit` + `base-unit-popover.tsx`'s formatting would produce for the
  same variant and currency.
- Keep the conversion table and the calculation as small, explicit, independently testable
  units rather than inline logic in the Resource.

**Non-Goals:**
- Fixing `UpdateVariantRequest.php`'s `WeightUnit`/`Unit` validation mismatch (tracked as a
  known issue in `proposal.md` - Impact, not addressed here).
- Reconciling the TS and PHP tables automatically (e.g. code generation) — this change accepts
  hand-kept parity between the two, same as other cross-language constant pairs in this codebase.
- Changing `base_unit_amount`/`total_unit_amount`'s underlying type (the `Variant` model casts
  them `integer` despite the migration column being `float` — pre-existing, out of scope).

## Decisions

**1. New `App\Constants\Product\UnitConversion`, not a database-driven table.**
The unit set is small, closed, and already duplicated as PHP-side validation constants
(`App\Constants\Unit`). `UnitConversion` adds the *factor* and *group* data `Unit` doesn't carry:

```php
final class UnitConversion
{
    public const FACTORS = [
        'mg' => 0.001, 'g' => 1, 'kg' => 1000,
        'ml' => 0.001, 'cl' => 0.01, 'l' => 1, 'm3' => 1000,
        'mm' => 0.001, 'cm' => 0.01, 'm' => 1,
        'sqft' => 1,
    ];

    public const GROUPS = [
        'mg' => 'weight', 'g' => 'weight', 'kg' => 'weight',
        'ml' => 'volume', 'cl' => 'volume', 'l' => 'volume', 'm3' => 'volume',
        'mm' => 'size', 'cm' => 'size', 'm' => 'size',
        'sqft' => 'area',
    ];
}
```
This is a data class holding only public constants, never instantiated — per
CLAUDE.md's PHP standards, this is the one case allowed to be declared `final`, matching
`App\Constants\Order\OrderStatus`.

Alternative considered: deriving groups from `App\Constants\Unit`'s existing list by naming
convention or a single merged array. Rejected — `Unit`'s list is a flat validation whitelist
with no group/factor semantics, and forcing that meaning onto it would make `Unit` harder to
read for its actual (validation) purpose.

**2. New `App\Supports\UnitPrice`, not a Service.**
Per proposal.md, this is pure computation over fields already present on the variant plus a
currency code — no DB/Settings dependency, so it doesn't need container resolution like
`AvailabilityService`. It follows the `MediaAttachment::make(...)` shape already called
directly from `VariantResource`:

```php
namespace Kirki\Ecommerce\App\Supports;

class UnitPrice
{
    public static function make($variant, string $display_currency): ?string
    {
        // returns null per the fail-soft rules in specs/variant-unit-price-display/spec.md,
        // otherwise "{Money::prepare_amount_object_from_minor(...)->display}/{base_unit_amount}{base_unit}"
    }
}
```

**3. Formula translated 1:1 from TS, computed in minor units.**
```
totalFactor = UnitConversion::FACTORS[total_unit] ?? null
baseFactor  = UnitConversion::FACTORS[base_unit] ?? null
=> null if either is null, if UnitConversion::GROUPS[total_unit] !== UnitConversion::GROUPS[base_unit],
   or if base_unit_amount == 0 or total_unit_amount == 0

number_of_base_units = (total_unit_amount * totalFactor) / (base_unit_amount * baseFactor)
=> null if not finite or <= 0

price_minor = base_sale_price ?? base_price   // both already minor-unit ints, like base_price elsewhere
unit_price_minor = (int) round($price_minor / $number_of_base_units)

$money_object = Money::prepare_amount_object_from_minor($unit_price_minor, null, $display_currency);
return "{$money_object->display}/{$base_unit_amount}{$base_unit}";
```
Dividing in minor units (cents) before formatting, rather than converting to major units first
and dividing floats, keeps this consistent with how every other price on `VariantResource` is
computed (`Money::prepare_amount_from_minor`/`_object_from_minor` always take a minor-unit int).

**4. `base_unit_amount` in the suffix is used as-is, not re-normalized.**
`"1kg"` in the proposal's example is literally the stored `base_unit_amount`/`base_unit` pair,
matching `base-unit-popover.tsx`'s `"{amount}{unit}"` convention — no attempt to simplify e.g.
`1000g` down to `1kg`. If the `base_unit_amount` int cast (Non-Goal above) ever changes to float,
this string interpolation will need decimal-trimming to avoid `"1.0kg"`; not a concern today
since the cast is `integer`.

**5. `display_unit_price` has no `*_money_object` sibling.**
This is a deliberate, explicit exception to the "every `base_*`/`display_*` money field ships a
`*_money_object`" rule in CLAUDE.md's PHP standards. `display_unit_price` is a composite label
(price + unit suffix), not a bare currency amount — closer in kind to `availability_label` than
to `display_price`. Recorded here so a future reviewer doesn't "fix" this as a missed convention.

## Risks / Trade-offs

- **PHP/TS drift**: [Risk] `UnitConversion::FACTORS`/`GROUPS` and the TS `normalizedUnit`/
  `unitGroups` are two hand-maintained copies of the same data; a future new unit (e.g. adding
  `'oz'` support) could be added to one and not the other → Mitigation: both tables are small,
  named identically in spirit, and this design doc cross-references the exact TS source lines;
  a PHPUnit test asserting `display_unit_price` for a fixed set of known variants (see tasks.md)
  gives a regression signal if PHP output silently diverges.
- **Legacy bad data**: [Risk] variants with `base_unit`/`total_unit` = `lb`/`oz` (persisted via
  the `UpdateVariantRequest` validation bug) will always resolve to `null` → Mitigation: this is
  the intended fail-soft behavior (spec: "Unit code not recognized"), not a defect of this change.
- **Rounding at small unit prices**: [Risk] `round($price_minor / $number_of_base_units)` can lose
  sub-cent precision the same way the TS float division does — both sides already accept this,
  no new precision loss introduced.

## Migration Plan

Purely additive API field; no data migration, no rollback concerns beyond reverting the code
change. No feature flag — matches how `display_price`/`display_sale_price` etc. were added
directly, unguarded.

## Correction during implementation

`UnitPrice::make()`'s second parameter was widened from `string $display_currency` to
`?string $display_currency = null`. `Money::prepare_amount_object_from_minor($amount, $currency_code, $target_currency)`
runs a DB-backed exchange-rate lookup (`Currency::exchange_rate()` → `CurrencyModel::where(...)`)
whenever `$target_currency` is non-null, even when it equals the base currency — there is no
same-currency short-circuit. `tests/Unit/Resources/CartResourceCouponFormattingTest.php` already
works around this by always passing `null` for its display-currency argument in unit tests,
deferring real currency-conversion coverage to integration tests. `UnitPriceTest.php` follows the
same pattern. Production behavior is unchanged: `VariantResource` always calls
`UnitPrice::make($this->resource, $display_currency)` with the non-null string from
`Money::resolve_display_currency()`.
