# Design

## Context

See proposal.md for the problem. Current state, observed in code:

- `CreateOrderAction::build_payment_provider_snapshot()` is the only code that builds the snapshot. It reads the provider from `Payment::get_provider()` and returns `['payment_provider' => [id, name, icon, is_offline]]`, or `null` for an unknown id.
- `OrderManager::mark_payment_as_paid()` is the only code that changes `payment_provider` after creation. It writes `paid_at` and the column, then logs the payment-completed activity from a reloaded order.
- `OrderManager::set_payment_metadata()` keeps the snapshot and writes gateway data under the `gateway` key. All 15 online providers call it right after `mark_payment_as_paid()` and pass no provider, so their orders are already correct.
- `PerformOrderAction` runs inside one DB transaction with rollback. `OrderActionRequest` checks only that `payment_provider` is a string.
- `OrderActivityManager::payment_completed()` stores the provider id, and `describe_payment_completed()` prints it.

## Goals / Non-Goals

**Goals:**

- The `payment_provider` column and the snapshot never disagree after mark-as-paid.
- One snapshot builder, used by creation and by mark-as-paid.
- The payment-completed activity reads well and stays true after a provider is renamed.

**Non-Goals:**

- No change to how online gateways save their data (`set_payment_metadata()` stays as it is).
- No gateway data for the Stripe `unpaid` branch or for `mark_payment_as_unpaid()`.
- No backfill of old activity rows or of old orders with a missing snapshot.
- No database migration and no API shape change.

## Decisions

**1. The snapshot builder lives in `PaymentManager`, exposed on the `Payment` facade.**
It is provider knowledge, and `PaymentManager` already owns `get_provider()`. The method is `build_snapshot($provider_id)`. It returns the same array as today, or `null` for an unknown or empty id. `CreateOrderAction` calls it and drops its own copy. Alternative: keep it in `OrderService`. Rejected, because the service would then need the payment registry.

**2. Mark-as-paid refreshes by comparing provider ids.**
Inside `mark_payment_as_paid()`, when a provider is given, compare it with `payment_metadata['payment_provider']['id']` of the order:

```
provider given?
  no  -> change nothing in payment_metadata
  yes -> snapshot id == given id ?
           yes -> change nothing (gateway data stays)
           no  -> payment_metadata = Payment::build_snapshot(given)   (gateway data dropped)
                  payment_provider = given
```

The comparison uses the snapshot id, not the column. This one rule also covers a manual order with no provider and an order whose snapshot is missing. The refresh is part of the same `partial_update_order` call as `paid_at` and the column, so they cannot drift apart. Alternative: compare with the column. Rejected, because it does not repair an order that has the column set and no snapshot.

**3. Dropping `gateway` data when the provider changes.**
Gateway data describes the old provider. Keeping it beside a new snapshot would contradict it. The activity log keeps the history of who paid and how. Alternative: keep it as history. Rejected for consistency.

**4. An unknown provider is rejected in `PerformOrderAction`.**
In the `MARK_AS_PAID` case, when a provider is given and `Payment::get_provider()` returns `null`, throw a 422 `ValidationException` with `throw_anyway()`. This is inside the transaction, so nothing is written. It mirrors `CreateOrderAction::validate_payment_provider()`. The check does not test `enabled()`, because an admin can already create a manual order with a disabled provider. Alternative: a request-level rule. Rejected, because the registry is not available to the request class without extra wiring, and the action layer already holds the check for creation.

**5. The activity stores a copy of the name.**
`payment_completed()` adds `provider_name`, read from the reloaded order's snapshot (`payment_metadata['payment_provider']['name']`). `provider` stays as the id. `describe_payment_completed()` prints `provider_name` and falls back to `provider`. A live lookup at display time is rejected, because a renamed or removed provider would change old history. Mark-as-paid already reloads the order before it logs, so the snapshot is fresh.

## Risks / Trade-offs

- [Admin picks the wrong provider by mistake and the old gateway data is lost] → The activity log still records the payment-completed event. A re-mark is not possible, because the order is already paid.
- [Older activity rows show the provider id] → Accepted. The fallback keeps them readable, and a backfill is out of scope.
- [Old orders with a missing snapshot show no provider name] → Accepted. The next mark-as-paid with a provider repairs the snapshot.

## Migration Plan

No schema change. Deploy the code. Existing rows keep working: the activity falls back to the id, and the snapshot is rebuilt on the next mark-as-paid. Rollback is a code revert. Orders already refreshed keep a valid snapshot in the old format.
