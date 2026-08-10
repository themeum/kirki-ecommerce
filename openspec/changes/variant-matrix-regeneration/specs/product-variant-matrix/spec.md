## Purpose

Defines how a product's variant grid is derived from its attributes: which combinations exist, which saved variants survive an attribute or value change and what they keep, what newly generated variants inherit, and the integrity rules a product payload must satisfy before it is persisted.

## ADDED Requirements

### Requirement: The variant grid is the cartesian product of the attributes

A product's variants SHALL correspond one-to-one with the cartesian product of its attributes' selected values, ordered by attribute order and then by value order within each attribute. A product with no attributes SHALL have exactly one variant carrying an empty value set.

#### Scenario: Two attributes produce every combination

- **WHEN** a product has Color with 3 values and Size with 3 values
- **THEN** the product has exactly 9 variants
- **AND** each variant's value set is a distinct pairing of one Color value and one Size value

#### Scenario: A product with no attributes has a single variant

- **WHEN** a product has no attributes
- **THEN** it has exactly one variant
- **AND** that variant's value set is empty

### Requirement: Saved variants survive attribute changes

When the attribute set changes, each saved variant SHALL be preserved — retaining its identity, SKU, barcode, inventory, media and pricing — by being carried into the first combination it remains compatible with. A saved variant is compatible with a combination when, for every value it holds whose attribute is still present, the combination holds that same value. Values belonging to an attribute that was removed entirely impose no constraint. Each combination SHALL be claimed by at most one saved variant, and saved variants SHALL be considered in their existing order.

A saved variant that is compatible with no remaining combination SHALL be discarded, and SHALL be deleted from storage when the product is next saved.

#### Scenario: Adding an attribute preserves existing variants

- **WHEN** a product has saved variants Red and Blue with their own SKUs and stock, and Size with values S and M is added
- **THEN** the grid becomes Red/S, Red/M, Blue/S, Blue/M
- **AND** Red/S retains the identity, SKU, stock and price previously held by Red
- **AND** Blue/S retains the identity, SKU, stock and price previously held by Blue
- **AND** no saved variant is deleted when the product is saved

#### Scenario: Removing an attribute keeps the earliest survivor

- **WHEN** a product has saved variants Red/S, Red/M, Blue/S and Blue/M, and the Size attribute is removed
- **THEN** the grid becomes Red and Blue
- **AND** Red retains the identity, SKU and stock previously held by Red/S
- **AND** Blue retains the identity, SKU and stock previously held by Blue/S
- **AND** Red/M and Blue/M are discarded

#### Scenario: Adding a value to an existing attribute

- **WHEN** a product has saved variants Red and Blue, and the value Green is added to the Color attribute
- **THEN** the grid becomes Red, Blue and Green
- **AND** Red and Blue retain their identity and data
- **AND** Green is a newly generated variant

#### Scenario: Removing a value discards only its variants

- **WHEN** a product has saved variants Red, Blue and Green, and the value Green is removed from the Color attribute
- **THEN** the grid becomes Red and Blue
- **AND** Red and Blue retain their identity and data
- **AND** the Green variant is discarded

#### Scenario: Reordering attributes preserves every variant

- **WHEN** a product's attributes are reordered from Color, Size to Size, Color
- **THEN** every saved variant retains its identity and data
- **AND** only the order in which variants are presented changes

#### Scenario: A simple product gains its first attribute

- **WHEN** a product has a single saved variant with no attributes, holding a price, SKU and stock, and Color with values Red and Blue is added
- **THEN** the grid becomes Red and Blue
- **AND** Red retains the identity, SKU, stock and price of the previous single variant

#### Scenario: Removing the last attribute returns a simple product

- **WHEN** a product's only remaining attribute is removed
- **THEN** the product has exactly one variant with an empty value set
- **AND** that variant retains the identity, SKU, stock and price of the first saved variant

### Requirement: Generated variants inherit from their nearest ancestor

A combination not claimed by a saved variant SHALL be generated from the surviving variant sharing the most values with it, inheriting its pricing, weight and dimensions, tax and shipping settings, visibility, and media. The generated variant SHALL NOT inherit identity or stock: its SKU and barcode SHALL be blank, its available and committed quantities SHALL be zero, and it SHALL NOT be the default variant.

#### Scenario: A generated variant inherits price and media

- **WHEN** Red/M is generated for a product whose surviving Red variant has a price, a sale price and an image
- **THEN** Red/M carries that same price, sale price and image

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

### Requirement: Exactly one variant is the default

A product SHALL have exactly one default variant at all times. When regeneration leaves exactly one surviving default it SHALL be kept; otherwise the first variant in the grid SHALL become the default and all others SHALL be cleared. A product loaded for editing SHALL be normalized to a single default before it can be submitted, so that a product written by a client outside this form remains editable.

#### Scenario: The surviving default is kept

- **WHEN** an attribute is added and the previously default variant survives
- **THEN** that variant is still the only default

#### Scenario: A discarded default is replaced

- **WHEN** the default variant is discarded by an attribute change
- **THEN** the first variant in the grid becomes the default
- **AND** no other variant is marked default

#### Scenario: A product stored with several defaults stays editable

- **WHEN** a merchant opens a product whose variants are all marked default and saves it without touching its attributes
- **THEN** the save succeeds
- **AND** the stored product ends with exactly one default variant

### Requirement: The product API rejects an inconsistent variant matrix

Product create and update requests SHALL be rejected when the submitted variants do not form a valid matrix. Specifically: each variant's value ids MUST all belong to an attribute listed on the same request; the number of values on each variant MUST equal the number of attributes; no two variants may carry the same combination of values; exactly one variant MUST be marked default; and on update, a variant's value set MUST be supplied whenever the product has attributes.

#### Scenario: A value from an unlisted attribute is rejected

- **WHEN** a product is submitted with a variant referencing a value that belongs to no attribute on the request
- **THEN** the request is rejected with a validation error

#### Scenario: Duplicate combinations are rejected

- **WHEN** a product is submitted with two variants carrying the same combination of values
- **THEN** the request is rejected with a validation error

#### Scenario: Omitting values on update is rejected

- **WHEN** a product that has attributes is updated with a variant that supplies no value set
- **THEN** the request is rejected with a validation error
- **AND** the product's existing variant-to-value associations are left intact

#### Scenario: A simple product supplies no values

- **WHEN** a product with no attributes is submitted with a single variant carrying an empty value set
- **THEN** the request is accepted
