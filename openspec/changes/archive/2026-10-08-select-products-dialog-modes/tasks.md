All paths are under `resources/app/features/`. Run verification commands from `resources/app/`.

## 1. Pure selection logic

- [x] 1.1 Add `SelectProductsMode = 'order' | 'product'` to `products/components/shared/select-products-dialog/types.ts`
- [x] 1.2 Create `products/components/shared/select-products-dialog/selection-helpers.ts`. Move `applyProductToggle` and `applyVariantToggle` there. `applyVariantToggle` takes `lockedVariantIds` and ignores locked ids for both select and deselect
- [x] 1.3 Add `getSelectionCounts` to `selection-helpers.ts`. It returns the selectable and selected counts for the page in one pass, for both modes, with locked variants excluded
- [x] 1.4 Create `selection-helpers.test.ts`. Cover: deselect ignores locked ids, select ignores locked ids, a product with only locked variants stays in the Map, counts exclude locked variants, product mode counts products
- [x] 1.5 Verify: `npm run typecheck && npm test`

## 2. Table and row components

- [x] 2.1 `product-table.tsx`: replace the `selectVariants` prop with `mode`, add `lockedVariantIds`. (Correction: no skip logic in `handleToggleRange`; `applyVariantToggle` already ignores locked ids, per design decision 1, and a table test covers it.) Use `mode` for the header label
- [x] 2.2 `product-picker-row.tsx`: replace `selectVariants` with `mode`, add `lockedVariantIds`. Compute the product checked and partial states over unlocked variants only. A product with no unlocked variants gets a disabled, unchecked checkbox, an "Already added" badge, and a row click that does nothing
- [x] 2.3 `product-picker-row.tsx`: a locked variant row gets a disabled, checked checkbox, an "Already added" badge (reuse `@/components/ui/badge`, wrap text with `__()`), and a row click that does nothing
- [x] 2.4 Update `product-table.test.tsx`: harness uses `mode` and `lockedVariantIds`. Add cases for a disabled locked variant with its badge, a shift-range that skips locked variants, and a fully locked product row that is disabled and unchecked
- [x] 2.5 Verify: `npm run typecheck && npm test` (typecheck clean; all tests pass except the unrelated failure in `features/home/tests/lib/steps.test.ts`, which also fails on a clean tree)

## 3. Dialog

- [x] 3.1 `select-products-dialog.tsx`: replace the `selectVariants` prop with a required `mode` prop. Derive `lockedVariantIds` from `selectedProducts` in `order` mode, an empty set in `product` mode
- [x] 3.2 Split into an outer `SelectProductsDialog` (`Dialog`, `DialogContent`) and an inner body component that owns all state. Initialize `selection` with `useState` from props. Remove the reset `useEffect` on `[open, selectedProducts]`
- [x] 3.3 Confirm the project `Dialog` wrapper unmounts `DialogContent` on close (no `forceMount`). Drop the `open` argument to `useProductsWithVariantsQuery` (Confirmed: `DialogContent` is Radix `Dialog.Content` without `forceMount`.)
- [x] 3.4 Use `getSelectionCounts` for the header state. Compute the footer count from selected ids that are not locked (order mode) or the product count (product mode). `onAdd` still returns the full selection
- [x] 3.5 Update the callers: `products/components/fields/product-selection-field.tsx` to `mode="product"`, `orders/pages/order-create.tsx` to `mode="order"` (keep `expandAll`)
- [x] 3.6 Verify: `npm run typecheck && npm test` (same note as 2.5)

## 4. Final check

- [x] 4.1 Run lint on the touched files and fix issues in the lines this change touched
- [x] 4.2 Search the repo for leftover `selectVariants` references
- [x] 4.3 Run `openspec validate select-products-dialog-modes`
- [x] 4.4 Ask the user to check visually (no browser tools in this project): the order-create picker with already-added variants (badge, disabled rows, select-all and deselect-all leave them alone, footer count) and the product-field picker (unchanged) (Confirmed by the user at archive time.)
- [x] 4.5 Verify: `npm run typecheck && npm test` (same note as 2.5)
