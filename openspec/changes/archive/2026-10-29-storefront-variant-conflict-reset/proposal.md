# Proposal

## Why

On the storefront product page, an option button is disabled when no purchasable
variant matches it together with the other selected options. Example: Color
(Blue, Gray) and Size (S, M, L), and only Blue-L is unavailable. With Gray-L
selected, the whole Blue button is disabled, although Blue is available in S and
M. The shopper cannot click Blue until they change the size.

## What Changes

- No option button is disabled because of the other selected options. The
  shopper can select any option at any time.
- An option that has no purchasable variant together with the current selection
  keeps the unavailable look (strike-through) but stays clickable.
- When the selected combination is unavailable, or no variant matches it, the
  Add to cart button is disabled and reads "Out of Stock".

## Capabilities

### New Capabilities

- `storefront-variant-selection`: how option buttons on the product page behave
  when a choice conflicts with another selected choice.

### Modified Capabilities

None. No existing spec covers the storefront variant selector.

## Impact

- `resources/site/ts/components/variant-selector.ts`
- `resources/views/site/shop/single.php` (option buttons, Add to cart state)
- `resources/site/scss/pages/_product-details.scss` (keep the unavailable look on clickable buttons)
- `resources/site/ts/components/variant-selector.test.ts` (new)
- No backend, API, or database change.
