# Proposal

## Why

`orders.payment_metadata` holds a snapshot of the payment provider (id, name, icon, offline flag). The order API and the order list read the provider name, icon and offline flag from this snapshot. Only order creation writes the snapshot. Marking an order as paid with another provider changes the `payment_provider` column but leaves the snapshot old. The column and the snapshot then disagree, and the UI shows the wrong provider. The "payment completed" activity also shows the raw provider id, such as `bank_transfer`, instead of the provider name.

## What Changes

- Add a snapshot builder to `PaymentManager`, exposed on the `Payment` facade. Order creation and mark-as-paid both use it.
- Marking an order as paid with a provider refreshes the snapshot when that provider differs from the one in the snapshot:
  - `payment_metadata` is replaced with the new provider's snapshot.
  - The old `gateway` data is dropped, because it belongs to the old provider.
  - The column, the snapshot and `paid_at` are written in one update.
- Marking an order as paid with the same provider, or with no provider (online gateway webhooks), leaves `payment_metadata` unchanged. The `gateway` data stays.
- A manual order created without a provider gets a snapshot when it is later marked as paid with a provider.
- The mark-as-paid action rejects a provider id that is not in the payment registry. A disabled provider is still accepted, as for manual order creation.
- The payment-completed activity stores `provider_name` (from the refreshed snapshot) next to `provider`. The activity message prints the name and falls back to the id for older rows.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `order-payment-provider`: the snapshot follows the order's provider when mark-as-paid changes it, and the old gateway data is dropped on a change. The provider id given to mark-as-paid must be registered.
- `order-activity-log`: the payment-completed activity records and shows the provider name, not only the provider id.

## Impact

- `app/Payment/PaymentManager.php` and `app/Payment/Facades/Payment.php`: new snapshot method and `@method` entry.
- `app/Actions/Order/CreateOrderAction.php`: use `Payment::build_snapshot()` and remove its own copy.
- `app/Managers/OrderManager.php`: `mark_payment_as_paid()` refreshes the snapshot.
- `app/Actions/Order/PerformOrderAction.php`: reject an unregistered provider for the mark-as-paid action.
- `app/Managers/OrderActivityManager.php`: `provider_name` in the stored metadata and in the message.
- Tests: `tests/Integration/OrderPaymentMetadataTest.php` and the order action tests.
- Docs: `docs/order-data-and-calculations.md` (the `payment_metadata` rows and the refresh rules).
- No database change, no API shape change, no new dependency.
- Out of scope: gateway data for the Stripe `unpaid` branch and `mark_payment_as_unpaid()`, and a backfill of older activity rows.
