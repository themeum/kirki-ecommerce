## Why

`CartResource` (storefront-only) duplicates every pricing field four ways —
`base_x`, `base_x_money_object`, `display_x`, `display_x_money_object` —
even though `*_money_object` already carries both the raw number (`.raw`)
and the formatted string (`.display`). No storefront consumer (PHP views in
`resources/views/site/`, TS in `resources/site/ts/`) reads the bare fields;
they only ever read `*_money_object.raw` / `.display`. The duplication is
also produced partly through `FormatsCouponResults`, a trait shared between
`CartResource` (storefront) and `OrderCalculationResource` (admin) that
forces both consumers toward the same output shape even though admin still
needs the `base_*` fields — the trait has already drifted internally
(two of its four methods emit money-object-only, two still emit the old
duplicated shape) because of this tension.

## What Changes

- **BREAKING**: `CartResource` (`app/Resources/Cart/CartResource.php`) drops
  bare `base_*` and bare `display_*` scalar/object-pair amount fields from
  its top-level `pricing` block, the `available_shipping_methods` block, and
  `prepare_items()`'s per-item fields. Only `display_*_money_object` keys
  remain for money values. Non-money fields (`tax_lines`, currency codes,
  addresses, etc.) are unaffected.
- Remove the `FormatsCouponResults` trait
  (`app/Resources/Concerns/FormatsCouponResults.php`). Its two pure
  computation methods (`get_product_coupon_discount_for_item`,
  `flatten_item_tax_lines`) and four formatting methods
  (`format_coupon_results`, `get_applied_product_coupons_for_item`,
  `format_tax_breakdown`, `prepare_strikethrough_price`) are copied directly
  into `CartResource` and `OrderCalculationResource` as their own protected
  methods, each formatted for its own consumer (storefront: money-object
  only; admin: unchanged, `base_*` + money-object retained).
- `OrderCalculationResource`'s output shape and behavior are unchanged —
  this is a mechanical de-duplication of the trait into that resource, not a
  functional change.

## Capabilities

No capability specs are added or modified — this changes response shape and
internal code structure only. No computed value, calculation rule, or
system behavior changes (`skip_specs: true`).

## Impact

- `app/Resources/Cart/CartResource.php` — pricing/item/shipping-method output
  shape simplified; gains its own copies of the six trait methods.
- `app/Resources/Order/OrderCalculationResource.php` — gains its own copies
  of the six trait methods; output unchanged.
- `app/Resources/Concerns/FormatsCouponResults.php` — deleted.
- Storefront cart API response (`Api/CartController`), storefront cart/
  checkout pages (`Http/Controllers/Site/SiteController`), and the mini-cart
  partial (`Services/MiniCartService`) all consume the new, smaller
  `CartResource` shape. Already-verified: no storefront PHP view or TS code
  reads the removed bare fields.
- No database, migration, or admin-facing (`resources/app/`) changes.
- `tests/Integration/CartApiTest.php` — 3 assertions updated to the new
  `display_*_money_object` field names (were asserting on removed
  `base_*_money_object` fields).
- `tests/Support/RestTestCase.php` — out-of-scope fix, made at the user's
  explicit request after `composer test:docker` surfaced it: added a
  `tearDown()` that resets the `Facade` static cache, fixing a pre-existing
  test-isolation bug (`RecalculateCartActionTest` failing tax assertions
  when Integration tests ran before it in the same process) unrelated to
  this change's own scope. See design.md's Correction note.
