## Purpose

Defines the presentational table element layer of the admin UI: which table
parts a caller composes, how row and cell state is expressed, the `data-*`
attribute contracts that other components style against, and the rule that this
layer carries no feature-specific behaviour.

## ADDED Requirements

### Requirement: The table layer covers every semantic table element

The table primitive layer SHALL provide a composable part for each semantic
element of an HTML table: the table itself, header section, body section, footer
section, row, header cell, data cell, and caption. A caller SHALL NOT need to
drop to a raw HTML element to express any part of a table.

#### Scenario: Composing a table with a footer

- **WHEN** a caller needs a totals row beneath the body
- **THEN** a footer section part is available and renders as the table's `<tfoot>`

#### Scenario: Composing a table with a caption

- **WHEN** a caller needs an accessible description of the table
- **THEN** a caption part is available and renders as the table's `<caption>`

### Requirement: Wide tables scroll horizontally without overflowing the page

The table part SHALL render inside a container that scrolls horizontally when
the table is wider than its available space. Horizontal overflow SHALL NOT
propagate to the page.

#### Scenario: Table wider than its container

- **WHEN** a table's content requires more horizontal space than its parent provides
- **THEN** the table scrolls horizontally within its own bounds
- **AND** the surrounding page layout does not scroll horizontally

#### Scenario: Table narrower than its container

- **WHEN** a table fits within its parent
- **THEN** no scrollbar is presented and the table occupies the full available width

### Requirement: Row density is selected by a named scale

The table part SHALL accept a density selection from a fixed named scale that
controls cell padding for every cell in the table. The scale SHALL name its
values after how dense the result is, not after the feature that first needed it.

#### Scenario: Choosing a denser table

- **WHEN** a caller selects the compact density
- **THEN** every header and data cell in that table renders with reduced vertical padding

#### Scenario: No density selected

- **WHEN** a caller omits the density selection
- **THEN** the table renders with the default density

### Requirement: Cells express horizontal alignment declaratively

Header and data cell parts SHALL accept a horizontal alignment selection.
Alignment SHALL apply to the cell's own content and to any label element nested
within it. Absence of a selection SHALL mean start-aligned.

#### Scenario: Right-aligning a numeric column

- **WHEN** a caller sets a data cell's alignment to right
- **THEN** the cell's content renders right-aligned

#### Scenario: Alignment reaches a nested label

- **WHEN** an aligned cell contains a label element
- **THEN** the label follows the cell's alignment rather than the default

### Requirement: Rows and cells expose their state as data attributes

A row part SHALL expose an active state, and a data cell part SHALL expose a
disabled state and a checkbox-only state, each as a `data-*` attribute on the
rendered element. These attributes are a public contract that other components
and feature-local styles are permitted to target.

#### Scenario: Active row

- **WHEN** a row is marked active
- **THEN** the rendered row carries an active data attribute
- **AND** the row is styled as though hovered

#### Scenario: Checkbox-only cell

- **WHEN** a cell is marked as containing only a checkbox
- **THEN** the rendered cell carries a checkbox-only data attribute
- **AND** the cell claims minimal horizontal width

#### Scenario: Disabled cell

- **WHEN** a cell is marked disabled
- **THEN** the rendered cell carries a disabled data attribute

### Requirement: Row actions are revealed on row interaction

The table layer SHALL hide any element marked as a row-action group by default,
and reveal it when its row is hovered or is in the active state. This reveal
contract SHALL be provided by the table layer so that no caller re-implements
it per feature.

#### Scenario: Actions hidden at rest

- **WHEN** a row containing a row-action group is neither hovered nor active
- **THEN** the action group is not visible

#### Scenario: Actions revealed on hover

- **WHEN** the pointer enters a row containing a row-action group
- **THEN** the action group becomes visible

#### Scenario: Actions revealed for an active row

- **WHEN** a row is marked active, for example because its menu is open
- **THEN** its action group is visible even without hover

### Requirement: Style overrides win on every part

Every part in the table layer SHALL accept a style override as a plain style
object, and SHALL merge it into that part's own styles at the same specificity
the part uses for its defaults. An override SHALL take effect regardless of
which part it is applied to.

#### Scenario: Override on a section part

- **WHEN** a caller passes a style override to the header, body, or row part
- **THEN** the override applies to the rendered element and is not defeated by
  surrounding wp-admin styles

#### Scenario: Override conflicts with a part default

- **WHEN** an override sets a property the part also sets by default
- **THEN** the override's value is the one applied

### Requirement: The table layer is free of feature-specific behaviour

The table primitive layer SHALL NOT contain styles or props that exist to serve
one named feature. Feature-specific presentation, including spreadsheet-style
cell-range editing affordances, SHALL be defined by the owning feature and
supplied to the table through the ordinary style-override mechanism.

#### Scenario: Spreadsheet editing styles

- **WHEN** a feature needs cell-range selection, fill affordances, or sticky
  first-column behaviour for an editing grid
- **THEN** that feature owns those style definitions
- **AND** the table layer exposes no prop named after that feature's editing mode

#### Scenario: Inspecting the table layer for feature coupling

- **WHEN** the table layer's props and styles are reviewed
- **THEN** none of them reference a specific feature, screen, or workflow by name
