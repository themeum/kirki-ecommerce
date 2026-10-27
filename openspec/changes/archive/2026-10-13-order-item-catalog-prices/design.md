## Context

See proposal.md - Why. The current state that shapes the approach:

- The discount service works on the catalog basis: `base_unit_price × quantity`, where `base_unit_price` is the variant's sale-or-regular price exactly as stored. Under tax-inclusive pricing, every discount amount is therefore **gross** (includes tax).
- The tax strategy taxes the **post-discount** amount. `RecalculateCartAction::build_item_result()` then makes `base_subtotal` net by excluding a `tax ÷ taxable` fraction from the **pre-discount** total. At a 100% discount the fraction is 0, so `base_subtotal` stays gross.
- The four pricing resources mix these bases (net pre-discount subtotal − gross product discount + post-discount tax) and copy the same helpers, including two tax-inclusive derivation helpers.
- `orders.is_tax_inclusive` already records the tax mode an order was last calculated under.
- The tax strategy's decision rules receive the taxable amount (`base_product_price`), so a rule can depend on the amount. The rate for the pre-discount amount can differ from the rate for the post-discount amount.

## Goals / Non-Goals

**Goals:**

- Every displayed pricing figure is read from figures on **one** basis: the catalog basis, in the tax mode the item was priced under. No runtime tax addition or extraction in resources.
- The net `base_subtotal` is correct for any discount, including 100%.
- One place for line-item display logic shared by all four resources.

**Non-Goals:**

- The admin React app (follow-up change).
- Reworking how an order edit prices existing items. Today the edit uses the variant's current price and the current tax setting. This change keeps that and only refreshes the new columns from the same recalculation. The order-edit calculation is reworked in a separate session.
- Changing existing net columns (`base_price`, `base_subtotal`, `base_regular_price`, `base_regular_tax_total`, `base_tax_total`, `base_total`) or the order-level totals.

## Decisions

### D1. Record catalog figures in the native tax mode; never convert them

The three catalog figures are copied or subtracted on the catalog basis only: `catalog_sale_price × qty − product-scoped coupon discount`. Both operands are already in the same tax mode, so the subtraction is exact under either mode, and a resource can show the figure as is.

*Alternatives:* (a) derive the inclusive figure with the tax rate at runtime - can be 1 minor unit off and needs the rate everywhere; (b) store a pre-discount tax and add it back - exact for the subtotal but still needs a rate to split the product coupon into net and tax. Both keep runtime tax math in the resources, which is what caused the bug.

### D2. Tax before any discount = a second pass of the same tax strategy

`get_tax_result()` runs the strategy twice: once with the post-discount taxable amounts (as today) and once with the undiscounted amounts (`base_unit_price × qty`). The second pass only feeds the per-item "tax before discount"; its shipping lines are ignored.

*Why not apply the line rates to the undiscounted amount?* The decision rules can depend on the amount, so the rate at the undiscounted amount may differ. A second pass uses exactly the same rules, rounding and strategy (Default or EU) as the real tax, so `discount_tax_total = tax_before − tax_after` is consistent by construction. The extra cost is one more in-memory calculation per recalculation.

### D3. Net subtotal and unit prices from the tax before discount

Under tax-inclusive pricing:

- `base_subtotal = catalog_sale_price × qty − tax_before_discount` - exact, and correct at a 100% discount.
- `base_unit_price` and `base_regular_unit_price` still use `exclude_tax()`, but with the fraction `tax_before_discount ÷ (catalog_sale_price × qty)`. The denominator is zero only for a free item, which then has nothing to exclude.

`calculate_tax_fraction()` changes to take the undiscounted amount and its tax. `base_regular_tax_amount` is unchanged.

### D4. The engine computes the product-scoped discount itself

`build_item_result()` sums `item_discounts[variant_id]` over coupon results whose target is `DiscountTarget::PRODUCTS`, capped at the item's catalog sale total, and subtracts it to get `base_catalog_product_coupon_discounted_subtotal`. The resources no longer need a coupon lookup to compute the subtotal. They still look up coupons for the applied-coupon badges.

### D5. Display rules are pure functions of four recorded figures

For every resource, per item and per currency:

```
subtotal       = catalog_product_coupon_discounted_subtotal
strikethrough  = catalog_sale_price × qty     if subtotal < catalog_sale_price × qty
               = catalog_regular_price × qty  elif catalog_regular_price > catalog_sale_price
               = null                         otherwise
unit amount    = ceil(line amount ÷ qty)
items subtotal = Σ item subtotals
order total    = items subtotal − order-wide coupon discount
```

The order-wide coupon discount is on the catalog basis too (it comes from the same discount service), so the order total is the amount the items are charged after all coupons, in the item tax mode. There is no `if ($is_inclusive_tax)` branch in any resource. The flag is only passed through for labels.

### D6. One trait for shared line-item pricing

`app/Concerns/ResolvesLineItemPricing.php` holds `get_strikethrough_amount($catalog_regular_price, $catalog_sale_price, $coupon_discounted_subtotal, $quantity)` and `get_unit_amount($line_amount, $quantity)`. The methods take scalars, so the same trait serves stored order items (base and invoiced) and calculation items (base, then converted to display currency). Coupon and tax-line formatting differ per resource (models vs. DTOs, currency handling) and stay where they are. Merging them is not part of this change.

### D7. Single-mode admin keys

Each `*_exclusive_money_object` / `*_inclusive_money_object` pair becomes one `*_money_object` key with the same stem. For example, `base_subtotal_exclusive_money_object` + `base_subtotal_inclusive_money_object` → `base_subtotal_money_object`, and `invoiced_items_subtotal_*` → `invoiced_items_subtotal_money_object`. Admin payloads keep the existing `is_tax_inclusive` key. Cart and storefront payloads keep their key names. The cart payload gains `is_tax_inclusive`, and the storefront payload keeps its existing `is_inclusive_tax`.

### D8. Invoiced figures are converted per column

Each `invoiced_catalog_*` and `invoiced_discount_tax_total` is converted from its base figure with the existing `convert_amount()`, like the other invoiced columns. `invoiced_catalog_sale_price × qty` can differ from an independently converted subtotal by rounding. The strikethrough comparison (D5) therefore uses the **base** figures to decide which case applies, then shows the invoiced amount.

## Risks / Trade-offs

- [Admin React app reads the removed dual keys] → Out of scope by decision. The admin order-detail and order-create screens show missing figures until the follow-up change. Call this out in the PR.
- [Second tax pass doubles strategy work] → In-memory, per recalculation, with no DB access in the strategies. It is acceptable. If profiling shows otherwise, cache the strategy rules between passes.
- [Under tax-exclusive pricing the catalog figures duplicate the net columns] → Intentional: one meaning ("as in the catalog") under both modes keeps the resources free of mode branches.
- [Order edit refreshes catalog figures from the current variant price and tax setting] → Consistent with how the edit already recalculates totals. The edit flow is reworked in a separate session.
- [`base_product_total` is the unit regular price on input and the regular line total on output in `CalculationItemDTO`] → Pre-existing and confusing, but not changed here. The new `base_catalog_regular_price` is read before it is overwritten.

## Migration Plan

The plugin is not released yet. Edit `CreateOrderItemsTable` in place and recreate local tables. Rollback = revert the commit.

## Corrections during implementation

- **D6 trait API.** Deciding the strikethrough case from converted invoiced figures is unsafe: `invoiced_catalog_sale_price × qty` can exceed a separately converted subtotal by rounding, which would show a false strikethrough. The trait therefore splits the rule into two predicates (`is_reduced_by_product_coupon()`, `is_on_sale()`), and adds `get_order_item_strikethrough_amounts($item)`, which decides from the base figures and returns both currencies. Both order resources use it. The calculation resources use `get_strikethrough_amount()` (base only).
- **Extra consumer of the admin order payload.** The order emails render the admin `OrderResource` through `resources/views/emails/parts/order/order-summary.php`, which built the dual keys by string concatenation (`'invoiced_subtotal_' . $price_variant . '_money_object'`). It now reads the single keys. The email preview's in-memory sample order (`resources/data/sample/email/order-items.json`) gained the catalog fields, because it is never persisted and so has no defaults.
- **D4 moved to the discount service.** The action no longer filters `coupon_results` by target. `DiscountService::calculate()` now also returns `product_item_discounts` (variant ID → discount from product-scoped coupons), summed after `clamp_item_discounts()`, so it is always clamped and never above `item_discounts`. This matches the other pre-summed figures on the result (`item_discounts`, `shipping_discount`). No order-scope array is added: the order share is `item_discounts − product_item_discounts`.
