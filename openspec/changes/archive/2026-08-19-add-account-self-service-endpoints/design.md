## Context

See proposal.md - Why. The existing customer/address stack is entirely admin-facing: `Api\CustomerController` operates on any customer by `{id}` under `AuthMiddleware` (any logged-in WP user — not `AdminMiddleware`), with no ownership check. `find_by_user_id(int $user_id)` already exists on `CustomerService` and is the established way to resolve "the `Customer` row for the currently logged-in WP user" (used today in `CreateOrderAction` for checkout provisioning). `AddressService::update()` already updates a single `Address` row by id and is reused as-is. The `addresses` table models exactly one billing + one shipping row per customer (`type` enum, no address-book support) — this change does not touch that schema. `Constants\Password::MIN_LENGTH` (8) exists but is currently unused anywhere in the codebase.

Storefront consumer: `resources/views/site/account.php` is a "Coming Soon" placeholder with no wiring yet — this change is API-only, no frontend work.

## Goals / Non-Goals

**Goals:**
- Three self-service endpoints, each scoped strictly to the authenticated user's own `Customer`/`Address`/WordPress-user records.
- Follow the established Request → DTO → Action → Service → Model stack for operations that genuinely orchestrate more than one service/model (profile update, address update); skip the Action/DTO layer for the single WP-core operation (password change) that doesn't need it.
- Reuse `CustomerService`/`AddressService`/`Customer`/`Address`/`CustomerResource` unchanged (`CustomerService` gains two new additive methods, see Decisions).

**Non-Goals:**
- No address-book / multi-address support — addresses stay a single shipping + single billing pair per customer.
- No auto-provisioning of a `Customer` row for a user who doesn't have one — per product decision, a user cannot reach the account page without already being a customer, so this is treated as a genuine error case, not a fallback.
- No frontend/storefront wiring.
- No fix to the existing dead `wp_update_user` sync branch in `CustomerService::update()` — noted below, left alone.
- Email is not editable through `/account/profile` at all — not deferred, explicitly out of scope.

## Decisions

**One `Site\AccountController` with three methods**, not three controllers. Mirrors `Api\CustomerController` grouping multiple actions on one resource ("the account"). `update_profile`, `change_password`, `update_addresses`.

**Identity resolution is uniform across all three endpoints**: `$customer = $customer_service->find_by_user_id(user()->get_id())`, throwing `NotFoundException` (same as the admin `CustomerService::find()` path) if none exists. No endpoint reads an `id` from the request body or URL — this is the core boundary that makes these "self-service" rather than a re-skin of the admin API.

**New, narrower DTO rather than reusing `UpdateCustomerDTO`, and only where an Action needs one.** `UpdateCustomerDTO` carries `id`, `tags`, `notes`, `is_billing_same_as_shipping` — all admin-only concerns that don't belong in a self-service payload. `app/DTO/Account/UpdateProfileDTO` covers only `first_name`, `last_name`, `phone` (no `email` — see Non-Goals — and no `display_name`, since `Customer` has no such column; mass-assigning it through `Customer::update()` would throw `MassAssignmentException`). Addresses reuse `App\DTO\Address\UpdateAddressDTO` directly. Password change takes `current_password`/`new_password` as plain scalar arguments — no DTO — since it's two primitives passed straight through to a service method, not a payload that needs shaping or persisting.

**Password change goes straight from the controller to a new `App\Services\UserService`, skipping the Action layer.** `Actions/` in this codebase are for orchestrating more than one service/model inside a transaction (see `CreateCustomerAction`, `UpdateCustomerAction`). Password change is a single WordPress-core operation (`wp_check_password` → `wp_set_password` → `wp_set_auth_cookie`) with no `Customer`/`Address` involvement, so it doesn't need one — `AccountController::change_password()` calls `UserService::update_password()` directly, matching how `CustomerController`'s simpler read/delete methods call `CustomerService` directly without an Action. `UserService` also gets `update_display_name()`, since that's the same category of concern (a `wp_users` column, not a `Customer` column).

**Profile update keeps its Action**, since it now orchestrates two things: the `Customer` row (via `CustomerService::update_profile()`) and the WordPress user's display name (via `UserService::update_display_name()`), both inside one `DB` transaction so a display-name failure rolls back the `Customer` change.

**Addresses keep their Action**, reworked to update one address type per call instead of both together — see the two requirements in specs/account-self-service/spec.md. `Actions/Account/UpdateAccountAddressesAction` branches on `type`: a shipping update goes straight to `AddressService::update()`; a billing update first calls the new `CustomerService::set_billing_same_as_shipping()`, then either copies the customer's current shipping `Address` (via `to_array()`) into the billing update payload (when the flag is true) or uses the submitted fields (when false) — both branches wrapped in one `DB` transaction.

**Password change re-issues the session.** `wp_set_password()` invalidates the current user's auth cookie as a side effect. `UserService::update_password()` calls `wp_set_auth_cookie($user_id)` immediately after a successful `wp_set_password()` so the requesting browser doesn't get logged out — standard self-service UX, confirmed with the user during exploration.

**Route placement.** New `Route::group(['middleware' => AuthMiddleware::class], ...)` for the three `/account/*` routes, placed with the other storefront (site) routes near `/cart` and `/checkout` at the bottom of `routes/api.php` — not inside the existing admin-dashboard `AuthMiddleware` group, which is a separate concern despite using the same middleware class.

## Correction during implementation

`CustomerService::update()` is strictly typed to `UpdateCustomerDTO`, and its `all()`/`to_array()` dumps every declared property on the DTO regardless of whether the caller set it. Passing the narrower `UpdateProfileDTO` through it isn't possible (type mismatch), and even a subclass would silently null out `tags`, `notes`, and `is_billing_same_as_shipping` on the `Customer` row (they're not present on `UpdateProfileDTO`, so they'd fall back to `UpdateCustomerDTO`'s unset defaults). Rather than force reuse of `update()`, added a small `CustomerService::update_profile(int $customer_id, UpdateProfileDTO $data)` method that only ever writes the profile fields — `update()` itself is untouched. `UpdateAccountProfileAction` calls this new method instead.

After the user reviewed the first implementation pass, the design changed in four ways, reflected throughout this document and in specs/account-self-service/spec.md: (1) password change moved from an `Actions/Account/ChangePasswordAction` + `ChangePasswordDTO` to `UserService::update_password()` called directly from the controller, no DTO; (2) email was removed entirely from profile update — it's no longer editable through this endpoint; (3) profile update gained a WordPress display-name field, updated via the new `UserService::update_display_name()`; (4) address update was reworked from "always update both shipping and billing together" to "update exactly one type per request," with a billing update also persisting `is_billing_same_as_shipping` onto the customer and conditionally mirroring the shipping address.

While re-verifying behavior after (4), found and fixed a real validation bug: `'is_billing_same_as_shipping' => 'nullable|boolean|required_if:type,billing'` doesn't work in this framework's validator — `nullable` unconditionally short-circuits the rest of that field's rule chain whenever the value is absent (it always runs first, regardless of declared order), so `required_if` never got a chance to run and a billing update with the flag omitted silently succeeded, defaulting it to `false`. Fixed by using `Rule::when($condition, ['required','boolean'], ['nullable','boolean'])` instead — evaluating the field's own required-ness from a closure rather than relying on `nullable`+`required_if` rule-chain ordering. The same pattern (`Rule::when` with a closure reading sibling fields) is also used for the address fields themselves, to express "required unless this is a billing update with `is_billing_same_as_shipping` true."

## Risks / Trade-offs

- **Address rows may not both exist**: today every `Customer` gets both a shipping and billing `Address` row created together (via `CreateCustomerAction`/checkout provisioning), so in practice both always exist once a `Customer` exists. `UpdateAccountAddressesAction` still needs a defensive `NotFoundException` (matching `UpdateCustomerAction`'s existing behavior) if either is somehow missing, rather than assuming.
- **`is_billing_same_as_shipping=true` freezes billing at the moment it's set, not going forward**: setting the flag true copies the shipping address into billing once. If the customer later updates their shipping address in a separate request without also re-submitting a billing update, the two addresses diverge even though the flag still reads true. This matches the admin `UpdateCustomerAction`'s existing behavior (which also only copies at write time, never establishes an ongoing link) and wasn't asked to be changed — noted here in case it surprises a future reader expecting `is_billing_same_as_shipping=true` to mean "always in sync."

## Migration Plan

Purely additive — new routes, new files. No migration, no rollback concerns beyond removing the new routes/files if reverted.
