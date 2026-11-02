# Coupon/discount modelling and cart-to-order flow (kirki-ecommerce)

Sources are local repo files (no URLs). Citations are `path:line`. Paths are relative to the repo root. "Schema allows" and "code does" are kept separate.

## 1. Coupon types, scope and rules

### Takeaway
Three discount types exist in the schema (amount-off, free-shipping, buy-x-get-y). Only amount-off (order-wide or product/category-scoped, percentage or fixed) and free-shipping are calculated. Buy-x-get-y is a no-op. There is no individual-use flag, no max-discount cap, no per-item limit, and no exclusion list. Stacking is allowed freely except duplicate codes and a second free-shipping coupon.

### Cited Findings
- Coupon columns: `method` (code/automatic), `discount_type` (amount-off, free-shipping, buy-x-get-y), `discount_target` (order, products), `discount_value_type` (percentage, fixed), `base_discount_amount_fixed` (int), `discount_amount_percentage` (float) — database/migrations/CreateCouponsTable.php:27-35.
- Scope and condition columns: `eligible_item_type` (specific-products, specific-categories, all-products), `spend_condition_type` (min-cart-amount, min-items) + `spend_condition_value`, `reward_quantity`, `reward_value` (unused by calculation), date window, country/state targeting, first-time-buyer, include/exclude customer eligibility, `usage_limit`, `customer_limit`, `current_usage_count`, `combinations` (JSON) — CreateCouponsTable.php:37-60.
- Pivots: `coupon_products` (with `is_reward_item`), `coupon_categories`, `coupon_customers` (with `is_excluded`) — CreateCouponProductsTable.php:26-31, CreateCouponCategoriesTable.php:26-30, CreateCouponCustomersTable.php:26-31. The "exclusion" is only for customers. There is no product/category exclusion table or flag.
- No column exists for individual-use, max discount cap, per-item/max-quantity limit, or exclude-sale-items (whole CreateCouponsTable.php:25-70 reviewed).
- `coupons.combinations` is stored and cast to JSON (app/Models/Coupon.php:46, 82) but never read by calculation. DiscountService says a future combinability rule "plugs in here" — app/Services/DiscountService.php:263-277. `grep combinations app` finds no other reader.
- Validation order: status, item eligibility, conditions, region, customer eligibility, conflicts with other applied coupons — DiscountService.php:73-85.
- Conditions: free-shipping rejected if shipping subtotal <= 0 (:147); global usage limit (:148); min cart amount compared with `$context->get_subtotal()` (:151); min items (:154); per-customer limit via `count_coupon_usages` (:157-163).
- Only conflict rules: duplicate code rejected, and a second free-shipping coupon rejected (:278-289, and again in the loop at :319). Everything else stacks (docstring :267-268; openspec/specs/cart-coupon-stacking/spec.md "Multiple coupons can be applied").
- Buy-x-get-y: "not implemented yet", recorded as applied with zero discount — DiscountService.php:395-405.
- Eligible items: free-shipping, all-products, or order-target coupons see all items; otherwise match product IDs or category IDs — DiscountService.php:655-677. `eligible_item_type` empty is treated as "no item scope" in validation (:126).
- Frontend: `discount_target` is nulled for non-amount-off coupons (resources/app/features/coupons/schemas/forms/coupon-form.ts:160). Backend requires it only for amount-off (app/Http/Requests/Coupon/CouponCreateRequest.php:57). So free-shipping coupons normally have `discount_target = NULL`.
- Fixed discount on a product-scoped coupon is applied per eligible line item, not once per cart: `get_fixed_discounted_amount(base_discount_amount_fixed, item_subtotal)` for each eligible item — DiscountService.php:491-502. So a "$5 off these products" coupon gives $5 per line (not per unit), capped at the line subtotal.

### Inferences
- "Product-specific fixed" semantics here are per-line, not per-unit and not once per cart. Anyone modelling order-side data should treat that as the actual rule.
- Because `combinations`, `reward_quantity`, `reward_value`, `is_reward_item` have no calculation behaviour, the order tables only need to cope with amount-off and free-shipping today. Buy-x-get-y would need a new representation (reward quantity, free units) that the order tables do not carry.

### Gaps
- No max-discount cap, individual-use, exclusion list or per-item limit exists, so nothing to document beyond their absence.
- Did not read docs/ecommerce/*.yml (API docs) in detail. They only describe the HTTP surface.

## 2. Order of application, allocation and rounding

### Takeaway
Calculation runs in two passes: product-scoped coupons first (independently per eligible line), then order-wide coupons sequentially against the remaining per-line subtotal. Order-wide discounts are split across lines proportionally by the remaining line amount using largest-remainder, so shares sum exactly to the coupon total. Percentages are rounded HALF_UP on the base amount. Total discount per line is clamped to the line subtotal.

### Cited Findings
- Coupons are processed in the order they come from `find_by_codes` (cart attachment order). Pass 1 = `amount-off` + `products` target; pass 2 = `amount-off` + `order` target; then free-shipping; then BXGY — DiscountService.php:347-405.
- A `remaining_per_item` map (keyed by variant_id, `base_unit_price * quantity`) is decremented as coupons consume it — DiscountService.php:337-375. Result item discount is also keyed by variant_id (:355-358).
- Order-wide coupon: `remaining_subtotal = array_sum(remaining_per_item)`. Total = fixed (capped at remaining) or percent of remaining. Then `allocate_by_weight(total, remaining_per_item)` — DiscountService.php:517-538.
- `allocate_by_weight`: floor each share (`intdiv(total*weight, total_weight)`), then give leftover minor units one at a time to buckets with the largest remainder, ties by key ascending. Shares sum exactly to the total — DiscountService.php:595-641.
- Percent rounding: `Money::of_minor($amount)->multipliedBy(pct/100, RoundingMode::HALF_UP)`, capped at the amount — DiscountService.php:567-578. Percent is applied to remaining amount (so a 10% order coupon after a product coupon is 10% of the already-discounted subtotal).
- Fixed discount capped at the amount it applies to — DiscountService.php:549-556.
- Two product-scoped coupons on the same item both apply, summed (comment :344-346). `clamp_item_discounts` then limits the combined item discount to the line subtotal. Earlier-applied coupon keeps its full amount, later ones get what is left, and a coupon whose share drops to 0 has that item entry removed — DiscountService.php:431-472. `total_discount` of the affected coupon is reduced to match (:461).
- Order-wide coupons see only the remaining subtotal, so their allocation can never exceed line remaining; the clamp matters mainly for pass 1 stacking.
- Per-line discount in the cart result is `min(item_discounts[variant], net_total)` — app/Actions/Cart/RecalculateCartAction.php:274-283.
- Allocation keys are `variant_id`; the same variant appearing in two cart lines would collide in `remaining_per_item` and in `$order_items_by_variant_id` (PersistsOrderCoupons.php:66-70). Not verified whether cart prevents duplicate variant lines.

### Inferences
- Order of coupons within a pass depends on `find_by_codes` ordering, which was not traced. Pass-2 results (percent of remaining) are order-dependent between two order-wide coupons; sequencing is "cart attach order" if ordering is by input codes.
- Rounding remainders go to the line with the largest fractional share, not the last line.

### Gaps
- Did not trace `CouponService::find_by_codes` ordering (app/Services/CouponService.php:147).
- Did not verify whether the cart can hold two lines of the same variant.

## 3. Tax interaction (before/after discount)

### Takeaway
Tax is calculated on the discounted amount (tax after discount), per line. Shipping tax is on shipping minus the free-shipping discount. Order-wide discounts are therefore already spread to lines before tax. Under tax-inclusive pricing the discount is computed against the tax-inclusive unit price.

### Cited Findings
- Calculation order in `execute()`: shipping subtotal, then discount result, then tax result built from discount result, then per-item results — app/Actions/Cart/RecalculateCartAction.php:78-94.
- Taxable amount per line = `base_unit_price*qty - min(item_discount, net_total)` — RecalculateCartAction.php:294-300. Passed to the tax strategy in `build_tax_context` (:233-239).
- Shipping taxable amount = `shipping_subtotal - shipping_discount` (:227-228, :244).
- Item total = taxable amount (inclusive pricing) or taxable amount + tax (exclusive) — RecalculateCartAction.php:380-384.
- Under inclusive pricing: `tax_fraction = tax / taxable_amount` (:417-424) and `base_subtotal`, `base_unit_price`, `base_product_total`, `base_regular_unit_price` are converted to tax-exclusive values (:388-401). But `base_discount_amount` is stored as `discount_money` directly (:397), with no tax exclusion, and the coupon attribution amounts are also raw discount-engine amounts (PersistsOrderCoupons.php:119-120).
- Therefore inclusive-pricing orders store `base_subtotal` (ex-tax, pre-discount) but `base_discount_amount` (tax-inclusive, since computed against `base_unit_price` before exclusion). Whether the discount base is gross there depends on `CalculationItemDTO.base_unit_price` being tax-inclusive when the setting is on (implied by the code; not independently verified).
- Item tax is stored as a single `base_tax_total` on the order item, plus `order_taxes` rows per item (type product/shipping, name, rate, amount) — CreateOrderItemsTable.php:36-37, CreateOrderTaxesTable.php:25-37. No tax rows or tax columns exist on `order_item_coupons` or `order_coupons`.
- Spec for exclusivity under discount: openspec/specs/item-pricing-tax-exclusivity/spec.md:23-25, :57-80. It notes the strikethrough "subtotal before item-level coupon discount" has no recorded tax base and is reconstructed by scaling.
- `regular` tax fields exist on order items (CreateOrderItemsTable.php:46-47) to record tax on the regular price, used for strikethrough.

### Inferences
- Tax is "after discount" in the calculation, but the order tables hold no per-coupon tax effect. Tax saved by a coupon on a line is only derivable as (regular tax - tax total), and only when tax rates are uniform.
- Under inclusive pricing, discount amounts stored on `order_item_coupons` are tax-inclusive, while `order_items.base_subtotal` is tax-exclusive. Mixed bases need care when summing; flagged for the schema-fit assessment.

### Gaps
- Did not verify the `base_unit_price` basis (inclusive vs exclusive) in CalculationContext builder.
- Did not inspect the tax strategies' internal rounding.

## 4. What is persisted at checkout

### Takeaway
At checkout/edit, one `order_coupons` row per coupon result and one `order_item_coupons` row per (coupon, line) with a non-zero amount. Order-wide coupons' per-line allocations ARE stored. Free-shipping amounts are stored only as the coupon's total (no per-line rows), so the shipping portion is recoverable only by subtraction.

### Cited Findings
- Writer: `PersistsOrderCoupons::sync_order_coupons`, called from CreateOrderAction.php:204 and UpdateOrderAction — app/Concerns/PersistsOrderCoupons.php:56-143. OrderService only provides the thin create/delete wrappers (app/Services/OrderService.php:196-198, 209-211, 225-227).
- `order_coupons` row fields set: order_id, coupon_id, customer_id (order's), code, title, discount_type, discount_target, `coupon_snapshot = $coupon->to_array()` (full rule snapshot), `invoiced_discount_amount` (converted), `base_discount_amount = coupon_result->total_discount` — PersistsOrderCoupons.php:80-90. Schema: CreateOrderCouponsTable.php:27-40.
- `order_item_coupons` row: order_item_id, order_coupon_id, invoiced/base discount amount only — PersistsOrderCoupons.php:116-122; CreateOrderItemCouponsTable.php:27-31. Zero amounts are skipped (:103-105). Line match is by `variant_id`, and a missing order item throws (:107-114).
- Order-wide allocated shares are written because `coupon_result->item_discounts` for an order-wide coupon holds the proportional per-variant shares (DiscountService.php:534) and are looped at PersistsOrderCoupons.php:102.
- Free-shipping: `coupon_result->item_discounts` is empty, `total_discount = shipping_discount` (DiscountService.php:387-390), so the order_coupon stores the shipping waived amount and no item rows — matches openspec/specs/order-coupon-attribution/spec.md "Free-shipping coupons attribute to shipping".
- No separate column marks the shipping portion. `order_coupons` has no `shipping_discount_amount`. `discount_type`='free-shipping' on the row (and in the snapshot) is the only marker.
- Line-level totals: `order_items.base_discount_amount` = sum of that line's coupon shares (`calculate_item_discount`), CreateOrderAction.php:778-779. Order-level `base_discount_total` = item discounts + shipping discount (RecalculateCartAction.php:503; CreateOrderAction.php:665-666).
- Reconciliation guard: sum(order_coupons.base_discount_amount) must equal `base_discount_total` exactly; invoiced sum within 1 minor unit per coupon — PersistsOrderCoupons.php:169-194. Invoiced amounts are converted per row independently via `convert_amount`, so invoiced per-line shares may not sum exactly to the invoiced line discount (spec acknowledges tolerance: order-coupon-attribution/spec.md "Order-side discount amounts reconcile exactly").
- Every sync deletes all order_coupons for the order (cascades to order_item_coupons) and recreates them — PersistsOrderCoupons.php:64; OrderService.php:215-227. Existing rows' `usage_reversed_at` is carried over by coupon_id (:92-93).
- Unique key `(order_id, coupon_id)` on order_coupons (CreateOrderCouponsTable.php:43). `order_item_coupons` has no unique key on (order_item_id, order_coupon_id).
- `coupon_id` is nullable with ON DELETE SET NULL, so rows survive coupon deletion (CreateOrderCouponsTable.php:50-53). `customer_id` snapshot supports per-customer usage-limit counts (OrderService::count_coupon_usages, OrderService.php:584-).
- Cancel: marks `usage_reversed_at` and decrements `current_usage_count` — app/Managers/OrderManager.php:148-150.
- Read side: OrderResource derives the shipping discount as `order_coupon.amount - sum(order_item_coupons.amount)` for coupons whose `discount_target === 'order'` only — app/Resources/Order/OrderResource.php:654-677.

### Inferences
- Defect candidate: free-shipping coupons usually have `discount_target = NULL` (frontend sets null for non-amount-off, coupon-form.ts:160; backend only requires it for amount-off). `get_shipping_coupon_discount` skips them (OrderResource.php:660), so `shipping_strikethrough` would not include a free-shipping waiver. Confirm with a real saved free-shipping coupon before relying on it. (The order-wide target branch otherwise returns 0 for amount-off coupons because their item rows sum to their total.)
- Because `order_coupons.discount_type` is stored, the shipping portion is also reconstructable from `discount_type='free-shipping'`, without needing a separate column.
- All the data needed to explain each line's discount per coupon exists in order_item_coupons. What is missing is any record of the tax effect, quantity basis, or a refund link.

### Gaps
- UpdateOrderAction was not read in full. It calls `sync_order_coupons` (listed by grep) and is assumed to follow the same trait.
- Did not check where an order-level (not line) discount reconstruct is used for invoices/emails.

## 5. Gaps: scenarios the schema or code cannot represent or reconstruct

### Takeaway
Most combinations the engine supports are representable: two product coupons on one line, order-wide plus product coupons, a coupon larger than the line (clamped), and free-shipping. The real gaps are (a) refunds with no item/coupon linkage, (b) tax effect of coupons, (c) buy-x-get-y, (d) variant_id-keyed attribution, (e) rebuild-on-edit losing history, and (f) the free-shipping `discount_target` NULL read path.

### Cited Findings
- Two product coupons on same item: representable. Two `order_item_coupons` rows with the same `order_item_id`, different `order_coupon_id`. Engine sums them and clamps (DiscountService.php:431-472). The clamped later coupon gets its reduced amount or no row. The "intended" amount before clamping is not stored (the snapshot holds the rules, so it could be recomputed only by re-running calculation).
- Order-wide fixed + product percent: representable. Product coupon first (pass 1), order coupon on remaining, each stored per line (DiscountService.php:347-375). The ordering rule (product before order) is not stored on the row. It can be inferred from `discount_target` in the row/snapshot.
- Coupon exceeding item price: handled by caps (DiscountService.php:549-556, 573-575, clamp at 431-472). A fixed order-wide coupon larger than the subtotal is capped at the remaining subtotal. The stored `base_discount_amount` is the capped value. The original coupon face value is only in `coupon_snapshot`.
- Free-shipping: representable at coupon level only (see section 4). Capped at the shipping subtotal. It is a full waiver (`shipping_discount_amount = shipping_subtotal`, DiscountService.php:383), not a partial rate. Shipping tax is calculated on shipping minus waiver (RecalculateCartAction.php:227-228). No per-coupon record of shipping tax saved.
- Refunds: `refunds` has only `invoiced_amount`, `reason`, `refund_type`, `status`, gateway id — database/migrations/CreateRefundsTable.php:27-34. There is no refund-item table, no `order_item_id`, no quantity, no base-currency amount, no tax split, and no coupon link. The refund DTO has one amount field (app/DTO/Refund/CreateRefundPayloadDTO.php:18). So a refund of a coupon-discounted item stores only a money amount. The net paid per line is derivable (line `base_total` already is net of discount, plus tax), but a partial-quantity refund of a line with an order-wide coupon cannot be tied to a proportional coupon share. No code reverses coupon usage on refund; only cancel does (OrderManager.php:148-150).
- Quantity basis: attribution is per line (total for all units), not per unit. `order_item_coupons` has no quantity column, so per-unit coupon value for a partial return requires dividing by `order_items.quantity` with an integer-remainder policy. No code exists for that.
- Tax per coupon: absent. Discount reduces taxable base before tax (RecalculateCartAction.php:294-300), but neither `order_item_coupons` nor `order_taxes` records the pre-discount tax or the tax reduction per coupon. Mixed-rate carts with order-wide coupons rely on the proportional split being deterministic and replayable.
- Inclusive pricing: stored discount amounts are on the same (inclusive) base as the pre-conversion unit price but `base_subtotal` is exclusive (section 3). Needs a stated convention for refunds and reports.
- Buy-x-get-y: `coupon_products.is_reward_item`, `reward_quantity`, `reward_value` exist in coupon schema but the engine produces zero discount (DiscountService.php:395-405), so an order_coupon row of type buy-x-get-y with amount 0 and no item rows will be written. When implemented, free-unit quantity has no column in `order_item_coupons`.
- Attribution key is `variant_id`, not `order_item_id`, during sync (PersistsOrderCoupons.php:66-70, 102-122; DiscountService.php:340-342). Two order lines with the same variant (if ever allowed) would collapse. Also order items with `variant_id` NULL (variant deleted; column nullable, CreateOrderItemsTable.php:28) cannot be matched on edit.
- Edit rebuilds all coupon rows (PersistsOrderCoupons.php:64), so per-line attribution is always recomputed from the current coupon rules/state at edit time. Historical attribution is replaced. The snapshot is refreshed from the current coupon (`$coupon->to_array()`, :88), not the original snapshot. The spec says rows are immutable after checkout and survive coupon edits (order-coupon-attribution/spec.md "Order-side coupon records are immutable after checkout"), which holds for coupon edits but not for order edits.
- Coupon invalid at edit time: `calculate()` drops invalid coupons (DiscountService.php:328-330), so an edit of an old order can silently remove a now-expired coupon from the order. Not verified whether UpdateOrderAction re-validates or reuses stored coupons.
- Invoiced vs base: per-line invoiced coupon shares are independently converted, so invoiced line shares may differ by a few minor units from the invoiced line discount (tolerance allowed only at the coupon-total level, PersistsOrderCoupons.php:183-194). There is no exact reconcile of invoiced line sums.
- `order_coupons.discount_target` and `coupon_snapshot` contain target/eligibility, but `coupon_snapshot` is `$coupon->to_array()` — whether it includes the `products`/`categories`/`customers` relations (needed to see which items were eligible) was not checked.

### Inferences
- Sufficient for audit and display today: order, per-coupon, per-line amounts in both currencies with a rules snapshot.
- Insufficient for itemised refunds or restock/return flows: needs refund-line records (order_item_id, quantity, base and invoiced amounts, tax part, optional coupon share).
- To support quantity-level reversal, either store per-unit share (or remainder rule) or define a deterministic policy (pro-rata by quantity, remainder on the last unit).

### Gaps
- Did not read UpdateRefundAction/CreateRefundAction, so whether any refund math consults coupon rows is not confirmed (grep found none of the coupon names in refund DTOs).
- Did not confirm whether `coupon_snapshot` includes relation data.
- No runtime test was run.

## Files read
- database/migrations/CreateCouponsTable.php, CreateCouponProductsTable.php, CreateCouponCategoriesTable.php, CreateCouponCustomersTable.php, CreateCartCouponsTable.php, CreateOrderCouponsTable.php, CreateOrderItemCouponsTable.php, CreateOrderItemsTable.php (relevant parts), CreateOrderTaxesTable.php, CreateRefundsTable.php.
- app/Services/DiscountService.php (full), app/Actions/Cart/RecalculateCartAction.php (full), app/Concerns/PersistsOrderCoupons.php (full), app/Actions/Order/CreateOrderAction.php (item and total mapping), app/Services/OrderService.php (coupon wrappers), app/Managers/OrderManager.php (cancel), app/Resources/Order/OrderResource.php (coupon read side), app/Models/OrderCoupon.php, OrderItemCoupon.php.
- openspec/specs/order-coupon-attribution/spec.md, cart-coupon-stacking/spec.md, item-pricing-tax-exclusivity/spec.md.
