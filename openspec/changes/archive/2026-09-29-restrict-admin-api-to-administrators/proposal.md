## Why

Every admin REST endpoint (orders, customers, settings, payment gateways, catalog) sits behind `AuthMiddleware`, which only checks that the caller is logged in. Any storefront customer who registers at checkout can therefore read every customer's personal data, refund orders, change store settings, edit payment gateway credentials, and install payment add-on code on the server. This has to be closed now, before per-resource capabilities are designed, with the simplest correct gate that already exists.

## What Changes

- **BREAKING** The admin API route group in `routes/api.php` adds the framework's existing `AdminMiddleware` (`manage_options`) after `AuthMiddleware`. Logged-out callers still get `401`; logged-in users without `manage_options` - customers, subscribers, editors - now get `403` on every admin endpoint. This matches the `manage_options` capability the admin menus already require, so anyone who can open the admin app can still use it.
- **BREAKING** `POST /orders` no longer accepts a logged-in shopper creating their own order; shoppers place orders through `POST /checkout` (which the storefront already uses exclusively).
- Customer-facing endpoints keep their current access: the cart, checkout and shop product endpoints stay public, and the `/account/*` group stays behind `AuthMiddleware` (its controllers already scope data to the logged-in customer).
- Payment webhook endpoints stay public; they are authenticated by the provider's signature (see `payment-webhook-authentication`).
- The development-only routes `/test` (admin group) and `/test-public` (public) are removed, along with `TestController`. `/test-public` exposes a database query log to anonymous visitors, and `/test` writes a store setting (`general.industry`) on every call.
- The mock `/online-payments/download/{id}` route is deliberately left public and unchanged: the add-on install flow downloads from it server-to-server, which carries no login cookie, and it is temporary until the live cloud download URL replaces it (existing `@todo`).
- Admin-only endpoints drop their own role checks (`OrderUpdateRequest`, `OrderActionRequest`, the manual-order check in `OrderController::store`) - the route gate is the single check. The checks shared with public `/checkout` stay, but `is_admin()` now means `manage_options` instead of the `administrator` role, so a user the gate admits (e.g. a custom role granted `manage_options`) is never rejected by the endpoint.
- Coupons restricted to registered customers, guests, or excluding either, treat a signed-in shopper as registered even before their first order provisions a customer record. Today such a shopper applying a "registered customers only" coupon to their cart is told "Please login to use this coupon." while logged in.
- Cleanup found during this change: a duplicated checkout test, the dead storefront `customerApi` (it targets the admin `PUT /customers/{id}`), and an unused import in `OrderActivityApiTest`.
- This is a stop-gap. Fine-grained per-resource capabilities (e.g. `kecom_manage_orders`, a shop manager role) are a follow-up change and out of scope here.

## Capabilities

### New Capabilities
- `admin-api-access-control`: Which REST endpoints require a store administrator, which are available to logged-in customers, and which are public; that development/debug endpoints are not exposed; and that in-endpoint admin checks agree with the route gate.
- `coupon-customer-eligibility`: How a coupon's registered-customer / guest restrictions decide whether the shopper applying it counts as registered.

### Modified Capabilities
<!-- None: account-self-service and payment-webhook-authentication keep their current access rules. -->

## Impact

- `routes/api.php`: admin group middleware swap; `/test` and `/test-public` routes and their now-unused imports removed.
- `app/Http/Controllers/Api/TestController.php`: deleted.
- Integration tests: order tests that place orders as a non-admin via `POST /orders` (`OrderApiTest`, `OrderActivityApiTest`) move to `POST /checkout`; new tests cover `403` for non-admins on admin endpoints.
- No admin SPA change: it is only reachable by `manage_options` users (menu capability). The storefront bundle (`resources/site/`) calls only cart, checkout, shop and `/account/*` endpoints; its unused `resources/site/ts/api/customer.ts` and `ENDPOINTS.customer` are deleted.
- `app/Http/Requests/Order/OrderUpdateRequest.php`, `OrderActionRequest.php`, `app/Http/Controllers/Api/OrderController.php`: duplicate admin checks removed. `app/Wordpress/User.php`: `is_admin()` checks `manage_options` instead of the `administrator` role (used by `OrderCreateRequest`, `CheckoutController`, `BrandPolicy`). The follow-up capabilities change replaces it with per-resource capabilities.
- `app/DTO/Calculation/CalculationContextDTO.php`, `app/Services/DiscountService.php`: a cart's calculation context carries the cart owner's WordPress user ID, used by the registered/guest coupon rules.
- Third-party integrations calling admin endpoints with a non-`manage_options` account (e.g. via Application Passwords) will start receiving `403`.
