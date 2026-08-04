## MODIFIED Requirements

### Requirement: Sell when out of stock toggle

The card SHALL always show a "Sell when out of stock" checkbox in the bottom row. Toggling it MUST sync to variant-level `allow_back_order` on `variants[0]` in the unified product form.

#### Scenario: Sell when out of stock is always visible

- **WHEN** the Inventory card is rendered regardless of track quantity state
- **THEN** the sell-when-out-of-stock checkbox is visible

#### Scenario: Sell when out of stock syncs to variant

- **WHEN** the merchant toggles sell when out of stock
- **THEN** `variants.0.allow_back_order` updates in the unified product form

### Requirement: Limit orders two-state row

The limit-orders control SHALL be a checkbox with label info text. When unchecked, the row MUST show only the checkbox, label, and info icon. When checked, the row MUST also show a numeric max-per-order input on the right bound to `variants.0.max_per_order`. The right-side input MUST NOT reserve layout space while hidden.

#### Scenario: Limit orders unchecked

- **WHEN** limit orders to number of item is unchecked
- **THEN** the row shows checkbox, label, and info icon only

#### Scenario: Limit orders checked

- **WHEN** limit orders to number of item is checked
- **THEN** a max-per-order numeric input appears on the right bound to `variants.0.max_per_order`

### Requirement: Full-width SKU with generation

The SKU field SHALL span the full card content width. A wand action beside the SKU label MUST generate a random SKU in `SKU-XXX-1234` style and update `variants.0.sku` in the unified product form. The barcode field MUST NOT be shown in this change.

#### Scenario: SKU wand generates value

- **WHEN** the merchant clicks the SKU wand action
- **THEN** the SKU input is populated with a newly generated random SKU
- **AND** `variants.0.sku` in the unified product form reflects the new SKU

#### Scenario: Barcode not shown

- **WHEN** the Inventory card is rendered
- **THEN** no barcode input or barcode actions are displayed

### Requirement: Minimum stock threshold frontend field

The Minimum stock threshold field SHALL bind to `variants.0.min_stock_threshold` in the unified product form. The value MUST be included in the variant payload on product save even if the backend does not yet persist it.

#### Scenario: Minimum stock threshold syncs to variant

- **WHEN** the merchant edits minimum stock threshold while track quantity is checked
- **THEN** `variants.0.min_stock_threshold` updates in the unified product form

### Requirement: Inventory form sync preservation

Inventory field changes MUST propagate to the unified product form via RHF field binding. Toggling track quantity off MUST reset `variants.0.available_quantity` to zero. Server validation errors on inventory fields MUST map onto the unified form with the `variants.0.` prefix stripped.

#### Scenario: Track inventory reset behavior

- **WHEN** the merchant unchecks track quantity
- **THEN** available quantity is reset to zero in the unified form at `variants.0.available_quantity`

#### Scenario: Server errors map to form fields

- **WHEN** the server returns validation errors for inventory fields on the default variant
- **THEN** those errors appear on the corresponding inventory form controls in the unified form
