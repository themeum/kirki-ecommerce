# Proposal

## Why

Each top-level list page decides between its first-use empty state ("add your first item") and its normal
table with this guess: no filters are active and the server total is 0. The guess is marked `@todo` on all nine
pages. It is wrong in one case: while the first request is still loading, or after a request that returns no
total, the page cannot know if the table is truly empty. The server knows. It must say it.

## What Changes

- A new `ListPaginator` class extends the framework `Paginator`. It adds one value, `has_records`, to the
  paginated payload. `has_records` is `true` when the table holds at least one row, whatever the search or filters.
- `ListPaginator::from( $paginator, $has_records )` converts a normal paginator. The second argument is either
  a `bool`, or a fresh unfiltered query. A query is run with `exists()` only when the page total is 0. When
  the page has rows, `has_records` is already `true` and no extra query runs.
- The `paginated` method of nine services returns a `ListPaginator`: products, orders, variants (inventory),
  collections, categories, tags, brands, customers and coupons. No controller or resource changes.
  `Resource::paginated()` calls `to_array()`, so the key reaches the response by itself.
- A service that needs a different rule later (for example skip trashed rows) passes a different query.
  This change passes the plain model query for eight and a not-trashed query for products.
- The nine list pages read `data.has_records` and remove the `@todo` guess. The shared TypeScript type and
  Zod schema already declare `has_records` and do not change.

## Capabilities

### New Capabilities

- `list-record-presence`: a list endpoint reports whether its table holds any record at all, separate from
  the filtered result, and the list page uses that report to choose its empty state.

### Modified Capabilities

None. The empty-state presentation in `data-table` does not change. Only the source of the decision changes.

## Impact

- New: `app/Supports/ListPaginator.php`.
- `app/Services/{Product,Order,Variant,Collection,Category,Tag,Brand,Customer,Coupon}Service.php`
  (`paginated` / `paginated_orders` only).
- The nine pages under `resources/app/features/*/pages/`.
- `docs/data-table.md` (where the empty state gets its input).
- API: one new boolean key in the `data` object of nine list responses. No existing key changes. Not breaking.
- Not in scope: the `limit=ALL` branch in controllers (a hand-built `Paginator`, no empty state), storefront
  lists, and settings lists.
