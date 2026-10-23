# Proposal

## Why

An admin edit of an order gives wrong results now. An edited line keeps its old
unit price, but its totals use today's price. An order that has a deleted
product cannot be edited at all, and it cannot be cancelled either. Paid,
shipped and cancelled orders can be edited, and the backend has no rule that
stops this. The calculation preview and the saved order also use different
inputs: the order create and order update paths do not pass the tax profile,
but the preview does. The admin order-edit screen is next on the roadmap, and
it needs a backend it can trust.

The store made a promise to the customer when the order was placed: the
product price, the coupon discount, the exchange rate, and the shipping and
tax for the delivery address. An edit must keep that promise. It must not
re-price the order to today's catalog. Only the shipping and the tax can
change, and only when the delivery address changes to a place the store never
quoted.

## What Changes

- **Edit = freeze what was promised.** The order's own stored values are the
  source for an edit. Each existing line keeps its stored unit price. Each
  stored coupon keeps its stored discount terms. The order keeps its stored
  exchange rate, shipping cost, tax rates and tax-inclusive setting. The edit
  has no price strategy, and it never reads the live catalog price of an
  existing line.
- **Address change is the one re-sync.** When the delivery country or state
  changes, the shipping cost and the tax rates are calculated again from the
  current settings. When they do not change, the stored shipping cost and the
  stored tax rates are used.
- **Edit eligibility.** A new `Order::is_editable()` rule allows edits only
  when the order is not paid, not cancelled and not shipped. The order update
  endpoint and the order calculation endpoint (when it gets an `order_id`)
  return 422 for an order that is not editable. `OrderResource` and the admin
  `OrderListResource` expose `is_editable`.
- **Lines are identified by `order_item_id`.** An existing line is sent with
  its `order_item_id`. A new line is sent with a `variant_id`. A line whose
  variant was deleted stays on the order with its stored values, because it can
  now be identified without a variant.
- **Line rules on edit.**
  - A line whose product is not reachable (the variant or product was deleted,
    or the product is draft, scheduled, trashed or hidden) is locked: its
    quantity cannot go up or down. The line can still be removed.
  - When a quantity goes up, the live stock is checked for the added quantity.
    When a quantity goes down, the stock is released.
  - `max_per_order` only blocks an increase. A quantity can go up only to the
    current limit, and the stored quantity is always kept.
  - A new line accepts only products that can be bought, the same as create.
- **Coupons are locked.** A stored coupon is priced from the stored values
  (its type, target and rate or amount, and which lines it discounted). It is
  not checked again, so it still applies when the coupon is expired, over its
  limit or deleted. An order-wide coupon also discounts a line that is added in
  the edit. A coupon for specific products never discounts a new line. An admin
  can remove a stored coupon. A removed coupon that was deleted cannot be added
  again.
- **Coupon snapshot columns:** `order_coupons.discount_rate` holds the percent
  rate. `base_max_discount_amount` on `order_coupons` and `order_item_coupons`
  keeps the original fixed discount independently of the currently applied
  amount, so a capped edit cannot reduce the promise for later edits. The
  columns go into the existing create-table migrations. The feature is not
  released, so there is no backfill.
- **One calculation endpoint for create and edit.** `POST /calculate/order`
  accepts an optional `order_id`. The rest of the payload has the same shape
  as create, except that an existing line is sent with `order_item_id`.
- **Per line, the preview says if the line is reachable.** Each calculated item
  gets `is_reachable` and the live stock data (`allow_back_order`,
  `track_inventory`, `available_quantity`, `in_stock`, `has_limit_per_order`,
  `max_per_order`). The client shows one badge for a line that is not reachable
  and disables its quantity buttons. There is no badge for a price change.
- **Fixes in the same change:**
  - One shared context builder gives the same tax profile to the calculation
    preview, create and update.
  - Cancelling or editing an order whose variant or coupon was deleted no
    longer fails.
  - An edit cannot change the order's currency.

## Capabilities

### New Capabilities
- `order-editing`: when an order can be edited, and how an edit keeps the
  order's frozen prices, coupons, exchange rate, shipping and tax, re-syncs
  shipping and tax only for an address change, and applies the stock, limit and
  reachability rules to quantity changes.

### Modified Capabilities
- `admin-order-calculation-breakdown`: the calculation payload accepts an
  `order_id` and `order_item_id` per line, and gives `is_reachable` and live
  stock data on each item.

### Removed From The Earlier Plan
- `order-change-detection` (the `current_state` keys, the change detector and
  the removed-coupon and deleted-line rows). The stored columns now hold what
  the edit needs, so nothing has to be compared with the live catalog.

## Impact

- **API:**
  - `POST /calculate/order` gets a new optional `order_id` input and an
    optional `order_item_id` on each line.
  - Its response gets new item keys (`order_item_id`, `is_reachable`, six stock
    fields).
  - `PUT /orders/{id}` takes `order_item_id` on existing lines, and returns 422
    for orders that cannot be edited, for a currency change, and for a quantity
    change on a line that is not reachable.
  - `GET /orders` and `GET /orders/{id}` get `is_editable`.
- **Code:**
  - `UpdateOrderAction`, `CreateOrderAction`, `OrderCalculationController`,
    `OrderCalculationRequest` and `OrderUpdateRequest` change.
  - `OrderCalculationResource`, `OrderResource` and `OrderListResource`
    change.
  - `DiscountService` (a path for stored coupons) and the calculation engine
    (results are keyed by a line key, not by `variant_id`) change.
  - `PersistsOrderCoupons`, `InventoryService::release_all_reserved_stock` and
    the `OrderManager::mark_as_cancel` coupon release change.
  - New: `Order::is_editable()` and `App\Services\OrderCalculationContextBuilder`.
  - Removed from the earlier work: `OrderChangeDetector`, `OrderChangesDTO`,
    `OrderChangeState`, `OrderService::holds_coupon_usage` and the total-limit
    change in `DiscountService`.
- **Schema:** three nullable coupon snapshot columns added in the existing
  create-table migrations. No new migration and no backfill.
- **Admin frontend:** not in scope. No frontend code changes in this change.
- **Docs:**
  - New `docs/order-editing.md`.
  - `docs/order-data-and-calculations.md` sections 7 and 9 change to show the
    new behavior and the decisions made.
