# SSLCommerz Payments

The `kirki-sslcommerz` plugin takes payments through the SSLCommerz API v4 hosted page. The
customer pays on the SSLCommerz page with a card, mobile banking, or internet banking, and then
returns to the store. The store marks an order paid only when the SSLCommerz Order Validation API
confirms the payment, and the transaction ID, amount, and currency match the order.

- [1. Quick start](#1-quick-start)
- [2. Settings](#2-settings)
- [3. Requirements and limits](#3-requirements-and-limits)
- [4. Payment flow](#4-payment-flow)
- [5. Risky payments](#5-risky-payments)
- [6. Refunds](#6-refunds)
- [7. Troubleshooting](#7-troubleshooting)
- [8. Where this differs from the official SSLCommerz plugin](#8-where-this-differs-from-the-official-sslcommerz-plugin)

---

## 1. Quick start

1. Get a sandbox store from [SSLCommerz sandbox registration](https://sandbox-gw.sslcommerz.com/register).
2. Install and activate the plugin. Add it from **Settings → Payments → Payment Gateways**.
3. Open SSLCommerz in **Settings → Payments**, enter the Store ID and Store Password, and keep
   **Sandbox Mode** on.
4. Make a test order. Use a [test card](#sandbox-test-data).
5. Turn **Sandbox Mode** off when the test passes, and use your live credentials.

The plugin sends its IPN URL with each payment, so the merchant panel needs no IPN setting.

---

## 2. Settings

| Setting | Description |
|---|---|
| Store ID | The API store ID. Sandbox and live stores have different IDs. |
| Store Password | The API password, not the merchant panel password. The store keeps all of its characters. |
| Sandbox Mode | On: `sandbox.sslcommerz.com`. Off: `securepay.sslcommerz.com`. If it has no saved value, the store uses the sandbox. |

### Sandbox test data

Use this data only with **Sandbox Mode** on.

| Card | Number | Expiry | CVV |
|---|---|---|---|
| VISA | `4111111111111111` | 12/26 | 111 |
| Mastercard | `5111111111111111` | 12/26 | 111 |
| American Express | `371111111111111` | 12/26 | 111 |

The mobile banking OTP is `111111` or `123456`. The sandbox page also has **Success**, **Success
with risk**, and **Failed** buttons. The SSLCommerz docs publish no mobile banking test numbers.
The test cards expire at the end of December 2026. Check the SSLCommerz docs for new values after
that date.

---

## 3. Requirements and limits

- **Currency.** The plugin declares no currency list, because SSLCommerz publishes no full list.
  Checkout shows SSLCommerz for all currencies. If SSLCommerz rejects a currency, the customer sees
  its reason, and the order exists but is not paid. SSLCommerz converts other currencies to BDT at
  its own rate and settles in BDT.
- **Amount.** The docs give 10.00 to 500000.00 BDT. Your store can have a different limit. The plugin
  does not check the range. It shows the reason from SSLCommerz.
- **Firewall.** The IPN needs access to your site on port 80 or 443. Allow the sources below, and
  let your server reach the destinations on port 443.

  | Environment | IPN source | Outbound destination |
  |---|---|---|
  | Sandbox | `103.26.139.87` | `103.26.139.87` |
  | Live | `103.26.139.81`, `103.132.153.81` | `103.26.139.148`, `103.132.153.148` |

  The plugin does not use these addresses as a security check, because a proxy can hide them.
- **Refunds.** Your server public IP must be registered with SSLCommerz. See [section 6](#6-refunds).
- **TLS.** SSLCommerz accepts only TLS 1.2 or later.

---

## 4. Payment flow

1. Checkout calls the session API with a new transaction ID (`{order_id}-{random}`). The order stores
   the transaction ID, the session key, the amount, and the currency. The customer goes to the
   SSLCommerz page.
2. SSLCommerz can tell the store about the result in three ways:
   - The **customer return** is a browser POST. It arrives with no session or nonce, and it ends in a
     303 redirect to a store page.
   - The **IPN** is a server-to-server POST.
   - The **scheduled check** queries the transaction at 5 minutes, 15 minutes, 1 hour, 6 hours, and
     24 hours after the payment starts. It stops when the order is settled.
3. All three use one path. The request must name the transaction ID that the order stores. Then the
   store calls the Order Validation API, and requires these results:
   - The status is `VALID` or `VALIDATED`.
   - The transaction ID in the response is the one on the order.
   - `currency_type` and `currency_amount` equal the order currency and total.
4. The store applies the result once, under an order lock.

No value from the inbound request decides the order state. This includes `status` and `verify_sign`.
The store checks `verify_sign` and logs a wrong value, and it continues.

| Result | Order | Customer page |
|---|---|---|
| Confirmed and low risk | Paid | Success |
| Confirmed and risky | Paid and on hold | Success |
| Amount or currency differs | On hold, not paid, critical log entry | Failed |
| API rejects the validation ID | No change | Failed |
| API has no clear result | No change, critical log entry | Success, because the failed page offers a new payment and the money may have moved |
| Order is cancelled | No change, critical log entry. Refund it in the panel. | Failed |
| Second payment on a settled order | No change, critical log entry. Check for a double payment. | Success |

### Failed and cancelled payments

A fail return, a cancel return, or an IPN with a non-success status does not change the order. The
store first queries the transaction:

- An element reports success: the store runs the validation path.
- No element reports success or pending: the store marks the payment failed.
- An element is pending, or the query has no clear result: no change.

A failed order can still become paid if a scheduled check finds a late success. "Try Again" makes a new
order, so a late success and a second payment can give two paid orders. Refund one in the panel.

After the last check, an order with no result stays as it is, and a log entry records the event.

The checks use the store queue. If the plugin is inactive when a check runs, that check fails, and no
later check runs for that payment.

---

## 5. Risky payments

SSLCommerz can report a successful payment with `risk_level` `1`. The money is captured, and
SSLCommerz says to hold the service and verify the customer.

The store treats only `risk_level` `0` as low risk. For any other value, including a missing value, the
order goes to **paid and on hold**, and the order stores `risk_level` and `risk_title`. A warning log
entry records the event. The order on-hold event fires, so its email goes out if it is enabled.

To continue, use the normal order actions:

- **Resume fulfillment** when you trust the customer.
- **Cancel the order**, and then refund it.

---

## 6. Refunds

A refund from the order screen goes to SSLCommerz. SSLCommerz processes refunds later, so the flow has
two steps.

1. The store sends the refund. On `success`, the refund row stores the SSLCommerz reference and stays
   **pending**.
2. A scheduled check queries the refund at 1, 6, 24, 72, and 168 hours after the refund. `refunded` marks
   it **completed**. `cancelled` marks it **cancelled** and writes a log entry. After the last check, the
   row stays pending, and a log entry tells you to check the panel.

| SSLCommerz answer | Result |
|---|---|
| `success` | Pending row, scheduled checks |
| `processing` | Error. No local refund. A refund has already started. |
| `failed` | Error with the SSLCommerz reason. No local refund. |
| No clear result | Error that says to check the panel. No local refund, and no automatic retry. |

**No clear result.** The refund can exist at SSLCommerz with no row in the store, and the SSLCommerz API
has no way to look it up. Check the panel before you try again. A repeat of the same amount sends the
same `refund_trans_id`, but SSLCommerz does not say that this value removes duplicates.

**Public IP.** SSLCommerz requires a registered public IP for refund calls on live. If your hosting
changes your IP, refunds can fail with no fault in the store.

**Gaps in the SSLCommerz docs.** The docs do not state these items, and the plugin does not add rules for
them:

- Whether partial refunds and repeat partial refunds are allowed, and the time limit. The plugin sends the
  amount that you enter.
- The currency of `refund_amount` on a non-BDT payment. The plugin sends the number in the order
  currency. **A refund of 100.00 on a USD order may refund only 100 BDT.** Check the amount in the panel
  after each non-BDT refund, or refund these orders in the panel.

---

## 7. Troubleshooting

| Symptom | Check |
|---|---|
| "SSLCommerz credentials are missing" | The Store ID and Store Password are saved. |
| "The store credentials are not correct" | Use the API password, not the panel password. The credentials must match **Sandbox Mode**. |
| "Invalid Amount after converted" or a currency error | SSLCommerz does not accept this currency for your store. |
| "Transaction amount is not allowed" | Your store has an amount limit. Ask SSLCommerz. |
| Paid at SSLCommerz, unpaid in the store | Wait for the scheduled checks. Check that the queue runs and that your firewall allows the IPN. |
| Order is on hold and unpaid | The amount or the currency differs from the order. See the critical log entry. |
| Order is paid and on hold | SSLCommerz reports the payment as risky. See [section 5](#5-risky-payments). |
| "no valid signature" in the log | No action is necessary. This has no effect on the order. |
| Refund error about the IP, or refund refused | Register your server public IP with SSLCommerz, and ask them to enable refunds for your store. |
| Refund stays pending | Check the refund in the SSLCommerz panel. |

---

## 8. Where this differs from the official SSLCommerz plugin

This list compares with the [SSLCommerz WooCommerce plugin](https://github.com/sslcommerz/SSLCommerz-Woocommerce)
v6.2.0 and the [SSLCommerz PHP library](https://github.com/sslcommerz/SSLCommerz-PHP).

- **Hosted page only.** There is no EasyCheckout popup, saved card API, recurring charge, or EMI. The
  hosted page can still offer its own saved cards.
- **Validation.** The official IPN code changes order state from an unvalidated failure message, and it
  compares only the amount. This plugin confirms all messages, and it also compares the transaction ID
  and the currency.
- **Refunds.** The official plugin and library have no refund code. This plugin has refunds, built from the
  docs only. No live refund has been tested.
- **Signature.** The official library turned its hash check off by default in June 2026 and gave no reason.
  The v4 docs do not describe the algorithm. This plugin logs a wrong signature and does not act on it.
- **Risk.** This plugin always keeps a risky payment paid and on hold.
- **Transaction ID.** The official plugin uses the order ID. This plugin adds a random part.
- **Scheduled checks.** The official plugin has none. This plugin does not offer a manual check action in
  the order screen.
- **Undocumented behaviour.** The SSLCommerz docs do not state the IPN retry policy, which IPN URL wins
  when the panel also has one, the session lifetime, or the full currency list. This plugin assumes that
  an IPN can be lost, repeated, or late.
