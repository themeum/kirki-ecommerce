## Why

Today, `POST /checkout` treats every logged-in user identically to a guest whenever they don't yet have a `kirki_ecommerce_customers` row: the order is created with `customer_id = null` and no customer record is ever provisioned. This means a logged-in shopper's first order isn't linked to their WordPress account, so it won't show up in "my orders," repeat-customer reporting, saved addresses, etc. Guest checkout is intentionally fine as-is and must not be affected.

## What Changes

- `CreateOrderAction::execute()` provisions a `Customer` record (with billing/shipping addresses) for the authenticated user placing the order, when one doesn't already exist for their `user_id` — inside the same DB transaction as order creation, so the customer and the order succeed or fail together.
- Guest checkout (`user_id` absent) is untouched: no customer record is created, order continues to store guest contact/shipping/billing data as it does today.
- `CreateCustomerAction`/`CreateCustomerDTO` are extended to accept an existing `user_id`: when set, `create_user()` reuses that WordPress user instead of calling `wp_insert_user()` to create a new one. This lets checkout reuse the same action the admin "add customer" flow already uses, rather than duplicating customer+address creation logic.
- New customer's `first_name`/`last_name`/`email`/`phone` are sourced from the WordPress user profile first, falling back to the checkout request's billing fields for anything the WP profile doesn't have.
- Shipping and billing `Address` rows are created for the new customer from the checkout request's shipping/billing fields, mirroring what `CreateCustomerAction` already does for admin-created customers.
- `kirki_ecommerce_customers.user_id` gets a **unique** index (currently a plain index) to prevent duplicate customer rows from concurrent/duplicate checkout requests for the same user. `CreateCustomersTable`'s migration is edited in place, since this table hasn't shipped in a release yet — no upgrade path or existing-installation migration is needed.

## Capabilities

### New Capabilities
- `checkout-customer-provisioning`: auto-creating a linked `Customer` record (with addresses) for an authenticated checkout user who doesn't have one yet, while leaving guest checkout behavior unchanged.

### Modified Capabilities
(none — no existing capability spec covers checkout or customer creation today)

## Impact

- **Affected code**: `app/Actions/Order/CreateOrderAction.php`, `app/Actions/Customer/CreateCustomerAction.php`, `app/DTO/Customer/CreateCustomerDTO.php`, `database/migrations/CreateCustomersTable.php` (edited in place for the unique index).
- **Affected APIs**: `POST /checkout` — response shape unchanged, but the created order's `customer_id` will now be non-null for logged-in users on their first order, and a `Customer`/`Address` rows will now exist as a side effect.
- **Database**: unique index added on `kirki_ecommerce_customers.user_id`.
- **Not affected**: guest checkout, `CustomerController`'s existing admin-facing create/update endpoints (behavior for `user_id`-less payloads is unchanged).
