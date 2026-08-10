## Why

Orders already persist `customer_email` and `customer_phone`, but there is no stored customer name — the admin order list currently fakes one by concatenating `shipping_first_name`/`shipping_last_name` on every read. Separately, `customer_email`/`customer_phone` have no fallback today: if a create-order request doesn't explicitly pass them, they're stored as `null` even when the order clearly has billing contact info attached. This change stores real `customer_first_name`/`customer_last_name` columns — matching the existing `shipping_first_name`/`shipping_last_name` and `billing_first_name`/`billing_last_name` pattern — and gives all four contact fields (`customer_first_name`, `customer_last_name`, `customer_email`, `customer_phone`) a consistent, snapshotted resolution: the placing WordPress user's profile if they have an account, else billing.

## What Changes

- Add `customer_first_name` and `customer_last_name` columns to `kirki_ecommerce_orders` (nullable strings), alongside the existing `customer_email`/`customer_phone`, matching the shape already used for `shipping_first_name`/`shipping_last_name` and `billing_first_name`/`billing_last_name`.
- At order creation, resolve `customer_first_name`, `customer_last_name`, `customer_email`, and `customer_phone` using the same two-tier priority for each: the authenticated placing user's WordPress profile (`first_name`/`last_name`, `user_email`, `phone` user meta) if they have an account, else the request's billing fields (`billing_first_name`/`billing_last_name`, `billing_email`, `billing_phone`). Guest checkouts (no WordPress user) always use billing. There is no request-level override — the create-order request itself no longer accepts `customer_first_name`/`customer_last_name`/`customer_email`/`customer_phone` as input.
- `OrderListResource`'s `customer_name` API field keeps its existing single-string shape (unchanged frontend contract), but is now built from the stored `customer_first_name`/`customer_last_name` columns instead of `shipping_first_name`/`shipping_last_name`. `customer_phone` is not added to the list API response — it stays out of scope since it isn't exposed there today.
- Scope is order creation only — `UpdateOrderAction`/`UpdateOrderPayloadDTO` are unchanged; updating an order does not re-resolve or overwrite these fields.
- No frontend changes — the admin React app isn't touched by this change.

## Capabilities

### New Capabilities
- `order-customer-contact`: Order creation resolves and persists `customer_first_name`, `customer_last_name`, `customer_email`, and `customer_phone` using a WordPress-user-first, billing-fallback priority (no request-level override), and the order list API's `customer_name` field is derived from the stored names instead of shipping.

### Modified Capabilities
(none — `checkout-customer-provisioning` covers the separate `Customer` entity provisioning flow and is not changing)

## Impact

- **Database**: `database/migrations/CreateOrdersTable.php` — add `customer_first_name`, `customer_last_name` columns (edited in place; this codebase has no prior schema and makes schema changes directly on the create migration rather than via alter migrations).
- **Models**: `app/Models/Order.php` — add `customer_first_name`, `customer_last_name` to `$fillable`.
- **DTOs**: `app/DTO/Order/CreateOrderDTO.php` — add `customer_first_name`, `customer_last_name` as resolved output fields. `CreateOrderPayloadDTO` is unchanged (no new input fields — `customer_first_name`/`customer_last_name`/`customer_email`/`customer_phone` are not request-accepted here).
- **Request validation**: `app/Http/Requests/Order/OrderCreateRequest.php` — no changes; these fields are not accepted as input.
- **Action**: `app/Actions/Order/CreateOrderAction.php` — new contact-resolution logic (WordPress profile, else billing) feeding `customer_first_name`/`customer_last_name`/`customer_email`/`customer_phone` into `CreateOrderDTO`.
- **Resource**: `app/Resources/Order/OrderListResource.php` — `resolve_customer_name()` reads `customer_first_name`/`customer_last_name` from the model instead of the shipping fields. Output shape (`customer_name` as one string) is unchanged.
- **Frontend**: none. `OrderListItemSchema` (`resources/app/schemas/catalog/order.ts`) already models `customer_name`/`customer_email` as nullish, so the switch in what backs `customer_name` is invisible to it.
