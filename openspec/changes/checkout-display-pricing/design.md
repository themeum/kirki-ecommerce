## Context

`RecalculateCartAction::execute()` already returns a `CalculationResultDTO` ($result) carrying everything `CartResource`/`OrderCalculationResource` need, with one exception:

- `$result->coupon_results` (`CouponDiscountResultDTO[]`) — one entry per applied coupon, each with `->coupon` (has `discount_target`: `products` or `order`) and `->item_discounts[variant_id]`, already clamped by `DiscountService::clamp_item_discounts()` so per-coupon amounts reconcile exactly with the item's total discount.
- `$result->items[$variant_id]` — has `base_product_total` (regular price × qty, undiscounted), `base_subtotal` (sale-adjusted price × qty, pre-coupon), `base_discount_amount` (product+order coupon discount combined, clamped), `tax_breakdown` (`TaxItemResultDTO[]`, already computed per item but not yet read by `CartResource`).
- `$result->base_subtotal`, `base_discount_total`, `base_shipping_discount` — cart-level, all already present.

The one gap: `RecalculateCartAction` calls `$tax_strategy->calculate_shipping_tax(...)`, which returns a `TaxResultDTO` with a `->breakdown` array, but only `->base_total` is kept (`RecalculateCartAction.php:134-135`) — the breakdown is discarded before it ever reaches `CalculationResultDTO`. See proposal.md - Why.

## Goals / Non-Goals

**Goals:**
- Compute every new field from data already on `$result` wherever possible, entirely inside the Resource classes.
- Make the one unavoidable calculation-layer change (shipping tax breakdown) minimal: carry an existing value through, no new math.
- Keep `CartResource` and `OrderCalculationResource` consistent with each other (same field names, same derivation logic), since they already mirror each other's shape via the shared `FormatsCouponResults` trait.

**Non-Goals:**
- No changes to `DiscountService`'s discount math, coupon validation, or clamping — this change only reads results it already produces.
- No frontend/template work (`checkout.ts`, `coupon-form.php`, `order-summary.php`, `order-products.php`, `PageInlineScript.php`'s SSR whitelist) — resource output only, per proposal.md.
- No multi-line tax rates within a single strategy call (e.g. simultaneous GST+IST from one `calculate_tax()` call) — `DefaultTaxStrategy`/`EUTaxStrategy` still emit one named line each. This change only stops discarding and aggregates the breakdown array shape that already exists, so the resource is ready the moment the strategy layer emits more than one line.

## Decisions

### Where each new field is computed

| Field | Computed in | Source |
|---|---|---|
| Per-item `display_line_price` / `display_strikethrough_price` | `CartResource::prepare_items()` / `OrderCalculationResource::prepare_items()` | `calculated_item->base_product_total`, `->base_subtotal`, plus a per-item sum of `$result->coupon_results[]->item_discounts[variant_id]` filtered to `discount_target === DiscountTarget::PRODUCTS` |
| Per-item `applied_product_coupons` | same | Same filtered `coupon_results`, one entry per coupon with `item_discounts[variant_id]` set |
| Cart `display_total_after_discount` | `CartResource::to_array()` / `OrderCalculationResource::to_array()` | `base_subtotal - (base_discount_total - base_shipping_discount)` — all three already on `$result` |
| Cart `tax_breakdown` (product) | same | Sum `$result->items[*]->tax_breakdown` entries by `name` across all items |
| Cart `shipping_tax_breakdown` | same | New `$result->shipping_tax_breakdown`, populated by `RecalculateCartAction` (see below) |

Deriving the per-item product-coupon amount from `coupon_results` (rather than adding a new per-coupon-per-item field on `CalculationItemDTO`) avoids duplicating data that's already fully reconciled by `clamp_item_discounts()` — summing the filtered `item_discounts[variant_id]` values is guaranteed to equal the product-scoped portion of `calculated_item->base_discount_amount`, since that's exactly how the latter is assembled upstream.

### Strikethrough price selection

Two-tier only, per proposal.md's "single strikethrough" decision for stacked item-scoped coupons:

```
product_coupon_discount = Σ coupon_results[i]->item_discounts[variant_id]
                           where coupon_results[i]->coupon->discount_target === PRODUCTS

display_line_price = base_subtotal - product_coupon_discount

display_strikethrough_price =
    base_subtotal              if product_coupon_discount > 0   (covers sale+coupon and coupon-only)
    base_product_total          if product_coupon_discount == 0 AND base_subtotal < base_product_total (sale only)
    null                         otherwise
```

Order-scoped coupon discounts never enter this calculation — `discount_target === ORDER` results are excluded from `product_coupon_discount`, satisfying the spec's "cart-wide coupon does not change line item price" requirement structurally, not by a special case.

### Shipping tax breakdown plumbing

Add `public $shipping_tax_breakdown = [];` to `CalculationResultDTO` (array of `TaxItemResultDTO`, mirroring the existing `coupon_results`-style array property). In `RecalculateCartAction::execute()`, after `$shipping_tax_result = $tax_strategy->calculate_shipping_tax(...)`, also assign `$result->shipping_tax_breakdown = $shipping_tax_result->breakdown;` (currently only `->base_total` is read). No other logic in that method changes — `$shipping_tax_money` is still derived from `->base_total` exactly as today.

### display_-only fields, no base_* twin

Every field this change adds uses `display_*` naming with a `*_money_object` where money is involved, and does **not** get a `base_*` sibling — a deliberate, scoped exception to CLAUDE.md's general money-field convention (see proposal.md - What Changes). Precedent: `PageInlineScript.php`'s `set_checkout_page_data()` already curates a `display_*`-only subset of `CartResource`'s output for the checkout page's SSR config. These are presentation-only values (a strikethrough/shown price split, a named tax line), never persisted, never read back for currency-accurate math — the existing `base_*`/`display_*` pairs on the same resources remain the source of truth for anything that needs base-currency amounts.

### Field naming

- Item: `display_line_price_money_object`, `display_strikethrough_price_money_object` (nullable), `applied_product_coupons` (array of `{ code, title, discount_value_type, discount_amount_percentage, base_discount_amount_fixed, display_discount_amount_money_object }` — the non-money fields mirror what `FormatsCouponResults::format_coupon_results()` already exposes per coupon, for consistency).
- Cart: `pricing.display_total_after_discount_money_object`, `pricing.tax_breakdown` (array of `{ name, rate, display_amount_money_object }`), `pricing.shipping_tax_breakdown` (same shape).

## Correction during implementation

Task 5.1 assumed `OrderCalculationResource`'s strikethrough logic could reuse `calculated_item->base_product_total` exactly like `CartResource`'s. It cannot as-is: `OrderCalculationController::prepare_items()` (the request-preview path that builds the `CalculationItemDTO`s `OrderCalculationResource` renders) never set `$item_dto->base_product_total` - it silently stayed at the DTO's `0` default, since nothing in `OrderCalculationResource` read it before this change. That made the "sale only" strikethrough branch (`base_subtotal < base_product_total`) permanently false for order previews. Fixed by adding `$item_dto->base_product_total = $variant->base_price;` alongside the existing `base_unit_price` assignment in `OrderCalculationController::prepare_items()` - the same per-unit convention `CalculationContextDTO::from_cart()` already uses for the cart path.

## Risks / Trade-offs

- [Two resources (`CartResource`, `OrderCalculationResource`) duplicate this derivation logic, since they don't share a common base class beyond the `FormatsCouponResults` trait] → Mitigated by putting every piece of the new logic that doesn't need resource-specific data shaping - `get_product_coupon_discount_for_item`, `get_applied_product_coupons_for_item`, `format_tax_breakdown`, `prepare_strikethrough_price`, `flatten_item_tax_breakdowns` - on the shared trait, all with explicit `$base_currency_code` params rather than either resource's implicit `$this->` access. Only the `to_array()`/`prepare_items()` bodies stay duplicated, since they shape data pulled from differently-structured underlying objects (a `Cart` model vs. a bare `CalculationResultDTO`/`CalculationContextDTO` pair).
- [`applied_product_coupons` could grow unboundedly if many item-scoped coupons target the same item] → Accepted: coupon counts per cart are small in practice, and the spec explicitly allows multiple entries (only the *price* display collapses to one tier, not the coupon list).
- [Consumers relying on `pricing.base_tax_total`/`base_shipping_tax` as the combined tax figure are unaffected] → These existing fields are untouched; the new `tax_breakdown`/`shipping_tax_breakdown` arrays are additive.
