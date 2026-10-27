# Design

## Context

Money is stored as integer minor units. Orders and order items hold an `invoiced_*` value (order currency) and a `base_*` value (store base currency). `orders.exchange_rate` is the base-to-order rate, `decimal(15,6)`, frozen at order creation. Forward conversion (`CreateOrderAction::convert_amount`) is `round(base × rate)`.

Tax rules, verified in `RecalculateCartAction::build_item_result`:
- Item `subtotal`, `price`, `regular_price` are always net of tax.
- Item `total` always includes tax: in a tax-inclusive store the tax is already inside the catalog price (total = price × quantity − discount); in a tax-exclusive store it is added (total = net − discount + tax).
- Item `discount_amount` is taken from the catalog price, so it includes tax when the store is tax-inclusive.
- Shipping tax is always added on top of shipping.
- `orders.total` = sum of item totals + shipping total, floored at zero.
- `spend_condition_value` is compared with the cart subtotal (sum of unit price × quantity, base minor units) for `min-cart-amount`, and with the item count for `min-items`.

`OrderManager::set_payment_provider_fee` already stores both fee columns. The base value comes from `convert_fee_to_base_currency`, which calls `Money::convert_to_currency` with `1 / exchange_rate` as a PHP float.

## Goals / Non-Goals

**Goals:**
- Comments that let a reader know currency, unit and tax treatment of each money column.
- An exact reverse conversion for the fee.

**Non-Goals:**
- Refunds (`refunds.invoiced_amount` and its logic). `UpdateRefundAction` subtracts the fee from `invoiced_total`, although the fee is not part of the total. Left for the refund work.
- Renaming columns, schema changes, or new alter migrations.
- Changing the forward conversion.

## Decisions

**Edit the existing `Create*Table` migrations.** Chosen by the user. Comments are metadata, so the schema is unchanged. Alternative: an alter migration per table, which would also update existing installs but adds many migrations for comment text. Existing installs will not see the comments.

**Divide by the rate instead of multiplying by `1 / rate`.** A test over 200,000 random rates (0.1 to 3.0, six decimals) and fees found one mismatch: rate `2.896`, fee `256115`. The float reciprocal gives `88437`; exact division gives `88438` (the true value is 884.375). The error is one minor unit and rare, but it is a real error and it is cheap to remove. Implementation: divide the fee's decimal amount by the rate using `BigDecimal` with enough scale, then build base `Money` with half-up rounding. Alternative: keep `1 / rate` with a higher-precision string. This still rounds the reciprocal once, so it is not exact for every value.

**Comment style.** One short comment per column, following `order_items.invoiced_catalog_*`, which are already commented. Pairs may share wording with "invoiced currency" or "base currency" swapped. Percent, rate and unit-of-measure columns (`discount_amount_percentage`, `base_unit_amount`, `total_unit_amount`) get no money comment.

**Fee comment.** `payment_provider_fee`: fee the gateway charged, written after payment from the gateway response. It is not part of `total`.

## Risks / Trade-offs

- [Existing installs never get the comments] → Accepted. New installs and the schema docs are the target.
- [Comment text drifts from the code] → Comments state rules that the calculation specs already cover; review each comment against `RecalculateCartAction` when writing it.
- [A forward-then-reverse round trip may not return the original base amount] → Not a goal; the fee comes from the gateway in the order currency, so there is no original base amount.
- [Brick scale or rounding mistakes with zero- or three-decimal currencies] → Build the base `Money` in the base currency so its own scale applies; cover one zero-decimal case in tests.

## Correction during implementation

The first draft of the spec and of this design said `order_items.total` includes tax only when `orders.is_tax_inclusive` is true. That was wrong. `RecalculateCartAction::build_item_result` makes `total` gross in both modes. The values that really depend on `is_tax_inclusive` are `discount_amount` (taken from the catalog price) and the `*_catalog_*` columns. The spec scenario and the context list above are corrected. The same applies to `orders.total`: it is always gross.
