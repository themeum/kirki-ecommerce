## Why

The five admin listing screens are meant to offer the merchant a consistent set of filter controls, but only three of them have a filter overlay at all, and two of the filters that do exist are silently broken. The Products collection filter is a no-op — the frontend sends `collection_ids` while the server only reads `collection_id`, so selecting a collection changes nothing. Inventory has full server-side filter support that the frontend never sends. Customers have no filters beyond search and date range. Orders cannot be filtered by delivery method at all, and their status filter exposes the raw fulfilment enum rather than the states a merchant recognises.

## What Changes

- **Products** — fix the broken collection filter and normalise brand/collection to single-value parameters end to end. **BREAKING**: previously-bookmarked product list URLs carrying `brand_ids=` or `collection_ids=` no longer apply a filter.
- **Inventory** — add a filter overlay (category, stock state, collection, brand) on top of the server-side support that already exists but is unused.
- **Customers** — add country and city filters, resolved against the customer's default shipping address. The option lists are drawn from the customers' own addresses, and city narrows to the selected country. Both the filter query and its option source are new server-side work.
- **Coupons** — no behaviour change; reject unknown filter values instead of silently returning an empty list.
- **Orders** — replace the raw fulfilment-status control with a single status control whose options are the states a merchant recognises, each resolved server-side to the right underlying condition. Add a delivery-method filter, whose options come from the shipping methods defined in settings.
- Every filter overlay draws its draft, apply, clear and count behaviour from one shared implementation rather than restating it per screen.

Explicitly out of scope, deferred to a later change: the customer **Tags** filter (its storage — a JSON-encoded column with no relation — needs a decision that does not belong inside a filter change), and multi-selection for brand and collection.

## Capabilities

### New Capabilities

- `catalog-list-filters`: which filters the product and inventory lists offer, what each one narrows by, and how catalog filters combine with search, sorting and paging.
- `customer-list-filters`: filtering customers by location, which address that location is read from, where the option lists come from, and how the city control depends on the country control.
- `coupon-list-filters`: filtering coupons by their derived lifecycle status, their method, and their discount type, including how an unrecognised value is rejected.
- `order-list-filters`: filtering orders by the merchant-facing status states, payment status, and delivery method, including how a status the merchant selects maps onto the order's underlying fulfilment, payment and lifecycle state.

### Modified Capabilities

<!-- None. The overlay mechanics in `data-table-filter-popover` and the address binding in
     `data-table-params-binding` are unchanged; this change supplies filter controls into
     the existing overlay and consolidates the per-feature duplication behind it. -->

## Impact

**Frontend** (`resources/app/`)
- New shared `useFilterDraft` hook; the products, coupons and orders filter overlays migrate onto it.
- New filter overlays for the inventory and customer lists.
- Filter configuration and list-parameter typing for the inventory and customer features, which currently declare none.
- The inventory and customer list services widen from bare list parameters to typed filter parameters.

**Backend** (`app/`)
- `ProductListFilterDTO` loses its unused plural brand field; the product collection filter starts working.
- New list request classes for customers, coupons and orders, so filter values are validated rather than reaching the query untouched.
- New customer list filter DTO, customer location filtering, and an endpoint exposing the distinct locations present in the customer base.
- A new order status filter scope, and delivery-method filtering on the order list.

**Docs** — `docs/data-table.md` gains the per-screen filter inventory and the shared draft-hook contract.

**Tests** — filter coverage across the five list endpoints (currently zero), plus unit coverage for the shared draft hook.
