## Why

Customers should only see fulfillment-related order activity. Today the customer
REST endpoint returns every activity (comments, payments, refunds, author names),
while the customer pages hide only two types with hardcoded checks. There is no
single place that decides what a customer may see.

## What Changes

- Add one allow-list of customer-visible activity types on `OrderActivityType`.
  Customers see only: order-placed, processing, fulfillment-resumed, shipped,
  delivered, cancelled, tracking-added, on-hold.
- Hidden from customers: payment-completed, payment-failed, archived,
  partially-refunded, refunded, refund-requested, refund-deleted, comment-added.
- Apply the allow-list in every customer read path:
  - the order details page and the order tracking page (`get_order_activity`)
  - the customer REST endpoint `GET /account/orders/{id}/activities`
    (`Site\OrderActivityController::get`)
- The customer REST endpoint keeps its current response shape, except it no
  longer returns `notify_customer` (an email-sending flag for admins).
- Remove the hardcoded `!=` checks and the todo in `get_order_activity`.
- **BREAKING**: the customer REST endpoint no longer returns comments or
  payment/refund activities, and no longer returns `notify_customer`.
- Admin endpoints are not changed.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `order-activity-log`: the requirement "Customers can view their own order's
  activity timeline, paginated" changes. Customers get only allow-listed
  activity types, without the `notify_customer` flag. A new requirement defines the
  allow-list as the single source of truth for every customer-facing path.

## Impact

- `app/Constants/Order/OrderActivityType.php`: new `customer_visible()` list.
- `app/Services/OrderActivityService.php`: customer queries filter by the list.
- `app/Http/Controllers/Site/OrderActivityController.php`: use the filtered query
  and a customer resource that omits `notify_customer`.
- `tests/Integration/OrderActivityApiTest.php`: the customer test expects no comment.
- `docs/ecommerce/account/order-activities.yml`: example response updated.
- No schema change, no migration, no admin UI change.
