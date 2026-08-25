## 1. Activity taxonomy

- [x] 1.1 Add `REFUND_REQUESTED = 'refund-requested'` and `REFUND_DELETED = 'refund-deleted'` constants to `app/Constants/Order/OrderActivityType.php`.
- [x] 1.2 Add `OrderActivityManager::refund_requested(Order $order, Refund $refund)` — metadata: amount (`$refund->invoiced_amount`), currency_code, reason (`$refund->reason`) — mirroring `refunded()`'s shape, author resolved from `$refund->created_by`.
- [x] 1.3 Add `OrderActivityManager::refund_deleted(Order $order, array $refund_snapshot)` — takes a plain snapshot array (id, invoiced_amount, currency_code captured before deletion), not a `Refund` model.
- [x] 1.4 Add `describe_refund_requested()`/`describe_refund_deleted()` methods and their `case` branches in `OrderActivityManager::describe()`, following the existing `describe_refunded()`/`describe_partially_refunded()` pattern (amount via `format_amount()`, fallback string when amount is missing).
- [x] 1.5 **Added post-implementation (consistency correction, see task 4.9 and design.md)**: add `PROCESSING = 'processing'` and `FULFILLMENT_RESUMED = 'fulfillment-resumed'` constants to `OrderActivityType`.
- [x] 1.6 Add `OrderActivityManager::processing(Order $order)` and `fulfillment_resumed(Order $order)` writer methods (no extra metadata) plus fixed-string `case` branches in `describe()` ("Order marked as processing." / "Order fulfillment resumed."), mirroring `shipped()`/`archived()`'s no-metadata shape.
- [x] 1.7 **Added post-implementation (per user request, see design.md "`status_changed()`/`STATUS_CHANGED` removed entirely, not left dormant")**: remove the `STATUS_CHANGED` constant from `OrderActivityType`, remove `OrderActivityManager::status_changed()`/`describe_status_changed()` and their `switch` case, remove the now-unused `OrderStatus` import from `OrderActivityManager.php`, remove the `@method status_changed(...)` line from `app/Facades/OrderActivity.php`'s docblock, and add `processing`/`fulfillment_resumed` `@method` lines (missed when they were first added in 1.6). Drop `status-changed` from the spec delta's enumerated type list. Verified: `grep` for `STATUS_CHANGED`/`status_changed` across `app/` returns nothing; live re-check confirms `mark_as_processing()`/`mark_as_on_hold()` still work, `status-changed` never appears on a timeline, and every remaining activity type's `describe()` output is non-empty (8/8 checks passed).

## 2. Event classes

- [x] 2.1 Confirm `app/Events/OrderShipped.php` needs no structural change (already has `Dispatchable` + `public $order` constructor) — leave as-is.
- [x] 2.2 Create `app/Events/OrderPlaced.php` (constructor: `Order $order`).
- [x] 2.3 Create `app/Events/OrderDelivered.php` (constructor: `Order $order`).
- [x] 2.4 Create `app/Events/OrderCancelled.php` (constructor: `Order $order`, `?string $reason`).
- [x] 2.5 Create `app/Events/OrderTrackingAdded.php` (constructor: `Order $order`, `array $tracking`).
- [x] 2.6 Create `app/Events/OrderArchived.php` (constructor: `Order $order`).
- [x] 2.7 Create `app/Events/OrderPlacedOnHold.php` (constructor: `Order $order`).
- [x] 2.8 Create `app/Events/OrderPaymentCompleted.php` (constructor: `Order $order`, `?string $provider`).
- [x] 2.9 Create `app/Events/OrderPaymentFailed.php` (constructor: `Order $order`).
- [x] ~~2.10 Create `app/Events/OrderStatusChanged.php` (constructor: `Order $order`, `string $from`, `string $to`).~~ **Superseded**: replaced by 2.14/2.15 below — see design.md "`mark-as-processing` and `resume-fulfillment` get their own dedicated events/types". File deleted.
- [x] 2.11 Create `app/Events/OrderRefunded.php` (constructor: `Order $order`, `Refund $refund`).
- [x] 2.12 Create `app/Events/OrderRefundRequested.php` (constructor: `Order $order`, `Refund $refund`).
- [x] 2.13 Create `app/Events/OrderRefundDeleted.php` (constructor: `Order $order`, `array $refund_snapshot`).
- [x] 2.14 Create `app/Events/OrderMarkedAsProcessing.php` (constructor: `Order $order`).
- [x] 2.15 Create `app/Events/OrderFulfillmentResumed.php` (constructor: `Order $order`).

## 3. Listener classes

- [x] 3.1 Rename `app/Listeners/AddActivityLog.php` → `app/Listeners/LogOrderShippedActivity.php`; replace the `Log::debug(...)` body with `OrderActivity::shipped($event->order);`.
- [x] 3.2 Leave `app/Listeners/SendNotificationEmail.php` untouched.
- [x] 3.3 Create `app/Listeners/LogOrderPlacedActivity.php` → `OrderActivity::order_placed($event->order);`.
- [x] 3.4 Create `app/Listeners/LogOrderDeliveredActivity.php` → `OrderActivity::delivered($event->order);`.
- [x] 3.5 Create `app/Listeners/LogOrderCancelledActivity.php` → `OrderActivity::cancelled($event->order, $event->reason);`.
- [x] 3.6 Create `app/Listeners/LogOrderTrackingAddedActivity.php` → `OrderActivity::tracking_added($event->order, $event->tracking);`.
- [x] 3.7 Create `app/Listeners/LogOrderArchivedActivity.php` → `OrderActivity::archived($event->order);`.
- [x] 3.8 Create `app/Listeners/LogOrderPlacedOnHoldActivity.php` → `OrderActivity::on_hold($event->order);`.
- [x] 3.9 Create `app/Listeners/LogOrderPaymentCompletedActivity.php` → `OrderActivity::payment_completed($event->order, $event->provider);`.
- [x] 3.10 Create `app/Listeners/LogOrderPaymentFailedActivity.php` → `OrderActivity::payment_failed($event->order);`.
- [x] ~~3.11 Create `app/Listeners/LogOrderStatusChangedActivity.php` → `OrderActivity::status_changed($event->order, $event->from, $event->to);`.~~ **Superseded**: replaced by 3.15/3.16 below. File deleted.
- [x] 3.12 Create `app/Listeners/LogOrderRefundedActivity.php` → `OrderActivity::refunded($event->order, $event->refund);`.
- [x] 3.13 Create `app/Listeners/LogOrderRefundRequestedActivity.php` → `OrderActivity::refund_requested($event->order, $event->refund);`.
- [x] 3.14 Create `app/Listeners/LogOrderRefundDeletedActivity.php` → `OrderActivity::refund_deleted($event->order, $event->refund_snapshot);`.
- [x] 3.15 Create `app/Listeners/LogOrderMarkedAsProcessingActivity.php` → `OrderActivity::processing($event->order);`.
- [x] 3.16 Create `app/Listeners/LogOrderFulfillmentResumedActivity.php` → `OrderActivity::fulfillment_resumed($event->order);`.

## 4. Dispatch wiring — OrderManager

- [x] 4.1 `mark_as_shipped()`: inside `if ($is_shipped)`, after `partial_update_order`, dispatch `OrderShipped::dispatch($this->order_service->find_order_or_fail($id));` (fresh fetch so `shipped_at` is present).
- [x] 4.2 `mark_as_delivered()`: inside `if ($is_delivered)`, dispatch `OrderDelivered::dispatch(...)` with a fresh order.
- [x] 4.3 `mark_as_cancel()`: inside `if ($is_cancelled)`, dispatch `OrderCancelled::dispatch($fresh_order, $reason);`.
- [x] 4.4 `add_tracking()`: capture the update's success bool, guard on it, dispatch `OrderTrackingAdded::dispatch($fresh_order, $tracking);` (only after adding the guard per design.md's noted gap — this method currently returns unconditionally).
- [x] 4.5 `mark_as_archive()`: same guard-then-dispatch treatment, `OrderArchived::dispatch($fresh_order);`.
- [x] 4.6 `mark_as_on_hold()`: dispatch `OrderPlacedOnHold::dispatch($fresh_order);` inside its existing success check.
- [x] 4.7 `mark_payment_as_paid()`: inside `if ($is_paid)`, dispatch `OrderPaymentCompleted::dispatch($fresh_order, $payment_provider);`.
- [x] 4.8 `mark_payment_as_failed()`: guard-then-dispatch `OrderPaymentFailed::dispatch($fresh_order);`.
- [x] ~~4.9 `mark_as_processing()`: dispatch `OrderStatusChanged::dispatch($fresh_order, $from, $to);` inside the existing success guard.~~ **Superseded twice**: (1) originally passed fulfillment-status values for `$from`/`$to` instead of order-status values — `describe_status_changed()` runs both through `OrderStatus::get_formatted()`, keyed by order-status values, so this would have silently produced empty strings; fixed to `$order->order_status`. (2) Per user request for consistency with every other action ("shouldn't these two fire own event as well"), replaced the shared generic `OrderStatusChanged` dispatch entirely: `mark_as_processing()` now branches on `$is_resuming` (already computed to pick the action) and dispatches `OrderMarkedAsProcessing::dispatch($fresh_order)` or `OrderFulfillmentResumed::dispatch($fresh_order)` — see design.md.

## 5. Dispatch wiring — Actions

- [x] 5.1 `CreateOrderAction::execute()`: replace `OrderActivity::order_placed($order->fresh('items'));` with `OrderPlaced::dispatch($order->fresh('items'));`, remove the now-unused `OrderActivity` facade import if nothing else in the file uses it.
- [x] 5.2 `CreateRefundAction::execute()`: after the refund row is created (`$order->refunds()->create([...])`), before `DB::commit()`, dispatch `OrderRefundRequested::dispatch($order->fresh('refunds'), $refund);`.
- [x] 5.3 `UpdateRefundAction::sync_fulfillment_status()`: inside the `if ($is_fully_refunded)` branch, after `$this->order_service->mark_refund_as_completed($order->id)`, dispatch `OrderRefunded::dispatch($order->fresh(), $refund);`.
- [x] 5.4 `DeleteRefundAction::execute()`: before `$refund->delete()`, snapshot the fields the listener needs (`['id' => $refund->id, 'invoiced_amount' => $refund->invoiced_amount, 'currency_code' => $order->currency_code]`); after delete, dispatch `OrderRefundDeleted::dispatch($order->fresh('refunds'), $snapshot);`.

## 6. Cache & verification

- [x] 6.1 Confirm `config/listeners.cache.php` regenerates with all 13 events mapped (dev-mode boot auto-runs `ListenerDiscovery`) — trigger a request against the dev stack, inspect the regenerated file. **Correction**: this file is gitignored, not tracked (confirmed via `git check-ignore`) — nothing to commit, contrary to the original task/design assumption; it only needs to exist on-disk, which dev-mode auto-regeneration already guarantees. Verified: all 12 new events + repurposed `OrderShipped` (now mapped to both `LogOrderShippedActivity` and `SendNotificationEmail`) appear correctly; `SettingsChanged`/`UpdateCurrencyRates` untouched.
- [x] 6.2 Live-verify end-to-end via the established `wp eval-file` smoke-test technique (phpunit's `migrate:fresh` is still blocked by the pre-existing, out-of-scope `ReplaceCartsCustomerIdWithUserId` bug — see prior change's notes): exercise each dispatch site (create order, mark shipped/delivered/cancelled/on-hold/archived, add tracking, mark payment paid/failed, run processing/resume-fulfillment, create+complete a refund, delete a refund) and assert the matching activity row + description text via `GET /orders/{id}/activities`. **Correction caught during verification**: `mark_as_processing()`'s `OrderStatusChanged` dispatch originally passed fulfillment-status values for `$from`/`$to`, but `describe_status_changed()` runs both through `OrderStatus::get_formatted()`, keyed by full order-status values — fixed to pass `$order->order_status` before/after instead (see design.md and task 4.9 annotation). 35/35 live checks passed after the fix, covering every wired dispatch site including the two new refund activity types and the `mark_as_on_hold`/payment-failed paths that bypass `PerformOrderAction`'s guard (pre-existing guard/transition-matrix gap, unrelated to this change — exercised via direct `OrderManager` calls instead).
- [x] 6.3 Confirm `SendNotificationEmail` still no-ops safely now that `OrderShipped` dispatches for real (its `handle()` body is an empty comment — no error expected, just confirm no exception). Verified: dispatching `OrderShipped` with both listeners attached throws nothing.
- [x] 6.4 Clean up any smoke-test data created against the dev DB, same discipline as prior rounds. Done: all smoke-test orders deleted (cascade-deleted their activities/items/refunds), temp `.smoke_test.php` removed, original 4 pre-existing orders left untouched.
- [x] 6.5 Re-verify Order B's path (`mark_as_on_hold` → `mark_as_processing` resume branch) after the `OrderMarkedAsProcessing`/`OrderFulfillmentResumed` split: assert `on-hold` then `fulfillment-resumed` activities are recorded (not `status-changed`), and that a fresh `mark_as_processing()` call from a non-held order records `processing` (not `status-changed`). 13/13 checks passed, including fixed-string description assertions and negative checks confirming `status-changed`/cross-branch types never appear. Smoke-test orders cleaned up.

## 7. Validation

- [x] 7.1 `openspec validate order-lifecycle-events --strict`. Passed: "Change 'order-lifecycle-events' is valid".
