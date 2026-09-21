## MODIFIED Requirements

### Requirement: Variant columns presented by the grid

The grid SHALL present exactly the following columns, in order: Variants, Price, Sale Price, Cost of Goods, Profit, Margin, Base price per unit, SKU, Dimension, Weight, Track Inventory, Availability, Committed, Low Stock Threshold, Limit Purchase, Limit, Visibility, Charge Tax, Tax profile, Shipping Profile.

The Variants column SHALL show the variant's image and its identity (variant name and attribute combination). Profit, Margin, and Committed SHALL be read-only. Profit and Margin SHALL be derived from the row's current price, sale price, and cost of goods rather than stored. Weight SHALL present its amount and unit as one column. Dimension SHALL select a shipping box and SHALL display the chosen box's name and its length, width, and height.

Tax profile and Shipping Profile options SHALL be sourced from the tax-profile and shipping-profile collections. The grid MUST NOT present hardcoded, fictional, or empty option lists for these fields.

#### Scenario: Derived columns react to edits

- **WHEN** the merchant changes a row's price, sale price, or cost of goods
- **THEN** that row's Profit and Margin update to reflect the new values
- **AND** neither Profit nor Margin can be edited directly

#### Scenario: Profile options come from the store's own records

- **WHEN** the merchant opens the Tax profile or Shipping Profile control on any row
- **THEN** the options listed are the store's configured tax profiles or shipping profiles

#### Scenario: No standalone unit-price toggle column

- **WHEN** the merchant scans the grid's columns
- **THEN** there is no separate Unit price column, because whether a unit price exists is expressed by the Base price per unit cell's own value

### Requirement: Gated cells

Availability and Low Stock Threshold SHALL present an editable control only while the row tracks inventory. Limit SHALL present an editable control only while the row limits purchase quantity. Tax profile SHALL present an editable control only while the row charges tax. When the gate is off, the cell SHALL show a non-editable placeholder. Base price per unit SHALL NOT be gated — it is editable on every row.

#### Scenario: Gate turned off hides the control

- **WHEN** a row does not track inventory
- **THEN** its Availability and Low Stock Threshold cells show a placeholder instead of an editable control

#### Scenario: Gate turned on reveals the stored value

- **WHEN** the merchant enables inventory tracking on a row that already holds an availability value
- **THEN** the Availability cell becomes editable and shows that stored value

#### Scenario: Base price per unit is always editable

- **WHEN** the merchant activates a Base price per unit cell on any row
- **THEN** the cell presents its editable control, regardless of any other value on that row
