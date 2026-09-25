## MODIFIED Requirements

### Requirement: Variant resource includes a formatted unit price
`VariantResource` SHALL include a `display_unit_price` field. When the variant's
unit data (`base_unit`, `base_unit_amount`, `total_unit`, `total_unit_amount`) is
complete and resolvable, `display_unit_price` SHALL be a string combining the
per-base-unit price — in the visitor's resolved display currency — with the base
unit quantity and label, in the form
`"{formatted price}/{base_unit_amount}{base_unit}"` (e.g. `"$30.00/1kg"`).
No separate per-variant or store-wide flag SHALL be consulted.

#### Scenario: Variant has complete unit data with compatible units
- **WHEN** a variant has `base_price` of 3000 (minor units),
  `base_unit_amount = 1`, `base_unit = "kg"`, `total_unit_amount = 1`, `total_unit = "kg"`,
  and the visitor's display currency is USD
- **THEN** `display_unit_price` is `"$30.00/1kg"`

#### Scenario: Unit price prefers the active sale price
- **WHEN** a variant has complete unit data and both `base_price` and a non-null
  `base_sale_price` set
- **THEN** `display_unit_price` is computed from `base_sale_price`, not `base_price`

#### Scenario: Unit price respects the visitor's display currency
- **WHEN** a variant has complete unit data and the visitor's resolved display
  currency differs from the store's base currency
- **THEN** the price portion of `display_unit_price` is converted and formatted in the
  visitor's display currency, consistent with `display_price` on the same resource

### Requirement: Unit price fails soft on unusable unit data
`VariantResource` SHALL return `display_unit_price` as `null`, never raise an error,
when the variant's unit data cannot produce a valid computation — including missing
fields, a `base_unit` or `total_unit` value not recognized by the unit conversion
table, `base_unit` and `total_unit` belonging to incompatible measurement groups
(e.g. a weight unit against a volume unit), or a `base_unit_amount` of zero.

#### Scenario: Unit code not recognized
- **WHEN** a variant has `base_unit` set to a value not present in the unit
  conversion table (e.g. a legacy `"lb"` or `"oz"` value persisted before unit
  validation was corrected)
- **THEN** `display_unit_price` is `null`

#### Scenario: Units belong to incompatible measurement groups
- **WHEN** a variant has `base_unit` set to a weight unit (e.g. `"kg"`), and
  `total_unit` set to a volume unit (e.g. `"l"`)
- **THEN** `display_unit_price` is `null`

#### Scenario: Base unit amount is zero
- **WHEN** a variant has `base_unit_amount = 0`
- **THEN** `display_unit_price` is `null`

#### Scenario: Required unit fields are missing
- **WHEN** one or more of `base_unit`, `base_unit_amount`, `total_unit`,
  `total_unit_amount` is `null`
- **THEN** `display_unit_price` is `null`

## REMOVED Requirements

### Requirement: Unit price shown flag disables the field
**Reason**: The `show_unit_price` column and the `product.is_unit_price_visible`
setting are both removed. Unit data completeness is now the only condition on
whether a unit price is displayed, so a requirement describing a flag that
suppresses otherwise-valid data no longer has a subject.

**Migration**: Variants keep their stored unit data. A variant that held complete
unit data while the flag was false — or any such variant on a store where the
store-wide setting was off — begins returning a non-null `display_unit_price`
after the upgrade. A merchant who does not want a unit price displayed clears the
variant's unit fields.
