## Context

`CartResource::to_array()` / `prepare_items()` currently emit four keys per
money value (`base_x`, `base_x_money_object`, `display_x`,
`display_x_money_object`). `FormatsCouponResults` is shared between
`CartResource` (storefront) and `OrderCalculationResource` (admin) and has
already drifted internally: `format_coupon_results()` still emits the old
four-key shape while `get_applied_product_coupons_for_item()` and
`format_tax_breakdown()` were already hand-patched to money-object-only,
because the trait can't express two different output shapes for its two
consumers. See proposal.md - Why.

## Goals / Non-Goals

**Goals:**

- `CartResource` emits `display_*_money_object` only for every money value
  (top-level pricing, `available_shipping_methods`, per-item fields).
- Remove the shared trait so storefront and admin resources can no longer
  drift into inconsistency through a shared formatting layer.
- `OrderCalculationResource`'s behavior and output are unchanged.

**Non-Goals:**

- No change to how amounts are calculated (`RecalculateCartAction`,
  `CalculationResultDTO`, tax/coupon strategies) - only how results are
  shaped into resource output.
- No change to `Site/Order/OrderResource` or admin `OrderResource` (they
  don't use `FormatsCouponResults`).
- No introduction of a new shared class/service for the trait's logic.

## Decisions

**Duplicate the trait's six methods into each resource, rather than extract
a shared class.** Considered three options:

1. Keep the trait, let each consumer override formatting - rejected: PHP
   traits can't parameterize output shape per-consumer without conditionals
   that reintroduce the coupling this change is meant to remove.
2. Extract a small shared class/DTO for just the two pure-computation
   methods (`get_product_coupon_discount_for_item`,
   `flatten_item_tax_lines`), keep formatting local to each resource -
   considered, but rejected as more ceremony than ~18 lines of logic
   justifies, and it would still couple two otherwise-independent resources
   through a shared type.
3. **Copy all six methods into both resources, each formatted for its own
   consumer (chosen).** `CartResource`'s copies emit money-object-only;
   `OrderCalculationResource`'s copies keep the existing `base_*` +
   money-object shape unchanged. KISS over DRY: the two pure-computation
   methods are small and low-churn (discount/tax-line math tied to the
   `CalculationResultDTO` / `CouponDiscountResultDTO` shapes, not
   independently evolving business rules), so duplication risk is judged
   lower than the coupling cost of a shared abstraction.

**Field removal is exact 1:1 within `CartResource`**: every `base_x` and
bare `display_x` key that has a `display_x_money_object` sibling is
dropped; the `_money_object` key is kept as-is (no renaming). Non-money
fields (`currency.code`/`base_code`/`display_code`, `tax_lines`,
`shipping_tax_lines`, addresses, coupon metadata like `code`/`title`) are
untouched.

## Risks / Trade-offs

- **Duplicated pure logic could drift** between `CartResource` and
  `OrderCalculationResource` copies of `get_product_coupon_discount_for_item`
  / `flatten_item_tax_lines` → Accepted trade-off (explicit KISS-over-DRY
  decision above); both are small, and behavior for `OrderCalculationResource`
  must not change in this PR, giving a clear baseline to diff future edits
  against.
- **BREAKING response shape** for anything outside this repo that reads
  `CartResource`'s bare `base_*`/`display_*` fields (e.g. a third-party
  theme or integration hitting the storefront cart API directly) →
  Mitigated by prior verification that no in-repo storefront consumer
  (PHP views, `resources/site/ts/`) reads them; no further mitigation
  planned since this plugin has no versioned/public API contract for that
  endpoint.

## Migration Plan

No database or config migration. Deploy as a normal code change:

1. Add the six duplicated methods to `CartResource` (money-object-only
   formatting) and `OrderCalculationResource` (unchanged formatting).
2. Update `CartResource::to_array()` / `prepare_items()` to drop the bare
   fields and call its own copies of the coupon/tax formatting methods.
3. Delete `app/Resources/Concerns/FormatsCouponResults.php` and its
   `use FormatsCouponResults;` in both resources.
4. Verify `OrderCalculationResource` output is byte-for-byte unchanged
   (existing tests/manual check) before removing the trait file.

Rollback is a straightforward revert (no data written in the new shape).

## Correction during implementation

Running `composer test:docker` (the full unit + integration suite, not
available during planning - no WP test environment on the dev machine at
that time) surfaced two things outside this design's original scope:

1. `tests/Integration/CartApiTest.php` asserted on the exact `base_*_money_object`
   fields this change removes from `CartResource`. Expected fallout, fixed
   by updating those 3 assertions to `display_*_money_object`.
2. `tests/Unit/Actions/Cart/RecalculateCartActionTest` failed - but only
   when run after Integration tests in the same process, and reproduced
   identically on a clean stash of this branch, so unrelated to this
   change. Root cause: `Facade::$resolved_instance` (framework code, not
   editable) is a process-wide static cache; `RestTestCase` (base class for
   Integration tests) never cleared it, so a real WP-backed `Settings`
   facade instance leaked into a later Unit test expecting its own
   container binding. Fixed at the user's explicit request
   (`tests/Support/RestTestCase.php` now resets the Facade cache in
   `tearDown()`, mirroring `Unit\TestCase`) even though it's outside this
   change's stated goals - recorded here rather than silently expanding the
   proposal's scope after the fact.
