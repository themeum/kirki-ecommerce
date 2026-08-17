## Why

Merchants recreating a similar product today have to re-enter every field, media reference, category/tag/collection assignment, and variant by hand. There is already a proven pattern for this in the codebase (`DuplicateCouponAction` + `CouponController::action()`) — products need the equivalent so a new product can be started from an existing one instead of from scratch.

## What Changes

- Add `PATCH /products/{id}/action` to `ProductController`, dispatching on an `action` field (mirrors `CouponController::action()` / `OrderController::action()`), with `duplicate` as the only case for now.
- Add `DuplicateProductAction` (`app/Actions/Product/`) that loads a product with its full relation set and delegates to the existing `CreateProductAction` to persist the copy — no new persistence logic, no changes to `CreateProductAction` itself.
- The duplicate is built by copying every scalar product field, remapping relation fields (`media`, `categories`, `tags`, `collections`) to id arrays, and reconstructing the `attributes` payload shape (`[{id, values}]`) from the product's loaded `attribute_values`, grouped by `attribute_id`.
- Title is suffixed with `" - Copy"`; slug is left to `ProductService::create()`'s existing auto-uniquing.
- Status is always reset to `ProductStatus::DRAFT`, regardless of the source product's status.
- Each variant is copied with: `sku` set to `null` (isolated in a single method so it's easy to change later — e.g. to a generated/suffixed SKU), `available_quantity` reset to `0`, `in_stock` reset to `false`, `committed_quantity` reset to `0`. All other variant fields (price, weight, shipping/tax profile, attribute values, barcode, `is_default`, etc.) are copied as-is.

## Capabilities

### New Capabilities
- `product-duplication`: duplicating an existing product (with its variants and associations) into a new draft product via the products API.

### Modified Capabilities
(none — this only adds a new action to the existing products API surface, it doesn't change how create/update/list/delete behave)

## Impact

- `app/Http/Controllers/Api/ProductController.php` — new `action()` method.
- `routes/api.php` — new `PATCH /products/{id}/action` route.
- `app/Actions/Product/DuplicateProductAction.php` — new file.
- Possibly a new lightweight request class for the `action` field, or reuse of the existing `Request` contract with inline validation (matches how `CouponController::action()`/`OrderController::action()` currently validate their `action`/`id` inputs — to be confirmed in design).
- No database schema changes — `sku` is already `nullable` at the DB level (`kirki_ecommerce_variants.sku`), so duplicated variants with a `null` sku are valid as-is.
- No frontend changes in this proposal (backend endpoint only).
