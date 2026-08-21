## Why

Shoppers have no way to manage their own account after login — the storefront `/account` page is currently a "Coming Soon" placeholder with no backing API. The site needs self-service endpoints so a logged-in customer can update their profile, change their password, and update their shipping/billing addresses, without going through the admin dashboard's customer-management API (which operates on any customer by id and requires no ownership check).

## What Changes

- Add `PUT /account/profile` — update the authenticated customer's own name, phone, and WordPress display name. Email is not editable through this endpoint.
- Add `PUT /account/password-change` — change the authenticated user's WordPress password, verifying the current password first. The session is re-issued after a successful change so the requesting browser stays logged in.
- Add `PUT /account/addresses` — update the authenticated customer's shipping address or billing address, one type per request (discriminated by a `type` field). A billing update also carries an `is_billing_same_as_shipping` flag, persisted on the customer's own record; when true, the billing address is set to mirror the current shipping address instead of any submitted address fields.
- New `Site\AccountController` with three methods (`update_profile`, `change_password`, `update_addresses`), each resolving the current customer via the authenticated WordPress user — no `id` is ever accepted from the client.
- New `App\Services\UserService` for WordPress-user-level operations (password change, display name) — password change goes through this service directly from the controller rather than through an Action/DTO, since it's a single WP-core operation with no multi-service orchestration.
- New `Requests/Account/*`, `DTO/Account/*` (profile only — password change passes its two fields directly, no DTO), and `Actions/Account/*` classes, following the existing Customer/Address Request → DTO → Action → Service → Model stack where an Action is warranted (profile update and address update each touch more than one service/model).
- All three routes are grouped under `AuthMiddleware` (any logged-in WordPress user) in `routes/api.php`, alongside the other storefront (site) endpoints.

## Capabilities

### New Capabilities
- `account-self-service`: A logged-in customer can view-and-update their own profile, change their own password, and update their own shipping/billing addresses via dedicated `/account/*` endpoints, scoped strictly to their own record.

### Modified Capabilities
(none — no existing capability's requirements change)

## Impact

- **New routes**: `PUT /account/profile`, `PUT /account/password-change`, `PUT /account/addresses` in `routes/api.php`.
- **New files**: `app/Http/Controllers/Site/AccountController.php`; `app/Http/Requests/Account/{ProfileUpdateRequest,PasswordChangeRequest,AddressUpdateRequest}.php`; `app/DTO/Account/UpdateProfileDTO.php` (addresses reuse the existing `App\DTO\Address\UpdateAddressDTO`; password change takes no DTO); `app/Actions/Account/{UpdateAccountProfileAction,UpdateAccountAddressesAction}.php`; `app/Services/UserService.php`.
- **Extended**: `CustomerService` gains `update_profile()` (Customer-column-only update, avoids the mass-assignment/wipe risk of reusing `update()`'s `UpdateCustomerDTO` typing) and `set_billing_same_as_shipping()`.
- **Reused, unchanged**: `AddressService`, `Customer`/`Address` models, `CustomerResource`, `CustomerService::update()`, `Constants\Password::MIN_LENGTH`.
- **No schema/migration changes** — addresses stay one billing + one shipping row per customer, matching the current `kirki_ecommerce_addresses` table; `is_billing_same_as_shipping` already exists on `customers`.
- **No frontend work** — the storefront `resources/views/site/account.php` page and its future TS/Alpine wiring are out of scope; this change is API-only.
