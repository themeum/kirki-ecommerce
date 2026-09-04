## 1. Database schema

- [x] 1.1 Create `database/migrations/AlterAddressesTableForAddressBook.php`: change `type` to accept `home`/`office`/`others`, add `is_default_shipping` and `is_default_billing` booleans (default false), make `email` nullable; backfill existing rows in the same `up()` (`type='billing'` → `type='home'`, `is_default_billing=1`; `type='shipping'` → `type='home'`, `is_default_shipping=1`) — note: `email` was already nullable at the DB level (`CreateAddressesTable` already declares `->nullable()`); the "make nullable" part of the original request is a validation-rule concern, handled in group 3, not a schema change here
- [x] 1.2 Create `database/migrations/DropIsBillingSameAsShippingFromCustomersTable.php`
- [x] 1.3 Create `database/migrations/DropIsBillingSameAsShippingFromOrdersTable.php`
- [x] 1.4 Run the migrations against a local/test database and confirm they apply cleanly — done via the group 5 integration test run against the isolated `kirki_ecommerce_test` DB (`RestTestCase::setUpBeforeClass()` runs `migrator()->fresh(); migrator()->run();` on every test class), not the live dev DB. Caught a missing step this task didn't originally list: migrations aren't filesystem-discovered — they must be registered in `config/migrations.php`'s ordered array. Added the three new migrations there, appended under the existing "Since v1.0.0-alpha.3" block (current plugin version). A fresh test DB has no legacy `billing`/`shipping` rows to exercise the backfill UPDATEs against, so backfill correctness rests on code review of the migration, not an observed data transformation
- [x] 1.5 Verify: `vendor/bin/phpcs` (run inside the `php` docker container, PHP 7.4, matching the project's target) — clean, no violations

## 2. Address type, model, and relations

- [x] 2.1 Update `app/Constants/AddressType.php`: remove `BILLING`/`SHIPPING`, add `HOME`, `OFFICE`, `OTHERS`
- [x] 2.2 Update `app/Models/Address.php`: add `is_default_shipping`/`is_default_billing` to `$fillable` and `$casts`
- [x] 2.3 Redefine `Customer::billing_address()`/`shipping_address()` in `app/Models/Customer.php` to filter by `is_default_billing`/`is_default_shipping` instead of `type`
- [x] 2.4 Verify: `vendor/bin/phpcs` — 0 errors (3 pre-existing-style warnings on `AddressType`'s constants having no visibility keyword, matching the file's prior convention, unchanged by this edit)

## 3. Address DTOs, requests, and service logic

- [x] 3.1 Update `app/DTO/Address/CreateAddressDTO.php` and `UpdateAddressDTO.php`: `type` becomes `home`/`office`/`others` with no default, add `is_default_shipping`/`is_default_billing` to Create only — see design.md's "Correction during implementation": Update does NOT carry these two fields (see 3.4)
- [x] 3.2 Delete `app/DTO/Account/UpdateAddressPayloadDTO.php`
- [x] 3.3 Create `app/Http/Requests/Account/AddressCreateRequest.php`: `type` required `in:home,office,others`; `first_name`/`address_line1`/`city`/`state`/`country`/`postal_code` required; `last_name`/`email`/`phone` nullable; `is_default_shipping`/`is_default_billing` nullable booleans
- [x] 3.4 Rewrite `app/Http/Requests/Account/AddressUpdateRequest.php` for the new per-address shape (drop all `is_billing_same_as_shipping` logic) — corrected during implementation to also drop `is_default_shipping`/`is_default_billing` from this request entirely (full-replace update would otherwise silently un-default an address whenever its details are edited without resending the flags; `set-default` is now the only path that changes default status)
- [x] 3.5 Create `app/Http/Requests/Account/SetDefaultAddressRequest.php`: `is_default_shipping`/`is_default_billing` nullable booleans, at least one required to be true
- [x] 3.6 In `app/Services/AddressService.php`, add `enforce_single_default()` (protected, transactional) called from `create()` and the new `set_default()` method; `update()` deliberately does not call it since it no longer touches default flags; added customer-scoped `all_for_customer()`/`find_for_customer()` methods for ownership checks
- [x] 3.7 Verify: `vendor/bin/phpcs` clean; `php -l` clean on all group 3 files. `composer test:unit` deferred to the group-7 checkpoint once the full unit-affecting surface (models/services) is in a consistent state

## 4. Address resource, controller, and routes

- [x] 4.1 Create `app/Resources/Address/AddressResource.php` returning the full address record (id, type, name, address fields, email, phone, `is_default_shipping`, `is_default_billing`, timestamps)
- [x] 4.2 Create `app/Http/Controllers/Api/Site/AddressController.php` implementing `index`, `show`, `store`, `update`, `destroy`, `set_default` — provisioning (via new `app/Actions/Account/CreateAccountAddressAction.php`, mirroring the old `UpdateAccountAddressesAction`'s pattern) happens only on `store`; the other four resolve the customer and 404 if none exists, then scope the address lookup by `customer_id` via `AddressService::find_for_customer()`
- [x] 4.3 Register the 6 new routes in `routes/api.php` under the existing `AuthMiddleware` account group: `GET/POST /account/addresses`, `GET/PUT/DELETE /account/addresses/{id}`, `PATCH /account/addresses/{id}/set-default`
- [x] 4.4 Remove `PUT /account/addresses` route, `AccountController::update_addresses`, and `app/Actions/Account/UpdateAccountAddressesAction.php`
- [x] 4.5 Verify: `vendor/bin/phpcs` and `php -l` clean on all group 4 files

## 5. Address integration tests

- [x] 5.1 Create `tests/Integration/AddressApiTest.php` covering: list/get/create/update/delete happy paths; unauthenticated rejection; accessing another customer's address returns not-found; invalid `type` and missing-required-field validation errors; `set-default` enforces at-most-one-default-per-purpose and leaves the other purpose's default unchanged; deleting a default address leaves that purpose with no default (no auto-promotion). Along the way, fixed a real bug: `CreateAccountAddressAction` provisioning a `Customer` from an address with no email failed (`customers.email` is `NOT NULL`) — now sources name/email from the WordPress user profile first (mirrors `CreateOrderAction::prepare_checkout_customer_dto()`'s existing pattern), falling back to the address
- [x] 5.2 Verify: `composer test:integration` (`bash kirki-test integration --filter=AddressApiTest`) — all 20 tests pass

## 6. Checkout address provisioning rework

- [x] 6.1 In `app/Actions/Order/CreateOrderAction.php`, updated `create_address()`, `update_address()`, and `prepare_checkout_address_dto()` to stop passing `AddressType::BILLING`/`SHIPPING` as the `type` column value — uses `AddressType::HOME` (create) or the existing address's own `type` (update, preserved rather than overwritten) and sets the matching `is_default_shipping`/`is_default_billing` flag; `'shipping'`/`'billing'` string literals are kept only as the `CreateOrderPayloadDTO` field-name prefix (renamed the param `$type` → `$purpose` for clarity)
- [x] 6.2 Update `tests/Integration/OrderApiTest.php` checkout-provisioning assertions for the new default-flag shape (`->where('type', AddressType::SHIPPING)` → `->where('is_default_shipping', true)`, etc.)
- [x] 6.3 Verify: `composer test:integration` — covered by the full-suite run in 8.3 (262/262 pass)

## 7. Remove is_billing_same_as_shipping from customers and orders

- [x] 7.1 Removed from `app/Models/Customer.php`, `app/Services/CustomerService.php` (`set_billing_same_as_shipping()`), `app/Resources/Customer/CustomerResource.php`
- [x] 7.2 Removed from `app/DTO/Customer/CreateCustomerDTO.php`, `UpdateCustomerDTO.php`, `app/Http/Requests/Customer/CustomerCreateRequest.php`, `CustomerUpdateRequest.php`, `app/Actions/Customer/CreateCustomerAction.php`, `UpdateCustomerAction.php`. These last two also had the same `AddressType::SHIPPING`/`BILLING`-as-column-value issue as `CreateOrderAction` (not originally called out under this task, found while fixing it) — `CreateCustomerAction` now creates both addresses as `type: home` with the matching default flag (defensively resetting *both* flags on each payload, since a caller could pass the same `CreateAddressDTO` instance for both parameters — a test helper does); `UpdateCustomerAction` preserves each address's existing `type` instead of overwriting it, matching `CreateOrderAction::update_address()`'s approach
- [x] 7.3 Removed from `app/Models/Order.php`, `app/Resources/Order/OrderResource.php`, `app/DTO/Order/CreateOrderDTO.php`, `CreateOrderPayloadDTO.php`, `UpdateOrderDTO.php`, `UpdateOrderPayloadDTO.php`
- [x] 7.4 Removed the copy-on-flag prefill logic from `app/Http/Requests/Order/OrderCreateRequest.php`, `OrderUpdateRequest.php`, `OrderCalculationeRequest.php`, and the corresponding branches in `app/Actions/Order/CreateOrderAction.php`/`UpdateOrderAction.php` (and their now-unused `Sanitizer` imports) — `billing_*` fields stay `required` and are used exactly as submitted
- [x] 7.5 Removed the customer-level `is_billing_same_as_shipping` line from `app/Hooks/Filters/PageInlineScript.php`; left the cart-level one untouched
- [x] 7.6 Updated `tests/Integration/CustomerApiTest.php`, `OrderApiTest.php`, `CouponApiTest.php` to drop `is_billing_same_as_shipping` expectations. Beyond the field itself: `CustomerCreateRequest`/`CustomerUpdateRequest`'s `billing_address` is now unconditionally `required` (was `required_if:is_billing_same_as_shipping,0`), so every test helper posting to `POST/PUT customers` needed an explicit `billing_address` block added (`customer_payload()` in `CustomerApiTest.php`, `create_coupon_test_customer()` in `CouponApiTest.php`, the inline payload in `OrderApiTest::create_customer()`) — they previously relied on the flag to skip it. Also removed `test_store_order_persists_billing_same_as_shipping` entirely (tested backend snapshot behavior that no longer exists) and rewrote `test_checkout_duplicates_billing_address_from_shipping_when_same` to assert the new contract: the backend does no copying, it just persists whatever billing fields were submitted
- [x] 7.7 Verify: `vendor/bin/phpcs` clean (auto-fixed 4 pre-existing/introduced whitespace and import-spacing violations via `phpcbf` in `UpdateCustomerAction.php`, `OrderCreateRequest.php`, `OrderUpdateRequest.php`); `composer test:integration` and `composer test:unit` — see 8.3

## 8. Final sweep

- [x] 8.1 Grepped for remaining `AddressType::BILLING`, `AddressType::SHIPPING`, `is_billing_same_as_shipping` outside the cart files. Found and fixed two more not in the original task list: `database/seeders/CustomerSeeder.php` (demo-data seeder, referenced both removed constants — rewrote to create one address with both default flags when shipping=billing instead of two duplicate rows, matching the new model) and `resources/views/site/account/parts/address-card.php` (storefront "My Addresses" view — swapped the removed constants for the literal `'shipping'`/`'billing'` strings it already used elsewhere in the same file for the same purpose-key purpose; this is a trivial constant-reference fix, not the larger JS/UX rework still flagged as a required follow-up in proposal.md)
- [x] 8.2 `openspec validate add-address-book-api --strict` — valid
- [x] 8.3 Verify: `composer test` (full suite) — **262/262 integration tests pass** (4968 assertions), **171/173 unit tests pass**. The 2 unit failures (`AvailabilityServiceTest::test_format_status_label_appends_variant_count_when_given` and the non-in-stock variant) are pre-existing and unrelated — a `<span>` HTML-escaping bug in variant stock-status label formatting, in a file this change never touches

## 9. Post-ship revision: set-default request shape

- [x] 9.1 Changed `PATCH /account/addresses/{id}/set-default` from two nullable booleans to a single required `purpose` field (`shipping`/`billing`) — new `app/Constants/AddressPurpose.php`, rewrote `SetDefaultAddressRequest`, `AddressController::set_default()`, `AddressService::set_default(int $id, string $purpose)`. See design.md's "Decision revision (post-ship)" for why.
- [x] 9.2 Updated `specs/address-book/spec.md`'s "Customer can set an address as the default address for one purpose" requirement and scenarios (dropped the "both at once" single-call scenario, added a two-calls scenario and an invalid-purpose scenario)
- [x] 9.3 Updated `tests/Integration/AddressApiTest.php`'s five `set_default` tests for the new shape (the "both at once" test now makes two calls; the "neither flag true" validation test became "invalid purpose")
- [x] 9.4 Updated `docs/ecommerce/account/set-default-address.yml` (Bruno) for the new request/response shape, using real responses captured against the local dev site
- [x] 9.5 Verify: `vendor/bin/phpcs` clean; `bash kirki-test integration --filter=AddressApiTest` — 20/20 pass
