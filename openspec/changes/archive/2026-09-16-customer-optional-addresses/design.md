## Context

See proposal.md - Why. Three call sites currently pass two separate `CreateAddressDTO` params to `CreateCustomerAction::execute()`: `CreateOrderAction::resolve_checkout_customer_id()`, `CustomerController::create()`, and the `OrderApiTest` test helper `provision_customer_for_user()`. There is no DB uniqueness constraint on `is_default_shipping`/`is_default_billing` (`app/Services/AddressService.php`) — uniqueness is enforced entirely in application code via `AddressService::unset_current_default()`, which runs against a customer's *existing* addresses. A brand-new customer has none yet, so the default-resolution logic for this change only needs to reason about the addresses being created in this one call, not query existing rows.

## Goals / Non-Goals

**Goals:**
- Single-argument `execute(CreateCustomerDTO $customer_payload)`, addresses carried on the DTO.
- Deterministic, caller-order-independent-for-conflicts default resolution that never produces two `Address` rows for what should be one.
- No behavior change to `AddressService`, `Address` model, or the `address-book` capability - this change is scoped to customer creation only.

**Non-Goals:**
- Changing how addresses are managed after creation (the `/account/addresses` endpoints, `set_default`, delete-promotes-another logic) - untouched.
- Changing `sync_address()` in `CreateOrderAction` (the path that syncs an order's address into an *existing* customer's address book) - untouched, that method doesn't call `CreateCustomerAction` at all.

## Decisions

**Resolve defaults in memory before any insert, not via `AddressService::unset_current_default()`.**
Because the customer is new, there are no pre-existing `Address` rows to unset. Computing the shipping-winner and billing-winner up front and setting flags correctly on each `CreateAddressDTO` before calling `AddressService::create()` means every insert is already correct — no post-insert cleanup pass, no risk of a transient state where two rows are briefly both `is_default_shipping = true`.

**Resolution algorithm:** given `addresses: CreateAddressDTO[]`,
1. `shipping_winner` = first element with `is_default_shipping === true`, else `addresses[0]`.
2. `billing_winner` = first element with `is_default_billing === true`, else `addresses[0]`.
3. For each address in the list: set `is_default_shipping = (address === shipping_winner)`, `is_default_billing = (address === billing_winner)` — comparing by array index/identity, not by value, so two addresses with identical field content are still treated as distinct entries.
4. Insert each address once, in list order, with its resolved flags.

This means: one address supplied → both winners are the same element → one row, both flags true (satisfies "at least one default must exist"). Two addresses, no flags set → both winners default to `addresses[0]` → first address gets both flags, second gets neither (matches "first address is the default when the caller expresses no preference," an explicit design choice — see Open Questions for the alternative considered).

Alternative considered: reject/throw when multiple addresses claim the same default flag, forcing the caller to disambiguate. Rejected — checkout and admin-API callers should never construct genuinely ambiguous input given today's DTO-building code, but a silent, well-defined fallback (first match wins) is more robust than adding a new failure mode for something callers can't easily trigger deliberately, and keeps `CreateCustomerAction` usable with a single unflagged address without extra caller-side ceremony.

**`CreateOrderAction` builds one or two `CreateAddressDTO`s depending on `is_billing_same_as_shipping`, not always two.**
`resolve_billing_and_shipping_addresses()` already copies shipping fields onto billing fields when that flag is true, so today's two rows are content-identical duplicates. Building a single `CreateAddressDTO` with both default flags true in that case removes the duplicate row without changing any field values downstream (`$dto->shipping_id` and `$dto->billing_id` both resolve to that one address's id, same as `sync_address()` already does for the `is_billing_same_as_shipping` case on existing customers).

**`CustomerController::create()`** builds its `addresses` array the same way it builds the two DTOs today (from optional `shipping_address`/`billing_address` request keys), just collected into one list instead of passed as two params. No new request-shape validation is added beyond what already exists per-field on `CreateAddressDTO`.

## Risks / Trade-offs

- [Silent first-match-wins on conflicting default flags could mask a caller bug (e.g. a future caller accidentally marking every address `is_default_shipping: true`)] → Mitigated by test coverage asserting the exact winner in a conflict, and by all current callers only ever emitting DTOs from trusted internal construction (not directly from raw request booleans without going through the existing single-default request validation on `/account/addresses`, which is unchanged).
- [Callers relying on the old two-param signature will hit a fatal type error, not a deprecation path] → Acceptable: `CreateCustomerAction` has exactly three known call sites, all in this codebase and all updated in this same change.

## Migration Plan

No data migration. This only changes a PHP method signature and its call sites; no schema change, no existing `Address`/`Customer` rows are touched. Deploys as a normal code release.
