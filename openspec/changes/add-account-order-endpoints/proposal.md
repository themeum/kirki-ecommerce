## Why

The customer account page (profile, password, addresses) is self-service today, but a customer has no way to see their own order history or a single order's details without going through the admin-only `/orders` endpoints — which have no ownership check and would leak every customer's orders to any logged-in user.

## What Changes

- Add `GET /account/orders` — paginated list of the authenticated customer's own orders, reusing the existing filter/sort/search behavior of the admin order list but always scoped to the requester's own `customer_id`, ignoring any `customer_id` supplied in the request.
- Add `GET /account/orders/{id}` — a single order's details, scoped to the requester's own orders; requesting an order that exists but belongs to another customer returns not-found, same as requesting an id that doesn't exist at all.
- Add a customer-facing order details response that excludes internal-only fields (`admin_notes`, `flags`) present on the admin `OrderResource`, while including `payment_next_step` (already surfaced on the checkout-confirmation order resource) so an unpaid order can offer a retry.
- Add `OrderService::find_order_for_customer_or_fail()` for the ownership-checked lookup, alongside the existing unscoped `find_order_or_fail()` used by the admin endpoint.

## Capabilities

### Modified Capabilities
- `account-self-service`: adds two read endpoints (`GET /account/orders`, `GET /account/orders/{id}`) to the set of account endpoints scoped strictly to the requester's own record.

## Impact

- `app/Http/Controllers/Site/AccountController.php` — two new action methods.
- `app/Services/OrderService.php` — new ownership-checked finder.
- `app/Resources/Site/Account/` — new customer-facing order details resource (new namespace/directory).
- `routes/api.php` — two new routes in the existing `/account/*` `AuthMiddleware` group.
- `docs/ecommerce/account/` — two new Bruno/OpenCollection request files documenting the endpoints.
- No database changes; no changes to the admin order endpoints or admin `OrderResource`.
