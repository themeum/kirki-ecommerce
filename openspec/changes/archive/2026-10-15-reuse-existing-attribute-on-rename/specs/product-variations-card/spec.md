## ADDED Requirements

### Requirement: Reusing an existing attribute by name

When the name field loses focus, and its trimmed, case-insensitive value matches an existing store attribute other than the one the card currently uses, the card SHALL behave by what is selected and where the attribute is used:

- With no selected values, and the matching attribute not applied to this product, the card SHALL switch to the matching attribute. The name field SHALL show the attribute's stored name. The value options and the value type SHALL come from that attribute. No error SHALL show. This SHALL hold for the `+ Add new` form, preset cards, cards opened from `+ Add`, and the edit card of an applied attribute.
- With one or more selected values, the name field SHALL show "An attribute with this name already exists." and Apply SHALL be blocked until the name changes.
- With the matching attribute already applied to this product in another card, the name field SHALL show "This attribute is already added to this product." and the card SHALL NOT load its values. Apply SHALL be blocked until the name changes.

After a switch, selecting values and clicking Apply SHALL use the switched-to attribute: new values are added to it, and no new attribute is created. When the card was the edit card of an applied attribute, Apply SHALL replace the applied attribute with the switched-to one, following "Committing an attribute" in the Apply requirement.

After a switch, the merchant MAY enter a name that matches no attribute. With no selected values, the card SHALL keep the previous value options available. With selected values, Apply SHALL create a new attribute under "Renaming creates a new attribute".

#### Scenario: New attribute form reuses Size

- **WHEN** a merchant opens `+ Add new`, enters "size" in the name field, and the field loses focus
- **AND** the Size attribute exists and is not applied to the product
- **THEN** the name field shows "Size"
- **AND** the value popover lists the values of Size
- **AND** no error is shown

#### Scenario: Editing an applied attribute to an existing name

- **WHEN** a merchant edits the applied Color card, removes every selected value, renames it to "Material" (Material exists, not applied), and the field loses focus
- **THEN** the card shows the values of Material
- **AND** clicking Apply replaces Color with Material on the product and no new attribute is created

#### Scenario: Existing name with selected values

- **WHEN** a merchant has selected "S" on a Size card, renames it to "Material" (Material exists), and the field loses focus
- **THEN** the name field shows "An attribute with this name already exists."
- **AND** Apply is blocked

#### Scenario: Name of an attribute already on this product

- **WHEN** Size is applied to the product, and a merchant opens `+ Add new`, enters "Size", and the field loses focus
- **THEN** the name field shows "This attribute is already added to this product."
- **AND** no values are loaded

#### Scenario: Unique name with selected values copies the values

- **WHEN** a merchant selects "S" and "M" on a Size card, renames it to "Fit Size" (no such attribute), and clicks Apply
- **THEN** a new attribute "Fit Size" with copies of "S" and "M" is created
- **AND** the Size attribute still has "S" and "M"

#### Scenario: Unique name with no selected values keeps options

- **WHEN** a merchant has switched a card to Material, then renames it to "Fabric" (no such attribute) with no values selected
- **THEN** the value popover still lists the values of Material

## MODIFIED Requirements

### Requirement: Attribute name input

The attribute name in edit mode SHALL be a regular bordered text input, aligned with the value input below it. On blur, the name SHALL be checked against existing attribute names, trimmed and case-insensitive, excluding the attribute the card currently uses. A match SHALL be handled by the "Reusing an existing attribute by name" requirement. If the server still rejects the name as a duplicate on Apply, that error SHALL be shown on the name field. An empty name SHALL block Apply with a required error.

#### Scenario: Duplicate name on blur with selected values

- **WHEN** a merchant has selected a value on a Size card, renames it to "material" (Material exists), and the field loses focus
- **THEN** the name field shows the duplicate-name error and Apply is blocked

#### Scenario: Unchanged name is not a clash

- **WHEN** a merchant opens the Size card and blurs the name without changing it
- **THEN** no error is shown and nothing is reloaded

### Requirement: Recoloring a selected value

In edit mode on a `color` attribute, clicking a chip's swatch SHALL open a color picker for that value. The chosen color SHALL update the chip immediately as a draft and SHALL be persisted on Apply. Cancel SHALL revert it. In view mode, swatches SHALL NOT be interactive.

Interacting with the color picker, including picking or dragging a color and typing a hex value, SHALL keep the picker open and SHALL NOT open the value popover. A click outside the picker SHALL close the picker only. If that click lands on the value input box, the value popover SHALL stay closed.

#### Scenario: Picking a new color

- **WHEN** a merchant clicks the Orange chip's swatch in edit mode and picks `#ff6600`
- **THEN** the chip's swatch shows `#ff6600` and nothing is sent until Apply

#### Scenario: Picker stays open while picking

- **WHEN** a merchant picks several colors in the open color picker
- **THEN** the picker stays open and the value popover does not open

#### Scenario: Outside click closes only the picker

- **WHEN** the color picker is open and the merchant clicks on the value input box
- **THEN** the color picker closes
- **AND** the value popover does not open
