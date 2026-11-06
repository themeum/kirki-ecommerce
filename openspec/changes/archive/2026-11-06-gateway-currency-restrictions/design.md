## Context

See `proposal.md` for the motivation, and `specs/` for the required behaviour.

Facts that shape the design:

- **Late check.** bKash, PayFast, PayMongo, and Authorize.net check currency in `pay()`. At that
  point the order exists. `OrderResource::resolve_payment_next_step` catches the error and sends
  the customer to the success page.
- **`pay()` on view.** `Resource::make()` calls `to_array()`, and `to_array()` calls
  `resolve_payment_next_step()`, which calls `Payment::pay()`. `SiteController` (`:192`, `:273`),
  `AccountController` (`:174`), and `CheckoutController` (`:51`) all use this resource. Only
  `resources/site/ts/components/checkout.ts:676` reads `payment_next_step`. Emails use a different
  resource, `App\Resources\Order\OrderResource`, which does not call `pay()`.
- **Paying currency.** `Money::resolve_display_currency()` reads a cookie or header. The API uses
  it when the request has no `currency_code` (`OrderCreateRequest.php:70`). The switcher sets the
  cookie and reloads the page, so PHP can render the checkout state.
- **Provider docs.** PayFast and PayMongo publish one currency. PayPal publishes a reference of
  24 codes, but some merchant accounts accept fewer. The other 11 plugins with code depend on the
  merchant account. See Decision 3.

## Goals / Non-Goals

**Goals:**

- No order is created for a declared gateway and currency that cannot work.
- The same rule and the same message apply to the page and the API.
- A valid customer is never blocked by a stale or failed lookup.

**Non-Goals:**

- Repairing `pay()` errors after the order exists. See the proposal.
- Hiding a currency from the switcher when no gateway accepts it.
- A database change, or a new admin setting.

## Decisions

### 1. Three methods on `PaymentProvider`

- `supported_currencies(): array` is the override point. The base returns `[]`.
- `supports_currency(string $code): bool` compares in upper case. An empty list returns `true`.
- `currency_unavailable_message(string $code): string` builds the shared message.

The base class holds the rule, so that the page and `CreateOrderAction` cannot differ. A third-party
gateway inherits "no restriction", so this change does not break it.

*Alternative:* a `$currencies` property, like `$countries`. Rejected: Authorize.net needs a lookup,
so a method is necessary.

### 2. Check in `validate_payment_provider`

The check goes after the existing checks in `CreateOrderAction::validate_payment_provider`, which
runs before the transaction. It uses `throw_if` with `ValidationException` and
`Response::UNPROCESSABLE_ENTITY`, as its neighbours do. It runs for manual orders too. A manual order
with no provider returns early, as it does now. An offline provider has an empty list, so it passes.

The client already shows this message through `handleApiErrors`. This covers a stale page, for
example after the customer changes currency in another tab.

### 3. Which gateways declare what

| Gateway | Declaration | Source |
|---|---|---|
| PayFast | `ZAR` (existing constant) | Existing code; developers.payfast.co.za/docs |
| PayMongo | `PHP` (existing constant) | docs.paymongo.com/reference/the-payment-intent-object |
| PayPal | 24 codes, as an upper limit | developer.paypal.com/reference/currency-codes/ |
| Authorize.net | Merchant account list | `getMerchantDetailsRequest` |
| bKash | `BDT`, in `add-bkash-payment-gateway` | developer.bka.sh |
| Others with code | Nothing | Their docs state account, country, or terminal limits |

PayPal codes: AUD, BRL, CAD, CNY, CZK, DKK, EUR, HKD, HUF, ILS, JPY, MYR, MXN, TWD, NZD, NOK, PHP,
PLN, GBP, SGD, SEK, CHF, THB, USD.

BRL, CNY, and MYR are limited for some accounts, but they stay in the list, because the list is an
upper limit. A list must never block a currency that a merchant can accept.

*Alternative:* upper limits for all gateways. Rejected by the maintainer. Each list needs upkeep,
and a stale list blocks valid customers.

### 4. Authorize.net: cache with a short failure entry

The provider override reads the framework `Cache`. The key hashes the login ID and the environment.

```
no credentials            -> [] (no lookup)
cached value              -> return it
lookup returns a list     -> cache for 12 hours, return it
lookup fails or is empty  -> cache [] for 5 minutes, return []
```

The failure entry prevents a slow request on each checkout during an outage. The `pay()` check stays
as the last guard, and it uses its live call, as it does now.

*Alternative:* block on failure. Rejected by the maintainer: an outage would remove the gateway.

### 5. Page rendering

`SiteController` gets the enabled gateways and removes those that cannot accept the display currency,
through a new `PaymentManager::get_checkout_providers($currency)`. The view lists only these, so the
existing radio markup does not change.

When the filtered list is empty and enabled gateways exist, the controller also passes the working
currencies from `get_alternative_currencies($currency)`. This method checks the active store currencies,
puts the base currency first, keeps the store order after it, removes the paying currency, and stops at
three. It reads only enabled gateways. The view renders one of these translatable strings:

- "No payment method is available for %1$s."
- "No payment method is available for %1$s. Switch to %2$s to complete your order."
- "No payment method is available for %1$s. Switch to %2$s or %3$s to complete your order."
- "No payment method is available for %1$s. Switch to %2$s, %3$s, or %4$s to complete your order."

Separate strings let translators reorder the words.

*Alternative:* a switch button. Rejected by the maintainer: the message is text only. See Risks.

### 6. Client guard

The pre-selection code does not change, because every listed radio can be used. In `placeOrder`, when
the page lists no radio, the client shows "No payment method is available." in the payment section and
sends no request. The server check is still the authority.

### 7. `pay()` runs only from the checkout response

`resolve_payment_next_step` becomes public, and `to_array()` no longer calls it.
`CheckoutController::store` builds the resource, reads `to_array()`, and adds `payment_next_step`.

This is smaller than a flag on the resource. It also makes the side effect visible at its only call
site. `resources/site/ts/types.ts:256` keeps the field, because the checkout response still has it.

*Alternative:* a parameter on `make()`. Rejected: a default that calls a gateway is the original fault.

### 8. A zero total follows the same rule

A coupon can change the total at the last moment, so a total-based exception would make the page and
the API differ. The maintainer accepted this default.

### 9. Admin badge from the server

`PaymentProvider::currency_support(array $active_codes)` returns
`{status: supported|limited|unsupported, message}`. The status and the translated tooltip come from
PHP, so that the admin and the store rule cannot differ. `PaymentMethodListResource` adds it as
`currency_support`, once for each request's list of active currencies.

The row shows the existing `Badge` with `InfoTooltip`: critical style for "Unsupported", and warning
style for "Limited". The catalog schema gets the field as nullish, so that an older response still parses.

Only the `/payment-methods` list changes. `OnlinePaymentListResource` has no reader for this badge.

An offline method and a gateway with an empty list return `supported`. An Authorize.net list that is
unknown returns `[]`, so it also returns `supported`, and the page makes at most one cached lookup.

*Alternative:* compute the status in React from a `supported_currencies` field. Rejected: this duplicates
the rule, and it needs the active currencies in the same component.

## Risks / Trade-offs

- **PayPal adds a currency** → The store blocks it until the list changes. The list is one constant,
  with its source in a comment.
- **A declared currency fails for one merchant** → The current behaviour stays, and the customer goes
  to the success page. The proposal records this follow-up.
- **Authorize.net account changes** → A change can take up to 12 hours to show. `pay()` still checks.
- **No gateway accepts a store's currency** → Checkout blocks all orders in that currency. The badge
  warns the merchant. This is correct, because each such order would fail.
- **Text-only message with no currency switcher on the page** → The customer reads "Switch to BDT", but
  the page can have no switcher, so the customer cannot complete the order. The maintainer accepted this.
  `docs/payments.md` tells merchants to add the switcher shortcode to the checkout page or header when
  they use a restricted gateway.
- **A gateway disappears from checkout** → A merchant can think it is broken. The badge explains the
  cause in payment settings.
- **Removing `payment_next_step` from pages** → A third-party template that reads the field gets no
  value. The repository has no such reader. The proposal marks this as breaking.
- **Page cache or stale tab** → A page can list a gateway for the wrong currency. The server check still
  rejects the order with 422.
- **Existing unpaid orders** → They no longer get a new session on a page view. No page used that
  session, so no customer flow is lost.

## Migration Plan

No data migration. To roll back, revert the PR. The bKash job in PR #450 needs this change, so PR #450
must merge after it, and a rollback must include PR #450.

## Corrections during implementation

- **Decision 1:** the API message also names the gateway, for example "bKash is not available in
  USD. Accepts: BDT.", because no row is next to it now that the gateway is hidden.
- **Decision 5:** the combined check is `get_currency_unavailable_notice`. The controller passes one
  message to the view, not the list of currencies.
- **Decision 5:** the base-first order comes from a new `CurrencyService::get_active_currency_codes`.
- **Decision 9:** `Badge` has no critical variant, so "Unsupported" uses `destructive`. The badge is its
  own component, `currency-support-badge.tsx`, so that a test can render it with no drag context.
- **API examples:** `docs/ecommerce/payment-methods/list.yml` and `reorder.yml` show `currency_support`.
- **Existing failure:** `EscapedOutputTest::test_icon_render_keeps_the_bundled_svg` fails on clean `dev`,
  because of SVG attribute order. This change does not address it.
