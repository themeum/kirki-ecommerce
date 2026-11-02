## MODIFIED Requirements

### Requirement: Inventory metrics

Inventory metrics SHALL read the variants as they are now and SHALL NOT use the
date range or the comparison. Each variant's status SHALL
be: when inventory is not tracked, in stock if `in_stock` is set, else out of
stock; when tracked, out of stock if `available_quantity ≤ 0`, low stock if
`available_quantity` ≤ its `low_stock_threshold` (the store default threshold
when the variant has none), else in stock. The product stock shown next to a
product SHALL be Σ `max(available_quantity, 0)` of its tracked variants. The
Inventory health list SHALL contain up to 4 tracked variants with status out of
stock or low stock, lowest `available_quantity` first, and SHALL NOT contain an
in-stock variant.

#### Scenario: Variant without its own threshold

- **WHEN** the store default threshold is 5 and a tracked variant with no threshold has 4 available
- **THEN** the variant is low stock

#### Scenario: Backorder variant

- **WHEN** a tracked variant allows backorders and has −2 available
- **THEN** the variant is out of stock

#### Scenario: In-stock variant with low quantity

- **WHEN** a tracked variant has 1 available and a low-stock threshold of 0
- **THEN** the variant is in stock and the Inventory health list does not contain it
