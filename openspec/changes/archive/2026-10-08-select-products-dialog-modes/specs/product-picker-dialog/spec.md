## Purpose

Defines how the select-products dialog lets a merchant pick products or variants in each of its modes, how variants that are already added are protected in order mode, and what the dialog hands back when the merchant confirms.

## ADDED Requirements

### Requirement: The dialog selects according to its mode

The dialog SHALL take a mode that is either `product` or `order`.

In `product` mode the dialog SHALL list products, and each row SHALL select or deselect the whole product. No row SHALL be locked.

In `order` mode the dialog SHALL list products with their variants, and each variant SHALL be selectable on its own. A product row SHALL select or deselect all of that product's variants that are not locked.

#### Scenario: Product mode selects whole products

- **WHEN** the dialog is open in `product` mode and the merchant ticks a product row
- **THEN** that product is selected as a whole and no variant rows are offered for selection

#### Scenario: Order mode selects single variants

- **WHEN** the dialog is open in `order` mode and the merchant ticks one variant row
- **THEN** only that variant is selected and its product row shows a partial state when other variants of the product are not selected

### Requirement: Already-added variants are locked in order mode

In `order` mode, every variant that is present in the selection the dialog was opened with SHALL be locked. A locked variant SHALL show a disabled, checked checkbox and an "Already added" badge.

No action SHALL change the selected state of a locked variant. This includes clicking its row, toggling its product, using the header select-all or deselect-all control, and shift-range selection.

#### Scenario: A locked variant ignores direct interaction

- **WHEN** the merchant clicks the row or the checkbox of a locked variant
- **THEN** the variant stays selected and nothing else changes

#### Scenario: Deselect-all leaves locked variants alone

- **WHEN** all selectable variants on the page are selected and the merchant clears the header checkbox
- **THEN** the new picks are cleared and every locked variant on the page stays selected

#### Scenario: Select-all leaves locked variants alone

- **WHEN** the merchant ticks the header checkbox
- **THEN** every variant on the page that is not locked becomes selected and locked variants keep their state

#### Scenario: A shift-range skips locked variants

- **WHEN** the merchant selects a range of rows that includes locked variants
- **THEN** the variants in the range that are not locked are selected and the locked variants are unchanged

### Requirement: A product with locked variants reflects only its selectable variants

In `order` mode, a product row's checkbox SHALL reflect only the variants of that product that are not locked. It SHALL be checked when all of them are selected, partial when some are, and unchecked when none are.

When every variant of a product is locked, the product row SHALL show a disabled, unchecked checkbox and the "Already added" badge, and clicking the row SHALL do nothing.

#### Scenario: A product with some variants locked

- **WHEN** a product has one locked variant and two unlocked variants, and the merchant ticks one unlocked variant
- **THEN** the product checkbox shows a partial state

#### Scenario: A product with all variants locked

- **WHEN** every variant of a product is locked
- **THEN** its product checkbox is disabled and unchecked, the "Already added" badge is shown on the product row, and clicking the row changes nothing

#### Scenario: The header control with nothing selectable

- **WHEN** every variant on the current page is locked
- **THEN** the header checkbox is disabled

### Requirement: Confirming returns the full selection

When the merchant confirms, the dialog SHALL return the full selection: every locked variant together with every newly picked item. The dialog SHALL NOT return only the new picks.

#### Scenario: Confirm with new picks in order mode

- **WHEN** the dialog is opened with two already-added variants and the merchant picks one more variant and confirms
- **THEN** the dialog returns all three variants

#### Scenario: Confirm with no new picks

- **WHEN** the dialog is opened with already-added variants and the merchant confirms without picking anything
- **THEN** the dialog returns the already-added variants unchanged

### Requirement: The selected count shows new picks only

In `order` mode, the selected count in the dialog footer SHALL count only variants that are not locked. In `product` mode, it SHALL count the selected products.

#### Scenario: Count with locked variants

- **WHEN** the dialog is opened with two already-added variants and the merchant picks one more variant
- **THEN** the footer shows 1 selected

### Requirement: Dialog state does not outlive the dialog

Search text, page, filters, expanded rows and the selection SHALL start fresh each time the dialog opens, and SHALL NOT change because the caller re-renders while the dialog is open.

#### Scenario: The caller re-renders while the dialog is open

- **WHEN** the merchant has picked items and the caller re-renders with an equal but newly created list of selected products
- **THEN** the merchant's picks are kept

#### Scenario: The dialog is reopened

- **WHEN** the merchant closes the dialog and opens it again
- **THEN** the search text and filters are empty and the selection matches what the caller passed in
