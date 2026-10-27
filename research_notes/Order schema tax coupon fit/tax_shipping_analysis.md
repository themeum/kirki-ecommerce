# Tax and shipping modelling, calculation and persistence in kirki-ecommerce

Scope: read-only code study of /Users/ahamed/development/ollyo/wordpress/kirki-ecommerce (branch dev). All paths below are relative to that root. "Source" links are local file:line references (no web sources were used). "Schema allows" and "code does" are kept separate.

## Q1. How is a tax rate determined for a product, and can rates differ per product in one order? Is the rate stored per order item?

### Takeaway
A tax profile is only a label (id, name, is_default). Rates live in the tax settings option (regions, states, EU member countries) and are chosen per cart line by a country strategy, optionally overridden by decision rules that match the line's tax profile or categories. Rates can differ per line in one order, and each line's rate is stored as its own `order_taxes` row (type `product`) pointing at the order item. There is no compound or stacked tax by design, no per-item "charge_taxes" enforcement, and no rate column on `order_items`.

### Cited Findings
- `tax_profiles` has only `id, name, is_default, timestamps`. No rate, country or region columns. — [database/migrations/CreateTaxProfilesTable.php:27-31]; model `app/Models/TaxProfile.php:15-30`
- Tax profile is assigned on the variant (`variants.tax_profile_id`, nullable). `variants.charge_taxes` boolean default 1 also exists. The migration for `products` has NO `tax_profile_id` column, although `Product` model casts it and the calculation falls back to it. — [database/migrations/CreateVariantsTable.php:44,55]; grep of `database/` finds `tax_profile_id` only there; [app/Models/Product.php:31]
- Cart calculation resolves `tax_profile_id = variant.tax_profile_id ?: product.tax_profile_id`. — [app/DTO/Calculation/CalculationContextDTO.php:131]; same in [app/Http/Controllers/Api/OrderCalculationController.php:133]
- `charge_taxes` is stored, validated and returned in resources, but is NOT read by any calculation code (grep over `app/` finds it only in DTOs, requests, Variant model, VariantResource, ProductSeeder). So a variant with `charge_taxes=false` is still taxed. — [app/Models/Variant.php:37,71]; [app/Resources/Variant/VariantResource.php:90]
- Rates come from the tax settings option `tax.tax_regions`, one enabled region per country code; any EU member country maps to a single region with code `EU`. Strategy classes: `EU` => EUTaxStrategy, `DEFAULT` => DefaultTaxStrategy. — [app/Tax/TaxStrategyFactory.php:62-93]; [config/tax-strategies.php:8-11]
- Strategy is chosen from the SHIPPING address country only. Billing country is passed to decision rules but never selects the strategy. If no strategy can be built (no country, no enabled region) tax is silently zero (exception caught, null strategy, empty result). — [app/Tax/TaxStrategyFactory.php:33-43]; [app/Supports/Tax.php:27-38]; [app/Actions/Cart/RecalculateCartAction.php:207-211]
- Tax is skipped when `general.is_tax_calculation_enabled` is false or no region is configured. — [app/Supports/Tax.php:47-62,96-99]
- DefaultTaxStrategy (non-EU): per item, base rate is `central_product_tax` (if `is_central_tax_enabled`) or the matched state's `product_tax_rate`; zero if no state matches. Then region/state `rules` run through the decision engine and may overwrite `product_tax` (conditions include `tax_profile` and product categories; actions include `set_product_tax_rate`, `set_product_tax_exempt` which sets 0). One TaxLineDTO (name "Tax") per item. — [app/Tax/Strategies/DefaultTaxStrategy.php:43-59,96-136]; [app/Decisions/Actions/SetProductTaxExemptAction.php:30-39]; [config/decisions.php:22,35-37]
- EUTaxStrategy: base rate is the destination member country's single `rate` (OSS) or the one country's rate for `micro_business`; per-item override via region `rules`. One TaxLineDTO (name "VAT") per item. — [app/Tax/Strategies/EUTaxStrategy.php:29-41,58-78,154-177]
- Rates are per line: `$rates_by_item[$item->item_id] = $rate` where item_id is the variant id; the same rate is not forced across the cart. — [app/Tax/Strategies/EUTaxStrategy.php:29-31]; [app/Actions/Cart/RecalculateCartAction.php:233]
- A line can in principle carry multiple tax lines (result `items` is `array<id, TaxLineDTO[]>`; persistence loops over them), but both shipped strategies emit exactly one line per item. No compound-tax flag or ordering exists (grep "compound" over app, config, database, openspec/specs finds nothing relevant). — [app/DTO/Tax/TaxCalculationResultDTO.php:14-18]; [app/Concerns/PersistsOrderTaxes.php:59-65]
- Persistence per item: `order_taxes` row with `order_id, order_item_id, type='product', name, rate decimal(8,4), invoiced_amount, base_amount`. No flag column other than `type`. — [database/migrations/CreateOrderTaxesTable.php:27-35]; [app/Concerns/PersistsOrderTaxes.php:95-106]
- `order_items` has only cached amounts: `invoiced_tax_total/base_tax_total`, `*_regular_tax_total`; no rate/percent column. Spec says this is intentional ("An order item no longer carries a merged rate"). — [database/migrations/CreateOrderItemsTable.php:36-37,46-47]; [openspec/specs/order-tax-lines/spec.md:80-91 (requirement heading at line 80)]
- Order-level tax identity fields exist: `tax_id_number`, `tax_id_type`, `reverse_charge` (comment "EU reverse charge"). They are in the Order model fillable/casts, but grep finds no code that sets or reads `reverse_charge` outside the model, so reverse charge is schema-only. — [database/migrations/CreateOrdersTable.php:43-45]; [app/Models/Order.php:41-43,120]
- Order rows link to taxes via `Order::taxes()` and `Order::shipping_taxes()` (type = shipping); `OrderService::find_order` eager loads `items.taxes` and `shipping_taxes`. — [app/Models/Order.php:236-250]; [app/Services/OrderService.php:290-293]
- Tax-inclusive vs exclusive is a single global store flag `tax.is_tax_inclusive_price`, snapshotted onto the order as `orders.is_tax_inclusive`. — [app/Supports/Tax.php:84-87]; [app/Actions/Order/CreateOrderAction.php:674]

### Inferences
- "Tax profile -> rate" is indirect: a tax profile has no rate until a decision rule in the tax region references it. Per-product rates at 0/7/19% are expressible only as rules (one per profile) inside the region config.
- Persisting rate per item is fully supported at the order_taxes level (rate + name + amount + item link); there is no way to know afterwards WHICH rule/profile produced the rate (no profile id or rule id stored on order_taxes or order_items; `product_data` JSON on order_items might hold a snapshot but no code was inspected that writes tax profile into it).
- Because strategy selection uses the shipping country, orders with a billing country in another jurisdiction (digital goods VAT based on billing/IP) cannot be modelled.

### Gaps
- Product-level `tax_profile_id`: the column is absent from the products migration reviewed, yet the model and calculation reference it. Not verified whether a later migration (config/migrations.php schema upgrades) adds it; I only grepped `database/`.
- `order_items.product_data` content (does it snapshot tax profile?) not inspected.
- docs/ecommerce/settings/tax.yml shows an older EU settings shape (`product_tax`/`shipping_tax` arrays, `set_tax_rate`) that does not match what the strategy code reads (`countries[].rate`, `type`); treated as stale.

## Q2. Is shipping taxed? Separate shipping tax rate or profile? Where is it stored?

### Takeaway
Shipping is taxed when the chosen shipping method has `is_taxable` true. Non-EU regions have an independent shipping tax rate (`central_shipping_tax` or per-state `shipping_tax_rate`) with optional rules. EU has no independent shipping rate. Persistence: one or more `order_taxes` rows with `type='shipping'`, plus cached `orders.*_shipping_tax_amount`. The net shipping charge is NOT stored in its own column.

### Cited Findings
- `shipping_profiles` is a bare (id, name, is_default) table used only as a rule condition for shipping method pricing/availability, not for tax. `shipping_boxes` stores box dimensions. No tax linkage. — [database/migrations/CreateShippingProfilesTable.php:27-30]; [database/migrations/CreateShippingBoxesTable.php:27-36]; [app/Services/ShippingService.php:395-428]
- Shipping zones/methods live in the shipping settings option (not tables). Zone match is first enabled zone whose regions match shipping country/state. Method types: flat rate, local pickup, weight-based; costs are base-currency minor ints; rules (decision engine) may change cost or disable. — [app/Services/ShippingService.php:61-81,255-316,330-360]
- Each method carries `is_taxable`; tax strategies only tax shipping when `$context->is_shipping_taxable` (= selected method's flag) and `is_shipping_tax_enabled`. — [app/Services/ShippingService.php:114]; [app/Actions/Cart/RecalculateCartAction.php:163-170,245]; [app/Tax/Strategies/DefaultTaxStrategy.php:71-73]; [app/Tax/Strategies/EUTaxStrategy.php:98-100]
- The global `is_shipping_tax_enabled` toggle is hard-coded to `true` in the factory (settings value commented out, TODO), although the settings API still validates `data.is_shipping_tax_enabled`. — [app/Tax/TaxStrategyFactory.php:45-46]; [app/Http/Requests/Settings/SettingsUpdateRequest.php:584]
- Non-EU (Default strategy): separate shipping rate resolved via `resolve_rate('shipping_tax', ...)`: `central_shipping_tax` or the state's `shipping_tax_rate`, overridable by the `set_shipping_tax_rate` rule action. Single line named "Shipping Tax" with no item_id. — [app/Tax/Strategies/DefaultTaxStrategy.php:69-84,120-136]; [config/decisions.php:36]; [app/Decisions/Actions/SetShippingTaxRateAction.php]
- Shipping tax is ALWAYS added on top of the shipping charge, even when product prices are tax-inclusive (a shipping fee is never quoted inclusive). — [app/Tax/Strategies/AbstractTaxStrategy.php:80-94]; [app/Actions/Cart/RecalculateCartAction.php:449-478]
- Shipping fee taxed is net of free-shipping discount: `shipping_fee = shipping_subtotal - shipping_discount`. The only shipping discount in DiscountService is the FREE_SHIPPING coupon, which waives the whole `shipping_subtotal`. — [app/Actions/Cart/RecalculateCartAction.php:227-228,244]; [app/Services/DiscountService.php:378-390]
- Order columns: `invoiced_shipping_total/base_shipping_total` (= shipping subtotal - shipping discount + shipping tax), `invoiced_shipping_tax_amount/base_shipping_tax_amount`, `invoiced_tax_total/base_tax_total` (items tax + shipping tax), `invoiced_discount_total/base_discount_total` (items discounts + shipping discount). There is NO column for net shipping charge, shipping discount, or shipping tax rate on `orders`. — [database/migrations/CreateOrdersTable.php:47-56]; [app/Actions/Cart/RecalculateCartAction.php:470-477,503-512]; [app/Actions/Order/CreateOrderAction.php:662-672]
- Shipping method snapshot on the order stores only `{id, name, type}` in `shipping_metadata` (no cost, no taxable flag, no rate). — [app/Actions/Order/CreateOrderAction.php:852-867]
- Shipping `order_taxes` rows: `order_item_id` NULL when shipping tax is a single line for the whole order; set to an order item when the strategy split shipping across items. — [app/Concerns/PersistsOrderTaxes.php:67-75]
- Carts persist `shipping_method` (string id) and `shipping_details` (JSON text) but no money or tax; cart items hold only (cart, product, variant, quantity). All cart pricing is recomputed on demand. — [database/migrations/CreateCartsTable.php:30-31]; [database/migrations/CreateCartItemsTable.php:27-30]
- `orders.total_weight` and `order_items.weight/weight_unit` are stored; per-order weight-based shipping inputs are recoverable, but the shipping cost itself is not itemised. — [database/migrations/CreateOrdersTable.php:62]; [database/migrations/CreateOrderItemsTable.php:58-59]

### Inferences
- The merchant-configurable "separate shipping tax rate" exists only for non-EU regions. Net shipping can be derived as `invoiced_shipping_total - invoiced_shipping_tax_amount` (+ shipping discount, which is only recoverable from the coupon rows).
- Any rate for the shipping portion is only in `order_taxes` rows; `orders` itself cannot tell the rate.

### Gaps
- No per-method taxable override by profile, no per-shipping-profile tax rate; no spec found for it.
- Whether `shipping_details` on carts holds anything tax related was not inspected.

## Q3. Is there EU logic (shipping tax following goods, proportional apportionment, per-item shipping tax)?

### Takeaway
Yes. EUTaxStrategy implements the "shipping follows the goods" rule: the post-discount shipping fee is allocated across cart lines proportionally to each line's taxable amount (largest-remainder allocation) and each portion is taxed at that line's own rate, producing one `shipping` order_taxes row per line with `order_item_id` set. The net shipping portion itself is not stored.

### Cited Findings
- Allocation: `Money::from_minor($context->shipping_fee)->allocate(...$taxable_amounts)` over the lines' `taxable_amount`; then per line `calculate_shipping_tax_amount(rate, portion)` (HALF_UP) and one `TaxLineDTO` with `item_id` for each line whose portion > 0. Lines with portion 0 are skipped. — [app/Tax/Strategies/EUTaxStrategy.php:96-141]
- Fallback when there are no items or total taxable amount <= 0 (e.g. everything discounted to 0): single unattributed VAT line at the destination country rate. — [app/Tax/Strategies/EUTaxStrategy.php:104-117]
- The weight used for apportionment is `taxable_amount`, i.e. the line total AFTER discount, in the store's pricing mode (gross when tax-inclusive, net when exclusive). It is not net of tax in inclusive mode, so the split ratio can differ slightly from a net-based split. — [app/Actions/Cart/RecalculateCartAction.php:232-238,294-300]; [app/Tax/Strategies/EUTaxStrategy.php:102]
- Order of events: free-shipping discount reduces `shipping_fee` before allocation, so apportionment is of the discounted shipping charge. — [app/Actions/Cart/RecalculateCartAction.php:227-228]
- Specs describe this as intended behaviour (requirement "Shipping tax split proportionally across items"; "A country splits shipping tax across the item tax mix"). — [openspec/specs/order-tax-lines/spec.md:12-45]; [openspec/specs/tax-calculation-strategy/spec.md:62-70]
- Persisted via `PersistsOrderTaxes::sync_order_taxes`: each shipping TaxLineDTO with `item_id` (variant id) is mapped to the matching order item id. Items are matched by variant id (`$order_items_by_variant_id[$item->variant_id]`), so two order items with the same variant would collide. — [app/Concerns/PersistsOrderTaxes.php:51-75]
- Tax lines are named "VAT" (EU) / "Tax" / "Shipping Tax" (non-EU), a free-text `name` column. No jurisdiction/country, tax code, or rate-type column. — [app/Tax/Strategies/EUTaxStrategy.php:35,112,133]; [app/Tax/Strategies/DefaultTaxStrategy.php:54,79]
- Reverse charge, VAT ID, OSS (partial: `type` "oss"/"micro_business" in the region settings) exist as settings/columns; reverse charge has no calculation logic. — [app/Tax/Strategies/EUTaxStrategy.php:17,147-148]; [database/migrations/CreateOrdersTable.php:43-45]

### Inferences
- The EU path is the only path where shipping tax is attributable to items; the Default path always yields one unattributed shipping row.
- Allocated NET shipping per item is not persisted anywhere (only the tax portion `base_amount`, plus rate). It is approximately recoverable as `tax_amount * 100 / rate` for rate > 0, lossy because of HALF_UP rounding, and unrecoverable at rate 0%.

### Gaps
- No implementation for Germany/Austria-style special rules, reduced-rate "main item" rule, or merchant choice between apportionment and a single flat shipping rate in EU regions.
- Whether multiple EU lines with identical portions break allocation ordering was not tested (no test run; read-only).

## Q4. What does OrderService persist for order_taxes, and how are totals reconciled?

### Takeaway
OrderService itself only wraps CRUD (`create_order_tax`, `delete_order_taxes`). The real persistence is the `PersistsOrderTaxes` trait used by CreateOrderAction and UpdateOrderAction: delete all rows for the order, then insert one row per tax line (no grouping), then assert that base_amount rows sum to `calculated base_tax_total`. Totals are copied from the calculation result and converted to the order currency independently per column.

### Cited Findings
- `OrderService::create_order_tax(CreateOrderTaxDTO)` / `delete_order_taxes(order_id)`. — [app/Services/OrderService.php:238-254]
- `sync_order_taxes`: delete all, loop `order->items` x `tax_lines` (type product), then `shipping_tax_lines` (type shipping). No grouping by rate. Row fields: order_id, order_item_id (null for unattributed shipping), type, name, rate, `invoiced_amount = convert_amount(base_amount)`, `base_amount`. There is no is_shipping flag; the `type` string (`OrderTaxType::PRODUCT|SHIPPING`) plays that role. — [app/Concerns/PersistsOrderTaxes.php:47-107]; [app/Constants/Order/OrderTaxType.php]
- Reconciliation assert compares ONLY `sum(order_taxes.base_amount)` to `calculated_result->base_tax_total` and throws on mismatch (rolls back via the surrounding transaction in the actions). Invoiced columns are not asserted. — [app/Concerns/PersistsOrderTaxes.php:119-132]
- Create and update both persist from the same `CalculationResultDTO`: subtotal (net), shipping_total, discount_total, tax_total, shipping_tax_amount, total; items: price (net), regular_price, subtotal (net), discount, tax_total, total. — [app/Actions/Order/CreateOrderAction.php:659-677,764-785]; [app/Actions/Order/UpdateOrderAction.php:246-264,415-436]
- Calculation identities in code: item `base_total = taxable_amount` (inclusive) or `taxable_amount + tax` (exclusive); shipping `total = subtotal - discount + tax`; order `base_total = max(sum(item totals) + shipping total, 0)`; `base_tax_total = sum(item tax) + shipping tax`; `base_discount_total = sum(item discount) + shipping discount`. — [app/Actions/Cart/RecalculateCartAction.php:380-384,470,501-512]
- Order currency conversion: every invoiced figure is `base * exchange_rate` converted and rounded HALF_UP individually (`convert_amount`), with `orders.exchange_rate decimal(15,6)` snapshotted at order time from `Currency::exchange_rate(code)`. Base values (`base_*`) are authoritative, invoiced values are derived per column. — [app/Actions/Order/CreateOrderAction.php:657,809-815]; [app/Managers/MoneyManager.php:344-346]; [database/migrations/CreateOrdersTable.php:38]
- Money columns are all `integer` minor units (no decimals); only `rate` is decimal(8,4); `exchange_rate` decimal(15,6). — [database/migrations/CreateOrderTaxesTable.php:32]; [database/migrations/CreateOrdersTable.php:38-59]
- Spec requires cached totals to equal sum of lines (item tax_total = sum of its lines; order shipping tax = sum of shipping lines; order tax_total = all lines). Code enforces only the final order-level base check above. — [openspec/specs/order-tax-lines/spec.md:56-78]
- Coupon attribution tables record discounts: `order_coupons` (invoiced/base_discount_amount) and `order_item_coupons` (per item per coupon discount). Free-shipping discount is on order_coupons only; no per-item shipping discount. — [database/migrations/CreateOrderCouponsTable.php:37-38]; [database/migrations/CreateOrderItemCouponsTable.php:30-31]
- Order-wide amount coupons are allocated across items proportionally by weight with largest-remainder, so each line carries its discount share. — [app/Services/DiscountService.php:517-534,595-640]

### Inferences
- Because invoiced rows are converted independently, `sum(order_taxes.invoiced_amount)` can differ by a few minor units from `orders.invoiced_tax_total` (and item invoiced totals from order invoiced_total) in non-base currencies. Nothing asserts or repairs this.
- The assert verifies persistence of calculation output, not that a recomputation from stored rows would match; the calculation's inputs (net portion of shipping, taxable amount per line) are not all stored.

### Gaps
- Test coverage of reconciliation in multi-currency was not examined.

## Q5. Rounding policy, minor units, exchange rate snapshot

### Takeaway
Per line, HALF_UP, in base currency minor units (ints); no per-order rounding step. Currency conversion happens afterwards per column. One exchange_rate per order is snapshotted.

### Cited Findings
- Exclusive tax: `amount * rate` HALF_UP then `/100` HALF_UP (two rounded steps on a Brick Money in minor-unit context). Inclusive tax: `amount * rate / (100 + rate)` HALF_UP. Shipping: always exclusive formula. — [app/Tax/Strategies/AbstractTaxStrategy.php:68-77,91-94]
- Tax computed per item line (sum of quantity), not per unit, and per EU shipping portion; the order total is sum of rounded lines. — [app/Tax/Strategies/EUTaxStrategy.php:37]; [app/Actions/Cart/RecalculateCartAction.php:260]
- Inclusive-mode net figures are derived by a float "tax fraction" `tax / taxable` applied to unit price, regular price and subtotal, HALF_UP. — [app/Actions/Cart/RecalculateCartAction.php:417-446]
- `item.regular_tax_total` is computed separately as net regular total x line rate, rounded HALF_UP, and is independent of the order_taxes rows. — [app/Actions/Cart/RecalculateCartAction.php:340-351]
- Currency: `exchange_rate` stored on the order; both `invoiced_*` and `base_*` stored on orders, order_items, order_taxes, coupons. `orders.currency_code` + `base_currency_code`. — [database/migrations/CreateOrdersTable.php:36-38]; [database/migrations/CreateOrderTaxesTable.php:34-35]
- Refunds are not stored in base currency (only `invoiced_amount` integer, in order currency). — [database/migrations/ (Refund table, columns line 30)]; [app/Models/Refund.php:18-32]

### Inferences
- Per-line rounding matches a "line-level VAT" invoice but not "invoice-level rounding" (sum net by rate then compute VAT once per rate), which some EU invoicing rules prefer; the persisted rows (per line) cannot be re-aggregated to that method exactly because net bases per rate are not stored.

### Gaps
- Float use in inclusive net derivation could produce 1-minor-unit differences versus an exact method; not quantified.

## Q6. Scenario gaps: what the persisted data cannot reproduce or reconcile exactly

### Takeaway
Rates per line, shipping rate(s), item-level shipping tax link and tax-inclusive flag are persisted and reproduce the tax AMOUNTS. What is missing are the NET BASES: net shipping, per-line allocated net shipping, per-line taxable base (post-discount), the shipping discount, and any refund breakdown. This makes exact recomputation, VAT return by rate, and partial refunds with shipping tax share unreliable or impossible.

### Cited Findings (scenario by scenario)
1. Items at 0%/7%/19% plus shipping at 19%.
   - Items: reproducible. Three `order_taxes` product rows with rate 0/7/19 and amounts, linked to the order items (0% rows are written with amount 0 because strategies always emit a line). Cite [app/Concerns/PersistsOrderTaxes.php:59-65].
   - Shipping at a flat 19% regardless of goods: reproducible for non-EU (one `shipping` row, rate 19, `order_item_id` NULL) — [DefaultTaxStrategy.php:75-83]. For an EU destination this configuration is NOT possible: EU shipping always follows goods' rates (no independent shipping rate in EU region) — [EUTaxStrategy.php:81-141].
   - Net shipping charge isn't stored; get it as `shipping_total - shipping_tax_amount` (plus the shipping discount from coupon rows). Taxable bases per line are not stored either.
2. EU mixed-rate cart with shipping spread proportionally.
   - Stored: per line shipping `order_taxes` row (rate, tax amount, order_item_id) — [PersistsOrderTaxes.php:67-75].
   - Not stored: the allocated net shipping portion per line, the allocation weights (post-discount taxable amount), the shipping net total. Net portions can only be approximated back from `amount*100/rate` (undefined for 0% lines; rounding drift). Allocation cannot be re-run exactly after the fact because weights depend on discounts and gross/net mode at the time (and `order_item_coupons` only partly captures it).
   - Zero-portion lines are skipped (no row) and the "no taxable base" fallback produces an unattributed row, so the same order shape can have per-item or unattributed shipping rows — consumers must handle both.
   - Items keyed by variant id: two lines of the same variant would share one key in `$order_items_by_variant_id` and in `$calculated_result->items[...]`. — [PersistsOrderTaxes.php:53-55]; [RecalculateCartAction.php:88]
3. Tax-inclusive pricing.
   - Flag `orders.is_tax_inclusive` is stored (describes the setting "when this order was last calculated"; it is overwritten on order update). Item `price`/`subtotal` are stored NET, `total` gross, tax amounts extracted. Shipping is always exclusive-added so an inclusive store's shipping total is net + tax. — [Order migration line 57]; [RecalculateCartAction.php:380-401,449-478]
   - Gross customer-facing unit price is not stored; it must be reconstructed from net + tax / quantity, with a float fraction that can differ by a minor unit from the originally displayed gross price. Original gross can drift from catalog price after rounding.
4. Discount before tax.
   - Taxes are computed on post-discount `taxable_amount` (net_total - item discount), item discounts capped at the line total. Stored: item `discount_amount`, `subtotal` (pre-discount, net), `tax_total`, per coupon/per item discount rows. The taxable base per line (subtotal - discount in exclusive; gross - discount in inclusive) is derivable but not stored; for inclusive mode the stored `subtotal` is net while the discount is gross-based, so `subtotal - discount` is not the taxable base. — [RecalculateCartAction.php:294-300,373-398]
   - Free-shipping discount reduces the taxed shipping base; only `order_coupons` records it, not any shipping-specific column.
5. Partial refund of one item with its share of shipping tax.
   - Refund table holds only `order_id, status, invoiced_amount, reason, refund_type (partial/full), refund_id, created_by`; no line items, no tax amount, no shipping share, no base-currency amount. — [Refund migration columns lines 26-39]; [app/Models/Refund.php:18-27]
   - `CreateRefundAction::get_refundable_amount` = order invoiced_total - existing refunds - invoiced_shipping_total: shipping (and its tax) is never refundable in this model. — [app/Actions/Order/CreateRefundAction.php:134]
   - Per-item share of shipping tax exists only for EU orders (shipping rows with order_item_id) and only in tax-amount form; no mapping exists from a refund to those rows, so a credit note with correct per-rate VAT reversal cannot be generated from stored data without recomputing (and the net portion is not stored).
6. Others observed.
   - `charge_taxes=false` variants are still taxed (flag unused in calc).
   - `is_shipping_tax_enabled` toggle ignored (hard-coded true).
   - `reverse_charge`, `tax_id_*` columns not used by calculation.
   - Rounded tax names are free text; no country/jurisdiction on tax rows (e.g. EU country-of-consumption for OSS reports must come from `orders.shipping_country`).
   - On order update the tax rows are deleted and recreated from current settings; rate history for edited orders follows the settings at edit time (the update path recalculates). — [app/Actions/Order/UpdateOrderAction.php:130-139]
   - Updating an order overwrites `is_tax_inclusive` with the current store setting. — [UpdateOrderAction.php:261]

### Inferences
- To represent per-product rates, a separate shipping rate and EU apportionment EXACTLY (including audit/refund), the missing pieces are: persisted net shipping total, per-line allocated shipping net (or allocation key), per-line taxable base on `order_items`, shipping discount amount, `tax rate source` (profile/rule), and a refund-line/tax breakdown. The tax amount rows alone are not enough.
- Amounts and rates for items and EU shipping portions are exactly stored; therefore a read-side report of VAT collected by rate (sum `order_taxes.base_amount` group by rate) works; a report of NET sales by rate works for items only if taxable base is recomputed (not stored), and does not work for shipping in non-attributed rows.

### Gaps
- No tests were run; behaviours are from reading code only.
- Did not inspect front-end rendering of order tax breakdown or invoice templates.
- Did not check later schema upgrade migrations (config/migrations.php, `openspec/specs/schema-upgrade-migrations`) for additional columns such as products.tax_profile_id; only `database/migrations/*` were read.
