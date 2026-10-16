# list-record-presence Specification

## Purpose

Lets a list page tell an empty table from a search that matched nothing. The list endpoint reports if the
table holds any record at all, independent of the search and filters, and the page uses that report to
choose between its first-use empty state and its filtered table.

## Requirements

### Requirement: A paginated list response states whether the table holds any record

A paginated response from the product, order, inventory, collection, category, tag, brand, customer and
coupon list endpoints SHALL include a boolean `has_records` in its `data` object. It SHALL be `true` when
the underlying table holds at least one record under the endpoint's presence rule, and `false` otherwise.
The key SHALL sit beside the existing pagination keys, which SHALL NOT change.

#### Scenario: Table has records

- **WHEN** a client requests a page of a listed resource and the table holds at least one record
- **THEN** `has_records` is `true`

#### Scenario: Table is empty

- **WHEN** a client requests a page of a listed resource and the table holds no record
- **THEN** `has_records` is `false`
- **AND** `total` is 0 and `results` is empty

#### Scenario: Existing keys are unchanged

- **WHEN** a client reads a paginated list response
- **THEN** `results`, `total`, `count`, `per_page`, `current_page`, `last_page`, `from`, `to` and
  `has_more_pages` keep their meaning and values

### Requirement: Record presence ignores the request's search and filters

`has_records` SHALL describe the table, not the request. Search text, status, date range, taxonomy and every
other filter in the request SHALL NOT change its value.

#### Scenario: Search matches nothing

- **WHEN** the table holds records and a client searches for text that matches none
- **THEN** `total` is 0
- **AND** `has_records` is `true`

#### Scenario: Filter matches nothing

- **WHEN** the table holds records and a client applies a filter that matches none
- **THEN** `has_records` is `true`

#### Scenario: Page past the last page

- **WHEN** the table holds records and a client requests a page beyond the last page
- **THEN** `results` is empty
- **AND** `has_records` is `true`

### Requirement: Record presence follows a per-resource rule

Each listed resource SHALL define which records count towards `has_records`. By default every row of the
resource counts. A resource MAY define a narrower rule, such as ignoring trashed records, without any
change to the response shape or to other resources.

#### Scenario: Default rule

- **WHEN** a listed resource has no narrower rule
- **THEN** `has_records` is `true` if the table holds any row

#### Scenario: Narrower rule

- **WHEN** a resource defines a rule that ignores some records and every record in the table is ignored
- **THEN** `has_records` is `false`

### Requirement: Record presence costs no extra lookup when the page has rows

When the returned page holds at least one result, the endpoint SHALL report `has_records` as `true` without
a separate lookup of the table. A separate lookup MAY run only when the page is empty.

#### Scenario: Page has rows

- **WHEN** a request returns one or more results
- **THEN** `has_records` is `true`
- **AND** no additional table lookup runs to produce it

#### Scenario: Page is empty

- **WHEN** a request returns no results
- **THEN** the endpoint checks the table's record presence to set `has_records`

### Requirement: List pages choose their empty state from the reported presence

Each of the nine list pages SHALL present its first-use empty state only when the response reports
`has_records` as `false`. Until a response is available the page SHALL NOT present the first-use empty state.
A response with `has_records` as `true` and no results SHALL show the table with its filtered-empty message.

#### Scenario: Empty table

- **WHEN** a list page receives a response with `has_records` as `false`
- **THEN** the page shows its first-use empty state with its create action

#### Scenario: Search matched nothing

- **WHEN** a list page receives a response with `total` 0 and `has_records` as `true`
- **THEN** the page shows the table with the filtered-empty message
- **AND** the first-use empty state is not shown

#### Scenario: Filters cleared on a table with records

- **WHEN** the user clears all filters on a page whose table holds records
- **THEN** the table shows its rows
- **AND** the first-use empty state is not shown at any point

#### Scenario: Request has not completed

- **WHEN** a list page has no response yet, or its request failed
- **THEN** the first-use empty state is not shown
