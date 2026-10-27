# Proposal

## Why

The order edit screen needs the order plus data that only the calculation resource (`OrderCalculationResource`) gives today: whether each line is reachable, the variant's live stock and per-order limit values, and the shipping methods the admin can choose from. With only `GET /orders/{id}`, the screen has no stock data and no shipping list until the first preview call, so it cannot lock a line, limit a quantity, or offer a shipping change on first render. Adding these to `OrderResource` would also burden the mails and the create and update responses, which use it too.

## What Changes

- New endpoint `GET /orders/{id}/edit` returns the whole `OrderResource` payload, flat, plus:
  - on each item: `is_reachable`, `allow_back_order`, `track_inventory`, `available_quantity`, `in_stock`, `has_limit_per_order`, `max_per_order`. These are the variant's live values.
  - at the root: `available_shipping_methods`, in the same shape as the calculation payload.
- A new `OrderEditResource`, which extends `OrderResource`, builds this payload. `OrderResource` and `GET /orders/{id}` do not change.
- The stock keys are built by one small trait, shared with `OrderCalculationResource`. The shipping method shaping moves out of `OrderCalculationResource` into one small trait, shared with `OrderEditResource`.
- The shipping list needs a calculation context for the stored order, so the calculation input gets a way to be built from a stored order.
- The 404 and 422 rule for "find an order that can be edited" is shared by the preview and the new endpoint.
- `docs/order-editing.md` and the order API docs describe the endpoint.

No existing key is removed or renamed. No frontend work.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `order-editing`: the system now serves an edit read that gives the order with each item's live reachability, stock and per-order limit values, and the shipping methods that can be chosen.

## Impact

- PHP: `app/Resources/Order/OrderEditResource.php` (new), `app/Resources/Order/OrderCalculationResource.php`, `app/Http/Controllers/Api/OrderController.php`, `app/Http/Controllers/Api/OrderCalculationController.php`, `app/Services/OrderService.php`, `app/DTO/Calculation/OrderCalculationInputDTO.php`, `routes/api.php`, two new traits in `app/Concerns/`.
- Docs: `docs/order-editing.md`, a new `docs/ecommerce/orders/` entry for the endpoint.
- Tests: `tests/Unit/Resources/`, `tests/Unit/DTO/`, `tests/Integration/OrderEditApiTest.php`.
- Cost: one edit read runs a full calculation and live shipping quotes. Only this endpoint pays it.
