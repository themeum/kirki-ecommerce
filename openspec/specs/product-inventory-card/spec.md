# product-inventory-card Specification

## Purpose

Defines the product edit Inventory card layout, conditional field visibility, SKU generation, and synchronization with the product form so merchants can manage stock, SKU, and order limits in a designed, consistent experience.
## Requirements
### Requirement: Inventory card section structure

The product edit Inventory card SHALL present, in order: a track-quantity checkbox; conditional quantity or stock-status controls; a full-width SKU field; then a bottom row with sell-when-out-of-stock and limit-orders controls.

#### Scenario: Card sections are ordered correctly

- **WHEN** a merchant opens the product Inventory card
- **THEN** track quantity appears first
- **AND** SKU appears below the quantity or stock-status section
- **AND** sell-when-out-of-stock and limit-orders controls appear in a bottom row

### Requirement: Track quantity conditional quantity grid

When track quantity is checked, the card SHALL show an inner bordered area with Available, Committed (read-only), and Low stock threshold numeric fields in a three-column row. When track quantity is unchecked, the quantity grid MUST NOT be shown.

#### Scenario: Tracking enabled shows quantity fields

- **WHEN** track quantity is checked
- **THEN** Available, Committed, and Low stock threshold fields are visible
- **AND** Committed is not editable

#### Scenario: Tracking disabled hides quantity fields

- **WHEN** track quantity is unchecked
- **THEN** Available, Committed, and Low stock threshold fields are not shown

### Requirement: Stock status when tracking is off

When track quantity is unchecked, the card SHALL show an In Stock / Out of Stock select control instead of the quantity grid.

#### Scenario: Non-tracking stock status

- **WHEN** track quantity is unchecked
- **THEN** a stock status select with In Stock and Out of Stock options is shown

### Requirement: Full-width SKU with generation

The SKU field SHALL span the full card content width. A wand action beside the
SKU label MUST request a generated SKU from the server and update
`variants.0.sku` in the unified product form with the returned value. The
generated value is rule-based, derived from the product's current form values
rather than from random characters. While the request is in flight the wand MUST
indicate that it is busy and MUST NOT issue a second request; if the request
fails, `variants.0.sku` MUST be left untouched and the failure surfaced to the
merchant. The barcode field MUST NOT be shown in this change.

#### Scenario: SKU wand generates value

- **WHEN** the merchant clicks the SKU wand action
- **THEN** the SKU input is populated with the SKU returned by the server
- **AND** `variants.0.sku` in the unified product form reflects the new SKU

#### Scenario: SKU wand reflects unsaved product values

- **WHEN** the merchant has entered a title, brand, category and attribute
  values but has not saved the product, and clicks the SKU wand action
- **THEN** the generated SKU is derived from those unsaved values

#### Scenario: SKU generation fails

- **WHEN** the merchant clicks the SKU wand action and the request fails
- **THEN** `variants.0.sku` keeps its previous value
- **AND** the merchant is shown an error

#### Scenario: Barcode not shown

- **WHEN** the Inventory card is rendered
- **THEN** no barcode input or barcode actions are displayed

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

### Requirement: Inventory form sync preservation

Inventory field changes MUST propagate to the unified product form via RHF field binding. Toggling track quantity off MUST reset `variants.0.available_quantity` to zero. Server validation errors on inventory fields MUST map onto the unified form with the `variants.0.` prefix stripped.

#### Scenario: Track inventory reset behavior

- **WHEN** the merchant unchecks track quantity
- **THEN** available quantity is reset to zero in the unified form at `variants.0.available_quantity`

#### Scenario: Server errors map to form fields

- **WHEN** the server returns validation errors for inventory fields on the default variant
- **THEN** those errors appear on the corresponding inventory form controls in the unified form

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

