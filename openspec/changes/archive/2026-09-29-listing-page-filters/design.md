## Context

See `proposal.md` — Why. The constraints that shape the approach:

- **The overlay already exists and is not changing.** `DataTableFilterPopover` is a dumb shell
  (`appliedCount`, `onApply`, `onClear`, `onOpen`, `onClose`, `children`); `useListParams` /
  `useDataTableParams` already own URL serialization, page reset and selection reset. This change
  supplies controls into that shell — it does not touch the shell or the address binding.
- **There is no repository layer.** Every list query is built inside a `*Service::list_query()` /
  `apply_filters()` with the framework `QueryBuilder`. Filters are hand-rolled `when()` chains;
  there is no generic filter abstraction to extend.
- **The query builder has no JSON helper.** `where_json_contains` and friends do not exist. This is
  why the customer Tags filter is out of scope.
- **`order_status` is derived, not independent.** It is the `(fulfillment_status, payment_status)`
  pair, resolved through `resources/data/order-state-matrix.json`. Filtering it as a flat enum would
  let a merchant build guaranteed-empty combinations against the separate payment status control.
- **The refund cluster is unimplemented.** `OrderStatus::get_transition_matrix()` carries a TODO
  saying `REFUND_REQUESTED`, `REFUND_IN_PROGRESS`, `REFUNDED`, `REFUND_DECLINED`,
  `RETURNED_PENDING_REFUND` and `REFUNDED_PARTIALLY` are not in the matrix yet.

## Goals / Non-Goals

**Goals:**
- Every control the specs describe works end to end, backed by a test that fails before the change.
- The five filter overlays stop each hand-rolling draft/apply/clear/count.
- New filter parameters are validated at the request boundary, like products and variants already are.

**Non-Goals:**
- No change to `DataTableFilterPopover`, `useListParams`, `useDataTableParams`, or the parsers in
  `types/list-state.ts`.
- No new filter *presentation* primitives. `Select`, `MultiSelect` and `Combobox` cover every control.
- No generic filter-config DSL. See the first decision below.
- No change to how orders reach their statuses — only to how they are queried.

## Decisions

### A shared draft hook, not a declarative filter DSL

`useFilterDraft` owns exactly what all five overlays duplicate: draft state seeded from `params` on
open, `'all'`/empty → `undefined` resolution on apply, `appliedCount`, and `handleApply`/`handleClear`
writing through `setParams`. Each feature still writes its own field controls.

*Alternative considered:* a descriptor type (name, label, control kind, options source, single/multi,
default) generating both the `ListFilterConfig` parsers and the rendered controls — adding a filter
becomes one array entry. Rejected: it is a mini-framework whose escape hatches get awkward fast, and
the country-dependent city control would need one immediately. The duplication that actually hurts is
the state machinery, not the JSX.

### Orders: a mapped status scope, not the raw enum

A new `Order::scope_apply_status_filter($status)` resolves each merchant-facing option to the
condition that defines it, mirroring the existing `Coupon::scope_apply_status_filter()`:

| Option | Resolved against |
|---|---|
| order placed | `fulfillment_status = unfulfilled` |
| order processing | `fulfillment_status = processing` |
| order on hold | `fulfillment_status = on-hold` |
| order shipped | `fulfillment_status = shipped` |
| order delivered | `fulfillment_status = delivered` |
| order returned | `fulfillment_status = returned` |
| order cancelled | `fulfillment_status = cancelled` |
| payment failed | `payment_status = failed` |
| refund in progress | `payment_status = refunding` |
| refunded | `payment_status = refunded` |
| refund requested | `order_status = refund_requested` |
| refund declined | `order_status = refund_declined` |

*Alternatives considered:* (1) keep the raw `FulfillmentStatus` enum — the refund options in the
design become unreachable; (2) expose the 24 composite `OrderStatus` values — "order shipped" would
become three near-identical options, and combining it with the payment status control would produce
contradictions. The scope keeps the merchant's vocabulary and the data model honest at the same time.

The mapping lives on the model, not in the frontend, so the option labels and the conditions cannot
drift apart across the API boundary.

### Delivery method: match the stored method id, options from settings

`orders.shipping_method` stores the zone-method id; the name and type live in the
`shipping_metadata` snapshot. The filter is a plain `where('shipping_method', $id)`. Options come
from a new `ShippingService::get_all_shipping_methods()` collecting enabled methods across all
enabled zones, deduped by id, exposed through a small endpoint returning `{id, name, type}`.

*Alternatives considered:* (1) derive options from distinct values present in the orders table —
never offers a zero-result option and survives a method being deleted from settings, at the cost of
an extra query and an endpoint that scans orders; (2) filter on the method *type* from the JSON
snapshot — only three coarse options and needs raw JSON SQL. (1) remains the upgrade path if
deleted-method orders become a real complaint.

*Alternative for delivery:* the orders page could read the existing settings endpoint and derive the
list client-side, avoiding a new route. Rejected — it pulls the whole shipping settings blob
(including money conversions) into a list screen that needs three fields per method.

### Customers: shipping address, and city depends on country

Location is read from the customer's **default shipping address**, via
`where_has('shipping_address', ...)` on the existing relation. A new endpoint returns the distinct
country/city pairs present on those addresses, accepting an optional country to scope the cities.

Two consequences worth stating plainly:

- The customer table's Location column is rendered from **billing** address
  (`CustomerListResource`). A customer whose billing and shipping countries differ can therefore be
  matched by a filter that disagrees with the column shown. This is a known inconsistency, not an
  oversight — see Risks.
- A customer with no default shipping address drops out of the list whenever either location filter
  is in force, which is why the spec states it explicitly.

### Brand and collection become singular — on the admin list only

The **admin** product list sends `brand_id` and `collection_id` scalars. This fixes the silently-dead
collection filter (the frontend sent `collection_ids`, the service reads `collection_id`) and aligns
the admin list with the singular naming `VariantListFilterDTO` already uses.

**Correction to an earlier reading of the code:** `ProductListFilterDTO::$brand_ids` and its
`where_in('brand_id', ...)` branch are *not* dead. The storefront shop page passes `brand_ids` as an
array through `ShopPageFilterRequest` → `ProductService::shop_page_data()` → the same DTO, so it is
live multi-brand filtering for shoppers. Both stay. What changes is only that the admin list stops
sending `brand_ids` — which was the reason it bypassed `ProductListRequest`, since that request never
declared the key. `collection_ids` has no such storefront use and is genuinely dead.

### Validation at the request boundary

New `CustomerListRequest`, `OrderListRequest` and `CouponListRequest` mirroring `ProductListRequest`,
with `in:` rules built from the existing constants classes. Today an unrecognised coupon status falls
through `scope_apply_status_filter`'s switch and returns everything or nothing depending on the value
— indistinguishable from a legitimate empty result.

## Risks / Trade-offs

- **Refund status options may match nothing.** The refund-cluster lifecycle states are flagged
  unimplemented in the state matrix, so `refund requested` and `refund declined` can return empty
  lists until refunds ship. → Keep them; they are specified behaviour and become correct for free
  when refunds land. Note it in the docs so an empty result is not read as a filter bug.
- **No status column to corroborate an orders filter.** The orders table renders fulfilment and
  payment badges, not a status badge, so filtering by `refund requested` shows rows whose visible
  badges say something else. → Out of scope to change the columns here; flag it for review as a
  possible follow-up.
- **Customer location filter can disagree with the Location column** (shipping vs billing, above). →
  Accepted deliberately; revisit by switching the column to shipping, or showing both, in a
  follow-up.
- **Bookmarked product URLs break.** `brand_ids=` / `collection_ids=` in a saved address stop
  applying. → Accepted; the collection form never worked anyway, and no redirect shim is worth
  carrying for an admin-only screen.
- **Deleted shipping methods vanish from the delivery filter** while orders still reference them. →
  Accepted; the orders-table-derived option source is the documented upgrade path.
- **Migrating three working overlays onto a new hook can regress them.** → Products, Coupons and
  Orders each keep their existing behaviour under test; migrate one per task, not all at once.

## Migration Plan

No data migration and no schema change. Deployment is a plugin build; rollback is a revert. The one
externally visible break is the product brand/collection parameter rename, covered above.

## Open Questions

None — the design questions were settled before this change was written; see the decisions table in
`proposal.md` and the mapping table above.
