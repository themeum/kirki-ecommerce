# list-table-composition Specification

## Purpose

Defines how a feature assembles a list table: the separation of column
definitions, filter presentation and table wiring into distinct modules, where
list-parameter configuration lives, and the referential-stability obligations a
feature must meet for the table's memoisation to hold.

## Requirements

### Requirement: A feature's list table is split into columns, filters, and wiring

A feature's list table SHALL be composed of separate modules: one declaring its
column definitions, one or more declaring its filter presentation, and one wiring
list state and data to the table. A column definition SHALL NOT be declared inside
the component that renders the table.

#### Scenario: Reading a feature's table

- **WHEN** a developer opens a feature's list table directory
- **THEN** the column definitions, the filter presentation, and the table wiring
  are each in their own module

#### Scenario: Changing a column's presentation

- **WHEN** a developer changes how one column renders
- **THEN** only the column module is edited, and the table wiring is untouched

#### Scenario: Adding a filter control

- **WHEN** a developer adds a filter control
- **THEN** only the filter module is edited

### Requirement: Column definitions are declared at module scope

A list table's column definitions SHALL be a module-scope constant, not a value
constructed during render. Where a cell needs behaviour that depends on hooks, that
behaviour SHALL be provided by a component the cell renders, not by rebuilding the
column definitions per render.

#### Scenario: A cell needs navigation or a mutation

- **WHEN** a cell must navigate, open a dialog, or trigger a request
- **THEN** the cell renders a component that holds that behaviour
- **AND** the column definitions themselves remain a module-scope constant

#### Scenario: Column definitions memoised with no dependencies

- **WHEN** column definitions are found wrapped in a render-time memoisation with
  no dependencies
- **THEN** they are moved to module scope instead, since that is what such a
  memoisation is emulating

#### Scenario: Searching a table does not repaint its header

- **WHEN** a user searches and new rows arrive
- **THEN** the column definitions are the same reference as before, so the header
  is not rebuilt

### Requirement: A sortable column's identifier is the field the service sorts by

Where a column is sortable, its identifier SHALL be the field name the backing
service accepts for sorting. A feature SHALL NOT carry a separate sort-key
declaration alongside the identifier.

#### Scenario: Declaring a sortable column

- **WHEN** a developer makes a column sortable
- **THEN** the column's identifier is the service's field name for it
- **AND** no second name for the same thing is introduced

### Requirement: List-parameter configuration is a single shared constant per feature

A feature SHALL declare the defaults and filter configuration for its list in one
module-scope constant, shared by every module that reads or writes that list's
state. The same configuration SHALL NOT be restated at more than one call site.

#### Scenario: Table and filter UI read the same list state

- **WHEN** both the table wiring and the filter presentation need list parameters
- **THEN** both use the same configuration constant

#### Scenario: Changing a list default

- **WHEN** a developer changes a list's default page size or sort
- **THEN** exactly one constant is edited

### Requirement: A table reports in-flight requests, not just first loads

A feature SHALL supply the table with a value that is true whenever a request for
that list is in flight, including refreshes triggered by search, filter, sort or
page changes — not only the first load.

#### Scenario: Searching an already-loaded list

- **WHEN** a user changes the search term on a list that already has rows
- **THEN** the table is told a request is in flight and presents its loading state

#### Scenario: Previous results retained during a refresh

- **WHEN** the feature retains the previous page's rows while refetching
- **THEN** the table is still told a request is in flight

### Requirement: A feature signals when a filter change invalidates a selection

A feature whose table supports row selection SHALL supply the signal that identifies
when the filter criteria behind the result set have changed, so that a selection
made against the previous criteria is discarded.

#### Scenario: Filters change with rows selected

- **WHEN** a user has rows selected and then changes a filter
- **THEN** the feature's signal changes and the selection is discarded

#### Scenario: Paging with rows selected

- **WHEN** a user has rows selected and moves to another page
- **THEN** the signal is unchanged and the selection is retained
