## Context

`kirki_ecommerce_products.ribbon` is a lone `varchar(100)`. Nothing above it
— DTOs, request rules, resources, the storefront card partial — knows about
a colour. Adding the swatch row to the sidebar therefore means threading one
new value through the full round trip, under CLAUDE.md §2's WP.org rules.

## Goals / Non-Goals

**Goals**
- Persist a ribbon colour and deliver it to the storefront card.
- Add the swatch row and live preview to the sidebar ribbon disclosure.

**Non-Goals**
- No free-form colour picking. The palette is fixed at five entries.
- No redesign of the storefront card beyond drawing the badge in the stored
  colour.
- No backfill of existing rows.

## Decisions

### The palette is application data, not a theme token

CLAUDE.md's styling rule says to reference design tokens instead of
hardcoded values, and that rule holds for the *chrome* around the swatches —
their size, border, focus ring and spacing all come from `theme`. The five
palette colours themselves are different: they are values persisted to the
database and echoed back to the storefront, not styling decisions. They live
in one exported constant shared by the schema's validation and the swatch
row, with the same list mirrored in the PHP request rule. Two copies is the
cost of the value crossing the PHP/TS boundary; the column comment names the
set so neither side is the only record of it.

The palette, taken from the design draft, is `#6d3fe0`, `#1f6fe5`,
`#1e8e4a`, `#d9650b`, `#1d1d1f`. The first is the default.

### The column is a nullable string, added by an alter migration

`CreateProductsTable` is not edited — existing installations have already
run it. A new `AddRibbonColorToProductsTable` follows the established
`Schema::table(...)->after(...)` shape of
`AddLowStockThresholdToVariantsTable`, and is registered in
`config/migrations.php`, which is what makes a fresh install and an upgraded
one converge on the same schema.

The column is nullable rather than defaulted so that "never chose a colour"
stays distinguishable from "chose the first colour", and so the migration
touches no existing row. `schema-upgrade-migrations` already requires
fixed-value-set columns to be strings with the allowed values in the column
comment; this follows that, which is also what keeps widening the palette an
application-level change.

### The fallback lives in the resource, not the database

A ribbon stored before this change has a null colour. Rather than backfill,
`ShopProductResource` substitutes the palette's first colour when the stored
value is null. Existing ribbons therefore keep rendering the moment the
upgrade completes, and a later palette change moves them with it.

### Out of stock keeps its precedence, and loses the colour with it

`resolve_ribbon_text()` already replaces a merchant's ribbon with the
out-of-stock label. The colour has to follow the same branch, or an
out-of-stock badge would be painted in the merchant's promotional colour and
read as one. The new resolver returns the out-of-stock state's own colour,
not the stored one. The existing method is `private`, against this
codebase's convention; it is left as it is because it is not this change's
mess, and the new sibling is `protected`.

### The preview is a form-state read, not a new field

The preview badge renders from the same watched `ribbon` and `ribbon_color`
values the inputs write, so it updates as the merchant types with no
separate state to keep in sync. Empty text renders the literal "Preview",
which is what makes the colour choice visible before anything is typed.

## Risks / Trade-offs

- **The palette is duplicated across PHP and TypeScript.** A colour added to
  one and not the other fails validation at the boundary. Mitigated by the
  column comment naming the set and by a request-level test asserting the
  rejection, but it is a genuine two-places-to-edit.
- **`ProductResource` gains a field.** `libs/api.ts`'s dev-only tripwire
  compares API responses against the Zod catalog schema, so
  `schemas/catalog/product.ts` has to gain `ribbon_color` in the same change
  or every product response warns in development.
- **Inline colour on the storefront.** The card partial draws the badge with
  an inline background. The value is palette-constrained and escaped with
  `esc_attr`, so it is not an injection path, but it is inline style in a
  theme surface and worth noting.

## Migration Plan

1. Migration and `config/migrations.php` registration land first; the column
   is nullable so the release is safe before any code writes to it.
2. Model, DTOs, requests, resources follow.
3. The sidebar UI lands last, once the value it writes has somewhere to go.

No rollback concern: `down()` drops the column, and every reader tolerates a
null colour.

## Open Questions

None.
