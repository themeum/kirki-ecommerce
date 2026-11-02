## Context

Two admin-facing resources need to be brought up to the multi-coupon model
that already ships in the storefront/cart resources — see proposal.md - Why.
Two live examples already implement the target patterns and are the
reference for this design:

- `app/Resources/Site/Order/OrderResource.php` — coupon splitting, per-item
  `applied_product_coupons`, coupon snapshot fields, strikethrough pricing,
  merged tax-line aggregation. Uses `invoiced_*` only.
- `app/Resources/Cart/CartResource.php` — the same computed-breakdown
  pattern, but for a not-yet-placed cart. Uses `base_*`/`display_*`.

Both target files (`app/Resources/Order/OrderResource.php`,
`app/Resources/Order/OrderCalculationResource.php`) currently read model
columns directly into a flat array with no coupon-attribution or
tax-aggregation logic.

## Goals / Non-Goals

**Goals:**
- Rewrite `Order/OrderResource.php` to reuse the storefront resource's
  computed-breakdown logic (item net subtotal, order/shipping coupon
  split, coupon snapshot fields, merged tax lines, strikethrough), adding a
  `base_*` twin of every `invoiced_*` figure.
- Rewrite `Order/OrderCalculationResource.php` to reuse
  `Cart/CartResource.php`'s computed-breakdown logic, keeping its existing
  `base_*`/`display_*` twin-currency shape.
- Every monetary field is exposed as a money object only — no parallel bare
  scalar key.

**Non-Goals:**
- No React/TypeScript changes. The admin order-detail page and manual
  order creation UI will be updated in a separate follow-up change once
  this backend shape ships.
- No extraction of a shared trait/base class between the four resources
  (`Site/Order/OrderResource`, `Cart/CartResource`,
  `Order/OrderResource`, `Order/OrderCalculationResource`) even though
  their coupon-splitting and tax-aggregation logic will now be
  near-duplicated four times. The existing pair (site order vs. cart) is
  already duplicated this way, so this change follows the codebase's
  existing convention rather than introducing a new abstraction as a side
  effect of an unrelated task.
- No changes to `order-coupon-attribution` or `order-tax-lines` — the
  persisted data model is untouched; only the resource layer reading it
  changes.
- No change to the actual amount charged/invoiced on any order — this is a
  read-shape change only.

## Decisions

### `Order/OrderResource.php`: port storefront logic, add `base_*` twins

Every private helper in `Site/Order/OrderResource.php`
(`get_items_subtotal`, `get_order_coupon_discount`,
`get_shipping_coupon_discount`, `find_product_coupon_discounts_for_item`,
`sum_product_coupon_discounts`, `format_coupon_results` →
`format_applied_product_coupons`, `format_coupon_snapshot_fields`,
`convert_base_amount_to_invoiced`, `prepare_strikethrough_price`,
`format_tax_breakdown`, `flatten_item_tax_lines`) is ported as-is for the
`invoiced_*` figures. Each is extended to also compute the `base_*`
twin by running the same aggregation over `base_*` model columns instead
of `invoiced_*` ones (e.g. `base_discount_amount` alongside
`invoiced_discount_amount` on `OrderItemCoupon`/`OrderCoupon` — these
columns already exist per the money-fields convention in
`CLAUDE.md` §"Money and Pricing Fields").

`convert_base_amount_to_invoiced` (used for a coupon's fixed-amount
snapshot, which is only ever stored in base currency) is kept as-is for the
`invoiced_*` twin; the `base_*` twin of that one field needs no conversion
— it's `Money::prepare_amount_object_from_minor($base_discount_amount_fixed)`
directly.

Fields the storefront resource added that are checkout/session-specific
(`payment_next_step`, `customer` via `customer()`, `shipping_country` /
`billing_country` lookups, `formatted_status`, `item_product_data`) are
**not** ported — they don't belong on the admin resource; the admin
resource keeps its own existing fields for those concerns (e.g. it already
has a flat `customer` block sourced from order columns, not the
`CountryService`/`FulfillmentStatus`-driven ones).

Refund entries drop the bare `invoiced_amount` scalar, keeping only
`invoiced_amount_money_object` (matching what the storefront resource
already does) — no `base_*` twin needed there per the proposal, since
refunds aren't currency-converted in this codebase (see CLAUDE.md's
money-fields note that `refunds` has no `base_*` sibling).

### `Order/OrderCalculationResource.php`: port `CartResource`'s logic

`CartResource`'s pricing-block computation
(`get_items_subtotal`/`get_order_coupon_discount` against
`coupon_results`), merged `format_tax_breakdown`, per-item
`get_applied_product_coupons_for_item`/`prepare_strikethrough_price`, and
`format_coupon_results`'s `*_discount_amount_fixed_money_object` addition
are ported into `OrderCalculationResource`, replacing its current ad hoc
`base_subtotal`/`base_discount_total` root fields and its separate
`tax_lines`/`shipping_tax_lines` keys.

Because `OrderCalculationResource` already supports a `display_currency`
distinct from the store's base currency (unlike Cart, which is always
base-currency internally), every ported helper keeps both a `base_*` and a
`display_*` money object per figure, rather than Cart's `display_*`-only
shape. This is a straightforward parameterization of the same helper
bodies (Cart's helpers already accept `$base_currency_code` and
`$display_currency` — `OrderCalculationResource`'s ported versions do the
same, but emit both objects instead of only the display one).

`available_shipping_methods` drops the bare `base_cost`/`display_cost`
scalar keys it currently sets before computing the money objects, keeping
only `*_money_object` (mirrors how `CartResource`'s version already
`unset($method['base_cost'])` after reading it).

**Correction during implementation**: the initial pass kept an item-level
`tax_lines` breakdown (aggregated via `format_tax_breakdown` per item),
reasoning that a manual-order preview needs line-level tax visibility.
This was wrong to graft onto a resource explicitly modeled on
`CartResource`, which has no item-level tax exposure at all — only the
root merged `pricing.tax_lines`. Removed on review so `items[]` carries
only subtotal, strikethrough and `applied_product_coupons`, matching Cart
exactly. (The admin `OrderResource` keeps its own per-item `tax_lines`
unchanged — that one is modeled on `Site/Order/OrderResource`, which does
expose per-item tax lines alongside its root merged breakdown, so no
correction was needed there.)

### Money-object-only fields

Per the user's direction, every field that is unambiguously a currency
amount is emitted as a money object only (no adjacent bare scalar). This
applies uniformly across both rewritten resources. Non-monetary fields
(ids, codes, names, dates, discount type/target enums, percentages,
booleans) are untouched.

## Risks / Trade-offs

- **[Risk]** Both resources return a materially different payload shape
  (removed keys, restructured `coupons`/`totals`/`pricing` blocks) →
  **Mitigation**: this is an explicit, agreed BREAKING change; the React
  consumers are updated in a separate follow-up change before this ships
  to production, per the user's stated sequencing.
- **[Risk]** `base_*` twin computation for coupon/item aggregates in
  `Order/OrderResource.php` requires the same `base_*` columns to exist on
  `OrderCoupon`/`OrderItemCoupon`/`OrderTax` as their `invoiced_*`
  counterparts → **Mitigation**: verify each column exists during
  implementation (tasks.md includes a verification step); these columns
  are already established codebase convention per CLAUDE.md's money-fields
  section, so no migration is expected to be needed.
- **[Trade-off]** Duplicating the coupon-splitting/tax-aggregation logic a
  third and fourth time (rather than extracting a shared trait) keeps this
  change surgical and consistent with the existing duplication between the
  site and cart resources, at the cost of four near-identical
  implementations to keep in sync if this logic changes again in the
  future.
