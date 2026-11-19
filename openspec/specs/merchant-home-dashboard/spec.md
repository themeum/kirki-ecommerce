# merchant-home-dashboard Specification

## Purpose

Gives the merchant a store overview on the Home page after the setup checklist is
complete: four all-time sales metrics, the most recent orders and the top selling
products.

## Requirements

### Requirement: Dashboard replaces a completed checklist

The Home page SHALL show the store overview in place of the setup checklist when
every step returned by the setup checklist endpoint is completed. The steps that
count are the visible server steps: products, payments, tax (only when tax
calculation is enabled) and shipping. The frontend-only "Customize your store"
step SHALL NOT affect this decision. While at least one of these steps is not
completed, the Home page SHALL show the setup checklist and SHALL NOT request the
overview. The template gallery SHALL NOT be shown in dashboard mode. It SHALL
stay below the setup checklist in checklist mode.

While the setup checklist request is loading, the Home page SHALL choose the
mode from a setup-complete flag that the server sends with the admin page
(`window.kirki_ecommerce.is_setup_complete`). The flag SHALL be true only when
every visible server step is recorded as completed. When the checklist response
arrives, the response SHALL decide the mode.

#### Scenario: All steps completed

- **WHEN** the merchant opens Home and every checklist step is completed
- **THEN** the overview is shown, the setup checklist is not shown, and the template gallery is not shown

#### Scenario: A step is not completed

- **WHEN** the merchant opens Home and at least one checklist step is not completed
- **THEN** the setup checklist and the template gallery are shown, and no overview request is sent

#### Scenario: Tax calculation is disabled

- **WHEN** tax calculation is disabled and the products, payments and shipping steps are completed
- **THEN** the overview is shown

#### Scenario: Data removed after completion

- **WHEN** all steps were completed once and the merchant later deletes all products
- **THEN** the overview is still shown, because step completion is sticky

#### Scenario: Completed store opens Home

- **WHEN** every visible step is recorded as completed and the merchant opens Home
- **THEN** the first render shows the dashboard header, the wide container and the overview placeholders, and the checklist skeleton is not shown

#### Scenario: Last step completed on the page

- **WHEN** the merchant completes the last open step from the checklist on Home
- **THEN** the page changes to the overview without a reload

### Requirement: Dashboard header

In dashboard mode, the Home heading SHALL read "Welcome, {name}". {name} SHALL be
the current user's first name. When the first name is empty, {name} SHALL be the
display name. When both are empty, the heading SHALL read "Welcome". Below the
heading, the period subtitle SHALL show, and the header actions SHALL be the
merchant's quick actions followed by the Customize home button (see the
home-customize capability). In checklist mode, the heading SHALL stay "Let's get
you started", and the header SHALL show the "View Live Site" link and a primary
"Add Product" button that opens the create product page.

#### Scenario: User has a first name

- **WHEN** the current user's first name is "Sara" and the overview is shown
- **THEN** the heading reads "Welcome, Sara"

#### Scenario: User has no first name

- **WHEN** the first name is empty and the display name is "store-admin"
- **THEN** the heading reads "Welcome, store-admin"

#### Scenario: Add a product from Home in checklist mode

- **WHEN** a step is not completed and the merchant selects "Add Product" in the Home header
- **THEN** the create product page opens

#### Scenario: Dashboard header actions

- **WHEN** a completed store opens Home with the default layout
- **THEN** the header shows "View live site", a primary "Create order" and the Customize home button

### Requirement: Counted orders

The sales metrics and the top selling products SHALL use only counted orders. A
counted order SHALL have a payment status of `paid`, `refunding` or `refunded`.
Orders with any other payment status (for example `pending`, `unpaid`,
`processing`, `failed` or `cancelled`) SHALL NOT be counted. Metrics SHALL cover
all time, with no date filter.

#### Scenario: Unpaid cash on delivery order

- **WHEN** an order is placed with cash on delivery and its payment status is `unpaid`
- **THEN** it does not change any metric or the top selling products

#### Scenario: Order is marked paid

- **WHEN** the merchant marks that order as paid
- **THEN** the next overview response includes it in every metric

### Requirement: Sales metric cards

The overview endpoint SHALL keep returning four metrics, defined as:

1. **Total sales**: the sum of the base-currency total of all counted orders.
2. **Net sales**: Total sales minus the base-currency tax total, minus the
   base-currency shipping total without its tax, minus the base-currency amount
   of completed refunds on counted orders. The tax total already holds the
   shipping tax, so the shipping tax is not taken off a second time.
3. **Orders**: the number of counted orders.
4. **Products sold**: the sum of item quantities on counted orders.

A refund amount SHALL be converted to the base currency with the rate frozen on
its order. The Home page SHALL NOT show these four metrics. In their place, it
SHALL show the Key numbers section (see the home-customize capability).

#### Scenario: Paid order with tax and shipping

- **WHEN** the only counted order has base total 120.00, tax 10.00 and shipping 10.00, with no refunds
- **THEN** the endpoint returns Total sales 120.00, Net sales 100.00, Orders 1 and Products sold equal to the item quantity of that order

#### Scenario: Shipping with tax

- **WHEN** the only counted order has base total 120.00, tax 10.00 of which 2.00 is shipping tax, and shipping 10.00 that includes the 2.00 tax
- **THEN** the endpoint returns Net sales 102.00

#### Scenario: Partial refund

- **WHEN** that order then gets a completed refund of 20.00 in the base currency
- **THEN** the endpoint returns Total sales 120.00 and Net sales 80.00

#### Scenario: Pending refund

- **WHEN** a refund on a counted order has the status `pending` or `cancelled`
- **THEN** Net sales does not change

#### Scenario: Order in another currency

- **WHEN** a counted order was paid in a currency that is not the base currency
- **THEN** its base-currency amounts are used, and its refunds are converted with that order's frozen rate

#### Scenario: Home does not show the overview metrics

- **WHEN** a completed store opens Home
- **THEN** the page shows the Key numbers section and no "Products sold" card

### Requirement: Recent orders card

The overview SHALL show a "Recent orders" card with the 5 most recently created
orders of any status, newest first. Each row SHALL show the order number with the
fulfillment status as colored text, the customer name, the number of products, the
order total in the order's own currency and the time since the order was created
in a short, translatable form ("Just now", "45m ago", "3h ago", "2d ago",
"4mo ago", "2y ago"). Activating a row SHALL open that order's detail page.
When the store has no orders, the card SHALL show "No orders yet".

#### Scenario: Unpaid order appears

- **WHEN** a new unpaid order is placed
- **THEN** it is the first row in Recent orders, even though it is not a counted order

#### Scenario: More than five orders

- **WHEN** the store has 12 orders
- **THEN** only the 5 newest are listed

#### Scenario: Opening an order

- **WHEN** the merchant clicks a row
- **THEN** the order detail page of that order opens

#### Scenario: No orders

- **WHEN** the store has no orders
- **THEN** the card shows "No orders yet"

### Requirement: Top selling products card

The overview SHALL show a "Top selling products" card with the products of the
Analytics "Sales by product" data for the Home period: up to 5 products from
sales orders paid in the period, with all variants of a product merged into one
row, sorted by net sales, highest first, then by units sold, highest first.
Each row SHALL show a 48 × 48 px product image, the product name with a stock
line below it, and, at the right, the product's net sales in bold in the
Analytics amount format with the units sold below it. In Short format, when the
short amount is different from the long amount, the amount SHALL have the long
amount as a native hover tooltip. The stock line SHALL be text, not a badge, and
SHALL use the product's current variants: "{N} left in stock" when a variant
tracks inventory and the summed available quantity of the tracked variants is
above 0, in red when the product is low on stock and gray otherwise; "Out of
stock" in red when every variant is out of stock; "In stock" in gray otherwise.
A deleted product SHALL have no stock line. A product
that was deleted after it was sold SHALL still be listed with the name and image
recorded on its order items. When there are no sales in the period, the card
SHALL show "No sales yet". The overview endpoint SHALL keep returning its
all-time `top_products` field, and Home SHALL NOT use it.

#### Scenario: Tracked stock

- **WHEN** a top product has two tracked variants with 40 and 19 units available and one variant that does not track inventory
- **THEN** its stock line reads "59 left in stock"

#### Scenario: Variants merged

- **WHEN** 3 units of "T-shirt / Red" and 2 units of "T-shirt / Blue" were sold in sales orders paid this month
- **THEN** with the period This month, one "T-shirt" row shows 5 units

#### Scenario: Ranked by money

- **WHEN** this month product A sold 10 units for 50.00 net and product B sold 1 unit for 300.00 net
- **THEN** product B is listed above product A

#### Scenario: Period change

- **WHEN** the merchant changes the period from All time to Today and nothing was sold today
- **THEN** the card shows "No sales yet"

#### Scenario: Same rows as Analytics

- **WHEN** the Home period is This month and the Analytics page shows Month to date
- **THEN** Top selling products lists the same products in the same order as Analytics "Sales by product"

### Requirement: Card actions

The Recent orders card SHALL have a "View all orders" button that opens the
orders list. The Top selling products card SHALL have a "View all products" button
that opens the products list. Each button SHALL be visible when the pointer is
over its card, when keyboard focus is inside its card, and always on devices
without hover. At other times it SHALL be visually hidden but stay in the tab
order.

#### Scenario: Hover

- **WHEN** the merchant moves the pointer over the Recent orders card
- **THEN** "View all orders" becomes visible

#### Scenario: Keyboard

- **WHEN** the merchant tabs to the "View all products" button
- **THEN** the button becomes visible while it has focus

#### Scenario: Touch device

- **WHEN** the overview is shown on a device without hover
- **THEN** both buttons are always visible

### Requirement: Card information tooltips

Each key number card, each section card (Recent orders, Top selling products,
Needs your attention, Restock soon) and each Needs your attention row SHALL show
an information icon or tooltip with a plain-language, translatable description
of what it shows. A card's information icon SHALL be hidden until the pointer is
over its card, and SHALL always show on devices without hover. When the pointer
is over the icon, the tooltip SHALL show.

#### Scenario: Hover over the Net sales information icon

- **WHEN** the merchant moves the pointer over the information icon next to "Net sales"
- **THEN** a tooltip shows the Analytics definition of Net sales

#### Scenario: Hover over a Needs your attention row

- **WHEN** the merchant moves the pointer over the information icon of the Orders to ship row
- **THEN** a tooltip says which orders count as orders to ship

### Requirement: Overview layout

In dashboard mode, the Home page SHALL use a wider page container than in
checklist mode. The sections SHALL be laid out as in the home-customize
"Sections layout" requirement. The "No orders yet", "No sales yet" and "Nothing
is low on stock." empty states SHALL be centered in their card.

#### Scenario: Narrow screen

- **WHEN** the overview is shown on a narrow screen
- **THEN** the key number cards and every section are stacked in one column

### Requirement: Overview loading and errors

Each section SHALL load its data on its own. While a section's data is loading,
it SHALL show a skeleton placeholder in its place. If a section's request fails,
that section SHALL show an error message with a retry button in its place, and
the header and the other sections SHALL still render. A section that is off
SHALL NOT request its data.

#### Scenario: Request fails

- **WHEN** the Key numbers request fails and the other requests succeed
- **THEN** an error message is shown in place of the Key numbers, and Recent orders and Top selling products render

#### Scenario: Hidden section

- **WHEN** Restock soon and Needs your attention are off
- **THEN** no attention request is sent

### Requirement: Overview endpoint

The system SHALL provide `GET /kirki/ecommerce/v1/dashboard/overview`. It SHALL
require an authenticated administrator, like the other admin endpoints. The
response data SHALL contain the four metrics (money values as money objects in the
base currency), the recent orders and the top selling products as defined above.
The money objects of the Total sales and Net sales metrics and of each top
product's revenue SHALL have a `short_display` string, made with the rules of
the Analytics "Short money display" requirement. The recent orders SHALL keep the
order list shape, with no `short_display`.

#### Scenario: Non-admin request

- **WHEN** a user who is not an administrator calls the endpoint
- **THEN** the request is rejected and no store data is returned

#### Scenario: Admin request

- **WHEN** an administrator calls the endpoint
- **THEN** the response contains the metrics, up to 5 recent orders and up to 5 top products

#### Scenario: Short display in the response

- **WHEN** the counted orders have a base total of 20,345.00 USD
- **THEN** `base_total_sales_money_object.short_display` is `$20.3K`, and each top product's `base_revenue_money_object` has a `short_display`

#### Scenario: Recent orders unchanged

- **WHEN** an administrator calls the endpoint
- **THEN** the money objects of the recent orders have no `short_display`
