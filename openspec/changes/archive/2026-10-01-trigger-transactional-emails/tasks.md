## 1. Shared mail-job plumbing

- [x] 1.1 Extract the shared "skip if disabled / empty recipient / not a Mailer subclass; throw on `wp_mail` failure" logic from `SendOrderMailJob::handle()` into a `app/Jobs/Concerns/SendsMail.php` trait. Keep the `emails` queue, `tries = 3`, `backoff = 60`
- [x] 1.2 Add the optional `array $mailer_args = []` (scalar extra constructor args) to `SendOrderMailJob`, built as `new $mailer_class($order, ...$mailer_args)` (design D4)
- [x] 1.3 Create `SendVariantMailJob(Variant $variant, string $mailer_class, string $email)` with `delete_when_missing_models = true`
- [x] 1.4 Add `Url::get_password_reset_url(WP_User $user, string $key)` and create `SendUserMailJob(int $user_id, string $mailer_class, string $email)`. It generates the key with `get_password_reset_key()` when it runs, and skips if the user is gone or the key errors (design D4, D5)
- [x] 1.5 Extract a static `Mailer::is_enabled_key(string $option_key)` from `is_enabled()`, with no behaviour change
- [x] 1.6 Move `get_admin_email()` from `SendOrderPlacedNotificationsListener` into the `app/Listeners/Concerns/ResolvesStoreAdminEmail.php` trait and use it there
- [x] 1.7 Unit/integration tests: `SendUserMailJob` never serializes a reset key; each job skips a disabled mail and rethrows on send failure
- [x] 1.8 Verify: `composer test:docker` passes, and `npm run typecheck && npm test` passes in `resources/app/`

## 2. Order transition emails

- [x] 2.1 Create the `OrderCancelledEvent`, `OrderOnHoldEvent`, `OrderProcessingEvent`, `OrderCompletedEvent` and `OrderPaymentFailedEvent` events in `app/Events/Order/`, and type the existing `OrderShippedEvent::$order` as `Order`
- [x] 2.2 Dispatch the events from `OrderManager` with the fresh order, after each transition succeeds: cancel, on-hold, processing (skipped when `$is_resuming`), shipped, and completed (checked in both `mark_as_delivered` and `mark_payment_as_paid`) (design D2, D3)
- [x] 2.3 In `mark_payment_as_failed`, capture the prior `payment_status` and dispatch `OrderPaymentFailedEvent` only when it was not already `FAILED`
- [x] 2.4 Create the `Send…NotificationsListener` classes in `app/Listeners/Order/`, queuing one `SendOrderMailJob` per recipient per the table in design D1. The admin-facing ones use `ResolvesStoreAdminEmail`
- [x] 2.5 Implement `OrderManager::resend_order_email()` to queue `SendOrderMailJob(order, CustomerNewOrderMail)` and return `true`. Remove the `@todo`
- [x] 2.6 Regenerate `config/listeners.cache.php` (auto-discovery outside production) and commit it. *Premise corrected: the file is gitignored and rewritten on every development-mode boot, so it regenerates on its own and there is nothing to commit.*
- [x] 2.7 Integration tests in the style of `OrderPlacedEventTest`: each action queues the right mailers and recipients; resume sends no processing email; an unpaid delivery sends no completed email; a delivered order marked paid sends completed; a repeated payment failure queues nothing; a rejected transition queues nothing; resend queues only the customer confirmation
- [x] 2.8 Verify: `composer test:docker` passes, and `npm run typecheck && npm test` passes in `resources/app/`

## 3. Customer-visible order notes

- [x] 3.1 Add optional `notify_customer` (boolean, default false) to `OrderActivityCreateRequest` rules and sanitizers
- [x] 3.2 Extend `OrderActivityManager::comment()` with `bool $notify_customer = false`. Store `['notify_customer' => true]` in the metadata, and dispatch `OrderNoteAddedEvent(order, message)` when the flag is set. Pass it through from `OrderActivityController::store`
- [x] 3.3 Expose `notify_customer` in `OrderActivityResource`
- [x] 3.4 Change `CustomerOrderNoteMail` to take `(Order $order, string $note = '')` and render `$note` for `admin_order_note`. Give `EmailPreviewService` a sample note for preview/test-send. *Premise corrected: the sample order in `resources/data/sample/email/order.json` already carries an `admin_notes` text. The mail falls back to it when no note is passed, so `EmailPreviewService` needs no change.*
- [x] 3.5 Create `SendOrderNoteNotificationsListener`, which queues `SendOrderMailJob(order, CustomerOrderNoteMail, customer_email, [$note])`
- [x] 3.6 Frontend: add the "Notify customer" checkbox to the comment composer in `resources/app/features/orders/components/order-details/timeline.tsx`. Add `notify_customer` to the comment payload schema in `schemas/catalog/activity.ts` and update that schema's payload test in the same task. Show a "Customer notified" marker on notified comments *Revised after implementation: the checkbox was removed at the user's request; the composer always sends `notify_customer: true`.*
- [x] 3.7 Integration tests: a flagged comment queues the note email with the exact text; an unflagged comment queues nothing; the metadata records the flag
- [x] 3.8 Verify: `composer test:docker` passes, and `npm run typecheck && npm test` passes in `resources/app/`

## 4. Customer account emails (reset password, new account)

- [x] 4.1 Add `Utils::wp_version_at_least(string $version)`
- [x] 4.2 Create the `CustomerPasswordResetRequestedEvent(int $user_id)` and `CustomerAccountCreatedEvent(int $user_id)` events in `app/Events/User/`, and their listeners queuing `SendUserMailJob`
- [x] 4.3 Create the filter hook class `SendCustomerPasswordResetEmail` on `send_retrieve_password_email`. On WordPress ≥ 6.0, for a user without `manage_options`, while `reset_password` is enabled, it dispatches the event and returns `false`; otherwise it returns `$send`. Register it in `config/hooks.php`
- [x] 4.4 Change `CustomerNewAccountMail` to take `(User $user, string $set_password_link = '')` with a `{set_password_link}` link-button variable. Add the variable to the default copy in `resources/data/settings/email.json`, and give `EmailPreviewService` a sample link. *Premise corrected: `EmailPreviewService` is unchanged. The preview renders the button with an empty link, as the existing reset-password preview already does. The editor's shortcode list comes from the defaults, so existing sites see `{set_password_link}` there too.*
- [x] 4.5 Create the action hook `SendCustomerNewAccountEmail` on `user_register` and the filter hook `SuppressCoreNewUserEmail` on `wp_send_new_user_notification_to_user`, both gated on WordPress ≥ 6.1, a customer user, and `new_account` being enabled. Register them in `config/hooks.php`
- [x] 4.6 Integration tests: a customer reset queues the job and suppresses core; an admin reset and a disabled template leave core untouched; checkout account creation queues new-account; an admin user queues nothing; the suppress filter returns false only under the gate; a mocked older WordPress version leaves core behaviour unchanged
- [x] 4.7 Verify: `composer test:docker` passes, and `npm run typecheck && npm test` passes in `resources/app/`

## 5. Inventory alerts

- [x] 5.1 Extract `AvailabilityService::resolve_low_stock_threshold(Variant, int $store_default)` and use it inside `resolve_variant_status()`, with no behaviour change
- [x] 5.2 Create the `VariantLowStockEvent(Variant)` and `VariantOutOfStockEvent(Variant)` events in `app/Events/Inventory/`, and their listeners queuing `SendVariantMailJob` to the store admin
- [x] 5.3 Inject `AvailabilityService` into `InventoryService`. After a successful `reserve_stock`/`decrement_stock` on a tracked variant, apply the crossing rule from design D8 (out-of-stock takes precedence)
- [x] 5.4 Integration tests for the spec scenarios: 6→5 with threshold 5 alerts low; 5→3 does not alert; 2→0 alerts out of stock; 10→0 sends only out of stock; an untracked variant does not alert; no threshold means no low alert
- [x] 5.5 Verify: `composer test:docker` passes, and `npm run typecheck && npm test` passes in `resources/app/`

## 6. Documentation

- [x] 6.1 Write `docs/emails.md` in the structure from CLAUDE.md §6 (`docs/cache.md` is not in this repo; follow the §6 outline, using `docs/legal-consents.md` as the nearest example): TOC; quick start; a trigger→template→recipient table; the queue and retry behaviour; WordPress core takeover and version gates; the `{set_password_link}` note for existing sites; adding a new notification (event → listener → job); and a "Where this differs" section (WordPress < 6.0/6.1 degrade, admin reset password and confirm-email out of scope, inventory race)
- [x] 6.2 Run `openspec validate trigger-transactional-emails --strict` and fix any findings
- [x] 6.3 Verify: `composer test:docker` passes, and `npm run typecheck && npm test` passes in `resources/app/`

## 7. Revisions after review (design R1–R4)

- [x] 7.1 R1: Rename `OrderCompletedEvent` → `OrderDeliveredEvent` and `SendOrderCompletedNotificationsListener` → `SendOrderDeliveredNotificationsListener`. In `OrderManager`, raise it from `mark_as_delivered` when `order_status` changed, drop it from `mark_payment_as_paid`, and remove `dispatch_completed_event()`
- [x] 7.2 R1 tests in `OrderTransitionEmailsTest`: paid order delivered, unpaid order delivered, and failed-payment order delivered each queue `CustomerOrderCompletedMail` once; a delivered-unpaid order marked paid queues nothing; a gateway repeating "paid" queues nothing
- [x] 7.3 R2: Rename the settings key `failed_order` → `payment_failed`: the constants (`PAYMENT_FAILED`) and `email.json` keys (customer + admin), plus the new default subject and heading. Rename the mailers to `CustomerPaymentFailedMail`/`AdminPaymentFailedMail` (`option_key`, docblocks), and update `SendOrderPaymentFailedNotificationsListener`, the `EmailPreviewService` map, and the labels in `resources/app/features/settings/email/lib/utils.ts`. Grep for leftover `failed_order`/`FAILED_ORDER`/`OrderFailedMail`, apart from the unrelated checkout "order failed" page and `docs/ecommerce/settings/email.yml`
- [x] 7.4 R2: Add the `RenameFailedOrderEmailSettingsToPaymentFailed` data migration (`up`/`down` as in design R2) and register it last in `config/migrations.php`. Integration test: saved untouched defaults get the new subject/heading; a disabled or edited entry keeps its state and copy; no saved option means no-op; `down()` restores `failed_order`
- [x] 7.5 R2: Update `OrderTransitionEmailsTest`, `MailJobsTest` and any frontend test for the new names; run the migration on the dev DB (`docker compose --profile tools run --rm wpcli kirki migrate`) and confirm Settings → Email shows "Payment Failed"
- [x] 7.6 R3: `docs/emails.md` — explain that Customers → Add links an existing WordPress user by email and then sends no new-account email; add an integration test for that path (existing user email + `create_wordpress_user` → nothing queued)
- [x] 7.7 R4: Add `InventoryService::collect_stock_alerts(callable)` with buffered crossings and immediate one-element dispatch outside a scope. Replace `VariantLowStockEvent`/`VariantOutOfStockEvent` with `VariantsLowStockEvent`/`VariantsOutOfStockEvent(int[] $variant_ids)`, and `SendVariantMailJob` with `SendInventoryMailJob(int[] $variant_ids, …)`; update both listeners
- [x] 7.8 R4: Wrap the item loops of `CreateOrderAction` and `UpdateOrderAction` in `collect_stock_alerts`
- [x] 7.9 R4: Make `AdminLowStockMail`/`AdminOutOfStockMail` take `Variant ...$variants`. Loop the rows in `emails/parts/product/stock-info.php`, join `{product_name}`/`{sku}`, and pick the restock link (single product edit page, or the new `Url::get_products_admin_url()`)
- [x] 7.10 R4 tests in `InventoryAlertEmailsTest`: the spec's "one order crosses several variants" scenario queues exactly one low-stock job with A and B and one out-of-stock job with C; the rendered email lists every variant after a serialize round trip; an order that fails mid-loop queues nothing; a direct `decrement_stock` outside a scope still alerts
- [x] 7.11 Update `docs/emails.md` (trigger table: delivered and payment-failed rows, grouped stock alerts, renamed classes) and the manual QA steps; run `openspec validate trigger-transactional-emails --strict` *The manual QA steps only ever existed in the chat, not in a file, so their updates are given in the apply summary rather than in the repo.*
- [x] 7.12 Verify: `bash kirki-test all` passes, phpcs (wporg + docblock) is clean, and `npm run typecheck && npm test` passes in `resources/app/` *PHP 345 unit + 595 integration, phpcs clean, vitest 1339. typecheck reports one error, TS6133 `userEmails` unused in `features/settings/email/components/admin-email.tsx`. That comes from an unrelated uncommitted edit to that file, which this change does not touch.*
