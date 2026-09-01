## Context

See proposal.md - Why. The grid's selection model today (`resources/app/features/bulk-edit/lib/selection.ts`) is a single contiguous range per column: `{ field, anchorRow, focusRow, mode, fillOriginRow, fillFocusRow }`. Cell visuals come from `boxShadow` on `data-bulk-cell="selected"|"fill"`. Cells inherit padding from `components/ui/input.tsx`/`select.tsx`'s shared `invisible` variant, which is also used by four other, unrelated features (`inventory-table/columns.tsx`, `select-input.tsx`, `unit-amount-field.tsx`, `weight-field.tsx`).

## Goals / Non-Goals

**Goals:**
- Non-contiguous (Cmd/Ctrl-click) selection within one column, with true toggle semantics.
- Zero layout shift when the selection/fill indicator appears or changes shape.
- A visibly denser, bordered grid, with select-like cells reading as plain fields.

**Non-Goals:**
- Multi-column / 2D selection (explicitly scoped out — same-column only, per the existing model).
- Changing the shared `Input`/`Select` components' `invisible` variant — all styling changes are scoped to `features/bulk-edit/` via `cssOverride` and descendant-selector overrides, so the other four consumers of that variant are untouched.
- Cmd/Ctrl+drag as a fully independent range-add gesture is not separately implemented, but falls out for free (see Decisions).

## Decisions

**Selection state gains `committedRows: number[]`, not a full range-list rewrite.** The existing `anchorRow`/`focusRow` pair keeps modeling the "live" gesture (the range currently being dragged or shift-extended); `committedRows` holds individual row indices frozen by earlier Cmd/Ctrl-clicks in the same column. `selectionRange()` becomes the deduped union of the two. This is the smallest change that supports arbitrary toggle-on/toggle-off (including removing a row from the middle of a dragged range, which requires flattening that range into individual `committedRows` entries first) while keeping every existing function (`extendSelection`, `startSelection`, `isCellSelected`) working unchanged, since they already operate on `selectionRange()`'s output or spread the previous state.

Alternative considered: model selection as a list of `{from, to}` range objects instead of flat row indices. Rejected — toggling a row out of the middle of a range would require splitting a range into two, and the fill-collapse behavior (see below) discards the distinction between ranges anyway, so the extra structure buys nothing here.

**Cmd/Ctrl+drag extends the new chunk for free.** `onCellMouseDown`'s Cmd/Ctrl branch folds the current live range into `committedRows` and starts a new single-row live range at the clicked cell, then still sets `isDragging(true)`. The existing drag-extend path (`onCellMouseEnter` → `extendSelection`) already operates on that live range regardless of how it started, so dragging after a Cmd/Ctrl-click naturally extends the newly forked chunk without new drag-handling code.

**Fill-drag collapses a non-contiguous selection into one contiguous range.** `startFill`/`isHandleRow` use `Math.max(...selectionRange(state))` so the handle renders at the true bottom-most selected row regardless of gaps above it. `commitFill` computes its min/max over `committedRows` as well as the live/fill rows and resets `committedRows: []` — so after any fill-drag, the selection becomes one clean range from the topmost previously-selected row through the drag's end point. This was the explicit, simpler alternative chosen over preserving the original gaps post-fill (which would require the highlighted selection and the actually-overwritten cells to visually diverge after the drag).

**"Click preserves selection" replaces "click the sole-selected cell activates it."** `onCellMouseDown` already special-cased re-clicking a single already-selected cell (to activate it without collapsing). This change generalizes that check from "is this the exact sole selected cell" to "is this row anywhere in the current selection" (`isCellSelected`), which is what makes clicking into an existing multi-row or non-contiguous selection arm it for a fanned-out edit instead of collapsing to one cell. The outside-click handler changes from clearing only `activeCell` to calling the existing `clear()` (which also clears `selection`), so a full deselect now genuinely requires clicking outside the grid — closing a previously-loose edge where the highlight could outlive an outside click.

**Grid lines reuse the shared `Table` component's existing row borders; only vertical lines are new.** `components/ui/table.tsx`'s base styles already put a `border-bottom` on every `tbody tr`. Adding `border-right` to `BulkEditCell`'s own style is enough for a full grid — no need to touch the shared `Table` component or double up on horizontal borders. `bulk-edit-table.tsx` already sets `borderCollapse: 'separate'`, so the new per-cell border doesn't collapse into neighboring cells.

**Selection/fill indicator moves from `boxShadow` to `outline` with a negative `outline-offset`.** `outline` never participates in box-model layout (unlike `border`, and unlike a `boxShadow` that would otherwise double up visually with the new grid-line border at shared edges). `outline-offset: -1px` keeps it drawn inside the cell instead of bleeding over the neighbor's grid line.

**All compact/chevron/height-fix styling stays inside `features/bulk-edit/`, via `cssOverride` and `data-slot` descendant selectors, not edits to `components/ui/input.tsx` or `select.tsx`.** `SelectTrigger` already stamps `data-slot="select-trigger"` on itself and already renders a chevron unconditionally under its `invisible` variant, so bulk-edit's own wrapper `<div>`s can target `'& [data-slot="select-trigger"]'` to trim padding/min-width without editing the shared component — this includes `ShippingBoxField`'s internal trigger, reached the same way despite living in a different file. The `Input` 36px `minHeight` overflow bug is fixed the same way: a scoped override in bulk-edit's own control wrapper, not a change to `Input`'s `invisible` variant (which four other features also use). `UnitPriceControl`'s dialog-trigger button already renders its own chevron and takes a `cssOverride` via `buttonProps` — no new affordance code needed there, just replacing its current dead `buttonProps={{ type: 'invisible' }}` (not a real `Button` variant) with a real `cssOverride`.

## Risks / Trade-offs

- **Fill discarding pre-fill gaps** → Mitigation: this is the deliberately chosen, simpler behavior (see Decisions); documented in the spec so it's an intentional contract, not an accidental side effect.
- **Cmd/Ctrl+drag is a side effect of the toggle implementation, not a designed/tested gesture** → Mitigation: it degrades gracefully (behaves like a plain new-range drag, just unioned with prior committed rows), and is not called out as a required scenario in the spec, so no dedicated test is required — but it isn't blocked either.
