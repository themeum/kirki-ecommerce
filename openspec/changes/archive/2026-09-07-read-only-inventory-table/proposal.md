## Why

The Inventory screen is not a listing — it is a second, redundant inline bulk
editor. Its SKU, Price, Sale Price and Cost of Goods cells are invisible text
inputs bound to a 189-line reducer context, and the page heading swaps to "Save
changes?" with Save/Discard on the first keystroke. That duplicates the
dedicated `/variants/bulk` screen, which this very table already links to
through its "Bulk Edit" bulk action and which has its own contexts, column
visibility and tests.

Worse, the screen cannot answer the question a merchant opens it to ask: how
much stock is there? It shows no Available and no Committed column, and it
cannot — `InventoryResource` returns none of `track_inventory`,
`available_quantity`, `committed_quantity` or `in_stock`. The one stock-shaped
key it does return, `stock_quantity`, is not a column on `kirki_ecommerce_variants`
and is absent from the `Variant` model's `$fillable` and `$casts`, so it is
always `null` — and that dead key is mirrored in `InventoryVariantSchema`.

## What Changes

- Turn the Inventory table into a read-only listing of exactly five columns:
  Variants, Price, SKU, Available, Committed. Editing inventory is reached only
  through the Bulk Edit action.
- **BREAKING**: narrow the `/variants` list response. `InventoryResource` gains
  `track_inventory`, `available_quantity`, `committed_quantity`,
  `availability_status`, `availability_label` and `attribute_value_labels`, and
  drops `name`, `stock_quantity`, and every `base_*` and cost-of-goods money
  key. The endpoint has exactly one consumer today (`useInventoryQuery`), but
  the response shape does change.
- Show stock state, not a bare number: an untracked variant reads In Stock or
  Out of Stock; a tracked variant reads its available quantity, coloured
  critical when it is low or zero. The status is resolved server-side by the
  existing `AvailabilityService`, so the Inventory screen and the product
  listing can never disagree about what "low stock" means.
- Show a dash in Committed when nothing is committed or the variant is not
  tracked, rather than a meaningless `0`.
- Return variant attribute labels as an array instead of a server-joined
  `"Small | Red | Cotton"` string, so the separator is styled in the cell and a
  variant with no attributes has a fallback instead of a blank line.
- **Removes** the Sale Price, Cost of Goods and Profit columns and the whole
  inline-edit apparatus: `inventory-form-context.tsx`, the Save/Discard heading
  swap, and the effect that copies query data into the context. Sale price still
  surfaces inside the Price cell, struck through against the regular price.
- Row selection, the Bulk Edit action, Import/Export, search, the date-range
  picker and the column-visibility dropdown are all retained. Sorting and the
  unexposed `inventory_type` filter stay out of scope.

## Capabilities

### New Capabilities

- `inventory-table`: The Inventory screen's listing — its read-only contract,
  its five columns, how each cell derives its content from a variant, and the
  fields the `/variants` list response must carry to feed them.

### Modified Capabilities

<!-- None. This change consumes the availability algorithm defined by the
     pending `variants-table-availability-status` change without altering its
     requirements, and conforms to `list-table-composition` as written. -->

## Impact

**PHP**: `App\Resources\Variant\InventoryResource` is rewritten. It picks up the
`AvailabilityService` + `Settings::get('product.low_stock_threshold')` wiring
that `ProductListWithVariantsResource` already uses per row. No query changes —
`VariantService::list_query()` already eager-loads `product.media` and
`attribute_values` and restricts no columns, and all four stock fields are plain
columns.

**Frontend**: `InventoryVariantSchema` in
`features/products/schemas/catalog/variant.ts` is rewritten to mirror the
resource (`VariantSchema` is untouched). The inventory feature loses its context
and gains a `lib/inventory-cells.ts` holding the two cell rules as pure
functions; `columns.tsx`, `lib/utils.tsx` and `pages/inventory.tsx` are reworked.
`calculateProfit` stays in `utils/common.ts` — bulk-edit and the product form
still use it.

**Tests**: a new Vitest suite over the Available and Committed rules, mirroring
`features/products/tests/lib/availability.test.ts`.

**Risk**: trimming the resource narrows a REST response. Any third party reading
`/variants` for `base_price` or cost-of-goods breaks.
