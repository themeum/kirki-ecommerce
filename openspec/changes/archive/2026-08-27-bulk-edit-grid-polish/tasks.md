## 1. Selection model (`lib/selection.ts`)

- [x] 1.1 Add `committedRows: number[]` to the `Selection` type; update `selectCell` to initialize it to `[]`.
- [x] 1.2 Update `selectionRange(state)` to return the deduped union of `committedRows` and the live `normalizeRange(anchorRow, focusRow)`.
- [x] 1.3 Add `toggleSelection(state, field, row, selectable)`: starts fresh on a different field; otherwise removes `row` if selected (flattening the live range into `committedRows` first if the toggled row was inside it) or, if not selected, folds the live range into `committedRows` and starts a new single-row live range at `row`.
- [x] 1.4 Update `startFill`/`isHandleRow` to use `Math.max(...selectionRange(state))` instead of `Math.max(anchorRow, focusRow)`.
- [x] 1.5 Update `commitFill` to fold `committedRows` into its min/max calculation and reset `committedRows: []` on the result.
- [x] 1.6 Export `toggleSelection` alongside the existing exports.
- [x] 1.7 Add test cases to `tests/lib/selection.test.ts`: toggle-add, toggle-remove (including from the middle of a dragged range), handle position with a non-contiguous selection, and fill-commit collapsing a non-contiguous selection into one range.
- [x] 1.8 Verify: run `npm run typecheck && npm test` from `resources/app/`.

## 2. Click semantics (`contexts/cell-selection-context.tsx`)

- [x] 2.1 Add a `metaOrCtrlKey` parameter to `onCellMouseDown`, alongside the existing `shiftKey`.
- [x] 2.2 Add the Cmd/Ctrl-click branch: call `toggleSelection`, clear `activeCell`, and set `isDragging(true)` so a following drag extends the new chunk.
- [x] 2.3 Add the "click preserves selection" branch: when the clicked cell is already part of the current selection (`isCellSelected`), keep `selection` unchanged and just `setActiveCell({ field, row })` — placed after the Cmd/Ctrl and shift-click branches, before the fallback "start a new selection" branch.
- [x] 2.4 Change the outside-click handler (`handleOutsideMouseDown`) from `setActiveCell(null)` to `clear()`.
- [x] 2.5 Verify: run `npm run typecheck && npm test` from `resources/app/`.

## 3. Grid lines, outline, and cell wiring (`pages/bulk-edit-table/bulk-edit-cell.tsx`)

- [x] 3.1 Pass `event.metaKey || event.ctrlKey` as the new argument to `selection.onCellMouseDown` in the cell's `onMouseDown` handler.
- [x] 3.2 Add `borderRight: 1px solid theme.colors.border.tertiary` to the cell's base style (horizontal grid lines already come from the shared `Table` component's row borders).
- [x] 3.3 Replace the `data-bulk-cell="selected"`/`"fill"` `boxShadow` rules with `outline: 1px solid theme.colors.background.fillBrand` and `outline-offset: -1px`.
- [x] 3.4 Reduce the cell's horizontal padding from `theme.spacing[2]` to `theme.spacing[1]`.
- [x] 3.5 Verify: run `npm run typecheck && npm test` from `resources/app/`.

## 4. Compact and chevron-only cells (`components/fields/bulk-edit-cell-fields.tsx`)

- [x] 4.1 Add a shared descendant-selector style targeting `'& [data-slot="select-trigger"]'` (tight padding, `minWidth: 0`, `minHeight: 0`) and apply it to `ProfileSelectControl`'s wrapper (used for both Tax profile and Shipping profile).
- [x] 4.2 Apply the same override to the `weight_unit` `SelectTrigger` inside `WeightControl`.
- [x] 4.3 Wrap `ShippingBoxControl`'s `<ShippingBoxField compact />` in a `<div>` carrying the same descendant-selector override (no edits to `shipping-box-field.tsx`).
- [x] 4.4 Replace `UnitPriceControl`'s `buttonProps={{ type: 'invisible' }}` with `buttonProps={{ variant: 'ghost', cssOverride: {...} }}` (full-size, borderless, transparent background, keeping its existing chevron icon).
- [x] 4.5 Add a scoped override (`minHeight: 0`, trimmed padding) on the `Input` used by `MoneyControl`/`TextControl`/`NumberControl`/`WeightControl`'s weight input, so it no longer overflows the fixed 32px row now that the cell itself carries the tighter padding.
- [x] 4.6 Verify: run `npm run typecheck && npm test` from `resources/app/`.

## 5. Interaction test coverage (`tests/pages/bulk-edit-table.test.tsx`)

- [x] 5.1 Add a test: Cmd/Ctrl-clicking two non-adjacent rows selects both without selecting the rows between them.
- [x] 5.2 Add a test: editing a cell within a Cmd/Ctrl-click selection fans the value out to every selected row.
- [x] 5.3 Add a test: clicking a cell already inside an existing selection preserves that selection (does not collapse it to the clicked cell).
- [x] 5.4 Add a test: clicking a cell outside the current selection replaces it.
- [x] 5.5 Verify: run `npm run typecheck && npm test` from `resources/app/`.

## 6. Final verification

- [x] 6.1 Run `npm run typecheck` in `resources/app/` — clean.
- [x] 6.2 Run `npm run lint` in `resources/app/` — clean (2 pre-existing import-order errors remain in `features/products/.../variants-table/{variant-group,variants-table}.tsx`, untouched by this change — same known debt noted in the prior `bulk-edit-sheet-grid` change).
- [x] 6.3 Run `npx vitest run` in `resources/app/` — full suite passes: 752/752 tests, 102/102 files, no regressions.
- [x] 6.4 Manual check — performed live against the local WordPress dev environment at the user's explicit request (overriding CLAUDE.md §0 for this pass). Found and fixed three real-browser-only defects beyond the original task list; see Group 7. After fixes: grid lines visible, every row exactly 32px, selecting/filling causes no layout shift, Cmd/Ctrl-click and click-to-preserve-selection behave as specified (including real DOM focus + fan-out typing), select-like cells render borderless with a chevron, horizontal scroll/pinned column/custom scrollbar all work, and numeric columns are right-aligned per the reference screenshot.

## 7. Real-browser fixes found during manual verification

These were invisible to jsdom (no real layout engine / CSS cascade) and only surfaced once actually loaded in a browser.

- [x] 7.1 Cell padding: `Table`'s own `'& th, & td'` base rule out-specificities a per-`<td>` `cssOverride` (both use the same scoped-doubling technique, but the ancestor-attached version compounds higher). Moved the padding override to `bulk-edit-table.tsx`'s own `styles.table` (`'& td': { padding: '0 spacing[1]' }`), which merges into the *same* generated class instead of fighting it. Removed the now-dead padding declaration from `bulk-edit-cell.tsx`.
- [x] 7.2 `ReadonlyMoneyControl`/`ReadonlyNumberControl` (Profit, Margin, Committed) never received the `compactInput` `cssOverride` applied to the other Input-based controls in task 4.5 — an oversight, not a new decision. Fixed; these were the last cells forcing rows to 36px instead of 32px.
- [x] 7.3 `Table`'s own wrapper div (`data-slot="table-container"`) has its own `overflow-x: auto`, silently becoming the real horizontally-scrolling element instead of our outer `#bulk-edit-scroll-container` — so the custom `HorizontalScrollbar` (which reads/writes the outer container) never saw any overflow and never rendered. Fixed by neutralizing the inner div's overflow via a scoped descendant override on the outer container (`'& [data-slot="table-container"]': { overflow: 'visible' }`), letting the real overflow bubble up to the container that actually owns the virtualizer and the scrollbar.
- [x] 7.4 `HorizontalScrollbar`'s `syncThumb` required its own `track` ref to already exist before it would set `thumb.visible: true` — but the track element only renders once `thumb.visible` is already true (self-deadlock, independent of 7.3). Fixed with a callback ref: becoming visible with placeholder geometry mounts the track, whose ref callback re-invokes `syncThumb` once it actually exists to compute the real thumb size/position.
- [x] 7.5 Cell activation (`activateCell`/`setActiveCell`) only ever flipped React state — nothing called `.focus()` on the actual control, so unlocking `pointer-events` was not enough to type: DOM focus stayed on the `<td>` (which only handles Enter/Escape), so keystrokes went nowhere in a real browser (jsdom tests never caught this since they bypass focus entirely via `fireEvent.change`). Fixed in `bulk-edit-cell.tsx` with an effect that focuses the first `input`/`button` inside the cell when it becomes active. This was blocking the very "click preserves selection, then type to fan out" flow this change added.
- [x] 7.6 Applied `alignment: 'right'` to all money/number-kind columns (Price, Sale Price, Cost of Goods, Profit, Margin, Availability, Committed, Low Stock Threshold, Limit) per the reference screenshot, reusing the existing `meta.alignment` mechanism already wired to both header and cell.
- [x] 7.7 Verify: `npm run typecheck`, `npm run lint`, `npx vitest run` — all clean, 752/752 tests, no regressions.
