## MODIFIED Requirements

### Requirement: Apply commits locally without saving the product

Clicking **Apply** in the attribute editor SHALL validate the attribute sub-form and, on success, commit the attribute to the product form, regenerate the variant grid according to the `product-variant-matrix` capability, and close the editor. It SHALL NOT submit or otherwise persist the product to the server.

Committing an attribute — whether added, edited, removed or reordered — SHALL go through a single write path, so that the attribute list, the variant grid and the product's has-variants state can never disagree. Each commit SHALL read the current form state at the moment it runs rather than a snapshot taken when the editor was opened.

#### Scenario: Apply with valid data

- **WHEN** a merchant fills in a Variation Name and at least one Variation Value and clicks Apply
- **THEN** the product form's attribute list and variant grid update together
- **AND** no product create/update request is sent
- **AND** the editor closes

#### Scenario: Apply with invalid data

- **WHEN** a merchant clicks Apply without a Variation Name or without any Variation Values
- **THEN** the attribute sub-form shows inline validation errors
- **AND** the editor remains open
- **AND** no form state outside the attribute sub-form changes

#### Scenario: Apply regenerates the variant grid

- **WHEN** a merchant applies a second attribute to a product that already has variants
- **THEN** the variant grid shows every combination of the two attributes
- **AND** the previously saved variants keep their SKU, stock and price

#### Scenario: Applying an edit after another attribute changed

- **WHEN** a merchant opens the editor for one attribute, and the attribute list changes before Apply is clicked
- **THEN** applying the edit preserves the other change rather than reverting it

## ADDED Requirements

### Requirement: Removal is confirmed when saved variants would be discarded

Removing an attribute, or removing a value from an attribute, SHALL prompt for confirmation when the resulting grid would discard one or more variants that have already been saved to the product. The prompt SHALL state how many saved variants will be deleted and identify them by their combination. Cancelling SHALL leave the attribute list and variant grid untouched.

When no already-saved variant would be discarded — for example on a product that has never been saved — the removal SHALL proceed without a prompt.

Nothing SHALL be deleted from storage until the merchant saves the product.

#### Scenario: Removing an attribute from a saved product

- **WHEN** a merchant removes an attribute from a product whose variants have been saved, and the removal would collapse four variants into two
- **THEN** a confirmation prompt names the two saved variants that will be deleted
- **AND** cancelling leaves the attribute list and variant grid unchanged

#### Scenario: Confirming the removal

- **WHEN** a merchant confirms the prompt
- **THEN** the attribute is removed and the variant grid collapses
- **AND** no delete request is sent until the product is saved

#### Scenario: Removing an attribute from an unsaved product

- **WHEN** a merchant removes an attribute from a product that has never been saved
- **THEN** no confirmation is shown and the attribute is removed immediately

#### Scenario: Removing a value that only affects unsaved variants

- **WHEN** a merchant removes an attribute value whose variants have never been saved
- **THEN** no confirmation is shown

### Requirement: The variation table tolerates an emptied value group

The variation table SHALL continue to render while the merchant edits attributes, including when a value group momentarily contains no variants. Regenerating the grid SHALL NOT crash the card.

#### Scenario: Removing a value that empties a group

- **WHEN** a merchant removes an attribute value that the variation table is currently grouping by
- **THEN** the table re-renders without that group
- **AND** the card does not crash
