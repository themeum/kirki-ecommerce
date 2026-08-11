## Why

Several Eloquent-style model mutators (`set_{field}_attribute()`) in `app/Models/` compute a transformed value and `return` it instead of assigning it to `$this->attributes[$key]`. The framework's `Model::set_attribute()` (`libraries/framework/Database/Concerns/HasAttributes.php`) delegates entirely to a mutator when one exists — it never falls back to the declared cast and never auto-stores the mutator's return value. The result: assigning `array`/JSON values to these fields is silently swallowed on every `create`/`update`/`fill()` call. The row saves with the column untouched (`NULL` or its prior value), with no error or warning. Reads look correct because DB hydration bypasses mutators entirely (`set_raw_attributes()`), which is why this went unnoticed — the bug only shows up on write.

A related but separate case: `Order::set_flags_attribute()` has the identical `return`-instead-of-assign bug, but `flags` isn't cast as JSON — it's a comma-separated string with no cast entry to fall back on, so its fix is a code correction rather than a deletion.

Separately, four *other* mutators (`Product::additional_info`/`seo_keywords`, `Coupon::target_countries`/`combinations`) do assign correctly but duplicate logic already covered by the `'json'` cast declared in `$casts` for those same fields — now that we're establishing "let the cast own JSON encode/decode" as the pattern, these should be removed too, for consistency and to eliminate the maintenance duplication.

## What Changes

- Remove the broken JSON mutators and rely solely on each field's existing `'json'` cast for encode (write) and decode (read):
  - `Customer::set_tags_attribute` (`tags`)
  - `OrderItem::set_product_data_attribute` (`product_data`)
  - `OrderItem::set_tax_breakdown_attribute` (`tax_breakdown`)
  - `ProductSchema::set_schema_attribute` (`schema`)
- Remove the redundant-but-working JSON mutators, same reasoning (cast already does the identical `Arr::json_encode`):
  - `Product::set_additional_info_attribute` (`additional_info`)
  - `Product::set_seo_keywords_attribute` (`seo_keywords`)
  - `Coupon::set_target_countries_attribute` (`target_countries`)
  - `Coupon::set_combinations_attribute` (`combinations`)
- Fix `Order::set_flags_attribute` to assign its computed value to `$this->attributes['flags']` instead of returning it. **BREAKING** (bug fix): order flags will actually persist going forward, where previously they never did.
- Leave `Coupon::set_start_datetime_attribute` / `set_end_datetime_attribute` untouched — they perform timezone normalization (`to_utc()`), not JSON duplication, and have no cast to fall back on.
- **BREAKING (behavior delta)**: assigning an empty array (`[]`) to any of the eight affected JSON fields will now persist as the JSON string `"[]"` instead of `NULL` (the old mutators special-cased empty arrays to `NULL`; the bare `'json'` cast only skips encoding on an actual `null`). Both forms decode back to `[]` on read. Verification tasks below check for any code depending on `NULL` specifically for these columns.

## Capabilities

### New Capabilities

- `model-attribute-persistence`: defines the invariant that assigning a value to a model attribute (directly, via `fill()`, or via mass assignment) must result in that value being persisted to the database on save, for every field currently backed by a custom `set_*_attribute` mutator or a `'json'` cast.

### Modified Capabilities

(none — no existing spec covers this backend model layer)

## Impact

- **Code**: `app/Models/Customer.php`, `app/Models/OrderItem.php`, `app/Models/ProductSchema.php`, `app/Models/Product.php`, `app/Models/Coupon.php`, `app/Models/Order.php`.
- **Data**: any existing rows where `tags`, `product_data`, `tax_breakdown`, `schema`, or `flags` were supposed to hold data but are `NULL`/empty due to this bug were never persisted correctly in the first place — this change does not backfill them, it only fixes future writes. Worth flagging to the user separately if a data backfill is wanted.
- **Tests**: needs new/updated coverage confirming array/JSON values round-trip through `create`/`update` for each affected model, and that `Order::flags` persists correctly.
- **No API/frontend contract change** — this is purely a persistence-correctness fix; response shapes for these fields are unchanged (they already decoded correctly on read).
