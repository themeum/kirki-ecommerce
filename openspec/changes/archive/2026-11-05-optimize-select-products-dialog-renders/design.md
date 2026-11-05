## Context

See proposal.md - Why.

Current structure in `select-products-dialog/`:

- `select-products-context.tsx` has two contexts. The **actions** context value is stable (all
  callbacks are memoized and depend only on `lockedVariantIds`, which never changes). The
  **state** context value is a new object on every change to `selection`, `expandedProductIds`,
  `isLoading`, or `pickerItems`.
- `product-picker-row.tsx` wraps the row in `memo`, but calls `useSelectProductsState()` to read
  `mode`, `expandedProductIds`, `selectedProductIds`, `selectedVariantIds`, `lockedVariantIds`.
  A context read bypasses `memo`, so every row re-renders on every state change.
- `expandAll` is applied in a `useEffect` that sets `expandedProductIds` after `pickerItems`
  changes. That gives one commit with collapsed rows, then one more commit with expanded rows.
- `select-products-dialog.tsx` renders `ProductFilterPopup` (already `memo`) with an inline
  `onApply` and a new `<Button>` element as `children`, so its `memo` never skips.

Facts the design depends on (checked in `selection-helpers.ts`):

- `applyProductToggle` and `applyVariantToggle` copy the `Map` and replace only the toggled
  product's entry. Entries of other products keep their object reference.
- `pickerItems` is built in a `useMemo` over `data?.results`. With `keepPreviousData`, the
  reference stays the same until new data arrives.

## Goals / Non-Goals

**Goals:**

- One selection or expand change re-renders `ProductTable` and only the affected rows.
- With `expandAll`, rows commit one time per data load, already expanded.
- `ProductFilterPopup` re-renders only when the applied filters change.

**Non-Goals:**

- No change to the skeleton on refetch (`isFetching || isLoading`). The user chose to keep it.
- No change to shared UI primitives (`Image`, `Checkbox`, `TableRow`, `PriceText`).
- No external store or selector library.
- No change to the dialog's public props or to its callers.

## Decisions

### 1. Rows get their slice as props; they stop reading the state context

`ProductTable` already reads the state context. It passes each row:
`item`, `mode`, `lockedVariantIds`, `selectedEntry = selection.get(item.product.id)`, and
`expanded = expandedProductIds.has(item.product.id)`.

The row keeps `useSelectProductsActions()` (stable value), and derives
`isProductSelected = Boolean(selectedEntry)` and a memoized `selectedVariantIds` set from
`selectedEntry.variants`. All row logic and markup stay as they are.

The state context exposes `selection` (the `Map`) in place of `selectedProductIds` and
`selectedVariantIds`. Those two sets stay as internal memos, because the page counts
(`getSelectionCounts`, `getSelectedCount`) use them.

Why `selectedEntry` and not a selected-variant set per row: the entry reference already changes
only for the toggled product, so `memo` works without extra comparison code.

Alternatives considered:

- *Selector store with `useSyncExternalStore`*: each row subscribes to its own slice. This
  works but is a larger rewrite of the provider for the same result.
- *Custom `memo` comparator*: fragile; it must know which parts of the state each row uses.
- *Split the state into more contexts*: rows would still read sets that change on every click.

### 2. Apply `expandAll` during render, not in an effect

Use the React "adjust state while rendering" pattern. Keep the `pickerItems` that were last
expanded in state. When `expandAll` is on, `pickerItems.length > 0`, and `pickerItems` is not
the stored reference, set the stored reference and `expandedProductIds` during render. React
discards that render and renders again before it commits, so children render one time.

Behaviour stays the same: all rows expand again on each new page of data, and the merchant can
still collapse a row until the next data load.

Alternative considered: `useLayoutEffect`. It avoids the paint of collapsed rows, but React
still renders all rows two times.

### 3. Stable props for `ProductFilterPopup`

In `SelectProductsDialogBody`, wrap the apply handler in `useCallback` (it calls `setFilters`
and `setPage(1)`; both setters are stable, so it has no deps). Memoize the trigger
`<Button variant="outline">` in `useMemo` with no deps. `value={filters}` changes only when the
merchant applies filters. No change in `product-filter-popup.tsx`.

### 4. Prove it with a render-count test

In `product-table.test.tsx`, mock `@/components/ui/price-text` with a component that counts its
renders (one per product row in product mode). Click one row and expect one more render, not
one per row. Write the test first and confirm that it fails on the current code.

## Risks / Trade-offs

- [Shift-range or select-all acts on stale data after rows stop reading state] → Range and
  select-all already read current data from the provider's `latest` ref, not from the row.
  The existing tests for shift-range, locked variants, and `expandAll` must pass without change.
- [Setting state during render can loop] → The guard compares the stored `pickerItems`
  reference, and it is set in the same render, so the update runs one time per new reference.
- [Select-all creates a new entry for every product] → All rows on the page re-render on
  select-all. That is correct, because their checked state can change.
- [The memoized filter trigger keeps a stale label if the locale changes while the dialog is
  open] → The locale does not change at runtime in wp-admin.

## Correction during implementation

- **Decision 3 changed.** The user moved the trigger `<Button>` into `ProductFilterPopup` and
  removed its `children` prop. So no memoized `filterTrigger` is necessary, and the stale-label
  risk above no longer applies. `handleApplyFilters` (`useCallback`) stays, so the popup `memo`
  still skips until the applied filters change.
- **The visible delay was not in render frequency.** After this change, the user still saw the
  table skeleton stay for a short time after the response. Temporary timing marks (now removed)
  measured it on the dev build: one request, Zod parse about 5 ms, `buildProductSelection` and
  the other body work about 9 ms, page select under 5 ms. The cost was the first mount of the rows
  in `ProductTable` (about 182 ms), plus two nested updates (about 26 ms) and browser paint (about
  96 ms). This change does not address that mount cost. Before any follow-up change, measure a
  production build, because part of the cost can be dev-only (React dev build, Emotion dev mode).
