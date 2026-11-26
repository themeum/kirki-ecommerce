# Design

## Context

See proposal.md - Why. Observed in the code:

- `CreateCouponsTable` has `method string(50) default 'code'` with the comment "Supported values: code, automatic". `CouponMethod` has `CODE` and `AUTOMATIC`.
- `kirki_ecommerce_order_coupons` has no `method` column. A new order coupon stores `coupon_snapshot = $coupon->to_array()`, which has `method`, but old rows and the WooCommerce import do not reliably have it.
- `CartResource::format_coupon_results()` already returns `method`. The other three resources do not.
- The admin order and the calculation have no `pricing` block. They keep `totals` and a root `coupons` list.
- `DiscountService::make_stored_coupon()` builds an unsaved `Coupon` from a stored order coupon for the edit preview. It does not copy `method`.
- `AddIsCombinableToCouponsTable` is the pattern for an alter migration (guard with `Schema::has_column`, `down()`, registered under "Since v1.0.3" in `config/migrations.php`). `origin/main` is 1.0.2, so the next version is 1.0.3.

## Goals / Non-Goals

**Goals:**
- Store the coupon method on the order coupon, with a clean migration.
- Give the four payloads the same two lists, built the same way.

**Non-Goals:**
- No backfill. The column default `code` is the correct value for every old row.
- No change to the `coupons` list or to any pricing figure.
- No change to the admin React app.
- No new endpoint, no change to the coupon rules.

## Decisions

**1. A real column, not the snapshot.** Add `method string(50) NOT NULL default 'code'` with the same comment as `coupons.method`. Alternative: read `coupon_snapshot['method']`. Rejected: the WooCommerce import and old rows have no `method` there, JSON cannot be filtered in SQL, and every other term the resources use (`discount_target`) is a column. The default fills old rows without an UPDATE.

**2. One alter migration.** `AddMethodToOrderCouponsTable`, `@since 1.0.3`, registered last under "Since v1.0.3". `CreateOrderCouponsTable` is on `origin/main` and is not edited. `down()` drops the column.

**3. Write the method where the order coupon is built.**
- `CreateOrderCouponDTO::$method` defaults to `CouponMethod::CODE`. The WooCommerce import then needs no change, and an explicit null never reaches the NOT NULL column.
- `prepare_new_order_coupon_dto()` sets `$coupon->method ?? CODE`.
- `prepare_kept_order_coupon_dto()` copies the stored method.
- `OrderCoupon::$fillable` gets `method`.

**4. Stored coupons keep their method in the edit preview.** `make_stored_coupon()` copies `$stored->method` to the unsaved `Coupon`. Without this the preview would show a stored automatic coupon as `code`.

**5. One helper, four resources.** Add a protected method in `ResolvesLineItemPricing` that takes the formatted coupon list and returns the two lists. It filters on the formatted `method` and `discount_target` keys, then `array_values()` to keep JSON lists. Each resource adds `method` to its own `format_coupon_results()` (cart has it) and calls the helper. Alternative: filter the source objects in each resource. Rejected: the cart and calculation hold DTOs, the orders hold models, so that needs two code paths. The formatted arrays have one shape.

**6. Where the keys go.** Cart and storefront order: inside `pricing`, after `coupons`. Admin order and calculation: root, after `coupons`. The existing `coupons` list is kept unchanged.

**7. A null method reads as `code`.** The resources use `$x->method ?? CouponMethod::CODE`. This covers the email preview fake coupons and any row read before the migration runs.

## Risks / Trade-offs

- [A store runs new code before the migration] → The resource fallback to `code` keeps the payload valid. Persisting a new order coupon needs the column, as for any migration in this plugin.
- [`ALTER TABLE` on a large `order_coupons` table] → With a constant default, MySQL 8 and MariaDB 10.3+ add the column without a full table rewrite. Older versions rewrite once.
- [A coupon changes method after checkout] → The order keeps the method it had at checkout. This matches the other order coupon terms.
- [Admin React app does not show the new data] → Accepted. zod strips unknown keys, so nothing breaks.

## Migration Plan

1. Ship the migration with the 1.0.3 code. It runs through the normal migration runner.
2. Rollback: `down()` drops the column. The new keys then read `code`, so `applied_coupons` lists every coupon.
