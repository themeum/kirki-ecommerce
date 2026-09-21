## MODIFIED Requirements

### Requirement: Tax-inclusive and tax-exclusive pricing are both supported per line

Every item tax line SHALL be computable either as an amount added on top of
a taxable base (tax-exclusive) or as an amount extracted from a
tax-inclusive base, according to the store's pricing setting. Shipping is
never sold at a tax-inclusive price, regardless of the store's
tax-inclusive-price setting for products: every shipping tax line SHALL
always be computed as an amount added on top of the shipping charge, and
the shipping charge included in any total SHALL always have its tax added
on top rather than extracted from it.

#### Scenario: Tax-exclusive pricing

- **WHEN** the store prices items exclusive of tax
- **THEN** each item tax line's amount is computed as additional to the
  item's base amount

#### Scenario: Tax-inclusive pricing

- **WHEN** the store prices items inclusive of tax
- **THEN** each item tax line's amount is computed as extracted from the
  item's base amount, not added on top of it

#### Scenario: Tax-inclusive pricing with taxable shipping

- **WHEN** the store prices items inclusive of tax and the shipping charge
  is taxable
- **THEN** the shipping tax line's amount is still computed as additional
  to the shipping charge, not extracted from it, and that tax amount is
  added on top of the shipping charge in any total that includes shipping

#### Scenario: Tax-exclusive pricing with taxable shipping

- **WHEN** the store prices items exclusive of tax and the shipping charge
  is taxable
- **THEN** the shipping tax line's amount is computed as additional to the
  shipping charge, and that tax amount is added on top of the shipping
  charge in any total that includes shipping
