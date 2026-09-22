## MODIFIED Requirements

### Requirement: The ribbon field carries its own remove control

When the ribbon field is expanded it SHALL show its label alongside a control that clears the ribbon and collapses the field. Clearing the ribbon clears both its text and its colour.

The expanded field SHALL offer a single line of text, a row of controls for choosing the ribbon's colour from the palette, and a preview of the resulting badge. The preview MUST reflect the current text and colour as they are edited, without the merchant saving first. While the text is empty the preview SHALL read "Preview", so the colour choice is still visible before any text is typed. A ribbon field opened on a product with no colour stored SHALL start on the palette's first colour, and the control for the current colour MUST be distinguishable from the rest.

#### Scenario: Removing a ribbon

- **WHEN** a merchant activates the ribbon's remove control
- **THEN** the ribbon value is cleared and the field returns to its add link

#### Scenario: Opening an empty ribbon field

- **WHEN** a merchant expands the ribbon field on a product that has no ribbon
- **THEN** the palette's first colour is the current choice
- **AND** the preview reads "Preview" in that colour

#### Scenario: Typing ribbon text

- **WHEN** a merchant types into the ribbon text field
- **THEN** the preview updates to show that text as it is typed

#### Scenario: Choosing a colour

- **WHEN** a merchant chooses a different colour from the palette
- **THEN** the preview redraws in that colour
- **AND** the control for the chosen colour is marked as current while the others are not
