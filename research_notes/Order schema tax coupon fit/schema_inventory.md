# Order schema inventory (orders, items, taxes, coupons, refunds, activities)

All paths relative to /Users/ahamed/development/ollyo/wordpress/kirki-ecommerce. Source is the repo itself (primary). Table prefix `kirki_ecommerce_`. Migrations: `database/migrations/Create<X>Table.php` (cited as `M:<X>:line`). Money convention: every amount is `integer` (minor units / cents), stored in pairs `invoiced_*` (order currency) and `base_*` (store base currency). `schema.md` at repo root is unrelated (schema.org product markup table, 28 lines); no order docs there. `docs/ecommerce/orders/*.yml` and `docs/ecommerce/coupons/`, `tax-profiles/` are API (OpenCollection) request files, not schema docs. Relevant specs: `openspec/specs/{order-tax-lines,order-coupon-attribution,item-pricing-tax-exclusivity,tax-calculation-strategy,tax-region-rate-model,order-create-calculation-reconciliation,admin-order-calculation-breakdown,storefront-order-pricing-breakdown,order-activity-log}`; `openspec/changes/` has no order-related active change (archive, industry-location..., merchant-home..., move-runtime..., onboarding-tax..., squash-migrations..., translatable-js-strings).

## 1. Column-by-column inventory

### Takeaway
Seven tables, all money as signed 32-bit `integer` minor units in `invoiced_*`/`base_*` pairs. Order-level has subtotal/shipping/discount/tax/shipping-tax/total/payment-fee; line-level has price, regular price, discount, tax, subtotal, total. There is no order_shipping table and no per-item shipping column.

### Cited Findings

#### kirki_ecommerce_orders (M:Orders:25-159)
- `id()` (PK); `uuid` uuid nullable (:27); `order_number` string(50) null (:28); `invoice_number` string(50) null (:29); `customer_id` unsigned_big_integer null (:30)
- `order_status` string(50) default 'pending' (:31); `fulfillment_status` string(50) default 'unfulfilled' (:32); `is_manual` bool def 0 (:33); `is_refund_initiated` bool def 0 (:34)
- Currency: `currency_code` string(3) NOT NULL (:36); `base_currency_code` string(3) NOT NULL (:37); `exchange_rate` decimal(15,6) nullable, comment "Exchange rate at time of order for accurate historical reporting" (:38)
- `invoiced_subtotal`/`base_subtotal` integer def 0 (:40-41)
- Tax identity: `tax_id_number` string(100) null (:43); `tax_id_type` string(50) null (vat, gst, ein) (:44); `reverse_charge` bool def 0 "EU reverse charge mechanism" (:45)
- `invoiced_shipping_total`/`base_shipping_total` integer def 0 (:47-48)
- `invoiced_discount_total`/`base_discount_total` integer def 0 (:50-51)
- `invoiced_tax_total`/`base_tax_total` integer def 0 (:53-54)
- `invoiced_shipping_tax_amount`/`base_shipping_tax_amount` integer def 0 (:55-56)
- `is_tax_inclusive` bool def 0, comment "Whether the store priced items inclusive of tax when this order was last calculated" (:57)
- `invoiced_total`/`base_total` integer def 0 (:59-60)
- `items_count` integer def 0 (:62); `total_weight` decimal(10,2) null (:63)
- Payment: `payment_status` string(50) def 'pending' (:65); `payment_provider` string(100) null (:66); `payment_transaction_id` string null (:67); `invoiced_payment_provider_fee`/`base_payment_provider_fee` integer def 0 (:68-69); `payment_metadata` text null (:70)
- Shipping: `shipping_method` string(100) null (:72); `shipping_metadata` text null (:73); `shipping_carrier`(100), `shipping_tracking_number`(100), `shipping_tracking_url`(500) null (:74-76)
- Shipping address columns (all nullable strings): first_name, last_name, address_line1, address_line2, city, state, country(100), postal_code(20), phone, email, company (:78-88). `is_billing_same_as_shipping` bool def false (:90). Billing address mirror columns (:92-102). Customer contact snapshot: `customer_first_name/last_name/email/phone` (:104-107). `ip_address` (:108), `user_agent` text (:109)
- Notes: `order_notes`, `flags` (comma-separated text), `cancellation_reason` (:111-115)
- `created_by`, `updated_by` unsigned_big_integer null (:117-118)
- Timestamps null: `paid_at`, `shipped_at`, `cancelled_at`, `fulfilled_at`, `estimated_delivery_date`, `delivered_at`, `archived_at` (:120-126) + `timestamps()` (:127)
- FKs: `created_by`/`updated_by` -> `users.ID` null_on_delete (:129-130); `customer_id` -> `kirki_ecommerce_customers.id` null_on_delete (:155-158)
- Indexes: order_number, invoice_number, uuid, customer_email, ip_address (:132-136); composites (customer_id,created_at), (customer_id,order_status,created_at), (created_at,order_status), (order_status,payment_status,created_at), (payment_status,order_status,updated_at), (paid_at,order_status), fulfilled_at, shipped_at, (payment_provider,payment_status), (shipping_country,created_at), payment_transaction_id, (base_currency_code,created_at) (:138-153). No unique on order_number/uuid.
- Model `app/Models/Order.php`: casts :112-130 — `exchange_rate` float, `total_weight` float, `items_count` int, bools (`is_manual`, `is_refund_initiated`, `reverse_charge`, `is_tax_inclusive`), `payment_metadata`/`shipping_metadata` json, and int casts only for `invoiced/base_tax_total`, `*_shipping_tax_amount`, `*_payment_provider_fee`. Other money columns (subtotal, shipping_total, discount_total, total) have NO int cast (come back as DB strings). Relations: `items` hasMany OrderItem (:176), `customer` belongsTo (:188), `order_coupons` hasMany (:200), `refunds` hasMany (:212), `activities` hasMany (:224), `taxes` hasMany OrderTax (:236), `shipping_taxes` hasMany OrderTax where type='shipping' (:248-251). `flags` get/set mutators (:140-167). Fillable :27-109 covers all columns above except `estimated_delivery_date`.

#### kirki_ecommerce_order_items (M:OrderItems:25-75)
- `id`; `order_id` unsigned_big_integer NOT NULL (:27); `product_id`, `variant_id` unsigned_big_integer null (:28-29)
- Snapshot text: `product_name` string(500) NOT NULL (:30); `variant_name` string(500) null "Snapshot of variant combination" (:31); `sku`(100), `barcode`(100) null (:32-33); `product_image` unsigned_big_integer null (media id, :34)
- `invoiced_tax_total`/`base_tax_total` int def 0 (:36-37)
- `invoiced_discount_amount`/`base_discount_amount` int def 0 (:39-40)
- `invoiced_price`/`base_price` int NOT NULL, no default (:42-43) — unit price
- `invoiced_regular_price`/`base_regular_price` int def 0 (:44-45) — unit regular price
- `invoiced_regular_tax_total`/`base_regular_tax_total` int def 0 (:46-47)
- `quantity` int def 1 (:49)
- `invoiced_subtotal`/`base_subtotal` int def 0 (:51-52); `invoiced_total`/`base_total` int def 0 (:54-55)
- `is_physical_product` bool def 1 (:57); `weight` decimal(10,2) null (:58); `weight_unit` string(10) null (:59); `product_data` text null "JSON snapshot of product/variant data" (:60); timestamps
- FKs: order_id -> orders cascade_on_delete; product_id -> products null_on_delete; variant_id -> variants null_on_delete (:63-74). No explicit indexes beyond FK.
- NO columns: tax rate, tax-inclusive flag, shipping allocation, tax profile id, per-item currency (inherited from order).
- Model `OrderItem.php`: casts :49-57 (ids int, `is_physical_product` bool, `weight` float, `product_data` json, `quantity` int; money columns uncast). Relations: `order`, `product`, `variant`, `order_item_coupons` hasMany (:102), `taxes` hasMany OrderTax by `order_item_id` (:114).

#### kirki_ecommerce_order_taxes (M:OrderTaxes:25-47)
- `id`; `order_id` unsigned_big_integer NOT NULL (:27); `order_item_id` unsigned_big_integer NULLABLE (:28)
- `type` string(20) def 'product', "Supported values: product, shipping" (:30); `name` string(100) NOT NULL (:31); `rate` decimal(8,4) NOT NULL (:32)
- `invoiced_amount`/`base_amount` int def 0 (:34-35); timestamps
- FKs: order_id -> orders cascade; order_item_id -> order_items cascade (:39-46). No indexes besides FKs.
- NOT stored: jurisdiction/country/state/zip, tax profile/region id, compound/priority flag, taxable base amount, tax-inclusive flag per line, tax class.
- Model `OrderTax.php`: casts :29-35 (`rate` float, amounts int). Relations `order`, `order_item` (:44,56).

#### kirki_ecommerce_order_coupons (M:OrderCoupons:25-58)
- `id`; `order_id` NOT NULL (:27); `coupon_id` null (:28); `customer_id` null "Snapshot of orders.customer_id, for per-customer usage-limit lookups" (:29)
- `code` string(100) NOT NULL (:31); `title` string(255) NOT NULL (:32); `discount_type` string(50) NOT NULL (:33); `discount_target` string(50) null (:34); `coupon_snapshot` text null "JSON snapshot of the coupon rules at checkout" (:35)
- `invoiced_discount_amount`/`base_discount_amount` int def 0 (:37-38)
- `usage_reversed_at` timestamp null (:40); timestamps
- Unique (order_id, coupon_id) `uq_kecom_order_coupons_order_id_coupon_id` (:43); index (coupon_id, customer_id) (:44)
- FKs: order cascade; coupon_id -> coupons null_on_delete; customer_id -> customers null_on_delete (:46-57)
- Model `OrderCoupon.php`: `coupon_snapshot` json, `usage_reversed_at` datetime, amounts int (:33-41). Relations: order, coupon, customer, `order_item_coupons` hasMany (:86).

#### kirki_ecommerce_order_item_coupons (M:OrderItemCoupons:25-43)
- `id`; `order_item_id` NOT NULL (:27); `order_coupon_id` NOT NULL (:28); `invoiced_discount_amount`/`base_discount_amount` int def 0 (:30-31); timestamps
- FKs: both cascade_on_delete (:35-42). NO unique constraint on (order_item_id, order_coupon_id); no indexes beyond FKs.
- Model `OrderItemCoupon.php`: relations `order_item`, `order_coupon`.

#### kirki_ecommerce_refunds (M:Refunds:25-51)
- `id`; `order_id` NOT NULL (:27); `status` string(50) def 'pending' "pending, completed, failed, cancelled" (:28); `invoiced_amount` int NOT NULL "Refund amount in cents, in the order currency" (:30); `reason` text null (:31); `refund_type` string(50) def 'partial' (full/partial) (:33); `refund_id` string(255) null "Gateway refund ID" (:35); `created_by`, `updated_by` unsigned_big_integer null (:37-38); timestamps
- Index on `status` (:41). FKs: order cascade; `created_by` -> `users.id` (note lowercase `id`, whereas orders uses `users.ID`) null_on_delete (:43-50). No FK on updated_by.
- NO `base_amount`, NO line/tax/shipping breakdown, NO refund-items table.
- Model `Refund.php`: only cast is `invoiced_amount` int; relation `order` only.
- AMBIGUITY: comment lists status 'failed' but `app/Constants/Order/RefundStatus.php` defines only PENDING, COMPLETED, CANCELLED.

#### kirki_ecommerce_order_activities (M:OrderActivities:25-46)
- `id`; `order_id` NOT NULL; `activity_type` string(100) NOT NULL; `description` text null; `metadata` text null (cast json in model); `created_by` null; timestamps. Indexes: activity_type, created_at. FKs: order cascade; created_by -> users.id null_on_delete.

## 2. Money per line item and order; currency; exchange rate

### Takeaway
Per item: unit price, regular unit price, subtotal (always tax-exclusive), discount, tax total, regular tax total, total (tax-inclusive of tax = subtotal - item coupon share? see below). Order: subtotal, shipping_total (INCLUDES shipping tax, net of shipping discount), discount_total (INCLUDES shipping discount), tax_total (items + shipping), shipping_tax_amount, total. Currency and exchange rate are snapshotted per order, not per line.

### Cited Findings
- Per-item columns listed above (M:OrderItems:36-55). Per-item tax is a single summed `*_tax_total`; per-rate detail lives only in order_taxes.
- Calculation semantics (`app/Actions/Cart/RecalculateCartAction.php:355-396`): `net_total` minus `discount` = taxable amount; `item_total = taxable`, plus tax only when store is NOT tax-inclusive (:371-376). `base_subtotal` = net total with embedded tax excluded (`exclude_tax`, :381-390), `base_unit_price` and `base_regular_unit_price` also tax-exclusive (:383-384), `base_regular_tax_amount` computed on regular total (:340-350,386). So `item.base_total` = discounted amount (+ tax if exclusive pricing). Under tax-inclusive pricing, `base_total` = taxable amount that already contains tax (hence `base_subtotal - discount + tax` does not equal `base_total` in inclusive mode without care; derived by spec `item-pricing-tax-exclusivity`).
- Order totals (`RecalculateCartAction.php:494-514`): `base_subtotal` = sum item subtotals (excludes shipping); `base_discount_total` = sum item discounts + shipping discount; `base_tax_total` = sum item tax + shipping tax; `base_total` = max(sum item totals + shipping total, 0); `base_shipping_total` = shipping subtotal - shipping discount + shipping tax (`build_shipping_result`, :425-440). Shipping is always taxed exclusively (docblock :412-417).
- Shipping subtotal and shipping discount are NOT stored separately on `orders` (only `*_shipping_total` and `*_shipping_tax_amount`). Pre-tax net shipping can be derived: shipping_total - shipping_tax_amount (= subtotal - discount); shipping discount alone is not recoverable except via a free-shipping order_coupon amount.
- Tax-inclusive flag: ORDER level only, `orders.is_tax_inclusive` (M:Orders:57), set from `Tax::is_tax_inclusive()` at creation (`CreateOrderAction.php:~673`). Comment says "when this order was last calculated" (edits recalc it). No per-line flag.
- Currency snapshot: `orders.currency_code`, `base_currency_code`, `exchange_rate` decimal(15,6) null (M:Orders:36-38). Set from `Currency::exchange_rate($target)` in `CreateOrderAction::prepare_create_order_dto` (:~650-655). Every `invoiced_*` is derived by converting each `base_*` independently via `convert_amount()` (`CreateOrderAction.php:~812-819`, Money::convert_to_currency), so invoiced values are rounded per-field and sums can drift by rounding. Base amounts are authoritative; the base-currency path is exact.
- Order totals in `invoiced_*` are converted from base totals, not summed from invoiced lines (`CreateOrderAction.php:~655-678`).
- Payment provider fee stored (`*_payment_provider_fee`) but not part of the calculation engine in these files.

### Inferences
- Because invoiced amounts are converted per field, the sum of invoiced item/tax rows may differ by +/- a few minor units from the invoiced order total (spec only tolerates this for coupons: `order-coupon-attribution` spec, reconciliation requirement).

### Gaps
- Did not trace `Money::convert_to_currency` rounding mode or whether the exchange_rate is inverted for non-base currencies.
- Did not verify whether `UpdateOrderAction` recomputes `exchange_rate` (it sets many totals at `UpdateOrderAction.php:~250-264`).

## 3. order_taxes: what is stored

### Takeaway
One row per (tax component x scope). Scope = a product item (type 'product', order_item_id set), a per-item share of shipping tax (type 'shipping', order_item_id set), or whole-order shipping (type 'shipping', order_item_id NULL). Row stores name, rate (percent, 4 dp) and amount only; no jurisdiction or tax-profile reference.

### Cited Findings
- Schema: M:OrderTaxes:27-35. `type` values constant `app/Constants/Order/OrderTaxType.php:12-13` (PRODUCT, SHIPPING).
- Writer `app/Concerns/PersistsOrderTaxes.php:47-80`: deletes all order taxes then rebuilds. For each order item, one row per `tax_line` of that item (`:59-65`, type PRODUCT, item id = order item id). For each shipping tax line, `item_id` (variant id) maps to the order item if the strategy split proportionally (EU), else NULL (`:67-75`). Line name/rate come from `TaxLineDTO` (`app/DTO/Tax/TaxLineDTO.php`: `name`, `rate`, `base_amount`, `item_id`). `invoiced_amount` = converted base_amount (:103-104).
- Reconciliation: sum of `base_amount` over all rows must equal the calculated `base_tax_total`, else exception (`:119-132`). (Invoiced sum not checked.)
- Spec `openspec/specs/order-tax-lines/spec.md`: multiple simultaneous rates per item allowed (one row per component); shipping split per item allowed even with equal rates; cached totals must equal sums: item `*_tax_total` = sum of item's lines; order `*_shipping_tax_amount` = sum of shipping-scoped lines; order `*_tax_total` = all lines. Item no longer stores merged rate or embedded breakdown. Pre-existing orders have no tax lines and no per-line detail.
- Order loading: `OrderService.php:266,292` eager-loads `items.taxes` and `shipping_taxes`. Note: `Order::taxes()` (all) and `shipping_taxes()` exist.
- Regular-price tax (`item.*_regular_tax_total`) is a cached figure with no order_taxes rows (computed `rate/100 * regular total` per line, `RecalculateCartAction.php:340-350`).

### Inferences
- The rate is stored as percent (calc multiplies by rate then divides by 100), decimal(8,4) allows e.g. 20.0000 / 7.5000. Compound tax and tax-on-tax are not representable except as additional rows; no priority/compound column.
- Per-item shipping tax allocation is stored only as tax amount (order_taxes with type shipping + order_item_id); the shipping charge allocation (net) per item is not stored.
- Because a whole-order shipping tax row has NULL order_item_id, and item-scoped rows cascade on item delete, deleting an order item removes its per-item shipping tax rows (cascade) but not whole-order ones.

### Gaps
- Tax profile / tax region identity: no column links an order or tax row to `kirki_ecommerce_tax_profiles`; only `name` string snapshot. Did not read tax profile migration or tax strategy spec in depth (out of scope; other researchers).
- `tax_id_number/type` and `reverse_charge` exist on orders; I did not find where `reverse_charge` is written or consumed (not traced).

## 4. order_coupons / order_item_coupons

### Takeaway
order_coupons = one frozen row per applied coupon per order (code, title, discount_type, discount_target, full JSON rule snapshot, total discount in both currencies, usage reversal timestamp). order_item_coupons = per (item, order_coupon) discount attribution amount. Multiple coupons CAN discount the same item (one row each); the schema does not enforce uniqueness on the pair.

### Cited Findings
- Schemas as above (M:OrderCoupons, M:OrderItemCoupons).
- Writer `app/Concerns/PersistsOrderCoupons.php:56-143`: one order_coupon per `coupon_results` entry; `code`, `title`, `discount_type`, `discount_target` copied from live coupon; `coupon_snapshot = $coupon->to_array()` (:88); `base_discount_amount = coupon_result->total_discount` (:90); `invoiced` converted (:89); `customer_id = order->customer_id` (:83). For each `coupon_result->item_discounts[variant_id] => amount` a row in order_item_coupons is created (skips zero amounts) (:102-123); throws if no matching order item for variant (:107-114). Items matched by variant_id (so duplicate variants in one order would collide in the map at :66-70).
- Free-shipping coupons: amount = shipping cost waived, no item attributions (spec `order-coupon-attribution`). So `orders.base_discount_total` includes shipping discount and equals sum of order_coupons amounts (assert `:169-195`, exact in base, tolerance 1 minor unit per coupon in invoiced).
- Spec: two coupons discounting the same item produce separate attribution rows (scenario in `order-coupon-attribution/spec.md`). Item `*_discount_amount` equals the sum of its attribution rows (spec). Note: the spec of `admin-order-calculation-breakdown` distinguishes product-scoped coupons from order-wide coupons for the item's subtotal; but order_item_coupons records attributions for item-scoped AND cart-wide coupons ("item-scoped or cart-wide coupon").
- Usage: increments `coupons.current_usage_count` on new, decrements on removal unless already reversed; `usage_reversed_at` set on cancel and preserved across edit-regeneration (:92-98,128-134). Unique (order_id, coupon_id) so one row per coupon per order; `coupon_id` is nullable (SET NULL on coupon delete) but code/title/type/target/snapshot survive.
- `discount_target` values: not enumerated in the migration; column only string(50) nullable. Value copied from `Coupon.discount_target`.

### Inferences
- Allocation of cart-wide/order-level coupon amounts across items is stored (item attribution rows), but not any per-item allocation of shipping discount.
- Coupon amounts attributed to items are discount amounts, not tax-adjusted; no column records whether a discount was applied before or after tax (taxable base after discount per `RecalculateCartAction.php:362-363`).

### Gaps
- Did not read `Coupon` model/migration to enumerate `discount_type` / `discount_target` values (other researcher presumably covers coupons).
- Unique (order_id, coupon_id) with nullable coupon_id: MySQL allows multiple NULL coupon_ids per order (relevant only if a coupon were deleted then re-synced); not verified in practice.

## 5. Shipping storage

### Takeaway
Shipping is a single order-level amount (net of discount, plus tax) plus a separate shipping-tax amount and optional shipping-tax rows. No per-item shipping allocation column anywhere. No separate shipping rate record (only method id/name/type snapshot in JSON).

### Cited Findings
- Columns: `orders.invoiced/base_shipping_total` (M:Orders:47-48), `invoiced/base_shipping_tax_amount` (:55-56), `shipping_method` string(100) (:72), `shipping_metadata` json text (:73), carrier/tracking columns (:74-76).
- `shipping_metadata` content: `['shipping_method' => ['id','name','type']]` only (`CreateOrderAction.php:~852-870`). No cost, no rate, no zone/profile id.
- `base_shipping_total` = subtotal - discount + tax (`RecalculateCartAction.php:425-440`).
- Shipping tax rate: stored in order_taxes rows type='shipping' (`rate`, `name`, amounts) — see section 3. Per-item share of shipping TAX is stored when the strategy splits it; per-item share of the shipping CHARGE is not.
- Free shipping is represented as an order_coupons row (amount = waived shipping), not a column on orders.

### Inferences
- A tax engine that needs per-item shipping allocation (e.g., to reproduce EU split) must recompute it or rely on the order_taxes shipping rows with `order_item_id`.

### Gaps
- Pre-tax shipping subtotal and shipping discount are not independently stored (derivable only partially).

## 6. Refunds vs items / taxes / shipping

### Takeaway
Refunds are order-level money only: a single amount in order currency, status, type, reason, gateway id. No line-level, tax-level, or shipping-level breakdown is stored. Shipping is excluded from the refundable cap.

### Cited Findings
- Schema M:Refunds:25-51; model `app/Models/Refund.php`.
- `CreateRefundAction.php` (file contains `@todo: need to fix this`): requires `payment_status == PAID` and fulfillment in DELIVERED or CANCELLED; refundable = `order.invoiced_total - sum(pending+completed refunds.invoiced_amount) - order.invoiced_shipping_total`; type FULL if amount equals refundable, else PARTIAL; sets `orders.is_refund_initiated = true`, `order_status = REFUND_REQUESTED`; calls provider->refund only when `payment_transaction_id` set.
- `OrderService::mark_refund_as_completed` (`OrderService.php:~395-420`) sets `payment_status = REFUNDED`, `order_status = REFUNDED` when refund initiated (entire order, even for partial refunds). `Order::scope_apply_status_filter` includes PaymentStatus::REFUNDING/REFUNDED.
- API resource exposes refund id, invoiced_amount money object, type, reason, transaction_id, status, created_at (`app/Resources/Order/OrderResource.php:143-151`).
- Refund status constants only pending/completed/cancelled (`RefundStatus.php`) although migration comment lists 'failed'.
- Refunds on update/delete have their own actions (`UpdateRefundAction.php`, `DeleteRefundAction.php`) — not read.

### Inferences
- Tax refunded cannot be stated precisely: nothing links a refund to order_items or order_taxes; any refunded-tax reporting would need proportional estimation from `refund.invoiced_amount / order.invoiced_total`.
- Excluding `invoiced_shipping_total` from refundable cap means shipping (and shipping tax) is never refundable through this action as written, flagged as `@todo`.
- No `base_amount` on refunds, so base-currency refund reports need `invoiced_amount / exchange_rate`.

### Gaps
- Did not read UpdateRefundAction/DeleteRefundAction or the OrderActivity writers for refund events.

## 7. Snapshots: frozen vs live

### Takeaway
Frozen at order time: amounts, tax rows (name + rate), coupon code/title/type/target/rule JSON, product/variant JSON, product/variant name/sku/barcode/weight, customer contact, addresses, currency/exchange rate, payment provider and shipping method JSON, is_tax_inclusive. Live (nullable FK, SET NULL): product, variant, coupon, customer, tax profile (not referenced at all).

### Cited Findings
- Items: name/sku/barcode/image id/weight copied (`CreateOrderAction.php:~742-800`); `product_data` JSON = `['product' => $product->to_array(), 'variant' => $variant->to_array()]` (:791-794). `product_id`/`variant_id` are live FKs, null_on_delete (M:OrderItems:67-74), so order survives product deletion. `product_image` is a media ID (live reference, not a URL snapshot; unverified whether media deletion is handled).
- Coupons: scalar fields + full `coupon_snapshot` JSON; `coupon_id` live FK null_on_delete (M:OrderCoupons:50-53). Spec "Order-side coupon records are immutable after checkout".
- Taxes: name/rate frozen per row; no FK to tax profile or region.
- Payment: `payment_metadata` JSON snapshot `['payment_provider' => ['id','name','icon','is_offline']]` (`CreateOrderAction.php:~826-840`). Shipping method snapshot as above.
- Customer: `customer_id` live FK (null_on_delete) plus snapshot columns `customer_first_name/last_name/email/phone`; address columns inline on the order.
- Currency: `exchange_rate` frozen at order time; `base_currency_code` frozen.
- Edits: `UpdateOrderAction` re-runs a calculation and rebuilds order_taxes/order_coupons (via the same traits), so frozen data can be regenerated on admin edit; `is_tax_inclusive` is documented as "last calculated" (M:Orders:57).

### Inferences
- A tax-profile schema change needs to consider that edits to an order replay live tax settings (calculation context), unlike purely frozen historical rows; historical orders without tax lines are explicitly unsupported by spec (`order-tax-lines`).

### Gaps
- Whether product_data snapshot includes tax class/tax-profile data of the product depends on `Product::to_array()`; not inspected.
- Did not inspect `UpdateOrderAction` flow in detail to confirm which snapshots it refreshes vs preserves.

## Ambiguities / notes for the report writer
- No `tax_profile_id`, jurisdiction, taxable base, compound flag, tax class or per-line inclusive flag exists on any order table.
- Only some money columns are int-cast in models (Order: tax and fee columns; OrderItem: none; OrderTax/OrderCoupon/OrderItemCoupon/Refund: all). Uncast ones return DB-native strings.
- `refunds.created_by` FK references `users.id`; `orders.created_by` references `users.ID` (case differs; the other `created_by` columns are plain). 
- Line numbers marked with "~" are approximate (derived from sed range output without precise per-line printing); all others exact.
- A prior migration squash exists (`openspec/changes/squash-migrations-into-create-tables`), so these Create*Table files are the full current schema; there are no ALTER migrations for orders.
