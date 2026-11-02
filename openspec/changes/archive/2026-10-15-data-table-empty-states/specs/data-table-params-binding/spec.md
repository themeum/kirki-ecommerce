## ADDED Requirements

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
