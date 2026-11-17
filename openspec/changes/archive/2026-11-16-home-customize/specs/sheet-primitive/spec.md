## ADDED Requirements

### Requirement: Floating sheet

The Sheet root SHALL accept an option that lets its `right` SheetContent float,
with a storage key that names where the floating state is remembered. When the
option is on, the header SHALL show a move icon at its start, and dragging the
header with a pointer SHALL turn the docked panel into a floating panel that
follows the pointer. A floating panel SHALL have rounded corners, a shadow, the
same width as the docked panel and a height of at most the screen height minus
a margin, and SHALL stay fully inside the screen. While the panel floats, the
header SHALL show a dock button with the accessible name "Dock to the right"
before the close button. Selecting the dock button SHALL put the panel back at
the right edge. A floating panel SHALL NOT show an overlay, SHALL NOT stop the
page from scrolling, SHALL NOT keep the focus in the panel, and SHALL NOT close
when the merchant clicks the page. Escape, the close button and a SheetClose
SHALL still close it. A docked panel SHALL keep the modal behavior of the
"Sheet behavior" requirement. The sheet SHALL remember, per use, whether it
floats and where, in the browser's local storage, and SHALL open the same way
the next time. A remembered position that is outside the current screen SHALL
be moved inside it. On screens narrower than 640px, or when the option is off,
the sheet SHALL NOT float.

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

#### Scenario: Option off

- **WHEN** a sheet does not turn the floating option on
- **THEN** its header has no move icon and dragging the header does nothing
