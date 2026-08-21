## Purpose

Governs how a page that displays or edits a single record behaves between
navigation and the record arriving, so that opening a product, order, customer or
collection lays out its cards and columns immediately rather than showing a bare
spinner and then rearranging the page underneath the reader.

## ADDED Requirements

### Requirement: A record page reserves its layout while the record loads

While a single-record page's request is in flight, the page SHALL render
placeholder content in the shape of the layout that will follow — the same
column split, the same number and order of cards, and the same card chrome — in
place of a centred spinner. The page's own heading and its action buttons SHALL
render as normal.

#### Scenario: Opening a record

- **WHEN** a user navigates to a record page and its request is in flight
- **THEN** the page renders its heading, its actions, and a placeholder layout
  matching the card structure of the loaded page

#### Scenario: Record arrives

- **WHEN** the request resolves
- **THEN** the real content replaces the placeholders with no change to the
  page's column widths or card positions

#### Scenario: Record cannot be loaded

- **WHEN** the request fails or returns no record
- **THEN** the existing not-found treatment is shown instead of placeholders

### Requirement: Only pages that fetch a record gate on loading

A record page SHALL show placeholder content only when it is actually waiting on
a record. On a create route, where no record is fetched, the page SHALL render
its empty form immediately.

#### Scenario: Editing an existing record

- **WHEN** a user opens a record page for an existing record
- **THEN** the page shows placeholders until that record arrives

#### Scenario: Creating a new record

- **WHEN** a user opens the create route for the same page
- **THEN** the empty form renders straight away and no placeholders are shown

### Requirement: Record forms do not flash empty fields

A record page that populates a form from a fetched record SHALL NOT present that
form with empty values while the record is still in flight. It SHALL show
placeholder content until the values are available.

#### Scenario: Opening a record whose form is populated after fetch

- **WHEN** a user opens a record page whose form fields are filled in once the
  record arrives
- **THEN** the reader never sees the form rendered with blank fields

#### Scenario: Switching between records

- **WHEN** a user navigates from one record directly to another
- **THEN** placeholders are shown for the second record rather than the first
  record's values
