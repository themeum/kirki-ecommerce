## ADDED Requirements

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
