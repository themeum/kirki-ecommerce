# Transactional Emails

The notification emails the store sends when something happens to an order, a
customer account or a product's stock. Each one is a template under
**Settings → Email**, and each template has a real trigger in the store: an
enabled template goes out, a disabled one does not.

Every email is sent **in the background** through the plugin's queue, never
during the request that triggered it. Section 4 explains what that means for
timing and retries, and section 5 covers the two emails where the store takes
over from WordPress's own.

- [1. Quick start](#1-quick-start)
- [2. What sends which email](#2-what-sends-which-email)
- [3. Duplicate protection](#3-duplicate-protection)
- [4. Background delivery](#4-background-delivery)
- [5. Taking over WordPress's account emails](#5-taking-over-wordpresss-account-emails)
- [6. Customer-visible order notes](#6-customer-visible-order-notes)
- [7. Adding a new notification](#7-adding-a-new-notification)
- [8. Where this differs from WooCommerce](#8-where-this-differs-from-woocommerce)

---

## 1. Quick start

Go to **Settings → Email**. The page lists every notification, grouped by
recipient (customer or admin) and subject (order, user, inventory). The toggle
on a row turns that email on or off, and **Edit** opens its subject, heading and
message, with a live preview and a **Send test mail** button.

That is all the configuration there is. Nothing needs to be wired up per email:
once a template is enabled, the store event in section 2 sends it.

Admin emails go to the **store email** under **Settings → General**. If that is
empty, they go to the WordPress site admin email.

---

## 2. What sends which email

| Template | Sent when | To |
|---|---|---|
| Customer · New order | An order is placed. Admins can re-send it with the order's **Resend order email** action. | Customer |
| Admin · New order | An order is placed | Store admin |
| Customer · Cancelled order | The order, or its fulfillment, is cancelled | Customer |
| Admin · Cancelled order | Same | Store admin |
| Customer · Payment failed | The order's payment changes to failed (admin or payment gateway) | Customer |
| Admin · Payment failed | Same | Store admin |
| Customer · Order on hold | The order's fulfillment is put on hold | Customer |
| Customer · Order processing | An admin marks the order as processing. *Resuming* from on hold does not send it. | Customer |
| Customer · Order shipped | The order is marked as shipped. Tracking details added **before** that are included. | Customer |
| Customer · Order completed (subject "Order Delivered") | The order is marked as delivered, whatever its payment status. Paying for it later sends nothing more. | Customer |
| Customer · Order note | An admin adds a comment in the order's timeline (section 6) | Customer |
| Customer · Reset password | A customer requests a password reset on the WordPress login page (section 5) | Customer |
| Customer · New account | A **new** WordPress account is created for a customer: self-registration, or an admin creating a customer with **Create WordPress user** ticked (section 5) | Customer |
| Admin · Low stock | Tracked variants' available stock drops to their low-stock threshold. One email per order lists every such variant (section 3) | Store admin |
| Admin · Out of stock | Tracked variants' available stock drops to zero. One email per order lists every such variant (section 3) | Store admin |

Two templates on the settings page have **no trigger** yet. See section 8.

The same order emails fire whether an admin performs the action or a payment
gateway reports it, because both go through the same order transitions.

---

## 3. Duplicate protection

A notification describes a *change*, so each one fires only when the change
really happens:

- **Order emails** fire only when the order's status actually changes. For
  example, marking a delivered order as delivered again is rejected and sends
  nothing.
- **Payment failed** fires only when the payment was not already failed, so
  gateway webhook retries don't email the customer again.
- **Order delivered** fires once, when the order is marked as delivered. It
  does not wait for payment, and paying for a delivered order later sends no
  second email.
- **Inventory alerts** fire on a **crossing**, not on every sale. Say a variant
  has a threshold of 5. Going from 6 to 5 sends one low-stock alert, and a later
  sale from 5 to 3 sends nothing. If you restock above 5 and it drops again, you
  get a new alert. A single sale that goes straight from above the threshold to
  zero sends only the out-of-stock alert.
- **Inventory alerts are grouped per order.** When one order (placed or
  edited) takes several variants across a level, the admin gets **one**
  low-stock email and/or **one** out-of-stock email listing all of them, not one
  email per variant. The *Restock Now* button opens the product when every
  listed variant belongs to one product, otherwise the products list. Separate
  orders still send separate emails.

The low-stock threshold is the variant's own, when set. Otherwise it is the store
default under **Settings → Products**. A threshold of 0 (or none) means
out-of-stock alerts only. Variants that don't track inventory never alert.

---

## 4. Background delivery

Every email is a queued job on the `emails` queue:

- **One job per recipient.** When an event emails both the customer and the
  admin, each gets their own job, so a retry never re-sends to someone who
  already got the email.
- **Retries.** A send that `wp_mail()` reports as failed is retried up to 3
  times, 60 seconds apart.
- **Disabled means disabled.** The job checks the template again when it runs.
  If you turn a template off while an email is waiting, that email is not sent.
- **Rolled back means not sent.** If the admin action that triggered an email
  fails and is rolled back, its queued email is rolled back with it.
- **Content is built at send time.** The email shows the order or stock as it is
  when the job runs, for example tracking details added in the meantime.

The queue starts a background worker when the request finishes, through a
loopback request to the site itself. On hosts that block loopback requests,
emails wait for the next WP-Cron run instead. That is usually within a minute
on a site with traffic.

---

## 5. Taking over WordPress's account emails

WordPress sends its own password-reset and new-user emails. For **customers**
(users who cannot manage the site), the store replaces them with its templates:

| | Reset password | New account |
|---|---|---|
| Replaces | WordPress's "Password Reset" email | WordPress's new-user email to the user |
| Needs | WordPress 6.0+ | WordPress 6.1+ |
| Contains | A reset link | A **set-password link**, the `{set_password_link}` button |

- The takeover applies only while the store's template is **enabled**. Turn it
  off and WordPress's own email is back, so customers can always reset their
  password.
- **Administrators** are never affected: they keep WordPress's emails.
- On **older WordPress** (below the versions above), the store cannot stop
  WordPress's email. It leaves WordPress's behaviour alone and does **not** send
  its own template, so nobody gets two emails.
- The reset or set-password key is generated when the email is **sent**, not
  when it is queued, so no usable key is ever stored in the queue.

### The set-password link on existing sites

Customers an admin creates with **Create WordPress user** get a random password, so the new-account email
carries a `{set_password_link}` button. The default message includes it. If you
saved the New account template before this update, your saved message doesn't.
Open the template and insert **Set Password Link** from the shortcode list.

### Customers linked to an existing account

**Customers → Add** looks up the email address first. If a WordPress user with
that email already exists, the new customer is **linked** to that account, even
with **Create WordPress user** ticked. No account is created, so no New account
email is sent: that person already has a login and a password.

---

## 6. Customer-visible order notes

Every comment an admin adds in an order's **Timeline** is emailed to the
customer: the Order note email contains exactly that comment's text, and the
comment shows a **Customer notified** marker. There is currently no way to add
an internal-only comment from the admin screen, so don't write anything in the
timeline that the customer shouldn't read.

The API is `POST /orders/{order_id}/activities`. The admin screen always sends
`"notify_customer": true`. Omitting the flag, or sending `false`, records an
internal comment that emails no one.

---

## 7. Adding a new notification

Every notification follows the same three steps. Keep them separate, so the code
that raises an event never needs to know about email.

1. **Event.** Dispatch an event where the change happens, only when it actually
   happened (see section 3), e.g. `OrderShippedEvent::dispatch($order)` in
   `OrderManager`.
2. **Listener.** Create `app/Listeners/<Area>/Send…NotificationsListener.php`,
   type-hinting the event in `handle()`. Listeners are discovered automatically.
   A listener may run inside a transaction, so it must **only queue jobs**,
   never send mail or do heavy work.
3. **Job.** Queue one job per recipient: `SendOrderMailJob` (order mails, with
   optional extra scalar constructor arguments), `SendUserMailJob` (account mails
   with a password link), or `SendInventoryMailJob` (inventory mails, taking a
   list of variant IDs). Admin recipients come from the `ResolvesStoreAdminEmail`
   listener trait. To group several changes into one email, buffer them the
   way `InventoryService::collect_stock_alerts()` does and raise one event.

---

## 8. Where this differs from WooCommerce

The template names look familiar, but the behaviour does not match WooCommerce
one-to-one:

- **Processing is a fulfillment step, not "payment received".** WooCommerce sends
  "Processing order" when payment arrives. Here it is sent when an admin marks
  the order as processing. A payment on its own sends no email.
- **"Completed" email follows delivery.** The *Order completed* template (default
  subject "Order Delivered") is sent when the order is delivered, even if it is
  not paid yet, not when it becomes both delivered and paid.
- **Every timeline comment is emailed to the customer.** There is no separate
  "customer note" field and, for now, no private-note option in the admin
  screen. Internal comments are only possible through the API.
- **No admin password-reset or email-confirmation triggers yet.** The
  *Admin · Reset password* template has no trigger: administrators keep
  WordPress's own reset email. *Confirm email address* is still sent only when a
  customer asks to re-send verification, synchronously rather than queued.
- **No invoice or payment-link emails.** The *Send invoice* and *Send payment link*
  order actions are not implemented.
- **Silent on older WordPress.** Below WordPress 6.0 / 6.1, the Reset password /
  New account templates can be enabled but never send (section 5).
- **Payment failed, not failed order.** The template WooCommerce calls "Failed
  order" is *Payment failed* here (settings key `payment_failed`), because it is
  only ever sent for a failed payment.
- **Inventory alerts can race.** Two checkouts at the same moment can both see
  stock above the threshold, which may send a duplicate or miss a low-stock
  alert. Alerts are advisory; check the inventory list for the actual numbers.
- **A template disabled after the takeover.** If a customer's reset request was
  handed to the store and the template is turned off before the email is sent,
  that customer gets no email. Requesting the reset again brings back
  WordPress's email.
