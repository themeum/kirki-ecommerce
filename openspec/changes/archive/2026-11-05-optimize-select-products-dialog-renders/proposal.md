## Why

The select-products dialog is slow to open and re-renders much more than it needs to. The
problem is worst in order mode, where the order form opens it with every product expanded. One
checkbox click re-renders every product row and every variant row on the page, so the dialog
feels slow.

## What Changes

- Each product row re-renders only when its own data changes (its selection, its expanded
  state). Today every row re-renders on any selection, expand, or loading change, because the
  rows read the whole shared dialog state.
- When the dialog expands all rows (order mode), the rows render one time, already expanded.
  Today they render collapsed first and then render again expanded on each new page of data.
- The filter popup no longer re-renders each time the dialog body re-renders (search, page,
  fetch state). It re-renders only when the applied filters change.
- A test confirms that one click re-renders only the row that changed.

No visible behaviour changes. The skeleton still shows on every refetch (page, search, filter),
as it does now. Selection, shift-range, locked variants, select-all, the selected count, and the
confirmed result stay the same. The `product-picker-dialog` spec stays valid without change.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. This is a render-performance refactor with no requirement change, so the change sets
`skip_specs: true`.

## Impact

- `resources/app/features/products/components/shared/select-products-dialog.tsx`
- `resources/app/features/products/components/shared/select-products-dialog/select-products-context.tsx`
- `resources/app/features/products/components/shared/select-products-dialog/product-table.tsx`
- `resources/app/features/products/components/shared/select-products-dialog/product-picker-row.tsx`
- `resources/app/features/products/components/shared/select-products-dialog/product-table.test.tsx`
  (new render-count test)

The dialog's public props do not change. The two callers
(`features/products/components/fields/product-selection-field.tsx` and
`features/orders/pages/order-form.tsx`) need no change. No API, dependency, or data change.
