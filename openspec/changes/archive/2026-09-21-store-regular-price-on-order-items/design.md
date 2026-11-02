## Context

The cart derives a line's strikethrough price from `CalculationItemDTO::base_product_total`, the regular unit price times quantity, produced by `RecalculateCartAction`. The order item keeps only the charged unit price (`base_price`/`invoiced_price`, `variant.base_sale_price ?: variant.base_price`) and a line subtotal, so the storefront `OrderResource` has no regular price to compare against. See proposal.md for the motivation.

Two facts constrain the design:

- `CreateOrderAction` and `UpdateOrderAction` both build an order item from a `CalculationItemDTO` plus the live `$variant`. `UpdateOrderAction::prepare_update_order_item_dto()` copies `invoiced_price`/`base_price` from the existing item, and its `build_calculation_items()` never sets `base_product_total`, so the calculated item's value there is unusable.
- Invoiced amounts are converted from base at write time with `convert_amount()` and the order's frozen `exchange_rate`, so a stored `invoiced_*` value and a value converted at read time are identical.

## Goals / Non-Goals

**Goals:**

- The storefront order payload reproduces the cart's strikethrough rule for a placed order.
- The regular price is a typed, frozen money column pair that follows the `base_*`/`invoiced_*` convention, not something read out of the `product_data` JSON.

**Non-Goals:**

- Changing the admin `Order\OrderResource` payload, the email order summary, or the account order-details view.
- Backfilling existing orders.

## Decisions

### Store the regular unit price, not a line total

Add `base_regular_price` and `invoiced_regular_price` as unit amounts, next to `base_price`/`invoiced_price`. Both are `integer`, `default(0)`.

- **Alternative: store the line total (`base_product_total`).** This mirrors the calculator's name, but `UpdateOrderAction` does not populate it, and the line total goes stale when an edit changes quantity. A unit price is copied forward on edit exactly like `base_price`, and the line amount is `unit × quantity` when read.
- **Alternative: read `product_data.variant.base_price`.** No schema change and it covers old orders, but it makes the resource depend on the shape of an untyped snapshot and breaks the payload's rule of reading only frozen money fields.
- **Alternative: read the live variant.** Wrong as soon as a price changes.

### Write path

- `CreateOrderAction::prepare_order_item_dto()` and `UpdateOrderAction::prepare_order_item_dto()` (new items) set `base_regular_price = $variant->base_price` and `invoiced_regular_price = convert_amount($variant->base_price, ...)`, next to the existing price lines.
- `UpdateOrderAction::prepare_update_order_item_dto()` copies both columns from `$existing_item`, next to the existing `invoiced_price`/`base_price` copy.
- Add both columns to `CreateOrderItemDTO`, `UpdateOrderItemDTO` and `OrderItem::$fillable`.

### Migration

A new alter migration, `AlterOrderItemsAddRegularPriceColumns`, registered in `config/migrations.php` after `AlterOrderItemsDropTaxColumns`. Columns are added after `base_price` with `default(0)`. No backfill: `0` is the "unknown" value and is never treated as a sale (see the next decision). `down()` drops both columns. The `CreateOrderItemsTable` migration is left as is, because fresh installs run the create migration then the alter migration in sequence (`schema-upgrade-migrations`).

### Read path

In `Site\Order\OrderResource::prepare_items()`, replace the inline ternary with a `prepare_strikethrough_price()` method, the same name and rule as `CartResource`:

1. Product-scoped coupon discount `> 0` → `invoiced_subtotal`, the sale-adjusted total before the coupon.
2. Else `base_regular_price > base_price` → `invoiced_regular_price * quantity`.
3. Else `null`.

The sale check compares the `base_*` integers. Comparing the converted `invoiced_*` values could show a phantom strikethrough when currency conversion rounds the two amounts differently by one minor unit. With `base_regular_price` at its default `0`, the comparison is false, so legacy orders degrade to no sale strikethrough with no special case.

The sale total `invoiced_regular_price * quantity` can differ from the converted line total by rounding. That is a cosmetic one-unit difference and only appears when the item really was on sale.

## Risks / Trade-offs

- [Legacy orders never show a sale strikethrough] → Accepted, since no backfill was requested and the plugin is at `1.0.0-alpha`. The `product_data` snapshot could support a later backfill.
- [The rule now lives in three places: `CartResource`, `OrderCalculationResource`, and `Site\OrderResource`] → Extracting a shared helper is out of scope here. The rule is documented in `cart-pricing-breakdown` and `storefront-order-pricing-breakdown`.
- [An order edit that adds an item snapshots that variant's regular price as of the edit] → Matches how `base_price` is already handled for newly added items.
