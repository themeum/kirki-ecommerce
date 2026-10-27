## Purpose

Defines the composable pagination control layer of the admin UI: which parts a
caller assembles, how the visible page window and its ellipses are computed, how
active and unavailable pages behave, and the accessibility contract the control
must meet.

## ADDED Requirements

### Requirement: Pagination is assembled from composable parts

The pagination layer SHALL provide separate parts for the control's landmark,
its list, each list entry, a page target, previous and next targets, and an
ellipsis. A caller SHALL be able to assemble a pagination bar from these parts
without reaching for a raw HTML element.

#### Scenario: Assembling a standard pagination bar

- **WHEN** a caller composes the landmark, list, entries, previous/next targets
  and page targets
- **THEN** a complete pagination bar renders with correct list semantics
  (navigation landmark containing a list of entries)

#### Scenario: Rendering a gap in the page sequence

- **WHEN** the visible page window omits pages
- **THEN** an ellipsis part represents the omitted range and is not presentable
  as an activatable page

### Requirement: Page targets are activatable controls, not hyperlinks

Page, previous and next targets SHALL be rendered as activatable controls that
report the requested page to the caller. They SHALL NOT require a destination
address, and the pagination layer SHALL NOT depend on the application's routing
or on knowledge of how list state is stored.

#### Scenario: Requesting a page

- **WHEN** a user activates a page target
- **THEN** the pagination control reports that page number to its caller
- **AND** the control itself does not change any address or route

#### Scenario: Use outside a routed screen

- **WHEN** pagination is rendered inside a dialog whose list state is not held
  in the address
- **THEN** the control functions normally

### Requirement: The visible page window is bounded and centred on the current page

The pagination layer SHALL compute a bounded window of page numbers around the
current page, always including the first and last page, and inserting an
ellipsis on either side where pages are omitted. The number of entries rendered
SHALL NOT grow with the total page count.

#### Scenario: Few enough pages to show all

- **WHEN** the total page count is small enough to fit the window
- **THEN** every page number is presented and no ellipsis appears

#### Scenario: Current page near the start

- **WHEN** the current page is close to the first page and many pages follow
- **THEN** a leading run of pages is presented, followed by an ellipsis and the last page

#### Scenario: Current page near the end

- **WHEN** the current page is close to the last page and many pages precede it
- **THEN** the first page is presented, followed by an ellipsis and a trailing run of pages

#### Scenario: Current page in the middle

- **WHEN** the current page is far from both ends
- **THEN** the first page, an ellipsis, a window around the current page, a
  second ellipsis, and the last page are presented

#### Scenario: Very large page counts

- **WHEN** the total page count is in the thousands
- **THEN** the number of rendered page entries stays bounded

### Requirement: The current page is identified to assistive technology

Exactly one page target SHALL be marked as the current page in a form exposed to
assistive technology, and SHALL be visually distinguished from the others.

#### Scenario: Current page marked

- **WHEN** the pagination bar renders for a given current page
- **THEN** that page's target reports itself as the current page to assistive technology
- **AND** no other page target does

### Requirement: Unavailable navigation is presented as disabled, not hidden

When there is no previous or no next page, the corresponding target SHALL be
presented as disabled rather than removed. The pagination layer SHALL also accept
a caller-supplied disabled state that renders every target inert while keeping
the whole bar visible.

#### Scenario: On the first page

- **WHEN** the current page is the first page
- **THEN** the previous target is disabled and still rendered

#### Scenario: On the last page

- **WHEN** the current page is the last page
- **THEN** the next target is disabled and still rendered

#### Scenario: List is being refetched

- **WHEN** a caller marks the pagination control disabled because new results
  are in flight
- **THEN** every target becomes inert
- **AND** the bar remains rendered at its normal size, so surrounding layout
  does not shift

### Requirement: A page can be selected directly

The pagination layer SHALL provide a part that lets a user jump to a page by
choosing it directly, showing the current page and the total page count.

#### Scenario: Jumping to a page

- **WHEN** a user chooses a page from the direct-selection control
- **THEN** the pagination control reports that page to its caller, exactly as a
  page target would

#### Scenario: Total page count shown

- **WHEN** the direct-selection control renders
- **THEN** the total number of pages is presented alongside the current page
