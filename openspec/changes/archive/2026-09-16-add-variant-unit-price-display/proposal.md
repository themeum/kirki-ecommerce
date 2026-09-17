## Why

`VariantResource` exposes `show_unit_price`, `base_unit`, `base_unit_amount`, `total_unit`,
and `total_unit_amount`, but the actual per-unit price (e.g. "$30.00/1kg") is only ever
computed client-side, in `calculateBasePricePerUnit` (`resources/app/features/products/lib/price/utils.tsx`),
for the storefront's own unit-price popover. A consumer of the variant API that isn't that
React app has no way to get this value without re-implementing the ratio/normalization math
itself. This change adds the computed, pre-formatted unit price directly to `VariantResource`.

## What Changes

- Add `display_unit_price` (string|null) to `VariantResource::to_array()`: a pre-formatted
  string like `"$30.00/1kg"`, in the visitor's resolved display currency, combining the
  computed per-base-unit price with the `{base_unit_amount}{base_unit}` suffix.
- `display_unit_price` is `null` whenever `show_unit_price` is falsy, or the variant's unit
  data is missing, unrecognized, cross-group (e.g. `base_unit` is a weight but `total_unit`
  is a volume), or would divide by zero — this endpoint fails soft, it never throws for bad
  unit data.
- The unit price prefers `base_sale_price` over `base_price` when a sale price is present,
  matching the existing client-side formula exactly.
- New `App\Constants\Product\UnitConversion`: a PHP mirror of the TS `normalizedUnit`/
  `unitGroups` conversion tables (weight: mg/g/kg; volume: ml/cl/l/m3; length: mm/cm/m;
  area: sqft), so the ratio math has a single, explicit source of truth on the PHP side.
- New `App\Supports\UnitPrice` (or similarly named `Supports/` class, following the
  `MediaAttachment` precedent already used in `VariantResource`): stateless helper that
  takes a variant + display currency and returns the formatted string or `null`. No new
  Service/DI class — this is pure computation from fields already on the variant, unlike
  `AvailabilityService`, which depends on `Settings`/DB state.

## Capabilities

### New Capabilities
- `variant-unit-price-display`: computing and exposing a formatted, currency-aware unit
  price (e.g. "$30.00/1kg") on `VariantResource`, derived from `base_unit`, `base_unit_amount`,
  `total_unit`, `total_unit_amount`, `base_price`/`base_sale_price`, and the resolved display
  currency.

### Modified Capabilities
(none — no existing spec describes `VariantResource`'s output contract)

## Impact

- `app/Resources/Variant/VariantResource.php` — adds the `display_unit_price` key.
- `app/Constants/Product/UnitConversion.php` — new file, unit factor/group tables.
- `app/Supports/UnitPrice.php` (exact name TBD in design) — new file, calculation + formatting.
- No database schema changes. No breaking changes — this is an additive, nullable field.
- Known pre-existing data-integrity issue this change must tolerate rather than fix:
  `UpdateVariantRequest.php` validates `base_unit`/`total_unit` against `WeightUnit::join()`
  (g, kg, lb, oz) instead of `Unit::get_constant_values()` (the table `ProductCreateRequest`/
  `ProductUpdateRequest` correctly use), so some persisted variants may carry unit codes
  (`lb`, `oz`) absent from `UnitConversion`'s table. This change does not fix that request
  validation bug; `display_unit_price` must simply resolve to `null` for such variants.
