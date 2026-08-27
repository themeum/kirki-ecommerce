## MODIFIED Requirements

### Requirement: Track quantity conditional quantity grid

When track quantity is checked, the card SHALL show an inner bordered area with Available, Committed (read-only), and Low stock threshold numeric fields in a three-column row. When track quantity is unchecked, the quantity grid MUST NOT be shown.

#### Scenario: Tracking enabled shows quantity fields

- **WHEN** track quantity is checked
- **THEN** Available, Committed, and Low stock threshold fields are visible
- **AND** Committed is not editable

#### Scenario: Tracking disabled hides quantity fields

- **WHEN** track quantity is unchecked
- **THEN** Available, Committed, and Low stock threshold fields are not shown

## REMOVED Requirements

### Requirement: Minimum stock threshold frontend field

**Reason**: The field is renamed to Low stock threshold, and its defining allowance — that the value need only be included in the save payload "even if the backend does not yet persist it" — is no longer true. The `variant-availability-status` capability adds the backing column, so the value is now persisted and read back, and it is what makes the Low Stock state reachable. Replaced by "Low stock threshold field" below.

**Migration**: The form field moves from `variants.0.min_stock_threshold` to `variants.0.low_stock_threshold`. No stored data migrates, because no value was ever persisted under the old name — every product's threshold reads as unset until a merchant sets one, at which point it resolves to the store default.

## ADDED Requirements

### Requirement: Low stock threshold field

The Low stock threshold field SHALL bind to `variants.0.low_stock_threshold` in the unified product form, and SHALL be labelled "Low stock threshold" with supporting text explaining that it triggers a low-stock warning. The value MUST be included in the variant payload on product save, and MUST be persisted and returned by the backend, so that reopening the product shows the value the merchant entered.

Leaving the field empty SHALL submit no threshold for that variant, which resolves to the store default rather than to zero.

#### Scenario: Low stock threshold syncs to variant

- **WHEN** the merchant edits low stock threshold while track quantity is checked
- **THEN** `variants.0.low_stock_threshold` updates in the unified product form

#### Scenario: Low stock threshold round-trips

- **WHEN** the merchant sets a low stock threshold and saves the product
- **THEN** reopening the product shows that same threshold

#### Scenario: An empty threshold defers to the store default

- **WHEN** the merchant leaves low stock threshold empty and saves the product
- **THEN** the variant carries no threshold of its own
- **AND** it is evaluated against the store default
