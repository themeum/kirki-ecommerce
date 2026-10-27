## Why

The Price card shows every pricing field at once, whether or not the merchant
uses it. A product with a flat price and no sale, no unit pricing and no cost
tracking still renders a sale-price input, a base-price-per-unit row, and a
cost/profit/margin triplet — five controls that will stay empty. The card reads
as a form to fill in rather than a price to set, and the fields that matter are
crowded by the ones that do not.

The new design inverts that: the price is the card, and everything else is
something you add. A merchant who wants a sale price asks for it; a merchant
who does not never sees the field. Removing a row also removes its data, so
what the card shows and what the product stores stay in agreement.

## What Changes

- The card opens with a single full-width price input and three buttons —
  "+ Sale price", "+ Unit price", "+ Cost & profit". Each reveals its row and
  focuses its first field.
- Each revealed row carries a ⊖ control that hides the row **and clears its
  stored values**: Sale price clears `base_sale_price`; Unit price clears
  `total_unit_amount`, `total_unit`, `base_unit_amount` and `base_unit`;
  Cost & profit clears `base_cost_of_goods`. A removed row saves as no data.
- A row is open on load when it already holds a value. From then on only the
  buttons change that — emptying an input by typing leaves the row open, so a
  field never disappears mid-edit.
- Sale price gains a discount badge reading `N% off`, computed as
  `round((1 - sale / regular) * 100)` and shown only for a genuine discount
  (`regular > 0` and `0 < sale < regular`).
- Profit and Margin become read-only text instead of disabled inputs — they are
  derived from price, sale price and cost, and were never stored.
- The charge-tax row loses its dark inner card and sits as a plain row beneath
  the separator. The tax-profile select still appears when the box is ticked.
- Copy changes as drawn: the price input drops its "Regular price" label and is
  labelled by the card title (keeping an accessible name for screen readers);
  "Cost of goods" becomes "Cost per item"; "Margin(%)" becomes "Margin".
- No schema, payload, or backend change. The same fields are written as before;
  only which of them are on screen, and when, changes.

**This lands on two surfaces.** The card is shared — the product form scopes it
to `variants.0.`, the variant edit page to the form root — so the variant edit
page gets the identical redesign. That is intended.

## Capabilities

### New Capabilities

- `product-price-card`: the Price card's structure, its progressive disclosure
  of optional pricing rows, the clear-on-remove contract, the discount badge
  rule, and the charge-tax row.

### Modified Capabilities

None.

## Impact

Affected code: `resources/app/features/products/components/variant-sections/price/price.tsx`
is rewritten. It may gain a sibling module for the pure parts — the discount
percentage and the "which rows start open" decision — so both are testable
without rendering, per the `component-logic-separation` spec.

Reused as-is: `MoneyField` (which already accepts `autoFocus`), the `Badge`
primitive's `success` variant for the green pill, `BaseUnitPopover`,
`CreatableSelectField` and `TaxProfilePopup`, `calculateProfit`, and the
`useVariantField` / `useVariantValues` scope hooks.

Risk: the clear-on-remove behaviour is the only part that can lose merchant
data, and it is deliberate — ⊖ is the documented way to say "this product has
no sale price". The guard against accident is that ⊖ is the *only* thing that
clears: no amount of typing, backspacing or re-rendering empties a field. The
derived helpers get unit tests; the rest is verified by typecheck, lint and the
existing suite. Per CLAUDE.md §0 there is no browser verification, so the
visual result is for the user to confirm.
