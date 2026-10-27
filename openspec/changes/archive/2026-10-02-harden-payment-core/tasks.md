## 1. Offline payments backend

- [x] 1.1 In `OfflinePaymentService`, add a private accessor that returns the stored `offline_payments` list or `[]`, and use it in `get`, `find`, `create`, `update` and `delete` → verify: with no `offline_payments` saved, `find` returns null and `delete` throws not-found instead of a PHP warning
- [x] 1.2 Add `OfflinePaymentService::set_enabled(string $id, bool $is_enabled)` that sets only `is_enabled` on the matching stored entry, saves the list, and throws not-found when no entry matches → verify: other fields on the entry are unchanged after the call
- [x] 1.3 Add `OfflinePaymentController::set_enabled` returning `data: true` with the "Payment method updated" message, and register `PATCH /offline-payments/{id}` in the admin group in `routes/api.php` → verify: route resolves, and an online provider id returns 404
- [x] 1.4 Add tests for the service behavior through the REST API (Integration, `OfflinePaymentApiTest`, since the service reads settings through the WordPress options table): toggle on and off, unknown id, never-configured list, other fields untouched

## 2. Provider settings sanitization

- [x] 2.1 In `PaymentProvider::save_settings()`, run `sanitize_settings()` before `validate_settings()` and persist the sanitized array → verify: a PayPal save with `<b>` in `client_id` stores it stripped
- [x] 2.2 Confirm absent keys are not injected as empty values by the PayPal and Stripe sanitizers on a partial save → verify: saving only `client_id` leaves no other keys added (verified for PayPal through the API; Stripe's add-on uses the same `Sanitizer`, which only visits keys that are present)
- [x] 2.3 Add tests: sanitize-before-validate, partial save still succeeds, a typical client secret round-trips unchanged (Integration, `OnlinePaymentSettingsApiTest`, run through `PUT /online-payments/{id}` because saving goes through the WordPress options table)

## 3. Checkout provider validation

- [x] 3.1 In `CreateOrderAction`, before the order is created, reject a `payment_provider` that matches no registered provider (422 `ValidationException`) → verify: unknown id creates no order
- [x] 3.2 For non-manual orders also reject a registered but disabled provider; leave manual orders with no provider, or with a registered one, untouched → verify: each of the five spec scenarios
- [x] 3.3 Add Integration tests covering the checkout scenarios (unknown, disabled, enabled, manual with none, manual with unknown) (`CheckoutPaymentProviderTest`; existing shopper-checkout fixtures in `OrderApiTest` / `OrderActivityApiTest` used a disabled or made-up provider, so they now enable PayPal through `EnablesPaymentProviders`)

## 4. Admin UI

- [x] 4.1 In `features/settings/payment/services/payment.ts`, add `setEnabledOfflinePayment` (PATCH `endpoints.OFFLINE_PAYMENT(id)`, `{ is_enabled }`, parsed with `z.boolean()`) and `useSetEnabledOfflinePaymentMutation` with the same toast and invalidation as the other offline mutations, and export both
- [x] 4.2 In `components/list/payment-methods.tsx`, use the new mutation in `handleToggle` for offline methods and drop the now-unneeded `updateOfflinePayment` usage there if nothing else in the file uses it
- [x] 4.3 Add a service test that `setEnabledOfflinePayment` sends only `{ is_enabled }` to the offline endpoint → verify: `npm test` in `resources/app/`
- [x] 4.4 Run `npm run typecheck` and lint in `resources/app/`

## 5. API collection and final checks

- [x] 5.1 Add a "Set Enabled" request under `docs/ecommerce/offline-payments/` matching the format of the online "Set Enabled" requests (200 and 404 examples)
- [x] 5.2 Run `composer phpcs:wporg`, `composer phpcs:docblocks`, and `composer test`; run `openspec validate harden-payment-core`
