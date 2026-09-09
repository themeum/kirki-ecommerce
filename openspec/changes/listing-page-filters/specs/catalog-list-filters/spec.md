## Purpose

Defines how a merchant narrows the product list and the inventory list by catalog
membership and stock state, so that both screens filter the same catalog concepts in the
same way even though one lists products and the other lists their variants.

## ADDED Requirements

### Requirement: The product list filters by catalog membership

The product list SHALL offer a category filter that accepts several categories at once, and a
collection filter and a brand filter that each accept one value. A product SHALL be listed when it
belongs to any one of the selected categories, and when it belongs to the selected collection, and
when it carries the selected brand. Selecting a collection SHALL narrow the list; a collection
selection that leaves the list unchanged is a defect.

#### Scenario: Filtering by several categories

- **WHEN** a merchant selects two categories
- **THEN** the list holds every product belonging to either category
- **AND** holds no product belonging to neither

#### Scenario: Filtering by collection

- **WHEN** a merchant selects a collection
- **THEN** the list holds only products belonging to that collection

#### Scenario: Filtering by brand

- **WHEN** a merchant selects a brand
- **THEN** the list holds only products carrying that brand

#### Scenario: Combining catalog filters

- **WHEN** a merchant selects a category and a brand
- **THEN** the list holds only products that satisfy both

#### Scenario: No catalog filter selected

- **WHEN** no category, collection or brand is selected
- **THEN** catalog membership does not narrow the list

### Requirement: The product list filters by publication status

The product list SHALL offer a status filter holding one value, covering published, draft and
trashed products, plus a default meaning no status filter. With no status selected, the list SHALL
exclude trashed products; trashed products SHALL be reachable only by selecting the trashed status
explicitly.

#### Scenario: Filtering by draft

- **WHEN** a merchant selects the draft status
- **THEN** the list holds only draft products

#### Scenario: Reaching trashed products

- **WHEN** a merchant selects the trashed status
- **THEN** the list holds only trashed products

#### Scenario: No status selected

- **WHEN** no status is selected
- **THEN** the list holds published and draft products
- **AND** holds no trashed product

### Requirement: The product list filters by stock state

The product list SHALL offer a stock filter holding one value, covering in stock, out of stock,
partially stocked and low stock, plus a default meaning no stock filter. Stock state SHALL be
derived from a product's variants, honouring whether each variant tracks inventory and the store's
configured low-stock threshold.

#### Scenario: Filtering by out of stock

- **WHEN** a merchant selects out of stock
- **THEN** the list holds only products with no variant available to sell

#### Scenario: Filtering by low stock

- **WHEN** a merchant selects low stock
- **THEN** the list holds only products whose tracked stock has fallen to the store's low-stock threshold

#### Scenario: Filtering by partially stocked

- **WHEN** a merchant selects partially stocked
- **THEN** the list holds only products where some variants can be sold and others cannot

### Requirement: The inventory list filters by catalog membership and stock state

The inventory list SHALL offer the same category, collection and brand filters as the product list,
matched against the product each listed variant belongs to. It SHALL additionally offer a stock
filter holding one value, covering in stock and out of stock, plus a default meaning no stock
filter. The inventory list SHALL NOT offer a publication status filter.

#### Scenario: Filtering variants by category

- **WHEN** a merchant selects a category on the inventory list
- **THEN** the list holds only variants whose product belongs to that category

#### Scenario: Filtering variants by brand

- **WHEN** a merchant selects a brand on the inventory list
- **THEN** the list holds only variants whose product carries that brand

#### Scenario: Filtering variants by stock

- **WHEN** a merchant selects out of stock on the inventory list
- **THEN** the list holds only variants that cannot currently be sold

#### Scenario: Combining a catalog filter with a stock filter

- **WHEN** a merchant selects a collection and out of stock
- **THEN** the list holds only variants that satisfy both

### Requirement: Catalog filter selections survive in the address

A catalog filter in force SHALL be recorded in the browser address, so that reloading the screen or
sharing its address reproduces the same filtered list. A filter left at its default SHALL NOT appear
in the address.

#### Scenario: Reloading a filtered list

- **WHEN** a merchant applies a brand filter and reloads the screen
- **THEN** the same brand filter is in force and shown in its control

#### Scenario: Sharing a filtered address

- **WHEN** a merchant opens an address carrying a category and a stock filter
- **THEN** both filters are in force and the list is narrowed by both

#### Scenario: A default-valued filter

- **WHEN** a filter control is left at its default
- **THEN** it does not appear in the address
