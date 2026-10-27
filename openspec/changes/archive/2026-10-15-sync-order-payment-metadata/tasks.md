# Tasks

## 1. Shared snapshot builder

- [x] 1.1 Add `build_snapshot($provider_id)` to `app/Payment/PaymentManager.php` (id, name, icon, is_offline under a `payment_provider` key; `null` for an empty or unknown id) with a full docblock, and add its `@method` line to `app/Payment/Facades/Payment.php`. Verify with a unit or integration test: a registered provider returns the four fields, an unknown id returns `null`.
- [x] 1.2 In `app/Actions/Order/CreateOrderAction.php`, replace `build_payment_provider_snapshot()` with `Payment::build_snapshot()` and delete the old method. Verify `tests/Integration/OrderPaymentMetadataTest.php` and the checkout tests still pass, and that no reference to the old method is left (`grep`).

## 2. Mark-as-paid keeps the snapshot in sync

- [x] 2.1 In `app/Managers/OrderManager.php`, update `mark_payment_as_paid()`: when a provider is given and the snapshot id differs, write `payment_provider` and the new `payment_metadata` (gateway data dropped) in the same `partial_update_order` call as `paid_at`. Same id or no provider: leave `payment_metadata` unchanged. Update the docblock. Verify with integration tests for: different provider, same provider keeps `gateway`, no provider changes nothing, manual order with no provider gets a snapshot, old `gateway` data is dropped on a change.
- [x] 2.2 In `app/Actions/Order/PerformOrderAction.php`, in the `MARK_AS_PAID` case, throw a 422 `ValidationException` when a given provider id is not registered; accept a disabled provider. Add `@throws` text to the docblock. Verify with tests: unknown id returns 422 and the order stays unpaid with unchanged provider and metadata; disabled provider is accepted.
- [x] 2.3 Add the tests from 2.1 and 2.2 to `tests/Integration/OrderPaymentMetadataTest.php` (use the `PATCH orders/{id}/action` call with `OrderAction::MARK_AS_PAID`, and seeded providers such as `cod` and `bank_transfer`). Verify the order details and the order list return the new provider name, icon and `is_offline`. Run the file and confirm it passes.

## 3. Readable payment-completed activity

- [x] 3.1 In `app/Managers/OrderActivityManager.php`, add `provider_name` (from `payment_metadata['payment_provider']['name']`) to the `payment_completed()` metadata, and make `describe_payment_completed()` print it, with a fallback to `provider` and no provider text when both are empty. Verify with tests: the message names the new provider after a provider change, an older row with only `provider` still shows the id, and a renamed provider does not change an old activity.

## 4. Docs and final checks

- [x] 4.1 Update `docs/order-data-and-calculations.md`: the `payment_provider` and `payment_metadata` rows, and the refresh rules (same provider keeps gateway data, different provider replaces the metadata, no provider changes nothing). Verify the doc matches the behavior covered by the tests in group 2.
- [x] 4.2 Run `composer phpcs:wporg` and the PHP test suite for the touched files. Verify both pass with no new warnings.

## Workflow follow-up

- Archive the change after review: `/opsx:archive`.
