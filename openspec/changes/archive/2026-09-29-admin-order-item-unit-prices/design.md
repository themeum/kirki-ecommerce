## Context

`OrderResource::prepare_items()` already computes each item's line figures in minor units:

- line subtotal, exclusive = `*_subtotal − product-coupon discount`
- line subtotal, inclusive = the exclusive figure `+ *_tax_total`
- line strikethrough, exclusive and inclusive = from `prepare_strikethrough_price()`

`prepare_strikethrough_price()` returns formatted `MoneyDTO`s rather than minor amounts, so its output can't be divided directly.

Each order item stores its tax, its regular tax and any coupon discount per line, not per unit. So a per-unit figure has to be derived from the line figure.

## Goals / Non-Goals

**Goals:**
- Every unit figure comes from the same line figure the payload already shows, so a unit figure and its line figure can't disagree about whether a strikethrough applies or how tax is treated.
- Existing keys, and the behavior of `prepare_strikethrough_price()`, stay unchanged.

**Non-Goals:**
- Making unit × quantity exactly equal the line figure. That would need per-unit rounding at checkout time (see Decisions).
- Changing the storefront order resource.

## Decisions

### 1. Divide the line figures by quantity instead of reading the stored `*_price`

The four unit prices are `line figure ÷ quantity`.

- **Alternative: use the stored `invoiced_price` / `base_price` / `*_regular_price` directly.** Rejected. `invoiced_price` and `invoiced_subtotal` are each converted from base currency separately, so `invoiced_price × qty` can drift from `invoiced_subtotal`. These fields also don't include the product-coupon discount or tax, and those are stored per line only.
- **Alternative: compute per-unit tax and discount at checkout.** Rejected. It changes calculation and stored data, doesn't fix orders that already exist, and changes charged totals by rounding.

### 2. Round up (ceiling) to the currency's minor unit

The user chose this. For non-negative minor amounts, ceiling is `intdiv($amount + $quantity − 1, $quantity)`, which is integer-only and avoids float rounding. Every amount divided is non-negative: a subtotal, a tax or a strikethrough total.

### 3. Split out the strikethrough minor amounts so they can be reused

Extract the amount calculation in `prepare_strikethrough_price()` into a new protected method, e.g. `get_strikethrough_amounts()`, which returns `['exclusive' => int|null, 'inclusive' => int|null]`. `prepare_strikethrough_price()` becomes a thin wrapper that formats those amounts into `MoneyDTO`s. Its signature and output are unchanged, so its existing tests keep passing.

`prepare_items()` calls `get_strikethrough_amounts()` once per currency. It passes the result to `prepare_strikethrough_price()`'s formatting for the line keys, and divides it by quantity for the unit keys. A null amount stays null.

- **Alternative: call the strikethrough logic a second time with per-unit inputs.** Rejected. Its inclusive branch compares against `regular_price × quantity` and would need a quantity override. That duplicates the decision logic and risks a unit figure that disagrees with its line figure.

### 4. Put a small helper for division and formatting in the resource

Add a protected helper that takes a minor amount (or null), a quantity and a currency code. It returns the ceiling-divided `MoneyDTO`, or null when the amount is null. That keeps the 8 new keys in `prepare_items()` short and consistent with the existing keys.

### Correction during implementation

Decision 3 said `prepare_items()` would call `get_strikethrough_amounts()` once per currency and feed both the line keys and the unit keys from it. Instead, `prepare_items()` keeps calling `prepare_strikethrough_price()` for the line keys and also calls `get_strikethrough_amounts()` for the unit keys. Sharing one call would have either left `prepare_strikethrough_price()` used only by tests, or changed its signature, which breaks the "signature unchanged" constraint. The extra call is a few integer operations, and because both paths run the same logic, the line and unit figures can't disagree.

## Risks / Trade-offs

- **[Risk] Unit × quantity can exceed the line figure by up to `quantity − 1` minor units** (e.g. 10.00 / 3 → 3.34 × 3 = 10.02). → The user accepted this. The line subtotal stays the authoritative amount.
- **[Risk] A quantity of 0 would cause division by zero.** → Recorded order items always have quantity ≥ 1. The helper treats quantity < 1 as 1 as a cheap guard, and doesn't throw.
- **[Trade-off] The unit price is net of the product coupon,** so it can differ from the catalog unit price. → This is intended and matches the line subtotal. The unit strikethrough shows the pre-coupon unit price.
