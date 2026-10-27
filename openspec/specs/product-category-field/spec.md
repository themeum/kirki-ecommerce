# product-category-field Specification

## Purpose

The product form's category picker: assigning a product to categories from a nested catalogue inside the shared token box, with independent checkboxes, full-path chips and creation that happens without leaving the field.

## Requirements

### Requirement: Category assignment uses the shared token box

The product form's category field SHALL be built on the shared multi-select, presenting the same bordered token box, wrapping chips, checkbox option rows and pinned create row as the tags and collections fields beside it. It MUST NOT introduce a second picker shape, an always-open list, or a card of its own.

The option list SHALL have a fixed maximum height and scroll within it, so a deep catalogue cannot push the rest of the panel out of reach.

#### Scenario: The field matches its neighbours

- **WHEN** a merchant looks at the category, tag and collection fields together
- **THEN** all three present the same box, the same chip treatment and the same row treatment

#### Scenario: A long catalogue

- **WHEN** the category list is longer than the panel's maximum height
- **THEN** the list scrolls inside the panel and the panel does not grow past that height

### Requirement: The list renders the tree, and search flattens it

While the input is empty, option rows SHALL be ordered depth-first and indented in proportion to their depth, so the parent/child structure is legible. The indent MUST move the whole row, its checkbox included, so the column of checkboxes steps inward with the names and traces the tree. An indent applied to the name alone leaves every checkbox in one column, which reads as a flat list wearing a ragged left margin.

While a query is present, rows MUST instead render unindented, each prefixed with its full ancestor path, so a nested match reads in context without its ancestors having to be on screen.

Search MUST preserve ancestors of a match: an ancestor whose own name does not match MUST still be reachable in the results if one of its descendants matches.

#### Scenario: Browsing the tree

- **WHEN** a merchant opens the field without typing
- **THEN** root categories are listed with their children indented beneath them in depth-first order

#### Scenario: A child's checkbox sits inboard of its parent's

- **WHEN** a merchant looks at a child row beneath its parent
- **THEN** the child's checkbox is indented from the parent's by the same step as its name

#### Scenario: Searching

- **WHEN** a merchant types a query
- **THEN** matching rows render unindented, each showing its full ancestor path ahead of its own name
- **AND** every checkbox returns to one column

#### Scenario: A nested match

- **WHEN** a query matches only a deeply nested category
- **THEN** that category appears in the results with its ancestors readable in its path
### Requirement: Each checkbox stands alone

Toggling a category SHALL affect only that category. Checking a parent MUST NOT select its descendants, and unchecking a child MUST NOT remove its ancestors. A chip therefore always means a merchant put that exact category on the product.

Categories selected under a previous cascading behaviour MUST continue to load and render; the change is forward only.

#### Scenario: Checking a parent

- **WHEN** a merchant checks a category that has children
- **THEN** only that category joins the selection and its children stay unchecked

#### Scenario: Unchecking a child

- **WHEN** a merchant unchecks a category whose parent is also selected
- **THEN** only that category leaves the selection and its parent stays selected

#### Scenario: A product saved before the change

- **WHEN** a product whose categories were assigned by cascade is opened
- **THEN** every category it holds renders as part of the selection

### Requirement: Chips show the full path, capped at one

A selected category SHALL render as a chip showing its full path from the root, each level separated by a chevron, with the ancestor levels subdued and the category's own name in the normal text colour. A root category shows its bare name.

The field SHALL show at most one chip; any further selections collapse behind a control reading how many are hidden, which expands to the full set and offers a control to collapse back.

A path wider than the box MUST be truncated with an ellipsis rather than wrapping or widening the box, and the full path MUST remain available to the merchant on hover.

#### Scenario: A nested category

- **WHEN** a merchant selects a category two levels deep
- **THEN** its chip reads the full path with chevrons, ancestors subdued and the leaf in normal colour

#### Scenario: A root category

- **WHEN** a merchant selects a root category
- **THEN** its chip shows that name alone with no chevron

#### Scenario: Several categories

- **WHEN** a merchant has selected more than one category
- **THEN** the box shows the first chip and a control reading the number hidden
- **WHEN** the merchant activates that control
- **THEN** every chip renders, with a control to collapse back to one

#### Scenario: A path too long for the box

- **WHEN** a category's full path is wider than the box
- **THEN** the chip truncates with an ellipsis and the full path is available on hover

### Requirement: Categories are created inside the panel

The field SHALL offer creation from its pinned create row: labelled with the typed text when a query matches nothing exactly, and with a standing label when the input is empty. Activating it MUST replace the option list, inside the same panel, with a form asking for the category's name — prefilled with the typed text where there was one — and its parent, alongside controls to confirm or cancel.

Confirming MUST create the category, add it to the selection, and return the panel to its option list with the new category present. Cancelling MUST return to the list without creating anything. A rejected create MUST leave the form on screen with what was typed and show the error.

The field MUST NOT offer a select-all row, and MUST NOT send the merchant to a separate page or dialog to create a category.

#### Scenario: Creating from a query

- **WHEN** a merchant types a name that matches no category and activates the create row
- **THEN** the panel shows a name field prefilled with that text and a parent selector

#### Scenario: Creating without a query

- **WHEN** a merchant activates the create row with the input empty
- **THEN** the panel shows an empty name field and a parent selector

#### Scenario: Confirming

- **WHEN** a merchant confirms the form
- **THEN** the category is created, joins the selection as a chip, and the panel returns to the option list with it listed

#### Scenario: Cancelling

- **WHEN** a merchant cancels the form
- **THEN** the panel returns to the option list and nothing was created

#### Scenario: A name that is already taken

- **WHEN** the create is rejected
- **THEN** the form stays on screen with the typed name and shows the error

#### Scenario: No select-all

- **WHEN** a merchant opens the field
- **THEN** no row offers to select every category at once

### Requirement: Category assignment is not category management

The field SHALL assign existing categories and create new ones. It MUST NOT offer renaming, deleting, reparenting or reordering; those belong to the categories page. Creating from here MUST produce the same kind of record the categories page produces, so a category is never second-class for having been made from a product.

#### Scenario: No management controls

- **WHEN** a merchant opens the field
- **THEN** no row offers to edit, delete or move a category

#### Scenario: A category created from the product form

- **WHEN** a merchant creates a category here and later opens the categories page
- **THEN** that category is listed there and behaves like any other
