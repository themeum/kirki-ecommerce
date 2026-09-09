## 1. Backend — the shared sorting concern

- [x] 1.1 Add `app/Concerns/HasSortableColumns.php` with `abstract protected function sortable_columns()` and `protected function apply_sorting(QueryBuilder $query, ListFilterDTO $filters)`. Resolve `sort_by` through the map (string column, string alias, or `Closure` subquery), fall back to the resource default when unrecognised, clamp `sort_order` to `asc`/`desc`. PHP 7.4 syntax, `static::`, `protected`, snake_case, short arrays.
- [x] 1.2 Add a unit test for the concern covering: known field resolves, unknown field falls back, malformed direction falls back instead of throwing.

## 2. Backend — port the existing allowlists

Port each controller's array literal into its service's `sortable_columns()` unchanged first, so this step is behaviour-preserving. Widening happens in section 3.

- [x] 2.1 `BrandService`, `CategoryService`, `TagService`, `CollectionService` — use the concern, port the allowlists from `BrandController`, `CategoryController`, `TagController`, `CollectionController`, delete those controllers' `whitelisted('sort_by', ...)` calls.
- [x] 2.2 `ProductService`, `OrderService`, `CustomerService`, `CouponService`, `VariantService` — same, from their controllers.
- [x] 2.3 The remaining services that carry the duplicated sort clause — `AttributeService`, `AttributeValueService`, `ProductSchemaService`, `ShippingProfileService`, `ShippingBoxService`, `TaxProfileService`, `CurrencyService`, `AddressService` — use the concern. `CurrencyService` and `AddressService` have no allowlist today: give them one that matches their real columns.
- [x] 2.4 Run `vendor/bin/phpunit` — the existing per-resource API tests must pass unchanged, proving the port did not alter behaviour.

**Notes from implementation:**

- The trait's defaults had to be **methods** (`default_sort_by()` / `default_sort_order()`), not properties: PHP fatals when a class redeclares a trait property with a different default, which `CategoryService`/`CollectionService` (default `ordering`) both do.
- `ListFilterDTO::$sort_by` now defaults to `null` instead of `'id'`. Once the controller stopped setting it, an absent `sort_by` was indistinguishable from an explicit `?sort_by=id`, which would have silently overridden Category's and Collection's `ordering` default. `$sort_order` was deliberately left at `'desc'` — the then-unported services still branched on it.
- `ProductService` keeps a small `apply_product_sorting()` in front of the map: the storefront's `low_to_high`/`high_to_low` values fix their own direction and share `apply_filters()` with the admin list, so they cannot be expressed as ordinary map entries. Side effect worth knowing: those two values are now also accepted on the admin products endpoint, where the removed allowlist previously discarded them.
- `CurrencyService` and `AddressService` had no allowlist at all, so their maps are new rather than ported; both were given their real columns.
- Verified with `composer test:docker:integration` (276 tests, 5176 assertions) and the Unit suite (193 tests) — the environment needed `composer test:docker:install` first.

## 3. Backend — widen the sortable set

Every data-bearing column becomes sortable; image/media and row-action columns do not.

- [x] 3.1 Taxonomy counts — map `count` to the `with_count('products')` alias (`products_count`) in `BrandService`, `CategoryService`, `TagService`, `CollectionService`. Add `description` and `slug` where missing (these three are the columns that present as sortable today but silently do nothing).
- [x] 3.2 `ProductService` — `base_price` done (direction-aware variant subquery; `paginate_with_variants` also had to select the `pid` alias the subquery correlates on, or a price sort there would have been a SQL error). `availability_status` deliberately **not** sortable — it is computed in PHP, not stored (decision recorded in the `list-sorting-api` spec).
- [x] 3.3 `OrderService` — map `status` to `order_status`, and add `quantity` as a sum over order items.
- [x] 3.4 `CustomerService` — map `orders_count`, `base_amount_spent` and `last_order_date` to their existing aggregate aliases, and `location` to a joined-address subquery.
- [x] 3.5 `CouponService` — `method`, `discount_type`, `current_usage_count` **done**: the design's open question resolved to all three being stored columns (`CreateCouponsTable`). `status` deliberately **not** sortable — the task assumed it was `is_active`, but it is computed by `Coupon::get_status()` from four values plus the current time.
- [x] 3.6 `VariantService` (inventory) — add `sku` and `available_quantity` if absent, `title` via the parent product, and `committed_quantity` per its schema backing.

## 4. Backend — tests for the widened set

- [x] 4.1 Assert actual row ordering, not just a 2xx, for every derived field: `BrandApiTest` (`count`), `ProductApiTest` (`base_price`, `availability_status`), `OrderApiTest` (`quantity`, `status`), `CustomerApiTest` (`orders_count`, `base_amount_spent`, `last_order_date`, `location`), `VariantApiTest` (`title`).
- [x] 4.2 Add one shared-behaviour case to a representative test: an unrecognised `sort_by` returns 200 in default order, and a malformed `sort_order` returns 200 rather than a 500.
- [x] 4.3 Both suites green: integration 301 tests / 5894 assertions (baseline was 276), unit 193 tests.

**Resolved: two computed categorical fields stay non-sortable.** Products `availability_status`
and coupons `status` are computed in PHP at serialization time, not stored, aliased or joinable.
An ordering expression would have been a *third* copy of rules already held by the PHP resolver and
the SQL filter predicates. Both keep `enableSorting: false`; the exception is now a requirement in
`specs/list-sorting-api/spec.md`.


## 5. DataTable — sorting

- [x] 5.1 `data-table.tsx` — set `enableSortingRemoval: true`.
- [x] 5.2 `hooks/use-data-table-params.ts` — replace `onSortingChange`'s early return on an empty sorting array with a branch that clears `sort_by` and `sort_order` from the address.
- [x] 5.3 `hooks/use-data-table-params.test.tsx` — assert the third-state branch clears both params and that a normal sort still writes them.

## 6. DataTable — bulk actions

- [x] 6.1 `components/data-table/types/index.ts` — add `DataTableBulkAction = { value, title, destructive?, icon? }`.
- [x] 6.2 `data-table.tsx` — rename the `bulkActionOptions` prop to `bulkActions` and retype it.
- [x] 6.3 `data-table-selection-bar.tsx` — one action renders a single button (`destructive` when flagged, else `secondary`) applying directly; two or more keep the select-then-confirm path; zero or undefined render no action control.
- [x] 6.4 `data-table-selection-bar.tsx` — add a pending flag driving the button's existing `loading` prop, and stop clearing the selection when `onBulkApply` rejects.

## 7. DataTable — column visibility

- [x] 7.1 Add `components/data-table/use-table-column-visibility.ts`, generalising `features/bulk-edit/hooks/use-column-visibility.ts` with a per-table key `kirki-ecommerce:table-columns:<tableId>`; both read and write stay `try/catch`'d.
- [x] 7.2 Add `components/data-table/data-table-column-visibility.tsx` — icon-only `Columns3` trigger, checkbox items with `onSelect={event => event.preventDefault()}` so the menu survives several toggles (the pattern from `features/bulk-edit/pages/column-visibility-menu.tsx`), and the last visible column's toggle disabled.
- [x] 7.3 `data-table.tsx` — add the required `tableId` prop and an `enableColumnVisibility` prop defaulting to true; make the table hold visibility state itself, keeping the existing `columnVisibility` prop as a controlled override that suppresses the control.
- [x] 7.4 `data-table.tsx` — make the toolbar row a `justify="space-between"` flex with `toolbar` leading and the column control trailing; the selection bar continues to replace the whole row.

## 8. DataTable — filtering

- [x] 8.1 Add `components/data-table/data-table-filter-popover.tsx` carrying the trigger, sticky header with dismiss, scrolling body, sticky apply footer, open/close and draft-seeding-on-open, generalised from `features/products/components/product-table/filter-popup/filter-popup.tsx`.
- [x] 8.2 Build the trigger per screenshot 2: `Filter` label with the applied count (one per filter control holding a non-default value), plus an adjoining clear control shown only while at least one filter is in force. The clear must not touch the search term or date range.
- [x] 8.3 Remove the `filterBar` prop from `DataTableProps` and its render slot.

## 9. Call sites — sorting

- [x] 9.1 Flip `enableSorting` in each `columns.tsx` to match the widened backend set: products (`title`, `base_price`, `status`, `created_at` — **not** `availability_status`); orders (`order_number`, `quantity`, `invoiced_total`, `status`, `payment_provider`, `created_at`); coupons (`title`, `method`, `discount_type`, `current_usage_count`, `created_at` — **not** `status`); inventory (`title`, `sku`, `available_quantity`, `committed_quantity`); customers (`first_name`, `orders_count`, `base_amount_spent`, `location`, `last_order_date`, `created_at`); collections (`title`, `count`, `created_at`); brands and categories (`name`, `description`, `slug`, `count`, not `logo`/`image`); tags (already all true).
- [x] 9.2 Verify every id flipped in 9.1 appears in its service's `sortable_columns()` — a mismatch is inert, not an error.
- [x] 9.3 Delete `handleSortChange` and its `ArrowDownUp` button from `product-table-filters.tsx`, `coupon-table-filters.tsx`, `order-table-action.tsx`, `customer-table-filters.tsx`, `collection-table-filters.tsx`, `inventory-table-filters.tsx` and `customer-group-table.tsx`, removing imports the deletion orphans.

## 10. Call sites — table ids and bulk actions

- [x] 10.1 Add `tableId` to all 11 table wirings under `resources/app/features/`.
- [x] 10.2 Rename `bulkActionOptions` to `bulkActions` at the 9 wirings that pass it, marking Trash/Delete actions `destructive: true`.
- [x] 10.3 `customer-group-table.tsx` and `variation-table.tsx` — add `enableColumnVisibility={false}` alongside their `tableId`; leave their no-op sorting as is.

## 11. Call sites — inventory and filtering

- [x] 11.1 `inventory-table.tsx` — drop `selectedFields` state, the `columnVisibility` memo and prop, and the props it passed to `InventoryTableFilters`; remove the field picker from `inventory-table-filters.tsx`. Note whether `allTableHeaders` in `features/inventory/lib/utils` is left unused; do not delete pre-existing dead code.
- [x] 11.2 Port the products, coupons and orders filter popups onto `DataTableFilterPopover`, each supplying only its filter controls and its apply/clear mapping.
- [x] 11.3 Delete `product-table-filter-bar.tsx`, `coupon-table-filter-bar.tsx` and `order-table-filter-bar.tsx` and the `filterBar` props that referenced them.

## 12. Frontend tests

- [x] 12.1 `data-table.test.tsx` — update the existing sorting, pinning and visibility assertions for the renamed/removed props.
- [x] 12.2 Add cases: a single bulk action renders one button that applies on click; two or more keep the select-then-confirm path; a rejected `onBulkApply` retains the selection.
- [x] 12.3 Add cases: the column menu stays open across two toggles, excludes the selection and empty-header columns, refuses to hide the last visible column, and persists to and restores from storage.
- [x] 12.4 Add a case: a third activation of a sorted header reports no sort.
- [x] 12.5 From `resources/app/`: typecheck 0 errors, lint clean, 822 tests passing (baseline was 810).

**Notes from implementation:**

- `9.3` — the variation library's sort button was **kept**: unlike the other six it is not the ad-hoc URL toggle, it sorts the in-memory list via `getSortedList`, and since that table is one of the two skipped from header sorting it is that list's only sort affordance. Removing it would have removed working behaviour. Customer Groups' button *was* removed — it had no `onClick` at all. Its neighbouring mock controls (a disabled Select, a dead Filter button, a dead Input) were left alone as outside this change.
- `9.2` — verified mechanically rather than by eye: a script cross-checks every `enableSorting: true` column id against its service's `sortable_columns()` keys. All nine tables pass.
- `6.4` — a `catch` was needed as well as the `try/finally`: retaining the selection stops the *state* loss, but the rejection still escaped as an unhandled rejection (the test surfaced it). It is now absorbed with a comment explaining that reporting belongs to the caller's mutation.
- `12.3` — the column-visibility tests initially failed because they share `localStorage` across cases; `afterEach` now clears it. Two assertions also had to read `thead th` directly rather than by role, because Radix marks the rest of the page `aria-hidden` while the menu is open.


## 13. Documentation

- [x] 13.1 Write `docs/data-table.md` per CLAUDE.md §6 — table of contents, numbered sections, quick start first: 1. Quick start · 2. Defining columns · 3. Sortable columns (the column-id-to-`sortable_columns()` contract, and why a mismatch fails silently) · 4. Bulk actions · 5. Column visibility and `tableId` · 6. Filtering · 7. Where this differs from TanStack defaults.

## 14. Hand-off

- [x] 14.1 Report what could not be verified automatically — the four visual behaviours (sortable header arrows, the collapsed Trash button, the column menu staying open, the `Filter (n) ✕` trigger) need a manual spot-check, since CLAUDE.md §0 rules out browser verification.
