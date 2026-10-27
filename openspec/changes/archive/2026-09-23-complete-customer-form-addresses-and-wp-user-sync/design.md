## Context

See proposal.md - Why. Relevant current state:

- `CreateCustomerDTO` already has an `addresses` property (`CreateAddressDTO[]`, default `[]`) from the archived `2026-09-16-customer-optional-addresses` change, but `CustomerCreateRequest` never declares `addresses.*` validation rules, so it's unreachable from a real HTTP request today.
- `CreateCustomerAction::resolve_addresses()`/`find_default()` (first-match-wins default resolution) is already correct and already specified in `openspec/specs/customer-address-provisioning/spec.md` for the create path. This design reuses that exact algorithm for update reconciliation rather than inventing a second one.
- `customers.user_id` is nullable and has a **unique** DB index; `customers.email` has only a plain index, no uniqueness constraint. `CreateCustomersTable`'s own migration comment documents `user_id` NULL as the supported "guest customer" case.
- `UpdateCustomerDTO` has no `user_id` property today, so `CustomerService::update()`'s existing `wp_update_user()` call (guarded on `$data->user_id`) is dead code — it never runs.
- WordPress hook registration in this codebase goes through `BaseHook` subclasses (`get_name()`, `get_type()`, `handle(...$args)`) listed in `config/hooks.php`'s `'actions'`/`'filters'` arrays and resolved through the app's IoC container by `HookServiceProvider::boot()`. No existing `BaseHook` subclass in `app/` currently takes a constructor dependency.
- `app/Actions/Product/UpdateProductAction.php` already implements the same "diff submitted array against existing rows by id → delete missing → update-with-id → create-without-id" reconciliation this design needs for addresses, for product variants. This design follows that precedent rather than inventing a new one.
- The framework's custom request validator resolves `required_if`/`required_unless`'s target field against the *full request payload* (`deep_get()`), not the current wildcard row — so `addresses.*.label => required_if:addresses.*.type,others` would silently never fire. Confirmed by prior investigation in this codebase (see the `is_taxable` closure precedent in `SettingsUpdateRequest::get_shipping_settings_rules()`).

## Goals / Non-Goals

**Goals:**
- Make all three new-capability specs (`customer-wordpress-user-linking`, `customer-email-uniqueness`, `customer-wordpress-user-email-sync`) and the update-reconciliation spec (`customer-address-update-reconciliation`) true, end to end, for both the admin REST API and the customer-details/add-customer-dialog frontend.
- Unify customer create and update on the same `addresses[]` array shape, retiring `shipping_address`/`billing_address` for these two endpoints only.
- Keep `CreateCustomerAction`'s existing default-resolution algorithm and its spec (`customer-address-provisioning`) unchanged; only relocate it so update can reuse it.

**Non-Goals:**
- The account-facing address book (`/account/addresses`, `set_default`, delete-promotes-another) is untouched — this only affects the admin customer create/update endpoints.
- No change to guest checkout or `checkout-customer-provisioning`'s auto-provisioning flow.
- No database-level uniqueness enforcement on `customers.email` (see Decisions).
- No change to how an authenticated user's own account settings page updates their email (out of scope; this proposal is about the admin customer form).

## Decisions

### D1: No DB-level unique index on `customers.email`
Request-level `unique:` validation only (`customer-email-uniqueness` capability). A DB-level unique index would run as a migration against existing merchant databases on plugin upgrade, and could hard-fail on any site that already has two guest customers (or a guest + WordPress-linked customer) sharing an email — there's no safe automated de-dupe step available at migration time. The spec only needs the guarantee to hold going forward through this one admin endpoint, which a request-level rule satisfies.

*Alternative considered*: add the unique index and a companion data-migration to de-dupe first. Rejected as disproportionate — de-duping customer emails automatically risks merging or orphaning real records with no clear "correct" resolution, for a case with no evidence of existing collisions.

### D2: Email→WordPress-user lookup runs before the `create_wordpress_user` check
In `CreateCustomerAction::create_user()`, `get_user_by('email', ...)` is checked first, unconditionally; the `create_wordpress_user` flag only gates the fallback `wp_insert_user()` call. This makes the three `customer-wordpress-user-linking` scenarios compose correctly without special-casing: existing user → always attach; no user + flag true → create; no user + flag false → leave unlinked. It also makes the previous "duplicate email on `wp_insert_user()` surfaces as a 500" failure mode structurally unreachable, since `wp_insert_user()` is never called with an email WordPress already knows.

### D3: Update-time address reconciliation reuses `UpdateProductAction`'s existing pattern
`UpdateCustomerAction::execute()` changes from two fixed `UpdateAddressDTO` params to `array $addresses`. Reconciliation: diff the customer's current address IDs against the submitted list's IDs, bulk-delete what's missing, update items carrying an `id`, create items without one. This is a direct port of an already-working precedent in this codebase (`UpdateProductAction`'s variant handling), not a new pattern.

*Alternative considered*: keep the old two-fixed-address-params shape and only add a third "extra addresses" param. Rejected — it doesn't satisfy "addresses are optional" (case 6) or let a customer end up with zero, or more than two, addresses, which the spec requires.

### D4: Default-resolution algorithm is shared, not reimplemented, for update
`resolve_addresses()`/`find_default()` move from `CreateCustomerAction` into a new trait (`ResolvesAddressDefaults`), used by both actions. It runs across the *full* post-reconciliation address set (existing-and-kept, existing-and-updated, and newly-created) before any row is persisted, so exactly one winner exists per purpose — independent of whatever `AddressService::unset_current_default()` does as a write-time side effect. `AddressService::update_without_transaction()` already treats an explicit `false` on `is_default_shipping`/`is_default_billing` as "set false" (only `null` means "leave unchanged"), so forcing explicit booleans on every item, including ones merely being updated, composes correctly with no extra cleanup pass.

### D5: Two independent, one-directional sync hooks — no shared "sync" method
`profile_update` → `CustomerService::sync_email_from_wordpress_user()` writes only the customer's `email` column. `user_register` → `CustomerService::attach_wordpress_user()` writes only the customer's `user_id` column (and only when it was previously null). Neither calls back into `wp_update_user()` or any WordPress user-mutation function, and neither is implemented by routing through the general `CustomerService::update()`/`UpdateCustomerDTO` path (which frontend-disables `email` editing anyway) — this is what makes a sync loop between the two hooks structurally impossible, not just unlikely given the current UI.

*Alternative considered*: a single `CustomerService::sync_with_wordpress_user()` handling both directions based on which fields changed. Rejected — the two triggers (`profile_update` vs `user_register`) have different available data (an old/new email diff vs. a brand-new user with no prior customer link) and different write targets (`email` vs `user_id`); collapsing them into one method would need internal branching that two small, single-purpose methods avoid.

### D6: `attach_wordpress_user()` never overwrites an existing link
Guards on `empty($customer->user_id)` before writing. `user_register` fires for *every* new WordPress user (self-registration, another plugin, wp-admin "Add New User" — not just ones created through this plugin's own flows), so the guard is what keeps this safe as a blanket hook rather than one scoped to a specific creation path.

## Risks / Trade-offs

- **[No DB-level email uniqueness]** → A direct DB write, a different future endpoint, or a race between two concurrent admin requests could still produce duplicate customer emails. Accepted per D1; this is a deliberate scope boundary for this endpoint, not a guarantee about the `customers` table as a whole. It also means `CustomerService::find_by_email()` (used by `attach_wordpress_user()`) could match more than one row if duplicates already exist from before this change shipped — it takes the first, which could attach a new WordPress user to the "wrong" (but same-email) customer in that edge case.
- **[Hook constructor DI is unconfirmed]** → No existing `BaseHook` subclass in this codebase takes a constructor dependency yet. Mitigation: verify `HookServiceProvider`'s container resolution supports it before relying on it; fall back to `app(CustomerService::class)` inside `handle()` if not — either way the hook classes' public contract (`get_name()`/`get_type()`/`handle()`) is unaffected.
- **[`user_register` fires for every new WordPress user, not just plugin-created ones]** → Mitigated by D6's overwrite guard, but the *blast radius* (any new WP user whose email happens to match an existing unlinked customer gets silently attached) is a real behavioral surface change, not just an internal implementation detail — called out here explicitly rather than left implicit.
- **[Frontend default-checkbox mutual exclusivity]** → Checking "default shipping" on one address card unchecks it on every other card client-side, matching the backend's hard invariant (exactly one default per purpose) so the UI never visibly disagrees with what gets persisted. This is a UX decision the six cases don't dictate verbatim; flagged for a quick confirmation glance once built rather than treated as unambiguous.

## Migration Plan

No database migration. Deploy order:
1. Backend request/DTO/action/service/controller/resource changes land together — the new frontend payload shape (`addresses[]`, no singular `shipping_address`/`billing_address`) will 422 against the old backend, so there is no safe frontend-first deploy ordering.
2. The two WordPress hooks (`profile_update`, `user_register`) are independent of the rest of the backend slice and can land any time after `CustomerService::sync_email_from_wordpress_user()`/`attach_wordpress_user()` exist.
3. Frontend changes land after the backend slice is deployed and verified.

Rollback is a straight code revert in both directions — no data migration to undo.
