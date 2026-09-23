## Purpose

Defines the product form's status card: the per-status info row, the Scheduled date/time pickers, where Preview and Duplicate live, and how the slug field derives and displays a product's URL.

## ADDED Requirements

### Requirement: The status card shows an info row for every status

The status card SHALL show a row naming the current status and a relevant timestamp, for each of Draft, Published, and Scheduled.

#### Scenario: Draft product

- **WHEN** a merchant opens a product with `status: draft`
- **THEN** the card shows "Created on" followed by the product's creation date

#### Scenario: Published product

- **WHEN** a merchant opens a product with `status: published`
- **THEN** the card shows "Published on" followed by the product's `published_at` date

#### Scenario: Scheduled product

- **WHEN** a merchant opens a product with `status: scheduled`
- **THEN** the card shows "Scheduled on" followed by the product's `scheduled_at` date

### Requirement: Scheduled status reveals a date and a time picker

When status is set to Scheduled, the card SHALL show a date picker and a time picker. Together they represent one `scheduled_at` value: picking a date keeps the currently chosen time (or a default), and picking a time keeps the currently chosen date. Switching status away from Scheduled SHALL hide the pickers and clear the value.

#### Scenario: Selecting Scheduled reveals the pickers

- **WHEN** a merchant sets status to Scheduled
- **THEN** a date picker and a time picker appear, initially empty

#### Scenario: Picking date and time populates one value

- **WHEN** a merchant picks a date and then a time
- **THEN** the form holds a single `scheduled_at` value combining both

#### Scenario: Switching away from Scheduled clears the value

- **WHEN** a merchant changes status from Scheduled to Draft or Published after having picked a date/time
- **THEN** the pickers are hidden and the held `scheduled_at` value is cleared

### Requirement: Preview sits at the top-right of the status card

The Preview action SHALL render at the top-right of the status card, in the same row as the status info row, and only when the product has a preview URL.

#### Scenario: A saved product with a preview URL

- **WHEN** a merchant opens a product that has a preview URL
- **THEN** Preview renders at the top-right of the card's info row

#### Scenario: A product with no preview URL

- **WHEN** a merchant opens a product with no preview URL (e.g. a brand new, unsaved product)
- **THEN** no Preview action renders in the card

### Requirement: The status card does not host Duplicate

The status card SHALL NOT render a Duplicate action; duplication is reached from the topbar action menu instead.

#### Scenario: Viewing the status card

- **WHEN** a merchant opens the product form in edit mode
- **THEN** the status card renders no Duplicate control

### Requirement: The slug field shows the page prefix and is borderless until active

The status card SHALL show the product's slug preceded by a read-only prefix: the shop page's slug, or `/products` when no shop page slug is configured. The slug input itself SHALL render without a visible border until the merchant hovers or focuses it. When there is no title and no slug yet, the field SHALL display `untitled` in place of the slug.

#### Scenario: Prefix from the configured shop page

- **WHEN** the store's advanced settings have a shop page slug of `/shop`
- **THEN** the status card shows `/shop/` before the product's slug

#### Scenario: Prefix falls back to /products

- **WHEN** the store has no shop page slug configured
- **THEN** the status card shows `/products/` before the product's slug

#### Scenario: No title or slug yet

- **WHEN** a merchant opens a new, empty product form
- **THEN** the slug portion reads `untitled`

#### Scenario: Border appears on interaction

- **WHEN** a merchant hovers over or focuses the slug input
- **THEN** the input shows a border
- **AND WHEN** the merchant moves away without focus
- **THEN** the border is hidden again

### Requirement: The slug live-updates from the title while creating a new product

While creating a product that has not yet been saved, and before the merchant has typed into the slug field themselves, the slug SHALL update in real time to a URL-safe version of the title as the merchant types it. Once the product has been saved, or once the merchant has typed into the slug field, the slug SHALL stop following the title.

#### Scenario: Typing a title before first save

- **WHEN** a merchant types a title into a new, unsaved product and has not touched the slug field
- **THEN** the slug field updates to a slugified version of the title as they type

#### Scenario: Manually editing the slug stops auto-sync

- **WHEN** a merchant types directly into the slug field of a new, unsaved product
- **THEN** further changes to the title no longer change the slug

#### Scenario: A saved product's slug does not follow the title

- **WHEN** a merchant edits the title of a product that has already been saved
- **THEN** the slug field is unaffected

### Requirement: The topbar action menu hosts Duplicate in edit mode

The product form's topbar SHALL show a dropdown menu, positioned to the left of Cancel, containing the Duplicate action, only when editing an existing product.

#### Scenario: Editing an existing product

- **WHEN** a merchant opens the product form in edit mode
- **THEN** the topbar shows a dropdown menu that includes Duplicate

#### Scenario: Creating a new product

- **WHEN** a merchant opens the product form in create mode
- **THEN** the topbar shows no such dropdown menu
