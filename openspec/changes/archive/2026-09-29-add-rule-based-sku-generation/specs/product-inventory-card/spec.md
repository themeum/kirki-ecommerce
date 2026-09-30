## MODIFIED Requirements

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
