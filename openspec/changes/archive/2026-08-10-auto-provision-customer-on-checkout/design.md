## Context

See proposal.md - Why. Relevant current state:

- `CreateOrderAction::execute()` already wraps order + order-item creation in a single `DB::begin_transaction()` / `commit()` / `rollback()` block (`app/Actions/Order/CreateOrderAction.php`).
- `OrderCreateRequest::prepare_for_validation()` already resolves `customer_id` to `customer()->get_customer_id() ?? 0` for the current user before validation runs, and already resolves full `shipping_*`/`billing_*` fields (falling back to the customer's stored addresses when a customer record exists). By the time `CreateOrderPayloadDTO` reaches `CreateOrderAction`, `$dto->customer_id` is `0` exactly when the authenticated user has no `Customer` row (or the request is a guest checkout).
- `CreateOrderPayloadDTO::$created_by` is set by `CheckoutController::store()` to `user()->get_id()` — the WP user ID of whoever is calling the endpoint. For a normal (non-admin-manual) checkout this is the same WP user that `customer()->get_customer_id()` resolved against, so it's a reliable "who is checking out" signal without adding a new field.
- `CreateOrderPayloadDTO::$is_manual` is true only when an admin explicitly submits `is_manual=1` (`OrderCreateRequest::authorize()` blocks non-admins from setting it). Admin-manual orders are for placing an order **on behalf of** someone else (an explicit `customer_id`, or none at all) - not a first-person checkout - so they're out of scope for auto-provisioning.
- `CreateCustomerAction::execute()` (used today only by the admin "add customer" screen) already does everything decision #3 needs structurally - creates a `Customer` plus shipping/billing `Address` rows in one transaction - except it always creates a brand-new WordPress user via `wp_insert_user()`. `CreateCustomerDTO` already has a `user_id` property, currently unused by `create_user()`.
- `CreateCustomersTable` (`database/migrations/CreateCustomersTable.php`) hasn't shipped in a release yet, so it can be edited in place - no separate upgrade migration or existing-installation data concern applies.
- `Connection::begin_transaction()`/`commit()`/`rollback()` are raw `START TRANSACTION`/`COMMIT`/`ROLLBACK` passthroughs with no savepoint or nesting support - starting a second transaction while one is already open will implicitly commit the first on MySQL.

## Goals / Non-Goals

**Goals:**
- Provision a `Customer` (+ addresses) for a self-checkout user atomically with their order, per proposal.md.
- Reuse `CreateCustomerAction`'s existing customer+address creation logic rather than duplicating it.

**Non-Goals:**
- Admin-manual orders (`is_manual = true`) are not affected - they keep working exactly as today, including explicit `customer_id` selection.
- No change to guest checkout, to `CustomerController`'s admin-facing endpoints, or to how existing customers' orders are linked.
- No change to the WordPress role granted to the linked user (still whatever `CreateCustomerAction` does today - unchanged, per proposal decision #5).

## Decisions

### D1: Trigger condition and location
Provisioning runs inside `CreateOrderAction::execute()`, inside the existing DB transaction, when all of:
- `$context->customer_id` is empty (no customer resolved for this request), **and**
- `!$dto->is_manual` (not an admin placing an order on someone else's behalf), **and**
- `$dto->created_by` is non-empty (the request is authenticated, not a guest).

This keeps guest checkout (`created_by` empty) and admin-manual orders untouched, and only fires for the "logged-in user with no customer record does their own checkout" case described in the proposal.

*Alternative considered*: gate on `customer()->is_admin()` to exclude admin self-checkout too. Rejected as unnecessary scope creep - an admin account checking out for itself with no customer record is still "an authenticated user with no customer record," and the spec doesn't distinguish by role.

### D2: Reuse `CreateCustomerAction`, but split its transaction from its logic
`CreateCustomerDTO::$user_id` already exists. `CreateCustomerAction::create_user()` is extended: if `$customer->user_id` is set, look the WordPress user up (`get_userdata`) and reuse that ID instead of calling `wp_insert_user()`; only fall back to creating a new WP user when `user_id` is empty (preserving today's admin "add customer" behavior unchanged).

Because the framework has no transaction nesting/savepoints, `CreateCustomerAction` cannot keep unconditionally opening its own `DB::begin_transaction()` when called from inside `CreateOrderAction`'s already-open transaction - doing so would implicitly commit the order's in-progress transaction partway through. `CreateCustomerAction::execute()` is split into the existing public method (unchanged signature and behavior, still owns its own transaction - used by `CustomerController`) and the actual create-customer-plus-addresses logic factored out so `CreateOrderAction` can invoke that logic directly, inside its own transaction, without a nested `begin_transaction()` call.

*Alternative considered*: let `CreateOrderAction` call `CreateCustomerAction::execute()` as-is and accept the nested transaction. Rejected - on MySQL this silently commits the customer/address rows independently of the order, which directly violates the atomicity requirement in specs/checkout-customer-provisioning/spec.md ("Customer provisioning and order creation are atomic").

### D3: Field sourcing priority (WP user profile, then billing fallback)
For each of first name / last name / email / phone: use the WordPress user's profile value (`get_userdata($user_id)`) when non-empty, otherwise use the corresponding `billing_*` field already present on `CreateOrderPayloadDTO` (which itself may already be sourced from a stored address or the checkout submission via `OrderCreateRequest`). Note WordPress core users have no native phone field, so phone will in practice always come from `billing_phone`.

### D4: Addresses sourced from the order request's resolved shipping/billing fields
Build the shipping and billing `CreateAddressDTO`s from `$dto`'s `shipping_*`/`billing_*` fields (already fully resolved with fallbacks by `OrderCreateRequest::prepare_for_validation()` before reaching the action), passing `is_billing_same_as_shipping` through the same way `CreateCustomerAction` already does for admin-created customers.

### D5: Unique index on `kirki_ecommerce_customers.user_id`
`CreateCustomersTable::up()` changes `$table->index('user_id')` to `$table->unique('user_id')` directly, since this table hasn't shipped in a release yet - there's no upgrade path to preserve and no existing installation's data to worry about. No separate migration, no raw SQL.

*Alternative considered*: a separate `ALTER TABLE` migration, run after `CreateCustomersTable`. Rejected once it was confirmed the table is unreleased - that approach exists only to avoid disrupting installations that already have the old schema, which doesn't apply here, and it added real complexity for nothing: `SchemaManager` has no alter-table API (only `create()`/`drop_if_exists()`), so it required raw `ALTER TABLE` statements; `user_id` also backs a foreign key, so InnoDB requires the replacement index to be added *before* the old one is dropped or the `DROP INDEX` is rejected; and the test suite's `Migrator::fresh()` calls every migration's `down()` in forward registration order (not reversed) even before `up()` has ever run, so an `ALTER TABLE` against a table that doesn't exist yet needed explicit existence guards. Declaring `unique()` inside the original `CREATE TABLE` sidesteps all three.

### D6: Concurrency - don't fail the order on a race
Two concurrent first-checkout requests for the same never-before-ordered user can both pass the "no customer exists yet" check before either commits. With the unique index (D5) as the backstop, the loser's `INSERT` fails with a duplicate-key error. `CreateOrderAction` catches specifically that condition and re-fetches the customer by `user_id` (now created by the winner) instead of letting the order fail - satisfying the spec's "every order from both requests that succeeds is linked to that single Customer record."

## Risks / Trade-offs

- **[Risk]** Splitting `CreateCustomerAction`'s transaction from its logic (D2) touches code the admin "add customer" flow depends on → **Mitigation**: the public `execute()` method's signature, transaction behavior, and return value stay identical for that caller; only a new internal seam is added for `CreateOrderAction` to call into.
- **[Trade-off]** Catching a duplicate-key error to recover (D6) is a narrower, more coupled error-handling path than a plain "insert and hope" → accepted because the alternative (letting the race fail one of the two orders) contradicts the spec's atomicity/uniqueness requirements together.

## Migration Plan

1. Ship the `CreateCustomersTable` unique-index change (D5) - no data migration, since the table hasn't shipped in a release yet.
2. Ship the `CreateCustomerAction`/`CreateCustomerDTO` changes (D2) - backward compatible, admin "add customer" flow unaffected.
3. Ship the `CreateOrderAction` provisioning logic (D1, D3, D4, D6).
4. No feature flag - behavior applies to all checkout requests immediately once deployed. Rollback is a straight code revert.
