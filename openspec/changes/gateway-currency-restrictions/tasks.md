PHP test commands use the Docker runner: `bash kirki-ecommerce-test unit` and
`bash kirki-ecommerce-test integration`. The code must stay compatible with PHP 7.4.

## 1. Stop `pay()` on page views

- [x] 1.1 Add integration tests first: a tracking page render, a failed page render, a success page render, and an account order render of an unpaid order make no gateway call and do not change stored payment data. `POST /checkout` still returns `payment_next_step` (Correction: the test renders the site order resource that all four pages use, and it does not request the full pages, because those routes run outside the REST test harness)
- [x] 1.2 Remove `payment_next_step` from `to_array()` in `app/Resources/Site/Order/OrderResource.php`, make `resolve_payment_next_step` public, and add the value in `CheckoutController::store`
- [x] 1.3 Check that `PayPalCreateOrderTest` and `CheckoutErrorStatusTest` still pass, and that the `resources/site/ts/components/checkout.test.ts` fixtures still match the checkout response
- [x] 1.4 Verify: run `bash kirki-ecommerce-test integration --filter=Checkout`, then `npm run typecheck && npm test` from `resources/app/`

## 2. Core currency rule

- [x] 2.1 Add unit tests: an empty list accepts all, a declared list rejects another currency, letter case is ignored, and the message has one form for up to five codes and another form for more
- [x] 2.2 Add `supported_currencies`, `supports_currency`, and `currency_unavailable_message` to `app/Payment/PaymentProvider.php`
- [x] 2.3 Add integration tests to `CheckoutPaymentProviderTest`: a shopper order with a restricted provider gets 422 and creates no order, a manual order with a restricted provider gets 422, a manual order with no provider and with an offline provider succeeds, and a zero-total order follows the rule
- [x] 2.4 Add the check to `CreateOrderAction::validate_payment_provider`
- [x] 2.5 Verify: run `bash kirki-ecommerce-test unit`, `bash kirki-ecommerce-test integration --filter=CheckoutPaymentProviderTest`, then `npm run typecheck && npm test` from `resources/app/`

## 3. Gateway declarations

- [x] 3.1 PayPal: declare the 24 codes from design Decision 3 in `app/Payment/Providers/PayPal.php`, with the source URL in a comment. Test `BDT` and `USD`
- [x] 3.2 PayFast and PayMongo: override `supported_currencies` with the existing constants. Keep the `pay()` checks
- [x] 3.3 Authorize.net: implement design Decision 4 with the framework `Cache`. Test a cached list, a failed lookup with the 5-minute entry and no second lookup, missing credentials with no lookup, and separate keys for each set of credentials and environment. Keep the `pay()` check
- [x] 3.4 Verify: run `bash kirki-ecommerce-test unit`, then `npm run typecheck && npm test` from `resources/app/`

## 4. Checkout page and client

- [x] 4.1 Add unit tests for `PaymentManager::get_checkout_providers` and `get_alternative_currencies`: restricted gateways are removed, disabled gateways are ignored, the base currency is first, the paying currency is removed, and the limit is three. Then implement both methods
- [x] 4.2 Pass the filtered gateways and the working currencies from `SiteController` through `checkout.php` to `payment-methods.php`, and render the messages in design Decision 5. Add an integration test for each message and for the "No payment methods found!" case (The test renders the checkout part, not the full page)
- [x] 4.3 Add a test to `resources/site/ts/components/checkout.test.ts`: `placeOrder` sends no request and shows the error when the page lists no radio
- [x] 4.4 Update `resources/site/ts/components/checkout.ts` with design Decision 6
- [x] 4.5 Verify: run the site TypeScript tests with the command that covers `resources/site/ts`, then `npm run typecheck && npm test` from `resources/app/`

## 5. Payment settings badge

- [x] 5.1 Add unit tests for `PaymentProvider::currency_support`: unsupported, limited, supported, empty list, and offline method. Then implement design Decision 9 in `PaymentProvider` and `PaymentMethodListResource`, and test that the `/payment-methods` response has the field
- [x] 5.2 Add `currency_support` to `resources/app/features/settings/payment/schemas/catalog/payment.ts`, and update its test
- [x] 5.3 Add a component test, then show the badge and tooltip in `resources/app/features/settings/payment/components/list/sortable-payment-method.tsx`. Enabling stays available
- [x] 5.4 Verify: run `bash kirki-ecommerce-test unit`, then `npm run typecheck && npm test` from `resources/app/`

## 6. Docs and standards

- [x] 6.1 Update `docs/payments.md`: how a gateway declares currencies, the upper-limit meaning, hidden gateways and the checkout messages, the badges, the need for a currency switcher on the page, the Authorize.net cache, the 422 error, the removed `payment_next_step` on pages, and the limit for account-dependent gateways
- [x] 6.2 Run phpcs on the changed PHP files with the Docker command, with a temporary config copy for `payments/*`, because `phpcs-wporg.xml.dist` excludes that path. Fix all findings (Correction: the changed lines have no findings. Older findings on other lines in `Authorizenet.php`, `AuthorizenetConstant.php`, `Paymongo.php`, and `CurrencyService.php` stay, because they are not part of this change)
- [x] 6.3 Run `openspec validate gateway-currency-restrictions --strict`
- [x] 6.4 Verify: run the full `bash kirki-ecommerce-test unit` and `bash kirki-ecommerce-test integration`, then `npm run typecheck && npm test` from `resources/app/` (Result: unit 654 pass. Integration 1493 run, 1 fail: `EscapedOutputTest::test_icon_render_keeps_the_bundled_svg`. It fails the same way on clean `dev` code, so this change did not cause it. Site 38 pass, app 2201 pass)
- [ ] 6.5 Manual check in a browser, by the maintainer: a `USD` customer does not see PayFast, sees the switch message when it is the only gateway, sees PayFast after switching to `ZAR`, and the settings badge and tooltip display correctly
