## Context

See `proposal.md` — Why. What matters for the approach:

- The inventory table's only bulk action is Bulk Edit, which navigates to the grid with an enumerated `ids` list. `DataTableSelectionBar` offers "select all N items" whenever `total > shownCount`, and the data table empties `selectedIds` when that mode turns on — which is why the offer produced `ids=` and an empty state. Seven other tables (products, customers, brands, tags, coupons, collections, categories) do consume `isAllMatchingSelected` for bulk delete/trash/restore, so the capability itself has to stay.
- The grid's two-stage editing is driven by a hand-rolled pub-sub store in `cell-selection-context.tsx` (`selection`, `activeCell`, `isDragging`). Activation is pure state; `bulk-edit-cell.tsx`'s effect is what moves DOM focus, and for `<button>` triggers it also synthesises a click.
- `components/ui/input.tsx` does `onFocus={(event) => event.target.select()}` and spreads `{...rest}` **after** it, so a caller-supplied `onFocus` already wins without editing the shared component.
- The Availability column is currently `{ cellKind: 'number', gatedBy: 'track_inventory' }`, and `gatedBy` is what makes `renderControl` substitute `PlaceholderCellContent`.

## Goals / Non-Goals

**Goals:**

- Withdraw the broken offer at its source rather than building machinery to honour it, while leaving the capability intact for the tables that use it correctly.
- Keep the fix for the seeded-caret bug and the fix for the dialog bug inside the bulk-edit feature; the shared `Input`, `Popover` and `Select` primitives stay untouched.
- Make Availability's two modes a property of the *cell*, so selection, type-to-edit, propagation and fill all read the same source of truth for which mode a row is in.

**Non-Goals:**

- No `ids=*` sentinel, no filter forwarding, and no change to how much a save submits. Bulk edit addresses an enumerated `ids` list only.
- No change to how `track_inventory` itself is edited, and no new server-side validation: `in_stock` is already accepted by `BulkUpdateVariantRequest`.
- Not fixing select-on-focus globally. Tabbing through the product/settings forms keeps selecting field contents.

## Decisions

### D1 — The offer is withheld by the caller, not removed from the component

`DataTable` takes `enableSelectAllMatching` (default true) and forwards it to
`DataTableSelectionBar`, which gates the offer on it as well as on
`total > shownCount`. The inventory table passes `false`.

*Alternatives considered.* Deleting the select-all-matching capability outright —
rejected, seven other tables resolve real bulk delete/trash/restore payloads from
`isAllMatchingSelected`. Suppressing it by passing `shownCount={total}` from the
inventory table — rejected as well: it produces the right pixels by lying about
how many rows are shown, so the next reader has to reverse-engineer the intent.

The flag is deliberately a statement about the *caller's bulk action* rather than
a display toggle, which is why it lives on `DataTable` next to `enableRowSelection`
and is documented in terms of what the action can address.

### D2 — A seeded activation is recorded in the store, and the control declines to select

The store's `activeCell` gains a source: `{ field, row, source: 'keyboard' | 'pointer' }`. The keydown handler in `cell-selection-context.tsx` sets `'keyboard'`; every other activation path (`activateCell` from the `<td>`'s click/double-click/Enter) sets `'pointer'`.

The typeable controls (`TextControl`, `NumberControl`, `MoneyControl`, `WeightControl`) pass their own `onFocus` to `Input`, which calls `event.target.select()` only when the activation source is `'pointer'`. Because `Input` spreads `{...rest}` after its own `onFocus`, this overrides rather than composes — no change to `input.tsx`.

*Alternative considered.* Focusing and then calling `setSelectionRange(len, len)` to place the caret explicitly. Rejected: `setSelectionRange` throws `InvalidStateError` on `<input type="number">` in Chrome, which is most of the affected columns. Declining to select leaves the caret at the end of the value on a programmatic focus, which is the behaviour we want anyway.

### D3 — The activating mousedown suppresses the browser's default focus shift

`onCellMouseDown` returns whether that press activated the cell; `BulkEditCell` calls `event.preventDefault()` when it did. That stops the browser focusing the `<td>` (which carries `tabIndex={0}`) after the listeners run, which is what was pulling focus out of the freshly-opened non-modal popover and tripping Radix's `onFocusOutside`. The activation effect already focuses the right control explicitly, so nothing is lost.

This is safe for the other cell kinds: a press that activates a cell always happens while the control still has `pointer-events: none`, so the suppressed default focus was never going to land anywhere useful. Presses on an already-active cell take `onCellMouseDown`'s early return, report `false`, and keep their default behaviour — which is what lets the merchant click into the middle of an active input to place a caret.

*Alternative considered.* Deferring the synthetic `control.click()` into a `requestAnimationFrame` so it lands after the default action. It works, but it makes correctness depend on the relative ordering of React's effect flush, the DOM default action and the next frame — three things this code should not be betting on.

### D4 — Availability becomes a two-mode cell kind, not a gated one

The column drops `gatedBy` and takes a new `cellKind: 'availability'`. A single `AvailabilityControl` reads that row's `track_inventory` and renders either the existing number input bound to `available_quantity` or a Select bound to `in_stock`, with the same In Stock / Out of Stock options as `variant-form/sections/inventory.tsx`.

Three things read a cell's mode and all must agree, so mode is derived from the row's `track_inventory` in each:

1. **Type-to-edit.** `data-bulk-editable-kind` is currently computed per column via `editableKindOf(cellKind)`. For Availability it becomes per row — `'number'` when tracked, `'other'` when not, since a dropdown has no typed value to seed. The keydown handler already reads this attribute off the DOM, so it needs no change.
2. **Propagation.** `usePropagatedChange` gains an optional per-target predicate; the Availability control passes one that keeps only targets whose `track_inventory` matches the edited row's.
3. **Fill.** `handleFillCommit`'s `available_quantity` branch reads the source row's `track_inventory`, then copies `available_quantity` to matching tracked targets or `in_stock` to matching untracked ones.

Skip-on-mismatch (rather than writing both fields, or dragging `track_inventory` along) is the user's decision, and it is also the only option that never changes a value the merchant cannot see in the cell they are filling.

Unchecking Track Inventory deliberately does **not** zero `available_quantity` — a documented divergence from the single-variant form, chosen so a row can round-trip through the untracked state without losing its stock count.

## Risks / Trade-offs

- **Issue 4's root cause is a browser default action that jsdom does not implement**, so a Vitest test cannot reproduce the close-on-open directly. → Test the contract instead: assert that the activating mousedown has its default prevented and a press on an already-active cell does not. The user verifies the visible behaviour in a real browser (project CLAUDE.md forbids driving a preview from here).
- **Withholding the offer leaves a merchant with a filtered list of 4,000 variants no way to bulk-edit all of them.** → Accepted, and the honest position: bulk edit could never do that, and the offer only made it look possible. If it is wanted later it is its own change, with the payload-size question answered properly rather than as a side effect.
- **Two complete-but-unarchived changes (`bulk-edit-grid-fixes`, `bulk-edit-grid-refinements`) hold unsynced deltas for this same capability.** → Checked: they modify *Variant columns presented by the grid*, *Cell selection within a column*, *Two-stage cell editing* and add *Column visibility menu* / *Checkbox click and keyboard toggle*. This change modifies *Gated cells*, *Fill from a selected cell*, *Borderless select-like cells*, *Edits propagate across the selection* and *Selection can extend to all rows matching the current filters*, and adds *Caret placement after a seeding keystroke* — no overlap, so the three sync in any order.

## Correction during implementation

What the plan above did not have quite right, recorded here rather than left to
be rediscovered:

- **D4 understated what reading the row's mode costs.** `data-bulk-editable-kind`
  is computed in `BulkEditCell`, which renders for *every* column — and a hook
  cannot be called conditionally, so `useGateOpen(rowIndex, 'track_inventory')`
  now runs in every cell, not just Availability ones. Each cell therefore holds
  two `useWatch` subscriptions instead of one, and toggling a row's Track
  Inventory re-renders that row's whole set of cells rather than only its gated
  ones. One row's worth of cells is a modest cost and the grid is virtualised, so
  this was accepted rather than worked around; the alternative (threading the
  mode in through column meta) would have put per-row state in a per-column
  structure.
- **`AvailabilityControl`'s first cut watched the whole `variants` array** to
  compare a target row's gate against its own. That re-rendered every Availability
  cell on any edit anywhere in the grid — exactly what the store/selector split in
  `cell-selection-context.tsx` exists to avoid. It now watches only its own row's
  gate and reads other rows' gates imperatively through `getValues` at change
  time, which is when they actually matter.
- **The caret fix turned out to be directly testable after all.** The risk section
  anticipated asserting only indirect contracts, but jsdom does expose
  `selectionStart`/`selectionEnd` on a text input, so the SKU column asserts the
  real caret position. Numeric columns (Weight) still cannot — the selection API
  is not available on `<input type="number">` — so those assert through a spy on
  `HTMLInputElement.prototype.select` instead. Both were confirmed to fail with
  the fix disabled, as was the skip-on-mismatch fill.

**Scope reduced after the first implementation.** `ids=*` — the sentinel, the
filter forwarding, the `VariantService`/`VariantController` changes — and the
dirty-rows-only save were all built, then reverted at the user's direction: bulk
edit should address an enumerated `ids` list only, and the "Select all N items"
offer should be withdrawn from the inventory table instead. Everything above about
D1 now describes that withdrawal. The two Availability fill tests originally
asserted the skip-on-mismatch rule through *which rows were submitted* (only dirty
ones); with the full payload restored they assert it through the submitted
*values* instead, which is a more direct reading of the same requirement. Both were
re-confirmed to fail with the fix disabled.

One supporting piece was added that the design did not name: `lib/bulk-edit-ids.ts`
`savedVariant` in the grid test file — a lookup by id into the captured save
payload, which is how an untracked row's `in_stock` (behind a Radix trigger, with
no readable DOM value) is asserted.
