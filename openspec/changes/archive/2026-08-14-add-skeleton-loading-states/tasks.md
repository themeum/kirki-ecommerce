## 1. Skeleton primitive

- [x] 1.1 Create `resources/app/components/ui/skeleton.tsx`: `forwardRef<HTMLDivElement>` over a `div` with `data-slot="skeleton"` and `aria-hidden="true"`. Props: `width?: string | number`, `height?: string | number`, `radius?: keyof typeof theme.radius` (default `'md'`), `cssOverride?: CSSObject`, spread over `Omit<ComponentPropsWithoutRef<'div'>, 'className' | 'css'>`. Follow `components/ui/separator.tsx` for the sizing mechanism — module-local `toCssLength` (number → `px`, string passthrough), values emitted as `--skeleton-width` / `--skeleton-height` on a `defineStyles({...}) as CSSProperties` object with the caller's own `style` spread last, and token fallbacks (`100%` / `1rem`) baked into the `styles` object.
- [x] 1.2 Add the pulse: `keyframes` from `@emotion/react` declared between the exports and the `styles` object (as in `spinner.tsx`), animating `opacity` `1 → 0.5 → 1` on `2s cubic-bezier(0.4, 0, 0.6, 1) infinite`. Fill is `theme.colors.background.surfaceTertiary`. Apply with `scopedMerge(styles.root, styles.radii[radius], cssOverride)` — unscoped styles lose to WordPress admin CSS.
- [x] 1.3 Write `resources/app/components/ui/skeleton.test.tsx`: numeric width/height emit `px`; string values pass through untouched; omitted dimensions fall back to full width and one line; `radius="full"` maps to the token; root carries `data-slot="skeleton"` and `aria-hidden="true"`. Computed-style assertions need the `#wpbody-content .kirki-ecommerce-root` ancestry — reuse the `container` setup from `data-table.test.tsx`.
- [x] 1.4 Verify: `npm run typecheck && npm test` from `resources/app/`.

## 2. Data table placeholders

- [x] 2.1 Create `resources/app/components/data-table/data-table-skeleton.tsx`. Takes the live TanStack `table` instance plus a `rowCount`, and walks `getVisibleLeafColumns()` to render a placeholder header row (one `TableHead` each, `Skeleton` `height={12} width="60%"`) and `rowCount` placeholder body rows (one `TableCell` each, `Skeleton height={12}`). Carry each column's `meta.alignment`, `meta.cssOverride` and pinning styles through exactly as `data-table.tsx` does for real cells. The `select` column keeps `onlyCheckbox` and renders a 16×16 `radius="sm"` skeleton so its 40px column does not collapse.
- [x] 2.2 Wire it into `data-table.tsx`: replace the `isLoading ? <TableRow><TableCell colSpan…><Spinner/>` branch with the skeleton header + body, render the real `TableHeader` only when not loading, add `aria-busy={isLoading}` to `<Table>`, and remove the now-orphaned `Spinner` import. Row count is `data.length || pagination.pageSize`. Leave `<Pagination disabled={isLoading}>`, the toolbar, the filter bar and the `Card` untouched.
- [x] 2.3 Export `DataTableSkeleton` from `components/data-table/index.ts` (a domain barrel, permitted by CLAUDE.md).
- [x] 2.4 Update `data-table.test.tsx`: the three assertions selecting the loading state via `getByRole('status')` move to `aria-busy` on the table plus placeholder counts, including the hidden-column case that currently asserts `colspan="1"`. Add coverage for row count — `data.length` when previous rows exist, `pagination.pageSize` on first load — and that no sortable header is rendered while loading.
- [x] 2.5 Verify: `npm run typecheck && npm test` from `resources/app/`. Confirm the eleven `DataTable` consumers still typecheck unchanged.

## 3. Record page skeletons

- [x] 3.1 `features/products/skeletons/product-form-skeleton.tsx` — mirrors the product form's 70/30 `Flex` split and its `Card cssOverride={cardStyles.formCard}` stack. Replace `<LoadingSpinner/>` in `pages/edit-product/edit-product.tsx` and `pages/create-product/create-product.tsx`.
- [x] 3.2 `features/orders/skeletons/order-details-skeleton.tsx` — mirrors the items card, payment summary card and the 30% action/customer/flag/notes column. Replace `<LoadingSpinner/>` in `pages/order-details/order-details.tsx`; leave the existing not-found branch alone.
- [x] 3.3 `features/customers/skeletons/customer-details-skeleton.tsx` and `features/collections/skeletons/collection-details-skeleton.tsx`. These pages have no loading gate today — the form renders empty and `form.reset()` fills it. Add a gate on the **edit path only** (`id !== NEW_ITEM_ID`), so the create route still renders its empty form immediately.
- [x] 3.4 `features/bulk-edit/skeletons/bulk-edit-table-skeleton.tsx` — this table is hand-rolled on raw `<Table>` in `pages/bulk-edit-table/bulk-edit-table.tsx`, so it cannot reuse `DataTableSkeleton`. Replace the `<div>Loading...</div>` in `pages/bulk-edit.tsx`.
- [x] 3.5 Verify: `npm run typecheck && npm test` from `resources/app/`.

## 4. Settings page skeletons

- [x] 4.1 Create `skeletons/` under each settings sub-feature and replace its `<div>{__('Loading ...')}</div>`, mirroring that page's own field layout (label bar + control bar per field) inside the real `Card`/`CardContent`: `general`, `checkout`, `products`, `multi-currency`.
- [x] 4.2 Same for the multi-page sub-features: `tax` (`tax-settings`, `tax-region/edit-region-eu`, `tax-region/general-edit-region`), `shipping` (`shipping-settings`, `shipping-zone/shipping-zone`), `email` (`email-settings`, `edit-template`).
- [x] 4.3 Refresh the comment on `contentPane` in `features/settings/pages/settings-layout.tsx` — it justifies `minWidth: 600px` by reference to the `Loading ...` placeholder, which no longer exists. Keep the floor itself; `email-settings` still grows past it.
- [x] 4.4 Verify: `npm run typecheck && npm test` from `resources/app/`.

## 5. Embedded list skeletons

- [x] 5.1 `features/products/skeletons/product-picker-skeleton.tsx` — replaces the `colSpan` spinner row in `components/select-products-dialog/product-table.tsx`. Its header row and the dialog's search box stay rendered.
- [x] 5.2 `features/customers/skeletons/customer-search-skeleton.tsx` — replaces the `Searching...` text swap in `pages/order-create/components/customer/customer-search-dropdown.tsx` with rows shaped like `CustomerProfileCard`. Keep the existing `No customers found.` message for the resolved-empty case.
- [x] 5.3 Skeletons for the `variation-library`, `schema-profile` and `shipping-box` list views. **Premise correction:** all three render the identical `StackedItems` shape, so rather than one file per sub-feature they share `features/settings/skeletons/stacked-list-skeleton.tsx`, parameterised by `rowCount` / `hasMedia` / `actionCount`. All three also had no loading flag at all — they defaulted to `[]` and so showed their *empty state* while fetching; each now destructures `isLoading`. See design.md — Correction during implementation.
- [x] 5.4 Replace the `<div>Loading...</div>` in `features/products/components/product-form/sections/right-panel/categories/categories.tsx` with repeating row placeholders.
- [x] 5.5 Confirm the deliberately excluded surfaces are untouched: option-feeding `Select`/`MultiSelect` queries (countries, currencies, tax and shipping profiles, payment gateways, attributes, schemas), the `payment-summary-card` recalculation spinner, the coupon validate/generate spinners, and the route-level `<Suspense fallback={<LoadingSpinner/>}>` in every `features/*/routes.tsx`. **Superseded by 6.2:** the route fallback was left alone here on the grounds that chunk loading is not an API request, but in practice it renders a spinner immediately before the destination's skeletons — two loading treatments per navigation. It is now `null`.
- [x] 5.6 Verify: `npm run typecheck && npm test` from `resources/app/`.

## 6. Follow-up corrections

- [x] 6.1 Placeholder rows collapsed to the height of their bars (~40px against a
  58px product row). `DataTableSkeleton` takes `headerHeight` / `rowHeight`;
  `data-table.tsx` measures the last real header row and body row off a ref on
  `<table>` and passes them, falling back to 42px / 58px before anything has been
  displayed. Row height varies too much between tables — a 48px brand logo
  against a line of text — for one constant to serve.
- [x] 6.2 Drop the `Suspense` spinner: every `features/*/routes.tsx` moves from
  `fallback={<LoadingSpinner />}` to `fallback={null}`, so a navigation shows the
  destination page's skeletons and nothing before them. Delete the orphaned
  `components/loading-spinner.tsx`.
- [x] 6.3 Close the empty-state flash in `variation-library`, `schema-profile`
  and `shipping-box`. The `isLoading` gate added in 5.3 covered the request, but
  each view still copied the resolved data into state inside a `useEffect`, so
  the first paint after the request resolved ran with an empty list and drew the
  empty state. Each now derives its rows with `useMemo` during render and tracks
  optimistic deletions as a `removedIds` list, preserving the undo offer.
- [x] 6.4 Verify: `npm run typecheck && npm test && npx eslint .` from
  `resources/app/`.

## 7. Final verification

- [x] 7.1 `npm run typecheck && npm test` from `resources/app/` — clean, all green.
- [x] 7.2 `npx eslint .` from `resources/app/` — no new violations.
- [x] 7.3 `openspec validate add-skeleton-loading-states --strict`.
- [x] 7.4 Hand back to the user for a visual spot-check (no browser preview per CLAUDE.md §0): products list on first paint, page 2 and a search should show no vertical jump; `/settings/general` should not flash a narrow column.
