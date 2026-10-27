## ADDED Requirements

### Requirement: Tags collapse past two rows

The tags field SHALL show as many tag chips as fit within two rows and collapse the rest behind the counter that the multi-select provides, so a product carrying many tags never pushes the rest of the sidebar down the page.

#### Scenario: Few tags

- **WHEN** a product's tags fit within two rows
- **THEN** every tag chip renders and no counter appears

#### Scenario: Many tags

- **WHEN** a product's tags would occupy more than two rows
- **THEN** only the chips within the first two rows render, followed by the counter
- **AND** activating the counter reveals the rest

### Requirement: Sidebar field placeholders name the action, then shorten

An empty sidebar select SHALL name what it collects: "Add tags", "Add collections", "Add brand". A field that can hold more than one value SHALL shorten its placeholder to "Search" once something is held, as the categories field already does, because the cursor is then sharing its row with chips and the longer invitation no longer fits.

Brand withdraws its cursor once a brand is held, so it carries no second placeholder.

#### Scenario: Empty fields

- **WHEN** a merchant opens a product whose tags, collections and brand are all empty
- **THEN** each field shows the placeholder naming what it collects

#### Scenario: Something already held

- **WHEN** a merchant has tags or collections selected
- **THEN** that field's placeholder reads "Search"

## MODIFIED Requirements

### Requirement: Brand is a single-value token box

The brand field SHALL present the same bordered token box as its neighbours, holding at most one chip. The chip MUST carry the brand's logo as its leading image where the brand has one, and MUST offer a remove control that clears the field. With no brand chosen the box SHALL show its text input and placeholder.

The held chip SHALL span the full width of the box with its remove control at the trailing edge, so the single value a product carries reads as a filled field rather than as one token among others. While a brand is held the box SHALL NOT show its text input; removing the chip restores it. Choosing a brand SHALL close the panel, because the field has nothing further to collect.

Each row in the brand list MUST show an image ahead of the brand's name — the brand's logo where it has one, and the shared placeholder image where it does not — so that every name in the list starts at the same place.

Choosing a brand while one is already held MUST replace it. Searching existing brands and creating a new one through the brand create popover MUST continue to work as they do today; only the frame changes.

#### Scenario: The held brand fills the box

- **WHEN** a product has a brand
- **THEN** the box shows exactly one chip spanning its full width, with the remove control at the trailing edge
- **AND** the box shows no text input for as long as that brand is held

#### Scenario: A brand without a logo

- **WHEN** a merchant opens the brand list and a brand has no logo
- **THEN** that brand's row shows the shared placeholder image ahead of its name, aligned with the rows that do have logos

#### Scenario: Choosing closes the panel

- **WHEN** a merchant chooses a brand from the list
- **THEN** that brand becomes the product's brand and the panel closes
