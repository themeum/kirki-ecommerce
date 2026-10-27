## Context

This mirrors the archived `admin-order-item-unit-prices` change, which added the same figures to `OrderResource`. See proposal.md for motivation.

`OrderCalculationResource::prepare_items()` already computes, in base-currency minor units:

- line subtotal, exclusive = `base_subtotal − product-coupon discount`
- line subtotal, inclusive = the exclusive figure `+ base_tax_amount`
- line strikethrough, exclusive and inclusive = from `prepare_strikethrough_price()`

`prepare_strikethrough_price()` returns formatted `MoneyDTO`s, not minor amounts, so its output can't be divided directly. Quantity comes from `CalculationItemDTO::$quantity`.

## Goals / Non-Goals

**Goals:**
- Unit figures follow exactly the same rules as `OrderResource`'s (divide the line figure, round up), so a unit price in the create screen matches what the order-detail screen shows after the order is placed.
- Existing keys, and the signature and output of `prepare_strikethrough_price()`, stay unchanged, so its existing tests keep passing.

**Non-Goals:**
- Sharing code with `OrderResource` (see Decision 3).
- Frontend changes.

## Decisions

### 1. Divide the line figures by quantity, rounding up

Same as `OrderResource`: `intdiv($amount + $quantity − 1, $quantity)`, integer-only, with quantity treated as at least 1. Every amount divided is non-negative.

- **Alternative: use `base_unit_price` / `base_regular_unit_price` from the DTO.** Rejected. They exclude the product-coupon discount and tax, which are only known per line, and would diverge from how `OrderResource` derives its unit figures.

### 2. Split the strikethrough minor amounts out of `prepare_strikethrough_price()`

Extract the amount logic into a new protected `get_strikethrough_amounts($calculated_item, $product_coupon_discount, $subtotal_exclusive)` returning `['exclusive' => int|null, 'inclusive' => int|null]`. `prepare_strikethrough_price()` becomes a thin formatting wrapper around it, with the same signature and output.

`prepare_items()` keeps calling `prepare_strikethrough_price()` for the line keys and calls `get_strikethrough_amounts()` for the unit keys. This matches how `OrderResource` settled it (see its design's "Correction during implementation"): both paths run the same logic, so line and unit figures can't disagree.

### 3. Copy the per-unit helper instead of sharing it

Add `prepare_unit_amount_object($line_amount, $quantity)` to `OrderCalculationResource`, the base-currency counterpart of `OrderResource::prepare_unit_amount_object()` (no currency-code parameter, since this payload is base-currency only).

- **Alternative: move the shared helpers into a trait used by both resources.** Deferred by the user. The two resources' strikethrough "on sale" checks read different fields (`base_regular_price > base_price` vs `base_subtotal < base_product_total`), so a shared trait needs more thought than this fix warrants.

## Risks / Trade-offs

- **[Risk] Unit × quantity can exceed the line figure by up to `quantity − 1` minor units.** → Accepted, same as `OrderResource`. The line subtotal stays authoritative.
- **[Trade-off] Duplicated helpers across the two order resources.** → A future change can extract a trait; both copies are small and covered by tests.
