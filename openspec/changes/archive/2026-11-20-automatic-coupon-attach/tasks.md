# Tasks

## 1. `is_combinable` column and coupon data

- [x] 1.1 Add alter migration `AddIsCombinableToCouponsTable` (boolean, default true, not null, comment) with a `Schema::has_column` guard and a `down()`. Register it last in `config/migrations.php` under "Since v1.0.1". Do not edit `CreateCouponsTable`. Verify with a migration test: the column exists after a fresh run, and existing rows read `true`.
- [x] 1.2 Add `is_combinable` to the `Coupon` model (`$fillable`, boolean cast), `CreateCouponDTO`, `UpdateCouponDTO`, the create and update requests (rule `boolean`, sanitizer `Sanitizer::BOOL`), and the repository or service that saves coupons. Leave `combinations` as is. Verify with `CouponApiTest` cases: create without the field gives `true`; create and update with `false` are saved.
- [x] 1.3 Return `is_combinable` in `CouponResource` and `CouponListResource`. Verify with an API test that asserts the key in both responses.
- [x] 1.4 Verify the group: run the PHPUnit coupon tests and `composer phpcs:wporg`.

## 2. Combinability rule

- [x] 2.1 In `DiscountService::validate_against_other_applied_coupons()`, reject the new coupon when it or any already-applied coupon has `is_combinable = false` and another coupon is applied. Load the applied coupons once for this check and the free-shipping check. Update the docblock that mentions a future rule. Verify with unit tests for: both combinable (stacks), new non-combinable on a cart with a coupon (rejected), new coupon on a cart with a non-combinable coupon (rejected), single non-combinable coupon (applied).
- [x] 2.2 Check the `DiscountService::calculate()` path: a stored order coupon stays and a new conflicting coupon goes to `invalid_coupons`. Verify with an order edit test that adds a conflicting coupon and keeps the stored discount.
- [x] 2.3 Document combinability in the coupons docs (see 5.1) in the same change as the code. Verify the doc text matches the tested behavior.
- [x] 2.4 Verify the group: run the PHPUnit discount and cart tests and `composer phpcs:wporg`.

## 3. Automatic coupons on the storefront cart

- [x] 3.1 Add a lookup for active `automatic` coupons not yet on a cart (in `CouponService`). Verify with a unit test: inactive, expired and already-attached coupons are not returned. (Done as the `CouponService::get_automatic_coupons()` lookup. Premise corrected: the lookup returns active automatic coupons with a code that are not applied; dates and conditions are checked by the validation, not by the lookup. Covered by the `AutomaticCouponTest` integration tests, not a unit test, because the lookup needs the database.)
- [x] 3.2 In `RecalculateCartAction::get_discount_result()`, when `$context->cart_id` is set, validate each lookup result with `DiscountService::validate_coupon()` and attach the valid ones with `CartService::add_coupon()` before the existing calculation. The `can_apply_coupon_code` setting does not stop the attach, because it covers typed codes only. Verify with cart tests for the "valid is attached", "invalid is not attached, no error" and "attached once" scenarios.
- [x] 3.3 Verify detach and re-attach: an attached automatic coupon that becomes invalid is detached by the existing cleanup and comes back when it is valid again. Verify with a cart test that changes the cart or the coupon dates between calculations.
- [x] 3.4 Verify order creation from checkout: an automatic coupon that is invalid at order creation is left out of the order without an error. Verify with a checkout integration test (expired coupon on the cart).
- [x] 3.5 Verify that manual order create, order preview and order edit do not attach automatic coupons, and that an admin can select one by hand and remove one on edit. Verify with order API tests for each scenario in the `automatic-coupon-application` spec.
- [x] 3.6 Verify that a cart calculation runs no extra coupon query beyond the single lookup when the store has no automatic coupon. Verify with a query-count test. (Premise corrected: one lookup of the coupons table always runs per cart calculation, also when the store has no automatic coupon. The test checks that it is exactly one.)
- [x] 3.7 Verify the group: run the PHPUnit cart and order tests and `composer phpcs:wporg`.

## 4. Block shopper removal

- [x] 4.1 In `RemoveCouponAction`, throw a validation error when the applied coupon's `method` is `automatic`. Use a translatable message (`kirki-ecommerce` text domain) and a status that matches `docs/error-status-codes.md`. Verify with `CartApiTest`: removing an automatic coupon fails and the coupon stays; removing a code coupon works.
- [x] 4.2 Verify the group: run the PHPUnit cart tests and `composer phpcs:wporg`.

## 5. Docs and final checks

- [x] 5.1 Add or update the coupons doc (`docs/coupons.md`, structure of `docs/emails.md`): quick start, automatic coupons, combinability, and a "Where this differs from WooCommerce" section. Note that the admin form control for `is_combinable` is not in the UI yet. Verify that every behavior in the doc has a test from groups 1 to 4.
- [x] 5.2 Write the "Backward compatibility" note for the final answer: the released surfaces touched (`coupons` table, coupon REST responses and requests, cart remove-coupon route, coupon model) and how each stays compatible.
- [x] 5.3 Verify the whole change: `openspec validate automatic-coupon-attach --strict`, the full PHPUnit suite, and `composer phpcs:wporg`.

## 6. Generated codes for automatic coupons

- [x] 6.1 In `CouponService::create()`, generate a code with `generate_new_code()` when `method` is `automatic` and the code is empty. Keep a code that is sent. Verify with `CouponApiTest`: create without a code returns a unique non-empty code; create with a code keeps it; a `code` coupon without a code is still rejected (422).
- [x] 6.2 In `CouponService::update()`, keep the stored code when the payload code is empty, and generate one when the coupon is `automatic` and has no stored code. Verify with `CouponApiTest`: update without a code keeps the code; a `code` coupon updated to `automatic` without a code gets a generated code.
- [x] 6.3 Give the seeded automatic coupon in `database/seeders/SeedCatalog.php` a code. Verify by reading the seed data: no `automatic` entry has a null code.
- [x] 6.4 Update `docs/coupons.md`: the code of an automatic coupon is generated when none is sent and is kept on update. Verify that the quick start and section 2 match the tested behavior.
- [x] 6.5 Verify the group: run the PHPUnit coupon and cart tests and the full unit and integration suites, `composer phpcs:wporg`, and `openspec validate automatic-coupon-attach --strict`.

