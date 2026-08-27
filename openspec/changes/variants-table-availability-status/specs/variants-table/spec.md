## Purpose

Defines the product form's variants table: how variant combinations are grouped into parent and child rows, what each column shows, and how a merchant edits a whole group's price or media from its parent row.

## ADDED Requirements

### Requirement: The table is called the variants table

The table SHALL be referred to as the variants table in all user-facing copy. A group's row count SHALL read "variants" (or "variant" for a single one), and the action that opens the per-variant editor SHALL read "Edit Variants".

#### Scenario: Group subtitle wording

- **WHEN** a group parent row summarises nine child variants
- **THEN** its subtitle reads "9 variants"

#### Scenario: Editor action wording

- **WHEN** the merchant views the variants table with no rows selected
- **THEN** the action opening the per-variant editor reads "Edit Variants"

### Requirement: The variants table has four columns

The variants table SHALL present exactly four columns, in order: a selection checkbox, Variants, Price, and Availability. It SHALL NOT present an Inventory column.

#### Scenario: Column set

- **WHEN** a merchant views the variants table
- **THEN** the columns are a selection checkbox, Variants, Price, and Availability
- **AND** no Inventory column is shown

### Requirement: Rows are grouped by the chosen attribute

The table SHALL group variants by a merchant-chosen attribute, rendering one parent row per value of that attribute followed by a child row per variant in that group.

A parent row SHALL be labelled with its own attribute value alone. A child row SHALL be labelled with its variant's remaining attribute values — every value except the one its group is keyed by — so that no two children of the same group carry the same label. Labels SHALL be left-aligned.

#### Scenario: Grouping by one of two attributes

- **WHEN** a product has Color and Size, and the merchant groups by Color
- **THEN** each parent row is labelled with a colour
- **AND** each child row under it is labelled with a size alone

#### Scenario: Three attributes leave two values on each child

- **WHEN** a product has Size, Color and Material, and the merchant groups by Size
- **THEN** each parent row is labelled with a size alone
- **AND** each child row is labelled with both its colour and its material
- **AND** no two child rows in a group share a label

#### Scenario: Changing the grouping attribute

- **WHEN** a merchant switches the grouping from Color to Size
- **THEN** parent rows are re-keyed to sizes
- **AND** every variant still appears exactly once

### Requirement: Availability is shown but not edited

The Availability column SHALL be read-only in every row. A child row SHALL show its variant's own stock state; a parent row SHALL show the state resolved across that group's variants, and may therefore show Partially Stocked where a child never can.

The column SHALL NOT offer any control for changing quantity or stock status. Quantity and threshold editing SHALL remain available through the per-variant editor.

#### Scenario: Child row shows its own state

- **WHEN** a child variant tracks inventory and its quantity is at its threshold
- **THEN** its Availability cell reads "Low Stock"

#### Scenario: Parent row aggregates its children

- **WHEN** a group holds one In Stock and one Out of Stock child, and none is Low Stock
- **THEN** the parent row's Availability cell reads "Partially Stocked"

#### Scenario: No editing control is offered

- **WHEN** a merchant clicks an Availability cell in any row
- **THEN** no input, select, or other editing control appears

### Requirement: A parent row shows its group's price range

A parent row SHALL display the range between the lowest and highest price among its children, formatted with the store currency symbol shown once before the range rather than before each bound. When the lowest and highest price are equal, or the group has a single child, the parent SHALL display that single price instead of a range.

#### Scenario: Children priced differently

- **WHEN** a group's children are priced 50 and 145
- **THEN** the parent row displays the range with one currency symbol preceding it, as "$ 50 - 145"

#### Scenario: Children priced identically

- **WHEN** every child in a group is priced 145
- **THEN** the parent row displays a single price

#### Scenario: A group with one child

- **WHEN** a group holds exactly one child
- **THEN** the parent row displays that child's price as a single price

### Requirement: Editing a parent price sets every child in the group

Activating a parent row's price SHALL replace the displayed range with a money input. While the merchant types, every child in that group SHALL take the entered value as its price. Leaving the field SHALL restore the range display.

Incomplete or empty input SHALL NOT be written to the children, so that clearing the field does not blank their prices.

Because every child receives the same value, the group's range necessarily collapses to a single price once the edit is committed.

#### Scenario: Typing a price into a parent row

- **WHEN** a merchant activates a parent row's price and types 99
- **THEN** every child in that group is priced 99

#### Scenario: The range collapses after editing

- **WHEN** a merchant finishes editing a parent row's price and leaves the field
- **THEN** the parent row displays a single price rather than a range

#### Scenario: Clearing the field does not blank the children

- **WHEN** a merchant clears the parent row's price field entirely
- **THEN** the children retain their last valid price

#### Scenario: Editing one group leaves others alone

- **WHEN** a merchant sets a price on one group's parent row
- **THEN** variants outside that group are unchanged

### Requirement: A parent row's media reflects its children

A parent row SHALL show no media until every child in its group has media. Once every child has media, the parent SHALL show the first child's media; when the group's children hold more than one distinct media, the parent SHALL additionally convey that several exist by rendering them stacked. Media repeated across children SHALL count once, so a group whose children all share one media SHALL NOT appear stacked.

#### Scenario: Not every child has media

- **WHEN** a group has four children and three of them have media
- **THEN** the parent row shows no media

#### Scenario: Every child has the same media

- **WHEN** every child in a group has media and they are all the same
- **THEN** the parent row shows that media without a stacked appearance

#### Scenario: Children have differing media

- **WHEN** every child in a group has media and at least two differ
- **THEN** the parent row shows the first child's media rendered as a stack

#### Scenario: Filling the last child

- **WHEN** a merchant assigns media to the last child in a group that was missing it
- **THEN** the parent row stops showing empty and reflects its children's media

### Requirement: Assigning media to a parent overwrites its children

Assigning media to a parent row SHALL assign that media to every child in the group, replacing any media those children already had.

#### Scenario: Parent media replaces existing child media

- **WHEN** a merchant assigns media to a parent row whose children already have differing media
- **THEN** every child in that group carries the parent's media
- **AND** the parent row shows that media without a stacked appearance

### Requirement: Selecting rows offers bulk price editing only

When one or more rows are selected, the table header SHALL offer a bulk price control that applies to the selection, and SHALL NOT offer a bulk quantity or stock-status control.

#### Scenario: Bulk price applies to the selection

- **WHEN** a merchant selects three variants and enters a price in the header control
- **THEN** those three variants take that price
- **AND** unselected variants are unchanged

#### Scenario: No bulk stock control is offered

- **WHEN** a merchant selects one or more variants
- **THEN** the header offers no control for changing quantity or stock status
