## Why

A customer can select a gateway that cannot take the paying currency. The store creates the
order first, `pay()` then rejects the currency, and the customer goes to the success page with
an unpaid order. A separate fault makes this worse: each view of an unpaid order calls `pay()`
again and opens a new gateway session.

## What Changes

- Add a core rule: an online gateway can declare the currencies that it can accept. An empty
  declaration means no restriction.
- Declare currencies for PayPal (24 published codes, as an upper limit), PayFast (ZAR), PayMongo
  (PHP), and Authorize.net (the merchant account list, from a 12-hour cache). The bKash
  declaration (BDT) ships in the `add-bkash-payment-gateway` change.
- Reject an order with HTTP 422 before it is created when the selected gateway cannot accept the
  currency. This applies to shopper orders, and to manual orders that name a restricted gateway.
- At checkout, do not show a gateway that cannot accept the currency. When no gateway shows, tell
  the customer which other active store currency has a payment method, and block Place Order.
- In payment settings, show an "Unsupported" badge when no active store currency can use a gateway,
  and a "Limited" badge when only some can. Each badge has an info tooltip with the reason.
- **BREAKING:** the site order resource no longer includes `payment_next_step` when it renders a
  page. Only the checkout API response includes it, and only that response starts a payment.

Out of scope:

- Gateways whose limits depend on the merchant account: Stripe, Mollie, Paystack, PayU, Quickpay,
  Razorpay, Redsys, Square, Klarna, Eway, and 2Checkout. They stay open.
- Paddle: its plugin folder has no code.
- A `pay()` error after the order exists. The customer still goes to the success page. This needs
  a separate change, because it affects every gateway and every kind of `pay()` error.
- A button or link that switches currency from the checkout message. The message is text only.

## Capabilities

### New Capabilities

- `gateway-currency-support`: how a gateway declares its currencies, how checkout hides a gateway
  that cannot accept the paying currency, and how payment settings report this to the merchant.

### Modified Capabilities

- `payment-providers`: order placement also rejects a gateway that cannot accept the currency.
- `payment-processing-integrity`: viewing an order does not start a payment.

## Impact

- **Core PHP:** `app/Payment/PaymentProvider.php`, `app/Payment/PaymentManager.php`,
  `app/Payment/Providers/PayPal.php`, `app/Resources/PaymentMethod/PaymentMethodListResource.php`,
  `app/Actions/Order/CreateOrderAction.php`, `app/Http/Controllers/Site/SiteController.php`,
  `app/Http/Controllers/Api/Site/CheckoutController.php`,
  `app/Resources/Site/Order/OrderResource.php`.
- **Gateways:** `payments/kirki-payfast`, `payments/kirki-paymongo`, `payments/kirki-authorizenet`.
- **Storefront:** `resources/views/site/checkout/parts/payment-methods.php`,
  `resources/views/site/checkout.php`, and `resources/site/ts/components/checkout.ts`.
- **Admin:** `resources/app/features/settings/payment/` (catalog schema and method row).
- **API:** `POST /checkout` can return a new 422 error. `GET /payment-methods` gets a new
  `currency_support` field. No new endpoint.
- **External systems:** Authorize.net gets at most one list lookup per 12 hours, or one per
  5 minutes while the lookup fails.
- **Docs:** `docs/payments.md`.
- **Dependencies:** no new package.
- **Merge order:** this change has its own branch and PR to `dev`. It merges before PR #450,
  because the bKash job depends on the `pay()` fix.
