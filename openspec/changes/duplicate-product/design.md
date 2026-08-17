## Context

See proposal.md - Why/What Changes for motivation and scope.

Two existing precedents shape this design:
- `DuplicateCouponAction` (`app/Actions/Coupon/`) + `CouponController::action()` — the same "duplicate an entity via a generic `{id}/action` endpoint" shape, already built once.
- `CreateProductAction` (`app/Actions/Product/`) — already owns the transactional product+variants creation flow (`CreateProductDTO` + `CreateVariantDTO[]`) and must not be modified; duplication should produce the same two inputs and hand off to it unchanged.

The one thing that makes `Product` harder than `Coupon` to duplicate: `CreateCouponDTO`'s relation fields (`category_ids`, `customer_ids`, `product_ids`) are named *differently* from `Coupon`'s relation accessors (`categories`, `customers`, `products`), so `DuplicateCouponAction` can safely do `CreateCouponDTO::from_array($coupon->to_array())` and then overwrite just the relation fields. `CreateProductDTO`'s relation fields (`media`, `categories`, `tags`, `collections`, `attributes`) are named *identically* to `Product`'s relations, and `Model::to_array()` merges loaded relations into the array (`Model::to_array()`, `libraries/framework/Database/Query/Model.php:977-979`). Doing the same `from_array($product->to_array())` shortcut here would silently assign full relation record arrays (or, for `attributes`, entirely the wrong shape) into DTO properties typed as `int[]`. This design avoids that shortcut for `Product`.

## Goals / Non-Goals

**Goals:**
- Duplicate a product (all scalar fields, media/categories/tags/collections, attribute+value assignments, and every variant) into a new draft product in one API call.
- Keep `sku`-nulling (and the other per-variant resets) isolated in one clearly named step, so changing that behavior later is a one-method edit.
- Reuse `CreateProductAction` for persistence — no duplicated transaction/creation logic.

**Non-Goals:**
- Bulk duplication (duplicating multiple products in one call) — not requested, `BulkActions` untouched.
- Deep-cloning referenced media attachments — duplicated product/variants reference the *same* media/post ids as the source; only the associations are copied, not the underlying files.
- Any frontend UI for triggering duplication — backend endpoint only, per proposal.md.
- Preserving the source variant's SKU in any transformed form (e.g. `SKU-copy`) — out of scope now, deliberately deferred (see the isolation decision below).

## Decisions

### 1. Route/dispatch pattern: `PATCH /products/{id}/action`, plain `Request`, inline switch

Mirrors `CouponController::action()` exactly: a plain `Request $request` (the framework contract, not a dedicated `FormRequest`), `$request->int('id')` / `$request->string('action')`, and a `switch` with a `default` branch returning `Response::BAD_REQUEST`.

**Alternative considered:** a dedicated `ProductActionRequest` with a validated `action|in:...` rule and a `ProductAction` constants class, mirroring `OrderActionRequest`/`OrderAction`. Rejected for now — `OrderController::action()` needs formal validation because different order actions require different conditional fields (`refund_id`, `amount`, `tracking_number`, ...). A single-case product action (`duplicate`, taking only `id`) doesn't have that problem yet; introducing a constants class and FormRequest for one value is premature abstraction. If a second product action shows up with its own required fields, revisit and follow the `OrderActionRequest` pattern instead.

**Alternative considered:** dedicated `POST /products/{id}/duplicate` route. Rejected per the proposal — breaks from the established `/action` convention for no benefit.

### 2. `DuplicateProductAction` builds `CreateProductDTO` field-by-field, not via `from_array($product->to_array())`

Load the product via `$this->product_service->find($id)` directly (**correction during implementation**: rather than re-issuing the same `Product::with([...])->find()` query and `NotFoundException` throw inline, reuse `ProductService::find()` — it already loads the exact relation set needed plus a couple extra (`brand`, `currency`, `variants.product`), and already throws the same `NotFoundException`/404 on a missing id, so re-deriving that logic here would just be duplication for no behavioral difference), then construct `CreateProductDTO` explicitly:

- Scalar fields (`title`, `ribbon`, `currency_id`, `brand_id`, `short_description`, `description`, `additional_info`, `seo_title`, `seo_description`, `seo_keywords`, `og_title`, `og_description`, `og_image`, `schema_id`, `llm_instructions`) copied 1:1 from the loaded model.
- `title` → `$product->title . ' - Copy'`.
- `slug` → left `null`; `ProductService::create()` already derives it from `title` and calls `Product::generate_unique_slug()`.
- `status` → `ProductStatus::DRAFT`, always.
- `media` → `$product->media->pluck('ID')->all()` — **correction during implementation**: `Product::media()` is a `belongs_to_many(Post::class, ...)`, and `Post`'s primary key is `ID` (uppercase, matching `wp_posts.ID`), not `id`. `pluck('id')` would silently return an array of nulls.
- `categories` → `$product->categories->pluck('id')->all()`.
- `tags` → `$product->tags->pluck('id')->all()`.
- `collections` → `$product->collections->pluck('id')->all()`.
- `attributes` → reconstructed as `[{id: attribute_id, values: [attribute_value_id, ...]}]`: iterate `$product->attributes` (already pivot-ordered) and for each, filter `$product->attribute_values` down to entries whose `attribute_id` matches, mapped to `id`. This is the shape `ProductService::create()` expects (it does the inverse: flattens `attributes[].id` and `attributes[].values` back out) — see `ProductService::create()`, `app/Services/ProductService.php:98-106`.
- `has_variants` is set by `CreateProductAction::execute()` itself from `count($product_payload->attributes) > 0` — not set here, matching how `ProductController::create()` leaves it unset too.

### 3. Variant copy: one method owns every per-variant reset

A single protected method, e.g. `prepare_variant_copy(Variant $variant): CreateVariantDTO`, is the only place that decides what does *not* carry over:

```php
protected function prepare_variant_copy(Variant $variant): CreateVariantDTO
{
    $data = CreateVariantDTO::from_array($variant->to_array());

    $data->sku = null;
    $data->available_quantity = 0;
    $data->in_stock = false;
    $data->committed_quantity = 0;
    $data->attribute_values = $variant->attribute_values->pluck('id')->all();

    return $data;
}
```

Unlike `Product`, `Variant`'s fillable columns and `CreateVariantDTO`'s properties are both flat scalars (no relation-name collisions except `attribute_values`, which is handled explicitly above) — so `from_array($variant->to_array())` is safe here, matching the coupon precedent's shortcut. `product_id` is intentionally left unset on the DTO; `CreateProductAction::execute()` already assigns it per-variant after the product is created (`app/Actions/Product/CreateProductAction.php:52`).

This keeps every "what resets on duplicate" decision in one reviewable spot — the stated goal from proposal.md of making it easy to tweak later (e.g. swapping `sku = null` for a generated/suffixed value, or deciding to also null `barcode`).

### 4. Reuse `CreateProductAction::execute()` unchanged

`DuplicateProductAction::execute(int $id)` ends with:

```php
return $this->create_product_action->execute($product_dto, $variant_dtos);
```

No changes to `CreateProductAction` or `ProductService::create()`. This keeps the transaction boundary, the `has_variants` derivation, and the variant-creation loop in exactly one place.

## Risks / Trade-offs

- **Attribute reconstruction correctness** → mitigated by grouping strictly off `attribute_id` (a real column on `AttributeValue`, not inferred), and iterating `$product->attributes` for ordering rather than `attribute_values` directly, so the rebuilt shape matches what a hand-built create request would send.
- **N+1 risk when duplicating products with many variants** → each variant only needs its own already-eager-loaded `attribute_values` relation (loaded via `variants.attribute_values` on the initial `find`), so no additional queries per variant beyond what `CreateProductAction`'s loop already does (one insert + one pivot sync per variant, same as a normal create).
- **A future second product action forces revisiting decision #1** → acceptable; the `OrderActionRequest` pattern is the documented fallback, not a redesign.

## Migration Plan

No data migration. Purely additive: new route, new action class, no schema changes (`sku` is already nullable). Safe to ship and roll back independently — reverting the route/controller method removes the capability with no residual state.
