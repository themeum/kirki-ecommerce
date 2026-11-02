## ADDED Requirements

### Requirement: Preset attribute row

The card SHALL show a preset row made of up to three attribute buttons followed by a `+ Add` button. Presets SHALL be the first three attributes in the attributes table, ordered by `id` ascending, that are not already attached to the product. The row SHALL render below any attribute cards and SHALL remain visible after attributes have been applied. When fewer than three unattached attributes exist, the row SHALL show all of them. When none exist, it SHALL show only `+ Add`.

#### Scenario: New product with many attributes

- **WHEN** a merchant opens a new product and the store has attributes Color (id 1), Size (id 2), Material (id 3) and Style (id 4)
- **THEN** the row shows `+ Color`, `+ Size`, `+ Material` and `+ Add`, in that order

#### Scenario: Attached attributes are skipped and backfilled

- **WHEN** Color is already attached to the product
- **THEN** the row shows `+ Size`, `+ Material`, `+ Style` and `+ Add`

#### Scenario: Fewer than three attributes

- **WHEN** the store has only Color and Size, and neither is attached
- **THEN** the row shows `+ Color`, `+ Size` and `+ Add`

#### Scenario: No attributes

- **WHEN** the store has no attributes
- **THEN** the row shows only `+ Add`

#### Scenario: Clicking a preset

- **WHEN** a merchant clicks `+ Size`
- **THEN** a new attribute card opens in edit mode with the name "Size" and no values selected
- **AND** the value input has focus
- **AND** nothing is written to the server

### Requirement: Add popover

When unattached attributes exist beyond those shown as presets, `+ Add` SHALL open a popover that lists those remaining attributes, with a search input that filters them by name keyword and a `+ Add new` item pinned at the bottom. Choosing an attribute SHALL open an edit-mode card for it, the same way a preset does. Choosing `+ Add new` SHALL open the new-attribute form. When no unattached attributes remain beyond the presets, `+ Add` SHALL open the new-attribute form directly, without a popover.

#### Scenario: Popover lists remaining attributes

- **WHEN** the presets show Color, Size and Material, Style and Fit also exist, and the merchant clicks `+ Add`
- **THEN** a popover lists Style and Fit, with `+ Add new` at the bottom

#### Scenario: Searching attributes

- **WHEN** the merchant types "fi" into the popover search
- **THEN** only Fit is listed and `+ Add new` stays visible

#### Scenario: No remaining attributes

- **WHEN** every unattached attribute is already shown as a preset and the merchant clicks `+ Add`
- **THEN** the new-attribute form opens and no popover is shown

### Requirement: New-attribute form

The new-attribute form SHALL present an empty, focused name input, the value input, and Cancel and Apply actions. It SHALL NOT show Delete and SHALL NOT offer a type choice. Attributes created from it SHALL have type `list`. On Apply, the attribute and its values SHALL be created and SHALL then be available to other products.

#### Scenario: Creating a custom attribute

- **WHEN** a merchant enters the name "Fabric", adds the values "Cotton" and "Linen", and clicks Apply
- **THEN** a `list` attribute "Fabric" with those two values is created on the server
- **AND** it is attached to the product and the variant grid regenerates

#### Scenario: No Delete action

- **WHEN** the new-attribute form is open
- **THEN** only Cancel and Apply are shown

### Requirement: Attribute card view and edit modes

Each attached attribute SHALL render as a card. In view mode the card SHALL show a drag handle, the attribute name, its values as chips without remove controls, and Edit and Delete icon buttons. Those buttons SHALL be revealed on hover or keyboard focus, as they are today. Only the Edit button SHALL switch the card to edit mode, and clicking elsewhere on the card SHALL NOT. The view-mode Delete button SHALL behave like the edit-mode Delete action (see "Delete detaches the attribute"). In edit mode the card SHALL show the editable name, the value input with removable chips, and Delete, Cancel and Apply actions.

At most one card, preset draft or new-attribute form SHALL be in edit mode at a time. While one is open, the other cards' Edit/Delete buttons and the preset row SHALL be inert, and drag reordering SHALL be disabled.

#### Scenario: Entering edit mode

- **WHEN** a merchant hovers an applied Color card and clicks its Edit button
- **THEN** the card switches to edit mode with its current values as removable chips

#### Scenario: Clicking the card body does not open edit mode

- **WHEN** a merchant clicks an applied card outside its Edit button
- **THEN** the card stays in view mode

#### Scenario: Deleting from view mode

- **WHEN** a merchant clicks the hover Delete button on an applied card
- **THEN** the attribute is detached following the same confirmation rules as the edit-mode Delete

#### Scenario: Drag handle does not open edit mode

- **WHEN** a merchant drags a card by its handle
- **THEN** the cards reorder as they do today and no card enters edit mode

#### Scenario: Dragged card floats above the list

- **WHEN** a merchant drags a card by its handle
- **THEN** a raised copy of the card, without its Edit/Delete buttons, follows the pointer
- **AND** the card's slot in the list stays in place, faded, until it is dropped

#### Scenario: Only one editor open

- **WHEN** one card is in edit mode
- **THEN** other cards' Edit/Delete buttons and the preset buttons have no effect

### Requirement: Cancel discards the draft

Cancel SHALL discard every change made since the card entered edit mode: name edits, value selections, created values and color changes. Nothing SHALL be written to the server. An applied card SHALL return to view mode with its previous state. A never-applied card SHALL disappear.

#### Scenario: Cancelling an edit

- **WHEN** a merchant removes a value and recolors another on an applied card, then clicks Cancel
- **THEN** the card returns to view mode with its original values and colors
- **AND** no request is sent

#### Scenario: Cancelling a preset draft

- **WHEN** a merchant clicks `+ Size`, adds values, then clicks Cancel
- **THEN** the draft card is removed and Size appears in the preset row again

### Requirement: Delete detaches the attribute

Delete on an applied card SHALL detach the attribute from the product only. It SHALL NOT delete the attribute or its values from the attributes table, and it SHALL follow the "Removal is confirmed when saved variants would be discarded" requirement. Delete on a never-applied draft card SHALL discard it without confirmation.

#### Scenario: Deleting an applied attribute

- **WHEN** a merchant clicks Delete on an applied Size card
- **THEN** Size is detached from the product and appears in the preset row or `+ Add` popover again
- **AND** the Size attribute still exists in the attributes table

### Requirement: Attribute name input

The attribute name in edit mode SHALL be a regular bordered text input, aligned with the value input below it. On blur, the name SHALL be checked against existing attribute names, trimmed and case-insensitive, excluding the attribute the card was opened with. A clash SHALL put the field in an error state saying an attribute with that name already exists, and SHALL block Apply until the name changes. If the server still rejects the name as a duplicate on Apply, that error SHALL be shown on the name field. An empty name SHALL block Apply with a required error.

#### Scenario: Duplicate name on blur

- **WHEN** a merchant renames a Size card to "material" (Material exists) and the field loses focus
- **THEN** the name field shows the duplicate-name error and Apply is blocked

#### Scenario: Unchanged name is not a clash

- **WHEN** a merchant opens the Size card and blurs the name without changing it
- **THEN** no error is shown

### Requirement: Renaming creates a new attribute

When a card's name differs from the attribute it was opened with and the merchant clicks Apply, a new attribute of the same type as the original (`list` for the new-attribute form) SHALL be created with that name. The card's selected values SHALL be copied into it with the same names and colors, and the original attribute SHALL remain unchanged in the attributes table. The product SHALL then reference the new attribute in place of the original, in the same position. Saved variants SHALL be remapped from the original values to the copied values by value name, so they keep their id, SKU, stock and price.

#### Scenario: Renaming a preset before first apply

- **WHEN** a merchant clicks `+ Size`, renames it to "Shoe Size", selects "40" and "41", and clicks Apply
- **THEN** a new attribute "Shoe Size" with values "40" and "41" is created and attached
- **AND** the Size attribute and its values are unchanged

#### Scenario: Renaming an attribute on a saved product

- **WHEN** a saved product has variants for Size S and M, and the merchant renames Size to "Fit Size" and applies
- **THEN** the product references "Fit Size" with values S and M
- **AND** the S and M variants keep their id, SKU, stock and price
- **AND** no saved-variant deletion prompt is shown

### Requirement: Value input layout

The value input SHALL look like the other multi-select fields, such as Tags: one bordered box holding the selected values as chips followed by the text cursor, wrapping onto more lines as chips are added. Each chip's swatch and label SHALL stay on one line. Adding or removing chips SHALL NOT shift layout outside the card.

#### Scenario: Chips wrap inside the box

- **WHEN** more values are selected than fit on one line
- **THEN** the chips wrap onto the next line inside the same bordered box
- **AND** each chip keeps its swatch and label side by side

### Requirement: Value popover

Focusing or clicking the value input SHALL open a popover listing the attribute's values as checkable rows. Several values can be selected, and the input's text filters the rows. The popover SHALL be as wide as the value input. An add action SHALL be pinned at the bottom of the popover while the value rows scroll above it. With an empty query, the action SHALL read `+ Add new value`. With a query that matches no existing value exactly, it SHALL read `+ Add "<query>"`.

#### Scenario: Popover matches the input

- **WHEN** a merchant opens the value popover
- **THEN** the popover's width equals the value input's width

#### Scenario: Keyword not found

- **WHEN** a merchant types "Teal" and no value named Teal exists
- **THEN** the pinned action reads `+ Add "Teal"`

### Requirement: Recoloring a selected value

In edit mode on a `color` attribute, clicking a chip's swatch SHALL open a color picker for that value. The chosen color SHALL update the chip immediately as a draft and SHALL be persisted on Apply. Cancel SHALL revert it. In view mode, swatches SHALL NOT be interactive.

#### Scenario: Picking a new color

- **WHEN** a merchant clicks the Orange chip's swatch in edit mode and picks `#ff6600`
- **THEN** the chip's swatch shows `#ff6600` and nothing is sent until Apply

## MODIFIED Requirements

### Requirement: Variation Values uses the shared multi-select

The value input SHALL be built on the shared `MultiSelect`. It presents the attribute's values as checkable options with chips that are removable in edit mode, not a free-text tag input. It MUST NOT be built by modifying another primitive to reach this design. Any capability `MultiSelect` gains for this, such as a pinned footer action, SHALL be opt-in and SHALL leave existing consumers unchanged. For `color`-type attributes, each option and chip SHALL display a color swatch, supplied through `MultiSelect`'s render slots.

#### Scenario: Selecting a value

- **WHEN** a merchant opens the value popover and selects an unselected value
- **THEN** the value is added as a chip and its row shows a checked state

#### Scenario: Removing a value

- **WHEN** a merchant clicks a chip's remove control or unchecks a selected row in edit mode
- **THEN** the value is removed from the selection

#### Scenario: Color attribute shows swatches

- **WHEN** the attribute's type is `color`
- **THEN** each option row and chip renders a swatch using that value's color

### Requirement: Creating a new variation value

New values SHALL be held as drafts on the card and SHALL be selected immediately. They SHALL NOT be written to the server until Apply. Per-type creation behavior SHALL be resolved from the attribute value type registry rather than from conditionals inside the field.

- Choosing `+ Add "<query>"`, or pressing Enter with a query that matches no existing value, SHALL create the value directly, for every type. For `color`-type attributes the color SHALL be resolved from the query as a CSS named color, ignoring case and whitespace, and SHALL be `null` when the query is not a named color.
- Choosing `+ Add new value` with an empty query SHALL open a dialog. It collects a title and a color for `color`-type attributes, and a title only for `list`-type attributes.
- A value whose name, trimmed and case-insensitive, already exists on the attribute or among the drafts SHALL NOT be created twice. The existing value SHALL be selected instead.

#### Scenario: Enter creates a list value

- **WHEN** a merchant types "XXL" on a `list` attribute and presses Enter
- **THEN** "XXL" is added as a selected chip and no request is sent

#### Scenario: Enter creates a color value with a resolved hex

- **WHEN** a merchant types "Light Blue" on a `color` attribute and presses Enter
- **THEN** "Light Blue" is added as a chip with color `#add8e6` and no dialog opens

#### Scenario: Unknown color name

- **WHEN** a merchant types "Sky" on a `color` attribute and presses Enter
- **THEN** "Sky" is added with no color and its swatch shows the empty state

#### Scenario: Add new value with no query

- **WHEN** a merchant clicks `+ Add new value` with an empty query on a `color` attribute
- **THEN** a dialog asks for a title and a color
- **AND** confirming it adds the value as a selected chip

#### Scenario: Typed name matches an existing value

- **WHEN** a merchant types "blue" and presses Enter, and the attribute already has "Blue"
- **THEN** the existing "Blue" is selected and no draft is created

#### Scenario: Adding a new attribute type

- **WHEN** a new attribute type needs its own option presentation or creation flow
- **THEN** it is added as an entry in the attribute value type registry
- **AND** the value field and `MultiSelect` are unchanged

### Requirement: Apply commits locally without saving the product

Clicking **Apply** SHALL validate the card, meaning a non-empty unique name and at least one value, and then persist the attribute changes to the attributes table in a single transactional request. That covers creating a new or renamed attribute with its values, creating draft values, and updating recolored values. On success, Apply SHALL commit the attribute to the product form, regenerate the variant grid according to the `product-variant-matrix` capability, and return the card to view mode. It SHALL NOT submit or otherwise persist the product itself. If the request fails, the card SHALL stay in edit mode with its draft intact and the errors shown, and the product form SHALL be unchanged.

Committing an attribute, whether it is added, edited, replaced by a rename, removed or reordered, SHALL go through a single write path, so that the attribute list, the variant grid and the product's has-variants state can never disagree. Each commit SHALL read the current form state at the moment it runs, not a snapshot taken when the editor opened.

#### Scenario: Apply with valid data

- **WHEN** a merchant has a name and at least one value and clicks Apply
- **THEN** the attribute changes are persisted and the product form's attribute list and variant grid update together
- **AND** no product create/update request is sent
- **AND** the card returns to view mode

#### Scenario: Apply with invalid data

- **WHEN** a merchant clicks Apply with an empty name, a duplicate name, or no values
- **THEN** the card shows inline validation errors and stays in edit mode
- **AND** no request is sent and no form state outside the card changes

#### Scenario: Apply fails on the server

- **WHEN** the attribute request fails
- **THEN** the card stays in edit mode with its draft intact and shows the error
- **AND** the product's attribute list and variant grid are unchanged

#### Scenario: Recolored value updates globally

- **WHEN** a merchant changes the Blue swatch to `#0000cc` and applies
- **THEN** the Blue value's color is updated in the attributes table and every product using it shows the new color

#### Scenario: Apply regenerates the variant grid

- **WHEN** a merchant applies a second attribute to a product that already has variants
- **THEN** the variant grid shows every combination of the two attributes
- **AND** the previously saved variants keep their SKU, stock and price

#### Scenario: Applying an edit after another attribute changed

- **WHEN** a merchant opens the editor for one attribute, and the attribute list changes before Apply is clicked
- **THEN** applying the edit preserves the other change rather than reverting it

### Requirement: Card and editor spacing

The Product Variations card SHALL use a 16px (`theme.spacing[4]`) gap between the attribute list, a full-width divider, and the variation table. The attribute cards and the preset row SHALL be separated by a 16px gap. Attribute cards, in both view and edit mode, SHALL use 16px content padding.

#### Scenario: Divider between attribute list and table

- **WHEN** the card renders with at least one attribute and the variation table
- **THEN** a full-bleed divider separates the attribute area from the variation table

#### Scenario: Editor card padding

- **WHEN** an attribute card is in edit mode
- **THEN** its content is padded 16px on all sides

## REMOVED Requirements

### Requirement: Variation Values disabled until a name is selected

**Reason**: The card always starts from a preset, an existing attribute, or the new-attribute form. Values are drafts that do not need an attribute id until Apply, so there is no longer a state in which values depend on picking a name first.
**Migration**: None. Apply validates that the name is non-empty and unique.
