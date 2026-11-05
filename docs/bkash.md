# bKash Payments

The `kirki-bkash` plugin takes payments from bKash wallets through bKash Tokenized
Checkout without agreement, API v2. The customer pays on the bKash page and then
returns to the store. The store marks an order paid only when bKash confirms the
full amount in a server-to-server response.

- [1. Quick start](#1-quick-start)
- [2. Settings](#2-settings)
- [3. Requirements and limits](#3-requirements-and-limits)
- [4. Payment flow](#4-payment-flow)
- [5. Refunds](#5-refunds)
- [6. Tokens](#6-tokens)
- [7. Troubleshooting](#7-troubleshooting)
- [8. Where this differs from the official bKash plugin](#8-where-this-differs-from-the-official-bkash-plugin)

---

## 1. Quick start

1. Get the App Key, App Secret, Username and Password from bKash.
2. Install and activate the plugin. Add it from **Settings → Payments → Payment
   Gateways**.
3. Open bKash in **Settings → Payments**, enter the credentials, and keep **Sandbox
   Mode** on.
4. Set the store permalinks to any value except **Plain**.
5. Make a test order in BDT. Pay with a bKash sandbox wallet.
6. Turn **Sandbox Mode** off when the test passes, and use live credentials.

There is no webhook to configure.

---

## 2. Settings

| Setting | Description |
|---|---|
| App Key | Sent with each API call. |
| App Secret | Used to get tokens. The store keeps all of its characters. |
| Username | Used to get tokens. |
| Password | Used to get tokens. The store keeps all of its characters. |
| Sandbox Mode | On: `tokenized.sandbox.bka.sh`. Off: `tokenized.pay.bka.sh`. If it has no saved value, the store uses the sandbox. |

---

## 3. Requirements and limits

- **BDT only.** bKash accepts only BDT. For an order in another currency, the customer
  sees an error after pressing Pay, and can select another method.
- **Pretty permalinks.** On **Plain** permalinks the return URL contains a query string,
  and bKash appends `?paymentID=...` to it. This can break the return.
- **A payment ID lives 24 hours** and allows one Execute attempt.
- **Refunds:** up to 10 partial refunds per transaction, within 60 days. bKash refuses a
  duplicate refund within 10 minutes.

---

## 4. Payment flow

1. The customer presses Pay. The store creates a bKash payment, with the order UUID as
   the invoice, and stores the payment ID on the order.
2. The customer approves the payment on the bKash page.
3. bKash returns the customer to `/payment/webhook/bkash` with `paymentID` and `status`.
4. The store asks bKash for the payment (Query), and finds the order from the reported
   invoice.
5. The store calls Execute only when the payment ID is the one stored on the order, the
   order is unpaid, `status` is `success`, and the payment is not already `Completed`.

| Result | Order | Customer page |
|---|---|---|
| bKash reports `Completed`, and the amount and currency match | Paid | Success |
| bKash reports `Completed`, and the amount or currency differs | On hold, and a critical log entry | Failed |
| bKash rejects Execute, for example insufficient balance | Payment failed | Failed |
| `status` is `cancel` or `failure` | No change | Failed |
| The payment ID is not the latest one for the order | No change, and a warning log entry | Failed |
| bKash does not recognize the payment ID, or no order has the invoice | No change | Home |
| Execute has no clear result, and Query reports `Completed` | Paid | Success |
| Execute has no clear result, and Query does not report `Completed` | **Unpaid, and a critical log entry** | Success |

**The last row needs action from the admin.** The money may have moved, but the store
cannot confirm it. The customer goes to the success page, because the failed page offers
another payment and can cause a double charge. Search the log for the payment ID, and
check it in the bKash panel. If bKash completed the payment, mark the order paid and enter
the transaction ID manually.

If the customer starts payment twice for one order, only the latest payment can complete.
If the customer approves an older one, the store does not execute it, and bKash does not
complete it.

The URL parameters are not proof of payment. A person can edit them. The store does not
change the payment status because of them.

---

## 5. Refunds

A refund from the admin order screen goes to the bKash Refund API. The store sends the
payment ID, the transaction ID, the amount, the order UUID as the SKU, and the refund
reason. If there is no reason, it sends `Refund by merchant`.

| Result | What happens |
|---|---|
| bKash reports `Completed` | The store records the refund. |
| bKash rejects the refund | The admin sees the bKash message, and the store keeps no refund record. |
| No clear result, and Refund Status shows a new completed refund of this amount | The store records the refund. |
| No clear result, and Refund Status shows no new refund | The admin sees an error and can try again. |
| No clear result from both calls | The admin sees an error that says to check the bKash panel before a retry. |

---

## 6. Tokens

bKash allows Grant and Refresh only twice per hour, and more calls block refresh for one
hour. The store keeps tokens in the cache, per environment and App Key, and renews a token
after 50 minutes. Only one request can renew at a time. Other requests use the current
token, which stays valid for 60 minutes.

If no token exists and another request is getting one, the customer sees a payment error
and can try again.

If an object cache flush removes the token, the next call uses one Grant.

---

## 7. Troubleshooting

| Symptom | Check |
|---|---|
| "bKash credentials are missing" | All four credentials are saved. |
| "bKash accepts only BDT" | The order currency is BDT. |
| "bKash did not give a clear result" at checkout | The credentials and Sandbox Mode match. Credentials must be valid for API v2. |
| Customer returns to a broken page | The permalinks are not **Plain**. |
| Payment errors for about one hour | The token rate limit was reached. Do not change the settings repeatedly. |
| Paid at bKash, unpaid in the store | See the last row of the table in section 4. |

---

## 8. Where this differs from the official bKash plugin

This list compares with [bKash for WooCommerce](https://github.com/bKash-developer/bKash-for-woocommerce)
v1.0.5.

- **API version.** This plugin uses only v2. The official plugin defaults to v1.2.0-beta.
- **Products.** This plugin supports only Tokenized Checkout without agreement. There is
  no regular Checkout, saved wallet agreement, or authorize and capture.
- **No webhook or IPN.** A POST to the webhook URL does nothing, so the gap in the last
  row of the table in section 4 stays open.
- **No background retry.** No job checks unresolved payments later.
- **No signature check.** The bKash docs give no algorithm for the `signature` value, so
  the store ignores it, and relies on server-to-server confirmation.
- **No provider fee.** The store does not record the bKash service fee on the order.
- **No merchant tools.** There are no transaction search, balance, or transfer screens.
- **No checkout filter by currency.** bKash shows at checkout for a non-BDT order, and
  the error comes after the customer presses Pay.
- **Unconfirmed live host.** The bKash docs publish only the sandbox host. Confirm the
  live host with bKash before you go live.
