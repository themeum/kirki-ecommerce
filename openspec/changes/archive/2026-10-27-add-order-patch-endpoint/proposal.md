# Proposal

## Why

The admin order details page saves the order note and the flags through `PUT /orders/{id}`. That endpoint needs the full order payload (items, addresses, shipping method). It also recalculates totals and re-syncs stock, coupons and taxes. A note or flag edit does not need any of this work. It can also fail on unrelated validation, for example a missing address field on an old order. The API needs a light endpoint for these two fields.

## What Changes

- Add `PATCH /orders/{id}`. It updates only `order_notes` and `flags`. Only the keys that are sent change.
- Add the request class `OrderPatchRequest` with the validation and sanitizing rules.
- Add `OrderController::patch()`. It calls `OrderService::partial_update_order()` and returns the order resource.
- Update the docs for the new endpoint.
- No database change. The `order_notes` and `flags` columns already exist.
- Not in scope: the admin UI. The order details page keeps using `PUT /orders/{id}` until a separate change moves it to the new endpoint.
- Not in scope: order activity log entries for note or flag edits. This needs a new activity type and a change to the customer-visible allow-list.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `order-notes`: a new requirement defines the partial update endpoint for `order_notes` and `flags`.

## Impact

- Backend: `routes/api.php`, `app/Http/Controllers/Api/OrderController.php`, new `app/Http/Requests/Order/OrderPatchRequest.php`.
- Tests: new integration tests in `tests/Integration/OrderApiTest.php` and `tests/Integration/AdminApiAccessTest.php`.
- Docs: `docs/order-data-and-calculations.md`.
- `PUT /orders/{id}` does not change. It still accepts `order_notes` and `flags`, so existing API clients and the current admin UI keep working.
