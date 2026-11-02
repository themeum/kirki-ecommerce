## Why

Four defects surfaced while using the bulk-edit grid against a real store. The
inventory list's "Select all N items" offer is dead on arrival — it navigates to
the grid with an empty `ids=` and the merchant lands on the "No variants
selected" empty state; rather than teach bulk edit to address a whole matching
set, the offer is withdrawn, because bulk edit only ever addresses an enumerated
list of rows. Typing a second character into a cell replaces the first
instead of appending. The Base price per unit dialog opens and closes in the same
click, so it takes three clicks to reach. And the Availability column shows an
inert `_` placeholder for every variant that does not track inventory, giving the
merchant no way to set those rows in or out of stock — even though the
single-variant form offers exactly that dropdown and the bulk payload already
carries the field.

## What Changes

- **The select-all-matching offer is withheld from the inventory table.** Bulk
  edit opens the grid on an enumerated `ids` list and has no way to address rows
  it was never given, so the offer promised a set its only bulk action cannot
  carry. The shared data table keeps the capability for the tables whose bulk
  delete/trash/restore actions genuinely use it; the inventory table opts out.
  Selecting rows there continues to navigate with `ids=1,2,3`.
- **Caret lands at the end of a seeded keystroke.** Type-to-edit seeds a cell with
  the typed character and then activates it; activation focuses the control, and
  the shared `Input`'s `onFocus` selects its whole value — so the seeded character
  is selected and the next keystroke replaces it. Typing SHALL append from the
  second character on. Double-click and Enter activation SHALL keep selecting the
  existing value for overwrite.
- **The unit-price dialog stays open on the click that opened it.** Activating the
  cell synthetically clicks the trigger and the dialog opens, then the browser's
  default mousedown action moves focus to the cell and the non-modal dialog
  dismisses itself. Activation SHALL NOT surrender focus to the cell.
- **Availability is editable on untracked rows.** When a row does not track
  inventory, its Availability cell SHALL present an In Stock / Out of Stock
  dropdown bound to the variant's stock flag, matching the single-variant form,
  instead of a placeholder. Unchecking Track Inventory SHALL leave the row's
  quantity untouched. Filling or propagating within the Availability column SHALL
  copy whichever value matches the source row's own tracking state and SHALL skip
  rows in the other state rather than writing a value their cell does not show.

## Capabilities

### New Capabilities

<!-- None. -->

### Modified Capabilities

- `bulk-edit-grid`: Availability stops being a strictly gated placeholder column and
  becomes two-moded (quantity when tracked, stock status when not); fill within a
  mixed column gains skip-on-mismatch semantics; select-like cells gain an explicit
  requirement that an opened control stays open; a new requirement covers where the
  caret sits after a seeding keystroke.
- `bulk-edit-form`: the propagation rule for gated rows is rewritten now that an
  untracked Availability row has a real control rather than a placeholder.
- `data-table`: the select-all-matching offer becomes opt-out, so a table whose
  bulk action can only address an enumerated set does not present it.

## Impact

- **Frontend** — `resources/app/components/data-table/data-table.tsx` and
  `data-table-selection-bar.tsx` (the opt-out),
  `resources/app/features/inventory/components/inventory-table/inventory-table.tsx`,
  `resources/app/features/bulk-edit/pages/bulk-edit.tsx` (`handleFillCommit`),
  `resources/app/features/bulk-edit/lib/columns.tsx`,
  `resources/app/features/bulk-edit/lib/editable-kind.ts`,
  `resources/app/features/bulk-edit/contexts/cell-selection-context.tsx`,
  `resources/app/features/bulk-edit/pages/bulk-edit-table/bulk-edit-cell.tsx`,
  `resources/app/features/bulk-edit/components/fields/bulk-edit-cell-fields.tsx`.
- **Backend** — none. `in_stock` is already accepted by `BulkUpdateVariantRequest`,
  and `GET /variants/bulk/{ids}` keeps taking an enumerated list.
- **Not touched** — `resources/app/components/ui/input.tsx` stays as is; changing its
  select-on-focus would alter every form in the admin.
- **Depends on** two complete-but-unarchived changes, `bulk-edit-grid-fixes` and
  `bulk-edit-grid-refinements`, whose deltas are not yet synced into
  `openspec/specs/`. This change's deltas are written against requirements those two
  do not touch, so the three can be synced in any order.
