## Purpose

Provides the shared Sheet: a modal panel that slides in from one edge of the
screen, for side tasks such as page settings, without leaving the page.

## ADDED Requirements

### Requirement: Sheet parts

The UI library SHALL provide a Sheet with these parts: Sheet (root, open state),
SheetTrigger, SheetClose, SheetContent, SheetHeader, SheetFooter, SheetTitle and
SheetDescription. The parts SHALL have the same names and the same composition
as the shadcn Sheet. Each styled part SHALL accept a style override that merges
with its base style.

#### Scenario: Compose a sheet

- **WHEN** a feature puts a SheetTrigger and a SheetContent with a SheetHeader, a SheetTitle, a body and a SheetFooter in a Sheet
- **THEN** selecting the trigger opens a panel that shows the title, the body and the footer

#### Scenario: Controlled open state

- **WHEN** a feature gives the Sheet an `open` value and an `onOpenChange` handler
- **THEN** the Sheet opens and closes only from that value, and calls the handler when the merchant asks to close it

### Requirement: Sheet sides

SheetContent SHALL accept a side: `top`, `right`, `bottom` or `left`. The
default side SHALL be `right`. A `right` or `left` sheet SHALL take the full
height of the screen and a width of at most 400px, and SHALL take the full
width on screens narrower than that. A `top` or `bottom` sheet SHALL take the
full width. The sheet SHALL slide in from its side when it opens and slide out
to its side when it closes. When the user asks for reduced motion, the sheet
SHALL NOT slide.

#### Scenario: Default side

- **WHEN** a SheetContent has no side
- **THEN** the panel opens from the right edge with the full screen height

#### Scenario: Narrow screen

- **WHEN** a right sheet opens on a 360px-wide screen
- **THEN** the panel takes the full width

### Requirement: Sheet behavior

An open sheet SHALL be modal: it SHALL show an overlay over the page, keep
the keyboard focus in the panel and stop the page from scrolling. The panel
SHALL have the dialog role, with the SheetTitle as its accessible name and the
SheetDescription as its accessible description. SheetContent SHALL show a
close button with the accessible name "Close" in the top-right corner. Escape,
the close button, a SheetClose and a click on the overlay SHALL close the
sheet. When the sheet closes, the focus SHALL go back to the element that
opened it. The sheet SHALL render in the plugin's portal container. The sheet
and its overlay SHALL cover the WordPress admin bar, and a menu, select or
tooltip that opens from inside the sheet SHALL show above the sheet.

#### Scenario: Escape closes

- **WHEN** a sheet is open and the merchant presses Escape
- **THEN** the sheet closes and the focus goes back to its trigger

#### Scenario: Admin bar

- **WHEN** a right sheet opens in wp-admin
- **THEN** the panel starts at the top edge of the screen and covers the admin bar, and the overlay covers the admin bar

#### Scenario: Accessible name

- **WHEN** a sheet with the title "Customize analytics" is open
- **THEN** a dialog with the name "Customize analytics" is in the accessibility tree

### Requirement: Sheet style

The sheet SHALL use the design-system tokens for its surface, border, shadow,
spacing, typography and overlay, the same as the Dialog. The header SHALL be
fixed at the top and the footer fixed at the bottom of the panel, and the body
between them SHALL scroll when its content is taller than the panel.

#### Scenario: Long body

- **WHEN** the body of a right sheet is taller than the screen
- **THEN** the body scrolls and the header and footer stay visible
