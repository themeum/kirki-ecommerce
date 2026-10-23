# Proposal

## Why

An admin edit of an order gives wrong results now. An edited line keeps its old
unit price, but its totals use today's price. An order that has a deleted
product cannot be edited at all, and it cannot be cancelled either. Paid,
shipped and cancelled orders can be edited, and the backend has no rule that
stops this. The calculation preview and the saved order also use different
inputs: the order create and order update paths do not pass the tax profile,
but the preview does. The admin order-edit screen is next on the roadmap, and
it needs a backend it can trust. That backend must give one clear rule for
pricing, block edits that are not safe, and tell the client what changed
since the order was saved.

## What Changes

- **Edit = full sync to the current state.** When an order is saved, every
  line takes the current variant price, the current coupon rules, the current
  shipping and tax settings, and the current exchange rate. The edit has no
  price strategy, and it does not keep old prices.
- **Edit eligibility.** A new `Order::is_editable()` rule allows edits only
  when the order is not paid, not cancelled and not shipped. The order update
  endpoint and the order calculation endpoint (when it gets an `order_id`)
  return 422 for an order that is not editable. `OrderResource` and the admin
  `OrderListResource` expose `is_editable`.
- **Line rules on edit.**
  - A line whose variant (or product) was deleted is removed from the order
    when the order is saved.
  - A line whose product is now draft, scheduled, trashed or hidden stays on
    the order, and its quantity can change.
  - A new line accepts only products that can be bought, the same as create.
  - `max_per_order` applies to the full quantity.
  - Stock is checked only for the quantity added, because the old quantity is
    already reserved.
- **One calculation endpoint for create and edit.** `POST /calculate/order`
  accepts an optional `order_id`. The rest of the payload has the same shape
  as create.
- **Change detection (`current_state`).**
  - Each calculated item, each coupon, and the order root get a
    `current_state` array. The array holds string keys for each change since
    the order was last saved that affects the calculation (`item_deleted`,
    `price_changed`, `coupon_removed`, `coupon_changed`,
    `shipping_method_removed`, `shipping_cost_changed`, `tax_mode_changed`).
  - The array is empty when nothing changed, and it is always empty for
    create.
  - A new `OrderChangeDetector` service calculates these keys. The resource
    only maps them to the output.
- **Live stock data on each calculated item.** Each item gets
  `allow_back_order`, `track_inventory`, `available_quantity`, `in_stock`,
  `has_limit_per_order` and `max_per_order`, read from the variant now.
- **Removed coupons stay visible in an edit preview.** A coupon that is on
  the stored order but is no longer applied stays in the `coupons` list with
  `current_state: ["coupon_removed"]` and a zero discount. Create previews do
  not change: a rejected code is still not in the list, so the current
  create screen still works.
- **Deleted lines in the calculation.** Lines whose variant was deleted are
  shown as rows with `current_state: ["item_deleted"]`. These rows are not
  part of the totals.
- **Fixes in the same change:**
  - One shared context builder gives the same tax profile to the calculation
    preview, create and update.
  - The calculation no longer counts the order's own use against a coupon's
    total usage limit.
  - Cancelling or editing an order whose variant or coupon was deleted no
    longer fails.
  - An edit now refreshes `shipping_metadata`.
  - An edit cannot change the order's currency.

## Capabilities

### New Capabilities
- `order-editing`: when an order can be edited, and how an edit syncs the
  order's lines, prices, coupons, shipping, tax mode, currency and exchange
  rate to the current state, including deleted and unpublished products,
  stock and per-order limits.
- `order-change-detection`: the `current_state` keys that report, for each
  item, each coupon and the order root, what changed since the order was last
  saved that affects its calculation.

### Modified Capabilities
- `admin-order-calculation-breakdown`: the calculation payload accepts an
  `order_id`, keeps the stored coupons that were removed in the list with
  their state (edit only), shows deleted lines, and gives live stock data and
  `current_state` on each item, coupon and the root.

## Impact

- **API:**
  - `POST /calculate/order` gets a new optional `order_id` input.
  - Its response gets new item keys (`order_item_id`, six stock fields,
    `current_state`), coupon `current_state` and root `current_state`.
  - For an edit only, the response also has removed coupons in the `coupons`
    list and deleted-line rows. All changes are additive for create.
  - `PUT /orders/{id}` returns 422 for orders that cannot be edited, and for a
    currency change.
  - `GET /orders` and `GET /orders/{id}` get `is_editable`.
- **Code:**
  - `UpdateOrderAction`, `CreateOrderAction`, `OrderCalculationController`,
    `OrderCalculationRequest` and `OrderUpdateRequest` change.
  - `OrderCalculationResource`, `OrderResource` and `OrderListResource`
    change.
  - `DiscountService` (global usage-limit check), `PersistsOrderCoupons`,
    `InventoryService::release_all_reserved_stock` and the
    `OrderManager::mark_as_cancel` coupon release change.
  - New: `Order::is_editable()`, `App\Services\OrderCalculationContextBuilder`,
    `App\Services\OrderChangeDetector`, `App\DTO\Order\OrderChangesDTO`,
    `App\Constants\Order\OrderChangeState`.
- **No schema change.** No migration is needed.
- **Admin frontend:** not in scope. No frontend code changes in this change.
- **Docs:**
  - New `docs/order-editing.md`.
  - `docs/order-data-and-calculations.md` sections 7 and 9 change to show the
    new behavior and the decisions made.
