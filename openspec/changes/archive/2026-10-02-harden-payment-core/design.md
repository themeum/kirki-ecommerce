## Context

See proposal.md for motivation. Current state that shapes the approach:

- Offline providers live in the `payment` settings option under
  `offline_payments`. `OfflinePaymentService` reads that array on every call and
  rewrites an item from a DTO on update; `find`, `update` and `delete` loop over
  it without a `null` fallback.
- Online providers are real objects in `PaymentManager`; their enabled flag is
  stored with their settings and flipped through `set_is_enabled()`.
- The storefront checkout page lists `Payment::get_available_providers()`
  (enabled only), but `CreateOrderAction` snapshots whatever
  `payment_provider` it is given and silently stores `null` metadata for an
  unknown ID.
- `PaymentProvider::save_settings()` validates and persists but never calls
  `sanitize_settings()`. PayPal and Stripe both define a sanitizer that is
  therefore dead code.
- The admin list toggles offline methods by sending the whole method back
  through `PUT /offline-payments/{id}`.

## Goals / Non-Goals

**Goals:**
- Checkout accepts exactly the providers the storefront offers.
- The existing per-provider sanitizers run on every settings save.
- Offline methods can be enabled or disabled with a minimal payload, matching
  the online endpoint.

**Non-Goals:**
- No change to which fields a gateway requires, and no required-field check on
  enable: saving partial gateway config stays allowed.
- No change to the fail-open defaults of `webhook()` / `refund()`.
- No webhook/event refactor and no change to how `pay()` failures redirect.

## Decisions

**1. Validate the provider inside `CreateOrderAction`, not the request class.**
Whether an order is manual is decided in the controller from the user's role,
not from the request body, and `$dto->is_manual` is only final by the time the
action runs. The rule depends on it (see 2), so it lives where both facts are
available. Failure is a `ValidationException` with HTTP 422, like the other
checks in that action. Alternative: a closure rule in `OrderCreateRequest`,
as the consent check does. Rejected because the request would have to
re-derive the admin check.

**2. Shopper orders require registered and enabled; manual orders require
only registered, and only when given.** An administrator recording an order for
a method the store has since disabled should not be blocked, and the existing
`required_if:is_manual,0` rule already makes the field optional for them. An
unknown ID is wrong either way, since it would store a `null` snapshot.

**3. Sanitize, then validate, then persist, inside `save_settings()`.**
Putting it in the base method means every provider (including add-ons that
override `save_settings()` and call the parent, like Stripe) gets it without
changes. Sanitizing before validating means validation checks the value that
will actually be stored. The sanitized array replaces `$settings` for the rest
of the method. Alternative: sanitize in `OnlinePaymentService::update()`. Rejected
because `set_is_enabled()` also calls `save_settings()` and a future caller
could bypass the service.

**4. Offline `set_enabled` flips one key and does not go through the update DTO.**
`OfflinePaymentService::set_enabled($id, $bool)` finds the entry by ID, sets
`is_enabled` on the stored array, and saves the list. It never calls
`from_offline()` or the DTO, so unrelated fields cannot be altered or dropped.
The controller returns `data: true` and the message "Payment method updated",
the same envelope as the online endpoint, so the frontend can reuse the
`z.boolean()` response schema. The route is `PATCH /offline-payments/{id}`,
inside the admin group next to the other offline routes. Alternative: a distinct
path such as `/offline-payments/{id}/enabled`. Rejected to keep parity with the
online endpoint.

**5. `?? []` at each read of `offline_payments`.** A private accessor in
`OfflinePaymentService` that returns the list or `[]` replaces the repeated
`$this->settings->get('offline_payments')` calls, so the guard cannot be missed
in one method. `create()` also benefits: appending to `null` is not an error in
PHP, but the accessor makes the intent explicit.

**6. Frontend mirrors the online pair.** Add `setEnabledOfflinePayment` and
`useSetEnabledOfflinePaymentMutation` next to the online ones in `payment.ts`,
reusing the `OFFLINE_PAYMENT(id)` endpoint helper (no new constant). The list
component's `handleToggle` calls it for offline methods instead of
`updateOfflinePayment({ ...method, is_enabled })`. Cache invalidation matches the
existing offline mutations: `paymentKeys.offline.all` and
`paymentKeys.methods.all`.

## Risks / Trade-offs

- [Existing checkouts that send a disabled or stale provider ID start failing]
  → Intended. The storefront only lists enabled providers, so a legitimate
  client does not hit this. A shopper with a cart open while an admin disables
  the method gets a clear validation error instead of an order on a method that
  is off.
- [Sanitizing text fields could alter a secret that contains markup-like or
  percent-encoded characters] → PayPal and Stripe credentials are alphanumeric
  with `-`/`_`, so this is theoretical today. Add a test that a typical secret
  round-trips unchanged, so a future gateway with unusual characters is caught.
- [Stripe's sanitizer returns only the keys it lists, so any other submitted
  key is dropped] → Matches the fields Stripe declares. Confirm during
  implementation that absent keys are not injected as empty values, which would
  turn a partial save into a wipe.
- [Two enable endpoints could drift apart] → They share the response envelope
  and the frontend response schema; a spec scenario covers each.

## Corrections during implementation

- **`update()` now throws not-found for an unknown id.** The old method wrote
  the list back unchanged and still returned a provider built from the payload,
  so `PUT /offline-payments/{unknown}` reported success while saving nothing.
  The spec's "never configured" scenario requires not-found, so `update()`
  returns it only after a match is saved.
- **Tests are Integration, not Unit, for the service and settings behavior.**
  Both read and write through the WordPress options table, which the Unit
  bootstrap stubs out, so `OfflinePaymentApiTest` and
  `OnlinePaymentSettingsApiTest` go through the REST routes instead.
- **Existing shopper-checkout fixtures needed an enabled provider.** The new
  rule correctly rejected fixtures in `OrderApiTest` and `OrderActivityApiTest`
  that placed shopper orders with PayPal while it was disabled, or with a
  made-up provider id. They now enable PayPal through the same endpoint the
  admin uses (`EnablesPaymentProviders`); one test that relied on PayPal being
  disabled turns it off again after placing its order.
- **The router caches controllers and services across requests in a test
  process**, so a service kept an earlier test's settings. `RestTestCase`
  now clears that cache, and the payment registry, after every test.
