# Design

## Context

`CountryData::get_selling_countries()` already applies the all / selected / excluded setting and
returns the allowed countries, each with a `code`. It is used for the country dropdowns only.
`OrderCreateRequest` and `OrderUpdateRequest` check `shipping_country` and `billing_country` as
`required|string`. Both already use the `ValidatesAddressFields` trait, and `OrderCreateRequest`
already uses a closure rule (`consents`) that returns a message string or `true`.

Differences between the two requests:
- Create sends billing fields only when `is_billing_same_as_shipping` is false.
- Update always sends both countries.

## Goals / Non-Goals

**Goals:**
- One rule, one error message, used by both requests.
- The server is the source of truth, so a stale client cannot bypass it.

**Non-Goals:**
- No UI change: no disabled saved addresses, no warning in the picker.
- No cart-level validation. `CartUpdateRequest` is unchanged.
- No state-level check. Selling locations work on countries only.
- No change to the account address book. A shopper can still save any address.

## Decisions

**Closure rule in the shared trait.** Add a static helper to `ValidatesAddressFields` that returns
a closure rule. The closure returns a translated message when the value is not in the selling list,
else `true`. Both requests call it for `shipping_country`, and for `billing_country` where billing
is validated. This follows the `consents` closure and the existing `address_field_rule()` helper.
Alternative: a new named validator rule in the framework. Rejected: the framework package is not
edited, and one closure is enough.

**Match on the country `code`.** Compare the submitted value to the `code` of each entry from
`get_selling_countries()`, with a strict match. Alternative: a case-insensitive match. Rejected:
the dropdown and stored addresses use the dataset's own codes.

**Create: billing checked only when separate.** When billing is the same as shipping, the billing
fields are copied from shipping after validation, so the shipping check covers both. This reuses
the `billing_address_field_rule()` shortcut in `OrderCreateRequest`.

**Update: always validate, no changed-only exemption.** The user chose to always validate. An
order whose stored country is no longer sold cannot be saved until the address is fixed.
Alternative: validate only when the country differs from the stored one. Rejected by the user.

**No admin bypass.** The rule ignores `is_manual` and admin status.

**Empty value.** An empty country is left to the existing `required` rule. The new rule does not
add a second message for it.

## Risks / Trade-offs

- [Old order cannot be edited after the selling locations shrink] -> Accepted by choice. The error
  names the country field, so the admin can correct the address in the same form.
- [Selling list is cached for the request in a static property] -> Settings are read per request,
  so a changed setting applies on the next request. No extra step is needed.
- [A shopper reaches the error only at submit, after filling the form] -> Accepted. The UI is out
  of scope for this change.
