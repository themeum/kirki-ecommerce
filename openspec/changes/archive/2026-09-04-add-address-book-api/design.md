## Context

See [proposal.md](proposal.md) for motivation. Today `Address::type` is a two-value enum (`billing`/`shipping`) and `Customer::billing_address()`/`shipping_address()` are `has_one` relations filtered by that column — a customer can have at most one of each. That singleton assumption is baked into more than the account endpoints being replaced here: `CustomerService` (5 eager-load call sites), `CartService::get_cart()`, the storefront "My Addresses" view, and — most deeply — `CreateOrderAction::resolve_checkout_customer_id()`, which literally passes `AddressType::BILLING`/`AddressType::SHIPPING` as the `type` value when creating or updating a customer's checkout addresses. `is_billing_same_as_shipping` is persisted independently on three tables (`customers`, `orders`, `carts`) with three different consumers; only the `carts` one is staying.

## Goals / Non-Goals

**Goals:**
- Replace the `type`-as-purpose model with `type`-as-kind (`home`/`office`/`others`) plus independent `is_default_shipping`/`is_default_billing` flags.
- Ship a complete, ownership-scoped CRUD + set-default API for the address book.
- Remove `is_billing_same_as_shipping` from `customers`/`orders` and every backend consumer, without touching `carts`.
- Keep every existing reader of "the customer's shipping/billing address" (`CustomerService`, `CartService`, the storefront addresses view, `CreateOrderAction`) working by redefining the underlying relations rather than rewriting each call site.

**Non-Goals:**
- Frontend changes (storefront `checkout.ts`, admin order-create dialogs, admin customer-details `billing-address.tsx`) — flagged in the proposal as a required follow-up, not part of this change's tasks. This change does not need them to compile or pass its own tests, but checkout/admin order creation will functionally break in production until that follow-up lands — sequence accordingly.
- Changing how checkout selects which address to use (still raw form fields per order, not "pick an address_id from your book"). Out of scope — not requested.
- Auto-promoting a new default when a default address is deleted (spec explicitly says: leave that purpose with no default).

## Decisions

### Migrations: three separate files, one per table
Following this repo's existing pattern of one alteration per table per migration (`AddIsDefaultToTaxProfilesTable`, `AlterAddressesTypeColumnToString`):
1. `AlterAddressesTableForAddressBook` — changes `type`'s allowed values, adds `is_default_shipping`/`is_default_billing` (boolean, default false), makes `email` nullable. Backfill in the same `up()`, after the column changes: `UPDATE ... SET type='home', is_default_billing=1 WHERE type='billing'` and the shipping equivalent.
2. `DropIsBillingSameAsShippingFromCustomersTable`
3. `DropIsBillingSameAsShippingFromOrdersTable`

Kept separate rather than one migration touching three tables, matching how every existing migration in `database/migrations/` scopes to a single table — makes each one independently revertible.

`down()` on migration 1 can't be fully general (multiple `home` addresses could exist by the time of a rollback), but mirrors `AlterAddressesTypeColumnToString::down()`'s existing precedent of a best-effort reverse (revert the column shapes; leave data as-is rather than attempting a lossy reverse-backfill).

### Default-uniqueness enforcement lives in `AddressService`, not the database
No unique index (partial/filtered unique indexes aren't used elsewhere in this schema layer, and the framework's `Structure` builder wasn't seen supporting one). `AddressService` gets a protected helper that, inside the same transaction as a create/update/set-default, unsets `is_default_shipping`/`is_default_billing` on every other address for that customer before writing the new value — mirroring the transactional pattern `UpdateAccountAddressesAction` already uses via `DB::begin_transaction()`/`commit()`/`rollback()`.

### New request/DTO shapes
- `AddressCreateRequest`: `type` required, `in:home,office,others`; `first_name`, `address_line1`, `city`, `state`, `country`, `postal_code` required; `last_name`, `email`, `phone` nullable; `is_default_shipping`, `is_default_billing` nullable booleans defaulting false.
- `AddressUpdateRequest` (new shape, replacing the old `AddressUpdateRequest`): same fields as create, minus `is_default_shipping`/`is_default_billing`. No `is_billing_same_as_shipping` field either.

**Correction during implementation**: the original plan had `AddressUpdateRequest` accept `is_default_shipping`/`is_default_billing` too, mirroring create. Dropped that once writing `UpdateAddressDTO` made the problem concrete: this codebase's established DTO pattern (see `UpdateTaxProfileDTO::$is_default = false`) is a full-replace on every field via `$model->update($dto->to_array())` — an omitted boolean in the request falls back to the DTO's declared default, not "leave unchanged". Applied to addresses, that would mean editing an address's city without resending `is_default_billing: true` silently un-defaults it. `set-default` is the only path that can change default status; `PUT /account/addresses/{id}` no longer accepts those two fields at all.
- `SetDefaultAddressRequest`: `purpose` required, `in:shipping,billing` (new `AddressPurpose` constant).
- `CreateAddressDTO`/`UpdateAddressDTO` gain `is_default_shipping`/`is_default_billing`; `type` default changes from `AddressType::BILLING` to nothing (always explicit).
- `UpdateAddressPayloadDTO` is deleted outright (only consumer, `UpdateAccountAddressesAction`, is deleted).

**Decision revision (post-ship)**: `SetDefaultAddressRequest` originally took two nullable booleans (`is_default_shipping`/`is_default_billing`, at least one required truthy via a `Rule::when()` conditional). Changed to a single required `purpose` field after review — the two-boolean shape only existed to support setting both purposes in one call, which added an awkward "at least one must be true" validation rule for a capability most consumers don't need (most address-book UIs expose "set as default shipping" / "set as default billing" as two separate actions anyway). `AddressService::set_default(int $id, string $purpose)` now sets one purpose per call; setting an address as default for both is two calls instead of one atomic one — an accepted trade-off (see Risks). `AddressResource`'s output shape (`is_default_shipping`/`is_default_billing` booleans) is unchanged — this only affects the `set-default` request shape.

### `AddressController` under `Api/Site`, same auth group as the rest of `/account/*`
New controller alongside `Api/Site/AccountController`, registered in the existing `Route::group(['middleware' => AuthMiddleware::class], ...)` block in `routes/api.php`. `AddressService` already has all the CRUD primitives (`all`, `find`, `create`, `update`, `delete`) from its admin-oriented design — this is its first real controller. Ownership scoping (a customer can only see/touch their own addresses) is enforced in the controller/action layer by filtering on the resolved `customer_id`, not by trusting the path id alone.

### `Customer::billing_address()`/`shipping_address()` redefined by default flags
```php
public function billing_address()
{
    return $this->has_one(Address::class, 'customer_id', 'id')->where('is_default_billing', true);
}
```
Same shape for `shipping_address()` with `is_default_shipping`. This is a two-line change per relation and every existing reader (`CustomerService`, `CartService`, `CustomerResource`, the storefront addresses view, `CreateOrderAction`) keeps working unmodified against the relation, since none of them reach into `type` directly except `CreateOrderAction`.

### `CreateOrderAction` stops using `AddressType::BILLING`/`SHIPPING` as a `type` value
`create_address()`/`update_address()`/`prepare_checkout_address_dto()` currently pass `AddressType::BILLING`/`SHIPPING` both as the `type` column value and as the `{prefix}_*` field-name prefix on `CreateOrderPayloadDTO` (e.g. `shipping_first_name`). These are two different concerns that happened to share a value. Split them: keep the string literals `'shipping'`/`'billing'` as the field-prefix (unrelated to the `Address.type` column), and pass `AddressType::HOME` (or omit `type` and let the DTO/model default apply) plus the correct `is_default_shipping`/`is_default_billing` flag when creating/updating. `$customer->{$type . '_address'}` lookups in `update_address()` are unaffected since they go through the relations, which are now flag-based.

### `is_billing_same_as_shipping` removal is a pure subtraction, not a replacement
No new mechanism replaces it on `customers`/`orders` — the value simply isn't computed or stored server-side anymore. `OrderCreateRequest`/`OrderUpdateRequest` stop pre-filling `billing_*` from `shipping_*`; they validate whatever `billing_*` fields the request actually submitted (still `required`, unchanged). This is what makes the frontend follow-up necessary (see Non-Goals).

**Correction during implementation**: `CreateCustomerAction`/`UpdateCustomerAction` (the admin `CustomerController`'s create/update flow) turned out to have the exact same `AddressType::SHIPPING`/`BILLING`-as-column-value and `is_billing_same_as_shipping`-branching pattern as `CreateOrderAction` — not called out separately in the original plan, but fixed the same way: `type: home` + the matching default flag, no more flag-driven duplication branch. `CreateCustomerAction` additionally sets *both* flags explicitly on each address payload (not just the one being claimed), because a caller can legally pass the same `CreateAddressDTO` instance for both the shipping and billing parameters (a test helper does exactly this) — without the explicit reset, the second `is_default_billing = true` mutation would leave the first payload's `is_default_shipping` still `true` on the same shared object, producing a row that wrongly claims both.

**Correction during implementation**: provisioning a `Customer` from an address with no email (now legal, since address `email` is nullable) failed `customers.email NOT NULL` in `CreateAccountAddressAction`. Fixed by sourcing the customer's name/email/phone from the WordPress user profile first, falling back to the address — the same fallback order `CreateOrderAction::prepare_checkout_customer_dto()` already uses for checkout provisioning, applied here for consistency.

**Correction during implementation**: two more files referenced the removed `AddressType::BILLING`/`SHIPPING` constants, not on the original file list because they surfaced only via a full-codebase grep, not from tracing the model/service layer: `database/seeders/CustomerSeeder.php` (demo data — rewritten to create one address with both default flags when shipping equals billing, instead of the old two-duplicate-rows approach, since that's what the new model actually calls for) and `resources/views/site/account/parts/address-card.php` (storefront view — swapped the constants for the literal `'shipping'`/`'billing'` strings the file already used elsewhere for the same purpose-key comparison; a mechanical one-line-equivalent fix, not the larger JS rework the storefront address form still needs, which stays a Non-Goal here).

**Correction during implementation**: migrations in this codebase are not filesystem-discovered — `config/migrations.php` holds an explicit, ordered `use` + array list, and a new migration file does nothing until it's registered there. Not in the original task breakdown; added the three new migrations to the existing "Since v1.0.0-alpha.3" block (current plugin version, per `kirki-ecommerce.php`).

## Risks / Trade-offs

- **[Risk]** Checkout and admin order/customer forms will fail billing validation the moment this ships, until the flagged frontend follow-up lands (no backend fallback exists once the copy logic is removed). → **Mitigation**: called out explicitly in the proposal's Impact section as a required, not-optional follow-up; sequence the frontend follow-up to land no later than this change in the actual release.
- **[Risk]** The address-book migration's backfill is a one-way data transformation (`billing`/`shipping` type values are gone after `up()` runs); a rollback after real address-book usage has begun (new `home`/`office`/`others` addresses created) can't cleanly restore the old one-per-type model. → **Mitigation**: accepted, consistent with `AlterAddressesTypeColumnToString`'s existing precedent of a non-lossless `down()`; this is a forward migration in practice.
- **[Risk]** `AddressService::create()`/`update()` now need to run the "unset other defaults" step inside every write path that can set a default flag (create, update, and the dedicated set-default endpoint), not just the dedicated endpoint — easy to miss one and end up with two defaults for the same purpose. → **Mitigation**: put the enforcement in one protected helper method called from all three write paths, not duplicated per-endpoint.
- **[Risk]** Setting one address as default for both shipping and billing now takes two separate `set-default` calls instead of one atomic request — a client could apply the first and fail before the second (network error, page navigation), leaving the address default for only one purpose. → **Mitigation**: accepted; each individual call is still atomic and leaves the address book in a valid state either way (no partial/corrupt row), so the worst case is "try again," not data corruption.

## Migration Plan

1. Ship migration 1 (`AlterAddressesTableForAddressBook`) — additive plus backfill, safe to run ahead of code deploy since old code only ever reads/writes `type: billing/shipping`, which still validates as a string until the enum constraint changes.
2. Deploy the backend code (new endpoints, redefined relations, `CreateOrderAction` changes) — from this point, checkout/admin order and customer forms are broken until the frontend follow-up ships, per the risk above.
3. Ship migrations 2 and 3 (drop `is_billing_same_as_shipping` from `customers`/`orders`) after the code deploy, since the column drop is safe only once nothing writes to it.
4. Land the frontend follow-up (separate change) before or immediately alongside step 2 in the actual release train, to avoid a broken-checkout window.
