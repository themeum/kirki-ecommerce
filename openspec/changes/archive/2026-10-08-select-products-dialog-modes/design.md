## Context

See proposal.md for motivation. Current shape, under `resources/app/features/products/components/shared/`:

- `select-products-dialog.tsx` (about 360 lines) owns all state: `search`, `page`, `filters`, `expandedProductIds`, and `selection` (a `Map<productId, ProductSelection>`). It seeds `selection` from `selectedProducts` and re-seeds it in an effect on `[open, selectedProducts]`.
- `ProductTable` and `ProductPickerRow` take a boolean `selectVariants`. The pure toggle functions `applyProductToggle` and `applyVariantToggle` live in the dialog file.
- The order page replaces its own list with whatever `onAdd` returns (`handleAddItems` in `orders/contexts/order-create-context.tsx`). So in order mode `onAdd` must keep returning locked and new items together.
- The product field passes `selectedProducts ?? []`, which is a new array on every render while the value is undefined. With the reset effect, that re-seeds the selection and drops the merchant's picks.
- The existing `component-logic-separation` spec asks for pure decision logic outside components.

## Goals / Non-Goals

**Goals:**

- One `mode` prop replaces `selectVariants`, with locked-variant behavior in `order` mode only.
- Locked variants are protected from every selection path through one rule, not per-handler checks.
- Dialog state is created per open instead of being synced by an effect.

**Non-Goals:**

- Memoizing `ProductPickerRow`. With 12 rows per page the gain is small and it needs per-row props.
- Merging `expandAll` into `mode`. It stays a separate prop.
- Changes to `ProductSelection`, the products API, or the order-create context.

## Decisions

**1. Lock rule lives in the pure toggle helper.**
`applyVariantToggle` receives `lockedVariantIds` and removes locked ids from the variants it is asked to toggle. Row click, product toggle, header toggle and shift-range all call it, so none of them can change a locked variant. Because locked ids are never removed, a product that has a locked variant is never deleted from the Map.
Alternative: check `isLocked` in each handler. Rejected: four call paths, easy to miss one.

**2. Locked ids come from the `selectedProducts` prop, not from `selection`.**
`selection` mixes locked and new items, so it cannot tell them apart. The locked set is derived once from `selectedProducts` when `mode === 'order'`, and is an empty set in `product` mode. In `product` mode, `selectedProducts` is the editable starting selection, which is today's behavior.

**3. A product row reflects unlocked variants only.**
The product checkbox state is computed over the variants that are not locked. This gives the agreed result for a fully locked product (disabled, unchecked, badge) and a clear partial state for a mixed one. The header checkbox uses the same counts, so it disables itself when nothing on the page is selectable.

**4. Counts come from one helper.**
`getSelectionCounts` walks the page items once and returns the selectable and selected counts for the header. The footer count is the number of selected variant ids that are not locked (order mode) or the number of selected products (product mode).
Alternative: keep three reduces. Rejected: three passes over the same data and a mode branch in each.

**5. Mount-on-open inner component replaces the reset effect.**
The outer `SelectProductsDialog` renders `Dialog` and `DialogContent`. An inner body component, rendered inside `DialogContent`, owns all state and initializes `selection` from props with `useState`. Radix unmounts `DialogContent` when closed, so each open starts fresh, and re-renders of the caller cannot reset picks. The product query no longer needs the `open` flag, because it only runs while the body is mounted.
Alternative: keep the effect but depend only on `open`. Rejected: it still needs a `selectedProducts` read inside the effect and hides the reset behind a lint suppression.
Alternative: callers conditionally mount the dialog (as order-create already does). Rejected: leaves the product field exposed to the bug.

**6. Child components take `mode`.**
`ProductTable` and `ProductPickerRow` take `mode` plus `lockedVariantIds` instead of `selectVariants`, so there is one vocabulary. The existing table test harness changes with them.

## Risks / Trade-offs

- [Search, page and filters now reset on every reopen] → Accepted. It matches how order-create already behaves, and the proposal lists it.
- [The inner component only resets if `DialogContent` unmounts on close] → Verify the project `Dialog` wrapper does not use `forceMount`, and cover the reopen case in a test.
- [A product row with some locked variants shows a state that ignores the locked ones] → Intentional. The locked variants still show checked on their own rows, and the badge explains why.
- [Callers passing the old `selectVariants` prop break at type-check] → Both callers are in this change. The type error makes any missed caller visible.
