# page-layout-shell Specification

## Purpose

Defines how an admin screen is composed — the heading bar every screen wears,
the content region beneath it, and the width both are measured against — so
that a screen declares its layout once instead of assembling a heading, a
container and a page wrapper by hand and drifting from its neighbours.

## Requirements

### Requirement: A page is composed of a heading and a content region

An admin screen SHALL be expressed as a page containing a heading region and a
content region. The heading region SHALL carry the screen's title and its
primary actions; the content region SHALL carry everything else. A screen MAY
omit either region, but SHALL NOT place page-level content outside them.

#### Scenario: A listing screen

- **WHEN** a screen presents a title, an action button, and a data table
- **THEN** the title and the action button occupy the heading region
- **AND** the data table occupies the content region

#### Scenario: A screen with no actions

- **WHEN** a screen presents only a title and its content
- **THEN** the heading region renders with the title alone and still occupies
  its full standard height

### Requirement: The page heading has a fixed height and is always pinned

The page heading SHALL occupy exactly 64 pixels of vertical space, measured
inclusive of its own border, on every screen and regardless of what it
contains. It SHALL remain pinned to the top of the viewport as the content
beneath it scrolls, drawing a separating border along its lower edge and
resting above scrolled content. There SHALL be no unpinned variant: a screen
cannot opt out of either the fixed height or the pinning.

#### Scenario: Heading height is independent of its contents

- **WHEN** one screen's heading holds only a title and another's holds a title,
  a back control, a badge, and two action buttons
- **THEN** both headings occupy the same 64 pixels of vertical space

#### Scenario: Heading stays visible while scrolling

- **WHEN** the merchant scrolls a screen whose content extends past the
  viewport
- **THEN** the heading remains fixed at the top of the viewport with its lower
  border visible, and the content scrolls beneath it

#### Scenario: Other layout derives the heading's height

- **WHEN** another element on the screen must be positioned directly below the
  pinned heading
- **THEN** it SHALL derive its offset from the heading's published height
  rather than restating that measurement independently

### Requirement: A page declares one container width for both regions

A page SHALL declare a single container width that constrains both its heading
region and its content region, so the two align down the same edges by default.
Either region SHALL be able to override that width independently when a screen
genuinely needs them to differ. When a page declares no width, both regions
SHALL fall back to the standard content width.

#### Scenario: Width declared once

- **WHEN** a page declares a container width and neither region overrides it
- **THEN** the heading's contents and the content region's contents are
  constrained to that same width and share the same left and right edges

#### Scenario: A region overrides the page's width

- **WHEN** a page declares one width and its heading declares a different one
- **THEN** the heading uses its own declared width and the content region uses
  the page's

#### Scenario: No width declared

- **WHEN** a page declares no container width
- **THEN** both regions use the standard content width

### Requirement: Available container widths include a gutter-padded full width

The set of container widths SHALL include a range of fixed maximum widths for
reading- and form-oriented screens, plus a fluid width that spans the full
available space while reserving a consistent horizontal gutter on each side so
its contents never meet the viewport edge. Listing screens, whose tables need
the room, SHALL use the fluid width; form and detail screens SHALL use the
standard fixed content width.

#### Scenario: A listing screen at fluid width

- **WHEN** a screen presenting a data table declares the fluid width
- **THEN** its heading and table span the full available width, inset by the
  standard gutter on each side

#### Scenario: A form screen at the standard width

- **WHEN** a screen presenting a form declares no width
- **THEN** its heading and form are constrained to the standard content width
  and centred in the available space

### Requirement: A screen can suppress the content container entirely

A page SHALL be able to declare that its content region applies no width
constraint and no gutter at all, so that screens managing their own full-bleed
layout — an edge-to-edge grid, or a shell that centres its own multi-column
body — are not wrapped in a competing container. Suppressing the content
container SHALL NOT affect the heading, which keeps its fixed height, its
pinning, and its own container width.

#### Scenario: An edge-to-edge screen

- **WHEN** a screen declares that its content region applies no container
- **THEN** its content is rendered without any width constraint or gutter
  imposed by the page
- **AND** its heading still renders pinned at the standard 64-pixel height

#### Scenario: A shell that centres its own body

- **WHEN** a screen with its own multi-column body declares no content
  container but declares a container width for its heading
- **THEN** the body lays itself out unconstrained while the heading's contents
  are constrained to the declared width

### Requirement: A loading heading is indistinguishable in layout from a real one

While a screen's data is in flight, its placeholder heading SHALL occupy the
same position, height, pinning, and container width as the heading that
replaces it, so that nothing shifts when the data arrives. The placeholder
SHALL be derived from the same heading behaviour rather than restating it.

#### Scenario: Placeholder to loaded transition

- **WHEN** a screen showing a placeholder heading finishes loading its data
- **THEN** the real heading appears at the same height and horizontal extent,
  and no content below it shifts vertically

#### Scenario: Placeholder honours the page width

- **WHEN** a screen using the fluid width shows its placeholder heading
- **THEN** the placeholder's contents span the same fluid width as the loaded
  heading's will
