## Why

The Email settings page lets merchants enable and edit 17 notification templates, and each one has a Mailer class. Only the two "new order" emails actually go out, through `OrderPlacedEvent → SendOrderMailJob`. Every other enabled template does nothing: the status-change emails, the order note, the customer password-reset and new-account emails, and the low-stock and out-of-stock alerts. The queue from the scheduler integration now works, so each of these can be wired to its real trigger point and sent in the background, without slowing admin actions, checkout, or gateway webhooks.

## What Changes

- **Order status emails.** `OrderManager` raises a domain event after each successful transition. A listener per event queues one `SendOrderMailJob` per recipient:
  - cancelled → customer and admin `cancelled_order`
  - on hold → customer `order_on_hold`
  - mark as processing (not resuming from on hold) → customer `order_processing`
  - shipped → customer `order_shipped`. The existing unused `OrderShippedEvent` is reused.
  - order reaches `COMPLETED` (delivered and paid, by either path) → customer `order_completed`
  - payment changes to FAILED (not when it is already failed) → customer and admin `failed_order`
- **Order note email.** The admin order-comment API accepts an opt-in `notify_customer` flag. When it is set, the customer gets the `order_note` email with that comment's text. Comments without the flag stay internal. The order timeline composer gets a "Notify customer" checkbox.
- **Resend order email.** The `RESEND_ORDER_EMAIL` order action (currently a stub) re-queues the customer order-confirmation email.
- **Customer password reset.** For users who are not store admins, the plugin replaces the WordPress core reset email with its queued `reset_password` template, but only while that template is enabled. Admin users keep the WordPress core email.
- **Customer new account.** Every new non-admin WordPress user gets the queued `new_account` email: self-registration, checkout, and admin-created customers alike. It includes a new `{set_password_link}`. While the template is enabled, WordPress core's own new-user email to the user is suppressed.
- **Inventory alerts.** When a tracked variant's available quantity drops across its low-stock threshold or reaches zero, the admin gets one queued `low_stock` or `out_of_stock` alert.
- **Jobs.** `SendOrderMailJob` gains an optional context payload, and two jobs are added: `SendUserMailJob` and `SendVariantMailJob`. All run on the `emails` queue with retries, and skip a template that is disabled when the job runs.
- Out of scope, unchanged: `admin_emails.user_notifications.reset_password`, `customer_emails.user_notifications.confirm_email_address` (stays synchronous), and the invoice and payment-link stubs.

## Capabilities

### New Capabilities
- `transactional-email-triggers`: which store event sends which notification, to whom, and under what de-duplication rules. Covers background delivery, and how WordPress core's own emails give way to the plugin's templates.

### Modified Capabilities
- `order-activity-log`: adding an admin comment can optionally notify the customer by email.

## Impact

- **Backend:** `app/Managers/OrderManager.php`, `app/Services/InventoryService.php`, new events in `app/Events/{Order,User,Inventory}/`, new listeners in `app/Listeners/`, new jobs in `app/Jobs/`, `app/Mails/Customers/{CustomerOrderNoteMail,CustomerNewAccountMail}.php`, new WordPress hook classes (registered in `config/hooks.php`), `OrderActivityController`/`OrderActivityCreateRequest`, regenerated `config/listeners.cache.php`. `EmailPreviewService` sample data covers the new note and set-password variables.
- **Frontend:** the order timeline comment composer (`resources/app/features/orders/components/order-details/timeline.tsx`) and its schema/service payload.
- **WordPress core behaviour:** the core reset-password and new-user emails are suppressed for non-admin users while the matching template is enabled. The suppression filters need WordPress 6.0 (reset) and 6.1 (new user). The plugin still supports 5.9, so on older versions it does not take over: core's email is sent and the store's is not.
- **Gateways:** no code change. All 13 gateway webhooks already go through `OrderManager`, so they get the emails automatically.
- **Docs and tests:** new `docs/emails.md`; integration tests using `Queue::fake()`, following `tests/Integration/OrderPlacedEventTest.php`.
