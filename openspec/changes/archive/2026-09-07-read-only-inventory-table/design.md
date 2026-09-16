## Context

See `proposal.md` — Why. Constraints that shape the approach:

- `App\Resources\Variant\InventoryResource` is reached only through
  `VariantController::get()` (`GET /variants`), whose only consumer is
  `useInventoryQuery` on this screen. Narrowing it is contained.
- `VariantService::list_query()` already eager-loads `product.media` and
  `attribute_values` and selects no explicit column list, so every field this
  change needs is already loaded. There is no N+1 to introduce.
- The availability algorithm already exists on both sides: `AvailabilityService`
  in PHP and `features/products/lib/availability.ts` in TypeScript, from the
  pending `variants-table-availability-status` change. The TypeScript layer-1
  function has no production caller — the product table takes
  `availability_status` from the backend and uses the frontend module only to
  map a status to a colour.
- The `/variants/bulk` screen (`features/bulk-edit`) is a complete, tested
  editing surface reached from this table's bulk action. Inline editing here was
  a duplicate of it.
- `resources/app/` has no number-formatting helper of any kind.

## Goals / Non-Goals

**Goals:**

- One implementation of "what does this variant's stock look like", shared by the
  inventory listing and the product listing.
- The listing's payload carries what the five columns need and nothing else.
- The two cell rules — Available and Committed — are pure and independently
  testable, not tangled into JSX.

**Non-Goals:**

- Sorting. The table already threads `sorting`/`onSortingChange` and the
  controller whitelists `sku`, `base_price`, `available_quantity` and `name`, but
  every column sets `enableSorting: false` today and this change leaves that as
  it is.
- The toolbar. Search, the date-range picker and the column-visibility control
  stay exactly as they are. The `inventory_type` in-stock/out-of-stock filter the
  backend already supports stays unexposed.
- Thousands separators in the Available column. The codebase has no number
  formatter, and introducing one is a separate concern.
- Any change to `VariantSchema`, `VariantResource`, or the bulk-edit screen.

## Decisions

### Resolve availability on the server, not in the cell

`InventoryResource` emits `availability_status` and `availability_label`,
resolved through `AvailabilityService::resolve_variant_status()` with the store
default from `Settings::get('product.low_stock_threshold', 0)`. The cell only
maps the status to a colour via the existing `getAvailabilityColor()`.

*Why:* this is already the pattern — `ProductListWithVariantsResource` does the
same per row for the product listing, so a list resource resolving status is
established, not new. Two screens sharing one server-side resolver cannot drift.

*Alternative rejected:* resolving in React with `resolveVariantStatus()`. It
would require shipping `low_stock_threshold` per variant *and* plumbing the store
default into the SPA, to arrive at the same answer the server already has. The
frontend resolver stays where it belongs — live form state in the product form,
where variants may not exist server-side yet.

### Narrow `InventoryResource` rather than switching to `VariantResource`

`VariantResource` already returns every stock field this change needs, but its
`name` is the *product title* and it carries no `product` object, so adopting it
would break the Variants cell while roughly tripling the per-row payload.

*Decision:* keep `InventoryResource` as the list projection and trim it to the
five columns' needs. Each `display_*` money key keeps its `*_money_object`
sibling, per the money-field convention.

*Trade-off:* the same availability wiring now appears in three resources. Small
duplication, and the alternative is a shared trait for six lines.

### Attribute labels cross the wire as an array

The resource returns `attribute_value_labels` (the key `VariantResource` already
uses) instead of a pre-joined `"Small | Red | Cotton"` string.

*Why:* a joined string cannot style the separator differently from the values,
and it collapses "no attributes" into an empty string with no way to distinguish
it. Joining is presentation.

### The two cell rules live in a pure module

`features/inventory/lib/inventory-cells.ts` exports the Available and Committed
derivations as pure functions over a variant, returning what to render and in
what colour. `columns.tsx` renders their output.

*Why:* the Committed rule (dash on zero, null, *or* untracked) and the Available
branch are the only real logic in this change; everything else is markup. Pure
functions make them testable without rendering, matching
`features/products/lib/availability.ts` and its test suite. It also satisfies the
`list-table-composition` requirement that column definitions stay module-scope
constants — the rules are called from cells, not rebuilt per render.

### Delete the inventory form context outright

`InventoryFormProvider` / `useInventoryForm` are exported from
`features/inventory/index.ts` but consumed only by this feature's page, table and
columns. With editing gone the reducer is a cache in front of TanStack Query,
which is already a cache. `pages/inventory.tsx` passes `useInventoryQuery`
results straight into the table.

*Alternative rejected:* keeping the context as a read-only store. 189 lines to
re-implement what `useQuery` provides.

## Risks / Trade-offs

- **Narrowing a REST response is breaking.** → The endpoint has exactly one
  consumer in this repo, and the removed keys (`base_price*`,
  `base_cost_of_goods*`, `stock_quantity`) are unread by it. But `/variants` is
  reachable by any authenticated admin client, so a third-party integration
  reading base-currency prices would break. Called out in the proposal; ship it
  with the change note rather than silently.
- **`stock_quantity` removal could look like a regression.** → It is provably
  dead: not a column on `kirki_ecommerce_variants`, absent from the `Variant`
  model's `$fillable` and `$casts`, so it has always serialised as `null`.
- **The frontend loses its own availability resolution for this screen.** → If
  the backend ever stops sending `availability_status`, the Available column
  degrades rather than throwing: the schema keeps the lenient
  `z.union([AvailabilityStatusSchema, z.string()])` treatment used by the product
  schema, and `getAvailabilityColor()` already falls back to `secondary` for an
  unrecognised status.
- **`Settings::get()` is called once per row.** → Same as the existing product
  listing resource; no worse than what ships today. Not optimised here.
- **Losing the Sale Price and Cost of Goods columns removes information from the
  screen.** → Sale price still surfaces inside the Price cell as the effective
  price with the regular struck through. Cost of goods and profit remain editable
  and visible on the bulk-edit screen.
