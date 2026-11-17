## MODIFIED Requirements

### Requirement: The inventory list filters by catalog membership and stock state

The inventory list SHALL offer the same category, collection and brand filters as the product list,
matched against the product each listed variant belongs to. It SHALL additionally offer a stock
filter holding one value, covering in stock, low stock and out of stock, plus a default meaning no
stock filter. Low stock SHALL hold the tracked variants with an available quantity above 0 and at
or under their low-stock threshold (the store default threshold when the variant has none). The
inventory list SHALL NOT offer a publication status filter.

#### Scenario: Filtering variants by category

- **WHEN** a merchant selects a category on the inventory list
- **THEN** the list holds only variants whose product belongs to that category

#### Scenario: Filtering variants by brand

- **WHEN** a merchant selects a brand on the inventory list
- **THEN** the list holds only variants whose product carries that brand

#### Scenario: Filtering variants by stock

- **WHEN** a merchant selects out of stock on the inventory list
- **THEN** the list holds only variants that cannot currently be sold

#### Scenario: Filtering variants by low stock

- **WHEN** the store default threshold is 5 and a merchant selects low stock
- **THEN** the list holds tracked variants with 1 to 5 available (or up to their own threshold), and no variant with 0 or less

#### Scenario: Combining a catalog filter with a stock filter

- **WHEN** a merchant selects a collection and out of stock
- **THEN** the list holds only variants that satisfy both
