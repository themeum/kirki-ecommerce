## MODIFIED Requirements

### Requirement: Customize button

The controls row SHALL show a "Customize" button with a sliders icon on the
right side. Selecting it SHALL open the Customize sheet (see the
analytics-customize capability).

#### Scenario: Select Customize

- **WHEN** the merchant selects Customize
- **THEN** the "Customize analytics" sheet opens from the right

### Requirement: Key metrics row

The page SHALL show the key metrics that are on, in the saved order. The key
metrics SHALL be Gross sales, Orders, Average order value, Returning customer
rate, Net sales, Total sales, Items ordered, Discounts, New customers,
Customers and Shipping charges. The row SHALL show at most 4 key metrics on
each line and put the next ones on the next lines. Each key metric SHALL take
1/4 of the row width, also on a line that is not full. Below 1100px the row
SHALL show 2 on each line, and below 600px 1 on each line. Each key metric SHALL
show its label, its value for the range, its change against the comparison and
a sparkline of the range at the chart granularity, with the comparison series as
a second line. The change and the sparkline SHALL be on one row under the value,
the change on the left and the sparkline on the right. When there is no
comparison, the change SHALL read "No comparison". A key metric SHALL NOT be a
link. Money key metrics (Gross sales, Average order value, Net sales, Total
sales, Discounts, Shipping charges) SHALL show as money, Returning customer rate
as a percent, and the others as numbers.

#### Scenario: Change colors

- **WHEN** Gross sales went up by 12.3%
- **THEN** the change shows "12.3%" with a trending-up icon in the success text color, with no background

#### Scenario: Decrease

- **WHEN** Orders went down by 4.0%
- **THEN** the change shows "4.0%" with a trending-down icon in the critical text color, with no background

#### Scenario: Five key metrics on a wide screen

- **WHEN** 5 key metrics are on and the screen is 1400px wide
- **THEN** the first line shows 4 key metrics, and the second line shows 1 key metric with 1/4 of the row width

#### Scenario: Saved order

- **WHEN** the saved order puts Orders before Gross sales
- **THEN** the row shows Orders first

### Requirement: Cards

Below the key metrics, the page SHALL show the cards that are on, in the saved
order, at most two in a row, with "full" cards taking a whole row and a half
card left alone in a row filling it. The default order is the order of this
table. A card's width SHALL NOT change when other cards are hidden or moved. On screens narrower than 720px, every card SHALL take a whole row.

| Card | Width | Shows |
|---|---|---|
| Total sales over time | full | Total sales headline and change; line chart of Total sales with the comparison series |
| Total sales breakdown | half | Rows Gross sales, Discounts (negative), Returns (negative), Net sales, Shipping charges, Taxes, Total sales, each with its change. Net and Total in bold. |
| Sales by product | half | Top 5 products by Net sales: thumbnail, name, stock left, units sold, Net sales and change |
| Sales by category | half | Top 6 categories by Net sales, as one bar each with Net sales and change |
| Average order value over time | half | AOV headline and change; line chart with no area fill, a point on each value and the comparison series |
| Orders over time | half | Orders headline and change; bar chart with a rounded comparison bar beside each current bar |
| Orders by fulfillment status | half | Share of each current fulfillment status as one 32px segmented bar and a list with count and percent; headline "N%" with "delivered · M orders" |
| New vs returning customers | half | "N customers" headline and change; stacked bars of new and returning per chart point, with no comparison mark; centered legend "New · N" and "Returning · N" |
| Sales by coupon code | half | Top 5 codes by orders using code, as one bar each with orders, "$N off" discount given and the change in orders |
| Orders by time of day | full | Busiest hour, busiest day and the share of orders from the busiest hour on; a weekday × hour dot grid with each day's total; a "This period / Change" toggle |
| Sales by location | full | World map colored by the selected tab; "Sales / Orders / Customers" tabs; top 5 countries, or the top 5 regions of the selected country, with value, bar and change |
| Sales by payment method | half | Top 5 methods by Total sales, as one bar each with Total sales, order count and the change in Total sales |
| Taxes collected by region | half | Top 5 shipping regions by Total tax, as one bar each with Total tax, the product and shipping tax split, and the change in Total tax |
| Shipping charges by method | half | Top 5 methods by Shipping charges, as one bar each with Shipping charges, order count and the change in Shipping charges |
| Inventory health | half | Counts of out-of-stock, low-stock and in-stock variants as tiles, up to 4 out-of-stock or low-stock variants with a status badge, and the note "Live, not affected by the date range" with a live indicator |

No card, card row, breakdown line or chart SHALL open another page.

#### Scenario: Stock badge in Sales by product

- **WHEN** a top product has tracked variants with 3 and −1 available, and its status is low stock
- **THEN** its badge reads "3 left in stock" in the warning badge style, the same as the home dashboard

#### Scenario: Growth in Sales by category

- **WHEN** the category Hoodies has Net sales 4100 and a change of 36.7%
- **THEN** its row shows one bar, the Net sales and "36.7%" in green with an up icon, and no comparison bar or comparison value

#### Scenario: Breakdown line is not a link

- **WHEN** the merchant selects the Discounts line in Total sales breakdown
- **THEN** nothing opens

#### Scenario: Narrow screen

- **WHEN** the screen is 600px wide
- **THEN** every card takes a whole row

#### Scenario: Orders by time of day row

- **WHEN** the page shows its cards in the default order on a wide screen
- **THEN** Orders by time of day takes a whole row directly after the row of New vs returning customers and Sales by coupon code

#### Scenario: Sales by location row

- **WHEN** the page shows its cards in the default order on a wide screen
- **THEN** Sales by location takes a whole row directly after Orders by time of day

#### Scenario: Payment method row

- **WHEN** the page shows the Sales by payment method card
- **THEN** each of the top 5 methods shows as one bar with its Total sales, its order count and its change in Total sales

#### Scenario: Tax region row

- **WHEN** the page shows the Taxes collected by region card
- **THEN** each of the top 5 regions shows as one bar with its Total tax, its product and shipping tax split and its change in Total tax

#### Scenario: Shipping method row

- **WHEN** the page shows the Shipping charges by method card
- **THEN** each of the top 5 methods shows as one bar with its Shipping charges, its order count and its change in Shipping charges

#### Scenario: Inventory health content

- **WHEN** the page shows the Inventory health card
- **THEN** it shows the 3 count tiles, the out-of-stock and low-stock variants with a status badge, and the live note with its indicator

#### Scenario: Hidden neighbor

- **WHEN** the merchant hides Total sales breakdown in the default order on a wide screen
- **THEN** Sales by product and Sales by category share a row, and Sales by coupon code, now alone in its row before Orders by time of day, fills the row

#### Scenario: Half card next to a full card

- **WHEN** the saved order puts Sales by product directly between Total sales over time and Orders by time of day
- **THEN** Sales by product fills its row

### Requirement: Info tooltip on every metric

Every key metric and every card SHALL have an info icon right after its title.
The icon SHALL be hidden by default. It SHALL show when the pointer is over the
key metric or card, or when the key metric, the card or the icon has keyboard
focus. On devices without hover, the icon SHALL always show. The icon SHALL be
reachable with the keyboard, and its tooltip SHALL open on hover and on focus.
The icon's accessible name SHALL be the tooltip text. The tooltip SHALL tell how
the value is calculated, with this text (translatable):

| Title | Tooltip |
|---|---|
| Gross sales | Item prices × quantity before discounts, without tax or shipping, for orders paid in the range. |
| Orders | Orders created in the range, paid or not. Failed payments are left out. |
| Average order value | (Gross sales − discounts) ÷ number of orders paid in the range. Shipping and tax are left out. |
| Returning customer rate | Customers with a paid order in the range that was not their first paid order, ÷ all customers with a paid order in the range. |
| Net sales | Gross sales − discounts − returns, for orders paid in the range. Refunds are subtracted on the day they completed. |
| Total sales | Net sales + shipping + taxes, for orders paid in the range. |
| Items ordered | Items in the orders created in the range, paid or not. Failed payments are left out. |
| Discounts | Discounts on item prices in orders paid in the range. Free-shipping discounts are left out. |
| New customers | Customers whose first paid order is in the range. |
| Customers | Different customers with a paid order in the range. |
| Shipping charges | Shipping charged on paid orders after free-shipping discounts, without tax. |
| Total sales over time | Net sales + shipping + taxes, by the day each order was paid. Refunds are subtracted on the day they completed. |
| Total sales breakdown | Gross sales − discounts − returns = net sales. Net sales + shipping + taxes = total sales. Paid orders, by paid date. |
| Sales by product | Top products by net sales: item totals after discounts, without tax, for orders paid in the range. Stock is live. |
| Sales by category | Net sales of the products in each category. A product in two categories counts in both. |
| Average order value over time | (Gross sales − discounts) ÷ paid orders, for each day, week or month. |
| Orders over time | Orders created in each day, week or month, paid or not. Failed payments are left out. |
| Orders by fulfillment status | Orders created in the range, by their fulfillment status now. Failed payments are left out. |
| New vs returning customers | New: first paid order in the period. Returning: a paid order in the period that was not their first. One customer can be both. |
| Sales by coupon code | Paid orders that used each code, and the total discount the code gave. Free-shipping codes show the shipping fee removed. |
| Sales by location | Where orders go: the shipping address, or the billing address when there is none. Sales: net sales of paid orders. Orders: orders created, paid or not. Customers: different customers with a paid order. |
| Sales by payment method | Total sales of paid orders, by the payment method used. |
| Taxes collected by region | Product and shipping tax on paid orders, by the shipping address region. |
| Shipping charges by method | Shipping charged on paid orders after free-shipping discounts, without tax, by shipping method. |
| Inventory health | Live stock of every variant. Low stock means at or below the variant's low-stock threshold, or the store default. Not affected by the date range. |

#### Scenario: Icon is hidden until hover

- **WHEN** the pointer is not over the Orders key metric
- **THEN** its info icon is not visible

#### Scenario: Hover shows the icon and tooltip

- **WHEN** the merchant moves the pointer over the Orders key metric and then over its info icon
- **THEN** the icon shows, and the tooltip reads "Orders created in the range, paid or not. Failed payments are left out."

#### Scenario: Keyboard

- **WHEN** the merchant tabs to the info icon of Sales by category
- **THEN** the icon is visible and its tooltip opens

#### Scenario: Touch device

- **WHEN** the device has no hover
- **THEN** every info icon is visible

### Requirement: Page states

The page SHALL request the key metrics and each card that is on separately,
and SHALL send all the requests at the same time. The page SHALL NOT request
the data of a card that is hidden. When the merchant turns a hidden card on,
the page SHALL request its data and show its skeleton until it comes. While the data of a part loads, that part SHALL show its
skeleton in its final position and size: one skeleton for each key metric that
is on, and one card skeleton for each card that is on. When
the data of a part comes, that part SHALL show its data, and the parts that
still load SHALL keep their skeletons. When the request of one part fails,
only that part SHALL show an error with a retry action, and a retry SHALL
request only that part again. When the requests of all the parts that are on fail, the page
SHALL show the shared query error state with a retry action that requests all
parts again. When the store has no sales orders and no placed orders at all,
the page SHALL show the banner "Your store has no orders yet. Analytics fills
in as soon as customers start paying for orders." and each card SHALL show an
empty state instead of an empty chart. A card with no data in the range SHALL
show "No data for this date range".

#### Scenario: Empty store

- **WHEN** the store has no orders
- **THEN** the banner shows, the key metrics show 0 or an empty value, and each card except Inventory health shows its empty state

#### Scenario: Range without sales

- **WHEN** the store has orders but none in the selected range
- **THEN** the banner does not show, and the cards show "No data for this date range"

#### Scenario: Request fails

- **WHEN** the requests of all parts return a server error
- **THEN** the page shows the error state with a retry action

#### Scenario: One card loads first

- **WHEN** the Sales by coupon code data comes and the other requests still load
- **THEN** the Sales by coupon code card shows its data, and the key metrics row and the other cards show skeletons

#### Scenario: One card fails

- **WHEN** the Taxes collected by region request returns a server error and the other requests succeed
- **THEN** only the Taxes collected by region card shows an error with a retry action, and the other cards and the key metrics show their data

#### Scenario: Retry one card

- **WHEN** the merchant selects retry on the failed Taxes collected by region card
- **THEN** only the Taxes collected by region data is requested again, and the card shows a skeleton until it comes

#### Scenario: Range changes

- **WHEN** the merchant changes the date range
- **THEN** every part shows its skeleton and requests its data for the new range again

#### Scenario: Hidden card is not requested

- **WHEN** Sales by coupon code is hidden and the page opens
- **THEN** the page does not request `sales_by_coupon_code`

#### Scenario: Turn a card on

- **WHEN** the merchant checks Sales by coupon code in the sheet
- **THEN** the card shows a skeleton in its position and then its data
