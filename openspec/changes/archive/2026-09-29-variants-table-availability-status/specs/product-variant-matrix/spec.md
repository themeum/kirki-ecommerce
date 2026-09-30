## MODIFIED Requirements

### Requirement: Generated variants inherit from their nearest ancestor

A combination not claimed by a saved variant SHALL be generated from the surviving variant sharing the most values with it, inheriting its pricing, weight and dimensions, tax and shipping settings, visibility, media, and low stock threshold. The generated variant SHALL NOT inherit identity or stock: its SKU and barcode SHALL be blank, its available and committed quantities SHALL be zero, and it SHALL NOT be the default variant.

The low stock threshold is inherited because it configures when a variant should warn, rather than recording how much of it exists.

#### Scenario: A generated variant inherits price and media

- **WHEN** Red/M is generated for a product whose surviving Red variant has a price, a sale price and an image
- **THEN** Red/M carries that same price, sale price and image

#### Scenario: A generated variant inherits the low stock threshold

- **WHEN** Red/M is generated from a Red variant whose low stock threshold is five
- **THEN** Red/M's low stock threshold is five

#### Scenario: A generated variant does not inherit identity or stock

- **WHEN** Red/M is generated from a Red variant holding SKU "ABC" and 40 units in stock
- **THEN** Red/M has no SKU and no barcode
- **AND** Red/M has zero available quantity and zero committed quantity
- **AND** the product's total stock is unchanged by the generation

#### Scenario: Generated variants do not collide on SKU

- **WHEN** a product with a SKU on its only variant gains two attributes producing nine combinations
- **AND** the product is saved
- **THEN** the save succeeds
- **AND** no two variants share a SKU
