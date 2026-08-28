This change went through two design iterations before landing on its final shape (events-based, then consolidated `log()`) — see design.md's "Decisions" for the full reasoning. This task list reflects what was actually built and verified in the final iteration; the events-based attempt's tasks aren't preserved here since none of that code shipped (all created event/listener files were deleted, `app/Events`/`app/Listeners` end this change exactly as they started it).

## 1. Activity taxonomy

- [x] 1.1 Add `REFUND_REQUESTED = 'refund-requested'` and `REFUND_DELETED = 'refund-deleted'` constants to `app/Constants/Order/OrderActivityType.php`.
- [x] 1.2 Add `OrderActivityManager::refund_requested(Order $order, Refund $refund)` — metadata: amount, currency_code, reason (from `$refund`), author resolved from `$refund->created_by`. Public, called directly (no `log()`, no event).
- [x] 1.3 Add `OrderActivityManager::refund_deleted(Order $order, array $refund_snapshot)` — takes a snapshot array (id, invoiced_amount, currency_code captured before deletion), not a `Refund` model, since the row is already gone by the time this runs.
- [x] 1.4 Add `describe_refund_requested()`/`describe_refund_deleted()` and their `case` branches in `describe()`, following `describe_refunded()`'s pattern.
- [x] 1.5 Add `PROCESSING = 'processing'` and `FULFILLMENT_RESUMED = 'fulfillment-resumed'` constants.
- [x] 1.6 Add `OrderActivityManager::processing(Order $order)` and `fulfillment_resumed(Order $order)` — no metadata, fixed-string descriptions ("Order marked as processing." / "Order fulfillment resumed.").
- [x] 1.7 Remove `STATUS_CHANGED` constant, `status_changed()`/`describe_status_changed()`, and the now-unused `OrderStatus` import from `OrderActivityManager.php` — `PROCESSING`/`FULFILLMENT_RESUMED` took over its one use case, no other caller existed. See design.md.

## 2. Consolidated `log()` entry point

- [x] 2.1 Add `OrderActivityManager::log(Order $order, string $activity_type)` — public, dispatches via `switch` to a protected per-type method; throws `\InvalidArgumentException` for an unhandled type.
- [x] 2.2 Demote `order_placed`, `payment_completed`, `payment_failed`, `processing`, `fulfillment_resumed`, `shipped`, `delivered`, `cancelled`, `tracking_added`, `archived`, `on_hold` from `public` to `protected` — reachable only via `log()`.
- [x] 2.3 Simplify method signatures to read from `$order` instead of taking now-redundant explicit params: `cancelled(Order $order)` reads `$order->cancellation_reason`; `tracking_added(Order $order)` reads `$order->shipping_carrier`/`shipping_tracking_number`/`shipping_tracking_url`; `payment_completed(Order $order)` reads `$order->payment_provider` (dropped the `?string $provider` override — always redundant with the order's own state at every real call site).
- [x] 2.4 Update `app/Facades/OrderActivity.php`'s docblock: one `@method log(...)` line replacing the 11 individual per-type lines; add missing `refund_requested`/`refund_deleted` lines (caught while auditing the docblock — these were added in 1.2/1.3 but the facade docblock was never updated for them).

## 3. Trigger-point wiring

- [x] 3.1 `CreateOrderAction::execute()`: `OrderActivity::log($order->fresh('items'), OrderActivityType::ORDER_PLACED);`.
- [x] 3.2 `OrderManager::mark_as_shipped()`: `OrderActivity::log($fresh_order, OrderActivityType::SHIPPED);` inside `if ($is_shipped)`.
- [x] 3.3 `OrderManager::mark_as_delivered()`: same pattern, `OrderActivityType::DELIVERED`.
- [x] 3.4 `OrderManager::mark_as_cancel()`: same pattern, `OrderActivityType::CANCELLED`.
- [x] 3.5 `OrderManager::add_tracking()`: same pattern (added the missing success guard first), `OrderActivityType::TRACKING_ADDED`.
- [x] 3.6 `OrderManager::mark_as_archive()`: same pattern (added the missing success guard first), `OrderActivityType::ARCHIVED`.
- [x] 3.7 `OrderManager::mark_as_on_hold()`: same pattern, `OrderActivityType::ON_HOLD`.
- [x] 3.8 `OrderManager::mark_payment_as_paid()`: same pattern, `OrderActivityType::PAYMENT_COMPLETED`.
- [x] 3.9 `OrderManager::mark_payment_as_failed()`: same pattern, `OrderActivityType::PAYMENT_FAILED`.
- [x] 3.10 `OrderManager::mark_as_processing()`: branches on the pre-existing `$is_resuming` check to call `log()` with `OrderActivityType::FULFILLMENT_RESUMED` or `::PROCESSING`.
- [x] 3.11 `CreateRefundAction::execute()`: `OrderActivity::refund_requested($order->fresh('refunds'), $refund);` before `DB::commit()`.
- [x] 3.12 `UpdateRefundAction::sync_fulfillment_status()`: `OrderActivity::refunded($order->fresh(), $refund);` inside the existing `if ($is_fully_refunded)` branch.
- [x] 3.13 `DeleteRefundAction::execute()`: snapshot the refund's fields before `$refund->delete()`, then `OrderActivity::refund_deleted($order->fresh('refunds'), $snapshot);`.

## 4. Cleanup (reverting the events-based attempt)

- [x] 4.1 Delete the 13 event classes created for the events-based attempt (`OrderPlaced`, `OrderDelivered`, `OrderCancelled`, `OrderTrackingAdded`, `OrderArchived`, `OrderPlacedOnHold`, `OrderPaymentCompleted`, `OrderPaymentFailed`, `OrderRefunded`, `OrderRefundRequested`, `OrderRefundDeleted`, `OrderMarkedAsProcessing`, `OrderFulfillmentResumed`).
- [x] 4.2 Delete the 13 corresponding listener classes.
- [x] 4.3 Restore `app/Listeners/LogOrderShippedActivity.php` back to its original name and content, `AddActivityLog.php` with the `Log::debug(...)` placeholder — this file predates the change and isn't this change's to remove or repurpose.
- [x] 4.4 Confirm `app/Events/OrderShipped.php` and `app/Listeners/SendNotificationEmail.php` were never structurally modified (only `OrderShipped` was briefly dispatched, never edited) — no action needed.

## 5. Verification

- [x] 5.1 Lint every touched file (`php -l`) — clean.
- [x] 5.2 Grep for any remaining reference to a deleted event/listener class across `app/` — none found.
- [x] 5.3 Regenerate `config/listeners.cache.php` against the dev stack and confirm it matches the exact pre-existing baseline (`OrderShipped` → `[AddActivityLog, SendNotificationEmail]`, `SettingsChanged` → `[UpdateCurrencyRates]`) — confirmed byte-for-byte match.
- [x] 5.4 Live-verify end-to-end via the established `wp eval-file` smoke-test technique (phpunit's `migrate:fresh` is still blocked by the pre-existing, out-of-scope `ReplaceCartsCustomerIdWithUserId` bug): every trigger point (order creation, all fulfillment/payment transitions, tracking, archive, refund create/complete/delete, `mark_as_on_hold`/`mark_payment_as_failed` called directly where `PerformOrderAction`'s guard blocks them — a pre-existing, unrelated guard/transition-matrix gap), plus `log()`'s `\InvalidArgumentException` on an unknown type, plus every remaining activity type's `describe()` output being non-empty. 30/30 checks passed, including confirming `payment_completed`'s description correctly includes the provider and `tracking_added`'s description correctly includes the tracking number — both now read from `$order` rather than a passed-in param.
- [x] 5.5 Clean up all smoke-test data (including one leftover order from an earlier round in this session) — dev DB back to only the four pre-existing orders.

## 6. Validation

- [x] 6.1 `openspec validate order-lifecycle-events --strict`.
