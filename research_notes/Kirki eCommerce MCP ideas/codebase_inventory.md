# Kirki eCommerce codebase inventory for MCP tools, resources and prompts

All sources are files in the repository `/Users/ahamed/development/ollyo/wordpress/kirki-ecommerce` (paths are relative to it). Every admin REST route is under the namespace `kirki/ecommerce/v1` and sits in one route group guarded by `AuthMiddleware` + `AdminMiddleware`; `AdminMiddleware` lets a request pass only when `is_user_logged_in() && current_user_can('manage_options')`. No admin controller has its own per-route capability check. — [routes/api.php](routes/api.php); [vendor/libraries/framework/src/Middlewares/AdminMiddleware.php](vendor/libraries/framework/src/Middlewares/AdminMiddleware.php)

## Q1. Which entities exist (models / tables), and which do not?

### Takeaway
The store has a full catalog (products → variants with stock, attributes, categories, tags, brands, collections, product schemas), orders with items, coupons, taxes, refunds and an activity timeline, customers with addresses, carts, wishlists, currencies, tax/shipping profiles and shipping boxes. Shipping zones, tax regions, payment gateways, offline payment methods, email templates and legal consents are **not tables**: they live in WordPress options (settings JSON). There are **no** reviews, subscriptions, digital downloads, customer groups (UI only), or abandoned-cart features.

### Cited Findings
**Tables (one migration per table, prefix `kirki_ecommerce_`)** — [database/migrations/](database/migrations/)
- `products`: title, slug, status, ribbon, ribbon_color, short_description, additional_info, seo_*/og_*, has_variants, published_at, trashed_at, scheduled_at — [database/migrations/CreateProductsTable.php](database/migrations/CreateProductsTable.php). Product status values: draft, published, scheduled, trashed — [app/Constants/Product/ProductStatus.php](app/Constants/Product/ProductStatus.php). The API resource also returns `description`, brand, categories, tags, collections, attributes, variants, media, preview_url — [app/Resources/Product/ProductResource.php](app/Resources/Product/ProductResource.php).
- `variants` (the stock-keeping unit; inventory lives here): sku, barcode, base_price, base_sale_price, base_cost_of_goods, unit pricing fields, weight/weight_unit, charge_taxes, allow_back_order, track_inventory, available_quantity, in_stock, committed_quantity, low_stock_threshold, has_limit_per_order, max_per_order, is_visible, is_physical_product, is_default — [database/migrations/CreateVariantsTable.php](database/migrations/CreateVariantsTable.php). Availability statuses: in_stock, low_stock, out_of_stock, partially_stocked — [app/Constants/Product/AvailabilityStatus.php](app/Constants/Product/AvailabilityStatus.php).
- Catalog taxonomy: `categories` (level, ordering, is_active, is_deletable), `tags`, `brands` (website_url, is_active), `collections` (+ translations), `attributes` / `attribute_values` (value, color), pivot tables `category_product`, `product_tags`, `collection_product`, `attribute_product`, `attribute_value_product`, `attribute_value_variant`, `media_product`, plus `product_schemas` (name, is_default, schema), `product_translations`, `attribute_translations`, `languages` — [database/migrations/](database/migrations/).
- `orders`: order_number, invoice_number, order_status, fulfillment_status, payment_status, is_manual, is_refund_initiated, currency_code / base_currency_code / exchange_rate, invoiced_* and base_* money columns (subtotal, shipping, discount, tax, total), tax_id_number, reverse_charge, tax_destination, payment_provider, payment_transaction_id, payment_provider_fee, shipping_method, shipping_carrier / tracking_number / tracking_url, shipping_* and billing_* address, customer_* contact, order_notes, flags, cancellation_reason, paid_at, shipped_at, cancelled_at, fulfilled_at, estimated_delivery_date, delivered_at, archived_at — [database/migrations/CreateOrdersTable.php](database/migrations/CreateOrdersTable.php).
- `order_items` (product_name, variant_name, sku, prices/catalog prices/discounts/tax in invoiced_ and base_, quantity, weight, product_data snapshot), `order_taxes` (type, name, rate, amounts), `order_coupons` (code, coupon_snapshot, discount amounts, usage_reversed_at), `order_item_coupons`, `order_activities` (activity_type, description, metadata) — [database/migrations/CreateOrderItemsTable.php](database/migrations/CreateOrderItemsTable.php); [database/migrations/CreateOrderTaxesTable.php](database/migrations/CreateOrderTaxesTable.php); [database/migrations/CreateOrderCouponsTable.php](database/migrations/CreateOrderCouponsTable.php); [database/migrations/CreateOrderActivitiesTable.php](database/migrations/CreateOrderActivitiesTable.php).
- `refunds`: order_id, status (pending, completed, failed, cancelled), invoiced_amount (cents, order currency), reason, refund_type (partial, full), refund_id (gateway), created_by/updated_by — [database/migrations/CreateRefundsTable.php](database/migrations/CreateRefundsTable.php). There is no separate "returns" entity; "returned" is a fulfillment status — [app/Constants/Order/FulfillmentStatus.php](app/Constants/Order/FulfillmentStatus.php).
- `customers`: first_name, last_name, email, phone, accepts_marketing, notes, tags (+ user_id link to WP user) — [database/migrations/CreateCustomersTable.php](database/migrations/CreateCustomersTable.php). `addresses`: names, city, state, country, postal_code, email, phone, type, label, is_default_shipping, is_default_billing — [database/migrations/CreateAddressesTable.php](database/migrations/CreateAddressesTable.php). Customer resource exposes computed `orders_count`, `base_amount_spent`, `last_order_date`, `location`, `addresses` — [app/Resources/Customer/](app/Resources/Customer/); computed via `with_count('orders')`, `with_sum(paid base_total)`, `with_max(created_at)` in [app/Services/CustomerService.php](app/Services/CustomerService.php).
- `coupons`: method (code / automatic), discount_type (amount-off, free-shipping, buy-x-get-y), discount_target (order / products), value type, amounts, eligible_item_type, spend condition, reward qty/value, end datetime, target countries, first_time_buyer_only, include/exclude customer eligibility, usage_limit, customer_limit, current_usage_count, is_active, combinations; pivots `coupon_products` (is_reward_item), `coupon_categories`, `coupon_customers` (is_excluded) — [database/migrations/CreateCouponsTable.php](database/migrations/CreateCouponsTable.php); [app/Constants/Coupon/](app/Constants/Coupon/). Coupon status values: active, scheduled, inactive, expired — [app/Constants/Coupon/CouponStatus.php](app/Constants/Coupon/CouponStatus.php).
- `currencies`: code, name, symbol, exchange_rate, is_base, is_active — [database/migrations/CreateCurrenciesTable.php](database/migrations/CreateCurrenciesTable.php).
- `tax_profiles`, `shipping_profiles` (name, is_default only — rules reference them), `shipping_boxes` (dimensions, unit, is_default) — [database/migrations/CreateTaxProfilesTable.php](database/migrations/CreateTaxProfilesTable.php); [database/migrations/CreateShippingProfilesTable.php](database/migrations/CreateShippingProfilesTable.php); [database/migrations/CreateShippingBoxesTable.php](database/migrations/CreateShippingBoxesTable.php).
- `carts` (customer_email, cart_token, currency, shipping_method, items_count, addresses, order_notes, expires_at), `cart_items`, `cart_coupons`; `wishlist` (user_id, variant_id) — [database/migrations/CreateCartsTable.php](database/migrations/CreateCartsTable.php); [database/migrations/CreateWishlistTable.php](database/migrations/CreateWishlistTable.php).
- Queue tables `jobs`, `failed_jobs` — [database/migrations/CreateJobsTable.php](database/migrations/CreateJobsTable.php).
- Models mirror the tables: Address, Attribute, AttributeValue, Brand, Cart, CartCoupon, CartItem, Category, Collection, Coupon, Currency, Customer, Order, OrderActivity, OrderCoupon, OrderItem, OrderItemCoupon, OrderTax, Page, Post, PostMeta, Product, ProductSchema, Refund, ShippingBox, ShippingProfile, Tag, TaxProfile, Term*, Variant, Wishlist — [app/Models/](app/Models/).

**Option-stored (non-table) entities** — [resources/data/settings/](resources/data/settings/)
- Shipping zones: `shipping.shipping_zones` list — [resources/data/settings/shipping.json](resources/data/settings/shipping.json). Method types: flat_rate, local_pickup, weight — [app/Constants/ShippingMethodTypes.php](app/Constants/ShippingMethodTypes.php). Rules use a decision engine with conditions (tax_profile, destination_region, cart_weight, cart_subtotal, shipping_profile, product_categories) and actions (set/add/multiply shipping cost, set_free_shipping, disable_shipping_method, set_product_tax_rate, set_shipping_tax_rate, set_product_tax_exempt) — [config/decisions.php](config/decisions.php); [app/Decisions/](app/Decisions/).
- Tax regions / services / tax IDs: `tax.tax_regions`, `tax_services`, `tax_ids`, `is_tax_inclusive_price`, `is_shipping_tax_enabled` — [resources/data/settings/tax.json](resources/data/settings/tax.json). Strategies: EU and DEFAULT — [config/tax-strategies.php](config/tax-strategies.php); [app/Tax/Strategies/](app/Tax/Strategies/).
- Payment gateways: `payment.payment_gateways` — [resources/data/settings/payment.json](resources/data/settings/payment.json). Core provider PayPal — [app/Payment/Providers/PayPal.php](app/Payment/Providers/PayPal.php). Separate add-on plugins under `payments/` (Stripe, Authorize.net, Razorpay, Mollie, Klarna, Square, Paystack, PayU, Quickpay, Redsys, Paddle, Payfast, Paymongo, Eway, 2Checkout) — [payments/payments.json](payments/payments.json); [payments/kirki-stripe/kirki-stripe.php](payments/kirki-stripe/kirki-stripe.php). Offline methods (name, instructions, icon, is_enabled, config) — [app/Services/OfflinePaymentService.php](app/Services/OfflinePaymentService.php).
- Legal consents: `legal.consents` — [resources/data/settings/legal.json](resources/data/settings/legal.json); [docs/legal-consents.md](docs/legal-consents.md).
- Store pages (shop, cart, checkout, account) are WP pages — [app/Constants/PageKeys.php](app/Constants/PageKeys.php); [app/Services/PageService.php](app/Services/PageService.php).

**Absent features (searched, not found)**
- Reviews: only setting flags `is_enabled_reviews`, `is_enabled_star_ratings` exist; no review table/model/service — [resources/data/settings/product.json](resources/data/settings/product.json); [app/Models/](app/Models/).
- Subscriptions and digital downloads: no table, model or service matches "subscription", "downloadable" or "digital_download" in `app/` or `database/` (grep). Variants have only an `is_physical_product` flag — [database/migrations/CreateVariantsTable.php](database/migrations/CreateVariantsTable.php).
- Customer groups: an admin page exists (`/customers/groups`, "Create Group" button, table component) but no backend route, table or service — [resources/app/features/customers/pages/customer-groups.tsx](resources/app/features/customers/pages/customer-groups.tsx); [resources/app/config/route-config.ts](resources/app/config/route-config.ts); [routes/api.php](routes/api.php).
- Abandoned carts: carts carry `customer_email` and `expires_at`, but there is no admin cart route, no recovery email and no "abandon" code in `app/` (grep) — [database/migrations/CreateCartsTable.php](database/migrations/CreateCartsTable.php); [app/Services/CartService.php](app/Services/CartService.php).

### Inferences
- Read tools for "inventory" must work at the variant level (stock fields are on `variants`), and roll up to product via `AvailabilityService::resolve_product_status` ([app/Services/AvailabilityService.php](app/Services/AvailabilityService.php)).
- Abandoned-cart reporting could be built as a read-only query over `carts` with `customer_email` and no order, but it would be a new query, not a wrapper.
- Shipping zones and tax regions can only be read/written through the settings get/update path (Q4), not through entity CRUD.

### Gaps
- I did not read the full JSON shape of a shipping zone or a tax region item (only top-level keys).
- `BrandPolicy` exists ([app/Policies/BrandPolicy.php](app/Policies/BrandPolicy.php)) but I found no `authorize()` use of it in controllers; its effect is unverified.

## Q2. Which admin REST routes exist, what do they do, and how are they guarded?

### Takeaway
About 150 admin routes cover CRUD + bulk actions for every catalog entity, customers, coupons, orders (incl. refunds, actions, activity notes), currencies, tax/shipping profiles, boxes, payment methods, settings, analytics, dashboard and the setup checklist. All share the single `manage_options` gate; risk control lives in actions/services (transactions, row locks, state matrix), not in capabilities.

### Cited Findings
All routes below are in [routes/api.php](routes/api.php); controllers in [app/Http/Controllers/Api/](app/Http/Controllers/Api/).

**List conventions.** List endpoints accept `search`, `page`, `limit` (default 10; `-1` = all), `sort_by`, `sort_order`, `from_date`, `to_date` — [app/DTO/ListFilterDTO.php](app/DTO/ListFilterDTO.php); [app/Constants/Pagination.php](app/Constants/Pagination.php); [app/Http/Controllers/Api/OrderController.php](app/Http/Controllers/Api/OrderController.php). Bulk endpoints take `action` ∈ delete, delete-all, trash, trash-all, restore, restore-all and `ids[]` — [app/Http/Requests/BulkActionRequest.php](app/Http/Requests/BulkActionRequest.php); [app/Constants/BulkActions.php](app/Constants/BulkActions.php).

| Area | Read | Write | Extra filters / notes |
|---|---|---|---|
| Orders | `GET /orders`, `GET /orders/{id}` | `POST /orders` (manual order), `PUT /orders/{id}` (edit items/addresses/coupons), `DELETE /orders/{id}`, `POST /orders/bulk`, `PATCH /orders/{id}/action`, `POST /calculate/order` (preview totals, no save) | Filters: customer_id, status (list status: order-placed, order-processing, order-on-hold, order-shipped, order-delivered, order-returned, order-cancelled, payment-failed, refund-*), fulfillment_status, payment_status, shipping_method; search over order_number, customer_email, shipping names — [app/Http/Requests/Order/OrderListRequest.php](app/Http/Requests/Order/OrderListRequest.php); [app/Constants/Order/OrderListStatus.php](app/Constants/Order/OrderListStatus.php); [app/Services/OrderService.php](app/Services/OrderService.php) (`list_query`) |
| Refunds | (inside order resource `refunds`) | `POST /orders/{order_id}/refunds`, `PUT …/refunds/{id}` (amount, reason, status), `DELETE …/refunds/{id}` | [app/Http/Requests/Order/RefundCreateRequest.php](app/Http/Requests/Order/RefundCreateRequest.php); [app/Http/Requests/Order/RefundUpdateRequest.php](app/Http/Requests/Order/RefundUpdateRequest.php) |
| Order notes / timeline | `GET /orders/{order_id}/activities` | `POST …/activities` (message, notify_customer), `DELETE …/activities/{id}` (comment only) | [app/Http/Controllers/Api/OrderActivityController.php](app/Http/Controllers/Api/OrderActivityController.php); [app/Services/OrderActivityService.php](app/Services/OrderActivityService.php) |
| Products | `GET /products`, `GET /products/{id}`, `GET /product-variants` (products with variants) | `POST /products`, `PUT /products/{id}`, `DELETE /products/{id}`, `POST /products/bulk` (delete/trash/restore), `POST /products/{id}/duplicate` | Filters: category_ids, brand_id, collection_id, availability_status, status (+ DTO has min_price, max_price, attribute_value_ids, brand_ids) — [app/Http/Requests/Product/ProductListRequest.php](app/Http/Requests/Product/ProductListRequest.php); [app/DTO/Product/ProductListFilterDTO.php](app/DTO/Product/ProductListFilterDTO.php) |
| Variants / inventory | `GET /variants`, `GET /variants/{id}`, `GET /variants/bulk/{ids}` | `PUT /variants/{id}`, `PUT /variants/bulk` (price, sale price, cost, stock qty, in_stock, thresholds, limits, profiles, visibility), `POST /variants/generate-sku(s)` | Filters: category_ids, brand_id, collection_id, inventory_type (in_stock / out_of_stock), status — [app/Http/Requests/Variant/VariantListRequest.php](app/Http/Requests/Variant/VariantListRequest.php); [app/Http/Requests/Variant/BulkUpdateVariantRequest.php](app/Http/Requests/Variant/BulkUpdateVariantRequest.php) |
| Customers | `GET /customers`, `GET /customers/{id}`, `GET /customers/locations`, `GET /customers/check-email` | `POST /customers` (optional `create_wordpress_user`, addresses, tags, notes), `PUT /customers/{id}`, `DELETE /customers/{id}`, `POST /customers/bulk` | Filters: country, city — [app/Http/Requests/Customer/CustomerListRequest.php](app/Http/Requests/Customer/CustomerListRequest.php); [app/Http/Requests/Customer/CustomerCreateRequest.php](app/Http/Requests/Customer/CustomerCreateRequest.php) |
| Coupons | `GET /coupons`, `GET /coupons/{id}`, `GET /coupons/generate-new-code`, `GET /coupons/validate` | `POST /coupons`, `PUT /coupons/{id}`, `DELETE /coupons/{id}`, `POST /coupons/bulk`, `PATCH /coupons/{id}/action` (duplicate / activate / deactivate) | Filters: status, method, discount_type — [app/Http/Requests/Coupon/CouponListRequest.php](app/Http/Requests/Coupon/CouponListRequest.php); [app/Http/Controllers/Api/CouponController.php](app/Http/Controllers/Api/CouponController.php) |
| Categories, Tags, Brands, Collections, Attributes (+ values incl. `batch`), Product schemas | list + show | create, update, delete, bulk | Category delete refuses `is_deletable = false` — [app/Services/CategoryService.php](app/Services/CategoryService.php) |
| Currencies | `GET /currencies`, `/currencies/list`, `/currencies/{id}`, `GET /currency-exchange/providers` | `POST /currencies`, `PUT /currencies`, `DELETE /currencies/{id}`, bulk, `POST /currency-exchange/sync` | Providers: CurrencyApi, ExchangeRatesApi — [app/Currency/Providers/](app/Currency/Providers/) |
| Tax profiles, Shipping profiles, Shipping boxes | list + show; `GET /shipping-methods` | create, update, delete, bulk | — |
| Payment methods | `GET /payment-methods`, `GET /online-payments`, `/online-payments/{id}`, `/online-payments/installable`, `GET /offline-payments`, `/offline-payments/{id}` | `PUT /payment-methods/order` (reorder), `POST /online-payments/install`, `PUT/PATCH /online-payments/{id}` (config / enable), offline create/update/enable/delete | Installable list is a stub — [app/Services/OnlinePaymentService.php](app/Services/OnlinePaymentService.php) (`@todo` at line 46) |
| Settings | `GET /settings/{key}` (key ∈ general, product, shipping, payment, tax, checkout, currency, email, advance, legal, …), `GET /settings/email/{type}/{group}/{key}/preview` | `PUT /settings`, `POST …/preview/test-mail`, `POST …/restore` (template) | [app/Http/Controllers/Api/SettingsController.php](app/Http/Controllers/Api/SettingsController.php); [app/Constants/OptionKeys.php](app/Constants/OptionKeys.php); [app/Http/Controllers/Api/EmailTemplateController.php](app/Http/Controllers/Api/EmailTemplateController.php) |
| Analytics | `GET /analytics/metrics/{key}`, `GET /analytics/regions?country=` | — | [app/Http/Controllers/Api/AnalyticsController.php](app/Http/Controllers/Api/AnalyticsController.php) |
| Dashboard / setup | `GET /dashboard/overview`, `GET /setup-checklist`, `GET /app-config`, `GET /countries`, `GET /pages` | `POST /setup-checklist/{step}/complete`, `POST /onboarding`, `POST /onboarding/sample-data`, `POST /pages/fix` | Overview = all-time metrics, recent_orders, top_products — [app/Services/DashboardService.php](app/Services/DashboardService.php); checklist steps products, payments, tax, shipping — [app/Services/SetupChecklistService.php](app/Services/SetupChecklistService.php) |

- Non-admin routes: payment webhooks (`/payment/webhook/{provider_id}`), storefront cart/checkout (throttled 10/min), `/shop/products`, and `account/*` self-service (orders, profile, password, addresses, wishlist) behind `AuthMiddleware` only — [routes/api.php](routes/api.php).
- Order actions: mark-as-processing, mark-as-shipped, mark-as-delivered, mark-as-hold, cancel-fulfillment, resume-fulfillment, add-tracking (carrier, tracking_number, tracking_url), mark-as-paid (payment_provider), send-payment-link, send-invoice, initiate/approve/decline refund, mark-refund-complete, cancel-order (reason), archive-order, resend-order-email — [app/Constants/Order/OrderAction.php](app/Constants/Order/OrderAction.php); [app/Http/Requests/Order/OrderActionRequest.php](app/Http/Requests/Order/OrderActionRequest.php).
- The admin React app has pages for Home, Products (+ create/edit, bulk variant editor), Inventory, Coupons, Orders (list, create, detail), Analytics, Collections, Tags, Categories, Brands, Customers (+ groups, detail), and Settings (general, products, payments, shipping zones/methods, currency, tax regions incl. EU and states, email templates, checkout, essentials, variations, advanced, legal) — [resources/app/config/route-config.ts](resources/app/config/route-config.ts). The order UI calls every implemented action string — [resources/app/features/orders/](resources/app/features/orders/).

### Inferences
- An MCP tool layer can reuse the same Request validation classes and Action/Service classes as the controllers (as `SalesReportTool` already reuses `AnalyticsQueryService` + validator rules).
- Since every admin route uses only `manage_options`, MCP tools that need finer roles (for example "shop manager") would need a new capability concept; none exists today.

### Gaps
- I did not read each controller body for the minor entities (tags, brands, attributes, schemas, boxes); I assumed standard CRUD from route names and service method names.

## Q3. Which analytics metrics exist, and which does the current MCP tool not expose?

### Takeaway
`AnalyticsQueryService::get_metric()` supports 16 metric keys plus a regions drill-down; the MCP `SalesReportTool` uses only `kpis` and `total_sales_breakdown`. Fourteen metric keys and `get_regions()` are unexposed, as is the Home dashboard overview.

### Cited Findings
- `METRIC_KEYS`: kpis, total_sales_over_time, total_sales_breakdown, sales_by_product, sales_by_category, average_order_value_over_time, orders_over_time, orders_by_fulfillment_status, new_vs_returning_customers, sales_by_coupon_code, orders_by_time_of_day, sales_by_location, sales_by_payment_method, taxes_by_region, shipping_charges_by_method, inventory_health — [app/Services/AnalyticsQueryService.php](app/Services/AnalyticsQueryService.php) (lines 50–67).
- Window metrics (with series and comparison): kpis, total_sales_over_time, total_sales_breakdown, average_order_value_over_time, orders_over_time, new_vs_returning_customers — same file, lines 69–76.
- `kpis` returns eleven cards: gross_sales, orders, average_order_value, returning_customer_rate, net_sales, total_sales, items_ordered, discounts, new_customers, customers, shipping charges, each with current/previous/change/series — same file, `build_kpis` (line 1043); [docs/analytics.md](docs/analytics.md) section 4.
- Range metric limits: top 5 products (`PRODUCT_LIMIT`), top 6 categories (`CATEGORY_LIMIT`), top 5 lists (`LIST_LIMIT`), 4 lowest-stock variants (`LOWEST_STOCK_LIMIT`) — [app/Services/AnalyticsQueryService.php](app/Services/AnalyticsQueryService.php) lines 38–44.
- `inventory_health` returns counts out_of_stock / low_stock / in_stock plus `lowest` variants (variant_id, product_id, product_name, variant_name, available_quantity, status); it ignores the date range — same file, `build_inventory_health` (line 2194).
- `get_regions(params+country)` gives the top regions of one country by sales, orders, customers — same file, line 256; route `GET /analytics/regions`.
- Range presets: today, yesterday, last_7, last_30, last_90, last_12_months, month_to_date, year_to_date, custom; comparisons previous_period, previous_year, custom, none; granularity day ≤31 days, week ≤186, else month — [app/Services/AnalyticsRangeResolver.php](app/Services/AnalyticsRangeResolver.php).
- `SalesReportTool` calls only `get_metric('kpis')` and `get_metric('total_sales_breakdown')`, outputs money totals, AOV, orders, items_ordered, customers, new_customers and a total_sales/orders series. It omits `returning_customer_rate` although `kpis` has it — [app/Mcp/Tools/SalesReportTool.php](app/Mcp/Tools/SalesReportTool.php) (`MONEY_TOTALS`, `COUNT_TOTALS`).
- docs/mcp.md lists the gaps itself: no sales by product, category, coupon, location, payment method, time of day, no tax/shipping breakdowns, no returning customer rate, no inventory health, no per-metric series — [docs/mcp.md](docs/mcp.md) section 7.
- Counting rules: sales = payment_status paid/refunding/refunded dated by paid_at; orders = every non-failed order by created_at; returns = completed refunds by updated_at; old-base-currency orders excluded — [docs/analytics.md](docs/analytics.md) section 3.
- Home dashboard overview (all-time, counted orders only): base_total_sales, base_net_sales, orders_count, products_sold, recent_orders, top_products (units_sold, base_revenue, availability) — [app/Services/DashboardService.php](app/Services/DashboardService.php); [docs/home.md](docs/home.md) section 7. Its net sales differs from Analytics — [docs/analytics.md](docs/analytics.md) section 7.

**Not exposed by MCP today:** total_sales_over_time, average_order_value_over_time, orders_over_time, new_vs_returning_customers, sales_by_product, sales_by_category, orders_by_fulfillment_status, sales_by_coupon_code, orders_by_time_of_day, sales_by_location, sales_by_payment_method, taxes_by_region, shipping_charges_by_method, inventory_health, get_regions, returning_customer_rate field, dashboard overview.

### Inferences
- One generic "analytics metric" tool (key enum + same range args) or a few grouped tools (product/category, channel: coupon/payment/shipping, geography + regions, customers, inventory health) could wrap the existing service with zero new queries.
- Top-N limits are constants, so "top 20 products" questions cannot be answered without a new parameter.

### Gaps
- Analytics has no export and no sessions/conversion data — [docs/analytics.md](docs/analytics.md) section 8 — so such MCP requests cannot be served from existing code.

## Q4. What settings exist?

### Takeaway
Ten settings groups are stored as WordPress options layered over JSON defaults, read with `GET /settings/{key}` and written with `PUT /settings` (validated by one large request class, fires `SettingsChangedEvent`).

### Cited Findings
- Mechanism: `AppSettings` merges the stored option over `resources/data/settings/{key}.json`; `set()` saves and dispatches `SettingsChangedEvent` — [app/AppSettings.php](app/AppSettings.php); [app/Settings/SettingsFactory.php](app/Settings/SettingsFactory.php); validation in [app/Http/Requests/Settings/SettingsUpdateRequest.php](app/Http/Requests/Settings/SettingsUpdateRequest.php).
- general: store_name, industry, store_logo, store_email, store_phone, store_address, store_tax_id, selling_location_type, selling_countries, order_number prefix/suffix, invoice_number prefix/suffix/sequence/apply_year_prefix/reset_sequence_every_year, is_tax_calculation_enabled — [resources/data/settings/general.json](resources/data/settings/general.json).
- product: shop_page, weight_unit, dimension_unit, display_layout, is_enabled_reviews, is_enabled_star_ratings, is_unit_price_visible, low_stock_threshold — [resources/data/settings/product.json](resources/data/settings/product.json).
- checkout: is_allowed_guest_checkout, field validation modes (address line, phone, company, company ID, VAT ID), has_apply_coupon_code, show_customer_note — [resources/data/settings/checkout.json](resources/data/settings/checkout.json).
- currency: currency_format, currency_position, separators, is_automatic_update_enabled, api_provider, last_sync_at, next_sync_at, api_configs — [resources/data/settings/currency.json](resources/data/settings/currency.json).
- tax: is_tax_inclusive_price, is_enabled_display_inclusive_taxed_price (persisted, no backend consumer yet — [app/Http/Requests/Settings/SettingsUpdateRequest.php](app/Http/Requests/Settings/SettingsUpdateRequest.php) line 586), is_shipping_tax_enabled, tax_regions, tax_services, tax_ids — [resources/data/settings/tax.json](resources/data/settings/tax.json).
- shipping: shipping_zones — [resources/data/settings/shipping.json](resources/data/settings/shipping.json). payment: payment_gateways — [resources/data/settings/payment.json](resources/data/settings/payment.json). legal: consents — [resources/data/settings/legal.json](resources/data/settings/legal.json). advance: empty defaults — [resources/data/settings/advance.json](resources/data/settings/advance.json).
- email: default_template (logo, height, position, colors, additional_description, footer) and per-notification `is_enabled, subject, heading, message, shortcodes` — [resources/data/settings/email.json](resources/data/settings/email.json); [app/Settings/EmailSettings.php](app/Settings/EmailSettings.php).
- Other option keys: erase_upon_uninstall, last_invoice_number(+reset year), onboarding_completed_at, setup_checklist, presets_applied_at — [app/Constants/OptionKeys.php](app/Constants/OptionKeys.php).

### Inferences
- Settings fit MCP **resources** well (static URIs like `kirki://settings/general`), since the framework Resource has a fixed `$uri` (see Q8). Writes through `PUT /settings` replace a whole group, which is risky for an AI client; a tool would need narrow per-field writes.
- The payment group includes provider API credentials (`api_configs` in currency, provider configs in payment — `merge_provider_configs` in [app/Http/Controllers/Api/SettingsController.php](app/Http/Controllers/Api/SettingsController.php)); any read resource should redact secrets.

### Gaps
- I did not verify which fields in payment settings hold secrets, nor whether `GET /settings/payment` already masks them.

## Q5. What emails, notifications and background jobs exist?

### Takeaway
Seventeen transactional emails (11 customer, 6 admin) are driven by domain events and sent through queued jobs; two more jobs publish scheduled products and sync exchange rates. "Send invoice" and "send payment link" are declared actions with no implementation.

### Cited Findings
- Customer mails: new order, order cancelled, payment failed, on hold, processing, shipped, completed (delivered), order note, reset password, new account, email confirmation — [app/Mails/Customers/](app/Mails/Customers/). Admin mails: new order, order cancelled, payment failed, low stock, out of stock, reset password — [app/Mails/Admins/](app/Mails/Admins/). Trigger table — [docs/emails.md](docs/emails.md) section 2.
- Events → listeners: OrderPlaced, OrderProcessing, OrderOnHold, OrderShipped, OrderDelivered, OrderCancelled, OrderPaymentFailed, OrderNoteAdded, VariantsLowStock, VariantsOutOfStock, CustomerAccountCreated, CustomerPasswordResetRequested, AddressUpdated, SettingsChanged — [app/Events/](app/Events/); [app/Listeners/](app/Listeners/).
- Jobs: SendOrderMailJob, SendUserMailJob, SendInventoryMailJob, PublishScheduledProductJob (dispatched with delay = scheduled_at in [app/Services/ProductService.php](app/Services/ProductService.php) lines 172, 241), SyncExchangeRatesJob (dispatched and re-scheduled in [app/Currency/CurrencyExchangeManager.php](app/Currency/CurrencyExchangeManager.php) lines 187, 242) — [app/Jobs/](app/Jobs/). Queue config: batch 10, time limit 20 s, retry_after 300, tries 1 — [config/queue.php](config/queue.php).
- `resend_order_email` re-dispatches CustomerNewOrderMail; `send_invoice_email` and `send_payment_link` return `false` with `@todo` — [app/Managers/OrderManager.php](app/Managers/OrderManager.php) lines 680–720.
- Admin can preview a template, send a test mail, and restore a template to default — [routes/api.php](routes/api.php); [app/Services/EmailPreviewService.php](app/Services/EmailPreviewService.php).
- Adding a note with `notify_customer` sends the customer order-note email — [app/Http/Controllers/Api/OrderActivityController.php](app/Http/Controllers/Api/OrderActivityController.php) line 95; [docs/emails.md](docs/emails.md) section 6.

### Inferences
- Any MCP tool that changes order state will send customer emails as a side effect (via events). Tool descriptions must say so, and the `destructive`/`open_world` hints should reflect it.
- The `jobs` and `failed_jobs` tables could back a read-only "queue health / failed emails" resource, but no service reads them today.

### Gaps
- I did not check whether a service lists failed jobs; none appears in `app/Services/`.

## Q6. Which docs in docs/ describe features?

### Takeaway
Fifteen feature docs plus a Bruno API collection in `docs/ecommerce/`.

### Cited Findings
- [docs/analytics.md](docs/analytics.md) — Analytics page: 11 KPIs, 15 cards, counting rules, limits, differences from other analytics.
- [docs/concurrency.md](docs/concurrency.md) — race guarantees for stock, coupons, refunds, order state, invoice numbers; what is not guarded.
- [docs/currencies.md](docs/currencies.md) — shopper currencies, exchange rates, base-currency storage, automatic sync.
- [docs/data-table.md](docs/data-table.md) — admin shared list table (paging, sorting, filters, bulk actions).
- [docs/emails.md](docs/emails.md) — transactional emails, triggers, duplicate protection, background delivery, customer-visible notes.
- [docs/home.md](docs/home.md) — Home page: setup checklist, sample data, all-time store overview, REST API.
- [docs/legal-consents.md](docs/legal-consents.md) — merchant-defined consents shown at checkout etc.
- [docs/mcp.md](docs/mcp.md) — MCP server, sales report tool, time zone, adding a tool, differences from Analytics.
- [docs/onboarding.md](docs/onboarding.md) — 3–4 step setup wizard.
- [docs/order-data-and-calculations.md](docs/order-data-and-calculations.md) — how prices become order totals and where each number is stored.
- [docs/payments.md](docs/payments.md) — online/offline payment methods, ordering, order API, third-party methods.
- [docs/settings-search.md](docs/settings-search.md) — settings sidebar content search.
- [docs/tax-destination.md](docs/tax-destination.md) — `orders.tax_destination`, which address tax was calculated from.
- [docs/translations.md](docs/translations.md) — PHP/JS string translation pipeline.
- [docs/ecommerce/README.md](docs/ecommerce/README.md) — Bruno API client collection with request samples per resource (orders, products, customers, coupons, settings, …) — [docs/ecommerce/](docs/ecommerce/).

### Inferences
- `docs/ecommerce/` request samples are a ready reference for payload shapes when designing MCP tool schemas.

### Gaps
- None.

## Q7. Which features are planned but not built?

### Takeaway
Open OpenSpec changes are all complete or nearly complete; the MCP change explicitly excluded other tools, resources and prompts. The main unbuilt areas found in code are the refund state machine, invoice/payment-link emails, customer groups, and real installable payment-provider listing.

### Cited Findings
- Open changes: industry-location-store-presets (91/91 tasks), mcp-sales-report-tool (15/16; remaining task 3.3 is a manual check on a site with the MCP Adapter), merchant-home-setup-checklist (36/36), onboarding-tax-step-and-completion-redesign (25/25), squash-migrations-into-create-tables (39/39), translatable-js-strings (22/22) — [openspec/changes/](openspec/changes/) `tasks.md` files. 171 archived changes — [openspec/changes/archive/](openspec/changes/archive/).
- MCP change non-goals: "Other tools (orders, products, customers), resources, or prompts." — [openspec/changes/mcp-sales-report-tool/design.md](openspec/changes/mcp-sales-report-tool/design.md) line 34.
- Refund actions (initiate/approve/decline/mark-refund-complete) are commented out in the order action switch, pending "a dedicated refund state machine" — [app/Actions/Order/PerformOrderAction.php](app/Actions/Order/PerformOrderAction.php) lines 109–124; refund-cluster statuses not in the transition matrix — [app/Constants/Order/OrderStatus.php](app/Constants/Order/OrderStatus.php) line 54; [app/Constants/Order/PaymentStatus.php](app/Constants/Order/PaymentStatus.php) line 25.
- Refund actions carry open decisions: what to do with order/fulfillment/payment status after a refund, whether to release stock on full refund, whether deleting a completed refund is allowed, partial-refund handling — [app/Actions/Order/CreateRefundAction.php](app/Actions/Order/CreateRefundAction.php) lines 106–108; [app/Actions/Order/DeleteRefundAction.php](app/Actions/Order/DeleteRefundAction.php) line 54; [app/Actions/Order/UpdateRefundAction.php](app/Actions/Order/UpdateRefundAction.php) line 119.
- Send invoice / send payment link not implemented — [app/Managers/OrderManager.php](app/Managers/OrderManager.php) lines 680–705.
- Installable online providers list is hard-coded — [app/Services/OnlinePaymentService.php](app/Services/OnlinePaymentService.php) lines 46–70.
- Cart currency selection is base-currency only (`@todo` multi-currency) — [app/Services/CartService.php](app/Services/CartService.php) line 269.
- Editing cancelled/refunded orders is an open question — [app/Actions/Order/UpdateOrderAction.php](app/Actions/Order/UpdateOrderAction.php) line 121.
- Customer groups UI without backend — see Q1.

### Inferences
- MCP tools for refunds should wait for the refund state machine, or be limited to the existing create-refund path with strong guards.
- "Send invoice" and "send payment link" must not be offered as MCP tools; the backend returns `false`.

### Gaps
- `openspec/specs/` (about 150 capability specs) describes built behavior; I did not read them individually.

## Q8. Risky write operations and current guards; what the MCP framework supports

### Takeaway
Order state changes, refunds and order edits are well guarded (transaction + row lock + state matrix + amount checks). Deletes are weakly guarded: single order, product and customer deletes are hard deletes with no status check. Price and stock writes have only field validation. The bundled MCP framework supports Tools (with read_only/destructive/idempotent/open_world hints), Resources with a static URI, and Prompts with simple arguments.

### Cited Findings
**Guarded**
- Order actions: run in a DB transaction with `lock_order()`; blocked while `is_refund_initiated`; only actions listed for the current status in the state matrix are allowed; mark-as-paid checks the provider exists — [app/Actions/Order/PerformOrderAction.php](app/Actions/Order/PerformOrderAction.php) lines 56–160; matrix in [resources/data/order-state-matrix.json](resources/data/order-state-matrix.json) (for example `completed` allows only archive-order; cancelled states allow nothing).
- Create refund: transaction + lock; only when payment_status = paid and fulfillment_status ∈ delivered/cancelled; amount ≤ refundable amount; pushes to the gateway `refund()` only when the order has a gateway transaction id — [app/Actions/Order/CreateRefundAction.php](app/Actions/Order/CreateRefundAction.php) lines 74–121; gateway method in [app/Payment/PaymentProvider.php](app/Payment/PaymentProvider.php) line 466, [app/Payment/Providers/PayPal.php](app/Payment/Providers/PayPal.php) line 248, [payments/kirki-stripe/src/Stripe.php](payments/kirki-stripe/src/Stripe.php) line 170. Refund total never exceeds refundable total under races — [docs/concurrency.md](docs/concurrency.md) section 2.
- Update refund: transaction; refundable total = invoiced_total − shipping − provider fee — [app/Actions/Order/UpdateRefundAction.php](app/Actions/Order/UpdateRefundAction.php) line 110.
- Create/update order: valid shipping method required; transaction + lock; stock check per variant; max-per-order and availability checks; enabled payment provider (except manual) — [app/Actions/Order/CreateOrderAction.php](app/Actions/Order/CreateOrderAction.php); [app/Actions/Order/UpdateOrderAction.php](app/Actions/Order/UpdateOrderAction.php).
- Stock and coupon counters use atomic reserve/release/confirm — [app/Services/InventoryService.php](app/Services/InventoryService.php); [app/Services/VariantService.php](app/Services/VariantService.php); [app/Services/CouponService.php](app/Services/CouponService.php) (`claim_usage`, `release_usage`); [docs/concurrency.md](docs/concurrency.md).
- Bulk variant update runs in one transaction and rolls back on error — [app/Services/VariantService.php](app/Services/VariantService.php) `bulk_update` (line 206).
- Category delete refuses non-deletable categories — [app/Services/CategoryService.php](app/Services/CategoryService.php) line 202.

**Weakly guarded**
- `delete_order()` is a plain hard delete with no status check; `bulk_delete` and `delete_all` (deletes every order matching the list filters) likewise; refunds cascade on order delete — [app/Services/OrderService.php](app/Services/OrderService.php) lines 453–507; [database/migrations/CreateRefundsTable.php](database/migrations/CreateRefundsTable.php).
- Product single delete is a hard delete with no trashed check; bulk delete only removes products already trashed — [app/Services/ProductService.php](app/Services/ProductService.php) lines 273–313.
- Customer delete / bulk delete / delete_all are plain deletes — [app/Services/CustomerService.php](app/Services/CustomerService.php) lines 331–400.
- Price, sale price, cost and stock quantity writes (`PUT /variants/{id}`, `PUT /variants/bulk`) have only validation rules (min:0 etc.); `available_quantity` is set absolutely, not incremented — [app/Http/Requests/Variant/UpdateVariantRequest.php](app/Http/Requests/Variant/UpdateVariantRequest.php); [app/Http/Requests/Variant/BulkUpdateVariantRequest.php](app/Http/Requests/Variant/BulkUpdateVariantRequest.php).
- Base currency change, settings writes, payment provider enable/config: only `manage_options` + validation — [app/Services/CurrencyService.php](app/Services/CurrencyService.php) (`set_base`); [app/Http/Controllers/Api/SettingsController.php](app/Http/Controllers/Api/SettingsController.php).
- No audit trail outside order activities and refund created_by/updated_by — [database/migrations/CreateOrderActivitiesTable.php](database/migrations/CreateOrderActivitiesTable.php); [database/migrations/CreateRefundsTable.php](database/migrations/CreateRefundsTable.php).

**MCP server and framework**
- Server `kirki-ecommerce` registered with `throttle:60,1` — [app/Providers/AppServiceProvider.php](app/Providers/AppServiceProvider.php) line 57; one tool listed in [app/Mcp/Servers/StoreServer.php](app/Mcp/Servers/StoreServer.php). The tool's own `permission()` checks `manage_options`; the package default is `read` — [docs/mcp.md](docs/mcp.md) sections 2 and 6.
- `Server` has `$tools`, `$resources`, `$prompts` arrays and `before_call` / `after_call` hooks — [vendor/libraries/framework-mcp/src/Server.php](vendor/libraries/framework-mcp/src/Server.php).
- `Tool` hints: `$read_only`, `$destructive`, `$idempotent`, `$open_world`; `schema()` and `output_schema()` — [vendor/libraries/framework-mcp/src/Tool.php](vendor/libraries/framework-mcp/src/Tool.php).
- `Resource`: required static `$uri` (registration throws if empty), `$mime_type`, `$audience`, `$priority`, `$last_modified`; no URI-template support found — [vendor/libraries/framework-mcp/src/Resource.php](vendor/libraries/framework-mcp/src/Resource.php); [vendor/libraries/framework-mcp/src/Registrar/AbilityRegistrar.php](vendor/libraries/framework-mcp/src/Registrar/AbilityRegistrar.php) lines 160–173.
- `Prompt`: `arguments()` returns `Argument(name, description, required)` objects — [vendor/libraries/framework-mcp/src/Prompt.php](vendor/libraries/framework-mcp/src/Prompt.php); [vendor/libraries/framework-mcp/src/Argument.php](vendor/libraries/framework-mcp/src/Argument.php).
- `Response` kinds: text, error, structured, image, blob, embedded; roles user/assistant (`as_assistant()`), `with_meta()` — [vendor/libraries/framework-mcp/src/Response.php](vendor/libraries/framework-mcp/src/Response.php).
- Every ability has name, title, description, category, meta, `$public` (false), `$show_in_rest` (false) — [vendor/libraries/framework-mcp/src/Ability.php](vendor/libraries/framework-mcp/src/Ability.php).

### Inferences
- Lowest-risk first wave: read-only tools wrapping existing list/show services (orders, order detail + activities, products/variants, low-stock variants, customers + spend, coupons) and the 14 unexposed analytics metrics.
- Medium-risk writes that already have strong guards: order fulfillment actions (process, ship + tracking, deliver, hold, cancel), mark-as-paid, add order note, coupon activate/deactivate/duplicate. They send customer emails, so mark them `destructive`/not idempotent and require explicit user confirmation in descriptions.
- High-risk writes that should be excluded or wrapped with extra guards: refunds (moves real money via gateway; refund state machine unfinished), order/product/customer deletes (hard deletes, no status check, `delete_all` by filter), price and absolute stock changes, settings group replacement, base currency change, payment provider config.
- Resources fit static, store-wide context: store profile (general settings), checkout/tax/shipping configuration summaries, order state matrix, analytics counting rules. Per-entity resources (one order by id) are not possible without URI templates, so per-entity reads should be tools.
- Prompts can package workflows over existing tools (weekly sales review, low-stock restock check, fulfillment backlog, coupon performance), using `Argument` for range or threshold.

### Gaps
- `mark-as-hold` is in the matrix `transitions` for most statuses but in `fulfillment_actions` only for `failed_processing`; the guard checks the `*_actions` arrays, so hold may be blocked in states the UI expects. Not verified at runtime.
- I did not verify how `before_call` / `after_call` could be used for an MCP audit log; no implementation exists in `StoreServer`.
