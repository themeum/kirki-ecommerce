## Context

See proposal.md for motivation. The pattern behind every bug is the same: read a row into PHP, check a rule, then write with an unconditional `UPDATE ... WHERE id = ?`. A transaction does not help, because MySQL's default isolation (REPEATABLE READ) gives a plain `SELECT` a snapshot and takes no lock.

Facts from the code that shape the fix:

- Tables use InnoDB (`Structure` default), so row locks and `UPDATE ... WHERE` re-evaluation work.
- The query builder's `update()`, `increment()` and `decrement()` return the number of affected rows (`wpdb::$rows_affected`). `VariantService`/`CouponService` cast that to `bool`, so "0 rows" is already detectable.
- `increment_each()`/`decrement_each()` accept `$extra` columns, and `raw()` is public, so one `UPDATE` can change several columns with SQL expressions.
- The builder has no `FOR UPDATE` helper. `DB::select()` with a raw statement is the way to lock a row (the framework queue already uses raw `DB::update`/`DB::select`).
- `vendor/libraries/framework/src/` is generated; this change must not edit it. Nothing here needs to.
- `DB::begin_transaction()` does not nest. Callers that already run in a transaction (`CreateOrderAction`, `UpdateOrderAction`, `PerformOrderAction`) must keep working, and lock helpers must work both inside and outside a transaction.
- The only caller of `OrderService::create_order()` is `CreateOrderAction`, inside a transaction.

Audit result (what is and is not in scope):

| Area | Verdict |
|---|---|
| Stock reserve / decrement | Bug. In scope. |
| Stock release / confirm | Bug (`min(read committed, qty)`). In scope. |
| Coupon total limit | Bug. In scope. |
| Coupon per-customer limit | Bug. In scope. |
| Refund over-refund | Bug. In scope. |
| Order transitions (cancel, mark paid) | Bug: unconditional update, side effects run for every caller. In scope. |
| `UpdateOrderAction` stale items | Bug. In scope. |
| Invoice counter | Safe in the normal case: the `UPDATE` locks the counter row until commit, so the following `SELECT` reads the caller's own value. Two narrow gaps remain: no counter row yet, and the yearly reset. In scope as hardening. |
| First-time-buyer coupon | Same race as the per-customer limit, low impact. Out of scope (see Risks). |
| SKU generator (`MAX(sku)+1`) | Race ends in a duplicate-key error on `uq_kecom_variants_sku`, not silent corruption. Out of scope. |
| Slug generation | Same: unique index turns it into a loud failure. Out of scope. |
| Customer creation | Unique `user_id` index and WordPress user uniqueness protect it. No change. |
| Queue job claim | Atomic `UPDATE ... SET reserved_by` in the framework. No change. |
| PayPal webhook | Checks `PAID` before marking paid; the transition fix makes the mark-paid step safe. |

## Goals / Non-Goals

**Goals:**
- Each guarded rule is checked by the database in the same statement that makes the change, or under a row lock held until commit.
- A request that loses a race fails with the existing error messages and leaves no partial change.
- Side effects (stock, coupons, events, logs) run only for the request that won.
- Every fix has a test that fails on the old code.

**Non-Goals:**
- No new tables, columns or migrations.
- No distributed lock, cache lock or queue-based serialisation.
- No change to REST response shapes, error messages or status codes.
- No edit to `vendor/libraries/framework/src/`.
- No change to the order state machine or to which transitions exist.

## Decisions

**D1. Conditional `UPDATE` as the primary guard; row lock only where one statement cannot do it.**
The database re-evaluates the `WHERE` after waiting for a competing row lock, so a conditional `UPDATE` is atomic without an explicit lock. Used for stock, coupon total limit and order state transitions. A row lock (`SELECT ... FOR UPDATE`) is used only for refunds and order edits, where the rule spans several rows (all refunds of the order, all items of the order).
Alternatives: (a) `SELECT ... FOR UPDATE` everywhere. Rejected: more round trips, holds locks longer, and needs a lock helper the builder lacks. (b) Optimistic version column. Rejected: needs a migration and retries. (c) Cache or application lock. Rejected: not safe across PHP workers without a shared store.

**D2. Stock: one new method per rule in `VariantService`, `InventoryService` keeps the policy.**
`VariantService` gets methods that carry the SQL guard; `InventoryService` decides, from the variant flags, which one to call:

- `reserve`: `UPDATE variants SET available_quantity = available_quantity - q, committed_quantity = committed_quantity + q WHERE id = ? AND available_quantity >= q`. One statement moves both columns, so there is no half-done state. Used when `track_inventory && !allow_back_order`.
- Back-order variants use the same statement without the `available_quantity >= q` condition.
- `decrement_stock` uses a conditional decrement of `available_quantity` only.
- `release`: one statement that takes `LEAST(committed_quantity, q)` from committed and adds the same amount to available. MySQL evaluates `SET` assignments left to right and later assignments see earlier results, so `available_quantity` is assigned before `committed_quantity`. A test must pin this order.
- `confirm`: `SET committed_quantity = committed_quantity - LEAST(committed_quantity, q)`.
- 0 rows affected on a guarded reserve or decrement throws the existing `ValidationException` ("Insufficient stock to reserve." / "Insufficient stock."). The generic `increment()`/`decrement()` stay for other callers.

The existing early PHP check stays as a fast path with a friendly message; the SQL condition is the real guard. The stock-alert crossing (`record_stock_level_crossing`) runs only after the statement affected a row. It uses the quantity read before the change, which can be stale under a race; the alert is best effort (see Risks).
Alternative: add the condition to the generic `VariantService::decrement()`. Rejected: it is also used for `committed_quantity`, and a hidden condition on a generic method is a trap.
Alternative: a new `InsufficientStockException`. Rejected: callers and the REST layer already handle `ValidationException` with HTTP 422.

**D3. Coupon limit: conditional increment, then re-check per-customer under that lock.**
`CouponService` gets a method that runs `UPDATE coupons SET current_usage_count = current_usage_count + 1 WHERE id = ? AND (has_usage_limit = 0 OR current_usage_count < usage_limit)`. `sync_order_coupons()` uses it and throws "Coupon usage limit reached." on 0 rows. The throw rolls back the order transaction, so nothing partial remains.
That `UPDATE` also locks the coupon row until commit. For a coupon with a per-customer limit, `sync_order_coupons()` then counts the customer's uses again; any competing order from the same customer is waiting on the coupon row, so the count is stable. If the count is already at the limit, throw the existing per-customer error.
Decrements of `current_usage_count` (cancel, edit) use `GREATEST(current_usage_count - 1, 0)` so a repeated reversal cannot go below zero. Reversals are also protected by D5.
Alternative: re-check only the total limit. Rejected: the per-customer limit has the same race and the lock is already held, so the re-check is cheap.

**D4. Refunds: lock the order row first, then calculate.**
`CreateRefundAction` moves `DB::begin_transaction()` before the refundable calculation. Its first step is `SELECT id FROM orders WHERE id = ? FOR UPDATE` through a small helper on `OrderService`. It then loads the order's refunds fresh and calculates the refundable amount. The second request waits on the lock, then sees the first refund and fails the check. The gateway call stays inside the transaction as today, so a gateway failure rolls the refund record back.
Alternative: unique/conditional insert on a running total column. Rejected: needs a migration and a denormalised total.
Trade-off: the order row is locked while the gateway call runs. Refunds are rare and per order, so this is acceptable (see Risks).

**D5. Order transitions: guard the status in the `UPDATE`.**
`OrderService::apply_order_action()` adds `WHERE id = ? AND order_status = <expected>` to the update and returns `false` when 0 rows change. `OrderManager::mark_as_cancel()` and `mark_payment_as_paid()` already run their side effects only `if ($is_cancelled)` / `if ($is_paid)`, so a loser skips them with no more change. `PerformOrderAction` already wraps these in a transaction, so a loser also leaves nothing behind.
The existing early return `true` when no transition is defined stays as it is; changing it is a behaviour change and is out of scope. It is noted for the user, not changed.
Alternative: lock the order row at the start of each action. Rejected: the conditional update is the smaller change and already gives "once" semantics.

**D6. Order edits and actions: lock the order row and reload inside the transaction.**
`UpdateOrderAction::execute()` locks the order row (same helper as D4) right after `begin_transaction()` and reloads `$order` with its items before `sync_order_items()`. `PerformOrderAction::execute()` does the same and runs its state guard after the reload (see the correction below). This makes two edits, or an edit and a cancel, run one after the other, and each works from current items. The recalculation before the transaction stays; it only prices the cart and does not write.

**D7. Invoice counter: close the two gaps.**
- No counter row: replace "increment, if 0 rows then `Option::set`" with an atomic upsert (`INSERT ... ON DUPLICATE KEY UPDATE option_value = option_value + 1`) that seeds the row with the starting sequence on first use.
- Yearly reset: make the reset a conditional `UPDATE` keyed on the stored reset year, so only the first request of the year resets the counter.
Both stay inside the order-creation transaction, so a rollback also undoes the increment and leaves no gap.
Non-goal: a database unique index on `orders.invoice_number`. It would need a migration; the counter fix is the guard.

**D8. Testing strategy.**
The integration suite runs in one PHP process and one DB connection, so it cannot run two requests at the same millisecond. Tests therefore prove the guard, not the scheduler:

1. *Stale-read tests*: load the variant (or coupon, order) into PHP, change the row through a second path to simulate the competitor winning, then run the operation with the stale object. The old code oversells; the new code fails with the validation error. This is deterministic.
2. *Affected-rows tests*: call each new SQL method directly and assert true/false and the final column values, including the `LEAST` clamp and the `SET` order for release.
3. *Rule-set tests*: back-order, untracked, no-limit coupon and rollback of a failed order.
4. *True concurrency stress script* (`bin/` or `tests/` helper, run by hand against the Docker/MySQL setup): N parallel PHP processes hit reserve/coupon/refund/cancel for the same row, then assert the invariants (stock >= 0, usage <= limit, refunded <= total, release once). It is a manual check, not part of `composer test`, because it needs several real connections.

## Risks / Trade-offs

- [Stale quantity in stock alerts: the alert uses the quantity read before the change, so under a race the low/out-of-stock crossing can be missed or doubled] → Alerts are best effort and already coalesced by `collect_stock_alerts()`. The spec only requires no alert for a failed request.
- [Refund transaction holds the order row lock during the gateway call] → Refunds are rare and per order; a slow gateway delays only other actions on that same order. Revisit if gateway latency becomes a problem.
- [Deadlock between two orders that reserve the same variants in a different order] → InnoDB detects the deadlock and rolls one back. Mitigation: reserve in ascending `variant_id` order inside `CreateOrderAction`. Add this only if a test shows the loop is not already ordered; otherwise leave it.
- [First-time-buyer coupon has the same race as the per-customer limit] → Impact is one extra discount for one customer who submits two first orders at once. Accepted and documented; not fixed here.
- [`GREATEST(... , 0)` on coupon reversal could hide a real accounting bug] → It only prevents a negative count; the order-transition guard (D5) is what stops double reversal. A test covers both.
- [MySQL-specific SQL (`LEAST`, `GREATEST`, `ON DUPLICATE KEY`)] → The plugin already targets MySQL/MariaDB (`SUBSTRING_INDEX` is used elsewhere). No new platform requirement.
- [Existing tests that pass a mocked service may break because new methods are called] → Update those mocks in the same task as the code change.

## Migration Plan

No schema change, so no migration step. Deploy is a normal plugin update. Rollback is reverting the code; stored data is unaffected. Rows that already have negative `available_quantity` from past overselling are not changed by this work.

## Open Questions

- Should a negative `available_quantity` from past overselling be reported to the merchant (for example in the setup checklist)? It does not change the specs or tasks here and can be decided later.

## Correction during implementation

**The conditional update alone (D5) left a narrow window.** `OrderService::apply_order_action()` returns `true` without changing anything when the order's current status has no transition for the action. A cancel request that passed `PerformOrderAction::guard()` just before a competing cancel committed could then read the already-cancelled order inside its own transaction, get `true`, and release stock a second time. Fix: `PerformOrderAction::execute()` now starts the transaction, locks the order row, reloads the order, and only then runs `guard()`. The loser waits for the winner, sees the new status, and is rejected with "This action is not available for the order's current status." The conditional update from D5 stays as the second line of defence for callers that do not go through `PerformOrderAction` (for example the PayPal webhook).

**`GREATEST(..., 0)` for the coupon decrement (D3) became a `WHERE current_usage_count > 0` condition.** It gives the same result (never below zero) and tells the caller whether a use was really given back.

**The PHPUnit tests cannot show a rollback of a competitor's write.** The test database connection is one open transaction, so when a request fails and rolls back, the simulated competitor's write goes with it. Tests of failed requests therefore assert the response and that nothing from the failed request remains, not the competitor's leftovers.

## Stress run record (task 7.1)

`bash bin/concurrency-stress.sh 12` against the Docker development site (MariaDB, 12 separate PHP processes started at the same instant per scenario):

| Scenario | Before the fix | After the fix |
|---|---|---|
| reserve (3 units, 12 workers) | 12 succeeded, available = -9 | 3 succeeded, available = 0 |
| release (4 committed, 12 workers) | 12 succeeded, committed = -8 | 4 succeeded, committed = 0 |
| coupon (limit 3, 12 workers) | 10 uses counted | exactly 3 counted |
| cancel (one order, 12 workers) | 2 cancels applied, a second order's reservation taken (committed = 1, expected 2) | 1 cancel applied, committed = 2 |
| refund (one order, 12 workers) | 2 refunds recorded | 1 refund recorded |

Added after the first record, with real checkouts (12 workers each):

| Scenario | Before the fix | After the fix |
|---|---|---|
| edit (one order, 1 to 3 units) | 7 of 12 edits succeeded, 5 failed with database errors; final stock was correct | 12 of 12 succeeded, committed = 3 |
| checkout (3 units, 12 shoppers) | 3 orders, no oversell (see the correction below) | 3 orders, no oversell, distinct invoice numbers |
| invoice_first (no counter row) | 12 orders, numbers 500 to 511 (the race did not show) | 12 orders, numbers 500 to 511 |
| invoice_year (counter last used last year) | 3 of 12 orders placed, numbers 500, 504, 505 (gap, repeated resets and failures) | 12 of 12 placed, numbers 500 to 511, one reset |

The "before" run used the previous `app/` code from `git stash`, with the coupon worker emulating the old check-then-increment because `claim_usage()` did not exist yet.

**My first invoice change deadlocked, and the stress run caught it.** The first version seeded the counter row with `INSERT IGNORE` and then ran the `UPDATE`. An insert that finds an existing row takes a shared lock, and several orders holding it then deadlock when each tries to update the row: 11 of 12 concurrent orders failed. The PHPUnit tests could not show this because they use one connection. The counter is now one `INSERT ... ON DUPLICATE KEY UPDATE`, which takes the exclusive lock at once, so orders queue. The yearly reset is the same kind of upsert and no longer starts with a read.

**A plain read before a write breaks on MariaDB 11.6+.** The development database is MariaDB 12.3 with `innodb_snapshot_isolation=ON`. A transaction that waits for another one's commit and then writes the same row fails with `Record has changed since last read` if it already read anything, because its snapshot is older than that commit. The old fast path (`Option::get()` for the reset year) did exactly that, so it was removed. New option rows are also created autoloaded, so reading them is served from WordPress's cache and opens no snapshot. The same server setting makes the losers of other races fail with a database error instead of re-checking the row; the data stays correct. This is written up in `docs/concurrency.md`.

**Premise check for the original report.** In the real checkout flow the old code did not oversell in my 12-worker run: every order takes the next invoice number inside its transaction, and that locks one counter row until the order is saved, so checkouts already ran one at a time. The reserve, release, coupon, cancel and refund scenarios, and `UpdateOrderAction`, did break. The stock guard is still needed because it must not depend on that side effect (it would disappear if invoice numbers were assigned later), and because `InventoryService` is also called from other paths. The lock also means checkout speed is limited to one order at a time; this is documented.
