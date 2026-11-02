## Context

See `proposal.md` for the motivation. Constraints that shape the design:

- Kirki already has create DTOs and services for the target data:
  `CreateProductDTO`, `CreateVariantDTO`, `CreateCategoryDTO`,
  `CreateBrandDTO`, `CreateAttributeDTO`, `CreateAttributeValueDTO`,
  `CreateCustomerDTO`, `CreateCouponDTO`, `CreateOrderDTO`,
  `CreateOrderItemDTO`, `CreateOrderTaxDTO`, `CreateOrderCouponDTO`,
  `CreateRefundPayloadDTO`, `CreateAddressDTO`, tax and shipping profile DTOs.
  A source row is "migratable" when it can fill one of these DTOs.
- Services (`ProductService::create`, `OrderService::create_order`, ...) hold
  side effects (mails, stock, events). The migration must call them with those
  side effects off (see Decision 7).
- Tables live in `database/migrations/Create*Table.php`.
  The `schema-upgrade-migrations` spec governs new tables.
- The admin app is feature-based (`resources/app/features/*`). Onboarding is
  `features/onboarding`. Migration UI goes in a new `features/migration`.
- A WooCommerce store can have thousands of orders. Hosting limits (time,
  memory) forbid one request.
- Data structure is taken from published WooCommerce docs and source, not from
  an installed copy. See "WooCommerce data structure" below.

## Goals / Non-Goals

**Goals:**

- One engine, many sources. WooCommerce is the first.
- Resumable, idempotent, chunked, read-only toward the source.
- Reports what moved, what was skipped, and why.

**Non-Goals:**

- Migrating add-on plugin data (Subscriptions, Bookings, and so on).
- Copying passwords, payment credentials or product media files.
- Background (cron) execution. The browser drives the loop.
- Updating or replacing existing Kirki data.
- A command line (WP-CLI) interface. The runner is written so one can be added.

## Decisions

### 1. Folder layout

```
app/Migration/
  Contracts/   MigrationSource, GroupMigrator
  Core/        MigrationRunner, SourceRegistry, IdMap, RunState,
               ChunkResult, MigrationMode
  DTO/         ScanResultDTO, GroupDTO, ChunkResultDTO, SkippedItemDTO
  Sources/
    WooCommerce/
      WooCommerceSource.php
      Probe/      VersionProbe, StorageProbe, ExtensionDetector
      Readers/    ProductReader, OrderReader (Legacy + Hpos), ...
      Groups/     CategoriesGroup, ProductsGroup, ...
      Mappers/    row -> Kirki DTO
app/Http/Controllers/Api/MigrationController.php
resources/app/features/migration/   (UI)
```

**Why:** the core knows no source. Deleting `Sources/<X>` removes one source.
**Alternatives:** `app/Services/Migration/` (no source separation, Services is
already flat); `app/Setup/` (that folder is for first-run seeders).

### 2. Strategy per source, Template Method per group

`MigrationSource` (Strategy): `id()`, `detect()`, `version_state()`,
`extensions()`, `scan()`, `groups()`.
`GroupMigrator` (abstract, Template Method): the runner calls `count()`,
then repeatedly `fetch(cursor, limit)`. For each row the base class calls
`map(row)`, then `persist(dto)` inside a guard that catches errors per row,
writes the id-map link, and records skips. Subclasses implement only
`count`, `fetch`, `map`, `persist` (and `depends_on`).
**Why:** chunk, resume and report logic exists once.
**Alternatives:** Strategy only (logic copied per source); full ETL interfaces
(more files than needed now).

### 3. Reader / mapper split, and version handling

Each group has a Reader (SQL on source tables, returns plain arrays) and a
Mapper (array to Kirki DTO). Versions differ mostly in storage, so there is
one Reader per storage layout, chosen by `StorageProbe`:

- HPOS is used when table `{prefix}wc_orders` exists and the option
  `woocommerce_custom_orders_table_enabled` is `yes`.
- Legacy otherwise (`shop_order` posts).

Probes check tables and columns with `SHOW TABLES` / `information_schema`,
not version numbers. A minimum version (initial value to confirm at apply:
WooCommerce 7.0, the first release with HPOS tables) is a constant in
`VersionProbe`. Unknown meta keys are ignored. Missing optional fields use
defaults. Missing required fields skip the row.
**Why:** this is the usual approach in migration tools: detect by capability,
test with fixtures from several versions.
**Alternatives:** one adapter set per major version (too much duplication).

### 4. Persistence: run state and id-map

Two new tables (final names confirmed at apply):

`kirki_ecommerce_migration_runs`
: `id`, `source`, `status` (pending, running, paused, failed, done),
`groups` (JSON: selected groups with status, cursor, total, created, reused,
skipped), `last_error`, `started_at`, `updated_at`, `finished_at`.

`kirki_ecommerce_migration_id_map`
: `id`, `source`, `entity` (for example `product`, `variant`, `order`),
`source_id`, `kirki_id`, `run_id`, `created_at`.
Unique key on (`source`, `entity`, `source_id`).

The cursor is the last source primary key processed (keyset pagination:
`WHERE id > :cursor ORDER BY id LIMIT :n`), not an offset. This stays correct if
WooCommerce rows change during a long run. Only one active run exists at a time.
Cursor and counts are written after each chunk, in the same request.
**Why:** a database state survives reloads and PHP timeouts. The unique key
makes re-runs idempotent and gives resume for free.
**Alternatives:** WordPress options (size limits, no unique key); Action
Scheduler/cron (not proven here, see Decision 5).

### 5. Execution: browser-driven chunks

Endpoints (all under the existing API namespace, admin capability only):

- `GET  /migration/sources` detect, version state, extensions.
- `POST /migration/scan` returns groups and counts. Read-only.
- `POST /migration/runs` creates a run from the selected groups.
- `POST /migration/runs/{id}/chunk` runs the next chunk of the next unfinished
  group (dependency order) and returns progress, so the browser needs no group
  logic.
- `GET  /migration/runs/{id}` state and report (used for resume).

Chunk size per group: 50 for light groups (taxonomies, customers, coupons), 30 for
products and orders (several inserts per row). One constant per group.
**Why:** matches the UI (live message), needs no cron, resumes from the saved
cursor. **Alternative:** cron queue (the tab can close, but cron is unreliable
on low-traffic sites). A hybrid can be a later change.

### 6. Relations through the id-map

Dependency order: taxonomies (categories, tags, brands, attributes and values)
then products then variants, then customers, then coupons, then orders, then
settings (independent, runs first or last by choice of the runner).
Mappers receive an `IdMap` and call `IdMap::resolve(entity, source_id)`.

- Product: category, tag, brand and attribute ids resolve through the map.
- Variation: parent product id resolves to the Kirki product, then the variant is
  created under it and linked as `variant`.
- Order: `_customer_user` / `customer_id` resolves to a Kirki customer. Line
  item `_product_id` / `_variation_id` resolve to Kirki product and variant.
  Coupon lines resolve by code through the `coupon` link.
- Unresolved link: the line is stored with the source name, SKU and price and
  without a product link. The report lists it.

### 7. Migration mode

A `MigrationMode` guard (a static flag, set for the length of one chunk request,
cleared in `finally`) is read by: mail jobs, inventory atomic updates, coupon
usage counting, and event dispatch. Imported rows pass their original
`created_at`, `paid_at`, number, and totals. The Kirki order calculation is NOT
re-run for imported orders: the source totals are stored as given.
**Alternative:** call raw models and bypass services. Rejected: services carry
rules (slugs, SKU uniqueness) that must still apply. The exact hook points are
found at apply time by listing every listener (task in `tasks.md`).

### 8. Clash handling and add-only

Slug, SKU and coupon code clashes get a numeric suffix (`-2`, `-3`) and a
report line. A customer is matched by email first, then reused. No Kirki row
is updated. A link in the id-map always wins (skip as "already migrated").

### 9. Images

Product images are WordPress attachments already. The mapper copies
the attachment id (`_thumbnail_id`, `_product_image_gallery`) into the Kirki
media link. No file is copied. **Check at apply:** Kirki media fields accept any
existing attachment id.

### 10. UI structure

`features/migration` has: a scan page (skeleton, group checklist, notices),
a run page (progress bar, status message), a summary page. The onboarding
completion screen shows the button when `GET /migration/sources` reports a
supported source. The run page takes the progress bar slot of the wizard
layout. A hook runs the loop: call `chunk` until `done` or error, then stop
and show "Resume". Status message text is built from the chunk response (group
label, range, total) with translatable strings (`translatable-js-strings`
spec).

### 11. Extensions

`ExtensionDetector` holds a list: plugin slug, label, status (`supported` or
`not_migrated`). Initial list: Subscriptions, Bookings, Memberships, Product
Bundles, Product Add-Ons, Composite Products (not migrated); Yoast SEO and
Rank Math (supported, SEO fields only). Detection is by active and installed
plugin slug.

## WooCommerce data structure (from published sources)

Sources: WooCommerce developer blog "High-Performance Order Storage: Database
Schema" (2022), WooCommerce GitHub wiki "Database Description", and the
`trunk` data store classes (`class-wc-product-data-store-cpt.php`,
`class-wc-product-variation-data-store-cpt.php`,
`class-wc-coupon-data-store-cpt.php`, `abstract-wc-order-data-store-cpt.php`,
`class-wc-order-data-store-cpt.php`, `class-wc-order-item-product-data-store.php`).

**Products.** Post type `product` (variations: `product_variation`, with
`post_parent`). Meta: `_sku`, `_regular_price`, `_sale_price`,
`_sale_price_dates_from/_to` (timestamps), `_price` (computed, ignore),
`_manage_stock`, `_stock`, `_stock_status`, `_backorders`,
`_low_stock_amount`, `_sold_individually`, `_weight`, `_length`, `_width`,
`_height`, `_virtual`, `_downloadable`, `_tax_status`, `_tax_class`,
`_thumbnail_id`, `_product_image_gallery` (comma list), `_product_attributes`
(serialized array: name, value, position, is_visible, is_variation,
is_taxonomy), `_variation_description`, `_global_unique_id`. Variation
attribute choice: meta `attribute_<name>`. Booleans use `yes`/`no`.
Taxonomies: `product_cat`, `product_tag`, `product_brand`,
`product_shipping_class`, `product_type`, `product_visibility`. Global
attributes: table `woocommerce_attribute_taxonomies` with term taxonomies named
`pa_<slug>`. Quick lookup table: `wc_product_meta_lookup`.

**Coupons.** Post type `shop_coupon` (`post_title` = code, `post_excerpt` =
description). Meta: `discount_type`, `coupon_amount`, `date_expires`
(timestamp, legacy `expiry_date`), `usage_count`, `usage_limit`,
`usage_limit_per_user`, `limit_usage_to_x_items`, `individual_use`,
`free_shipping`, `exclude_sale_items`, `minimum_amount`, `maximum_amount`,
`product_ids` and `exclude_product_ids` (comma strings), `product_categories`
and `exclude_product_categories` (arrays), `customer_email` (array), `_used_by`.

**Orders, HPOS.** `wc_orders` (`id`, `status`, `currency`, `type`,
`tax_amount`, `total_amount`, `customer_id`, `billing_email`,
`date_created_gmt`, `date_updated_gmt`, `parent_order_id`, `payment_method`,
`payment_method_title`, `transaction_id`, `ip_address`, `user_agent`,
`customer_note`); `wc_order_addresses` (one row per `address_type`:
`first_name`, `last_name`, `company`, `address_1`, `address_2`, `city`,
`state`, `postcode`, `country`, `email`, `phone`); `wc_order_operational_data`
(`created_via`, `prices_include_tax`, `order_key`, `date_paid_gmt`,
`date_completed_gmt`, `shipping_total_amount`, `shipping_tax_amount`,
`discount_total_amount`, `discount_tax_amount`, `order_stock_reduced`, ...);
`wc_orders_meta`. A placeholder row stays in `wp_posts`; order notes stay in
`wp_comments`. Refunds are rows with `type = shop_order_refund` and
`parent_order_id`.

**Orders, legacy.** Post type `shop_order` / `shop_order_refund`, status stored
as `wc-<status>` in `post_status`. Meta: `_order_total`, `_order_tax`,
`_order_shipping`, `_order_shipping_tax`, `_cart_discount`,
`_cart_discount_tax`, `_order_currency`, `_prices_include_tax`,
`_customer_user`, `_order_key`, `_billing_*`, `_shipping_*`, `_payment_method`,
`_payment_method_title`, `_transaction_id`, `_date_paid`, `_date_completed`,
`_refund_amount`. Customer note is in `post_excerpt`.

**Order items (both layouts).** `woocommerce_order_items` (`order_item_id`,
`order_item_name`, `order_item_type`, `order_id`) and
`woocommerce_order_itemmeta`. Line item meta: `_product_id`, `_variation_id`,
`_qty`, `_tax_class`, `_line_subtotal`, `_line_subtotal_tax`, `_line_total`,
`_line_tax`, `_line_tax_data`.

**Order notes.** `wp_comments` with `comment_type = order_note`
(`comment_post_ID` = order id); meta `is_customer_note`.

**Settings.** Options `woocommerce_currency`, `woocommerce_store_address`,
`woocommerce_store_city`, `woocommerce_default_country`,
`woocommerce_store_postcode`, `woocommerce_calc_taxes`,
`woocommerce_prices_include_tax`. Tax tables: `woocommerce_tax_rates`
(`tax_rate_country`, `tax_rate_state`, `tax_rate`, `tax_rate_name`,
`tax_rate_priority`, `tax_rate_compound`, `tax_rate_shipping`,
`tax_rate_class`), `woocommerce_tax_rate_locations`, `wc_tax_rate_classes`.
Shipping tables: `woocommerce_shipping_zones`,
`woocommerce_shipping_zone_locations`, `woocommerce_shipping_zone_methods`
(method settings are in options `woocommerce_<method>_<instance>_settings`).

**Checked against the published `trunk` source (task 4.4).** Confirmed word
for word: coupon discount types `percent`, `fixed_cart`, `fixed_product`;
attribute taxonomy prefix `pa_`; order item types `line_item`, `shipping`,
`tax`, `fee`, `coupon`; shipping item meta `method_id`, `instance_id`, `cost`,
`total_tax`, `taxes`; tax item meta `rate_id`, `label`, `compound`,
`tax_amount`, `shipping_tax_amount`, `rate_percent`; fee item meta
`_fee_amount`, `_tax_class`, `_tax_status`, `_line_total`, `_line_tax`,
`_line_tax_data`; coupon item meta `discount_amount`, `discount_amount_tax`;
refund meta `_refund_amount`, `_refund_reason`; order note comment type
`order_note`.

**Still not confirmed word for word:** the full list of order status keys
(source builds them from constants; the standard seven `wc-pending`,
`wc-processing`, `wc-on-hold`, `wc-completed`, `wc-cancelled`, `wc-refunded`,
`wc-failed` are used, and any other `wc-*` status is mapped to the nearest
Kirki status and reported), and the comment meta key `is_customer_note` (seen
only in a summarized part of `class-wc-order.php`). The mapper treats both
defensively. The fixtures in `tests/Support/Migration/BuildsWooCommerceFixtures.php`
follow the same published schema, so they check our code against our reading of
the schema, not against a live WooCommerce.

## Risks / Trade-offs

- [Raw SQL depends on source schema] -> Probes, Reader per layout, fixtures
  per version, unknown keys ignored.
- [Services have side effects not yet fully listed] -> Migration mode flag plus
  a task to list all listeners and test that nothing fires.
- [A chunk times out] -> Small chunks, keyset cursor saved per chunk, resume.
- [Imported totals differ from Kirki recalculation] -> Store source totals as
  given; do not recalculate imported orders.
- [Kirki cannot represent a source value (product type, discount type)] ->
  Skip with a reason in the report.
- [Settings overwrite onboarding choices] -> Show each overwritten value in the
  report; keep the group deselectable.
- [Browser tab closes mid-run] -> State is in the database; the merchant resumes.
- [Two runs at once] -> One active run; second start returns the active run.

## Migration Plan

1. Add the two tables through the existing migration mechanism.
2. Ship the engine and WooCommerce source behind the detection check (no
   WooCommerce, no UI).
3. Rollback: the feature is additive. Remove the onboarding button and routes.
   The two tables can stay. Migrated Kirki data is not deleted by rollback; the
   id-map allows a later cleanup tool.

## Open Questions

- Exact minimum WooCommerce version (default 7.0, confirm with fixtures).
- Final table names and whether to add an id-map cleanup tool later.
- Whether to add a WP-CLI command after the first release.

## Corrections during implementation

- **Source registration (Decision 2).** The first plan was to bind a
  `SourceRegistry` singleton in a service provider and register sources there.
  This does not work: controllers get their constructor dependencies from the
  router's own resolver (`Route::make`), which ignores container bindings, so a
  controller received a different, empty registry. The registry now builds its
  list from the `kirki_ecommerce_migration_sources` filter. Built-in sources add
  themselves through this filter, and other plugins can add a source the same way.
- **Original dates (Decision 7).** `Model::save` always sets `created_at` to the
  current time on insert, so imported records cannot keep their dates through
  `Model::create`. The order mapper sets the dates with a query-level update
  after insert (task 7.2).
- **Migration mode points (Decision 7).** Mail jobs run later, outside the
  migration window, so the guard sits where jobs are queued: the 14 event
  listeners. Stock and coupon-usage counting are guarded in `InventoryService`
  and `CouponService`. The migration also calls services directly, not
  `CreateOrderAction`, so `OrderPlacedEvent` is never fired.
- **Group order and the settings group (Decision 6).** Prices are stored as minor
  units of the Kirki base currency, so the base currency must be set before any
  product or order is converted. The settings group therefore runs first, and
  products and orders depend on it. When the merchant deselects settings, prices
  are converted with the current Kirki base currency and are not exchanged.
- **Custom attributes (Decisions 6 and 8).** A product-level (non-global) attribute
  in WooCommerce has no id, and an attribute that was not migrated has no link.
  Both are matched to a Kirki attribute by name, ignoring case, and created when
  none has that name. New values are added to a matched attribute; no existing
  attribute or value is changed. This is the one place where the migration adds
  rows under an existing Kirki record, and it is limited to attribute values.
- **Product and variant links (Decision 6).** `product` links a WooCommerce product
  id to a Kirki product. `variant` links a variation id to its variant. A simple
  product's single default variant is linked under the product's own source id,
  because WooCommerce post ids are unique across products and variations. Order
  items use the same two links.
- **Variation attributes.** Only attributes marked "used for variations" become
  Kirki product attributes. Display-only attributes, product dimensions, upsells
  and product types other than simple and variable are not migrated; grouped and
  external products are skipped with a reason. A variation that accepts "any" value
  of an attribute is saved without that attribute and a note is added.
- **Nested transactions.** The framework starts transactions with `START TRANSACTION`,
  which commits the open one. Each row runs in its own transaction, so groups call
  the services and not the actions or services that open their own transaction
  (the attribute service does, so the attributes group saves through the models).
- **States are not migrated (settings).** Kirki's state list has its own numeric ids
  and no ISO codes, and WooCommerce names states by code. A state cannot be matched
  without WooCommerce's own state list, so a tax rate for a state is skipped, a
  state, continent or postcode location of a shipping zone is left out, and a zone
  with no whole-country location is skipped. The same rule as for coupons holds: a
  rule that cannot be kept exactly is skipped and reported, never widened.
- **Settings apply as add-only (settings).** Empty Kirki settings are filled. A
  filled one is kept and, when it differs, reported. The store currency is the one
  exception: it follows WooCommerce when Kirki has no products or orders, because
  prices are converted in it, and it is kept (with a note) otherwise. Tax regions
  and shipping zones are added to the lists in the settings. A tax region that the
  merchant made in Kirki is not changed.
- **Shipping zones, not shipping profiles.** Kirki keeps zones and methods in the
  shipping settings, and shipping profiles are rule sets for conditions, so the
  mapper writes zones. WooCommerce shipping classes are not migrated.
- **Settings items.** The settings group is one list with growing numbers (store 1,
  tax rate 10,000,000 + id, shipping zone 20,000,000 + id), so the same chunk and
  cursor flow applies to it.
