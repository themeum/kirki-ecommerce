# data-table-params-binding Specification

## Purpose

Defines the binding between list state held in the browser address and the state
a list table consumes: how page numbering is translated between the two, which
changes reset paging, and when a change means an in-progress row selection is no
longer meaningful.

## Requirements

### Requirement: Page numbering is translated between address and table

Addressed list state SHALL number pages from one, as it is user-facing. The table's
page state SHALL be zero-based. The binding SHALL translate in both directions so
that neither side is exposed to the other's numbering.

#### Scenario: Reading the first page from the address

- **WHEN** the address holds page one, or holds no page at all
- **THEN** the table receives page index zero

#### Scenario: Reading a later page from the address

- **WHEN** the address holds page four
- **THEN** the table receives page index three

#### Scenario: Table requests a later page

- **WHEN** the table reports a move to page index three
- **THEN** the address is updated to page four

### Requirement: Sort state is translated between address and table

The address SHALL hold sort state as a field name and a direction. The table SHALL
express sort state as an ordered set of column identifiers with a descending flag.
The binding SHALL translate between them.

When the table reports no sort at all, the binding SHALL remove the sort field and
direction from the address, so that the list returns to the default sort declared in
the feature's list configuration.

#### Scenario: Reading sort state

- **WHEN** the address holds a sort field and a descending direction
- **THEN** the table receives that column identifier marked descending

#### Scenario: Table requests a sort

- **WHEN** the table reports sorting by a column identifier in descending order
- **THEN** the address is updated with that field name and a descending direction

#### Scenario: Table reports no sort

- **WHEN** the table reports no sort at all
- **THEN** the sort field and direction are removed from the address
- **AND** the table receives the feature's default sort field and direction

#### Scenario: No sort held in the address

- **WHEN** the address holds no sort field
- **THEN** the table receives the feature's default sort field and direction

### Requirement: Changing what is being listed returns to the first page

Any change to the search term, the filters, the sort, or the page size SHALL return
the list to the first page. Moving between pages SHALL NOT.

#### Scenario: Searching from a later page

- **WHEN** the user is on page four and changes the search term
- **THEN** the list returns to page one

#### Scenario: Changing a filter from a later page

- **WHEN** the user is on page four and changes a filter
- **THEN** the list returns to page one

#### Scenario: Paging does not reset

- **WHEN** the user moves from page four to page five
- **THEN** the page is the only list state that changes

### Requirement: A filter-criteria signature identifies when a selection is stale

The binding SHALL expose a signature derived from the search term and filters only,
excluding the page, page size, sort field and sort direction. A change in this
signature SHALL be the signal that an in-progress row selection no longer refers to
a meaningful set.

#### Scenario: Filters change

- **WHEN** the search term or any filter changes
- **THEN** the signature changes

#### Scenario: Paging or sorting

- **WHEN** only the page, page size, sort field or sort direction changes
- **THEN** the signature is unchanged

### Requirement: Bound handlers are referentially stable

The handlers the binding supplies to the table SHALL remain referentially stable
across address changes, so that supplying them does not defeat memoisation in the
table's header, toolbar or rows.

#### Scenario: Address changes

- **WHEN** the address changes because the user paged or searched
- **THEN** the handlers supplied to the table are the same references as before

#### Scenario: Configuration must be stable

- **WHEN** a caller supplies the binding's configuration
- **THEN** the configuration is expected to be a stable reference, and an unstable
  one is understood to forfeit the stability guarantee above

### Requirement: The binding reports whether any filter is active

The binding SHALL expose whether the search term or any filter holds a value. The
page, page size, sort field and sort direction SHALL NOT count. A value that is
empty (an empty string, no value, or an empty list) SHALL NOT count.

#### Scenario: Only paging and sorting

- **WHEN** the address holds only a page, a page size, a sort field or a sort direction
- **THEN** no filter is reported as active

#### Scenario: A search term

- **WHEN** the address holds a non-empty search term
- **THEN** a filter is reported as active

#### Scenario: A date range or a filter field

- **WHEN** the address holds a date range or a value for any declared filter field
- **THEN** a filter is reported as active

#### Scenario: A filter is emptied

- **WHEN** a filter field is present in the address with an empty value
- **THEN** no filter is reported as active for that field

### Requirement: Filters can be cleared without losing sort or page size

The binding SHALL offer one action that removes the search term, the date range and
every declared filter from the address. It SHALL keep the sort field, the sort
direction and the page size, and SHALL return the list to the first page.

#### Scenario: Clearing from a later page

- **WHEN** the user is on page four with a search term and a status filter, and clears filters
- **THEN** the search term, status filter and date range are removed
- **AND** the list is on page one

#### Scenario: Sort and page size are kept

- **WHEN** the user has chosen a sort and a page size, and clears filters
- **THEN** the sort field, sort direction and page size are unchanged

#### Scenario: The action is stable

- **WHEN** the address changes because the user paged or searched
- **THEN** the clear action is the same reference as before
