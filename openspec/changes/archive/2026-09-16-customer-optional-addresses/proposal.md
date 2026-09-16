## Why

Since the address book (`address-book`) capability shipped, a customer can hold many addresses, so requiring exactly a shipping and a billing address at customer-creation time is no longer accurate to how addresses actually work. `CreateCustomerAction` still hard-requires two separate `CreateAddressDTO` params and always creates two `Address` rows (even duplicating fields when "billing same as shipping"), which blocks creating a customer with no address at all, no address yet (to be added at checkout), or a single address serving both defaults.

## What Changes

- **BREAKING**: `CreateCustomerAction::execute()` signature changes from `execute(CreateCustomerDTO, CreateAddressDTO $shipping, CreateAddressDTO $billing)` to `execute(CreateCustomerDTO)`. `CreateCustomerDTO` gains an `addresses` property (`CreateAddressDTO[]`, default `[]`).
- Customer creation no longer requires an address; `addresses` may be empty and the customer is created with no `Address` rows.
- When `addresses` are given, the action resolves which one is the default shipping address and which is the default billing address (honoring caller-supplied `is_default_shipping`/`is_default_billing` flags, falling back to the first address for any purpose left unclaimed) and persists accordingly:
  - the same address winning both purposes is persisted once, with both flags true — never duplicated into two rows
  - a purpose whose flag the caller set on more than one address resolves to a single winner (first match); every non-winning address has that flag forced false
  - when exactly one address is given, it always ends up default for both purposes
- `CreateOrderAction::resolve_checkout_customer_id()` and `CustomerController::create()` (the two current callers) are updated to build a single `addresses` array and call the new one-argument `execute()`.
- Checkout's "billing same as shipping" case now creates one `Address` row (both defaults on it) instead of two rows with duplicated field values.

## Capabilities

### New Capabilities
- `customer-address-provisioning`: `CreateCustomerAction`'s contract for creating a customer with zero or more addresses in one call, including how default-shipping/default-billing are resolved and deduplicated among the given addresses.

### Modified Capabilities
- `checkout-customer-provisioning`: the "Shipping and billing addresses are created for the new customer" requirement changes from always creating exactly two `Address` records to creating one record (both defaults) when billing matches shipping, or two when they differ — deferring the actual default-resolution mechanics to `customer-address-provisioning`.

## Impact

- `app/Actions/Customer/CreateCustomerAction.php` — signature and address-creation logic rewritten.
- `app/DTO/Customer/CreateCustomerDTO.php` — new `addresses` property.
- `app/Actions/Order/CreateOrderAction.php` — `resolve_checkout_customer_id()` updated to the new call shape.
- `app/Http/Controllers/Api/CustomerController.php` — `create()` updated to the new call shape; `shipping_address`/`billing_address` request fields become genuinely optional.
- `tests/Integration/OrderApiTest.php` — `provision_customer_for_user()` test helper updated to the new call shape.
- New test coverage for `CreateCustomerAction`'s default-resolution edge cases (no existing dedicated test file today).
