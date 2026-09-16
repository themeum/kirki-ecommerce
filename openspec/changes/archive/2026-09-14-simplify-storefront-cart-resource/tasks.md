## 1. OrderCalculationResource: absorb trait methods unchanged

- [x] 1.1 Copy `FormatsCouponResults`'s six methods
      (`get_product_coupon_discount_for_item`, `flatten_item_tax_lines`,
      `format_coupon_results`, `get_applied_product_coupons_for_item`,
      `format_tax_breakdown`, `prepare_strikethrough_price`) into
      `app/Resources/Order/OrderCalculationResource.php` as protected
      methods, byte-for-byte identical to the trait's current versions.
- [x] 1.2 Remove `use FormatsCouponResults;` from
      `OrderCalculationResource` now that it has its own copies.
- [x] 1.3 Verify: `php -l` and `composer phpcs:wporg` pass on the file.
      `composer test` (full suite) needs a WP test environment not set up on
      this machine (Docker/host wp-tests-lib missing); `composer test:unit`
      (244 tests) passes but has no coverage of `OrderCalculationResource` -
      output-equivalence relies on the method bodies being copied verbatim
      from the trait (confirmed by diff), not on test coverage.

## 2. CartResource: own copies, storefront-shaped

- [x] 2.1 Copy the same six methods into
      `app/Resources/Cart/CartResource.php` as protected methods, then
      rewrite `format_coupon_results()` and `prepare_strikethrough_price()`
      (and confirm `get_applied_product_coupons_for_item()` /
      `format_tax_breakdown()`, already money-object-only) to drop any bare
      `base_*`/`display_*` keys — money-object keys only, `code`/`title`/
      `discount_value_type`/etc. metadata untouched.
- [x] 2.2 Remove `use FormatsCouponResults;` from `CartResource`.
- [x] 2.3 In `to_array()`'s `pricing` block, drop `base_x` and bare
      `display_x` for: `subtotal`, `tax_total`, `discount_total`,
      `shipping_subtotal`, `shipping_tax`, `shipping_discount`,
      `shipping_total`, `total` — keep only `display_x_money_object`.
      Leave `currency` (`code`/`base_code`/`display_code`), `tax_lines`,
      `shipping_tax_lines`, and `display_total_after_discount_money_object`
      as-is.
- [x] 2.4 In `to_array()`'s `available_shipping_methods` mapping, drop
      `base_cost`, `base_cost_money_object`, and bare `display_cost` — keep
      only `display_cost_money_object`, same money-object-only rule as
      every other field.
- [x] 2.5 In `prepare_items()`, drop bare/base fields for: `base_price`,
      `base_sale_price`, `base_product_total`, `base_subtotal`,
      `base_tax_amount`, `base_discount_amount`, `base_total`, and their
      bare `display_*` siblings — keep only the `display_*_money_object`
      form for each. Leave `display_line_price_money_object`,
      `display_strikethrough_price_money_object`, and non-money item fields
      (`available_quantity`, `in_stock`, `attributes`, etc.) untouched.
- [x] 2.6 Verify: `php -l` and `composer phpcs:wporg` pass; `composer test`
      (full suite) unavailable in this environment (see 1.3 note).

## 3. Remove the trait

- [x] 3.1 Delete `app/Resources/Concerns/FormatsCouponResults.php`.
- [x] 3.2 Grep the codebase for any remaining reference to
      `FormatsCouponResults` and confirm there are none.
      Discovered mid-implementation: `tests/Unit/Resources/FormatsCouponResultsTest.php`
      tested the trait directly (`use FormatsCouponResults;` on the test
      class). Not anticipated by design.md/this task list. Asked the user how
      to proceed; chose "duplicate the test too", consistent with the
      KISS-over-DRY call for the production code. Deleted that file and
      replaced it with two duplicated test files, each instantiating its own
      resource and invoking its protected methods via reflection (matching
      the existing `RouteDiTest::invoke_route_method` pattern in this repo):
      `tests/Unit/Resources/CartResourceCouponFormattingTest.php` and
      `tests/Unit/Resources/OrderCalculationResourceCouponFormattingTest.php`.
- [x] 3.3 Verify: `php -l` and `composer phpcs:wporg` pass with the trait
      file gone; `composer test:unit` passes (259 tests, up from 244: -15
      removed with the old file, +30 across the two new ones). `composer
      test` (full suite, needs WP test env) unavailable in this environment
      (see 1.3 note).

## 4. End-to-end verification

- [x] 4.1 Ran `composer test:docker` (full unit + integration suite against a
      real WP test environment). First run surfaced 3 real integration
      failures in `tests/Integration/CartApiTest.php` — pre-existing
      assertions reading the exact `base_discount_total_money_object` /
      `base_discount_amount_money_object` fields this change intentionally
      removes from `CartResource`. Updated those 3 assertions to
      `display_discount_total_money_object` / `display_discount_amount_money_object`
      (grepped the whole integration suite first to confirm these were the
      only surviving references). Re-ran: `CartApiTest` passes in full,
      confirming the storefront cart API, coupon stacking/removal, and
      per-item pricing all render correctly with the new `CartResource`
      shape.
- [x] 4.2 Same `composer test:docker` run: no `OrderCalculationResource`-
      related failures at any point, confirming its output is unaffected.
      One unrelated failure surfaced both before and after this change's
      edits: `RecalculateCartActionTest::test_exclusive_tax_adds_tax_on_top_of_the_subtotal`.
      Verified it's pre-existing and out of scope by stashing every change
      from this session (`git stash push -u`) and re-running
      `composer test:docker` against the untouched branch — same single
      failure reproduced there (605 tests, 1 failure) as with this change
      applied (620 tests, 1 failure). Not touched by this change: `git
      status` showed nothing modified under `app/Actions/` or
      `app/DTO/Calculation/`.

      Root cause (found via investigation, then fixed at the user's request
      even though unrelated to this change's original scope): `Facade`'s
      static `$resolved_instance` cache (`vendor/libraries/framework/src/Facade.php`
      - not editable, regenerated by `composer scope`) is process-wide.
      `Unit\TestCase::reset_facade_cache()` clears it in `tearDown()`, but
      `RestTestCase` (base class for every Integration test) never did, so a
      real WP-options-backed `Settings` facade instance resolved during an
      Integration test stayed cached and leaked into
      `RecalculateCartActionTest`, which runs later in the same
      `kirki-test all` process and expects `Settings` to resolve through its
      own fresh container binding instead. Fixed in
      `tests/Support/RestTestCase.php`: added a `tearDown()` that calls a
      new `reset_facade_cache()` method (mirrors `Unit\TestCase`'s, via
      `ReflectionClass` on `Facade::$resolved_instance`). Re-ran
      `composer test:docker`: full suite green, 620 tests / 8690 assertions,
      0 failures.

      Also fixed, at the user's request: 3 pre-existing `composer
      phpcs:wporg` findings in `tests/Integration/CartApiTest.php`
      (untouched by this change's own edits - `tests/` isn't in the
      standard's default scanned path list, so these were only surfaced by
      explicitly pointing phpcs at the file). `date()` to `gmdate()` for
      `expires_at` in `test_cookie_lookup_missing_stale_unknown_and_header_fallback`;
      `with_cart_cookie()`'s raw `$_COOKIE[Cart::COOKIE_TOKEN]` read replaced
      with `Superglobals::cookie(Cart::COOKIE_TOKEN)` (unslash + sanitize,
      per this codebase's superglobal-access convention). `composer
      phpcs:wporg -- tests/Integration/CartApiTest.php` now clean; re-ran
      `composer test:docker` again: still 620 / 8690 / 0 failures.
