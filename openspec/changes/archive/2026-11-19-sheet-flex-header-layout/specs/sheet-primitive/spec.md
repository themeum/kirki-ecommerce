## MODIFIED Requirements

### Requirement: Sheet parts

The UI library SHALL provide a Sheet with these parts: Sheet (root, open state),
SheetTrigger, SheetClose, SheetContent, SheetHeader, SheetFooter, SheetTitle,
SheetDescription and SheetSeparator. The parts other than SheetSeparator SHALL
have the same names and the same composition as the shadcn Sheet. Each styled
part SHALL accept a style override that merges with its base style.
SheetSeparator SHALL draw a horizontal line that goes across the full width of
the panel, through the content padding, and a feature SHALL place it where it
wants a line, for example between the header and the body.

#### Scenario: Compose a sheet

- **WHEN** a feature puts a SheetTrigger and a SheetContent with a SheetHeader, a SheetTitle, a body and a SheetFooter in a Sheet
- **THEN** selecting the trigger opens a panel that shows the title, the body and the footer

#### Scenario: Controlled open state

- **WHEN** a feature gives the Sheet an `open` value and an `onOpenChange` handler
- **THEN** the Sheet opens and closes only from that value, and calls the handler when the merchant asks to close it

#### Scenario: Full-width separator

- **WHEN** a feature puts a SheetSeparator between the SheetHeader and the body
- **THEN** a line shows between them that touches both side edges of the panel

### Requirement: Sheet behavior

An open sheet SHALL be modal: it SHALL show an overlay over the page, keep
the keyboard focus in the panel and stop the page from scrolling. The panel
SHALL have the dialog role, with the SheetTitle as its accessible name and the
SheetDescription as its accessible description. SheetHeader SHALL show a close
button with the accessible name "Close" at the end of the header. SheetContent
SHALL NOT show a close button of its own, so a sheet without a SheetHeader has
no close button. Escape, the close button, a SheetClose and a click on the
overlay SHALL close the sheet. When the sheet closes, the focus SHALL go back to
the element that opened it. The sheet SHALL render in the plugin's portal
container. The sheet and its overlay SHALL cover the WordPress admin bar, and a
menu, select or tooltip that opens from inside the sheet SHALL show above the
sheet.

#### Scenario: Escape closes

- **WHEN** a sheet is open and the merchant presses Escape
- **THEN** the sheet closes and the focus goes back to its trigger

#### Scenario: Close button in the header

- **WHEN** a sheet with a SheetHeader is open and the merchant selects "Close"
- **THEN** the sheet closes

#### Scenario: Admin bar

- **WHEN** a right sheet opens in wp-admin
- **THEN** the panel starts at the top edge of the screen and covers the admin bar, and the overlay covers the admin bar

#### Scenario: Accessible name

- **WHEN** a sheet with the title "Customize analytics" is open
- **THEN** a dialog with the name "Customize analytics" is in the accessibility tree

### Requirement: Sheet style

The sheet SHALL use the design-system tokens for its surface, border, shadow,
spacing, typography and overlay, the same as the Dialog. The panel SHALL have
16px padding on all sides and 16px of space between its parts. SheetHeader and
SheetFooter SHALL have no padding and no border of their own. SheetHeader SHALL
show two groups on one line, with the space between them: at the start, the
move icon (when the sheet can float) and the header content; at the end, the
dock button (while the sheet floats) and the close button. The header content
SHALL NOT go under the buttons. The header SHALL be fixed at the top and the
footer fixed at the bottom of the panel, and the body between them SHALL scroll
when its content is taller than the panel.

#### Scenario: Long body

- **WHEN** the body of a right sheet is taller than the screen
- **THEN** the body scrolls and the header and footer stay visible

#### Scenario: Long title

- **WHEN** a sheet has a title that is wider than the header
- **THEN** the title wraps before the close button and does not go under it

### Requirement: Floating sheet

The Sheet root SHALL accept a floating option that lets its `right`
SheetContent float, and a storage key that names where the floating state is
remembered. When the option is on, the header SHALL show a move icon at the
start of its first group, and dragging the header with a pointer SHALL turn the
docked panel into a floating panel that follows the pointer. A floating panel
SHALL have rounded corners, a shadow, the same width as the docked panel and a
height of at most 720px and at most the screen height minus a margin, and SHALL
stay fully inside the screen. While the panel floats, the header SHALL show a
dock button with the accessible name "Dock to the right" before the close
button. Selecting the dock button SHALL put the panel back at the right edge. A
floating panel SHALL NOT show an overlay, SHALL NOT stop the page from
scrolling, SHALL NOT keep the focus in the panel, and SHALL NOT close when the
merchant clicks the page. Escape, the close button and a SheetClose SHALL still
close it. A docked panel SHALL keep the modal behavior of the "Sheet behavior"
requirement. The sheet SHALL remember, per use, whether it floats and where, in
the browser's local storage, and SHALL open the same way the next time. A
remembered position that is outside the current screen SHALL be moved inside
it. On screens narrower than 640px, or when the option is off, the sheet SHALL
NOT float.

#### Scenario: Drag to float

- **WHEN** the merchant drags the header of a docked "Customize home" sheet to the middle of the screen
- **THEN** the panel floats where it was dropped, the overlay is gone, and a "Dock to the right" button shows before the close button

#### Scenario: Dock again

- **WHEN** the merchant selects "Dock to the right" on a floating sheet
- **THEN** the panel is docked at the right edge with its overlay

#### Scenario: Page stays usable

- **WHEN** the sheet floats and the merchant scrolls the page
- **THEN** the page scrolls and the sheet stays where it is

#### Scenario: Remembered position

- **WHEN** the merchant floats the sheet, closes it and opens it again
- **THEN** it opens floating at the same place

#### Scenario: Smaller window

- **WHEN** the remembered position is outside the screen after the window got smaller
- **THEN** the panel opens fully inside the screen

#### Scenario: Height limit

- **WHEN** a floating sheet with a long body opens on a 1000px-high screen
- **THEN** the panel is 720px high and its body scrolls

#### Scenario: Option off

- **WHEN** a sheet does not turn the floating option on
- **THEN** its header has no move icon and dragging the header does nothing
