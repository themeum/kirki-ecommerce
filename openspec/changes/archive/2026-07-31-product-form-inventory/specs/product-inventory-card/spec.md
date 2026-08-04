## Purpose

Defines the product edit Inventory card layout, conditional field visibility, SKU generation, and synchronization with the product form so merchants can manage stock, SKU, and order limits in a designed, consistent experience.

## ADDED Requirements

### Requirement: Inventory card section structure

The product edit Inventory card SHALL present, in order: a track-quantity checkbox; conditional quantity or stock-status controls; a full-width SKU field; then a bottom row with sell-when-out-of-stock and limit-orders controls.

#### Scenario: Card sections are ordered correctly

- **WHEN** a merchant opens the product Inventory card
- **THEN** track quantity appears first
- **AND** SKU appears below the quantity or stock-status section
- **AND** sell-when-out-of-stock and limit-orders controls appear in a bottom row

### Requirement: Track quantity conditional quantity grid

When track quantity is checked, the card SHALL show an inner bordered area with Available, Committed (read-only), and Minimum stock threshold numeric fields in a three-column row. When track quantity is unchecked, the quantity grid MUST NOT be shown.

#### Scenario: Tracking enabled shows quantity fields

- **WHEN** track quantity is checked
- **THEN** Available, Committed, and Minimum stock threshold fields are visible
- **AND** Committed is not editable

#### Scenario: Tracking disabled hides quantity fields

- **WHEN** track quantity is unchecked
- **THEN** Available, Committed, and Minimum stock threshold fields are not shown

### Requirement: Stock status when tracking is off

When track quantity is unchecked, the card SHALL show an In Stock / Out of Stock select control instead of the quantity grid.

#### Scenario: Non-tracking stock status

- **WHEN** track quantity is unchecked
- **THEN** a stock status select with In Stock and Out of Stock options is shown

### Requirement: Full-width SKU with generation

The SKU field SHALL span the full card content width. A wand action beside the SKU label MUST generate a random SKU in `SKU-XXX-1234` style and update the form and product context. The barcode field MUST NOT be shown in this change.

#### Scenario: SKU wand generates value

- **WHEN** the merchant clicks the SKU wand action
- **THEN** the SKU input is populated with a newly generated random SKU
- **AND** the product form context reflects the new SKU on the default variant

#### Scenario: Barcode not shown

- **WHEN** the Inventory card is rendered
- **THEN** no barcode input or barcode actions are displayed

### Requirement: Sell when out of stock toggle

The card SHALL always show a "Sell when out of stock" checkbox in the bottom row. Toggling it MUST sync to product-level `allow_back_order` in the product form context.

#### Scenario: Sell when out of stock is always visible

- **WHEN** the Inventory card is rendered regardless of track quantity state
- **THEN** the sell-when-out-of-stock checkbox is visible

#### Scenario: Sell when out of stock syncs to product

- **WHEN** the merchant toggles sell when out of stock
- **THEN** product-level allow back order updates in the product form context

### Requirement: Limit orders two-state row

The limit-orders control SHALL be a checkbox with label info text. When unchecked, the row MUST show only the checkbox, label, and info icon. When checked, the row MUST also show a numeric max-per-order input on the right. The right-side input MUST NOT reserve layout space while hidden.

#### Scenario: Limit orders unchecked

- **WHEN** limit orders to number of item is unchecked
- **THEN** the row shows checkbox, label, and info icon only

#### Scenario: Limit orders checked

- **WHEN** limit orders to number of item is checked
- **THEN** a max-per-order numeric input appears on the right

### Requirement: Minimum stock threshold frontend field

The Minimum stock threshold field SHALL bind to variant-level `min_stock_threshold` in the inventory form schema and product form context. The value MUST be included in the variant payload on product save even if the backend does not yet persist it.

#### Scenario: Minimum stock threshold syncs to variant

- **WHEN** the merchant edits minimum stock threshold while track quantity is checked
- **THEN** the default variant min stock threshold updates in the product form context

### Requirement: Inventory form sync preservation

Inventory field changes MUST continue to propagate to the product form context via the existing watch-based sync. Toggling track quantity off MUST reset available quantity to zero as today. Server validation errors on inventory fields MUST continue to map onto the form with the variants prefix stripped.

#### Scenario: Track inventory reset behavior

- **WHEN** the merchant unchecks track quantity
- **THEN** available quantity is reset to zero in form and product context

#### Scenario: Server errors map to form fields

- **WHEN** the server returns validation errors for inventory fields on the default variant
- **THEN** those errors appear on the corresponding inventory form controls
