## Why

A product's ribbon is the badge shown on its storefront card, and merchants
can currently only set its text. The sidebar design adds a colour choice
beside the text field with a live preview of the resulting badge. Nothing in
the stack can hold that colour today: `kirki_ecommerce_products.ribbon` is a
single `varchar(100)`, the create/update DTOs and request rules carry only
`ribbon`, and `ShopProductResource::resolve_ribbon_text()` hands the
storefront a bare string. Without a column the swatch is decoration that
resets on reload, so the colour has to be threaded end to end.

## What Changes

- A new nullable `ribbon_color` column on `kirki_ecommerce_products`, added
  by an alter migration so existing installations converge on upgrade.
- The colour is constrained to a fixed five-entry palette stored as a hex
  string, following `schema-upgrade-migrations`' rule that fixed-value-set
  columns are strings with the allowed values documented in the column
  comment — widening the palette later stays an application-level change.
- `Product` model, `CreateProductDTO`, `UpdateProductDTO`,
  `ProductCreateRequest`, `ProductUpdateRequest` (rule plus `Sanitizer::TEXT`),
  `ProductResource`, and `DuplicateProductAction` all carry the colour.
- `ShopProductResource` gains a `ribbon_color` output alongside
  `ribbon_text`, falling back to the palette's first entry when the stored
  value is null, so ribbons saved before this change still render.
- The out-of-stock override keeps its current precedence: an out-of-stock
  product still shows the stock label, and its ribbon colour is not applied.
- The sidebar ribbon disclosure gains the swatch row and a live preview
  badge that reflects the current text and colour, showing "Preview" while
  the text is empty and defaulting to the palette's first colour.

## Capabilities

### New Capabilities

- `product-ribbon`: what a ribbon is made of (text plus a palette colour),
  how it is persisted and validated, and how it reaches the storefront card
  including the out-of-stock override.

### Modified Capabilities

- `product-sidebar-fields`: the ribbon disclosure is specified as text plus
  a colour choice with a live preview, rather than a lone text input.

## Impact

- `database/migrations/AddRibbonColorToProductsTable.php` — new.
- `app/Models/Product.php`, `app/DTO/Product/{Create,Update}ProductDTO.php`,
  `app/Http/Requests/Product/Product{Create,Update}Request.php`,
  `app/Resources/Product/ProductResource.php`,
  `app/Resources/Site/Shop/ShopProductResource.php`,
  `app/Actions/Product/DuplicateProductAction.php`.
- `resources/app/features/products/schemas/forms/product-basics-form.ts` and
  `product-form.ts`, `schemas/catalog/product.ts`.
- `resources/app/features/products/components/product-form/sections/right-panel/ribbon.tsx`
  and a new palette/preview component.
- Storefront templates that render the card badge.
- Subject to CLAUDE.md §2's WP.org rules: validation, `Sanitizer`, escaping
  at output, and `composer phpcs:wporg`.

## Dependencies

This change modifies `product-sidebar-fields`, which currently exists only
as a delta inside the unarchived `redesign-product-multi-select-fields`.
That change must be synced and archived first so the capability is present
in `openspec/specs/`.
