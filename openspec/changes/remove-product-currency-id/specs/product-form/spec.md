## MODIFIED Requirements

### Requirement: Create page default seeding

The create page SHALL fetch default settings (weight unit, dimension unit) and shipping boxes, then merge seeded values into form default values before rendering `ProductForm`. Seeded fields include `variants.0` shipping/weight defaults. A product SHALL NOT carry a currency of its own; every monetary field on the form is denominated in the store's base currency, which the form reads from application configuration rather than from form state.

#### Scenario: Create form seeded from settings

- **WHEN** the create page loads and settings queries resolve
- **THEN** `variants.0.weight_unit`, `variants.0.dimension_unit`, and `variants.0.shipping_box_id` are seeded from product settings and shipping boxes
- **AND** the form default values contain no product currency field

#### Scenario: Submitted payload carries no product currency

- **WHEN** a merchant saves a product from either the create or the edit page
- **THEN** the request body contains no product currency identifier
- **AND** the product is stored without any per-product currency association

#### Scenario: Money fields show the store's base currency

- **WHEN** a merchant opens a product that was created while a different currency was the store's base
- **THEN** every monetary field on the form is labelled with the store's current base currency symbol
- **AND** no previously stored per-product currency affects that label
