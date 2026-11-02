## MODIFIED Requirements

### Requirement: Row actions live in a three-dot menu behind confirmation

Each non-base currency row SHALL offer a three-dot (overflow) menu containing exactly
"Set as default" and "Delete". Selecting either SHALL open a confirmation dialog, and
the action SHALL run only when the administrator confirms. The base currency row SHALL
show no overflow menu. Deleting a currency SHALL NOT be blocked by products that exist
in the store, including products created while that currency was the base.

#### Scenario: Setting the base currency

- **WHEN** the administrator chooses "Set as default" on a non-base currency and
  confirms the dialog
- **THEN** that currency becomes the base currency and the previous base is demoted
- **AND** dismissing the dialog makes no change

#### Scenario: Deleting a currency

- **WHEN** the administrator chooses "Delete" on a non-base currency and confirms the
  dialog
- **THEN** the currency is removed and the list refreshes
- **AND** dismissing the dialog makes no change

#### Scenario: Deleting a currency that was previously the base

- **WHEN** the administrator switches the store's base currency, and then chooses
  "Delete" on the currency that was previously the base and confirms the dialog
- **THEN** that currency is removed even though products were created while it was the
  base
- **AND** those products keep their stored amounts, which are read in the store's
  current base currency
