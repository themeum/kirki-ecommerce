## MODIFIED Requirements

### Requirement: The inventory table has five columns

The inventory table SHALL present exactly five data columns, in order: Variants,
Price, SKU, Available, Committed, preceded by a selection checkbox. It SHALL NOT
present a Sale Price, Cost of Goods, or Profit column.

Column visibility SHALL be governed by the list table's own column show/hide
control, on the same terms as every other list screen. The inventory screen SHALL
NOT present a column control of its own in its toolbar. All five columns SHALL be
shown until the merchant hides one, and their choices SHALL persist between visits.

#### Scenario: Column set

- **WHEN** a merchant views the inventory table
- **THEN** the columns are a selection checkbox, Variants, Price, SKU,
  Available, and Committed
- **AND** no Sale Price, Cost of Goods, or Profit column is shown

#### Scenario: Hiding a column

- **WHEN** a merchant deselects a column in the shared column show/hide control
- **THEN** that column is removed from the table and the remaining columns keep
  their order

#### Scenario: No separate column control

- **WHEN** a merchant views the inventory toolbar
- **THEN** the only column control is the shared one every list screen presents

#### Scenario: Choices persist

- **WHEN** a merchant hides a column, leaves the inventory screen, and returns
- **THEN** that column is still hidden
