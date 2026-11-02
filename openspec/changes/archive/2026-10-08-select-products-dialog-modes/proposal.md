## Why

The select-products dialog has one boolean, `selectVariants`, that switches between "pick products" and "pick variants". In the variant picker used by order-create, variants already on the order look like any other variant. A merchant can untick them, or clear them with select-all, and then "Done" silently removes order lines. The dialog also resets the user's picks whenever the parent re-renders with a new array, because of an effect keyed on `selectedProducts`.

## What Changes

- Replace the `selectVariants` prop of `SelectProductsDialog` with a required `mode: 'order' | 'product'` prop. **BREAKING** for any caller still passing `selectVariants`; the two in-repo callers are updated.
- `mode="product"` keeps today's `selectVariants={false}` behavior. No item is locked.
- `mode="order"` shows all variants. Variants already present in `selectedProducts` are locked: the checkbox is disabled and checked, an "Already added" badge shows, and no action changes them (row click, product toggle, header select-all or deselect-all, shift-range).
- In order mode, a product whose variants are all locked shows a disabled, unchecked product checkbox plus the badge.
- In order mode, the footer "N selected" counts only new picks. `onAdd` still returns the full set (locked and new) so the order page keeps its existing lines.
- Remove the effect that resets the selection on `[open, selectedProducts]`. Dialog state is created when the dialog opens and discarded when it closes.
- Compute the selection counts in one pass. Move the pure toggle and count logic into `selection-helpers.ts`, with unit tests.
- `expandAll` stays a separate prop.

## Capabilities

### New Capabilities

- `product-picker-dialog`: how the select-products dialog selects products or variants in each mode, how already-added variants are locked in order mode, and what the dialog returns on "Done".

### Modified Capabilities

<!-- None. No existing spec covers the product picker dialog. -->

## Impact

- Code, under `resources/app/features/`:
  - `products/components/shared/select-products-dialog.tsx`
  - `products/components/shared/select-products-dialog/{types.ts, product-table.tsx, product-picker-row.tsx, product-table.test.tsx}`
  - new `products/components/shared/select-products-dialog/{selection-helpers.ts, selection-helpers.test.ts}`
  - `products/components/fields/product-selection-field.tsx` (`mode="product"`)
  - `orders/pages/order-create.tsx` (`mode="order"`)
- Behavior notes:
  - Search text, page and filters reset each time the dialog reopens, because dialog state no longer outlives the dialog.
  - The product query runs only while the dialog is mounted.
- No API, schema or dependency changes. No backend changes.
