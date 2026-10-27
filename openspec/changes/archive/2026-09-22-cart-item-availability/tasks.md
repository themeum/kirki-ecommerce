## 1. Availability check

- [x] 1.1 Add an availability check on `Variant` (e.g. `is_available()`), evaluating `product->status === ProductStatus::PUBLISHED && is_visible`, alongside the existing `scope_visible()` on `app/Models/Variant.php`.
- [x] 1.2 Add a Unit test covering the check: available (published + visible), draft product, trashed product, and not-visible variant.
- [x] 1.3 Run `composer test:unit` and `composer phpcs:wporg` — verify both pass.

## 2. Cart response flag

- [x] 2.1 In `CartResource::prepare_items()` (`app/Resources/Cart/CartResource.php`), add an `is_available` boolean per line item using the check from 1.1.
- [x] 2.2 Update/extend `tests/Unit/Resources/CartResourceCouponFormattingTest.php` or add a focused test asserting `is_available` is `true` for a normal item and `false` for a draft/trashed-product or not-visible-variant item.
- [x] 2.3 Run `composer test:unit` and `composer phpcs:wporg` — verify both pass.

## 3. Checkout enforcement

- [x] 3.1 In `CreateOrderAction::prepare_context_items()` (`app/Actions/Order/CreateOrderAction.php`), add a `throw_if` availability check (using 1.1), immediately after the existing "variant not found" check and before the stock check — same `ValidationException`/`Response::UNPROCESSABLE_ENTITY` pattern as the existing insufficient-stock check. *(Correction: placed after the "product not found" check instead. Uses `ValidationException::class, Response::UNPROCESSABLE_ENTITY` as originally planned — see design.md's "Correction during implementation" for why this needed a second pass.)*
- [x] 3.2 Add an Integration test in `tests/Integration/OrderApiTest.php` (or a new test) covering: order creation rejected when a cart line's product is draft/trashed or variant not visible, and unaffected when all lines are available.
- [x] 3.3 Run `composer test:integration` and `composer phpcs:wporg` — verify both pass. *(phpcs reported one pre-existing `date()`/`gmdate()` violation at OrderApiTest.php:191, unrelated to this change's edits — not fixed here.)*
- [x] 3.4 *(Added, per explicit direction)* Fix the same method's three pre-existing sibling checks (variant-not-found, product-not-found → `NotFoundException`/404; limit-exceeded → `ValidationException`/422) so they stop falling back to 500. Added 2 regression tests. See design.md's "Correction during implementation".

## 4. Final verification

- [x] 4.1 Run the full backend suite: `composer test` and `composer phpcs:wporg`. *(Ran via docker `kirki-test all`, since integration tests need the WP test env: 358 unit + 494 integration, all passing. `phpcs:wporg` clean.)*
- [x] 4.2 Run `npm run typecheck && npm test` in `resources/app/` to confirm no frontend regression (no frontend files are touched by this change, but this is a safety net). *(140 test files / 1154 tests pass, typecheck clean.)*
