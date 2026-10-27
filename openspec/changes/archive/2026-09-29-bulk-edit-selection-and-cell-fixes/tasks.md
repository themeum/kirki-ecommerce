## 1. Withhold the select-all-matching offer from the inventory table

- [x] 1.1 Add `enableSelectAllMatching` (default true) to `DataTable` and forward it to `DataTableSelectionBar`, which gates the offer on it alongside the existing `total > shownCount` check.
- [x] 1.2 Pass `enableSelectAllMatching={false}` from the inventory table, documenting that its only bulk action addresses an enumerated `ids` list. Leave the seven tables that resolve real bulk delete/trash/restore payloads from `isAllMatchingSelected` untouched.
- [x] 1.3 Confirm bulk edit still navigates with `ids=1,2,3` and that no `ids=*` sentinel, filter forwarding, or partial-save behaviour remains anywhere in the change.
- [x] 1.4 Verify: `npm run typecheck && npm test` from `resources/app/`.

## 2. Caret lands after a seeded keystroke

- [x] 2.1 Add an activation source to the selection store's `activeCell` (`'keyboard'` from the type-to-edit keydown handler, `'pointer'` from every `activateCell` call), and expose it to cells.
- [x] 2.2 Have `TextControl`, `NumberControl`, `MoneyControl` and `WeightControl` pass their own `onFocus` to `Input` that selects the value only for a `'pointer'` activation. Do not edit `components/ui/input.tsx`, and do not use `setSelectionRange` — it throws on `<input type="number">`.
- [x] 2.3 Add tests: a seeded SKU cell leaves the caret collapsed at the end; Enter activation still presents the value selected; the same holds for the numeric Weight cell, asserted through a spy on `select()` since jsdom exposes no selection API on a number input.
- [x] 2.4 Verify: `npm run typecheck && npm test` from `resources/app/`.

## 3. The unit-price dialog stays open

- [x] 3.1 Have `onCellMouseDown` report whether that press activated the cell.
- [x] 3.2 In `BulkEditCell`, call `event.preventDefault()` on an activating mousedown so the browser does not focus the `<td>` and pull focus out of the just-opened non-modal popover. Leave presses on an already-active cell untouched, so clicking into an active input still places a caret.
- [x] 3.3 Add a test for the contract: an activating mousedown has its default prevented; a mousedown on an already-active cell does not. (The browser default action itself is not reproducible in jsdom — note that in the test.)
- [x] 3.4 Verify: `npm run typecheck && npm test` from `resources/app/`.

## 4. Availability is editable on untracked rows

- [x] 4.1 Add an `availability` cell kind, drop `gatedBy` from the `available_quantity` column, and add an `AvailabilityControl` that renders the quantity input when the row tracks inventory and an In Stock / Out of Stock select bound to `in_stock` when it does not — same options as `variant-form/sections/inventory.tsx`.
- [x] 4.2 Make `data-bulk-editable-kind` row-derived for this column: `'number'` when tracked, `'other'` when not, so type-to-edit does not try to seed a dropdown.
- [x] 4.3 Give `usePropagatedChange` an optional per-target predicate and have the Availability control keep only targets whose `track_inventory` matches the edited row's.
- [x] 4.4 Extend `handleFillCommit`'s `available_quantity` branch: copy `available_quantity` to tracked targets when the source row is tracked, `in_stock` to untracked targets when it is not, and skip the rest. Never copy `track_inventory` itself.
- [x] 4.5 Confirm unchecking Track Inventory leaves `available_quantity` untouched (a deliberate divergence from the single-variant form) and that `in_stock` already round-trips through `buildBulkEditPayload` and `BulkUpdateVariantRequest` unchanged.
- [x] 4.6 Add tests for the mixed-column cases: fill from a tracked row skips untracked rows and vice versa, asserted against the submitted payload; propagation within a mixed selection only touches matching rows.
- [x] 4.7 Verify: `npm run typecheck && npm test` from `resources/app/`.

## 5. Close out

- [x] 5.1 Run the full check: `npm run typecheck`, lint and `npm test` from `resources/app/`, plus `composer phpcs:wporg`. Do not open a browser preview — per project CLAUDE.md, visual confirmation is the user's to do.
- [x] 5.2 Run `openspec validate bulk-edit-selection-and-cell-fixes --strict` and record any premise that turned out wrong as a "Correction during implementation" note in `design.md`.
- [x] 5.3 Hand the behaviours back to the user to confirm in a real browser: no "Select all N items" on the inventory table, second keystroke in Weight, second click on Base price per unit, and the Availability dropdown on an untracked row.
