## 1. DTO changes

- [x] 1.1 Add `public $addresses = [];` (array of `CreateAddressDTO`) to `app/DTO/Customer/CreateCustomerDTO.php`

## 2. `CreateCustomerAction` rewrite

- [x] 2.1 Change `execute()` signature to `execute(CreateCustomerDTO $customer_payload)`, removing the two `CreateAddressDTO` params
- [x] 2.2 Implement default-shipping/default-billing resolution per design.md's algorithm: shipping winner = first address flagged `is_default_shipping`, else `addresses[0]`; billing winner = first address flagged `is_default_billing`, else `addresses[0]`; resolve by array identity, not value equality
- [x] 2.3 Force every non-winning address's `is_default_shipping`/`is_default_billing` to false before insert; force the winner's flag(s) true
- [x] 2.4 Skip address creation entirely when `addresses` is empty (no exception)
- [x] 2.5 Update the method's docblock to reflect the new signature and optional-address behavior

Note: the action no longer forces `type = AddressType::HOME` on every address (that was baked into the old two-param signature) - callers are now responsible for setting `type` on each `CreateAddressDTO` they build, same as the address-book endpoints already require. `CreateOrderAction::prepare_checkout_address_dto()` already does this; `CustomerController::create()` is updated in task 3.2 to do the same.

## 3. Update callers

- [x] 3.1 `CreateOrderAction::resolve_checkout_customer_id()`: build one `CreateCustomerDTO` with `addresses` populated from `prepare_checkout_address_dto(...)` — one entry (both default flags true) when `$dto->is_billing_same_as_shipping`, two entries otherwise — and call the new one-argument `execute()`
- [x] 3.2 `CustomerController::create()`: build the `addresses` array from the optional `shipping_address`/`billing_address` request fields (empty entries omitted) and call the new one-argument `execute()`. Also relaxed `CustomerCreateRequest::rules()` so `shipping_address`/`billing_address` are `nullable|array` instead of `required|array`, with their required subfields gated on the block being present via a `required_when_address_present()` closure helper (the framework's rule parser evaluates fixed dotted keys like `shipping_address.first_name` unconditionally, and its `nullable` rule short-circuits before a paired closure ever runs, so a closure-only rule was the only precedented way - see `consents` in `OrderCreateRequest` - to express "required only if the parent block was submitted")
- [x] 3.3 `tests/Integration/OrderApiTest.php`'s `provision_customer_for_user()` helper: update to the new one-argument `execute()` call shape. Also now sets `type = AddressType::HOME` explicitly on the address it builds, since the action no longer forces that itself (see note on task group 2) - preserves the row's prior field values exactly, and collapses what was previously 2 duplicate `Address` rows (same content, one per default purpose) into 1 row with both flags true, which none of this helper's 3 call sites assert a count against

## 4. Test coverage for `CreateCustomerAction`

- [x] 4.1 Created `tests/Integration/Actions/Customer/CreateCustomerActionTest.php`, extending `RestTestCase` (real WP + DB) since the action calls `wp_insert_user`/`get_userdata` and persists through Eloquent-like models - `tests/Unit/TestCase` mocks those away and can't exercise this action. No prior `app/Actions/Customer/` test existed to match; the one `tests/Unit/Actions/` precedent (`RecalculateCartActionTest`) is pure-calculation and doesn't touch WP/DB, so it wasn't a fit either.
- [x] 4.2 Test: customer created with `addresses = []` → customer persisted, zero `Address` rows
- [x] 4.3 Test: customer created with one address, no default flags set → that address is persisted once with both `is_default_shipping` and `is_default_billing` true
- [x] 4.4 Test: customer created with one address, only `is_default_shipping` true → persisted once with both flags forced true
- [x] 4.5 Test: customer created with two addresses, one flagged `is_default_shipping`, the other flagged `is_default_billing` → two `Address` rows, each with exactly one flag true
- [x] 4.6 Test: customer created with two addresses both flagged `is_default_shipping` true → first wins (`is_default_shipping` true), second persisted with `is_default_shipping` false
- [x] 4.7 Test: customer created with three addresses, one wins shipping, a different one wins billing, third wins neither → third address persisted with both flags false
- [x] 4.8 Test: customer created with two+ addresses, none flagged for either purpose → first address in the list wins both defaults

All 7 tests pass (23 assertions).

## 5. Update/extend caller-level tests

- [x] 5.1 Updated `tests/Integration/CustomerApiTest.php`: simplified `create_customer_without_addresses()` (previously created-then-deleted rows since the API always required an address; now just omits both blocks), added `test_create_customer_without_any_address_persists` and `test_create_customer_with_only_shipping_address_defaults_both_purposes`. All pass.
- [x] 5.2 Renamed `test_checkout_duplicates_billing_address_from_shipping_when_same` to `test_checkout_creates_single_address_when_billing_same_as_shipping`, added an explicit `assertCount(1, ...)`; added `test_checkout_creates_separate_addresses_when_billing_differs_from_shipping` asserting 2 distinct rows. Both pass.

## 6. Verification

- [x] 6.1 Ran `composer phpcs:wporg` against every changed file. One pre-existing violation found in `tests/Integration/OrderApiTest.php:188` (`date('y')` vs `gmdate()`) - outside every hunk this change touches, left alone per surgical-changes. All changed files are otherwise clean.
- [x] 6.2 Ran the full suite in Docker: Unit 275/275 pass; Integration 415 tests, 1 pre-existing failure (`SettingsApiTest::test_update_general_settings_persists_order_number_and_invoice_number_config`, unrelated to this change - confirmed it fails identically against the unmodified `dev` HEAD via `git stash`/`git stash pop`). Every Customer/Order/CreateCustomerAction test passes.
