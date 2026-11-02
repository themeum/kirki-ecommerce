## MODIFIED Requirements

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

## REMOVED Requirements

### Requirement: A tax-inclusive figure is derived, not stored independently of its own base amount

**Reason**: Pricing payloads no longer expose a tax-exclusive and a tax-inclusive figure side by side. Each figure is shown once, in the tax mode it was priced under, read from the recorded catalog prices (see `order-item-catalog-prices`), so no tax-inclusive figure is derived from a tax-exclusive one.

**Migration**: Read the single `*_money_object` figure together with the payload's `is_tax_inclusive` flag. A consumer that needs the other tax treatment uses the item's recorded tax figures.
