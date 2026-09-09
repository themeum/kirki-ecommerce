## ADDED Requirements

### Requirement: The unsaved-changes toast names the record it guards

The unsaved-changes toast SHALL name the kind of record with unsaved edits, and
that wording SHALL be supplied by the screen the toast is guarding rather than
fixed to products. Where a screen supplies no wording, the toast SHALL continue
to read "Unsaved product".

The toast's blocking, Cancel and Save behaviour, and its visibility rules SHALL
be identical whichever screen is guarded.

#### Scenario: The product form's wording is unchanged

- **WHEN** the toast is shown for the product form
- **THEN** it reads "Unsaved product"

#### Scenario: Another screen supplies its own wording

- **WHEN** the toast is shown for the variant edit screen
- **THEN** it names the variant rather than a product
- **AND** it offers the same Cancel and Save actions, behaving as it does on the
  product form
