## 1. Render-count test (fails first)

- [x] 1.1 In `select-products-dialog/product-table.test.tsx`, mock `@/components/ui/price-text` with a component that counts its renders. Add a test: render `Harness` in product mode, reset the count, click the first row checkbox, expect the count to go up by 1 (not 3)
- [x] 1.2 Run the new test on the current code and confirm it fails (all rows re-render). Record the observed count in this checkbox annotation — observed: 3 renders for one click (expected 1)
- [x] 1.3 Verify: `npm run typecheck && npm test` in `resources/app/` (only the new test may fail at this point)

## 2. Rows read their own slice

- [x] 2.1 In `select-products-context.tsx`, add `selection: Map<number, ProductSelection>` to `SelectProductsState` and the `state` memo; remove `selectedProductIds` and `selectedVariantIds` from the exported state, but keep their internal memos for `getSelectionCounts` / `getSelectedCount`
- [x] 2.2 In `product-table.tsx`, read `selection`, `expandedProductIds`, `lockedVariantIds` from state and pass `item`, `mode`, `lockedVariantIds`, `selectedEntry={selection.get(item.product.id)}`, `expanded={expandedProductIds.has(item.product.id)}` to each `ProductPickerRow`
- [x] 2.3 In `product-picker-row.tsx`, add the new props to `ProductPickerRowProps`, remove `useSelectProductsState()`, derive `isProductSelected = Boolean(selectedEntry)` and a memoized `selectedVariantIds` set from `selectedEntry?.variants`; leave all other logic and markup unchanged
- [x] 2.4 Verify: `npm run typecheck && npm test` in `resources/app/` — the render-count test from 1.1 and all existing tests in `product-table.test.tsx` and `selection-helpers.test.ts` pass

## 3. Expand rows during render

- [x] 3.1 In `select-products-context.tsx`, replace the `expandAll` `useEffect` with the adjust-state-while-rendering pattern: store the last expanded `pickerItems` reference in state; when `expandAll && pickerItems.length > 0 && pickerItems !== stored`, set the stored reference and `expandedProductIds` to all product ids during render
- [x] 3.2 Remove `useEffect` from the `react` import if it is no longer used
- [x] 3.3 Verify: `npm run typecheck && npm test` in `resources/app/` — the order-mode tests that rely on `expandAll` still pass

## 4. Stable props for the filter popup

- [x] 4.1 In `select-products-dialog.tsx`, add `handleApplyFilters = useCallback((next: ProductFilterValue) => { setFilters(next); setPage(1); }, [])` and `filterTrigger = useMemo(() => <Button variant="outline"><ListFilter />{__('Filter', 'kirki-ecommerce')}</Button>, [])`; pass them to `ProductFilterPopup`; add `useCallback` to the `react` import — corrected later by the user: the trigger button now lives inside `ProductFilterPopup` (no `children` prop), so `filterTrigger` was removed; `handleApplyFilters` stays (see design.md, Correction during implementation)
- [x] 4.2 Verify: `npm run typecheck && npm test` in `resources/app/`, and run lint on the four changed source files

## 5. Manual check

- [x] 5.1 Ask the user to check the dialog in the browser (product selection field and order form): select, shift-range, expand/collapse, select all on page, locked variants, pagination, search, filter apply/clear, Done. Do not use a browser tool for this
