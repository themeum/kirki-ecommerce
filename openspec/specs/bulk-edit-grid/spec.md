# bulk-edit-grid Specification

## Purpose

Defines the spreadsheet surface merchants use to edit many product variants at once: which columns exist, how the grid stays responsive at catalogue scale, and how cells are selected, filled, and activated for editing.
## Requirements
### Requirement: Variant columns presented by the grid

The grid SHALL present exactly the following columns, in order: Variants, Price, Sale Price, Cost of Goods, Profit, Margin, Base price per unit, SKU, Dimension, Weight, Track Inventory, Availability, Committed, Low Stock Threshold, Limit Purchase, Limit, Visibility, Charge Tax, Tax profile, Shipping Profile.

The Variants column SHALL show the variant's image and its identity as `{Product Title} - {Attribute Value 1} | {Attribute Value 2}` (one segment per attribute the variant carries, joined with ` | `), e.g. "Sample Product Title - Red | XL". A variant with no attributes (a simple product) SHALL show just the product title, with no trailing separator. Profit, Margin, and Committed SHALL be read-only. Profit and Margin SHALL be derived from the row's current price, sale price, and cost of goods rather than stored. Weight SHALL present its amount and unit as one column. Dimension SHALL select a shipping box and SHALL display the chosen box's name and its length, width, and height.

Tax profile and Shipping Profile options SHALL be sourced from the tax-profile and shipping-profile collections. The grid MUST NOT present hardcoded, fictional, or empty option lists for these fields.

#### Scenario: Derived columns react to edits

- **WHEN** the merchant changes a row's price, sale price, or cost of goods
- **THEN** that row's Profit and Margin update to reflect the new values
- **AND** neither Profit nor Margin can be edited directly

#### Scenario: Profile options come from the store's own records

- **WHEN** the merchant opens the Tax profile or Shipping Profile control on any row
- **THEN** the options listed are the store's configured tax profiles or shipping profiles
- **AND** selecting one records that profile on the row

#### Scenario: No standalone unit-price toggle column

- **WHEN** the merchant scans the grid's columns
- **THEN** there is no separate Unit price column, because whether a unit price exists is expressed by the Base price per unit cell's own value

#### Scenario: SKU is editable

- **WHEN** the merchant activates a SKU cell and types a value
- **THEN** the new SKU is recorded on that row

#### Scenario: Variant identity shows product title and attribute values

- **WHEN** the merchant views a Variants cell for a variant of "Sample Product" with attribute values Red and XL
- **THEN** the cell reads "Sample Product - Red | XL"

#### Scenario: Simple product identity shows only the title

- **WHEN** the merchant views a Variants cell for a simple product's variant with no attributes
- **THEN** the cell reads just the product's title, with no trailing separator

### Requirement: Gated cells

Low Stock Threshold SHALL present an editable control only while the row tracks
inventory. Limit SHALL present an editable control only while the row limits
purchase quantity. Tax profile SHALL present an editable control only while the
row charges tax. When one of these gates is off, the cell SHALL show a
non-editable placeholder. Base price per unit SHALL NOT be gated — it is editable
on every row.

Availability SHALL instead be editable in both states, presenting a different
control in each: a quantity field while the row tracks inventory, and a choice of
In Stock or Out of Stock — bound to the variant's stock flag — while it does not.
The choice offered while untracked SHALL match the one the single-variant form
offers for the same variant. Changing a row's inventory tracking SHALL swap which
control the cell presents without altering the value behind the other one, so the
row's quantity survives a trip through the untracked state.

#### Scenario: Gate turned off hides the control

- **WHEN** a row does not track inventory
- **THEN** its Low Stock Threshold cell shows a placeholder instead of an editable control

#### Scenario: Gate turned on reveals the stored value

- **WHEN** the merchant enables inventory tracking on a row that already holds an availability value
- **THEN** the Availability cell shows a quantity field holding that stored value

#### Scenario: An untracked row offers a stock status

- **WHEN** a row does not track inventory
- **THEN** its Availability cell offers In Stock and Out of Stock
- **AND** choosing one records that stock status on the variant

#### Scenario: Turning tracking off preserves the quantity

- **WHEN** the merchant unchecks Track Inventory on a row whose Availability is 250
- **THEN** the Availability cell switches to the stock-status choice
- **AND** re-checking Track Inventory shows 250 again

#### Scenario: Base price per unit is always editable

- **WHEN** the merchant activates a Base price per unit cell on any row
- **THEN** the cell presents its editable control, regardless of any other value on that row

### Requirement: Grid remains responsive at catalogue scale

The grid SHALL remain interactive when editing up to 1000 variants at once. Scrolling, typing, and dragging MUST NOT degrade as the number of loaded variants grows. Every row SHALL occupy a fixed height of 32 pixels, and column widths SHALL remain stable while scrolling.

#### Scenario: Large variant set stays usable

- **WHEN** the merchant opens the grid with 1000 variants
- **THEN** the grid scrolls and accepts edits without perceptible lag

#### Scenario: Column widths do not shift while scrolling

- **WHEN** the merchant scrolls vertically through a large variant set
- **THEN** column widths and row heights remain unchanged

### Requirement: Pinned identity column and horizontal navigation

The Variants column SHALL remain fixed against the left edge while the merchant scrolls horizontally, so every row stays identifiable. The grid SHALL provide a horizontal scroll control that remains reachable without scrolling to the end of the variant list.

#### Scenario: Identity stays visible when scrolled right

- **WHEN** the merchant scrolls horizontally to a column at the far right
- **THEN** the Variants column remains visible at the left edge with its image and identity intact

#### Scenario: Horizontal control is reachable from anywhere in the list

- **WHEN** the merchant is viewing rows in the middle of a 1000-variant list
- **THEN** the horizontal scroll control is visible without scrolling to the last row

### Requirement: Cell selection within a column

The merchant SHALL be able to select cells within a single column in three ways: dragging across cell bodies, shift-clicking another cell to extend a contiguous range from the anchor, or Cmd/Ctrl-clicking individual cells to build a non-contiguous selection of rows. Selecting cells MUST NOT change any value. A selection SHALL never span more than one column; selecting a cell in a different column SHALL start a new selection there.

Cmd/Ctrl-clicking a row already in the selection SHALL remove that row from the selection (toggle off), including a row in the middle of a previously dragged or shift-extended range. Cmd/Ctrl-clicking a row not in the selection SHALL add it, and dragging while Cmd/Ctrl is held SHALL extend that newly added chunk.

A plain click (no modifier) on any cell — whether or not it is already part of the current selection — SHALL replace the selection with just that single cell and make it active. The selection is only extended or preserved via Shift-click or Cmd/Ctrl-click, per above; a plain click never preserves a prior multi-cell selection.

Read-only columns and the Variants column SHALL NOT be selectable.

#### Scenario: Shift-click extends a range without changing values

- **WHEN** the merchant clicks a Price cell and then shift-clicks a Price cell eight rows below
- **THEN** all nine cells in that range are marked as selected
- **AND** none of their values change

#### Scenario: Dragging across cell bodies selects a range

- **WHEN** the merchant presses on a Price cell and drags down across other Price cells
- **THEN** the cells passed over are marked as selected
- **AND** none of their values change

#### Scenario: Selecting in another column starts over

- **WHEN** a range is selected in Price and the merchant shift-clicks a Sale Price cell
- **THEN** the Price selection is cleared
- **AND** a new selection begins in Sale Price

#### Scenario: Read-only columns cannot be selected

- **WHEN** the merchant presses on a Profit, Margin, Committed, or Variants cell
- **THEN** no selection is started

#### Scenario: Cmd/Ctrl-click builds a non-contiguous selection

- **WHEN** the merchant clicks a Price cell on row 2, then Cmd/Ctrl-clicks Price cells on rows 5 and 9
- **THEN** rows 2, 5, and 9 are all marked as selected
- **AND** rows 3, 4, 6, 7, and 8 remain unselected

#### Scenario: Cmd/Ctrl-click toggles a selected row off

- **WHEN** the merchant has selected Price rows 2, 5, and 9 via Cmd/Ctrl-click and Cmd/Ctrl-clicks row 5 again
- **THEN** row 5 is no longer selected
- **AND** rows 2 and 9 remain selected

#### Scenario: Cmd/Ctrl-click toggles a row out of the middle of a dragged range

- **WHEN** the merchant drags to select Price rows 3 through 7 and then Cmd/Ctrl-clicks row 5
- **THEN** row 5 is no longer selected
- **AND** rows 3, 4, 6, and 7 remain selected

#### Scenario: Clicking any cell collapses the selection to it

- **WHEN** the merchant has a multi-row Price selection and plain-clicks a cell already within it
- **THEN** the selection collapses to just that clicked cell
- **AND** that cell becomes active

#### Scenario: Clicking outside the selection replaces it

- **WHEN** the merchant has a Price selection and clicks a Price cell outside that selection
- **THEN** the previous selection is cleared
- **AND** a new selection starts at the clicked cell

#### Scenario: Clicking outside the grid clears the selection

- **WHEN** the merchant has a selection and clicks outside the grid
- **THEN** the selection is cleared entirely

### Requirement: Fill from a selected cell

A selection SHALL present a fill handle at its bottom-most selected row, whether the selection is a contiguous range or a non-contiguous Cmd/Ctrl-click selection. Dragging that handle across other cells in the same column SHALL copy the value of the row the drag started from into every cell in the dragged range, overwriting whatever was there.

Where a column presents different controls on different rows — as Availability
does — the fill SHALL copy the value belonging to the control the drag started
from, and SHALL leave rows presenting the other control unchanged rather than
writing a value their cell does not show. A fill SHALL NOT change which control a
target row presents.

Completing a fill SHALL leave the column with one contiguous selection spanning from the topmost previously-selected row through the drag's end point, replacing whatever non-contiguous shape the selection had beforehand.

While dragging the handle, the merchant SHALL be able to extend the fill beyond the currently visible rows; the grid SHALL scroll as the pointer approaches its edge.

#### Scenario: Fill copies the origin value down

- **WHEN** the merchant selects the top Price cell and drags its fill handle down over four rows
- **THEN** all four rows take the top cell's price, replacing their previous values

#### Scenario: Fill can extend past the visible rows

- **WHEN** the merchant drags the fill handle to the bottom edge of the grid and holds
- **THEN** the grid scrolls further down and the fill range continues to extend

#### Scenario: Fill handle sits at the bottom of a non-contiguous selection

- **WHEN** the merchant has Cmd/Ctrl-click selected Price rows 2, 5, and 9
- **THEN** the fill handle appears at row 9

#### Scenario: Filling from a non-contiguous selection collapses it

- **WHEN** the merchant has Cmd/Ctrl-click selected Price rows 2, 5, and 9 and drags the fill handle from row 9 down to row 12
- **THEN** rows 10, 11, and 12 take row 9's value
- **AND** the resulting selection spans rows 2 through 12 as one contiguous range

#### Scenario: Filling Availability from a tracked row skips untracked rows

- **WHEN** the merchant fills Availability down from a tracked row holding 250, across rows where row 3 does not track inventory
- **THEN** the tracked rows in the range take 250
- **AND** row 3 keeps its stock status and its own quantity
- **AND** no row's inventory tracking setting changes

#### Scenario: Filling Availability from an untracked row skips tracked rows

- **WHEN** the merchant fills Availability down from an untracked row set to Out of Stock, across rows where row 3 tracks inventory
- **THEN** the untracked rows in the range become Out of Stock
- **AND** row 3 keeps its quantity
- **AND** no row's inventory tracking setting changes

### Requirement: Two-stage cell editing

A text, number, or money cell SHALL require two distinct actions before its control accepts typed input: a click selects the cell without focusing its underlying control (so a click-and-drag from an unfocused cell still selects a range rather than editing text), and the first printable keystroke typed while that cell is selected SHALL focus the control and replace its entire existing value with that keystroke, discarding what was there. A double-click, or pressing Enter on a selected cell, SHALL instead activate it with the existing value intact and the cursor placed, without clearing it. Editing an active cell that belongs to a multi-cell selection SHALL fan the new value out to every selected cell in that column. Pressing Escape or interacting outside the cell SHALL deactivate it. At most one cell SHALL be active at a time.

Select-like cells (per Borderless select-like cells) and checkbox cells (per Checkbox click and keyboard toggle) do not accept typed replacement text and are governed by their own requirements instead, but still share the "first click only selects" behavior for any interaction that is not their own direct-activation path.

#### Scenario: First press selects without focusing

- **WHEN** the merchant clicks a Price cell that was not selected
- **THEN** the cell is selected
- **AND** its input does not receive focus, so dragging from here selects rather than editing text

#### Scenario: Typing on a selected cell replaces its value

- **WHEN** the merchant selects a Price cell holding 19.99 and types "5"
- **THEN** the cell's input becomes focused and its value becomes "5", not "19.995" or "519.99"

#### Scenario: Double-click or Enter edits in place without clearing

- **WHEN** the merchant double-clicks a Price cell holding 19.99, or selects it and presses Enter
- **THEN** the cell becomes active with its input focused and the value still 19.99, cursor placed in the text

#### Scenario: Activating a cell within a non-contiguous selection fans the edit out

- **WHEN** the merchant has Cmd/Ctrl-click selected Price rows 2, 5, and 9 and types a new value into row 5's selected cell
- **THEN** rows 2, 5, and 9 all take the new value

#### Scenario: Escape deactivates

- **WHEN** a cell is active and the merchant presses Escape
- **THEN** the cell stops being active and no further typing reaches it

### Requirement: Column visibility

The merchant SHALL be able to show or hide individual columns from the page's top bar. All columns SHALL be visible initially, and the merchant's choice SHALL persist across visits to the page. The Variants column SHALL always remain visible.

#### Scenario: Hidden column is remembered

- **WHEN** the merchant hides the Margin column and later returns to the bulk edit page
- **THEN** the Margin column is still hidden

### Requirement: Grid lines and layout-stable selection indicator

Every cell SHALL show a visible grid line on its trailing and bottom edges, so the grid reads as a spreadsheet rather than a borderless table. The visual indicator for a selected or fill-targeted cell MUST NOT change that cell's box size or shift any neighboring cell, regardless of how many cells are selected or filled at once.

#### Scenario: Grid lines are always visible

- **WHEN** the merchant views the grid in any state
- **THEN** every cell shows a visible border on its right and bottom edges

#### Scenario: Selecting cells causes no layout shift

- **WHEN** the merchant selects a range of cells
- **THEN** no cell's width or height changes and no column shifts position

### Requirement: Compact cell layout

Every cell SHALL use minimal padding, and the control it hosts (input, select, or button) SHALL fit entirely within the grid's fixed 32-pixel row height without clipping or overflowing.

#### Scenario: A money cell's input fits the fixed row height

- **WHEN** the merchant views a Price cell
- **THEN** its input renders fully within the 32-pixel row, with no part of it clipped or extending beyond the row

### Requirement: Borderless select-like cells

Tax profile, Shipping Profile, Dimension, the Weight unit, and Base price per unit SHALL render without a visible border or background, showing only a right-aligned chevron affordance, so the cell itself reads as the field. These cells SHALL follow the same two-stage editing model as other cells: a first press selects the cell, and a second click, double-click, or Enter opens the control (dropdown or dialog).

The interaction that opens such a control SHALL NOT also dismiss it. The control
SHALL stay open until the merchant dismisses it deliberately — by choosing a
value, by a control of its own, by clicking outside it, or by pressing Escape.

#### Scenario: A select-like cell shows only a chevron at rest

- **WHEN** the merchant views a Tax profile cell that is not active
- **THEN** the cell shows its current value and a chevron, with no visible border or background

#### Scenario: A select-like cell still requires two actions to open

- **WHEN** the merchant presses a Tax profile cell that was not selected
- **THEN** the cell is selected but its dropdown does not open
- **AND** a subsequent click, double-click, or Enter opens it

#### Scenario: The unit-price dialog stays open once opened

- **WHEN** the merchant presses a Base price per unit cell that was not selected, then presses it again
- **THEN** its dialog opens and remains open
- **AND** no third press is needed to reach it

### Requirement: Checkbox click and keyboard toggle

Clicking directly on a checkbox cell's checkbox glyph SHALL toggle its checked state and SHALL also make that cell the active/selected cell. Clicking elsewhere within a checkbox cell (not the glyph itself) SHALL only select the cell, without toggling it. Pressing Space while one or more checkbox cells in a column are selected SHALL toggle them, fanning the resulting checked state out to every selected cell in that column the same way a typed value fans out for other field kinds.

#### Scenario: Clicking the glyph toggles and selects

- **WHEN** the merchant clicks directly on an unchecked Track Inventory checkbox
- **THEN** the checkbox becomes checked
- **AND** that cell becomes the active/selected cell

#### Scenario: Clicking elsewhere in the cell only selects

- **WHEN** the merchant clicks inside a Track Inventory cell but not on the checkbox glyph
- **THEN** the cell is selected
- **AND** the checkbox's checked state does not change

#### Scenario: Space fans a toggle out to the whole selection

- **WHEN** the merchant has a multi-row Track Inventory selection and presses Space
- **THEN** every selected row's checkbox takes the same resulting checked state

### Requirement: Column visibility menu

The grid SHALL offer a column-visibility control, opened from a labeled trigger (an icon and the text "Columns"), that lists every hideable column grouped under labeled categories (at minimum General, Pricing, Inventory, Shipping, and Tax). The Variants column SHALL appear in the list checked and disabled, since it can never be hidden. Toggling a column's checkbox SHALL immediately show or hide that column without closing the menu; the menu SHALL close only when the merchant dismisses it explicitly (clicking outside it or pressing Escape).

#### Scenario: Columns are grouped by category

- **WHEN** the merchant opens the column-visibility menu
- **THEN** the columns are listed under labeled category headings rather than a single flat list

#### Scenario: Variants column cannot be hidden

- **WHEN** the merchant opens the column-visibility menu
- **THEN** the Variants entry is shown checked and disabled

#### Scenario: Menu stays open across multiple toggles

- **WHEN** the merchant toggles two different columns' checkboxes in the same menu session
- **THEN** the menu remains open after each toggle
- **AND** the menu closes only when the merchant clicks outside it or presses Escape

### Requirement: Rule-based SKU generation from the grid

While one or more SKU cells are selected, the SKU column header SHALL present a
generate action. Triggering it SHALL replace the SKU of every selected row with a
rule-based SKU composed by the server from that row's own product data, each row
receiving its own number. The action SHALL NOT appear when nothing is selected or
when the selection sits in another column, SHALL indicate that it is busy while
the request is in flight, and on failure SHALL leave every SKU untouched and
surface the failure to the merchant. Showing or hiding it SHALL NOT change the
header's dimensions or move any other part of the grid.

Generated SKUs SHALL be written into the grid's unsaved form state only; they
SHALL NOT be stored until the merchant saves.

#### Scenario: The action appears with a SKU selection

- **WHEN** the merchant selects one or more SKU cells
- **THEN** a generate action appears in the SKU column header

#### Scenario: Showing the action does not move the grid

- **WHEN** the generate action appears or disappears as the merchant's selection
  changes
- **THEN** the header row keeps its height and no row of the grid moves

#### Scenario: The action stays hidden for other columns

- **WHEN** the merchant's selection sits in the Price column, or nothing is
  selected
- **THEN** no generate action is shown in the SKU column header

#### Scenario: Every selected row gets its own SKU

- **WHEN** the merchant selects three SKU cells and triggers the generate action
- **THEN** each of those three rows takes a distinct rule-based SKU
- **AND** rows outside the selection keep their existing SKU

#### Scenario: Generation fails

- **WHEN** the merchant triggers the generate action and the request fails
- **THEN** every selected row keeps its previous SKU
- **AND** the merchant is shown an error

### Requirement: The SKU column is wide enough for a generated SKU

The SKU column SHALL be sized to display a rule-based SKU — which carries a
segment per attribute value in addition to title, brand, category and sequence
segments — without the merchant having to widen or scroll within the cell to read
it.

#### Scenario: A multi-segment SKU is readable

- **WHEN** a row holds a SKU such as `BLU-RED-SMA-NIK-APP-010`
- **THEN** that value is legible in the SKU cell at the column's default width

### Requirement: Caret placement after a seeding keystroke

When a printable keystroke seeds a cell's value and activates it, the caret SHALL
be placed after the seeded text rather than selecting it, so continued typing
appends to what was already typed. Activation by double-click or Enter SHALL
continue to present the existing value selected, so that typing overwrites it.

This SHALL hold for every cell kind that accepts typed input — text, number,
money, and the Weight column's numeric field.

#### Scenario: Continued typing appends

- **WHEN** the merchant selects a Weight cell, types "1", and then types "2"
- **THEN** the cell's value is "12"

#### Scenario: Seeding still discards the previous value

- **WHEN** the merchant selects a Price cell holding 19.99 and types "5"
- **THEN** the cell's value is "5"
- **AND** typing "0" next makes it "50", not "0"

#### Scenario: Enter still selects for overwrite

- **WHEN** the merchant selects a Price cell holding 19.99 and presses Enter, then types "5"
- **THEN** the cell's value is "5", because Enter presented the existing value selected
