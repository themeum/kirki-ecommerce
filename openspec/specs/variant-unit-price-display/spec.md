# variant-unit-price-display Specification

## Purpose

Exposes a computed, currency-aware unit price (e.g. "$30.00/1kg") on variant API
responses, so any consumer of `VariantResource` can show per-unit pricing without
re-implementing the ratio/normalization math itself.

## Requirements

### Requirement: Variant resource includes a formatted unit price
`VariantResource` SHALL include a `display_unit_price` field. When the variant's
`show_unit_price` flag is true and its unit data (`base_unit`, `base_unit_amount`,
`total_unit`, `total_unit_amount`) is complete and resolvable, `display_unit_price`
SHALL be a string combining the per-base-unit price — in the visitor's resolved
display currency — with the base unit quantity and label, in the form
`"{formatted price}/{base_unit_amount}{base_unit}"` (e.g. `"$30.00/1kg"`).

#### Scenario: Variant has unit pricing enabled with compatible units
- **WHEN** a variant has `show_unit_price = true`, `base_price` of 3000 (minor units),
  `base_unit_amount = 1`, `base_unit = "kg"`, `total_unit_amount = 1`, `total_unit = "kg"`,
  and the visitor's display currency is USD
- **THEN** `display_unit_price` is `"$30.00/1kg"`

#### Scenario: Unit price prefers the active sale price
- **WHEN** a variant has `show_unit_price = true` and both `base_price` and a non-null
  `base_sale_price` set
- **THEN** `display_unit_price` is computed from `base_sale_price`, not `base_price`

#### Scenario: Unit price respects the visitor's display currency
- **WHEN** a variant has `show_unit_price = true` and the visitor's resolved display
  currency differs from the store's base currency
- **THEN** the price portion of `display_unit_price` is converted and formatted in the
  visitor's display currency, consistent with `display_price` on the same resource

### Requirement: Unit price shown flag disables the field
`VariantResource` SHALL return `display_unit_price` as `null` whenever the variant's
`show_unit_price` flag is falsy, regardless of whether unit data is otherwise present.

#### Scenario: Unit pricing is disabled for the variant
- **WHEN** a variant has `show_unit_price = false`
- **THEN** `display_unit_price` is `null`, even if `base_unit`, `base_unit_amount`,
  `total_unit`, and `total_unit_amount` are all set

### Requirement: Unit price fails soft on unusable unit data
`VariantResource` SHALL return `display_unit_price` as `null`, never raise an error,
when `show_unit_price` is true but the variant's unit data cannot produce a valid
computation — including missing fields, a `base_unit` or `total_unit` value not
recognized by the unit conversion table, `base_unit` and `total_unit` belonging to
incompatible measurement groups (e.g. a weight unit against a volume unit), or a
`base_unit_amount` of zero.

#### Scenario: Unit code not recognized
- **WHEN** a variant has `show_unit_price = true` and `base_unit` set to a value not
  present in the unit conversion table (e.g. a legacy `"lb"` or `"oz"` value persisted
  before unit validation was corrected)
- **THEN** `display_unit_price` is `null`

#### Scenario: Units belong to incompatible measurement groups
- **WHEN** a variant has `show_unit_price = true`, `base_unit` set to a weight unit
  (e.g. `"kg"`), and `total_unit` set to a volume unit (e.g. `"l"`)
- **THEN** `display_unit_price` is `null`

#### Scenario: Base unit amount is zero
- **WHEN** a variant has `show_unit_price = true` and `base_unit_amount = 0`
- **THEN** `display_unit_price` is `null`

#### Scenario: Required unit fields are missing
- **WHEN** a variant has `show_unit_price = true` and one or more of `base_unit`,
  `base_unit_amount`, `total_unit`, `total_unit_amount` is `null`
- **THEN** `display_unit_price` is `null`
