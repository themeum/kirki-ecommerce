## Why

Customers can currently save only one shipping address and one billing address, discriminated by an address `type` column that is hardcoded to `shipping`/`billing`. There's no way for a shopper to keep multiple addresses (home, office, a parents' place) and pick which one ships or bills an order. We're replacing the single-address-per-purpose model with a real address book: any number of addresses per customer, each tagged by kind (`home`/`office`/`others`), with independent `is_default_shipping`/`is_default_billing` flags marking which one is used for each purpose. Alongside this, the `is_billing_same_as_shipping` flag persisted on customers and orders no longer has a coherent meaning once a customer can have many addresses — it's being removed from the backend everywhere except the cart, which already needs it purely to restore the checkout "same as shipping" checkbox on page reload.

## What Changes

- **BREAKING**: `kirki_ecommerce_addresses.type` no longer accepts `billing`/`shipping` — only `home`/`office`/`others`. A migration backfills existing rows (`billing`→`home` + `is_default_billing=true`, `shipping`→`home` + `is_default_shipping=true`).
- Add `is_default_shipping` and `is_default_billing` boolean columns to `kirki_ecommerce_addresses`. At most one address per customer can be `is_default_shipping=true`, and independently at most one can be `is_default_billing=true` (a single address can be both at once). Enforced by unsetting the flag on every other address of that customer whenever it's set, in a transaction.
- Make `email` and `phone` on addresses nullable (`phone` already is; `email` becomes optional).
- New self-service address-book endpoints under `/account/addresses`, all scoped to the authenticated customer's own records:
  - `GET /account/addresses` — list
  - `GET /account/addresses/{id}` — single
  - `POST /account/addresses` — create
  - `PUT /account/addresses/{id}` — update
  - `DELETE /account/addresses/{id}` — delete
  - `PATCH /account/addresses/{id}/set-default` — set as default shipping and/or billing
- New `AddressResource` returned by all of the above (full address record), replacing the old pattern of returning the whole `CustomerResource` for an address change.
- **BREAKING**: Remove `PUT /account/addresses` (the old single-address-type update endpoint), `AddressUpdateRequest`'s old shape, `UpdateAccountAddressesAction`, and `UpdateAddressPayloadDTO`.
- `Customer::billing_address()`/`shipping_address()` relations redefined to filter by `is_default_billing`/`is_default_shipping` instead of `type`.
- **BREAKING**: Remove `is_billing_same_as_shipping` entirely from `customers` and `orders` (columns, models, resources, DTOs, requests, actions, `CustomerService::set_billing_same_as_shipping()`). It stays untouched on `carts` — `CartUpdateRequest`/`CartResource` already handle it correctly for reload-restore of the checkout checkbox and need no changes.
- `CreateOrderAction`'s checkout-time address provisioning stops writing `type: billing`/`type: shipping`; it creates/updates addresses with the new default flags instead.

## Capabilities

### New Capabilities
- `address-book`: Self-service CRUD and default-address management for a customer's address book (list/get/create/update/delete/set-default), scoped to the authenticated customer.

### Modified Capabilities
- `account-self-service`: Replaces the "update one address at a time by type" requirement and the "billing update also sets is_billing_same_as_shipping" requirement with the new address-book endpoints; `PUT /account/addresses` and its `is_billing_same_as_shipping` behavior are removed.
- `checkout-customer-provisioning`: Address auto-provisioning during checkout now creates addresses tagged `home` with the appropriate `is_default_shipping`/`is_default_billing` flag instead of `type: shipping`/`type: billing`; billing-mirrors-shipping duplication is no longer a server-side branch driven by a persisted flag — the request's submitted billing fields are used as-is (the shopper's checkout UI is responsible for populating them to mirror shipping when they choose that).

## Impact

- **DB**: new migration on `kirki_ecommerce_addresses` (type values, two new columns, nullable email); migrations dropping `is_billing_same_as_shipping` from `kirki_ecommerce_customers` and `kirki_ecommerce_orders`.
- **Backend**: `AddressType` constants, `Address`/`Customer`/`Order` models, `AddressService`, `CustomerService`, new `Address{Create,Update}Request` + `SetDefaultAddressRequest`, new `AddressController`, `AddressResource`, `CreateOrderAction`/`UpdateOrderAction`, `OrderCreateRequest`/`OrderUpdateRequest`/`OrderCalculationeRequest`, `CustomerCreateRequest`/`CustomerUpdateRequest`, `Create/UpdateCustomerAction`, `Create/UpdateOrderDTO`, `Create/UpdateCustomerDTO`, `CustomerResource`, `OrderResource`, `PageInlineScript`, `routes/api.php`.
- **Frontend (flagged as a required follow-up, not covered by this change)**: storefront `checkout.ts` and the admin order-create dialogs / customer-details `billing-address.tsx` currently rely on the backend to copy shipping fields into billing fields when "same as shipping" is checked. Once that backend behavior is removed, those forms must do the copy client-side before submitting, or billing validation on order/customer creation will fail. This needs to land no later than this change, since it's a functional break otherwise.
- **Tests**: `tests/Integration/CustomerApiTest.php`, `tests/Integration/OrderApiTest.php`, `tests/Integration/CouponApiTest.php` reference `is_billing_same_as_shipping` and the old address `type` values — need updating.
