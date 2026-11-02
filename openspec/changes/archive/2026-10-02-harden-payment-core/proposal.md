## Why

A review of the payment core found a few small gaps that are cheap to close
before shipping: checkout trusts whatever `payment_provider` the client sends,
provider settings are never sanitized on save, and offline payment methods have
no dedicated enable/disable endpoint (unlike online gateways), so the admin UI
has to re-send the whole payload just to flip a toggle.

## What Changes

- Checkout (`CreateOrderAction`) validates the submitted `payment_provider`
  against the registry: unknown IDs are rejected, and for shopper orders a
  disabled provider is rejected too.
- `PaymentProvider::save_settings()` runs `sanitize_settings()` before
  validating and persisting, so the per-provider sanitizers that already exist
  actually take effect.
- New `PATCH /offline-payments/{id}` with `{ is_enabled }`, mirroring
  `PATCH /online-payments/{id}`. It changes only `is_enabled` and returns
  not-found for an unknown ID.
- Admin UI: add a `setEnabledOfflinePayment` service call and mutation hook for
  the new endpoint, and use it for the offline row toggle in the payment methods
  list instead of re-sending the full method through the update endpoint.
- `OfflinePaymentService` tolerates a missing `offline_payments` setting in
  `find`, `update`, `delete` (and the new enable method) instead of looping over
  `null`.

Out of scope (deliberately deferred): required-field checks when enabling an
online gateway, changing the fail-open defaults of `webhook()` / `refund()`, the
core webhook/event refactor, the success-URL redirect on payment failure, and
the temporary public download route.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `payment-providers`: offline providers gain an enable/disable endpoint;
  checkout must only accept registered (and, for shopper orders, enabled)
  providers; provider settings are sanitized before being persisted; offline
  provider reads and writes tolerate an unset `offline_payments` list.

## Impact

- Backend: `app/Actions/Order/CreateOrderAction.php`,
  `app/Payment/PaymentProvider.php`,
  `app/Http/Controllers/Api/OfflinePaymentController.php`,
  `app/Services/OfflinePaymentService.php`, `routes/api.php`.
- Frontend: `resources/app/features/settings/payment/services/payment.ts`,
  `components/list/payment-methods.tsx`, `resources/app/config/endpoints.ts`
  (no new path; the offline detail path is reused), and the payment service
  tests.
- API: one new route (`PATCH /offline-payments/{id}`); the checkout endpoint can
  now return a validation error for an invalid `payment_provider`. No other
  response shapes change.
- Docs: the API request collection under `docs/ecommerce/offline-payments/`
  gets a request for the new endpoint, matching the online "Set Enabled" ones.
