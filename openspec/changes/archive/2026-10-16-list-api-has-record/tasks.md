# Tasks

## 1. ListPaginator

- [x] 1.1 Add `app/Supports/ListPaginator.php`: extends the framework `Paginator`, holds `has_records`, has a static `from( Paginator $paginator, bool|QueryBuilder $has_records )` that copies items, total, per-page and current page, and a `to_array()` that returns the parent array plus `has_records`. Add full docblocks and the `ABSPATH` guard. Verify with `composer phpcs:docblocks` and `composer phpcs:wporg` on the file.
- [x] 1.2 Add `tests/Unit/Supports/ListPaginatorTest.php`: a `bool` is passed through; a query is not run when `total() > 0`; a query is run when `total() === 0` and its result is used; a page past the last page (empty items, `total() > 0`) gives `true`; the parent keys are unchanged. Verify with `composer test:unit`.

## 2. Wrap the nine services

- [x] 2.1 Wrap `paginated` in the collection, category, tag, brand and coupon services with `ListPaginator::from( $page, Model::query() )`. Keep the `@return Paginator` docblock. Verify with `composer phpcs:wporg` and `composer phpcs:docblocks`.
- [x] 2.2 Wrap `paginated` in the customer and variant services the same way (variant uses `Variant::query()`). Verify as in 2.1.
- [x] 2.3 Wrap `ProductService::paginated` with `Product::query()->where_not('status', ProductStatus::TRASHED)`. Leave `paginate_with_variants` unchanged. Verify as in 2.1.
- [x] 2.4 Wrap `OrderService::paginated_orders` with an `Order::query()` that adds `customer_id` only when the DTO has one (D3 order exception). Verify as in 2.1.
- [x] 2.5 Add to the list test of each of the nine endpoints (`BrandApiTest`, `CategoryApiTest`, `CollectionApiTest`, `CouponApiTest`, `CustomerApiTest`, `OrderApiTest`, `ProductApiTest`, `TagApiTest`, `VariantApiTest`): `has_records` is `false` on an empty table; `true` with rows; `true` when a search matches nothing. For products: `false` when only trashed products exist. Verify with `composer test:integration` for those files.

## 3. Frontend pages

- [x] 3.1 In the nine pages under `resources/app/features/*/pages/` (products, orders, inventory, collections, categories, tags, brands, customers, coupons), replace the derived `hasRecord` and its `@todo` with `data?.has_records !== false` (D6). Drop `hasActiveFilters` and `isFetching` from the destructuring only where this leaves them unused. Verify with `grep -rn "@todo: later will use" resources/app` returning nothing, then `npm run typecheck && npm test` in `resources/app/`.
- [x] 3.2 Check each page's existing test, if any, and add or update one case per page that `has_records: false` shows the first-use state and `total: 0` with `has_records: true` shows the table. Verify with `npm test` in `resources/app/`.

## 4. Docs

- [x] 4.1 Update `docs/data-table.md` section 7 (the "No filters, `total` of `0`" row, the sample page code and the "page number plays no part" paragraph) to say the page reads `has_records` from the list response. Add one short paragraph on the response key and on how a service changes its presence rule. Add a "Where this differs from" line only if the section already has one. Verify by reading the section against the final page code from 3.2.

## 5. Integration check

- [x] 5.1 Run `composer test`, `composer phpcs:wporg`, `composer phpcs:docblocks` and `npm run typecheck && npm test` in `resources/app/`. Verify all pass. Visual check of the nine empty states is left to the user (no browser verification in this project).
