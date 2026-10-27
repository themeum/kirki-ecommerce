## Why

Under tax-inclusive pricing, applying an order-wide coupon visibly reduces each line item's subtotal, and the admin order total is wrong. The pricing resources rebuild display figures from amounts on different bases: a pre-discount net subtotal, a post-discount tax amount, and gross coupon discounts. Every resource copies the same fragile "add the tax back" logic in both a tax-exclusive and a tax-inclusive variant. The engine has the same weakness: it excludes tax with a `tax ÷ taxable` fraction, which collapses to zero when an item is discounted to 0, leaving the item's "net" subtotal gross.

The plugin is not released yet, so we can fix the model instead of patching it: record the prices exactly as the catalog had them, and show every figure once, in the order's own tax mode.

## What Changes

- Add catalog price columns to `order_items` (in the existing `CreateOrderItemsTable` migration; no new migration), each with a `base_*` and `invoiced_*` pair and a descriptive column comment:
  - `catalog_regular_price` - unit regular price exactly as set on the variant.
  - `catalog_sale_price` - unit price actually sold at (sale price, or regular price when no sale was active) exactly as set on the variant.
  - `catalog_product_coupon_discounted_subtotal` - line total after product-scoped coupons only, before order-wide coupons.
  - `discount_tax_total` - tax before any discount minus the tax after all discounts.
  - The three catalog figures include tax exactly when `orders.is_tax_inclusive` is true.
- The calculation engine produces the same four figures on every calculated item, and both order create and order update persist them.
- The engine calculates the tax before any discount with the same tax strategy, and derives the item's net subtotal from it. This removes the `tax ÷ taxable` fraction that fails at a 100% discount.
- **BREAKING** (admin API): the admin order resource and the admin order-calculation resource drop every `*_exclusive_money_object` / `*_inclusive_money_object` pair. Each figure becomes one `*_money_object` key in the order's tax mode (stored orders: `orders.is_tax_inclusive`; live calculations: the store's tax setting). Each payload exposes `is_tax_inclusive`.
- Cart and storefront order resources keep their key names, but their item subtotal, strikethrough, items subtotal and order total read the catalog figures directly. They no longer add tax back at runtime, which fixes the order-coupon bug.
- Remove `derive_inclusive_amount()` and `derive_inclusive_amount_at_rate()` from all four resources. Shared line-item pricing logic (strikethrough, per-unit amount) moves to one trait.
- Update the API collection samples under `docs/ecommerce/orders/` to the single-key shape.
- Out of scope: the admin React app (`resources/app/`). It still reads the removed dual keys and will be updated in a follow-up change.

## Capabilities

### New Capabilities

- `order-item-catalog-prices`: an order item records its catalog regular price, catalog sale price, catalog product-coupon-discounted subtotal and discount tax total, in base and invoiced currency, in the tax mode the order was placed under.

### Modified Capabilities

- `item-pricing-tax-exclusivity`: the net subtotal is derived from the tax before any discount, not from a post-discount fraction; the requirement to derive tax-inclusive figures alongside tax-exclusive ones is removed.
- `admin-order-pricing-breakdown`: item, strikethrough, per-unit and root figures are exposed once, in the order's tax mode, instead of as tax-exclusive / tax-inclusive pairs.
- `cart-pricing-breakdown`: a line item's subtotal, strikethrough and the root totals are read from catalog figures in the store's tax mode, so an order-wide coupon never changes an item subtotal under either tax mode.
- `storefront-order-pricing-breakdown`: the same, from the order's recorded catalog figures and recorded tax mode.

## Impact

- Migration: `database/migrations/CreateOrderItemsTable.php` (8 new columns).
- Model/DTOs: `OrderItem`, `CreateOrderItemDTO`, `UpdateOrderItemDTO`, `CalculationItemDTO`.
- Engine: `RecalculateCartAction` (second tax pass for pre-discount tax, catalog figures, net subtotal derivation).
- Order persistence: `CreateOrderAction`, `UpdateOrderAction`.
- Resources: `Cart/CartResource`, `Order/OrderCalculationResource`, `Order/OrderResource`, `Site/Order/OrderResource`, plus a new trait in `app/Concerns/`.
- Tests: `RecalculateCartActionTest` and the four resource tests under `tests/Unit/Resources/`.
- Docs: `docs/ecommerce/orders/Calculate Order Totals.yml`, `get-by-id-5.yml` (and any other order sample that shows the dual keys).
- Admin React app: temporarily out of sync with the admin API until the follow-up change.
