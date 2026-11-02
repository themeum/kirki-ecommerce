# Tasks

Run the checks in `resources/site/`, which has its own `package.json`.

## 1. Selection logic

- [x] 1.1 In `variant-selector.ts`, add a `hasMatchingVariant` getter. Verify with unit tests in a new `variant-selector.test.ts`: true for Blue-M, false for a combination with no variant.
- [x] 1.2 Add unit tests for `isAttributeAvailable` using the Blue/Gray x S/M/L product with only Blue-L unavailable: with Gray and L selected, Blue is unavailable but selecting it works; with M selected, Blue is available.

## 2. Page template and styles

- [x] 2.1 In `single.php`, replace `:disabled` and `:aria-disabled` on both option button types with an `unavailable` class. Keep the `aria-label` suffix and `title`. Add `|| !hasMatchingVariant` to the Add to cart `:disabled`, and show "Out of Stock" when it is false. Verify by reading the markup.
- [x] 2.2 In `_product-details.scss`, add `.unavailable` to the two existing `:disabled` rules for the option and color buttons, and keep `cursor: pointer`. Verify `npm run build` compiles.
- [x] 2.3 Run `npm run lint && npm run typecheck && npm test` in `resources/site/`, and `composer phpcs:wporg` for `single.php`. All must pass. List the visual checks (strike-through look) for the user, because this project does not use browser verification.
