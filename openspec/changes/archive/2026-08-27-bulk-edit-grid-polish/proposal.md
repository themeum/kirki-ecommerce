## Why

The bulk-edit grid (`resources/app/features/bulk-edit/`) was rebuilt as a virtualized spreadsheet in `bulk-edit-sheet-grid`, but it still reads as a plain data table: no grid lines, a selection highlight that will double up with borders once added, selection limited to one contiguous range per column, generous padding, and select-like cells (Tax profile, Shipping profile, Dimension, Base price per unit) rendered as bordered inputs instead of borderless "click-to-edit" cells. This change closes that gap so the grid feels and behaves like a real spreadsheet.

## What Changes

- Add visible grid lines (borders) to every cell.
- Switch the selection/fill highlight from `boxShadow` to `outline` so it never shifts cell layout.
- Add Cmd/Ctrl-click to build a non-contiguous selection of individual rows within a single column, with true toggle semantics (re-clicking a selected row deselects it, including from the middle of an existing range).
- **BREAKING** (selection behavior): clicking a cell that is already part of the current selection now preserves the whole selection and arms it for fan-out editing, instead of collapsing the selection down to just that cell. Deselection now only happens by clicking a cell outside the current selection, or by clicking outside the table.
- Tighten cell padding and remove doubled-up control padding for a denser layout; fix an existing bug where `Input`'s 36px minimum height overflows the grid's fixed 32px row.
- Render select-like cells (Tax profile, Shipping profile, Dimension, Weight unit, Base price per unit) borderless with a right-aligned chevron, matching the two-stage select-then-activate model already used by other cells.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `bulk-edit-grid`: cell selection gains non-contiguous (Cmd/Ctrl-click) selection within a column with toggle semantics; re-clicking a selected cell no longer collapses the selection; the fill handle's position and collapse-on-commit behavior account for non-contiguous selections; cells gain visible grid-line borders and a layout-stable (`outline`-based) selection indicator; select-like cells render borderless with a chevron affordance.

## Impact

- `resources/app/features/bulk-edit/lib/selection.ts` — selection state gains `committedRows`, plus a new `toggleSelection` function; `commitFill`/`startFill`/`isHandleRow` account for non-contiguous rows.
- `resources/app/features/bulk-edit/contexts/cell-selection-context.tsx` — `onCellMouseDown` gains a Cmd/Ctrl-click branch and a "click preserves selection" branch; outside-click now fully deselects.
- `resources/app/features/bulk-edit/pages/bulk-edit-table/bulk-edit-cell.tsx` — grid-line borders, outline-based selection indicator, tighter padding, modifier-key wiring.
- `resources/app/features/bulk-edit/components/fields/bulk-edit-cell-fields.tsx` — borderless/chevron treatment and compact padding for select-like and text/number/money controls, scoped entirely to this feature (no changes to `components/ui/input.tsx` or `components/ui/select.tsx`, which are used elsewhere).
- Test coverage: `resources/app/features/bulk-edit/tests/lib/selection.test.ts` and `resources/app/features/bulk-edit/tests/pages/bulk-edit-table.test.tsx`.
