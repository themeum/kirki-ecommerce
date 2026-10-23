# Design

## Context

See proposal.md (Why) for the problems. The requirements are in
`specs/order-editing` and `specs/admin-order-calculation-breakdown`.

**The decision that shapes this design:** an edit freezes the pricing that
the customer was promised. The order's own stored columns are the source of
truth for line prices, coupon terms, the exchange rate, the tax-inclusive
setting, the shipping cost and the tax rates. The live catalog is read only
for: new lines, stock and limit checks, whether a line is reachable, coupons
that are new to the order, and shipping and tax when the delivery address
changes.

Current state that shapes the approach:

- **Three copies of the calculation-item code.**
  `OrderCalculationController::prepare_items()`,
  `CreateOrderAction::prepare_context_items()` and
  `UpdateOrderAction::prepare_context_items()` each build `CalculationItemDTO`s.
  Only the controller sets `tax_profile_id`. Only create checks
  `is_available()` and `max_per_order`. `CreateOrderAction` is also used by the
  storefront checkout (`CheckoutController`).
- **The engine keys its results by `variant_id`.** `RecalculateCartAction`,
  `DiscountService` (`remaining_per_item`, `item_discounts`) and
  `PersistsOrderCoupons` all use `variant_id` as the line key. A line whose
  variant was deleted has a NULL `variant_id`, so it cannot be a key.
- **How `DiscountService` prices a coupon** (this is what a stored coupon must
  reproduce):
  - A product-scope coupon discounts each eligible line on its own. A percent
    coupon takes the percent of the line subtotal. A fixed coupon takes the
    fixed amount for the line, capped at the line subtotal. The fixed amount
    does not grow with the quantity.
  - An order-scope coupon runs after the product coupons. A percent coupon
    takes the percent of the subtotal that is left. A fixed coupon takes the
    fixed total, capped at the subtotal that is left. The total is shared over
    the lines by their remaining subtotal (`allocate_by_weight`).
  - A free-shipping coupon waives up to the shipping subtotal.
- **What the order stores** (all in columns, no JSON needed):
  - `order_items`: `base_catalog_sale_price`, `base_catalog_regular_price`,
    the discount and tax columns, and `quantity`.
  - `order_coupons`: `code`, `discount_type`, `discount_target`,
    `base_discount_amount` and `usage_reversed_at`.
  - `order_item_coupons`: the share of each coupon on each line.
  - `order_taxes`: the tax name and rate for each line and for shipping.
  - `orders`: `exchange_rate`, `currency_code`, `is_tax_inclusive`,
    `base_shipping_total`, `shipping_method`, `shipping_metadata` and the
    addresses.
  - **One value is missing:** the percent rate of a percent coupon. The new
    `order_coupons.discount_rate` column holds it (D6).
- **Deletes are hard deletes.**
  - A product delete removes its variants (`fk_kecom_variants_product_id`
    cascades).
  - A variant delete sets `order_items.variant_id` to NULL. A product delete
    also sets `order_items.product_id` to NULL.
  - A coupon delete sets `order_coupons.coupon_id` to NULL.
  - `InventoryService::release_reserved_stock(int)` and
    `CouponService::release_usage(int)` then get NULL. This is a TypeError in
    PHP 7.4, so cancel and edit fail.
- **Locking.** `UpdateOrderAction` already locks the order row
  (`OrderService::lock_order`) inside its transaction. But it builds the
  context and runs the calculation **before** it takes the lock.
- **Currency.** `OrderUpdateRequest::prepare_for_validation()` uses the
  visitor's display currency as `currency_code` when none is sent.

## Goals / Non-Goals

**Goals:**
- One way to build calculation items, used by the preview, create, checkout
  and update, so that the preview and the save cannot differ.
- An edit never re-prices an existing line, a stored coupon, the exchange rate
  or the tax-inclusive setting.
- A stored coupon, a stored shipping cost and stored tax rates are calculated
  from stored columns. They do not need the coupon record, the shipping
  settings or the tax settings to exist.
- One new nullable column, and no migration file, no backfill.

**Design constraint (keeps a later second strategy cheap):** the freeze rules
live only in these named places, and nowhere else:
- the existing-line branch of `OrderCalculationContextBuilder` (D3)
- the stored-value inputs on `CalculationContextDTO` (D5)
- `DiscountService::calculate_stored()` (D5)
- the stored-coupon and existing-line branches of the sync code (D9)
- the exchange rate and tax mode that `UpdateOrderAction` reads from the order (D10)

No code outside these places may branch on "this is an edit". The engine
(`RecalculateCartAction`, tax strategies, discount allocation) sees only inputs.
There is no strategy interface now, because there is one strategy. If a second
strategy is needed later, extract these places into a strategy class.

**Non-Goals:**
- The admin edit screen (frontend).
- Editing paid orders, and changes to payment when a total changes.
- Showing the admin what changed in the catalog since the order was placed
  (no price badge, no coupon-changed state).
- Edit history, timeline entries for edits, and customer emails about edits.
- Changing how the cart builds its context (`CalculationContextDTO::from_cart`).

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

### D2. Lines are keyed by `order_item_id`; the engine uses a line key

A payload line is one of two kinds:
- **Existing line:** has `order_item_id`. The system loads the stored line
  from `$order->items` and rejects an ID that is not on the order or that is
  used twice (422). The `variant_id` in the payload, if sent, is ignored.
- **New line:** has `variant_id` and no `order_item_id`.

A new line is rejected (422) when its variant is already on another new line,
or when an existing line of the order holds the same variant. This keeps
"one variant, one line" for lines added from now on.

The engine currently keys per-line results by `variant_id`. It now keys them
by a **line key** instead: the payload index, which the calculation response
already returns as `id`. `CalculationItemDTO` gets a `line_key`. The keyed
arrays in `RecalculateCartAction`, `DiscountService` and
`PersistsOrderCoupons` use it. For create and for the cart, each variant is on
one line, so the result is the same as before. For an edit, a line with a NULL
`variant_id` gets a key like any other line. Orders that hold two lines for the
same variant also work, because each line has its own `order_item_id`.

*Alternative:* keep `variant_id` as the key and drop lines with no variant.
This breaks the rule that a deleted-product line stays on the order.

### D3. `App\Services\OrderCalculationContextBuilder` replaces the three item builders

Public methods:
- `build_items(array $items, ?Order $order, bool $is_saving): Collection`
- `build(array $payload, ?Order $order, bool $is_saving): CalculationContextDTO`

The builder handles the address, customer, coupon and shipping fields that
are the same in all three callers. The controller passes `$request->all()`.
The actions pass their payload DTO as an array. For an edit it also sets
`$context->stored`, which `StoredOrderTermsBuilder` reads from the order (D5).

For a **new line**, it does the following:
1. Rejects a duplicate variant (D2).
2. Loads the variant. If the variant is missing or has no product → 404.
3. Requires `Variant::is_available()` (422).
4. When `$is_saving` is true, rejects `has_limit_per_order && max_per_order <
   quantity` (422). The preview does not enforce this rule or stock.
5. Fills the DTO from the live variant:
   - `base_unit_price = base_sale_price ?: base_price`
   - `base_product_total = base_price`
   - `tax_profile_id = variant ?: product`
   - weight, shipping profile and categories

For an **existing line**, it fills the DTO from the stored order item:
- `base_unit_price = base_catalog_sale_price`
- `base_product_total = base_catalog_regular_price`
- weight and `quantity` from the stored line and the payload
- the stored tax rate for the line (D5), instead of a tax profile
- categories and shipping profile from the live product when it exists,
  otherwise empty (they only matter for a coupon or shipping rule that is
  evaluated live; see D5 and D7)

For every line, `id` is the payload index and `line_key` is the same value.
The builder keeps the loaded variants in a variant map that the callers and
the resource read, so the stock fields need no extra queries. It also gives
`is_reachable` for each line (D4).

**Effect on checkout.** Checkout now also passes `tax_profile_id`. This is
the same value the cart preview (`from_cart`) already uses. Today a checkout
order can therefore have different tax from the cart total that the customer
saw, and this change fixes that.

*Alternative:* add the missing lines to each of the three copies. The copies
already differ, and they would differ again.

### D4. Reachability, stock and limit rules for a quantity change

A line is **reachable** when its variant exists, has a product, and
`Variant::is_available()` is true (this is the rule that create already uses).
Otherwise it is not reachable. The builder gives `is_reachable` per line.

On save, for each existing line, compare the payload quantity with the stored
quantity:
- Equal: no check, no stock move. A sold-out variant or a lowered limit
  does not block it.
- Different and the line is not reachable → 422.
- Higher (reachable line):
  - `has_limit_per_order && quantity > max_per_order` → 422. (The stored
    quantity is never reduced by a lower limit, because an equal quantity is
    not checked.)
  - Check and reserve live stock for the added quantity only
    (`has_stock` / `reserve_available`, which is atomic).
- Lower (reachable line): release the difference.

A new line: stock for the full quantity, the limit on the full quantity.

A line that the payload leaves out is deleted. Its stock is released only when
its variant still exists (a deleted variant has nothing to release).

The preview does not enforce any of this. It returns `is_reachable` and the
stock fields so the client can show the problem (spec "Calculation does not
block ...").

### D5. Frozen calculation: stored values go into the engine

The engine does the math. For an edit, the builder gives it stored inputs.

- **Line prices:** from the stored line (D3).
- **Tax-inclusive setting:** `$order->is_tax_inclusive` replaces
  `Tax::is_tax_inclusive()` in the edit path.
- **Exchange rate:** `$order->exchange_rate` for every conversion.
- **Tax rates:** when the tax address is not changed (D8), the context carries
  the stored rates from `order_taxes` (`StoredOrderTermsDTO::$item_tax_rates`
  per line key, and the shipping rates). `RecalculateCartAction` then wraps the
  tax strategy in `StoredRateTaxStrategy`. It charges the stored rate on each
  line that has one. A line that has no stored rate (a new line) takes its tax
  from the live strategy for the order's address, which is built with the
  order's own tax mode. When tax is not calculated today, a new line has no tax.
  A stored line with no tax rows stays untaxed. The strategy needs no tax
  region to exist today.
- **Shipping:** when the address and method are not changed, the context
  carries the stored shipping charge before discount and tax
  (`StoredOrderTermsDTO::$shipping_subtotal`), and the engine does not run the
  shipping-rate lookup. The order stores the charge after the free-shipping
  discount and the shipping tax, so `StoredOrderTermsBuilder` adds the
  discount back and takes the tax off.
- **Coupons:** the payload lists coupon codes. A code that matches an
  `order_coupons.code` of the order is a **stored coupon**. Any other code is a
  **new coupon**.
  - A new coupon follows the existing path: `CouponService::find_by_codes()`,
    `validate_coupon`, `calculate`, and `claim_usage` on save. A deleted
    coupon is not found, so it cannot be added again (decision 10).
  - A stored coupon follows a new `DiscountService::calculate_stored()` path.
    It does no validation and needs no coupon record. It prices each stored
    coupon with the same order and rules as `calculate()` (product coupons
    first, then order coupons, then free shipping), using the stored terms:

    | Stored coupon | Terms read | Result for a line |
    | --- | --- | --- |
    | product scope, percent | `discount_rate` and the lines that have an `order_item_coupons` row | `round(rate × line subtotal)` for those lines only |
    | product scope, fixed | the stored share on each line | the stored share, capped at the line subtotal |
    | order scope, percent | `discount_rate` | `rate × subtotal that is left`, shared over all lines, including new ones |
    | order scope, fixed | `base_discount_amount` (the total) | the stored total, capped at the subtotal that is left, shared over all lines |
    | free shipping | the type | waives up to the shipping subtotal |

    The result goes into the same `DiscountCalculationResultDTO`, with a coupon
    result that carries the stored coupon data instead of a `Coupon` model.
  - A fixed total is the amount the coupon gave at checkout, which may be less
    than the configured amount when it was capped. That is the promised
    amount, so the edit keeps it.

*Alternative:* store the full coupon JSON and re-run `calculate()`. The user
rejected the JSON snapshot.

### D6. `order_coupons.discount_rate`

A nullable `decimal(8,4)` column on `order_coupons`, added to
`CreateOrderCouponsTable`. `PersistsOrderCoupons` writes the coupon's
`discount_amount_percentage` when `discount_value_type` is percent, and null
otherwise. `CreateOrderCouponDTO`, the `OrderCoupon` model and its resource get
the field. The feature is not released, so no migration and no backfill.

Existing checkout tests that read order coupons need the new key; the seeder
also writes the value.

### D7. Save order: lock → check → build → calculate → write

`UpdateOrderAction::execute()` runs in this order:
1. Begin the transaction.
2. `lock_order($id)`.
3. Load the order with items and order coupons.
4. If `!$order->is_editable()` → 422.
5. Check the currency. If a currency was sent and it is not
   `$order->currency_code` → 422. Otherwise use `$order->currency_code`.
6. Build the context with the builder (`$is_saving = true`).
7. Decide if the address changed (D8). If it changed, check that the shipping
   method is valid for the new address.
8. Calculate.
9. Sync the items, the order, the coupons and the taxes (D9).

Building and calculating after the lock removes a race: the order could be
paid or changed between the calculation and the lock.

`OrderUpdateRequest::prepare_for_validation()` no longer sets a default
currency code.

### D8. What asks for a new shipping or tax quote

`StoredOrderTermsBuilder` decides, from the payload and the stored order:

- **Shipping is quoted again** when the shipping **country or state** differs
  from the stored order's, or when the payload picks another shipping method
  (a different method has a different cost). Otherwise the stored charge and
  the stored `shipping_metadata` are used.
- **Tax is quoted again** when the **country or state of the address that tax
  follows** differs. That address is the order's stored `tax_destination`:
  its shipping address, its billing address, or the store address, which never
  changes. Otherwise the stored rates are used.
- Other address fields (street, city, postcode, names, phone) never count.
- When shipping is quoted again, shipping tax is quoted again too, because a
  new method can be taxable when the old one was not.

When shipping is quoted again, `UpdateOrderAction` checks the method against
the current settings (422 when it is not available) and writes
`shipping_metadata` again. When the stored charge is kept, it does neither.

### D9. Item, coupon and tax sync on save

`sync_order_items()` changes as follows:
- An **existing line** is updated in place: only `quantity` and the calculated
  amounts (subtotal, discount, tax, total). Its name, SKU, barcode, image,
  weight, `product_data`, prices and catalog prices are not rewritten.
- A **new line** gets the full snapshot from the live variant. The
  `PreparesOrderItems` trait fills the item data object for both
  `CreateOrderAction` and `UpdateOrderAction`: a snapshot part (written once)
  and an amounts part (written each time). An existing line writes the amounts
  part only.
- A stored line that is not in the payload is deleted, with stock released only
  when the variant exists.
- Stock moves follow D4.

`PersistsOrderCoupons::sync_order_coupons()` changes as follows:
- A **stored coupon** that is still in the payload: its `order_coupons` row
  stays (same code, type, target, `discount_rate`, `coupon_id`,
  `usage_reversed_at`). Its amounts and its `order_item_coupons` rows are
  rewritten from the new result. It does not claim a use.
- A stored coupon that is not in the payload is removed: its rows are
  deleted, and its use is released when `coupon_id` is set and the use is not
  reversed.
- A **new coupon** is created the same way as at checkout, including
  `discount_rate`, and claims a use.
- Attribution uses `line_key` and a map from line key to saved order item.

Taxes (`order_taxes`): rows of an existing line keep their stored name and
rate when the address is not changed. Only the amounts are rewritten.

### D10. Exchange rate and tax mode come from the order

`UpdateOrderAction` converts with `$order->exchange_rate` and calculates with
`$order->is_tax_inclusive` (through `StoredOrderTermsDTO::$is_tax_inclusive`).
Both stay as they were stored. There is no separate method for the rate,
because the order is the only source.

### D11. `shipping_metadata`

`build_shipping_method_snapshot()` moved to
`ShippingService::get_selected_shipping_method_snapshot()` (done). Create
always writes it. Update writes it only when shipping is quoted again (D8).

### D12. Null-safe releases

- `InventoryService::release_all_reserved_stock()` skips items with an empty
  `variant_id`.
- `OrderManager::mark_as_cancel()` skips `release_usage` for an order coupon
  with an empty `coupon_id`, but still sets `usage_reversed_at`.
- In `PersistsOrderCoupons::sync_order_coupons()`, records with a NULL
  `coupon_id` stay out of the map that decides on `release_usage`. In the new
  plan such a coupon is a stored coupon and stays on the order (D9); it
  reaches no release call.

### D13. Resource mapping

`OrderCalculationController` passes `order` (or null) to
`OrderCalculationResource::make([...])`, with the builder's variant map. The
resource adds these keys to each calculated item:
- `order_item_id`, from the line.
- `is_reachable`.
- The six stock fields, from the variant (null when there is no variant).

There are no `current_state` keys, deleted-line rows or removed-coupon entries.
A stored coupon appears in the coupon list like any applied coupon, with its
stored terms.

### Corrections kept from the first implementation

- **Missing order is 404.** `OrderService::find_order_or_fail()` throws a
  `NotFoundException` with no status code, which the API turns into HTTP 500.
  The preview controller and `UpdateOrderAction` use `find_order()` and throw
  the 404 themselves. `find_order_or_fail()` did not change, because other
  endpoints use it.
- **Pre-existing preview error.** `OrderCalculationResource` read
  `$result->shipping_method`, a property that `CalculationResultDTO` does not
  have. When notices were on, every preview returned HTTP 500. The resource now
  returns the selected method's ID (or null when it is not available). The
  create screen uses this value only when it is not null.
- **Category loading.** The builder calls `load_missing('categories')`, not
  `load('categories')`.

## Risks / Trade-offs

- **The engine key changes from `variant_id` to a line key.**
  - [Risk] This touches `RecalculateCartAction`, `DiscountService` and
    `PersistsOrderCoupons`, and the cart and checkout depend on them.
  - → Mitigation: the key value is the payload index and is unique per line,
    so create and cart results do not change. The existing engine, cart and
    checkout tests must pass unchanged before the edit path is built.
- **A stored coupon's terms are rebuilt from amounts.**
  - [Risk] A fixed coupon that was capped at checkout stays at the capped
    amount, and a rounding difference of one minor unit can appear when a
    percent discount is shared over lines.
  - → Mitigation: this is the promised amount. The tests check an unchanged
    edit gives the same totals as the stored order.
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
- **A new line's tax on an unchanged address.**
  - [Risk] The order has no stored rate for a product that was not on it.
  - → Mitigation: `StoredRateTaxStrategy` takes the new line's rate from the
    live strategy for the order's address, built with the order's tax mode
    (see D5).
- **Lock held during the calculation.**
  - [Risk] Saves of the same order wait longer.
  - → Mitigation: the calculation is quick, and only saves of the same order
    are serialized.

## Migration Plan

- One nullable column, `order_coupons.discount_rate`, added to the existing
  `CreateOrderCouponsTable`. The feature is not released, so there is no new
  migration file and no backfill. Development databases are recreated.
- Rollback: revert the code and the column. No other data needs to be undone.
