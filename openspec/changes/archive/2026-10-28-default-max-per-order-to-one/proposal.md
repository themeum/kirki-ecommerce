# Proposal

## Why

A variant can be saved with `has_limit_per_order = true` and `max_per_order = null`. Every server-side
check then reads the null as 0: `InventoryService::is_within_limit()` fails for any quantity,
`max_purchasable_quantity()` returns 0, and `OrderCalculationContextService` reports the limit as
exceeded. The shopper cannot add the item to the cart. The cart view disagrees with the server,
because `cart-item.php` skips the limit when the value is empty. Only `ProductUpdateRequest` and
`BulkUpdateVariantRequest` have a `required_if` rule (and its key probably does not resolve inside a
`variants.*` array). `ProductCreateRequest` and `UpdateVariantRequest` have no such rule.

A limit of 0 has no meaning for a merchant, so a checked limit must always carry a value of at least 1.

## What Changes

- When `has_limit_per_order` is true and `max_per_order` is null or less than 1, the variant is saved
  with `max_per_order = 1`. This runs in one place, the `Variant` model's save, so it covers product
  create and update, single variant update, bulk update, and duplication, including partial updates.
- When `has_limit_per_order` is false, `max_per_order` is left as sent. It may be null or any value.
  Every read path already checks the flag first.
- `max_per_order` validation becomes `integer|min:1|nullable` in all four variant request classes.
  The `required_if` and `gte:0` rules are removed.

## Capabilities

### New Capabilities

- `variant-per-order-limit`: how a variant's per-order limit is validated and stored (the flag, the
  minimum value, and the default of 1 when the flag is on).

### Modified Capabilities

<!-- None. cart-item-quantity-limits and product-inventory-card keep their requirements; the new
     capability guarantees the stored value they rely on. -->

## Impact

- Request classes: `ProductCreateRequest`, `ProductUpdateRequest`, `BulkUpdateVariantRequest`,
  `UpdateVariantRequest` (validation rule only).
- Model: `Variant` (normalize the value before it is saved).
- Tests for the normalization and the validation rule.
- No change to the read paths, the REST response shape, or the admin form.
