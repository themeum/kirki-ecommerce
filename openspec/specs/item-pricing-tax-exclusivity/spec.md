# item-pricing-tax-exclusivity Specification

## Purpose

Defines how every price the calculation engine derives for a line item — its subtotal, its regular-price (strikethrough) total, its unit price, and its regular unit price — represents tax, so the same figure means the same thing on every order and cart calculation regardless of the store's tax-inclusive-pricing setting, and so downstream resources and reporting queries can reliably derive both a tax-exclusive and a tax-inclusive figure from what's stored.

## Requirements

### Requirement: A calculated line item's subtotal and regular-price total always exclude tax

A calculated line item's subtotal, and the regular-price total used to derive its strikethrough price, SHALL always be amounts that exclude tax, independent of the store's tax-inclusive-pricing setting. Under tax-exclusive pricing, both are already net of tax and are unaffected. Under tax-inclusive pricing, the tax portion embedded in the item's catalog price SHALL be excluded from both before they are stored or returned.

#### Scenario: Tax-exclusive pricing

- **WHEN** the store prices items exclusive of tax
- **THEN** a calculated line item's subtotal and regular-price total equal its catalog price totals, unaffected by tax

#### Scenario: Tax-inclusive pricing

- **WHEN** the store prices items inclusive of tax
- **THEN** a calculated line item's subtotal and regular-price total each equal their catalog price total minus the tax portion embedded in that price, not the tax-inclusive catalog price itself

#### Scenario: Discounted item under tax-inclusive pricing

- **WHEN** a line item priced under tax-inclusive pricing also has a discount applied
- **THEN** the tax excluded from its subtotal is proportional to the item's own catalog price, so the final amount charged for the item is unaffected by how the subtotal is decomposed

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

### Requirement: A tax-inclusive figure is derived, not stored independently of its own base amount

Anywhere a tax-exclusive and a tax-inclusive figure are both exposed for the same line-item or order-level amount, the tax-inclusive figure SHALL be derived from the tax-exclusive figure and a tax amount computed against that same base. It SHALL NOT be computed from a tax amount that was computed against a different base.

When the tax-exclusive figure shares the same taxed base as one of the item's recorded tax amounts — its current-price tax total (the item's current subtotal or order/cart total) or its regular-price tax total (the item's regular-price total) — the inclusive figure SHALL be derived by adding that recorded tax amount directly, since the two amounts were computed against the same base and the addition is exact.

When the tax-exclusive figure does not share either of those recorded bases (a strikethrough figure that is neither the item's current subtotal nor its regular-price total — for example, the subtotal before an item-level coupon discount on an item that is simultaneously on sale, where the "was" price shown is the pre-coupon amount at the sale price), the inclusive figure SHALL instead be derived by scaling the tax-exclusive figure by the item's effective tax rate, reconstructed from the item's own current-price exclusive amount and tax total. It SHALL NOT be derived by adding a recorded tax amount computed against a different base, since that would misstate the result.

#### Scenario: Deriving the inclusive figure for the current price

- **WHEN** both a tax-exclusive and a tax-inclusive figure are exposed for a line item's subtotal
- **THEN** the tax-inclusive figure equals the tax-exclusive figure plus the item's own current-price tax total

#### Scenario: Deriving the inclusive figure for a strikethrough price that is the regular-price total

- **WHEN** a line item's strikethrough price is its regular-price total — either because it is on sale with no item-level coupon, or because an item-level coupon applies while it is not on sale (its subtotal before that coupon equals its regular-price total)
- **THEN** the tax-inclusive figure equals the tax-exclusive strikethrough figure plus the item's own regular-price tax total

#### Scenario: Deriving the inclusive figure for a strikethrough price that is neither recorded base

- **WHEN** a line item's strikethrough price is the subtotal before an item-level coupon discount, and the item is simultaneously on sale (so that pre-coupon subtotal is at the sale price, not the regular price)
- **THEN** the tax-inclusive figure is the tax-exclusive strikethrough figure scaled by the item's effective tax rate, not the tax-exclusive strikethrough figure plus either recorded tax total
