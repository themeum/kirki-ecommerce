## 1. Rewrite `app/Resources/Order/OrderResource.php` (admin order detail)

- [x] 1.1 Port `get_items_subtotal`, `get_order_coupon_discount`,
      `get_shipping_coupon_discount`, `find_product_coupon_discounts_for_item`,
      `sum_product_coupon_discounts`, `format_coupon_snapshot_fields`,
      `convert_base_amount_to_invoiced`, `format_applied_product_coupons`,
      `prepare_strikethrough_price`, `format_tax_breakdown`, and
      `flatten_item_tax_lines` from `app/Resources/Site/Order/OrderResource.php`,
      keeping their `invoiced_*` behavior unchanged.
- [x] 1.2 Extend each ported aggregation helper to also compute a `base_*`
      twin (summing/reading `base_discount_amount` / `base_amount` columns
      on `OrderCoupon`, `OrderItemCoupon`, `OrderTax` alongside the
      `invoiced_*` ones already confirmed present on those models).
- [x] 1.3 Rebuild `totals` as the storefront's `pricing` shape (items
      subtotal net of product-coupon share, order discount, order total,
      tax total, shipping amount/strikethrough) — for both `invoiced_*` and
      `base_*`, each as a money object only (no bare scalar key).
- [x] 1.4 Rebuild `coupons` as order-level summaries with
      `format_coupon_snapshot_fields`, and add `applied_product_coupons` to
      each line item via `format_applied_product_coupons`, dropping the old
      per-coupon `item_attributions` shape entirely.
- [x] 1.5 Rebuild `items[]`: subtotal net of that item's product-coupon
      share, add `*_strikethrough_price_money_object` (both `invoiced_*`
      and `base_*`), keep `applied_product_coupons` from 1.4. Per user
      decision during apply, per-item raw fields the storefront resource
      doesn't carry (unit price, raw total-discount column, item total
      incl. tax) are dropped to match the storefront's leaner item shape
      exactly, rather than kept alongside the new fields.
- [x] 1.6 Replace per-item `tax_lines` and the root `shipping_tax_lines`
      with one merged, aggregated `pricing.tax_lines` breakdown (by tax
      name + rate), carrying both `invoiced_*` and `base_*` money objects.
- [x] 1.7 Convert every remaining bare scalar money key (`refunds[].invoiced_amount`,
      etc.) to money-object-only.
- [x] 1.8 Do not port storefront-only fields that don't belong on the
      admin resource (`payment_next_step`, `customer()` lookup,
      `shipping_country`/`billing_country`, `formatted_status`,
      `item_product_data`) — keep the admin resource's existing fields for
      those concerns.

## 2. Rewrite `app/Resources/Order/OrderCalculationResource.php` (manual order pricing preview)

- [x] 2.1 Port `get_items_subtotal`, `get_order_coupon_discount`,
      `get_product_coupon_discount_for_item`,
      `get_applied_product_coupons_for_item`, `format_coupon_results`,
      `prepare_strikethrough_price`, `format_tax_breakdown`, and
      `flatten_item_tax_lines` from `app/Resources/Cart/CartResource.php`.
- [x] 2.2 Parameterize each ported helper to emit both a `base_*` and a
      `display_*` money object per figure (rather than Cart's
      `display_*`-only shape), since this resource already supports a
      target `display_currency` distinct from the store's base currency.
- [x] 2.3 Rebuild the root `pricing` block using the coupon-aware
      `items_subtotal`/`order_discount`/`order_total` split instead of the
      current raw `base_subtotal`/`base_discount_total` fields. The old
      one-off `display_total_after_discount_money_object` is superseded by
      `order_total_money_object` (base + display) and removed; the old
      per-figure shipping breakdown (`shipping_subtotal`/`shipping_tax`/
      `shipping_discount`/`shipping_total`) is replaced by
      `shipping_amount` + `shipping_strikethrough` (shipping tax now lives
      only in the merged `tax_lines`), matching Cart's shape exactly.
- [x] 2.4 Merge `tax_lines` and `shipping_tax_lines` into one aggregated
      `pricing.tax_lines` breakdown; remove the separate `shipping_tax_lines`
      key.
- [x] 2.5 Rebuild `items[]`: replace the raw `base_subtotal`/`display_subtotal`
      keys with the coupon-net `*_subtotal_money_object` twins (base and
      display), keeping `applied_product_coupons` and strikethrough price.
      **Correction during implementation**: item-level `tax_lines` was
      initially kept (per this task's original wording), but `CartResource`
      - the resource this file is explicitly modeled on - has no item-level
      tax exposure at all, only the root merged `pricing.tax_lines`. Kept
      it in the first pass, then removed it on user review to match Cart
      exactly; the item's raw `base_discount_amount`/`base_total` and
      `base_tax_amount` aggregate fields are also dropped, consistent with
      the same leaner-shape decision made for the admin `OrderResource` in
      group 1.
- [x] 2.6 Add `base_discount_amount_fixed_money_object` /
      `display_discount_amount_fixed_money_object` to `format_coupon_results`
      and `get_applied_product_coupons_for_item`, replacing the current bare
      `base_discount_amount_fixed` scalar.
- [x] 2.7 In `available_shipping_methods`, drop the bare `base_cost`/`display_cost`
      scalar keys, keeping only their `*_money_object` versions (mirroring
      `CartResource`'s `unset($method['base_cost'])` pattern).

## 3. Update existing tests

- [x] 3.1 Update `tests/Unit/Resources/OrderCalculationResourceCouponFormattingTest.php`
      to assert the new money-object-only, coupon-net shape from group 2.
      (15 tests, 30 assertions, all passing.)
- [x] 3.2 Add `tests/Unit/Resources/OrderResourceCouponFormattingTest.php`
      coverage for `app/Resources/Order/OrderResource.php` (the admin
      resource) — the existing test of that name covers only the
      storefront `Site/Order/OrderResource`, so this needs a new test class
      (e.g. `AdminOrderResourceCouponFormattingTest`) rather than editing
      the storefront one. Added `tests/Unit/Resources/AdminOrderResourceCouponFormattingTest.php`
      (20 tests, 31 assertions, all passing), covering the
      invoiced+base twin aggregation helpers and the different
      `prepare_strikethrough_price` signature (which takes explicit
      subtotal/regular-price amounts and a currency code, unlike the
      storefront version's 2-arg signature).
- [x] 3.3 Check `tests/Integration/OrderApiTest.php` for assertions on the
      admin order response shape (old `totals`/`coupons`/`item_attributions`
      keys) and update them to the new shape. Found 5 assertions on
      `totals['base_shipping']` (a bare scalar, now removed) across the
      checkout-coupon tests; updated to
      `totals['base_shipping_amount_money_object']['raw']`. The
      `item_attributions` tests assert directly against `OrderCoupon`/
      `OrderItemCoupon` DB models, not the API response shape, so they
      needed no change. Full suite run via Docker
      (`bash kirki-test integration --filter=OrderApiTest`): 80 tests,
      3030 assertions, all passing.

## 4. Verify

- [x] 4.1 Run `composer phpcs:wporg` and resolve any reported issues in the
      two changed resource files. 0 errors/warnings on both files (the
      5 pre-existing `json_encode()` warnings reported elsewhere are
      unrelated to this change).
- [x] 4.2 Run `composer test:unit` and `composer test:integration` (or
      `bash bin/phpunit --testsuite Unit --testdox` /
      `--testsuite Integration`) and confirm all pass, including the
      updated/added tests from group 3. Unit: 378 tests / 8734 assertions,
      all passing. Integration (via `bash kirki-test integration`,
      Docker): 496 tests / 10901 assertions, all passing.
- [x] 4.3 Confirm no `resources/app/**` files were touched by this change —
      the React frontend update is explicitly out of scope and follows in
      a separate change. Confirmed via `git status`: only
      `app/Resources/Order/OrderResource.php`,
      `app/Resources/Order/OrderCalculationResource.php`, their tests, and
      this change's `openspec/` artifacts were touched.
