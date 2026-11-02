# EU VAT rules and reference order data models (WooCommerce, Shopify, Magento, Stripe)

Note: EUR-Lex direct fetch returned empty content; Directive article text comes via legislation.gov.uk copies and secondary summaries surfaced by search. Search-tool summaries were used for some items; those are flagged. Verify article numbers against EUR-Lex before quoting in specs.

## 1. VAT on shipping in mixed-rate baskets (ancillary supply, apportionment, national differences, OSS/IOSS); what an invoice must show

### Takeaway
Shipping charged to the customer is generally treated as ancillary to the goods (follows the principal supply) and, for mixed-rate baskets, is commonly split across rates in proportion to goods values. I found no primary EU or national authority text confirming the proportional method; only secondary sources. Invoices must show taxable amount per rate, rate, and VAT amount (Art. 226).

### Cited Findings
- Directive 2006/112/EC is the framework; it covers invoicing and record-keeping duties, with Reg. 282/2011 and Commission guidelines (non-binding) alongside — [European Commission VAT Directive page](https://taxation-customs.ec.europa.eu/taxation/vat/vat-directive_en); consolidated text: [EUR-Lex](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A02006L0112-20240101)
- Secondary source: Art. 78(b) includes incidental expenses such as transport in the taxable amount, so shipping is not generally a separate service; ancillary supply follows principal supply — [EAS help article](https://help.easproject.com/hc/en-gb/articles/5821760268191-Applicable-VAT-rate-on-shipping-and-delivery-charges-EU-and-UK) (vendor article, not authority)
- Secondary sources: for mixed baskets most vendor guides say shipping is apportioned across rates, typically by value; a German tax-advisory example: book 10 net (7%), other item 20 net (19%), shipping 6 net gives 2 at 7% and 4 at 19% — [Taxdoo](https://www.taxdoo.com/?p=7795); [Avalara mixed supplies](https://www.avalara.com/vatlive/en/eu-vat-rules/eu-vat-digital-services-moss/mixed-supplies-which-vat-rate.html)
- Ireland Revenue: for a multiple supply, consideration must be apportioned between the individual supplies; for a composite supply, whole consideration takes the rate of the principal element — [Revenue.ie](https://revenue.ie/en/vat/charging-vat/vat-and-mixed-supplies-of-goods/index.aspx)
- German shop-owner forums describe the same pro-rata practice and also a "majority by value" simplification; forums say it is a simplification, not a legal rule. Shopware at one point used fixed 7%, 19% or the highest rate for shipping — [Shopware forum](https://forum.shopware.com/t/versandkosten-steuersatz-problem-fuer-de-bei-gemischten-artikeln-im-wk-mit-mwst-7-und-19/101171); [Shopify community](https://community.shopify.com/t/unterschiedliche-steuersatze-und-ausweisung-des-richtigen-versandversteuerung/24222/1)
- Art. 226 invoice content (points 8-10): taxable amount per rate or exemption, unit price excl. VAT, discounts/rebates if not included in unit price; VAT rate applied; VAT amount payable — [legislation.gov.uk Art. 226 (2020 version)](https://www.legislation.gov.uk/eudr/2006/112/article/226); [VATupdate explainer](https://www.vatupdate.com/2022/05/12/eu-vat-directive-2006-112-ec-explained-art-226-content-of-an-invoice)
- OSS/IOSS: sales to EU consumers are taxed at the destination Member State rate; IOSS covers consignments up to EUR 150 (intrinsic value) — [EC One Stop Shop](https://vat-one-stop-shop.ec.europa.eu/one-stop-shop_en); [Your Europe OSS](https://europa.eu/youreurope/business/finance-and-tax/vat/one-stop-shop/index_en.htm)
- Commission guidance (addendum on handling fee) says a handling fee is part of the VAT taxable amount as an incidental expense to the supply — [EC OSS addendum](https://vat-one-stop-shop.ec.europa.eu/document/download/3086db0e-7b4a-4202-9f38-d32bd774f5a8_en?filename=20260821_VAT+guidelines-3+EUR+Customs+duty_revised.pdf) (reported via search summary, not read directly)
- Temporary EUR 3 customs duty per item on low-value consignments from 1 July 2026 until 1 July 2028 — [Consilium](https://www.consilium.europa.eu/en/press/press-releases/2025/12/12/customs-council-agrees-to-levy-customs-duty-on-small-parcels-as-of-1-july-2026/)

### Inferences
- A schema should be able to store shipping tax as one or more lines, each with its own rate and base, because a mixed basket can produce two rates on shipping.
- Rate of tax is determined per destination (OSS), so the stored rate/jurisdiction must be a snapshot at order time.

### Gaps
- No primary national guidance retrieved (German UStAE Abschnitt 3.10 / 10.1, Austrian UStR, Dutch guidance); only forums and vendor articles. Not verified that Germany/Austria/Netherlands mandate proportional split vs allow alternatives.
- Exact current Art. 226 / Art. 78 / Art. 79 wording from EUR-Lex not read.
- Whether shipping counts toward the EUR 150 IOSS threshold: not confirmed.

## 2. Discounts, coupons, vouchers and VAT; allocating order-level discounts across lines

### Takeaway
Retailer discounts reduce the taxable amount of the discounted goods; the CJEU (Elida Gibbs, Kuwait Petroleum) lets coupon-reimbursed amounts reduce the supplier's taxable base. Since 2019, single-purpose vouchers are taxed at issue/transfer and multi-purpose vouchers at redemption. I found no primary rule for allocating an order-level discount across lines of different rates.

### Cited Findings
- Elida Gibbs (C-317/94): cash-back and reimbursed coupons allow the manufacturer to reduce the taxable amount, because VAT collected should not exceed what the final consumer paid — [BAILII C-317/94](https://www.bailii.org/eu/cases/EUECJ/1996/C31794.html); [HMRC VATSC06640](https://gov.uk/hmrc-internal-manuals/vat-supply-and-consideration/vatsc06640)
- Kuwait Petroleum (C-48/97): taxable amount is selling price less the voucher amount refunded; HMRC treats the line as reinforced by C-427/98 — [HMRC VATSC06640](https://gov.uk/hmrc-internal-manuals/vat-supply-and-consideration/vatsc06640); [HMRC VATVAL06160](https://gov.uk/hmrc-internal-manuals/vat-valuation/vatval06160)
- Directive 2016/1065 added Art. 30a (definitions), 30b (single-purpose: each transfer is a supply of the underlying goods; multi-purpose: VAT only at actual supply), 73a (taxable amount for multi-purpose vouchers: consideration paid, or the monetary value on the voucher, less VAT); applies to vouchers issued after 31 Dec 2018 — [legislation.gov.uk Dir. 2016/1065](https://www.legislation.gov.uk/eudr/2016/1065/data.htm); [EUR-Lex ELI](https://eur-lex.europa.eu/eli/dir/2016/1065/oj)
- Art. 226 point 8 requires discounts to be shown on invoices if not already in the unit price — [legislation.gov.uk Art. 226](https://www.legislation.gov.uk/eudr/2006/112/article/226)

### Inferences
- Store both pre-discount and post-discount line amounts, plus the discount amount per line, so the invoice can show unit price and rebate and compute tax on the post-discount base.
- A coupon in a shop that is a price reduction (retailer-funded discount) differs from a gift card/multi-purpose voucher sold as a payment instrument; the latter is not a discount and should not be stored as a discount line.
- Pro-rata (by line net value) allocation of an order-level discount is the practical way to give each rate its own reduced base; Shopify and Magento do this (section 4) but I found no EU rule text prescribing it.

### Gaps
- No primary source for proportional allocation of order-level discounts across lines with differing rates; no national authority text on manufacturer vs retailer coupon treatment retrieved beyond CJEU summaries.
- Single-purpose vs multi-purpose edge cases (e.g. free-shipping coupons, store credit) not researched.
- Whether the Commission's review under Art. 410b changed the voucher rules: not found.

## 3. Rounding

### Takeaway
EU law has no harmonised rounding level; CJEU (Wetherspoon C-302/07) leaves the method to Member States. A schema should keep unrounded or consistently rounded amounts and ensure per-rate and total VAT reconcile with the invoice.

### Cited Findings
- Commentary: Directive and CJEU leave rounding to national level; Wetherspoon said fiscal neutrality and proportionality do not require a particular method, only that the result corresponds as closely as possible to the VAT from applying the rate — [VATupdate on C-302/07](https://www.vatupdate.com/2021/08/25/flashback-on-ecj-cases-c-302-07-j-d-wetherspoon-rules-on-rounding-of-vat-amounts/); [AG opinion C-302/07](https://mansfield.bailii.org/eu/cases/EUECJ/2008/C30207_O.html)
- UK HMRC accepts rate-level and line-level calculation if consistent — [HMRC VATREC12010](https://www.gov.uk/hmrc-internal-manuals/vat-trader-records/vatrec12010) (UK, not EU)
- Vendor claim, unverified: some countries (e.g. Italy) require document-level calculation — [Thomson Reuters rounding](https://nttdata.hostedtax.thomsonreuters.com/determination-help/Content/uiguide/concepts/rounding.htm)

### Inferences
- Because Art. 226 requires taxable amount and VAT per rate, the invoice-level per-rate VAT is the reconciliation anchor; line-level rounding can produce differences against it, so a rounding adjustment or per-rate tax lines are needed if lines are rounded individually.

### Gaps
- Per-Member-State rounding rules (DE, AT, NL) not retrieved. No VAT Committee guidance found.

## 4. Reference data models

### Takeaway
All four systems separate line items, shipping lines, and tax lines. Shopify and Magento store per-line tax and per-line discount allocations; WooCommerce stores per-item tax arrays keyed by rate ID and an order-level tax line per rate, and has no explicit per-line discount field.

### Cited Findings
- WooCommerce order fields: `discount_total` (sum of line discounts), `discount_tax`, `shipping_total` (excl. tax), `shipping_tax`, `cart_tax` (line taxes only), `total_tax`, `prices_include_tax`; arrays `line_items`, `tax_lines`, `shipping_lines`, `fee_lines`, `coupon_lines` — [WooCommerce wiki](https://github.com/woocommerce/woocommerce/wiki/Order-and-Order-Line-Item-Data)
- WooCommerce line item: `subtotal`, `subtotal_tax` (before discount), `total`, `total_tax` (after discount), `taxes` keyed `subtotal` and `total` mapping rate ID to amount; discount is implied by subtotal minus total — same wiki
- WooCommerce shipping line: `total`, `total_tax`, `taxes.total` by rate ID, `method_id`, `method_title`; no subtotal or discount — same wiki
- WooCommerce tax line: `rate_code`, `rate_id`, `label`, `compound`, `tax_total` (excl. shipping), `shipping_tax_total` — same wiki
- WooCommerce coupon line: `code`, `discount`, `discount_tax` — same wiki
- WooCommerce shipping tax with mixed classes: forum reports conflict (standard-rate fallback, highest rate, or user-reported proportional split); not documented in sources I found — [WP support thread](https://wordpress.org/support/?p=18046147); [other thread](https://remarpro.com/support/?p=17490907) (unreliable, unconfirmed)
- Shopify: each line item has `tax_lines` and `discount_allocations`; `shipping_lines` likewise have `tax_lines` and `discount_allocations`; order-level `discount_applications` record intent, and allocations hold the computed amount per line with a reference to the application — [Shopify GraphQL DiscountAllocation](https://shopify.dev/docs/api/admin-graphql/latest/objects/DiscountAllocation); [ShippingLine](https://shopify.dev/docs/api/admin-graphql/latest/objects/ShippingLine)
- Shopify ShippingLine stores `originalPriceSet`, `discountedPriceSet`, `currentDiscountedPriceSet` (after refunds), tax inclusion follows order `taxesIncluded`, plus shop and presentment currency bags — [ShippingLine](https://shopify.dev/docs/api/admin-graphql/latest/objects/ShippingLine)
- Magento `sales_order_item` columns include: tax_percent, tax_amount, tax_before_discount, discount_percent, discount_amount, discount_tax_compensation_amount, price, price_incl_tax, row_total, row_total_incl_tax, and invoiced/refunded/canceled variants (tax_invoiced, tax_refunded, discount_invoiced, discount_refunded, amount_refunded, etc.), each with a `base_` twin for base currency — [Magento db_schema.xml](https://raw.githubusercontent.com/magento/magento2/2.4-develop/app/code/Magento/Sales/etc/db_schema.xml) (first 100k chars only)
- Magento `discount_tax_compensation_amount` (formerly hidden_tax_amount) tracks tax not calculated on discounted items due to tax-after-discount settings — [Magento StackExchange](https://backiee.wasmer.app/https_magento_stackexchange_com/a/363761)
- Magento per-rule tax breakdown lives in `sales_order_tax` and `sales_order_tax_item` — [Vortex docs](https://docs.vortexiq.ai/nerve-centre/kpi-cards/adobe-commerce/tax-analysis.md) (column list not confirmed)
- Stripe Tax Calculation API: `line_items` and a separate `shipping_cost`, each with tax behavior; response has `tax_amount_exclusive`, `tax_amount_inclusive`, `tax_breakdown`; tax transaction data has separate line-item and shipping-cost tables; import format has `line_item.amount_discount` and `shipping_line_item.amount_discount` — [Stripe custom tax](https://docs.stripe.com/tax/custom); [Stripe Data](https://docs.stripe.com/stripe-data/query-tax-data); [Stripe imports](https://edge-docs.stripe.com/tax/imports)

### Inferences
- Common structure: (a) immutable snapshot of rate, base and amount per tax line; (b) tax lines attached to both product lines and shipping lines; (c) discount stored as an allocation per line, separate from the discount rule; (d) both original and post-discount prices stored; (e) refunded/invoiced counters per line (Magento).
- WooCommerce's rate-ID keyed arrays tie tax to a mutable rate table; storing rate percentage and label on the order is safer for audit.

### Gaps
- Magento `sales_order_tax_item` columns, and `sales_order_tax` columns: not read (db_schema.xml truncated).
- WooCommerce `order_itemmeta`/`woocommerce_order_items` table schema not read; WooCommerce official doc of shipping tax class option ("based on cart items") not retrieved.
- Shopify REST doc page not retrieved (GraphQL used); Stripe `tax_breakdown` schema not read.

## 5. Refund requirements

### Takeaway
Refund rows should reverse per line: net amount, tax, discount allocation and a share of shipping with its tax. I found no EU primary text on credit note format in this pass; the evidence is from data model design only.

### Cited Findings
- Magento keeps refunded counters per order item for amount, tax and discount (`amount_refunded`, `tax_refunded`, `discount_refunded`, `discount_tax_compensation_refunded`) — [Magento db_schema.xml](https://raw.githubusercontent.com/magento/magento2/2.4-develop/app/code/Magento/Sales/etc/db_schema.xml)
- Shopify ShippingLine exposes `currentDiscountedPriceSet` (price after refunds and discounts) — [ShippingLine](https://shopify.dev/docs/api/admin-graphql/latest/objects/ShippingLine)
- Elida Gibbs: reductions of consideration after the sale reduce the taxable amount (basis for credit note adjustments) — [HMRC VATSC06640](https://gov.uk/hmrc-internal-manuals/vat-supply-and-consideration/vatsc06640)

### Inferences
- A refund needs per-line: quantity, net refunded, tax refunded (per rate), discount-allocation portion reversed; and per shipping line: net and tax refunded. Without stored per-line discount allocation and per-rate shipping tax, a partial refund cannot be computed exactly.
- Partial refund of a discounted line should refund the post-discount price proportionally.

### Gaps
- Art. 90 (reduction of taxable amount on price reduction after supply) and Art. 219 (credit note as invoice) not retrieved; national credit-note rules not researched.
- WooCommerce refund structure (refund as child order with negative items) not verified in this pass.
