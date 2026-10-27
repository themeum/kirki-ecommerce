## Purpose

Defines the screen for editing one variant — reached from the Inventory
listing — covering how it is opened, what it presents and in what arrangement,
how it saves, and the single-variant read and write contract that backs it.

## ADDED Requirements

### Requirement: A variant is opened for editing from the inventory listing

Each variant in the inventory listing SHALL be openable on its own editing
screen at a location addressed by that variant's identifier. Activating a row
SHALL open that variant; activating a row's selection control SHALL NOT.

Requesting a variant that does not exist SHALL report that it was not found
rather than presenting an empty form.

#### Scenario: Opening a variant from the listing

- **WHEN** a merchant activates a row in the inventory listing
- **THEN** the variant edit screen for that variant is shown
- **AND** the location reflects that variant's identifier

#### Scenario: Selecting a row does not open it

- **WHEN** a merchant activates a row's selection control
- **THEN** the row is selected and the variant edit screen is not opened

#### Scenario: An unknown variant

- **WHEN** a merchant navigates to the edit screen for an identifier no variant
  has
- **THEN** the screen reports that the variant was not found
- **AND** no editable form is presented

### Requirement: The screen identifies the variant and its product

The screen SHALL name the variant's product and, beneath or beside it, that
variant's attribute values presented as a single line with a visually
distinguished separator, so a merchant can tell which of a product's variants
they are editing. A variant with no attribute values SHALL show the product
name alone, with neither the separator nor a placeholder for the missing
attribute line.

A product name too long for the space available SHALL be truncated rather than
crowding out the header's other content, and SHALL reveal its full text on
hover with a brief transition.

The product name SHALL link to that product's edit screen. The screen SHALL
offer a back action returning the merchant to the inventory listing.

#### Scenario: A variant with attributes

- **WHEN** a merchant opens a variant whose attribute values are Yellow, Medium
  and Cotton
- **THEN** the header shows the product's name
- **AND** shows "Yellow | Medium | Cotton" alongside it

#### Scenario: Navigating to the parent product

- **WHEN** a merchant activates the product name in the header
- **THEN** that product's edit screen is shown

#### Scenario: A variant with no attributes

- **WHEN** a merchant opens a variant with no attribute values
- **THEN** the header shows only the product name
- **AND** neither the separator nor a placeholder for the attribute line is
  shown

#### Scenario: A product name longer than the space available

- **WHEN** a merchant opens a variant whose product name exceeds the width the
  header can give it
- **THEN** the name is truncated with an ellipsis
- **AND** hovering the name reveals its full text with a brief transition

### Requirement: The screen presents the variant in two columns

The screen SHALL present a primary column carrying, in order, a Price section,
an Inventory section, and a Shipping section; and a secondary column carrying,
in order, an Image section and a Visibility section.

#### Scenario: Section arrangement

- **WHEN** a merchant opens the variant edit screen
- **THEN** Price, Inventory and Shipping appear in that order in the primary
  column
- **AND** Image and Visibility appear in that order in the secondary column

### Requirement: The editable fields match the product form's variant fields

The screen SHALL offer the same variant fields the product edit screen offers
for a product's default variant: regular price, sale price, unit-price display
with its base unit, whether tax is charged and against which tax profile, cost
of goods; whether quantity is tracked and the resulting quantity or stock-status
controls, SKU, whether the variant sells when out of stock, and whether orders
are limited to a number of items; weight and its unit, shipping box, and
shipping profile.

The screen SHALL NOT present a barcode field.

Profit and margin SHALL be shown as derived, non-editable values computed from
the regular price and cost of goods, matching what the product edit screen
derives.

#### Scenario: Field parity with the product form

- **WHEN** a merchant compares the variant edit screen with the product edit
  screen's Price, Inventory and Shipping sections
- **THEN** the same variant fields are offered on both

#### Scenario: Barcode is not offered

- **WHEN** the variant edit screen is rendered
- **THEN** no barcode input or barcode action is displayed

#### Scenario: Profit and margin are derived

- **WHEN** a merchant enters a regular price and a cost of goods
- **THEN** profit and margin update to reflect them
- **AND** neither can be edited directly

### Requirement: Tracking quantity governs the stock controls

When quantity tracking is on, the Inventory section SHALL present available
quantity, committed quantity, and a low-stock threshold. Committed quantity
SHALL NOT be editable, and SHALL NOT be sent when the variant is saved. When
quantity tracking is off, the section SHALL present an in-stock / out-of-stock
control in place of those quantities.

#### Scenario: Tracking on

- **WHEN** quantity tracking is on
- **THEN** available quantity, committed quantity and low-stock threshold are
  shown
- **AND** committed quantity cannot be edited

#### Scenario: Tracking off

- **WHEN** quantity tracking is off
- **THEN** an in-stock / out-of-stock control is shown in place of the quantity
  fields

### Requirement: Visibility is editable from this screen

The Visibility section SHALL present a switch reflecting whether the variant is
visible, and changing it SHALL be saved with the rest of the variant.

#### Scenario: Hiding a variant

- **WHEN** a merchant turns the visibility switch off and saves
- **THEN** the variant is recorded as not visible

### Requirement: The screen saves the whole variant at once

The screen SHALL offer a save action and a cancel action. Saving SHALL submit
every edited field in one request and report success. Cancelling SHALL return
the merchant to the inventory listing without saving.

Where the sale price exceeds the regular price, saving SHALL be rejected and the
sale price SHALL report the reason, matching the product edit screen's rule.

Where the server rejects the submission, the reported problems SHALL be shown
against the fields they concern.

#### Scenario: A successful save

- **WHEN** a merchant edits fields and saves
- **THEN** the variant is updated
- **AND** success is reported
- **AND** the inventory listing reflects the new values when next shown

#### Scenario: Sale price above regular price

- **WHEN** a merchant enters a sale price greater than the regular price and
  saves
- **THEN** the save is rejected
- **AND** the sale price field reports that it cannot exceed the regular price

#### Scenario: Server-reported problems

- **WHEN** the server rejects a save with problems on specific fields
- **THEN** each of those fields shows the problem reported for it

### Requirement: Leaving with unsaved edits is guarded

Where the merchant attempts to navigate away from the screen with unsaved edits,
the navigation SHALL be cancelled and an unsaved-changes prompt naming the
variant SHALL be shown, offering to discard or save. This SHALL behave as the
product edit screen's unsaved-changes prompt does.

#### Scenario: Navigating away while dirty

- **WHEN** a merchant with unsaved edits activates the back action
- **THEN** the navigation is cancelled
- **AND** an unsaved-changes prompt naming the variant is shown

#### Scenario: Navigating away while clean

- **WHEN** a merchant with no unsaved edits activates the back action
- **THEN** the navigation completes and no prompt is shown

### Requirement: A single variant can be read and written on its own

The system SHALL expose reading one variant by its identifier, and writing one
variant by its identifier. Reading SHALL return the same fields the existing
variant representation carries, and SHALL additionally carry the identifier of
the variant's product.

Writing SHALL accept the variant's editable fields, SHALL reject a committed
quantity, and SHALL interpret monetary amounts as major currency units,
persisting them in minor units — matching how the bulk write endpoint already
behaves. Writing SHALL return the updated variant.

Reading or writing an identifier no variant has SHALL report not-found.

The existing bulk read and bulk write endpoints SHALL keep working unchanged.

#### Scenario: Reading one variant

- **WHEN** a client reads a variant by its identifier
- **THEN** the variant's fields are returned
- **AND** the response carries the identifier of the variant's product

#### Scenario: Writing one variant

- **WHEN** a client writes a variant with a regular price of 29.00
- **THEN** the variant's stored price is 2900 minor units
- **AND** the updated variant is returned

#### Scenario: Committed quantity is refused

- **WHEN** a client writes a variant including a committed quantity
- **THEN** that value is not applied to the variant

#### Scenario: An unknown identifier

- **WHEN** a client reads or writes an identifier no variant has
- **THEN** not-found is reported

#### Scenario: Bulk endpoints are unaffected

- **WHEN** a client writes to the bulk variant endpoint
- **THEN** the bulk update is performed as before
- **AND** it is not treated as a write to a single variant
