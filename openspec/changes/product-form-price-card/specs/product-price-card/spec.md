## Purpose

Defines the product edit Price card layout and interaction states so pricing, unit price, tax, and margin fields match the designed merchant experience.

## ADDED Requirements

### Requirement: Price card section structure
The product edit Price card SHALL present, in order: regular and sale price fields; a show-unit-price row; a charge-tax row; then cost of goods, profit, and margin fields. Money inputs that display currency MUST keep the currency symbol prefix.

#### Scenario: Core fields are present
- **WHEN** a merchant opens the product Price card
- **THEN** regular price and sale price fields are shown side by side
- **AND** cost of goods, profit, and margin fields are shown in a row below a separator
- **AND** currency-prefixed money fields retain their currency symbol

### Requirement: Show unit price two-state row
The show-unit-price control SHALL be a checkbox with label info text. When unchecked, the row MUST show only the checkbox, label, and info icon. When checked, the row MUST also show the base-price-per-unit control on the right. The right-side control MUST NOT reserve layout space while hidden.

#### Scenario: Unit price unchecked
- **WHEN** show unit price is unchecked
- **THEN** the row shows checkbox, label, and info icon only

#### Scenario: Unit price checked
- **WHEN** show unit price is checked
- **THEN** the row also shows the base price per unit control on the right

### Requirement: Charge tax two-state row
The charge-tax control SHALL be a checkbox with label info text. When unchecked, the row MUST show only the checkbox, label, and info icon. When checked, the row MUST show a tax profile select on the right that lists existing tax profiles and allows creating a new profile. The right-side select MUST NOT reserve layout space while hidden.

#### Scenario: Charge tax unchecked
- **WHEN** charge tax on this product is unchecked
- **THEN** the row shows checkbox, label, and info icon only

#### Scenario: Charge tax checked with tax profile select
- **WHEN** charge tax on this product is checked
- **THEN** a tax profile select appears on the right
- **AND** the merchant can choose an existing profile or create a new one

### Requirement: Price checkbox rows do not duplicate labels
The show-unit-price and charge-tax rows MUST NOT render duplicated label text as below-control description copy that overlaps or overflows the row.

#### Scenario: No overlapping duplicate label text
- **WHEN** either checkbox row is visible
- **THEN** the label text appears once beside the checkbox
- **AND** explanatory copy for that control is provided via the label info tooltip instead of duplicated description text
