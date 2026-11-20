# Design

## Context

- `coupons.method` (`code` | `automatic`) and the `CouponMethod` constants exist. Automatic coupons have a code, like code coupons. Nothing reads `method` yet.
- `RecalculateCartAction::get_discount_result()` is the one place that resolves and validates coupons for every cart or order calculation. It already detaches invalid coupons from the stored cart when `$context->cart_id` is set. Only a storefront cart context has `cart_id`; manual order create, preview and order edit have none.
- `DiscountService::validate_against_other_applied_coupons()` is the seam for stacking rules. Its docblock already reserves it for a combinability rule.
- `coupons.combinations` (JSON) exists and is unused. The user decided to leave it as is.
- `CreateCouponsTable` is released (on `origin/main`). A schema change must be a new alter migration registered last in `config/migrations.php`.

## Goals / Non-Goals

**Goals:**
- Automatic coupons reuse the code-coupon path: no second cart model, no special order handling.
- One combinability rule for every path that applies coupons.

**Non-Goals:**
- No use or removal of `coupons.combinations`.
- No "best coupon wins" logic, no priority between automatic coupons.
- No admin-side auto-apply on manual order create or order edit.
- No change under `resources/app/` and no change to storefront views.

## Decisions

**1. Attach in `RecalculateCartAction`, only when `$context->cart_id` is set.**
Before the code coupons are resolved, find active `automatic` coupons that are not yet on the cart, validate each with `DiscountService::validate_coupon()`, and attach the valid ones with `CartService::add_coupon()`. Then calculate as today.
- Why: `cart_id` is already the "storefront cart" signal. Manual create, preview and order edit have no `cart_id`, so they are skipped with no new flag.
- Alternative: attach on add-to-cart or on cart read. Rejected: the cart changes also when a customer, address or shipping method changes, and recalculation is the one place that runs for all of them.
- Alternative: do not store the automatic coupon, resolve it on every calculation. Rejected by the user: the coupon must "work the same" as a code coupon.

**2. Detach with the existing invalid-coupon cleanup.**
An attached automatic coupon that fails validation is returned in `invalid_coupons` and detached by the existing code. Because attach runs on every cart calculation, the coupon is checked again up to order creation, and it can come back if it becomes valid again. At order creation the order path ignores invalid coupons without an error. The tasks include a test that proves this for an expired automatic coupon.

**3. Block removal in `RemoveCouponAction`.**
After the cart coupon is found, throw a validation error when its `method` is `automatic`. Order edit uses `coupon_codes` and does not go through this action, so the admin can remove it there without a change.
- The cart response returns `method` for each applied coupon, so a later frontend spec can hide the remove button. The server check is the real guard.

**Correction during implementation:** this design first said the cart resource already returned `method` for each coupon. It did not: `CartResource::format_coupon_results()` had no `method` key. The change adds it (additive field, default `code`).

**4. `is_combinable` as a new boolean column, default `true`.**
New alter migration `AddIsCombinableToCouponsTable` (1.0.1): `boolean`, `default(true)`, not null, with a comment. It follows `DropProductSchemasTable` for style: guard with `Schema::has_column`, and `down()` drops the column. `Coupon` `$casts` (boolean) and `$fillable`, `CreateCouponDTO`/`UpdateCouponDTO`, requests (rule `boolean`, sanitizer `BOOL`) and both coupon resources carry it. `CreateCouponsTable` is not edited. Fresh installs reach the same schema by running the alter migration after the create migration.

**5. Combinability rule in `validate_against_other_applied_coupons()`.**
After the duplicate check: if `$already_applied_coupon_codes` is not empty and either the new coupon or any already-applied coupon has `is_combinable = false`, throw a validation error. The applied coupon stays; the new one is rejected ("keep current coupon", the user's decision). The already-applied coupons are loaded with the same `where_in('code', …)` query that the free-shipping check uses, so there is one query for both checks.
- In `DiscountService::calculate()` this runs per coupon in order, with stored order coupons first. So on order edit the stored coupon wins and a new conflicting coupon goes to `invalid_coupons`.
- Automatic coupons are validated before code coupons in `RecalculateCartAction`. A shopper's earlier code coupon is already on the cart, so it wins over a new automatic coupon.

**6. No frontend work in this change.** The admin coupon form (`is_combinable` control), the order edit coupon list and the storefront cart view are done in a later spec. Until then, `is_combinable` is set through the REST API only, and the existing UI keeps working because the new request field is optional.

**7. The backend generates the code of an automatic coupon.**
`CouponService::create()` calls the existing `generate_new_code()` when `method` is `automatic` and the payload has no code. `CouponService::update()` does the same when the coupon has no stored code, and otherwise keeps the stored code when the payload has none (without this, an update from a client that sends no code would set the code to null). The request rules do not change: `code` stays optional for `automatic` and required for `code`, and a code that is sent must be unique.
- A code that the admin sends is kept. Alternative: always ignore a sent code for automatic coupons. Rejected: it drops input without telling the admin.
- No backfill migration: the user confirmed that no automatic coupon exists in stores yet, because nothing used `method` before this change. So no stored data changes.
- The seeded automatic coupon in `SeedCatalog` is created with `Coupon::create()` and bypasses the service, so the seed data gets a code by hand.

## Risks / Trade-offs

- [Attach adds a query to every cart calculation] → One query for active automatic coupons, and the loop is empty on stores with none. A test checks that a cart calculation makes exactly one such lookup.
- [A non-combinable automatic coupon can block a code coupon that the shopper wants] → Accepted. The shopper cannot remove the automatic coupon. The error message must say that the coupon cannot be used with the coupon already applied.
- [Detach and re-attach each calculation could flap if validation depends on a changing value] → Same validation as today for both directions; the result for one cart state is stable.
- [Order creation reads the cart's coupons, not a fresh attach] → Checkout calls the cart calculation before the order, so the cart is current. The task list has an integration test for the invalid case.

## Migration Plan

1. Ship the alter migration with the code. Existing rows get `is_combinable = true`, so behavior does not change.
2. Rollback: `down()` drops the column. Code and schema roll back together, so the code needs no fallback for a missing column.

## Open Questions

- Message text for the combinability error. Can be set during implementation.

## Corrections during implementation

- **`can_apply_coupon_code` handling.** `RecalculateCartAction` used to return no discount when the store did not accept codes. It now detaches only `code` coupons and keeps automatic coupons, so the setting covers typed codes only (as the spec says). `CreateOrderAction` had the same shortcut (`coupon_codes = []`); it now keeps the codes of automatic coupons.
- **Automatic coupons without a code.** Carts and orders identify coupons by code, and the create request does not require a code for `automatic` coupons. The attach step skips an automatic coupon that has no code. The user then decided that the backend generates the code (decision 7), so this skip is only a safety net.
- **Applied-coupon lookup.** The combinability check loads the applied coupons through one overridable method (`find_applied_coupons()`), so unit tests need no database.

