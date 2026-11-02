# item-pricing-tax-exclusivity Specification

## Purpose

Defines how every price the calculation engine derives for a line item — its subtotal, its regular-price (strikethrough) total, its unit price, and its regular unit price — represents tax, so the same figure means the same thing on every order and cart calculation regardless of the store's tax-inclusive-pricing setting, and so downstream resources and reporting queries can reliably derive both a tax-exclusive and a tax-inclusive figure from what's stored.

## Requirements

### Requirement: A calculated line item's subtotal and regular-price total always exclude tax

A calculated line item's subtotal, and the regular-price total used to derive its strikethrough price, SHALL always be amounts that exclude tax, independent of the store's tax-inclusive-pricing setting. Under tax-exclusive pricing, both are already net of tax and are unaffected. Under tax-inclusive pricing, the tax portion embedded in the item's catalog price SHALL be excluded from both before they are stored or returned.

Under tax-inclusive pricing, the tax excluded from the item's subtotal SHALL be the item's tax calculated before any discount, so the subtotal is correct however large the item's discount is.

#### Scenario: Tax-exclusive pricing

- **WHEN** the store prices items exclusive of tax
- **THEN** a calculated line item's subtotal and regular-price total equal its catalog price totals, unaffected by tax

#### Scenario: Tax-inclusive pricing

- **WHEN** the store prices items inclusive of tax
- **THEN** a calculated line item's subtotal and regular-price total each equal their catalog price total minus the tax portion embedded in that price, not the tax-inclusive catalog price itself

#### Scenario: Discounted item under tax-inclusive pricing

- **WHEN** a line item priced under tax-inclusive pricing also has a discount applied
- **THEN** the tax excluded from its subtotal is proportional to the item's own catalog price, so the final amount charged for the item is unaffected by how the subtotal is decomposed

#### Scenario: Item discounted to zero under tax-inclusive pricing

- **WHEN** a line item priced at 110.00 including 10% tax is discounted by 100%
- **THEN** its subtotal is 100.00, not 110.00, and its tax total is 0.00

### Requirement: An order item's recorded unit price and regular unit price always exclude tax

When an order item is created, its recorded unit price (the price actually charged) and regular unit price SHALL both exclude tax, independent of the store's tax-inclusive-pricing setting at the time of placement, on the same terms as the item's subtotal. This SHALL hold in both the store's base currency and the order's invoiced currency.

#### Scenario: Order placed under tax-inclusive pricing

- **WHEN** an order is placed for a variant while the store prices items inclusive of tax
- **THEN** the order item's recorded unit price and regular unit price each exclude the tax portion embedded in the variant's catalog price

#### Scenario: On-sale comparison remains valid

- **WHEN** an order item was bought while a sale price was active, under tax-inclusive pricing
- **THEN** its recorded regular unit price is still greater than its recorded (charged) unit price, so whether the item was bought on sale can still be determined by comparing the two

### Requirement: The final amount charged is unaffected by how a price excludes tax

Excluding tax from a line item's subtotal, regular-price total, unit price, or regular unit price SHALL NOT change the final total charged for that item or for the order/cart as a whole, under either tax-inclusive or tax-exclusive pricing. Only how each price is decomposed changes, not the amount collected.

#### Scenario: Total charged unchanged under tax-inclusive pricing

- **WHEN** a line item is calculated under tax-inclusive pricing
- **THEN** its final total (subtotal plus tax, minus any discount) equals what it would have been before these prices were made to exclude tax

### Requirement: A calculated line item's regular-price total has its own recorded tax amount

A calculated line item SHALL carry the tax amount belonging to its regular-price total (`base_regular_unit_price` × quantity) as its own figure, computed the same way the item's current-price tax is computed, independent of the store's tax-inclusive-pricing setting. This tax amount SHALL be persisted onto the order item (`base_regular_tax_total`/`invoiced_regular_tax_total`), alongside the item's existing `base_tax_total`/`invoiced_tax_total`.

#### Scenario: Regular-price tax recorded alongside current-price tax

- **WHEN** a line item is calculated, whether or not it is currently on sale or discounted
- **THEN** the tax amount for its regular-price total is computed and recorded, using the same effective tax rate as the item's current-price tax
