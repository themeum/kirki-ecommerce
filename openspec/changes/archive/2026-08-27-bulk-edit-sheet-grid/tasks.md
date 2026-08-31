## 1. Foundations

- [x] 1.1 Add `@tanstack/react-virtual` to `resources/app/package.json` and install
- [x] 1.2 Extend the `ColumnMeta` augmentation in `resources/app/global.d.ts` with `cellKind` and `gatedBy` alongside the existing `alignment` and `cssOverride`
- [x] 1.3 Delete the superseded implementation: `contexts/bulk-edit-form-context.tsx`, `hooks/use-bulk-edit-row.ts`, `hooks/use-bulk-edit-list.ts`, `lib/fill-down.ts`, `lib/utils.tsx`, `pages/bulk-edit-table/single-row.tsx`, `pages/bulk-edit-table/bulk-edit-table.tsx`, `pages/bulk-edit-table/bulk-edit-table-styles.ts`, and both files under `tests/`
- [x] 1.4 Update `features/bulk-edit/index.ts` to stop exporting the removed provider and hook, and confirm nothing outside the feature breaks (only `features/inventory/pages/inventory.tsx` imports from here, for `useUpdateBulkVariantsMutation`)

## 2. Form schema and payload

- [x] 2.1 Add `schemas/forms/bulk-edit-form.ts`: a Zod schema over `{ variants: [...] }` reusing the per-variant rules from `features/products/schemas/forms/product-form.ts`, including the sale-price ≤ regular-price cross-field rule
- [x] 2.2 Add `lib/payload.ts` building the `PUT /variants/bulk` body from form values — all rows, money in major units, with `*_money_object`, `display_*`, `committed_quantity`, `profit`, `margin`, and timestamps stripped
- [x] 2.3 Add `tests/lib/payload.test.ts` (node): discarded keys are absent, money stays in major units, `id` is present on every row, `media` is emitted as a numeric id

## 3. Selection engine

- [x] 3.1 Add `lib/selection.ts`: the `{ field, anchorRow, focusRow, mode }` state, its transitions (`selectCell`, `extendTo`, `startFill`, `commitFill`, `clear`), and range derivation from anchor/focus
- [x] 3.2 Add `tests/lib/selection.test.ts` (node): range from anchor+focus, reversed (upward) ranges normalize, single-cell range, switching column resets the selection, read-only fields never start a selection, mode transitions between select and fill
- [x] 3.3 Add `hooks/use-cell-selection.ts` — a context provider holding selection state, deliberately separate from the form context so a mousemove does not re-render form-bound cells; exposes `onCellMouseDown`, `onCellMouseEnter`, `onGrabberMouseDown`, `activate`, `deactivate`
- [x] 3.4 Add the active-cell concept (at most one) with activation on second click / Enter / double-click and deactivation on Escape or outside interaction

## 4. Column registry

- [x] 4.1 Add `lib/columns.tsx` — a single `ColumnDef[]` registry for all 21 columns in spec order, each with explicit `size`, `meta.cellKind`, `meta.gatedBy`, and `meta.alignment`; the Variants column pinned left and non-selectable
- [x] 4.2 Wire read-only derived cells (Profit, Margin) to `calculateProfit` from `utils/common.ts`, reading current row values so they react to edits
- [x] 4.3 Wire Dimension to `ShippingBoxField` (`compact`), Base price per unit to `BaseUnitDialog`, and Weight to a single amount+unit cell
- [x] 4.4 Hoist `useTaxProfilesQuery`, `useShippingProfilesQuery`, and `useShippingBoxesQuery` (`{ limit: -1 }`) to table level and pass options down — replacing the empty Tax Profile list and the hardcoded Shipping Profile ids 1-4
- [x] 4.5 Make the SKU cell editable

## 5. Grid rendering

- [x] 5.1 Add `pages/bulk-edit-table/bulk-edit-table.tsx`: `useReactTable` over the registry with `tableLayout: fixed`, `columnPinning: { left: ['variant'] }`, and `columnVisibility`
- [x] 5.2 Add row virtualization with `estimateSize: () => 32`, rendering leading and trailing spacer `<tr>` elements inside a real `<tbody>`
- [x] 5.3 Apply `getPinnedCss` / `getPinningStyle` from `components/data-table/column-styles.ts` to the pinned column, with `borderCollapse: separate` so borders survive
- [x] 5.4 Add `pages/bulk-edit-table/bulk-edit-row.tsx` and `bulk-edit-cell.tsx`, both `memo`, with the cell rendering by `meta.cellKind` and honouring `meta.gatedBy` (placeholder when the gate is off)
- [x] 5.5 Lock every cell and control to 32px: `height: 32px; padding: 0 8px` on cells, `height: 32px` and no vertical padding on controls, overflow hidden — no inline error text anywhere
- [x] 5.6 Bind one `mouseup` listener and one `mousemove` fallback at the table root (never per row), and implement edge auto-scroll while dragging
- [x] 5.7 Add `pages/bulk-edit-table/horizontal-scrollbar.tsx` — a custom scrollbar pinned to the viewport bottom, driven by the container's `scrollLeft`/`scrollWidth`, draggable, with the native bar hidden

## 6. Editing behaviour

- [x] 6.1 Wrap the page in `FormProvider` with `useForm({ defaultValues: { variants } })` and the Zod resolver from 2.1 — no `useFieldArray`
- [x] 6.2 Implement range propagation: an edit to any cell in a selection loops `setValue(..., { shouldDirty: true })` across the range, immediately on change, applying to gated rows without altering their gate
- [x] 6.3 Implement fill-handle commit: on mouseup, copy the origin cell's value across the dragged range
- [x] 6.4 Present validation errors as a red border plus tooltip on the cell; block Save while invalid, report the affected row count, and scroll the virtualizer to the first invalid row

## 7. Page shell

- [x] 7.1 Rewrite `pages/bulk-edit.tsx`'s top bar: back control, `Editing N variants` via `_n()`, unsaved badge driven by `formState.isDirty`, column dropdown, Cancel, Save
- [x] 7.2 Add `hooks/use-column-visibility.ts` — react-table `VisibilityState` persisted to `localStorage`, all columns visible on first visit, Variants always visible
- [x] 7.3 Parse and validate `?ids=` (numeric, deduped); render an empty state with a back action when it is absent, empty, or resolves to nothing
- [x] 7.4 Add the navigation guard (react-router block + `beforeunload`) and make Cancel confirm before discarding and returning
- [x] 7.5 On save success, `reset()` from the response so dirty state clears while scroll position, column visibility, and selection survive; keep the existing query invalidations for inventory and product lists
- [x] 7.6 Update `skeletons/bulk-edit-table-skeleton.tsx` to match the new 32px row height and column registry

## 8. Verification

- [x] 8.1 Add `tests/pages/bulk-edit-table.test.tsx` (jsdom): shift-click extends a range without changing values; editing a cell in a range fans the value across it; fill-handle drag copies the origin value down; the unsaved badge appears on first edit and clears after save
- [x] 8.2 `npm run typecheck` and lint clean in `resources/app/`
- [x] 8.3 `npm test` passes in `resources/app/`
- [ ] 8.4 Manual check (per CLAUDE.md §0, no browser preview): load `/variants/bulk?ids=…` with a large id set — scrolling stays smooth, the pinned column holds while scrolling right, drag-fill auto-scrolls past the visible rows, and saving posts and clears the badge
