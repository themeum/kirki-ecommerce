# dropdown-alignment Specification

## Purpose

Defines how every trigger-anchored overlay in the admin — the plain select, the searchable select, the multi-select and the dropdown menu — positions and sizes its panel relative to the control that opened it, so the whole admin reads as one system rather than four differently-aligned dropdowns.

## Requirements

### Requirement: Panels align to their trigger's leading edge

Every trigger-anchored overlay panel SHALL open with its leading edge on the leading edge of the control that opened it. The panel MUST NOT be offset horizontally to align its option text with the trigger's text, because option rows carry a selection-indicator gutter the trigger does not.

#### Scenario: Select panel opens flush

- **WHEN** a merchant opens a select whose options show a selection indicator
- **THEN** the panel's left edge lands on the trigger's left edge

#### Scenario: Menu opens flush

- **WHEN** a merchant opens a dropdown menu that does not specify its own alignment
- **THEN** the menu's left edge lands on the trigger's left edge rather than the menu centring on the trigger

#### Scenario: Caller-specified alignment still wins

- **WHEN** a caller explicitly asks for a different alignment
- **THEN** that alignment is used and the default is not applied

### Requirement: Panel width follows the trigger, then the content

A panel's width SHALL be the greater of the trigger's width and the panel content's natural width. A panel whose content is narrower than its trigger MUST be exactly the trigger's width. A panel whose content is wider MUST widen to fit rather than truncating its option labels. No fixed upper bound is imposed.

#### Scenario: Narrow content matches the trigger

- **WHEN** every option label is shorter than the trigger is wide
- **THEN** the panel is exactly as wide as the trigger

#### Scenario: Long labels widen the panel

- **WHEN** an option label is wider than the trigger
- **THEN** the panel widens to fit that label and the label is not truncated

### Requirement: The select's selected option stays over its trigger

When a plain select opens, the currently selected option SHALL be positioned over the trigger, so the selection does not appear to move as the panel opens. This vertical behaviour is independent of the horizontal alignment and width rules.

#### Scenario: Opening a select with a mid-list selection

- **WHEN** a merchant opens a select whose selected option is neither the first nor the last
- **THEN** that option is drawn over the trigger, with earlier options above it and later options below

### Requirement: The searchable select's search box replaces its trigger

When a searchable select opens, its panel SHALL be anchored so the search row covers the trigger, and the search row's height MUST match the trigger's height so no part of the trigger remains visible. The search row and the option list MUST be one panel, not two floating surfaces.

#### Scenario: Opening a searchable select

- **WHEN** a merchant opens a searchable select
- **THEN** the search input appears in the position the trigger occupied, with the option list directly beneath it in the same panel
- **AND** no edge of the trigger shows around the search row

#### Scenario: Selection is not pre-filled into the search box

- **WHEN** a searchable select with a chosen option is opened
- **THEN** the search box is empty and shows its placeholder, and the chosen option is marked as selected in the list

### Requirement: Panels flip when there is not enough room

An overlay panel that cannot fit below its trigger SHALL flip above it. For the searchable select this means the search row no longer covers the trigger; that is the accepted degraded case and the panel MUST remain fully visible and usable.

#### Scenario: Searchable select near the bottom of the viewport

- **WHEN** a merchant opens a searchable select with too little room beneath it
- **THEN** the whole panel is drawn above the trigger and remains fully visible

### Requirement: Multi-select and menus keep dropping below their trigger

Controls whose search input already lives inside the field, and dropdown menus, SHALL continue to open below their trigger with a small gap. They MUST NOT adopt the searchable select's trigger-covering anchoring, which would hide what the merchant is typing.

#### Scenario: Multi-select stays below

- **WHEN** a merchant types into a multi-select's field
- **THEN** the option list appears below the field and the typed text remains visible
