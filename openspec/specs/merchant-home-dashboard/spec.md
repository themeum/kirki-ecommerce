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
display name. When both are empty, the heading SHALL read "Welcome". The
"View Live Site" link SHALL stay in the header. In checklist mode, the heading
SHALL stay "Let's get you started". In both modes, the header SHALL have a primary
"Add Product" button next to "View Live Site" that opens the create product page.

#### Scenario: User has a first name

- **WHEN** the current user's first name is "Sara" and the overview is shown
- **THEN** the heading reads "Welcome, Sara"

#### Scenario: User has no first name

- **WHEN** the first name is empty and the display name is "store-admin"
- **THEN** the heading reads "Welcome, store-admin"

#### Scenario: Add a product from Home

- **WHEN** the merchant selects "Add Product" in the Home header
- **THEN** the create product page opens

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

The overview SHALL show four metric cards, in this order:

1. **Total sales**: the sum of the base-currency total of all counted orders.
2. **Net sales**: Total sales minus the base-currency tax total, minus the
   base-currency shipping total without its tax, minus the base-currency amount
   of completed refunds on counted orders. The tax total already holds the
   shipping tax, so the shipping tax is not taken off a second time.
3. **Orders**: the number of counted orders.
4. **Products sold**: the sum of item quantities on counted orders.

Total sales and Net sales SHALL be shown in the store's base currency, with the
store's currency format, as short amounts (the `short_display` of their money
objects). When the short amount is different from the long amount, the card
SHALL show the long amount as a native hover tooltip. A refund amount SHALL be
converted to the base currency with the rate frozen on its order. The cards
SHALL NOT show a change percentage or a trend.

#### Scenario: Paid order with tax and shipping

- **WHEN** the only counted order has base total 120.00, tax 10.00 and shipping 10.00, with no refunds
- **THEN** Total sales shows 120.00, Net sales shows 100.00, Orders shows 1 and Products sold shows the item quantity of that order

#### Scenario: Shipping with tax

- **WHEN** the only counted order has base total 120.00, tax 10.00 of which 2.00 is shipping tax, and shipping 10.00 that includes the 2.00 tax
- **THEN** Net sales shows 102.00

#### Scenario: Partial refund

- **WHEN** that order then gets a completed refund of 20.00 in the base currency
- **THEN** Total sales still shows 120.00 and Net sales shows 80.00

#### Scenario: Pending refund

- **WHEN** a refund on a counted order has the status `pending` or `cancelled`
- **THEN** Net sales does not change

#### Scenario: Order in another currency

- **WHEN** a counted order was paid in a currency that is not the base currency
- **THEN** its base-currency amounts are used, and its refunds are converted with that order's frozen rate

#### Scenario: No counted orders

- **WHEN** the store has no counted orders
- **THEN** all four cards show 0, with the money cards formatted in the base currency

#### Scenario: Large total

- **WHEN** Total sales is 20,345.00 USD
- **THEN** the Total sales card shows `$20.3K`, and its hover tooltip shows `$20,345.00`

#### Scenario: Small total

- **WHEN** Net sales is 850.00 USD
- **THEN** the Net sales card shows `$850.00`, with no long-amount tooltip

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

The overview SHALL show a "Top selling products" card with up to 5 products from
counted orders. Order items SHALL be grouped by product, with all variants of a
product merged into one row. Rows SHALL be sorted by units sold, highest first;
equal units SHALL be sorted by base-currency revenue, highest first. Each row
SHALL show a 48 × 48 px product image, the product name, a stock badge, the
base-currency revenue of all the product's order items in counted orders as a
short amount ("{amount} generated") and the units sold. When the short revenue
is different from the long revenue, the revenue text SHALL show the long text
("{long amount} generated") as a native hover tooltip. The stock badge SHALL use
the product's current variants: "{N} left in stock" when a variant tracks
inventory and the summed available quantity of the tracked variants is above 0;
"Out of stock" when every variant is out of stock; "In stock" otherwise. A
deleted product SHALL have no stock badge. A product that was deleted after it
was sold SHALL still be listed with the name and image recorded on its order
items. When there are no counted orders, the card SHALL show "No sales yet".

#### Scenario: Tracked stock

- **WHEN** a top product has two tracked variants with 40 and 19 units available and one variant that does not track inventory
- **THEN** its badge reads "59 left in stock"

#### Scenario: Stock not tracked

- **WHEN** a top product does not track inventory and is out of stock
- **THEN** its badge reads "Out of stock"

#### Scenario: Variants merged

- **WHEN** 3 units of "T-shirt / Red" and 2 units of "T-shirt / Blue" were sold in counted orders
- **THEN** one "T-shirt" row shows 5 units

#### Scenario: Tie on units

- **WHEN** two products both sold 4 units and one earned more base revenue
- **THEN** the product with more revenue is listed first

#### Scenario: Deleted product

- **WHEN** a sold product is later deleted
- **THEN** it can still appear in the list with its recorded name and image

#### Scenario: No sales

- **WHEN** there are no counted orders
- **THEN** the card shows "No sales yet"

#### Scenario: Large revenue

- **WHEN** a top product earned 3,134.00 USD
- **THEN** its row reads "$3.1K generated", and the hover tooltip reads "$3,134.00 generated"

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

Each metric card (Total sales, Net sales, Orders, Products sold) and each list
card (Recent orders, Top selling products) SHALL show an information icon next to
its title. The icon SHALL be hidden until the pointer is over its card, and SHALL
always show on devices without hover. When the pointer is over the icon, a tooltip SHALL show a plain-language,
translatable description of what the card shows.

#### Scenario: Hover over the Net sales information icon

- **WHEN** the merchant moves the pointer over the information icon next to "Net sales"
- **THEN** a tooltip says that net sales is total sales minus tax, shipping and completed refunds

### Requirement: Overview layout

In dashboard mode, the Home page SHALL use a wider page container than in
checklist mode. The metric cards SHALL be in 4 columns on wide screens, 2 columns
on medium screens and 1 column on narrow screens. The Recent orders and Top
selling products cards SHALL be side by side, with the same height, on wide
screens and stacked on narrow screens. The "No orders yet" and "No sales yet"
empty states SHALL be centered in their card.

#### Scenario: Narrow screen

- **WHEN** the overview is shown on a narrow screen
- **THEN** the metric cards and both list cards are stacked in one column

### Requirement: Overview loading and errors

While the overview data is loading, the overview SHALL show skeleton placeholders
in the place of the metric and list cards. If the request fails, the overview
SHALL show an error message in their place, and the header SHALL still render.

#### Scenario: Request fails

- **WHEN** the overview request fails
- **THEN** an error message is shown in place of the cards and the rest of the page renders

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
