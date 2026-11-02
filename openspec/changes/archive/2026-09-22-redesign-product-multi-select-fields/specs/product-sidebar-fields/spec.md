## Purpose

Defines how the product form's right panel composes the fields that describe a product's relationships and presentation — categories, brand, tags, collections and ribbon — so a narrow column reads as one grouped set rather than a stack of differently-shaped controls.

## ADDED Requirements

### Requirement: One card, one order

Categories, brand, tags, collections and ribbon SHALL sit in a single card, in that order. They MUST NOT be split across cards, and a field MUST NOT be given a card of its own because its control is taller than its neighbours.

The product's status, slug and page-level actions remain a separate card above; this requirement does not govern them.

#### Scenario: The panel's fields

- **WHEN** a merchant opens the product form
- **THEN** categories, brand, tags, collections and ribbon appear together in one card in that order

### Requirement: Optional fields start collapsed behind an add link

Collections and ribbon SHALL render as a link reading what they add, rather than as a field, when the product has no value for them. Activating the link SHALL replace it with the field, focused and ready. A field whose product already has a value MUST render expanded from the start, never behind its link.

Clearing the field's value MUST NOT collapse it while the merchant is working in it; a field collapses again only when it is next rendered with no value, or when the merchant removes it outright.

#### Scenario: A product with no collections

- **WHEN** a merchant opens a product that is in no collection
- **THEN** the panel shows an add-to-collection link in place of the field

#### Scenario: Expanding

- **WHEN** a merchant activates the link
- **THEN** the field replaces the link and takes focus

#### Scenario: A product that already has a value

- **WHEN** a merchant opens a product that has a ribbon
- **THEN** the ribbon field renders expanded with its value, and no link is shown

#### Scenario: Removing outright

- **WHEN** a merchant activates the ribbon field's remove control
- **THEN** the ribbon's value is cleared and the field collapses back to its link

### Requirement: Brand is a single-value token box

The brand field SHALL present the same bordered token box as its neighbours, holding at most one chip. The chip MUST carry the brand's logo as its leading image where the brand has one, and MUST offer a remove control that clears the field. With no brand chosen the box SHALL show its text input and placeholder.

Choosing a brand while one is already held MUST replace it. Searching existing brands and creating a new one through the brand create popover MUST continue to work as they do today; only the frame changes.

#### Scenario: No brand chosen

- **WHEN** a merchant opens a product with no brand
- **THEN** the box shows an empty text input with its placeholder

#### Scenario: A brand with a logo

- **WHEN** a product has a brand that has a logo
- **THEN** the box shows one chip with that logo ahead of the brand name

#### Scenario: Replacing

- **WHEN** a merchant chooses a different brand while one is held
- **THEN** the new brand replaces it and the box still shows exactly one chip

#### Scenario: Clearing

- **WHEN** a merchant activates the chip's remove control
- **THEN** the product has no brand and the box shows its text input again

#### Scenario: Creating a brand

- **WHEN** a merchant types a name matching no brand and activates the create row
- **THEN** the brand create popover opens prefilled with that name

### Requirement: The ribbon field carries its own remove control

When the ribbon field is expanded it SHALL show its label alongside a control that clears the ribbon and collapses the field. The ribbon's value remains a single line of text.

#### Scenario: Removing a ribbon

- **WHEN** a merchant activates the ribbon's remove control
- **THEN** the ribbon value is cleared and the field returns to its add link
