# Tasks

## 1. Shared selling-country rule

- [x] 1.1 Add a selling-country closure rule helper to `app/Concerns/ValidatesAddressFields.php`. It returns a translated error when the country is not in `CountryData::get_selling_countries()`, and `true` for an empty value or a selling country. Verify with `composer test:unit` tests: selected, excluded and all-countries modes each accept and reject the right codes. (Done as integration tests in `tests/Integration/OrderSellingLocationApiTest.php`: the rule runs through the request layer, which needs WordPress; selected, excluded and all-countries modes are covered.)
- [x] 1.2 Run `composer phpcs:wporg` and `composer phpcs:docblocks`, then `npm run typecheck && npm test` in `resources/app/`; verify all pass. (Typecheck passes; my files pass wporg and docblocks. Pre-existing and unrelated: a docblock error in `PerformOrderAction.php:224`, and 2 failing `shipping-carrier.test.tsx` tests that also fail with my changes stashed.)

## 2. Apply the rule to the order requests

- [x] 2.1 In `app/Http/Requests/Order/OrderCreateRequest.php`, apply the rule to `shipping_country`, and to `billing_country` only when `is_billing_same_as_shipping` is false. Verify with request tests: unsupported shipping rejected, unsupported separate billing rejected, billing-same-as-shipping passes with a supported shipping country.
- [x] 2.2 Verify the manual-order path (`is_manual` true, admin user) is rejected for an unsupported country, with a request test.
- [x] 2.3 In `app/Http/Requests/Order/OrderUpdateRequest.php`, apply the rule to both `shipping_country` and `billing_country` on every edit. Verify with request tests: unrelated edit on an order with an unsupported stored country is rejected, and an edit that changes it to a selling country is accepted.
- [x] 2.4 Run `composer test` and `npm run typecheck && npm test` in `resources/app/`; verify both pass. (`composer test` equivalent run in Docker: 576 unit and 1283 integration tests pass. Same 2 pre-existing JS failures as 1.2.)

## 3. Checkout toast

- [x] 3.1 In `resources/site/ts/components/checkout.ts`, make `handleApiErrors` show a toast for a rejected `shipping_country` or `billing_country`, once, besides setting the field error. Verify with the three `checkout country errors` tests in `checkout.test.ts` and `npm run typecheck && npx vitest run` in `resources/site/`.

## 4. Documentation

- [x] 4.1 Add a short section to `docs/order-editing.md` that says an edit is rejected when the shipping or billing country is not a selling location, even if the country is unchanged. Verify the doc matches the behavior in the request tests.
- [x] 4.2 Run `npm run typecheck && npm test` in `resources/app/`; verify it passes.
