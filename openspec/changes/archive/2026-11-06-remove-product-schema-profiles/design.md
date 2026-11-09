## Context

See proposal.md for the reasons.

The current flow:

```
Settings > Essentials --REST /product-schemas--> product_schemas table
                                                    ^      ^
                    SchemaProfilePresets (store setup)      ProductSchemaSeeder (dev)
                                                    |
products.schema_id --FK (null on delete)------------+
                                                    v
ProductSchemaProfile::for_product()  own -> default -> BUILT_IN
                                                    v
ProductJsonLd::build($seo, $product, $profile) --> AddWpHeadMeta (wp_head)
```

Constraints:

- The plugin is released. A schema change ships as a new migration that is
  appended to `config/migrations.php`. The migrator runs each registered class
  once and records it, so the new class runs once on upgrade. On a fresh install
  it runs after the `Create*` list.
- The framework `Schema::table()` compiler issues `drop_foreign` before
  `drop_column` in the same `ALTER`, so one closure can drop both.
- `DTO::__construct` copies only keys that are DTO properties, so an old client
  that still sends `schema_id` on product save gets no error.
- `kirki_ecommerce_product_json_ld` is a public filter. Site code can depend on it.

## Goals / Non-Goals

**Goals:**

- No runtime code reads or writes schema profiles or `schema_id`.
- Existing installs lose the table and the column on upgrade with no manual step.
- The JSON-LD prints a superset of what any profile could print before.

**Non-Goals:**

- No new product attributes (for example a `condition` field). `itemCondition`
  stays the fixed `NewCondition`.
- No new admin setting to turn JSON-LD fields on or off. Site code uses the filter.
- No change to `Create*` migrations, which are released history.
- No change to the `Availability mapping` or `Extensible and disable-able output`
  behavior.

## Decisions

### 1. One new drop migration; released `Create*` migrations stay unchanged

`DropProductSchemasTable` (in `database/migrations/`, appended last in
`config/migrations.php`):

- `up()`: in `Schema::table('kirki_ecommerce_products', ...)`, call
  `drop_foreign('fk_kecom_products_schema_id')` and `drop_column('schema_id')`.
  Then call `Schema::drop_if_exists('kirki_ecommerce_product_schemas')`.
  The FK goes first, so the table drop has no reference to it.
- `down()`: recreate `kirki_ecommerce_product_schemas` with the same shape as
  `CreateProductSchemaTable`, then add `schema_id` (`unsigned_big_integer`,
  nullable, after `og_image`) and the FK with `null_on_delete()`. The profile
  rows cannot be restored.

Alternative: edit `CreateProductsTable` / remove `CreateProductSchemaTable`,
plus a guarded drop migration for old installs. Rejected: it rewrites released
history, and two install paths with a different schema history are harder to
reason about. The cost of the chosen path is that a fresh install creates the
table and then drops it at once. That cost is very small.

`CreateProductSchemaTable.php` and its registration stay. They are the only
`product_schemas` references that remain in the code after this change, apart
from the drop migration.

### 2. `ProductJsonLd` loses the profile parameter, not its structure

`build(array $seo, array $product)` builds the same nodes as today, with every
`when(in_array(...))` gate removed. `build_brand($product)` and
`build_offers($seo)` lose their `$fields` parameter. `when()` is removed because
it has no more callers. `is_filled` filtering stays, so a field with no data
is still left out. `current()` keeps the filter call
`apply_filters(DevHookNames::PRODUCT_JSON_LD, $data, $seo, $product)` unchanged.

The value sources do not change:

| Field | Source |
|---|---|
| name, description, image, url | resolved SEO data (`ProductSeo`) |
| sku, gtin | default variant, else first visible variant (`pick_variant_value`, `pick_gtin`) |
| category | deepest category path (`category_path`) |
| brand.name, brand.logo | product resource `brand` |
| price / lowPrice / highPrice / offerCount | visible variant offers (`extreme`) |
| priceCurrency | SEO `offers.currency` |
| availability | `aggregate_availability` |
| itemCondition | constant `NewCondition` (as today) |
| seller.name | SEO `site_name` (as today) |

`seller` is printed only when the site name is not empty. Today the code
prints `['@type' => 'Organization', 'name' => '']` when the name is empty. The
new code applies the same "no empty value" rule as the other fields.

Alternative: keep a hard-coded `BUILT_IN` profile constant and keep the gates.
Rejected: a constant that always lists every field is dead configuration.

### 3. Removal is complete for runtime code, with no stubs

The REST routes, controller, service, requests, DTOs, resource, model,
`ProductSchemaProfile`, `SchemaProfilePresets`, and `ProductSchemaSeeder` are
deleted, not deprecated. Nothing outside this feature calls them (checked with
grep). `StorePresetService` drops the step from its list; `LocalPresetSource`
stops copying `schema_profiles`; `presets.json` drops the key. A preset source
that still sends the key is not read, so it does nothing.

### 4. Admin UI

The Schema Profile section is deleted from Settings > Essentials. Its service,
catalog / form schemas and their test, `schemaProfileKeys`, and the two endpoint
constants are deleted. `schema_id` is removed from the product catalog schema,
the SEO form shape, the product form payload transform, and the product form
test. The settings search index is rebuilt with `npm run search:index` so the
`essentials.schema-profile` entry disappears. The relevance test rows that
expect it are removed.

## Risks / Trade-offs

- [The upgrade deletes merchant profile rows] -> They had no effect on any
  field that the new output omits, because the new output prints every field.
  `down()` recreates the structure, not the rows. This is stated in the proposal.
- [The FK name differs on some install] -> All released `Create*` migrations
  name it `fk_kecom_products_schema_id`, and the squash change made key names
  stable. If `drop_foreign` fails, the migration is not recorded and runs again
  on the next load. The test for the migration checks the end state.
- [Site code that called `ProductJsonLd::build()` with three arguments] -> PHP
  ignores extra arguments to a userland method, so such code still works. The
  method is not documented as public API.
- [Site code that read `schema_id` from the product REST response] -> The key is
  gone. This is listed as **BREAKING** in the proposal.
- [JSON-LD output grows for stores with a reduced profile] -> More fields that
  are true for the product. Google accepts all of them for `Product`.

## Migration Plan

1. Release the new version. On first load after the update, the migrator runs
   `DropProductSchemasTable` once.
2. Rollback: run the migration rollback for the last batch. It recreates the
   empty table and the nullable column. The previous plugin version then prints
   the built-in field set, because no profile row exists.

## Open Questions

None.
