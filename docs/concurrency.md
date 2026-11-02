# Stock, Coupon, Refund and Order Safety Under Load

What the store guarantees when many shoppers and admins act at the same moment:
a flash sale, a double-clicked button, or a payment webhook that arrives while
an admin changes the same order.

The short version: **stock, coupon uses and refunds are checked by the
database in the same step that changes them**, so two requests can never both
take the last unit, the last coupon use, or the same refundable money. A request
that loses the race fails with the normal error message and changes nothing.

- [1. Quick start](#1-quick-start)
- [2. What is guarded](#2-what-is-guarded)
- [3. Errors a shopper or admin can see](#3-errors-a-shopper-or-admin-can-see)
- [4. How it works](#4-how-it-works)
- [5. Checking it yourself](#5-checking-it-yourself)
- [6. What is not guarded](#6-what-is-not-guarded)
- [7. Where this differs from WooCommerce](#7-where-this-differs-from-woocommerce)

---

## 1. Quick start

There is nothing to configure. The guards are always on.

To see them work against the Docker development site:

```
bash bin/concurrency-stress.sh
```

It starts 12 separate PHP processes at the same instant for each scenario
(reserve stock, release stock, use a coupon, cancel, refund and edit an order,
place orders, invoice numbers) and prints `PASS` or `FAIL` for the invariant of
each. See section 5.

---

## 2. What is guarded

| Action | Guarantee when requests race |
|---|---|
| Place or edit an order (reserve stock) | A tracked variant without back orders never goes below zero available. Only as many requests succeed as there is stock. |
| Decrease stock directly | Same as above. |
| Cancel, edit or finish an order (release or confirm stock) | Only the quantity that is committed *at that moment* is moved or removed. The committed quantity never goes below zero, and one order cannot take back stock reserved by another order. |
| Use a coupon with a usage limit | The counted uses never pass the limit. The last use goes to one order. |
| Use a coupon with a per-customer limit | One buyer cannot pass the limit with two simultaneous orders. |
| Cancel or reverse a coupon | A use is given back once. The count never goes below zero. |
| Refund an order | The refunds of one order never add up to more than the refundable total. A second simultaneous request waits and then sees the first one. |
| Change an order's state (cancel, mark paid, ship, deliver, hold, process) | The change is applied once. Stock release, coupon reversal, activity log and events run only for the request that won. |
| Edit an order | Two edits, or an edit and a cancel, of the same order run one after the other. Each works from the order items as they are when it starts. |
| Invoice numbers | Every order gets a different number, including the first order of a store and the first order of a new year. A failed order gives its number back, so there is no gap. |

Variants that **allow back orders** can still go below zero available. That is
what back orders mean. Variants that **do not track inventory** are never
limited.

---

## 3. Errors a shopper or admin can see

A request that loses a race gets the same message it would get if the stock,
coupon or refund had already run out when the request started:

| Situation | Message |
|---|---|
| Last unit taken while this order was being placed | `Insufficient stock to reserve.` |
| Last unit taken while stock was decreased directly | `Insufficient stock.` |
| Last coupon use taken while this order was being placed | `Coupon usage limit reached.` |
| Same buyer used a per-customer coupon in a simultaneous order | `You have reached the usage limit for this coupon.` |
| Another refund already covers the amount | `Refund amount exceeds refundable amount.` |

The failed request is rolled back completely: no order, no order items, no
reserved stock and no counted coupon use remain from it.

A cancel or state change that lost the race does not fail. It reports that the
transition was not applied, and the order stays as the winning request left it.

---

## 4. How it works

Reading a value in PHP, checking it, and writing it back is not safe, because
another request can change the row between the read and the write. A database
transaction does not fix this by itself, since a plain read inside a transaction
takes no lock.

The store therefore moves the check into the database:

- **Stock and coupons** use one `UPDATE` that contains the rule, for example
  "subtract 1 where at least 1 is available". The database locks the row, makes
  the second request wait, and checks the rule again against the new value. If no
  row changes, the request fails.
- **Reserve** moves a quantity from available to committed in a single
  statement, so a failed reserve cannot leave half a change.
- **Release and confirm** take the smaller of the request and the committed
  quantity inside the statement.
- **Order state changes** update the order only while it is still in the state
  the request read.
- **Refunds and order edits** lock the order row first (`SELECT ... FOR UPDATE`)
  and read the order after that, so a refund or edit that just committed is seen.

The PHP checks that existed before stay as a fast path with a friendly message.
The database condition is the one that protects the data.

---

## 5. Checking it yourself

**Automated tests.** `tests/Integration/ConcurrencySafetyTest.php` covers every
guard. One PHP process has one database connection, so the tests cannot run two
requests at the same instant. Instead each test lets a competing change land
after the operation read its data, which is exactly the moment the old code
broke.

```
./kirki-ecommerce-test integration --filter=ConcurrencySafetyTest
```

**Real concurrency.** `bin/concurrency-stress.sh [workers]` starts the given
number of separate processes (12 by default) that fire at the same instant and
checks the result. It needs the Docker development site and changes real rows of
it: it saves the variant it uses and removes the orders and coupon it creates.
It reads the first variant of the site, so run it on a development site, never
on a live store.

| Scenario | Invariant checked |
|---|---|
| reserve | 12 workers reserve 1 unit of a variant holding 3: exactly 3 succeed and available stock is 0, never negative. |
| release | 12 workers release 1 unit of a variant with 4 committed: committed ends at exactly 0. |
| coupon | 12 workers use a coupon with a limit of 3: usage ends at exactly 3. |
| cancel | 12 workers cancel one order: its stock is released once and another order's reservation is untouched. |
| refund | 12 workers refund the whole of one order: exactly one refund is recorded. |
| edit | 12 workers edit one order from 1 to 3 units: exactly 3 units end up committed, not more. |
| checkout | 12 shoppers place a whole order for a variant with 3 units: exactly 3 orders are created, 9 get `Not enough stock`, and the invoice numbers differ. |
| invoice_first | 12 shoppers place orders on a store with no invoice counter yet: 12 orders, every number different and consecutive from the configured start. |
| invoice_year | The same with "reset every year" on and a counter last used last year: the counter restarts once, at the configured start, and every number is different. |

Add `STRESS_ONLY="reserve coupon"` to run some scenarios only, and
`STRESS_SHOW_REJECTED=1` to print why requests were rejected.

---

## 6. What is not guarded

- **First-time-buyer coupons.** A buyer who submits two first orders at the same
  moment can get the first-time discount on both. The impact is one extra
  discount for one buyer; it is not fixed.
- **SKU and slug generation.** Two products created at the same moment can pick
  the same next SKU or slug. A unique index rejects the second one, so the
  request fails with an error instead of saving a duplicate.
- **Low-stock and out-of-stock emails.** They are advisory. Under a race an alert
  can be missed or sent twice (see the inventory note in `emails.md`). A request
  that fails never sends one.
- **Orders are created one at a time.** Each new order takes the next invoice
  number from one counter row and keeps it locked until the order is saved, so
  that numbers have no gaps. Simultaneous checkouts therefore queue behind each
  other, and checkout speed is limited by how long one order takes to save.
- **MariaDB 11.6 and newer.** These versions turn on `innodb_snapshot_isolation`
  by default. A transaction that waited for another one to change the same row
  can then fail with `Record has changed since last read` instead of re-checking
  the row. The data stays correct and the request is rolled back, but the shopper
  or admin sees a server error and must try again. MySQL and older MariaDB
  re-check the row as described in section 4. If you see this error under heavy
  load, set `innodb_snapshot_isolation=OFF` or use `READ COMMITTED`.
- **Past oversells.** Stock that already went negative before these guards is not
  changed. Check the inventory list for variants with a negative available
  quantity and correct them by hand.

---

## 7. Where this differs from WooCommerce

- **Stock is reserved when the order is created.** WooCommerce reduces stock when
  an order reaches a paid or processing status, with an optional "hold stock"
  timer for unpaid orders. Here the reserve is made when the order is placed and
  is given back only when the order is cancelled or edited. There is no timer that
  releases the stock of an order that stays unpaid.
- **Committed stock.** Each variant keeps two numbers, available and committed.
  WooCommerce has one stock number plus held reservations.
- **Failed races are errors, not silent.** The loser of a race gets an error and
  the whole order is rolled back. It is not saved without the discount or with
  reduced quantities.
- **Back orders are allowed to go negative.** A variant that allows back orders
  has no lower limit, as in WooCommerce, but its available quantity is stored as
  a negative number.
- **MySQL or MariaDB only.** The guards use `LEAST`, `GREATEST`,
  `ON DUPLICATE KEY UPDATE` and `SELECT ... FOR UPDATE`, and need InnoDB tables, which the
  plugin creates.
- **No distributed lock.** Nothing relies on a cache or a lock service, so the
  guards work with any number of PHP workers, but they all depend on the same
  database.
