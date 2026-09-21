## Purpose

Defines which price the admin product list shows for a product with several variants, so a discount on the cheapest variant is never hidden.

## ADDED Requirements

### Requirement: The product list shows the lowest effective price with its own regular price

For each product, the admin product list SHALL find the variant whose effective price is lowest and show that variant's regular price and, when it is on sale, its sale price. A variant's effective price is its sale price when the sale price is set, greater than zero and lower than its regular price, and its regular price otherwise. A variant without a sale price SHALL NOT remove the sale price of another variant.

#### Scenario: The cheapest variant is on sale

- **WHEN** a product has variant A at regular 100 with sale 50 and variant B at regular 60 with no sale
- **THEN** the list shows regular price 100 and sale price 50

#### Scenario: A more expensive variant is on sale

- **WHEN** a product has variant A at regular 100 with sale 90 and variant B at regular 60 with no sale
- **THEN** the list shows regular price 60 and no sale price

#### Scenario: No variant is on sale

- **WHEN** no variant of a product has a sale price
- **THEN** the list shows the lowest regular price and no sale price

#### Scenario: Single variant

- **WHEN** a product has one variant
- **THEN** the list shows that variant's regular price and, if on sale, its sale price
