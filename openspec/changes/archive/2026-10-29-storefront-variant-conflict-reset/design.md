# Design

## Context

`variantSelector` (`resources/site/ts/components/variant-selector.ts`) keeps
`selectedAttributes` and `selectedVariantId`. `isAttributeAvailable` checks each
option against the other selected options, and `single.php` binds the result to
`:disabled`. `updateSelectedVariant` only changes `selectedVariantId` when a
variant matches all selected options, so with no match the old variant stays.
See proposal.md for the problem.

## Goals / Non-Goals

**Goals:** let the shopper select any option, and block purchase of an
unpurchasable selection.

**Non-Goals:** no clearing or auto-picking of options, no change to the backend, stock rules, quantity, wishlist, or the page-load selection.

## Decisions

### 1. Select anything, block the cart button

Options are never disabled by the current selection. This is how Shopify
works. The existing check `!selectedVariant?.available` already disables Add to
cart and shows "Out of Stock" for an out-of-stock variant, so no new state is
needed for that case.

### 2. Replace `:disabled` with an `unavailable` class

Both option button types use the existing `isAttributeAvailable` result for a
class, the `aria-label` suffix and the `title`. They drop `:disabled` and
`aria-disabled`. The two existing `:disabled` SCSS rules also get the
`.unavailable` selector, so the look does not change.

### 3. No matching variant also blocks the cart button

Add a `hasMatchingVariant` getter: some variant matches all selected options.
The Add to cart button adds `|| !hasMatchingVariant` to its `:disabled`, and its
text shows "Out of Stock" when the getter is false. Every combination normally
has a variant, so this is a guard for bad data. Without it, the page would keep
the old variant active for a combination that does not exist.

## Risks / Trade-offs

- A shopper can select a combination that cannot be bought. → The strike-through look and the "Out of Stock" button explain it.
- The price and image stay on the last matching variant when no variant matches. → Accepted; only happens with bad data.
