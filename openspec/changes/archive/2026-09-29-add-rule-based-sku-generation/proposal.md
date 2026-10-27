## Why

The SKU wand in the product and variant forms today calls `generateSku()` in
`resources/app/features/products/lib/utils.ts`, which returns `SKU-` plus seven
random alphanumerics. The result carries no information about the product it
belongs to, is not verified against `kirki_ecommerce_variants.sku` (a `UNIQUE`
column), and gives merchants nothing to read on a packing slip or a Code 128
label — even though the barcode settings page is built on the assumption that a
SKU is the scannable identity of a variant.

Merchants expect a SKU to encode what the item *is*. This change replaces the
random generator with a rule-based one derived from the product's own data,
with a sequence number read off the SKUs already stored, so every generated SKU
is unique by construction.

## What Changes

- **BREAKING** (behavioural, not API): the SKU wand no longer produces
  `SKU-XXX-1234`. It produces `[TITLE3]-[ATTRVAL3…]-[BRAND3]-[CAT3]-[SEQ]`, e.g.
  `BLU-RED-SMA-NIK-APP-010` for "Blue Cotton Shirt" / Red / Small / Nike /
  Apparel / sequence 10. Previously generated SKUs are untouched.
- SKU composition moves from the browser to PHP. A new
  `POST /variants/generate-sku` endpoint returns a single finished SKU string;
  the frontend no longer knows the rule.
- Each segment is derived by running the source text through WordPress'
  `remove_accents()`, stripping everything outside `A-Z0-9`, uppercasing, and
  taking the first three characters. A source that is absent, empty, or reduces
  to nothing (Bangla, CJK, emoji-only titles) contributes **no segment at all** —
  neither text nor separator.
- The attribute portion uses the variant's selected **attribute values** (Red,
  Small), not attribute names (Color, Size), so sibling variants differ by more
  than their trailing number.
- The sequence is read from the SKUs already stored — one past the highest number
  any `variants.sku` ends with — and nothing is persisted. Generating a SKU the
  merchant abandons therefore costs nothing, and repeating the request returns the
  same SKU until one is saved. It is zero-padded to three digits and widens
  naturally past 999 (`1000`).
- Because the number is above every number already stored, a generated SKU cannot
  duplicate an existing one.
- Existing non-empty SKUs are never overwritten; generation only ever happens
  when a merchant clicks the wand.
- The bulk edit grid generates too: selecting SKU cells reveals a generate action
  in the SKU column header, and dragging the SKU fill handle gives each dragged
  row its own rule-based SKU rather than a copy of the origin row's. Both go
  through a new `POST /variants/generate-skus`, which numbers a whole set of
  variants consecutively in one request — necessary, not merely efficient, since
  nothing is persisted and repeated single calls would all return the same
  number.
- Out of scope: no "generate for every variant in the catalogue" action, no
  automatic generation on product save, no settings UI for the format, and no
  TypeScript copy of the rule.

## Capabilities

### New Capabilities
- `sku-generation`: composing a variant SKU from product title, variant
  attribute values, brand, first category and a sequence number derived from the
  stored SKUs, and serving it over the admin API.

### Modified Capabilities
- `product-inventory-card`: the "Full-width SKU with generation" requirement
  currently mandates a *random* `SKU-XXX-1234` value generated client-side; it
  becomes a rule-based value fetched from the server.

## Impact

- `app/Supports/SkuGenerator.php` — new. No new stored state: no option key, no
  seeder change.
- `app/Http/Controllers/Api/VariantController.php` + `routes/api.php` — new
  `generate_sku()` action and route.
- `app/Http/Requests/Variant/GenerateSkuRequest.php` — new request, validated and
  sanitized through `Framework\Sanitizer` per the wp.org standards this plugin
  is held to.
- `app/Http/Requests/Variant/GenerateSkusRequest.php` — new request for the batch
  endpoint, same sanitization path.
- `resources/app/features/bulk-edit/` — a `SkuGenerateAction` in the SKU column
  header, a batch service function, a `getSelectedRows`/`useSelectedRowCount`
  addition to the cell-selection context, a SKU branch in `handleFillCommit`, and
  a wider SKU column.
- `resources/app/features/products/lib/utils.ts` — `generateSku()` and its
  `randomSkuSegment()` helper are removed.
- `resources/app/features/products/components/product-form/sections/inventory/inventory.tsx`
  and
  `resources/app/features/inventory/components/variant-form/sections/inventory.tsx`
  — both wands become async mutations.
- `resources/app/config/endpoints.ts`, plus a service function and response
  schema following the existing `services/` + `parseResponse` conventions.
- No database schema change: `variants.sku` is already `varchar(100) UNIQUE
  NULL`. The 100-character ceiling is a real bound on how many attribute
  segments a SKU can carry.
