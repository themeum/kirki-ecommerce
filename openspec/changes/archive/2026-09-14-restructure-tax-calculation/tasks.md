## 1. Schema and models

- [x] 1.1 Add a new upgrade migration: create `order_taxes`
      (`order_id`, `order_item_id` nullable, `type` string defaulting to
      `'product'` ('product'|'shipping'), `name`, `rate`, `base_amount`,
      `invoiced_amount`, timestamps, indexes
      on `order_id` and `order_item_id`); add `orders.base_shipping_tax_amount`
      / `orders.invoiced_shipping_tax_amount`; drop `order_items.tax_rate`
      and `order_items.tax_breakdown`. Do not edit `CreateOrderItemsTable` or
      `CreateOrdersTable`. Done as three files (`CreateOrderTaxesTable`,
      `AlterOrdersAddShippingTaxColumns`, `AlterOrderItemsDropTaxColumns`),
      registered in `config/migrations.php`.
- [x] 1.2 Add `OrderTax` model (fillable/casts per this codebase's PHP
      standards) and `OrderItem::taxes()` / `Order::shipping_taxes()` /
      `Order::taxes()` relations. Added `App\Constants\Order\OrderTaxType`
      (`PRODUCT`/`SHIPPING`) matching this codebase's fixed-value-set
      convention, used by `shipping_taxes()`'s filter and by the strategy
      code in group 2.
- [x] 1.3 Remove `tax_rate`/`tax_breakdown` from `OrderItem`'s
      `$fillable`/`$casts`.
- [x] 1.4 Verify: `composer phpcs:wporg` clean on all changed files, `php -l`
      clean on all changed/new files. `composer test:unit` not run here (no
      local PHPUnit/WP test environment available in this session) — deferred
      to the full verification pass.

## 2. Tax calculation DTOs and strategy contract

- [x] 2.1 Add `TaxableItemDTO` (`item_id`, `taxable_amount`, `tax_profile_id`,
      `product_categories`) and `TaxCalculationContextDTO`
      (`shipping_address`, `billing_address`, `shipping_fee`,
      `is_shipping_taxable`, `items: TaxableItemDTO[]`).
- [x] 2.2 Add `TaxLineDTO` (`name`, `rate`, `base_amount`) and
      `TaxCalculationResultDTO` (`items: array<item_id, TaxLineDTO[]>`,
      `shipping: TaxLineDTO[]`).
- [x] 2.3 Change `AbstractTaxStrategy` to declare one abstract method,
      `calculate(TaxCalculationContextDTO $context): TaxCalculationResultDTO`;
      remove `calculate_product_tax()`/`calculate_shipping_tax()`. Also added
      a shared `calculate_tax_amount()` helper on the abstract class for the
      inclusive/exclusive math that was duplicated identically in both
      concrete strategies.
- [x] 2.4 Rewrite `DefaultTaxStrategy::calculate()`: one `TaxLineDTO` per
      item at its resolved rate, one flat `TaxLineDTO` for shipping at the
      configured shipping rate — same numeric behavior as today.

      **Refinement after initial apply**: the user pointed out `item_id`
      was only ever set on a shipping-split line, left null on an item's
      own tax line even though that line is always unambiguously tied to
      one item. Fixed by stamping `item_id` on every item tax line too
      (in both `DefaultTaxStrategy` and `EUTaxStrategy`, task 2.5), so the
      field is now consistent: always set for an item's own line, set on a
      shipping line only when split per item, null otherwise.
- [x] 2.5 Rewrite `EUTaxStrategy::calculate()`: resolve each item's VAT rate
      via the existing per-tax-profile rule mechanism, allocate the shipping
      fee across the cart's items proportioned to each item's own taxable
      value, and emit one shipping `TaxLineDTO` per item at that item's rate.
      Uses Brick\Money's `allocate()` for the split (remainder-safe). Found
      and fixed a bug during implementation: an earlier version grouped by
      raw float rate as a PHP array key, which silently truncates it to int
      (e.g. 5.5% collapsing into the 5% group) — fixed by not keying
      anything by rate at all.

      **Correction after initial apply**: the first version grouped shipping
      tax by distinct *rate* (one line per rate, merging items that shared a
      rate), with every shipping line's `order_item_id` left null. Flagged
      by the user as wrong: a split shipping-tax line needs to record which
      order item its portion belongs to, so `order_taxes` can actually
      answer "how much shipping tax was this item's share." Reworked to
      allocate per *item* instead of per rate — `TaxLineDTO` gained an
      `item_id` field (null except on a per-item-split shipping line) — so
      two items sharing a rate now produce two lines, not one merged line.
      Updated `specs/order-tax-lines`, `specs/tax-calculation-strategy`, and
      design.md decisions 4 and 6 to match; added a same-rate/two-item test
      (`EUTaxStrategyTest::test_shipping_tax_is_not_merged_across_items_sharing_a_rate`)
      that only the corrected version passes correctly.
- [x] 2.6 Remove `ProductTaxContextDTO` and `TaxItemResultDTO`/`TaxResultDTO`
      once nothing references them; update `TaxStrategyFactory`/`Tax` support
      class signatures if affected. Neither needed a signature change — both
      only instantiate a strategy, they never called the old
      `calculate_product_tax()`/`calculate_shipping_tax()` methods.
- [x] 2.7 Verify: `composer test:unit` (cover `DefaultTaxStrategy` and
      `EUTaxStrategy`, including a mixed-rate EU cart proportional-split
      case and an inclusive-pricing case), `composer phpcs:wporg`. Both
      rewritten test files pass (10 + 7 tests); phpcs clean. `npm run
      typecheck && npm test` skipped for this group — no frontend files
      touched.

## 3. RecalculateCartAction

- [x] 3.1 Add `CalculationContextDTO::billing_address` and populate it in
      `CalculationContextDTO::from_cart()` and wherever else the context is
      built (`CreateOrderAction`, `UpdateOrderAction`,
      `OrderCalculationController`). Also wired it into
      `OrderCalculationRequest`'s already-accepted-but-unused billing fields.
- [x] 3.2 Extract `build_tax_context()`, `build_item_result()`,
      `build_shipping_result()`, and `aggregate()` out of
      `RecalculateCartAction::execute()`, plus small shared helpers
      (`calculate_item_net_total`, `calculate_item_discount`,
      `calculate_item_taxable_amount`, `sum_tax_amount`,
      `is_tax_inclusive_price`, `get_tax_result`) so the discount-capping
      and tax-summing math isn't duplicated between the tax-context build
      and the item/shipping result build. Kept `get_shipping_total`'s
      existing name (design.md's `resolve_shipping_subtotal` was
      illustrative, not mandatory) since it already read clearly.
      `aggregate()` sums already-rounded minor-unit ints directly
      (`array_sum`/`array_column`) rather than round-tripping through Money
      again — safe since no rate math happens at that step, only addition
      of values Money already computed.
- [x] 3.3 Update `CalculationItemDTO`/`CalculationResultDTO` tax fields to
      carry `tax_lines: TaxLineDTO[]` per item and per shipping instead of
      `tax_rate`/`tax_breakdown`.
- [x] 3.4 Verify: no dedicated `RecalculateCartAction` test file exists in
      this codebase (checked `tests/Unit` and `tests/Integration`) — the
      task's premise was wrong, noting that rather than adding one out of
      scope for this change. `composer test:unit` (214 tests) and
      `composer phpcs:wporg` pass across the whole changed set. `npm run
      typecheck && npm test` deferred to group 6 (no frontend files touched
      yet in this group).

## 4. Order persistence

- [x] 4.1 Update `CreateOrderAction` to insert one `order_taxes` row per
      `TaxLineDTO` (item-scoped and shipping-scoped) in the same transaction
      as the order/order-item writes, and to set
      `order_items.base_tax_total`/`invoiced_tax_total` and
      `orders.base_shipping_tax_amount`/`invoiced_shipping_tax_amount`/
      `base_tax_total`/`invoiced_tax_total` from the in-memory sums already
      computed by `RecalculateCartAction` (no re-querying `order_taxes`).
      Added a `PersistsOrderTaxes` trait mirroring the existing
      `PersistsOrderCoupons` trait exactly (same delete-then-recreate
      pattern, same reconciliation-assertion safety net), plus
      `CreateOrderTaxDTO` and `OrderService::create_order_tax()`/
      `delete_order_taxes()`. Updated after the EUTaxStrategy correction
      above: `sync_order_taxes()` now builds a `variant_id => order_item`
      map (same pattern `sync_order_coupons` already uses) and resolves
      each shipping `TaxLineDTO->item_id` through it to the real
      `order_item_id`, instead of always persisting shipping lines with a
      null `order_item_id`.
- [x] 4.2 Apply the same change to `UpdateOrderAction`.
- [x] 4.3 Verify: `composer phpcs:wporg` and `php -l` clean on every changed
      file. `composer test:unit` has no order-creation/order-update test
      coverage in the Unit suite (that lives in `tests/Integration`, which
      needs a WP/DB environment this session doesn't have) — updated the
      one Integration assertion that referenced the old `tax_breakdown`
      field (`tests/Integration/OrderApiTest.php`) to `tax_lines` for when
      it next runs, but could not execute it here. `npm run typecheck &&
      npm test` deferred to group 6.

## 5. API resources

- [x] 5.1 Update `OrderResource`/`OrderCalculationResource` to read tax
      lines from the `taxes`/`shipping_taxes` relations (persisted orders)
      and from `TaxCalculationResultDTO` (live calculation), each
      `base_*`/`invoiced_*` amount shipping its `*_money_object` sibling per
      this codebase's money-field convention. `OrderResource` gained a
      `format_order_taxes()` helper (name/rate/invoiced+base amount with
      money objects) and a new top-level `shipping_tax_lines` key that
      didn't exist before — persisted orders previously had no way to
      expose a shipping tax breakdown at all, which was the gap this whole
      change set out to close. `OrderCalculationResource` renamed its
      output keys `tax_breakdown`→`tax_lines`,
      `shipping_tax_breakdown`→`shipping_tax_lines` for consistency with
      the persisted-order shape; also updated `FormatsCouponResults`
      (`flatten_item_tax_breakdowns`→`flatten_item_tax_lines`) which both
      `CartResource` and `OrderCalculationResource` share.
- [x] 5.2 Update `CartResource` to read `tax_lines` from the live
      calculation result. Same key renames as `OrderCalculationResource`.
- [x] 5.3 Verify: `composer test:unit` (214 tests, 351 assertions) and
      `composer phpcs:wporg` pass clean across every changed file in this
      change (36 files). `npm run typecheck && npm test` covered together
      with group 6 below, since the frontend consumers of these renamed
      keys live there.

## 6. Frontend consumers

- [x] 6.1 Update `resources/app` order schema(s) and
      `resources/site/ts/types.ts` to the new tax line shape (replacing
      `tax_rate`/`tax_breakdown` per item and the old
      `shipping_tax_breakdown` shape) wherever they're read, without adding
      new UI beyond what's needed to keep existing screens compiling and
      correct. Added `OrderTaxLineSchema` (persisted: name/rate/invoiced+base
      money objects), `CalculatedTaxLineSchema` (live calc per item:
      name/rate/base+display money objects), and `AggregatedTaxLineSchema`
      (live calc pricing-level aggregate: name/rate/display money object) to
      `resources/app/features/orders/schemas/catalog/order.ts`, matching the
      three distinct shapes the PHP side now emits. Also typed
      `pricing.tax_lines`/`pricing.shipping_tax_lines` in
      `OrderCalculationSchema`, which the schema had silently never declared
      before (zod drops unknown keys by default) — a pre-existing gap, fixed
      while touching this exact area rather than left as a second undeclared
      rename target. Updated the two dependent test files
      (`use-order-create.test.tsx`, `order.test.ts`) to the new field
      shapes. `resources/site/ts/types.ts`'s loosely-typed `CartItem.tax_breakdown:
      any[]` renamed to `tax_lines: any[]` (its `tax_rate` field had no
      backend counterpart left, dropped); grepped the storefront bundle and
      found no code actually reading either field, so no other file needed
      touching there.
- [x] 6.2 Verify: `npm run typecheck` (from `resources/app/`) — clean.
      `npm test` — 111 files, 848 tests, all passing.

## 7. Full verification

- [x] 7.1 Run `composer test`, `composer phpcs:wporg`, and
      `npm run typecheck && npm test` (from `resources/app/`) together as a
      final pass across the whole change.

      A final repo-wide grep (not scoped to `app`/`tests` like the earlier
      per-group sweeps) turned up two real consumers outside the app that
      the earlier scoped searches missed: `payments/kirki-quickpay/src/
      QuickpayTransactionBuilder.php` and `payments/kirki-mollie/src/
      MollieTransactionBuilder.php` — both payment-gateway integrations
      that read the now-removed `OrderItem->tax_rate` directly to report a
      VAT rate to their respective APIs. Fixed both with a
      `get_effective_vat_rate($item)` helper (`invoiced_tax_total /
      (invoiced_subtotal - invoiced_discount_amount) * 100`) computed from
      fields still on `OrderItem`, rather than assuming one stored rate —
      this also happens to be more correct than the old field ever was: the
      pre-existing `tax_rate` was computed in `RecalculateCartAction` as a
      **sum** of a breakdown's rates (right for one line, nonsensical for
      more than one, e.g. 5%+20% summing to 25%), so multi-line items were
      already misreporting VAT to these gateways before this change.
      `payments/*` is excluded from `composer phpcs:wporg`'s scope
      (confirmed in `phpcs-wporg.xml.dist`) as a separately packaged plugin
      directory; `php -l` clean on both, no existing test coverage for
      either builder to update.

      `composer test`: `test:unit` passes (214 tests, 351 assertions);
      `test:integration` cannot run in this session — no WP test
      environment/Docker available here — so the one Integration test
      touched in group 4 (`OrderApiTest.php`) is updated for correctness
      but unexecuted. `composer phpcs:wporg` clean across all 36 in-scope
      changed files (the one pre-existing, unrelated violation in
      `OrderApiTest.php` at a `date()` call untouched by this change is
      not this change's to fix). `npm run typecheck` clean; `npm test`
      111 files / 848 tests passing.

- [x] 7.2 **Added after initial apply**, on request to harden production
      coverage of the calculation path specifically (inclusive/exclusive
      pricing, tax enabled/disabled, EU proportional splitting, and
      whatever else "may arise in production"):
      - New test infrastructure: `BindsTaxDependencies::bind_full_tax_settings()`
        boots the real `Application` (not the lighter container
        `bind_tax_dependencies()` uses) so `TaxStrategyFactory` can resolve
        a real strategy end to end via `Settings::get()` and
        `config('tax-strategies')`, with the real EU country dataset
        loading unmocked. Lets tests exercise `TaxStrategyFactory` and
        `RecalculateCartAction` exactly as production does, not just the
        strategies in isolation.
      - New `tests/Unit/Tax/TaxStrategyFactoryTest.php` (8 tests): country
        resolution to Default vs EU, missing-country / unconfigured-country
        / disabled-region rejection, and `Tax::get_tax_strategy()`'s
        graceful-null degradation (an unconfigured destination must not
        break checkout).
      - New `tests/Unit/Actions/Cart/RecalculateCartActionTest.php`
        (16 tests) — previously **zero** coverage existed for this class,
        the actual orchestrator every cart/order calculation runs through.
        Covers: exclusive vs inclusive tax (with an explicit
        amount-reconciliation invariant test for each), `should_calculate_tax`
        false, an unconfigured tax country, missing shipping address/method,
        shipping taxable vs not, multi-item aggregation, item discount
        reducing the taxable base, discount capped at the item's own
        subtotal, shipping discount zeroing the shipping tax base (both a
        mocked-discount version and an end-to-end version with a real
        `DiscountService` and a real in-memory `FREE_SHIPPING` coupon),
        grand-total floor-at-zero, and the EU proportional split running
        through the real action (not just the strategy) with mixed
        tax-profile rates.
      - Filled gaps in the existing strategy suites: `DefaultTaxStrategyTest`
        gained a tax-inclusive-pricing test (only EU had one before);
        `EUTaxStrategyTest` gained non-taxable-shipping, zero-shipping-fee,
        a three-item same-rate split, and an uneven-remainder split
        (verifying `Money::allocate()`'s remainder-safety holds and
        per-line rounding drift stays bounded to about a cent per line,
        rather than silently losing or duplicating money).
      - Two test-writing mistakes were caught and fixed by actually running
        the suite, not just reasoning about expected values: a hand-computed
        grand total in the EU end-to-end test was wrong by exactly the
        shipping subtotal (33750, not 31250), and the "missing shipping
        address" test assumed item tax would still compute — it can't,
        since the same address that's missing for shipping is also what
        the tax strategy resolves from, so item tax is unresolvable too.
        That second one is a real, verified production behavior worth
        knowing: a cart with no destination yet shows zero tax everywhere,
        not just on shipping.
      - `composer test:unit`: 244 tests, 446 assertions, all passing.
        `composer phpcs:wporg` clean on both new test files (checked via
        explicit paths — confirmed separately that `tests/` isn't part of
        the standard's normal scan scope at all, so this isn't enforced by
        CI, but the files are clean regardless).
