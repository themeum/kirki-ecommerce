# Design

## Context

See proposal.md (Why) for the problems. The requirements are in
`specs/order-editing`, `specs/order-change-detection` and
`specs/admin-order-calculation-breakdown`.

Current state that shapes the approach:

- **Three copies of the calculation-item code.**
  `OrderCalculationController::prepare_items()`,
  `CreateOrderAction::prepare_context_items()` and
  `UpdateOrderAction::prepare_context_items()` each build `CalculationItemDTO`s.
  Only the controller sets `tax_profile_id`. Only create checks
  `is_available()` and `max_per_order`. `CreateOrderAction` is also used by the
  storefront checkout (`CheckoutController`).
- **The engine does not care where a price comes from.**
  `RecalculateCartAction` prices each item from `base_unit_price` and
  `base_product_total` on the DTO. Its results, `DiscountService`'s
  `remaining_per_item`, and `PersistsOrderCoupons` all use `variant_id` as the
  key. The engine needs no change.
- **Deletes are hard deletes.**
  - A product delete removes its variants (`fk_kecom_variants_product_id`
    cascades).
  - A variant delete sets `order_items.variant_id` to NULL. A product delete
    also sets `order_items.product_id` to NULL.
  - A coupon delete sets `order_coupons.coupon_id` to NULL.
  - `InventoryService::release_reserved_stock(int)` and
    `CouponService::release_usage(int)` then get NULL. This is a TypeError in
    PHP 7.4, so cancel and edit fail.
- **The order already stores the data that change detection needs:**
  - Per line: `base_catalog_sale_price` and `base_catalog_regular_price`.
  - Per order: `base_shipping_total`, `shipping_method` and `is_tax_inclusive`.
  - Per order coupon: `coupon_snapshot` (`Coupon::to_array()` with its
    `categories`, `products` and `customers` relations, because
    `CouponService::find_by_codes()` eager-loads them).
- **The coupon usage checks.** `DiscountService::validate_conditions()` checks
  the total limit as `current_usage_count >= usage_limit`, so it counts this
  order's own use. The per-customer check already gets `order_id` and leaves
  this order out.
- **Locking.** `UpdateOrderAction` already locks the order row
  (`OrderService::lock_order`) inside its transaction. But it builds the
  context and runs the calculation **before** it takes the lock.
- **Currency.** `OrderUpdateRequest::prepare_for_validation()` uses the
  visitor's display currency as `currency_code` when none is sent.

## Goals / Non-Goals

**Goals:**
- One way to build calculation items, used by the preview, create, checkout
  and update, so that the preview and the save cannot differ.
- Every comparison for change detection is in one class. The resource only
  maps the results.
- The engine (`RecalculateCartAction`, tax strategies, discount allocation) has
  no change in its logic. The only engine-side change is the total-limit fix
  in `DiscountService`.
- No schema change and no migration.

**Non-Goals:**
- The admin edit screen (frontend).
- Editing paid orders, and changes to payment when a total changes.
- Keeping old prices, mixed prices on one line, or a price-strategy input.
- Edit history, timeline entries for edits, and customer emails about edits.
- Changing how the cart builds its context (`CalculationContextDTO::from_cart`).
- Fixing legacy orders that hold two lines for one variant (see Risks).

## Decisions

### D1. `Order::is_editable()` holds the edit rule

The rule is a model method, the same as the existing `Variant::is_available()`.
It reads only `payment_status`, `cancelled_at` and `fulfillment_status`, so the
order list can call it for each row with no extra query. It uses two allow
lists:
- `EDITABLE_PAYMENT_STATUSES = [pending, unpaid, failed]`
- `EDITABLE_FULFILLMENT_STATUSES = [unfulfilled, processing, on-hold]`

When the rule changes later, only these lists change.

*Alternatives:*
- A `Policies/OrderPolicy`. In this codebase, policies decide **user**
  permission (`BrandPolicy`), not entity state.
- A method on `OrderService`. It is harder to call from resources.

### D2. `App\Services\OrderCalculationContextBuilder` replaces the three item builders

Public methods:
- `build_items(array $items, ?Order $order, bool $is_saving): Collection`
- `build(array $payload, ?Order $order, bool $is_saving): CalculationContextDTO`

The builder handles the address, customer, coupon and shipping fields that
are the same in all three callers. The controller passes `$request->all()`.
The actions pass their payload DTO as an array.

For each payload line, the builder does the following:
1. Rejects a variant ID that is already used on another line (422).
2. Loads the variant. If the variant is missing or has no product → 404, the
   same as today.
3. Decides whether the line is **existing** or **new**. A line is existing
   when `$order` has a line with the same `variant_id`. Otherwise it is new.
   A new line must pass `Variant::is_available()` (422). An existing line
   skips this check, so a draft, scheduled, trashed or hidden product can
   still be edited.
4. When `$is_saving` is true, it rejects `has_limit_per_order &&
   max_per_order < quantity` (422) for every line. The preview does not
   enforce this rule (see spec), and it does not enforce stock.
5. Fills the DTO the same way for every caller:
   - `base_unit_price = base_sale_price ?: base_price`
   - `base_product_total = base_price`
   - `tax_profile_id = variant ?: product`
   - weight, shipping profile and categories
   - `id` = the payload index, which the calculation response returns as `id`

It also keeps the loaded variants in a variant map that the actions read
(this replaces `$variants_map` in both actions).

**Effect on checkout.** Checkout now also passes `tax_profile_id`. This is
the same value the cart preview (`from_cart`) already uses. Today a checkout
order can therefore have different tax from the cart total that the customer
saw, and this change fixes that. Checkout payloads come from the cart, which
already keeps one line per variant, so the duplicate rule does not affect
checkout.

*Alternative:* add the missing lines to each of the three copies. The copies
already differ, and they would differ again.

### D3. Lines match by `variant_id`

There is no `order_item_id` input. One variant has only one line (D2 step 1).
Deleted lines have a NULL `variant_id`, so they can never match, and the
client cannot send them. This keeps the engine and the coupon attribution
code (both use `variant_id` as the key) unchanged.

*Alternative:* match by `order_item_id`. That needs a different key all
through the engine and the attribution code, and it gives no extra benefit
when one variant has only one line.

### D4. The save is ordered: lock → check → build → calculate → write

`UpdateOrderAction::execute()` changes to this order:
1. Begin the transaction.
2. `lock_order($id)`.
3. Load the order.
4. If `!$order->is_editable()` → 422.
5. Check the currency. If a currency was sent and it is not
   `$order->currency_code` → 422. Otherwise use `$order->currency_code`.
6. Build the context with the builder (`$is_saving = true`).
7. Check that the shipping method is valid.
8. Calculate.
9. Sync the items, the order, the coupons and the taxes.

Building and calculating after the lock removes a race: the order could be
paid or changed between the calculation and the lock. The calculation is
read-only, so holding the lock while it runs costs only time.

`OrderUpdateRequest::prepare_for_validation()` no longer sets a default
currency code.

### D5. Item sync on save

`sync_order_items()` keeps its add / update / delete logic, but with these
changes:
- A stored line with a NULL `variant_id`, or one whose variant no longer
  exists, is deleted with **no** stock release.
- A stored line whose variant is not in the payload is deleted, and its full
  quantity of stock is released (as today).
- An existing line gets a full fresh snapshot. One shared
  `fill_order_item_dto()` fills both the create-item DTO and the update-item
  DTO from the variant and the calculated item. So the name, SKU, barcode,
  image, weight, `product_data`, `price`, `regular_price` and the catalog
  prices all come from the current variant. This removes the mixed old-price
  and new-total problem.
- For stock, the code calls `has_stock` / `reserve_stock` for the increase
  only, and `release_reserved_stock` for the decrease (as today).
  `reserve_available` is already atomic.

### D6. One method gives the exchange rate

`UpdateOrderAction::resolve_exchange_rate(Order $order)` returns
`Currency::exchange_rate($order->currency_code)`. This is the latest rate.
To keep the order's original rate later, change only this method to return
`$order->exchange_rate`.

### D7. `shipping_metadata` refresh

`build_shipping_method_snapshot()` moves from `CreateOrderAction` to a place
both actions can use. Create and update both write it.

### D8. `OrderChangeDetector` with one method per level; results in `OrderChangesDTO`

`App\Services\OrderChangeDetector::detect(Order $order, CalculationContextDTO $context, CalculationResultDTO $result): OrderChangesDTO`
calls three protected methods:

- `detect_item_states()`
  - For each stored line with no live variant (`variant_id` NULL, or the
    variant is missing): `item_states[order_item_id] = [ITEM_DELETED]`, and
    the line is added to `deleted_items`.
  - For each calculated item that matches a stored line (by variant): if the
    variant's current `base_sale_price ?: base_price` is not equal to
    `base_catalog_sale_price`, or its `base_price` is not equal to
    `base_catalog_regular_price`, then
    `item_states[order_item_id] = [PRICE_CHANGED]`.
- `detect_coupon_states()`
  - For each stored order coupon whose code is not in
    `$result->coupon_results`: `coupon_states[code] = [COUPON_REMOVED]`, and
    the record is added to `removed_coupons`.
  - For each applied coupon that is also on the stored order: compare the
    rule fields with `coupon_snapshot` (see below). If they differ,
    `coupon_states[code] = [COUPON_CHANGED]`.
- `detect_order_state()`
  - If `context->shipping_method_id === order->shipping_method` and
    `ShippingService::get_selected_shipping_method($context)` is null →
    `SHIPPING_METHOD_REMOVED`.
  - Else if `result->base_shipping_total !== order->base_shipping_total` →
    `SHIPPING_COST_CHANGED`.
  - Separately: if `Tax::is_tax_inclusive() !== (bool) order->is_tax_inclusive`
    → `TAX_MODE_CHANGED`.

`OrderChangesDTO` has these fields:
- `order_state`: `string[]`
- `item_states`: `array<int, string[]>`, keyed by order item ID
- `coupon_states`: `array<string, string[]>`, keyed by code, because a
  deleted coupon has no ID
- `deleted_items`: `OrderItem[]`
- `removed_coupons`: `OrderCoupon[]`

The two lists exist so the resource does not have to search the order again.
For create, the controller uses `new OrderChangesDTO()`, which is all empty.

The keys are constants on `App\Constants\Order\OrderChangeState` (a `final`
constants class).

`current_state` is an array, as the user asked. Only the order root can hold
more than one key today (a shipping key + `tax_mode_changed`). Items and
coupons hold at most one key, because the removed or deleted key replaces all
other keys. An array lets a future key be added without a change to the
payload shape.

**Fields compared for `coupon_changed`:**
- `discount_type`, `discount_target`, `discount_value_type`
- `base_discount_amount_fixed`, `discount_amount_percentage`
- `eligible_item_type`, `reward_quantity`, `reward_value`
- the sorted list of `products` IDs with their `is_reward_item` flag
- the sorted list of `categories` IDs

The detector reads these from `coupon_snapshot` and from the live coupon.
When it compares, it casts each value to the type in the `Coupon` model
casts, so `"10"` and `10` are equal. When the snapshot is empty, it does not
report `coupon_changed`.

These are the only fields that change how much a valid coupon discounts.
Fields that decide only whether the coupon applies (dates, limits, spend
conditions, countries, customers, active flag) lead to `coupon_removed`, or
to nothing.

*Why use the snapshot:* the discount value is stored only in
`coupon_snapshot`. The user's rule "do not read `product_data` JSON" was about
order items, which have real columns for every compared value. For coupons,
no other source exists.

*Alternative:* compare `order_coupons.base_discount_amount`. This flags every
quantity edit that changes a percentage discount. The user rejected it.

*Alternative:* one detector class per level. The user chose one class with
one method per level. Split the class later only if it grows.

### D9. Resource mapping

`OrderCalculationController` passes `order` (or null) and `changes` to
`OrderCalculationResource::make([...])`. The resource adds these keys:

- **Each calculated item:**
  - `order_item_id`, from a map of stored lines by `variant_id`.
  - `current_state = changes->item_states[order_item_id] ?? []`.
  - The six stock fields, from the variant. The detector or builder variant
    map gives the variant, so there are no extra queries.
- **One row for each `deleted_items` line**, added after the calculated
  items. It has:
  - `id = null`, `order_item_id`, and the stored `quantity`
  - money objects from the stored base values
  - `applied_product_coupons = []`
  - null stock fields, and `current_state = ["item_deleted"]`

  These rows are not counted in `totals` or `items_count`. The resource
  computes those totals from `$result->items` only, as today.
- **Each applied coupon:**
  - `current_state = changes->coupon_states[code] ?? []`.
- **One entry for each `removed_coupons` record:**
  - `code`, `title`, `discount_type` and `discount_target` from the order
    coupon.
  - `discount_value_type`, `discount_amount_percentage` and
    `base_discount_amount_fixed_money_object` from the live coupon when it
    exists, otherwise from the snapshot, otherwise null.
  - A zero `base_discount_amount_money_object`.
  - `current_state = ["coupon_removed"]`.
- **Root:**
  - `current_state = changes->order_state`.

### D10. Total usage limit leaves out the order's own use

In `DiscountService::validate_conditions()`, the system subtracts 1 from
`current_usage_count` when `context->order_id` holds an active
(`usage_reversed_at` IS NULL) `order_coupons` row for this coupon. A new
`OrderService::holds_coupon_usage($order_id, $coupon_id)` does this lookup.
Only coupons with a usage limit run it.

The save path is already correct: `PersistsOrderCoupons` does not claim a
use again for a coupon that the order already holds. The atomic
`claim_usage` still protects new coupons.

### D11. Null-safe releases

- `InventoryService::release_all_reserved_stock()` skips items with an empty
  `variant_id`.
- `OrderManager::mark_as_cancel()` skips `release_usage` for an order coupon
  with an empty `coupon_id`, but still sets `usage_reversed_at`.
- In `PersistsOrderCoupons::sync_order_coupons()`, records with a NULL
  `coupon_id` stay out of `$existing_order_coupons_by_coupon_id`. They are
  deleted with the rest, and they never reach `release_usage`.

### Corrections during implementation

- **D9, removed coupons.** A removed coupon's entry takes `discount_value_type`,
  `discount_amount_percentage` and `base_discount_amount_fixed` from the
  stored `coupon_snapshot` only, not from the live coupon. This needs no extra
  query, and it shows the terms that the order had when it was last saved.
- **D9, controller wiring.** The route's constructor injection builds classes
  by reflection and does not use container bindings, so it cannot build
  `ShippingService`. For that reason `OrderChangeDetector` (which needs
  `ShippingService`) is a parameter of `OrderCalculationController::get()`,
  in the same way as `RecalculateCartAction`, and is not a constructor
  dependency. The builder's variant map is passed to the resource as
  `variants`, so the stock fields need no extra queries.
- **Missing order is 404.** `OrderService::find_order_or_fail()` throws a
  `NotFoundException` with no status code, which the API turns into HTTP 500.
  The preview controller and `UpdateOrderAction` use `find_order()` and throw
  the 404 themselves. `find_order_or_fail()` did not change, because other
  endpoints use it.
- **Pre-existing preview error.** `OrderCalculationResource` read
  `$result->shipping_method`, a property that `CalculationResultDTO` does not
  have. When notices were on, every preview returned HTTP 500. The resource now
  returns the selected method's ID (or null when it is not available). The
  create screen uses this value only when it is not null, so its behavior does
  not change.
- **D2, category loading.** The builder calls `load_missing('categories')`, not
  `load('categories')`. The data is the same, and categories that are already
  loaded are not queried again.
- **D7, snapshot method.** The shipping snapshot builder is now
  `ShippingService::get_selected_shipping_method_snapshot()`.

## Risks / Trade-offs

- **Sync re-prices every line on any edit.**
  - [Risk] An address-only edit changes the totals when prices changed.
  - → Mitigation: the preview shows `price_changed`, `coupon_*`,
    `shipping_*` and `tax_mode_changed` before the save. Only unpaid orders
    can be edited.
- **Online payment already started.**
  - [Risk] A PayPal order made for the old total is approved after an edit.
  - → Mitigation: PayPal already compares the capture with
    `orders.invoiced_total`, and it puts a mismatched order on hold
    (`hold_order_for_unmatched_capture`), so the order is not marked paid for
    the wrong amount.
  - Blocking edits while a transaction is open is left for later.
- **Checkout behavior changes slightly.**
  - [Risk] Checkout orders now get a tax profile, so stores whose tax rules
    use profiles can see different tax on new orders.
  - → Mitigation: the tax now matches the cart preview that the customer saw.
    The integration tests cover profile-based tax for the preview, create and
    update.
- **Legacy orders with two lines for one variant.**
  - [Risk] Old orders may hold two lines for one variant (create never
    blocked it). Matching by variant uses only one of them.
  - → Mitigation: from now on, create rejects duplicates. Stored duplicates
    are not repaired. This is documented as a known gap.
- **Snapshot shape drift.**
  - [Risk] `coupon_snapshot` is whatever `Coupon::to_array()` gave at save
    time. If the coupon model changes, old snapshots can miss fields.
  - → Mitigation: a missing field is treated as "not compared" (no
    `coupon_changed`), never as a change.
- **Lock held during the calculation.**
  - [Risk] Saves of the same order wait longer.
  - → Mitigation: the calculation is quick, and only saves of the same order
    are serialized.

## Migration Plan

- No schema change. Deploy as normal. Existing orders work right away.
  Orders saved before this change still have `coupon_snapshot`,
  `base_shipping_total` and the catalog prices, so detection works for them.
- Rollback: revert the code. No data needs to be undone. Orders edited under
  the new code store only values the old code also writes.
