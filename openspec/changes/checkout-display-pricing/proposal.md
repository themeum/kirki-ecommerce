## Why

The storefront checkout summary needs to show, per line item, whether a sale price or an item-scoped coupon discount is in effect (with the appropriate strikethrough), a cart total that nets out shipping-discount ambiguity, and a tax breakdown split by product vs. shipping (and ready for multiple named tax lines, e.g. GST/IST). `CartResource` and `OrderCalculationResource` don't expose any of this today — item pricing has no discount-source distinction, the discount total conflates shipping waivers with product/order coupon discounts, and per-item tax breakdowns are already computed but dropped before reaching the API response.

## What Changes

- Add per-item display pricing to `CartResource`/`OrderCalculationResource`: a shown price and a nullable strikethrough price, driven only by sale price and **item-scoped** (product) coupon discounts — cart-wide (order-scoped) coupons never alter a line item's displayed price.
- Add `applied_product_coupons` per item: the item-scoped coupons that actually discounted that item, for badge display.
- Add a cart-level `display_total_after_discount` (subtotal minus product/order coupon discount, excluding shipping discount) so the storefront can safely render an intermediate total row without it drifting from the grand total when a free-shipping coupon is also applied.
- Add a cart-level product tax breakdown (array of `{ name, rate, amount }`, aggregated by tax name across items) and a shipping tax breakdown (same shape), replacing the single combined tax scalar for display purposes.
- **BREAKING**: none of the existing fields are removed or renamed; all additions are new keys.
- All new fields are `display_*` only (no `base_*`/`*_money_object` twin), matching the existing checkout-only convention already used in `PageInlineScript.php`'s curated cart config — this is a deliberate, scoped exception to the project's general base_/display_ pairing rule for money fields, since these are purely on-the-fly presentation values, not persisted or reused for currency-accurate computation.
- Storefront template/JS wiring (`checkout.ts`, `coupon-form.php`, `order-summary.php`, `order-products.php`, `PageInlineScript.php`'s SSR config) is explicitly out of scope for this change — resource output only.

## Capabilities

### New Capabilities
- `cart-pricing-display`: Per-item and cart-level display-pricing fields (shown/strikethrough price, applied product coupons, pre-shipping total, tax breakdowns) exposed by `CartResource` and `OrderCalculationResource` for storefront checkout rendering.

### Modified Capabilities
(none — no existing spec in `openspec/specs/` currently covers cart/order pricing resource output)

## Impact

- `app/Resources/Cart/CartResource.php` — per-item shown/strikethrough price, `applied_product_coupons`, cart-level `display_total_after_discount`, `tax_breakdown`, `shipping_tax_breakdown`.
- `app/Resources/Order/OrderCalculationResource.php` — same additions, mirroring `CartResource`.
- `app/Actions/Cart/RecalculateCartAction.php` — stop discarding the shipping tax strategy's breakdown; carry it onto the result.
- `app/DTO/Calculation/CalculationResultDTO.php` — add a `shipping_tax_breakdown` property to carry that data through.
- No database, migration, or public API contract changes — purely additive response fields.
