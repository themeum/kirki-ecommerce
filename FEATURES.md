# Kirki eCommerce — Feature List

A complete inventory of the features shipped by the plugin, grouped by domain.

---

## Catalog & Products

1. **Product Management**: Create, edit, duplicate, trash, restore and permanently delete products from the admin app.
2. **Product Statuses**: Products move between draft, published and trashed states with publish/trash timestamps.
3. **Product Variants**: Generate and manage multiple purchasable variants per product from an attribute matrix.
4. **Product Attributes**: Define reusable attributes (e.g. Size, Color) with typed input styles.
5. **Attribute Values**: Manage the value set of each attribute, including color swatches and list options.
6. **Variation Library**: Central library of reusable color and list variation presets shared across products.
7. **Categories**: Hierarchical product categories with full CRUD and bulk actions.
8. **Tags**: Lightweight product tagging with full CRUD and bulk actions.
9. **Brands**: Assign products to brands, managed as their own entity.
10. **Collections**: Curated product groupings with a dedicated detail view.
11. **Product Media Gallery**: Attach and reorder multiple media items per product via the WordPress media picker.
12. **Variant Images**: Assign a dedicated image to each individual variant.
13. **Additional Info Blocks**: Add arbitrary key/value specification rows to a product.
14. **Product Ribbons**: Show a promotional label badge on a product.
15. **Short & Long Descriptions**: Separate summary and rich-text body content per product.
16. **SEO Settings**: Per-product SEO title, description and keywords with a live search-engine preview.
17. **Social Share Metadata**: Per-product Open Graph title, description and image with a share preview.
18. **Product Schema Profiles**: Reusable structured-data (JSON-LD) schema profiles assignable to products.
19. **Bulk Variant Editor**: Spreadsheet-style grid for editing many variants at once with fill, column visibility and unsaved-change guards.
20. **Product Bulk Actions**: Apply delete, trash and restore to selected or all matched products.
21. **Product Filtering & Search**: Filter and search product lists by status, brand, category and other facets.

## Inventory

22. **Inventory Tracking**: Track available quantity per variant, or fall back to a simple in-stock flag.
23. **Inventory Grid**: Dedicated screen for adjusting stock levels across all variants inline.
24. **Low Stock Threshold**: Per-variant and store-wide thresholds that drive low-stock warnings.
25. **Availability Status Resolution**: Derive an in-stock / low-stock / out-of-stock / partially-stocked label per variant and per product.
26. **Backorders**: Allow selling a variant after it reaches zero stock.
27. **Stock Reservation**: Reserve, release and confirm committed quantity as orders progress.
28. **Per-Order Purchase Limits**: Cap the maximum quantity of a variant allowed in a single order.

## Pricing & Currency

29. **Variant Pricing**: Base price, sale price and cost of goods per variant.
30. **Unit Pricing**: Show a per-unit price derived from base unit and total unit amounts.
31. **Multi-Currency**: Define additional store currencies alongside the base currency.
32. **Display Currency Conversion**: Convert stored base-currency amounts into the visitor's selected currency on the fly.
33. **Exchange Rate Providers**: Pull live rates from CurrencyApi or ExchangeRatesApi with API key configuration.
34. **Automatic Rate Updates**: Scheduled rate refresh with configurable frequency, caching and fallback behaviour.
35. **Currency Formatting**: Configure symbol position, short/long format, thousand and decimal separators.

## Discounts & Coupons

36. **Coupon Management**: Create, edit, duplicate, activate/deactivate and delete coupons.
37. **Coupon Code Generator**: Generate a unique coupon code on demand.
38. **Discount Types**: Amount off, and free shipping.
39. **Percentage or Fixed Discounts**: Choose between percentage and fixed-amount discount values.
40. **Discount Targets**: Apply a discount to the whole order or only to eligible products.
41. **Item Eligibility Rules**: Restrict a coupon to all products, specific products.
42. **Spend Conditions**: Require a minimum cart amount or minimum item count before a coupon applies.
43. **Coupon Scheduling**: Start and optional end date/time, with active, scheduled, inactive and expired states.
44. **Country Targeting**: Limit a coupon to all countries or a specific list.
45. **Customer Eligibility**: Include or exclude specific customer, guests or first-time buyers.
46. **Usage Limits**: Cap total redemptions and redemptions per customer, with usage counting.
47. **Coupon Combinations**: Control which other discounts a coupon may stack with.
48. **Coupon Validation Endpoint**: Validate a code server-side before it is applied.

## Cart & Checkout

49. **Guest Cart**: Cookie-identified carts for visitors who are not logged in.
50. **Cart Operations**: Add, update quantity, remove items and empty the cart.
51. **Cart Identity Sync**: Attach a guest cart to the user account on login.
52. **Cart Coupon Application**: Apply and remove a coupon code against the cart.
53. **Cart Recalculation**: Recompute subtotals, discounts, shipping and tax after every cart change.
54. **Mini Cart Shortcode**: Shortcode equivalent of the mini cart for non-block themes.
55. **Checkout Flow**: Single-page checkout with contact, billing, shipping, shipping method, payment and summary sections.
56. **Guest Checkout**: Optionally allow orders to be placed without an account.
57. **Checkout Field Rules**: Mark address line, phone, company name, company ID and VAT number as required, optional or hidden.
58. **Checkout Coupon Field**: Optionally expose a coupon entry field at checkout.
59. **Terms & Privacy Consent**: Configurable terms-and-conditions and privacy-policy content shown at checkout.
60. **Checkout Customer Provisioning**: Create or match a customer record from checkout details.
61. **Order Calculation API**: Server-side endpoint that returns totals for a prospective order.
62. **Order Success & Failure Pages**: Dedicated post-checkout result pages.

## Orders & Fulfillment

63. **Order Management**: List, view, edit and delete orders with bulk actions.
64. **Manual Order Creation**: Build an order from the admin, selecting customer, products, payment and notes.
65. **Order Numbering**: Configurable order ID prefix and suffix.
66. **Invoice Numbering**: Configurable invoice prefix, suffix and counter reset schedule.
67. **Order Status Model**: Combined payment and fulfillment status matrix covering pending through completed, cancelled, failed and refunded states.
68. **Fulfillment Statuses**: Unfulfilled, processing, shipped, delivered, on-hold, cancelled and returned.
69. **Order Actions**: Mark as processing/shipped/delivered/on-hold, cancel or resume fulfillment, cancel or archive the order.
70. **Payment Actions**: Mark an order as paid, send a payment link, or send an invoice.
71. **Shipment Tracking**: Record carrier, tracking number and tracking URL against an order.
72. **Order Activity Timeline**: Chronological log of every order event, from placement to completion.
73. **Order Notes**: Add and delete internal comments on an order's timeline.
74. **Order Snapshots**: Persist invoiced and base-currency totals, exchange rate, addresses and discount details at the time of purchase.
75. **Guest Order Merge**: Attach orders placed as a guest to the account once its email is verified.
76. **Resend Order Email**: Re-trigger the notification email for an order.

## Payments

77. **Offline Payment Methods**: Create and manage manual gateways such as cash on delivery and bank transfer, with custom instructions.
78. **Online Payment Gateways**: Install, configure, enable and disable hosted payment providers.
79. **Gateway Marketplace**: Browse installable providers — PayPal, Stripe, Authorize.net, Razorpay, Mollie, Klarna, Square, Paystack, QuickPay, Paddle, 2Checkout, Redsys, PayMango, PayFast, Eway and PayU.
80. **Payment Webhooks**: Public webhook endpoint per provider for asynchronous payment updates.
81. **Payment Provider Fees**: Record the gateway fee charged against each order.

## Shipping

82. **Shipping Zones**: Define geographic zones and the delivery methods available in each.
83. **Shipping Methods**: Flat rate, local pickup and weight-based delivery methods.
84. **Shipping Profiles**: Reusable shipping rule sets assignable to individual variants.
85. **Shipping Boxes**: Define packaging boxes with dimensions for rate calculation.
86. **Shipping Rules Engine**: Condition/action rules that set, add, multiply, zero out or disable shipping cost based on cart weight, subtotal, destination region, product category or profile.
87. **Shipping Method Selection**: Present eligible methods at checkout and validate the customer's choice.
88. **Weight & Dimension Units**: Store-wide configuration of weight and dimension units.

## Tax

89. **Tax Profiles**: Reusable tax rule sets assignable to variants, with a store default.
90. **Tax Regions**: Per-region tax configuration with a dedicated editing screen.
91. **EU Tax Strategy**: Dedicated EU handling including reverse charge and a distinct EU region editor.
92. **Inclusive / Exclusive Pricing**: Choose whether entered prices already include tax.
93. **Shipping Tax**: Optionally apply tax to shipping charges.
94. **Tax Rules Engine**: Condition/action rules that set product tax rate, shipping tax rate or mark a product tax exempt.
95. **Per-Variant Tax Toggle**: Exclude an individual variant from tax charges.

## Customers & Accounts

97. **Customer Management**: Create, edit, delete and bulk-manage customer records from the admin.
98. **Customer Details View**: Per-customer profile page with their order history.
99. **Customer Registration**: Front-end registration form, toggleable store-wide.
100.  **Customer Login**: Front-end login form with rate limiting on failed attempts.
101.  **Email Verification**: Verification email flow that gates account activation.
102.  **Account Dashboard**: Logged-in customer portal home.
103.  **Account Orders**: Customers browse their own orders and open an order's detail and activity log.
104.  **Address Book**: Customers add, edit, delete and set default shipping/billing addresses.
105.  **Profile Self-Service**: Customers update their own profile details.
106.  **Password Change**: Customers change their password from the account area.
107.  **Resend Verification Email**: Self-service re-request of the verification email.

## Storefront

108. **Shop Page**: Product listing page with sidebar, breadcrumbs, product cards and empty state.
109. **Product Detail Page**: Single-product page with image slider, variant selector, quantity selector and add-to-cart.
110. **Product Filtering**: Front-end filtering of the shop listing.
111. **Cart Page**: Editable cart with line items, quantity controls and summary.
112. **Automatic Page Generation**: Shop, cart, checkout, login, register and account pages are created on activation.
113. **Site Title Replacement**: Storefront pages present the store name in place of the site title.
114. **SEO Head Meta**: Product metadata injected into the storefront `<head>`.
115. **Toast Notifications**: Front-end feedback messages for cart and account actions.

## Emails & Notifications

116. **Customer Order Emails**: New, cancelled, failed, on-hold, processing and completed order notifications, plus order notes.
117. **Admin Notification Emails**: Notifications sent to store staff, including new customer registration.
118. **Email Template Editor**: Edit each template's subject, heading and message body with shortcode insertion.
119. **Email Shortcodes**: Placeholders for order table, order ID, order date, billing and shipping address, site name and customer table.
120. **Email Branding**: Configure logo, logo height and position, and the background, text, link, label and button colours.
121. **Per-Template Toggle**: Enable or disable each notification individually.
122. **SMTP Configuration**: Route outgoing mail through a custom SMTP host with authentication, port, encryption and from-address settings.
123. **Queued Email Delivery**: Emails are dispatched through the background job queue rather than blocking the request.

## Settings & Store Configuration

124. **Onboarding Wizard**: First-run setup capturing store name, industry, address and default currency.
125. **General Settings**: Store name, industry, logo, contact email, phone, address and selling locations.
126. **Product Settings**: Shop page, units, display layout, reviews and star ratings, unit price visibility, low stock threshold and barcode defaults.
127. **Payment Settings**: Manage the enabled gateway list and each gateway's configuration.
128. **Shipping Settings**: Manage zones and delivery methods.
129. **Tax Settings**: Pricing mode, shipping tax, regions, services and tax IDs.
130. **Multi-Currency Settings**: Currency list, formatting, exchange provider and sync schedule.
131. **Email Settings**: Mailer selection, templates and branding.
132. **Checkout Settings**: Guest checkout, field validation rules, coupon field and legal content.
133. **Essentials Settings**: Variation library, schema profiles and barcode generation.
134. **Advanced Settings**: Reserved section for low-level store options.
135. **Countries & Regions Reference**: Built-in country and state data used across addresses, tax and shipping.
136. **Selling Location Restriction**: Limit selling to all countries or a chosen subset.

## Invoice generation

137. Invoice generation

## Platform & Infrastructure

138. **REST API**: Namespaced `kirki/ecommerce/v1` API covering every admin and storefront resource.
139. **Admin SPA**: React/TypeScript single-page admin with hash routing, lazy-loaded feature modules and route transitions.
140. **Admin Menu**: WordPress admin menu with Home, Orders, Products, Inventory, Collections, Categories, Tags, Brands, Customers, Coupons, Settings and Tools entries.
141. **Database Migrations**: Versioned schema migrations run automatically on plugin update.
142. **Version Upgrade Routines**: Per-version update hooks that seed pages and data as the plugin advances.
143. **Seed Data**: Onboarding seeder that populates a usable starter dataset.
144. **Background Job Scheduler**: Queue with deferred dispatch, async workers and job status tracking.
145. **Caching Layer**: Pluggable cache stores with a database-backed default and namespace-versioned flushing.
146. **Rate Limiting**: Configurable per-route request limits, applied to login by email and IP.
147. **Session Management**: Cookie-based sessions with database or in-memory drivers and sliding expiry.
148. **Event & Listener System**: Domain events such as order shipped and settings changed, with subscribed listeners.
149. **Authorization Policies**: Policy-based capability checks on admin endpoints.
150. **Extension Hooks**: WordPress actions and filters exposed for third-party customisation, including the account menu.
151. **Internationalisation**: All user-facing strings are translatable under the `kirki-ecommerce` text domain.
152. **Add-on Plugin Support**: Payment gateways ship as separately installable companion plugins.
