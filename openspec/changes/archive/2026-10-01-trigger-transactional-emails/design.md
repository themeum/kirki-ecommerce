## Context

See proposal.md (Why) for motivation and `specs/transactional-email-triggers/spec.md` for the behaviour contract. The current code that constrains the approach:

- **Existing pipeline.** `CreateOrderAction` dispatches `OrderPlacedEvent` after commit. `SendOrderPlacedNotificationsListener` then queues one `SendOrderMailJob(Order, mailer_class, email)` per recipient on the `emails` queue, with 3 tries and 60s backoff. When the job runs, it skips a mail whose `is_enabled()` is false. Listeners are discovered by the type-hint on `handle()` and cached in `config/listeners.cache.php`. That cache is regenerated automatically outside production.
- **Queue.** The queue is database-backed (`DatabaseQueue`). A push inside a transaction is rolled back with it. The worker is spawned from a shutdown callback by a loopback request, so it never runs before the request's transaction commits. `SerializesModels` turns only **top-level** `Model` properties into identifiers. Arrays of models, and non-model objects such as `Wordpress\User`, are serialized in full.
- **Order transitions.** These live in `OrderManager`: `mark_as_cancel`, `mark_as_on_hold`, `mark_as_processing` (also handles resume), `mark_as_shipped`, `mark_as_delivered`, `mark_payment_as_paid`, and `mark_payment_as_failed`. Each returns whether the transition was applied. Admin actions reach them through `PerformOrderAction`, inside a transaction. The 13 payment gateways call `mark_payment_as_paid`/`_failed` directly, with no transaction. `mark_payment_as_failed` has no state guard.
- **Stock.** Stock falls in `InventoryService::reserve_stock` (order create/update) and `decrement_stock`. Both already load the variant to check stock.
- **Mailers.** The order mailers take `(Order)`. `CustomerResetPasswordMail` takes `(User, string $reset_link)`, `CustomerNewAccountMail` takes `(User)`, and the inventory mailers take `(Variant)`. `CustomerOrderNoteMail` renders `order.admin_notes`, which the admin UI never writes.
- **WordPress.** The plugin supports WordPress ≥ 5.9. `send_retrieve_password_email` exists from 6.0 and `wp_send_new_user_notification_to_user` from 6.1.

## Goals / Non-Goals

**Goals:**
- A single place in code that raises each notification, so admin actions, gateway webhooks, and storefront flows all trigger the same emails.
- No secrets (password-reset keys) and no model snapshots stored in the jobs table.
- Every new email is testable with `Queue::fake()`, without sending mail.

**Non-Goals:**
- Changing email templates or layout, or the settings UI, except for the preview sample data needed for the new variables.
- Admin reset password, confirm-email-address, invoice and payment-link emails.
- Guaranteeing exactly-once inventory alerts under concurrent checkouts (see Risks).
- Developer `do_action` hooks for the new events. They could be added later with a broadcast listener, following `BroadcastOrderPlacedListener`.

## Decisions

### D1. Domain events + one listener per event, queuing one job per recipient
Each trigger raises an event. A `Send…NotificationsListener` for that event queues the jobs. This mirrors the `OrderPlacedEvent` pipeline, keeps `OrderManager`/`InventoryService` unaware of mail, and gives each event somewhere to attach future side effects.

| Event (new unless noted) | Raised in | Listener queues |
|---|---|---|
| `Order\OrderCancelledEvent(Order)` | `OrderManager::mark_as_cancel` | customer + admin `cancelled_order` |
| `Order\OrderOnHoldEvent(Order)` | `OrderManager::mark_as_on_hold` | customer `order_on_hold` |
| `Order\OrderProcessingEvent(Order)` | `OrderManager::mark_as_processing`, **not** on resume | customer `order_processing` |
| `Order\OrderShippedEvent(Order)` *(existing, typed to `Order`)* | `OrderManager::mark_as_shipped` | customer `order_shipped` |
| `Order\OrderDeliveredEvent(Order)` *(was `OrderCompletedEvent`, see R1)* | `OrderManager::mark_as_delivered`, when the status changed | customer `order_completed` |
| `Order\OrderPaymentFailedEvent(Order)` | `OrderManager::mark_payment_as_failed`, on a real transition only | customer + admin `payment_failed` (was `failed_order`, see R2) |
| `Order\OrderNoteAddedEvent(Order, string $note)` | `OrderActivityManager::comment` when `notify_customer` | customer `order_note` |
| `User\CustomerAccountCreatedEvent(int $user_id)` | new `user_register` hook | customer `new_account` |
| `User\CustomerPasswordResetRequestedEvent(int $user_id)` | new `send_retrieve_password_email` filter | customer `reset_password` |
| `Inventory\VariantsLowStockEvent(int[] $variant_ids)` *(see R4)* | `InventoryService`, once per grouped stock operation | admin `low_stock` |
| `Inventory\VariantsOutOfStockEvent(int[] $variant_ids)` *(see R4)* | `InventoryService`, once per grouped stock operation | admin `out_of_stock` |

Names follow the convention from commit `be020ded` (`…Event`, `Send…NotificationsListener`, `…Job`).

*Alternatives considered:* dispatching jobs straight from `OrderManager` (mixes mail concerns into the domain layer), and one generic `OrderStatusChangedEvent` with a transition→mailer map (turns the map into a logic hotspot). Both were rejected during grilling.

**Exception: `resend_order_email`.** It dispatches `SendOrderMailJob(order, CustomerNewOrderMail)` directly and returns `true`. It is an explicit admin command, not a domain state change, so an event would only add indirection.

### D2. Order events are raised inside `OrderManager`, not after commit in callers
The event is raised right after `apply_order_action`/`partial_update_order` reports success, using the freshly re-fetched order the method already loads for `OrderActivity::log`. This covers `PerformOrderAction` and all 13 gateways from one place. It is safe inside `PerformOrderAction`'s transaction because the listener only inserts job rows (rolled back with the transaction), and the worker only starts at shutdown.

*Alternative:* raising the event after `DB::commit()` in every caller (strict after-commit, like `OrderPlacedEvent`) means 13+ call sites, and new gateways would silently miss it. A deferred-until-commit buffer would be new framework-level infrastructure. Both rejected.

*Consequence:* these listeners must stay cheap and must not throw. They only queue jobs. Anything heavier belongs in the job.

### D3. Transition-detection rules
- **Delivered** *(revised, R1)*. In `mark_as_delivered` only, after success, when the order status changed: `OrderDeliveredEvent::dispatch($fresh)`. `mark_payment_as_paid` raises nothing. An order is delivered at most once, so the email is sent once.
- **Processing vs resume.** `mark_as_processing` already computes `$is_resuming` and raises the event only when `!$is_resuming`.
- **Payment failed.** Capture `$order->payment_status` before the update, and raise the event only when it was not already `PaymentStatus::FAILED` (drops duplicate webhooks). No new column.

### D4. Jobs: one per subject, extra mailer args as scalars
- **`SendOrderMailJob(Order $order, string $mailer_class, string $email, array $mailer_args = [])`.** `$mailer_args` is a list of **scalar** extra constructor arguments, spread after the order: `new $mailer_class($order, ...$mailer_args)`. The order note text travels this way. The name `mailer_args` replaces the "context" wording used in grilling, because it is literally the constructor tail.
- **`SendUserMailJob(int $user_id, string $mailer_class, string $email)`.** It rebuilds `new User($user_id)` when it runs, and **generates the password link at run time** with `get_password_reset_key()`, passing it as the mailer's second constructor argument. So the reset or set-password key is never stored in plain text in the jobs table. The job skips (does not fail) if the user no longer exists or the key cannot be generated. *Deviation from grilling:* the job does not take a `$link` parameter, for the security reason above.
- **`SendInventoryMailJob(array $variant_ids, string $mailer_class, string $email)`** *(replaces `SendVariantMailJob(Variant …)`, R4)*. It re-fetches the variants that still exist when it runs, skips when none do, and builds `new $mailer_class(...$variants)`.
- All three share the queue name (`emails`), `tries = 3`, `backoff = 60`, and the "skip if disabled / empty recipient / not a Mailer subclass; throw on `wp_mail` failure to retry" behaviour. The shared `handle` tail goes into a small trait (`Jobs\Concerns\SendsMail`) rather than being copied three times.

*Alternatives:* one generic job holding an args array serializes full models, because `SerializesModels` only handles top-level properties. Queued mailables would mean refactoring the `Mailer` base and the preview/test-send paths. Both rejected.

### D5. Mailer changes
- `CustomerOrderNoteMail::__construct(Order $order, string $note = '')`. The `admin_order_note` variable renders `$note`. When `$note` is empty (preview/test-send), it falls back to the sample note from `EmailPreviewService`.
- `CustomerNewAccountMail::__construct(User $user, string $set_password_link = '')`. It adds a `{set_password_link}` variable, rendered as a `link-button` part like `reset_link_button`. The default template copy in `resources/data/settings/email.json` gains `{set_password_link}`. Existing sites keep their saved copy, so the variable is available but not inserted for them. This is noted in docs.
- The password link is built in one place, `Url::get_password_reset_url(WP_User $user, string $key)`, which wraps `network_site_url("wp-login.php?action=rp&key=…&login=…")`. Both user mailers get their link from it.

### D6. Store-admin recipient
`SendOrderPlacedNotificationsListener::get_admin_email()` moves into a trait, `Listeners\Concerns\ResolvesStoreAdminEmail`, used by every listener that notifies the admin. Behaviour is unchanged: `general.store_email`, falling back to `admin_email`.

### D7. WordPress core takeover (user emails)
"Customer" means a user **without** the `manage_options` capability. That covers `subscriber` (checkout-created) and `kirki_customer`.

- **Reset password.** A new filter hook class, `Wordpress\Hooks\Filters\SendCustomerPasswordResetEmail`, on `send_retrieve_password_email` (3 args), is registered only on WordPress ≥ 6.0. If the user is a customer and the `customer_emails.user_notifications.reset_password` template is enabled, it dispatches `CustomerPasswordResetRequestedEvent` and returns `false`. Otherwise it returns `$send` unchanged. Core has already generated a key by this point. The job's fresh key replaces it, and that is harmless because core's key is never delivered.
- **New account.** A new action hook class, `Wordpress\Hooks\Actions\SendCustomerNewAccountEmail`, on `user_register`, plus a filter hook class, `Wordpress\Hooks\Filters\SuppressCoreNewUserEmail`, on `wp_send_new_user_notification_to_user`. Both apply only on WordPress ≥ 6.1, for a customer, while `new_account` is enabled. Core's `wp_new_user_notification()` checks that filter *before* it calls `get_password_reset_key()`, so suppressing it also stops core from issuing a competing key. `user_register` fires after the role is set, so the capability check is reliable.
- **Version gate.** One helper, `Utils::wp_version_at_least(string $version)`, which compares `get_bloginfo('version')`. On an older version the hook does nothing, so core's email is sent and ours is not, as the spec requires.
- The "enabled" check reads `Settings::get('email')` directly. The mailer's `is_enabled()` needs a constructed mailer, so for these hooks the check goes through a static `Mailer::is_enabled_key(string $option_key)` extracted from `is_enabled()`.

### D8. Inventory crossing
In `reserve_stock` and `decrement_stock`, once the quantity update succeeds and only when `track_inventory` is set:
```
before    = variant.available_quantity (already loaded for the guard)
after     = before - quantity
threshold = AvailabilityService::resolve_low_stock_threshold(variant, (int) Settings::get('product.low_stock_threshold', 0))
if before > 0 && after <= 0                                 → VariantOutOfStockEvent
elseif threshold > 0 && before > threshold && after <= threshold → VariantLowStockEvent
```
Out-of-stock takes precedence, so one reduction never sends both emails. *(Revised in R4: crossings are grouped per order operation into list events.)* The threshold fallback (`is_null($variant->low_stock_threshold) ? store default : variant's`) is the same one `AvailabilityService::resolve_variant_status()` uses for display. It is extracted into a public `AvailabilityService::resolve_low_stock_threshold(Variant, int $store_default)` and reused, so display and alerts can't drift. `InventoryService` does not currently inject `AvailabilityService`, so it is added to its constructor.

### D9. Order note flag
`OrderActivityCreateRequest` accepts `notify_customer` (`boolean`, optional, default false). `OrderActivityManager::comment(int $order_id, string $message, ?int $created_by = null, bool $notify_customer = false)` stores `metadata = ['notify_customer' => true]` when set (null otherwise, as today). After creating the activity, it raises `OrderNoteAddedEvent(order, message)`. `OrderActivityResource` exposes `notify_customer` so the timeline can show a "Customer notified" marker. The frontend gets a checkbox in the composer in `timeline.tsx`, and `notify_customer` is added to the comment payload schema and its schema test.

## Risks / Trade-offs

- **Concurrent checkouts race the crossing check** (both read `before = 6`) → a duplicate or missed low-stock alert is possible. It's accepted as admin-facing and rare. It could be mitigated later by re-reading the quantity after the atomic decrement.
- **Listeners run inside the admin action's transaction** → a listener that throws rolls back the order transition. *Mitigation:* listeners only call `::dispatch()`. This is documented in the listener docblocks and in `docs/emails.md`.
- **Template disabled between the trigger and job run for user mails.** Core's email was already suppressed, so the customer gets nothing. *Mitigation:* rare. The customer can request again and gets core's email. This is documented.
- **The reset request is now asynchronous.** The loopback worker usually runs within seconds, and on hosts that block loopbacks it waits for WP-Cron. *Mitigation:* `docs/emails.md` states the queue requirements. Core's reset UX ("check your email") is unchanged.
- **Existing sites' saved `new_account` copy lacks `{set_password_link}`.** Checkout-created customers on those sites still can't set a password from the email. *Mitigation:* documented, and merchants can add the variable in the editor. A settings migration is out of scope.
- **Silent degrade on WordPress < 6.0 / < 6.1** means the store's reset and new-account templates appear enabled but never send. *Mitigation:* documented in `docs/emails.md`, under "Where this differs".

## Migration Plan

No schema migration. One settings-data migration renames the `failed_order` email settings to `payment_failed` (R2). Deploying turns on the new emails immediately for every template that is already enabled. Every seeded template is enabled by default, which is the intended outcome. To roll back, revert. Jobs already queued for removed job classes fail to unserialize and are dropped after their tries.

## Corrections during implementation

- **"Transition applied" is not the same as "method returned true" (D2/D3).** `OrderService::apply_order_action()` returns `true` when the action has *no* transition from the current status. So a gateway repeating "paid" on a completed order, for example, re-runs the success branch. Every order event is therefore dispatched only when `order_status` actually changed: before ≠ after for cancel, on-hold, processing and shipped, and before ≠ COMPLETED = after for completed. The payment-failed event keeps its own "was not already FAILED" check.
- **Admins can put an order on hold only from `failed_processing`** in `order-state-matrix.json`. The on-hold email follows whatever the matrix allows, and the tests reach on-hold through that status.
- **`config/listeners.cache.php` is gitignored** and rewritten on every boot while `KIRKI_ECOMMERCE_MODE` is `development`, so there is nothing to commit (task 2.6).
- **Order-note preview (D5).** `EmailPreviewService` is unchanged. `CustomerOrderNoteMail` falls back to the order's `admin_notes` when no note is passed, and the preview's sample order already has one.
- **Queued order mails need a fully loaded order.** A note-event order loaded with a bare `Order::find()` failed to render once the job ran (`OrderResource` got a null `items`). Loading it with `OrderService::find_order()`, eager-loaded like every `OrderManager` path, fixes it. The order, note and inventory tests render a queued job after a serialize round trip to guard this.
- **"Notify customer" checkbox removed (user decision, after implementation).** The timeline composer no longer shows the checkbox and always sends `notify_customer: true`, so every admin comment emails the customer for now. The API flag, activity metadata and "Customer notified" marker are unchanged, so a checkbox or private-note option can come back without backend changes.
- **Checkout does not create WordPress accounts.** Checkout only provisions a `Customer` for an already logged-in user, and guests get none (`checkout-customer-provisioning`). So the new-account paths are self-registration and admin-created customers with **Create WordPress user**. The spec scenario and docs were corrected. The `user_register` hook would still cover a checkout account-creation path if one were added later.

## Revisions after review (2026-09-30)

Decided by the user after manual QA of the first implementation.

### R1. The delivered email follows delivery, not completion
The `order_completed` template's default subject is already "Order Delivered", and merchants expect it when they mark an order delivered. So the customer email is raised from `mark_as_delivered` alone, whenever the order status actually changed: `paid_shipped → completed`, `shipped_unpaid → delivered_unpaid` and `failed_shipped → failed_delivered` all send it. `mark_payment_as_paid` no longer raises anything, so a delivered-unpaid order that is later paid sends no second email. `OrderCompletedEvent` and its listener are renamed `OrderDeliveredEvent` and `SendOrderDeliveredNotificationsListener`, because "completed" (delivered **and** paid) no longer describes the trigger, and `dispatch_completed_event()` is removed. The template key `order_completed`, the `CustomerOrderCompletedMail` class and the settings label are unchanged. They were not part of the request, and renaming the key would need another settings migration.

### R2. "Failed order" becomes "Payment failed", key included
The email only ever fires on a payment failure, so the name now says so, all the way down:
- Settings key `failed_order` → `payment_failed` (customer and admin), with constants `CustomerOrderNotification::PAYMENT_FAILED` and `AdminOrderNotification::PAYMENT_FAILED` replacing `FAILED_ORDER`.
- `CustomerOrderFailedMail` / `AdminOrderFailedMail` → `CustomerPaymentFailedMail` / `AdminPaymentFailedMail`, with the preview map in `EmailPreviewService` and the listener updated.
- Default copy in `email.json`: customer subject "Payment Failed", heading "Sorry, your payment was unsuccessful"; admin subject and heading "Payment failed". The message bodies already talk about the payment and stay.
- Settings labels in `resources/app/features/settings/email/lib/utils.ts`: "Payment Failed".

`AppSettings::refresh()` merges saved settings over the defaults **shallowly**, so a store that has saved its email settings keeps the whole `customer_emails`/`admin_emails` subtree it saved. Without a migration, those stores would have no `payment_failed` entry, so the email would read as disabled and never send. A data migration, `RenameFailedOrderEmailSettingsToPaymentFailed`, registered last in `config/migrations.php`, does this for each of `customer_emails` and `admin_emails`:
- `up()`: when `order_notifications.failed_order` exists and `payment_failed` does not, move it to `payment_failed`. Replace `subject`/`heading` with the new defaults only where they equal the old default strings, then remove `failed_order`. With no saved option, it does nothing, so defaults apply.
- `down()`: the reverse move, restoring the old default strings where the new defaults are untouched.

It writes the option directly (`Option::set`), not through `AppSettings::set`, so `SettingsChangedEvent` does not fire during migration. `docs/ecommerce/settings/email.yml` uses a different, older key scheme (`failed_order_email`), is not read by code, and is left alone.

### R3. New-account email on admin-created customers: no change
Reported as "created a new customer, no email". Investigation found customer #12 was linked to WordPress user #4, which already existed with that email. `CreateCustomerAction::create_user()` links an existing user by email before it considers **Create WordPress user**, so no account was created and `user_register` never fired. A live `wp_insert_user` probe queued `CustomerNewAccountMail` as designed. The user chose to keep the rule (the email goes only with a brand-new WordPress account, because it carries a set-password link). The spec gains a "linked to an existing account" scenario, and `docs/emails.md` explains the linking case.

### R4. Stock alerts grouped per order operation
One order that reduces several variants used to queue one email per variant. Now:
- `InventoryService::collect_stock_alerts(callable $callback)` runs `$callback` with crossings buffered by variant ID (`low` and `out` lists; out-of-stock still takes precedence per variant). After the callback returns, it raises at most one `VariantsLowStockEvent(int[])` and one `VariantsOutOfStockEvent(int[])`. If the callback throws, the buffer is discarded and the exception rethrown. The order's transaction rolls back anyway.
- Outside a collect scope, `reserve_stock`/`decrement_stock` raise the event straight away with a one-element list. That way, any other caller keeps alerting without having to know about batching.
- `CreateOrderAction` and `UpdateOrderAction` wrap their item loops in `collect_stock_alerts`. This is still inside the transaction, so a rolled-back order queues nothing (D2).
- The listeners queue one `SendInventoryMailJob(variant_ids, mailer, admin email)`. The job stores IDs only (`SerializesModels` handles top-level models only; see Context) and re-fetches the variants with their product when it runs.
- `AdminLowStockMail` / `AdminOutOfStockMail` take `Variant ...$variants`, so the one-variant preview and test-send paths keep working. `{product_stock_info}` renders one row per variant, since `emails/parts/product/stock-info.php` already has the "Products affected" heading and now loops. `{product_name}` and `{sku}` become comma-separated lists of distinct values, and `{available_quantity}` is kept for the single-variant case. The restock link points to the product's edit page when every variant belongs to one product, otherwise to the admin products list (new `Url::get_products_admin_url()`).
- Grouping is per operation, not a time-window digest. Two separate orders still produce separate emails.
