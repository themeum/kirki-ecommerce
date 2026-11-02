# analytics-page Specification

## Purpose

Defines the Analytics admin page: how merchants open it, the date and
comparison controls, the key metrics row, the cards, their info tooltips and
the page states. The numbers come from the analytics-metrics capability.

## Requirements

### Requirement: Analytics menu and route

The plugin SHALL add an "Analytics" submenu under the eCommerce menu, after
Orders, for users with the `manage_options` capability. It SHALL open the admin
page at `#/analytics`. The page heading SHALL read "Analytics". The page SHALL
NOT have a "View all reports" button.

#### Scenario: Open Analytics

- **WHEN** an administrator selects eCommerce → Analytics
- **THEN** the Analytics page opens with the heading "Analytics"

### Requirement: Date, comparison and currency controls

Below the heading, the page SHALL show a controls row with the date range
control and the comparison control on the left and the Customize button on the
right. The defaults SHALL be Last 30 days and Previous period. Applying a new
value in a control SHALL reload every metric and card with the new values. The
applied values SHALL be kept in the URL query, so a reload or a shared link
keeps them. The page SHALL NOT show a currency control.

#### Scenario: Change the range

- **WHEN** the merchant applies Last 7 days
- **THEN** every key metric and every card except Inventory health shows values for the last 7 days

#### Scenario: No currency control

- **WHEN** the store has orders in more than one currency
- **THEN** the page shows no currency control

#### Scenario: Reload keeps the selection

- **WHEN** the merchant applies Year to date and No comparison, and reloads the page
- **THEN** the page shows Year to date with no comparison

#### Scenario: Custom ranges in the URL

- **WHEN** the merchant applies a custom range Sep 1 – 30, 2026 and a custom comparison Aug 1 – 31, 2026, and reloads the page
- **THEN** the page shows both custom ranges

### Requirement: Date range control

The date range control SHALL be a button with a calendar icon, the preset name,
the dates of the applied range, and a chevron. It SHALL open a panel with:

- a preset list on the left: Today, Yesterday, Last 7 days, Last 30 days, Last
  90 days, Last 12 months, Month to date, Year to date, Custom;
- read-only Start and End fields that show the pending range;
- a calendar with two months;
- a footer with the number of days in the pending range and Cancel and Apply
  buttons.

A click on a preset or on calendar days SHALL change only the pending range.
Apply SHALL apply the pending range and close the panel. Cancel, Escape, or a
click outside the panel SHALL close the panel and discard the pending range.
Apply SHALL be disabled until the pending range has a start and an end. The
calendar SHALL NOT allow a day after today. The "Custom" item SHALL be active
when the pending range matches no preset, and a click on it SHALL NOT change the
pending range. When the applied range matches no preset, the trigger SHALL show
"Custom" with the dates.

#### Scenario: Apply a preset

- **WHEN** today is Oct 14, 2026, the merchant opens the date control, selects Last 7 days, and selects Apply
- **THEN** the trigger shows "Last 7 days" and "Oct 8 – 14, 2026", and every key metric and every card except Inventory health shows values for that range

#### Scenario: Cancel discards the pending range

- **WHEN** the applied range is Last 30 days, and the merchant selects Last 7 days and then Cancel
- **THEN** the panel closes and the applied range stays Last 30 days

#### Scenario: Custom days

- **WHEN** the merchant selects Sep 7 and then Sep 15 in the calendar
- **THEN** the Start field shows "Sep 7, 2026", the End field shows "Sep 15, 2026", the footer shows "9 days", and the Custom item is active

#### Scenario: Future day

- **WHEN** today is Oct 14, 2026
- **THEN** Oct 15, 2026 and later days cannot be selected

### Requirement: Comparison control

The comparison control SHALL be a button that shows "Compare:" and the dates of
the applied comparison range, or "No comparison" when comparison is off. It SHALL
open a panel with the options Previous period, Previous year, Custom, and No
comparison. Previous period and Previous year SHALL show their dates, resolved
from the applied date range, under the option name. The footer SHALL show
"Compared with" and the pending comparison range (nothing when the pending
option is No comparison), with Cancel and Apply buttons.

A click on an option SHALL change only the pending option. Apply SHALL apply it
and close the panel. Cancel, Escape, or a click outside the panel SHALL close the
panel and discard the pending option. When Custom is the pending option, the
panel SHALL show read-only Start and End fields and a calendar with two months
next to the options. The first time Custom is selected, its range SHALL start as
the previous period. Apply SHALL be disabled while the Custom range has no start
or no end. The calendar SHALL NOT allow a day after today.

#### Scenario: Apply previous period

- **WHEN** the applied range is Oct 8 – 14, 2026, and the merchant selects Previous period and Apply
- **THEN** the trigger shows "Compare: Oct 1 – 7, 2026"

#### Scenario: Option dates

- **WHEN** the applied range is Oct 8 – 14, 2026 and the merchant opens the comparison control
- **THEN** Previous period shows "Oct 1 – 7, 2026" and Previous year shows "Oct 8 – 14, 2025"

#### Scenario: Custom comparison

- **WHEN** the merchant selects Custom, selects Sep 7 and Sep 15, and selects Apply
- **THEN** the trigger shows "Compare: Sep 7 – 15, 2026" and the footer showed "Compared with Sep 7 – 15, 2026" before Apply

#### Scenario: No comparison

- **WHEN** the merchant selects No comparison and Apply
- **THEN** the trigger shows "No comparison" and every key metric change reads "No comparison"

### Requirement: Customize button

The controls row SHALL show a "Customize" button with a sliders icon on the
right side. Selecting it SHALL open the Customize sheet (see the
analytics-customize capability).

#### Scenario: Select Customize

- **WHEN** the merchant selects Customize
- **THEN** the "Customize analytics" sheet opens from the right

### Requirement: Analytics colors only in graphs

The analytics color tokens SHALL be used only in graphs: charts, sparklines,
bars, maps, heatmaps, gauges, and their legends. Controls, buttons, selected
items, panels, and text SHALL use the design-system color tokens. Control
triggers SHALL use the design-system white background.

#### Scenario: Selected preset

- **WHEN** a preset or comparison option is selected in a control panel
- **THEN** its highlight uses the design-system selected-item colors, not an analytics token

#### Scenario: Trigger background

- **WHEN** the controls row is shown on the grey page background
- **THEN** the date and comparison triggers have a white background

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

#### Scenario: Three key metrics on a wide screen

- **WHEN** 3 key metrics are on and the screen is 1400px wide
- **THEN** the line shows 3 key metrics, each with 1/4 of the row width, and the fourth column stays empty

#### Scenario: Saved order

- **WHEN** the saved order puts Orders before Gross sales
- **THEN** the row shows Orders first

### Requirement: Change shown as colored text

Every change against the comparison on the page (key metrics, card headlines,
Total sales breakdown rows and Sales by product rows) SHALL show as the percent
with a trending-up icon in the success text color when it went up, a
trending-down icon in the critical text color when it went down, and a flat
icon in the subdued text color when it did not change. A change SHALL NOT have a
background. Status badges, such as the stock badge, SHALL keep their background.

#### Scenario: Card headline

- **WHEN** Total sales went up by 85.4%
- **THEN** the Total sales over time headline shows "85.4%" with a trending-up icon in the success text color next to the value

#### Scenario: Breakdown row

- **WHEN** Discounts went down by 4.0%
- **THEN** the Discounts row shows "4.0%" with a trending-down icon in the critical text color, with no background

### Requirement: Cards

Below the key metrics, the page SHALL show the cards that are on, in the saved
order, at most two in a row, with "full" cards taking a whole row and a half
card left alone in a row filling it. The default order is the order of this
table. A card's size (half or full) SHALL NOT change when other cards are hidden or moved. On screens narrower than 720px, every card SHALL take a whole row.

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

### Requirement: Chart tooltips

Hovering or focusing a chart point SHALL show the point's span label, its value
and, when there is a comparison, the comparison point's span label and value.

#### Scenario: Hover a day

- **WHEN** the merchant hovers the Oct 3 point of Total sales over time in a 7-day range with Previous period comparison
- **THEN** the tooltip shows "Oct 3, 2026" with its Total sales and the matching comparison day with its Total sales

#### Scenario: Hover a week

- **WHEN** the merchant hovers the last point of Total sales over time for Jul 21 to Oct 18, 2026, with weeks starting on Monday
- **THEN** the tooltip shows "Oct 12 – Oct 18, 2026" with the Total sales of that week

### Requirement: Chart axes

The over-time charts (Total sales, Average order value, Orders, and New vs
returning customers) SHALL draw at the pixel width of their card, so text keeps
its shape and dots are circles at every card width.

The y-axis SHALL show 5 values at round steps from 0, one on each grid line, in
a short form: values under 1,000 as whole numbers, and larger values with K, M or
B and at most 1 decimal, with no trailing ".0". Money values SHALL use the base
currency symbol in the same position as in the chart tooltips. Count values SHALL have no symbol.

The x-axis SHALL label every Nth point, starting with the first point, where
N = ceil(number of points / 12). The chart SHALL show all points, also the
points with no label. When the labels do not fit the card width, N SHALL become
larger until they fit. The steps between labels SHALL always be equal, so the
last point MAY have no label. Labels SHALL be horizontal and SHALL NOT overlap or
be cut.

#### Scenario: Money y-axis

- **WHEN** the highest Total sales point is 700.00 USD
- **THEN** the y-axis shows "$0", "$250", "$500", "$750" and "$1K"

#### Scenario: Large money values

- **WHEN** the highest Total sales point is 98,000.00 USD
- **THEN** the y-axis shows "$0", "$25K", "$50K", "$75K" and "$100K"

#### Scenario: Count y-axis

- **WHEN** the highest Orders point is 1,150
- **THEN** the y-axis shows "0", "500", "1K", "1.5K" and "2K"

#### Scenario: 7 daily points

- **WHEN** the range is Last 7 days on a wide card
- **THEN** the x-axis shows 7 labels, one for each day

#### Scenario: 30 daily points

- **WHEN** the range is Last 30 days on a wide card
- **THEN** the chart shows 30 points and the x-axis shows 10 labels, on the 1st, 4th, 7th and every 3rd point after that

#### Scenario: 13 weekly points

- **WHEN** the range is Last 90 days, the chart has 13 points and the card is wide
- **THEN** the x-axis shows 7 labels, on every 2nd week from the first

#### Scenario: 12 monthly points

- **WHEN** the range has 12 monthly points on a wide card
- **THEN** the x-axis shows 12 labels, one for each month

#### Scenario: 24 monthly points

- **WHEN** a custom range has 24 monthly points on a wide card
- **THEN** the chart shows 24 points and the x-axis shows 12 labels, on every 2nd month from the first

#### Scenario: Narrow card

- **WHEN** a half card has a 280px wide plot area and the chart has 30 points
- **THEN** the x-axis labels every 8th point (4 labels), none tilted, overlapping or cut

#### Scenario: Round dot

- **WHEN** the merchant hovers a point of a line chart on a full-width card
- **THEN** the dot on the point is a circle

### Requirement: Line chart area and last point

A line chart SHALL fill the area between the current-period line and the zero
line with a light tint of the line color, and SHALL show a dot on the last point
of the current-period line. The comparison line SHALL have no fill. The Average
order value over time chart SHALL NOT fill the area under its line, and SHALL
show a dot on each point of the current-period line.

#### Scenario: Total sales over time

- **WHEN** Total sales over time shows a range with a comparison
- **THEN** the area under the current line is filled, the dashed comparison line is not, and the last current point has a dot

#### Scenario: Average order value over time

- **WHEN** Average order value over time shows a range
- **THEN** the chart is a line chart with no area fill, and each current point has a dot

### Requirement: Orders over time bars

The Orders over time chart SHALL show, for each point, the comparison bar and
the current bar side by side, with the comparison bar on the left. The current
bar SHALL use the primary chart color and the comparison bar a faded tint of
it. Each bar SHALL have fully rounded ends. When there is no comparison, the
chart SHALL show only the current bar.

#### Scenario: Orders over time

- **WHEN** Orders over time shows a range with a comparison
- **THEN** each point has a faded comparison bar on the left and a dark current bar on the right, both with rounded ends

### Requirement: Orders by fulfillment status bar

The Orders by fulfillment status card SHALL show one bar 32px high, with one
segment for each status that has orders and a 1px gap between segments. Only
the two ends of the bar SHALL be rounded. The headline SHALL show the delivered
share in bold, followed by "delivered · M orders" in a subdued color. Each list
row SHALL show the status color, the status name, the count in bold and the
percent in a subdued color, with the count and percent aligned to the right.

#### Scenario: Orders by fulfillment status

- **WHEN** Orders by fulfillment status shows 12 orders with 6 delivered
- **THEN** the headline shows "50%" in bold and "delivered · 12 orders" beside it, above a 32px bar with rounded ends

### Requirement: New vs returning customers bars

The New vs returning customers card SHALL show one stacked bar for each chart
point, with new customers at the bottom and returning customers on top, and a
2px gap between the two segments. Only the top of the highest segment SHALL be
rounded. The chart SHALL NOT draw the comparison values, and the y-axis SHALL
scale to the current values only. The tooltip SHALL show the new and returning
values of the point and of its comparison point when the user hovers or focuses
the point. The headline SHALL show the customers count followed by "customers"
in a subdued color, and the legend SHALL be centered under the chart.

#### Scenario: New vs returning customers

- **WHEN** a chart point has 3 new and 2 returning customers, and its comparison point has 30 new and 10 returning
- **THEN** the bar shows 3 new under 2 returning with a rounded top, no comparison mark shows, and the tooltip on hover shows both points

### Requirement: Sales by coupon code bars

The Sales by coupon code card SHALL show the top 5 codes by orders, each as a
row with the code, the orders count, the discount given as "$N off" in a
subdued color, the change in orders, and a horizontal bar under the row. The
bar length SHALL be the code's orders relative to the code with the most
orders. When no comparison is selected, or the code had no orders in the
comparison period, the row SHALL show no change.

#### Scenario: Coupon code bars

- **WHEN** FREESHIP50 has 4 orders and $32.00 discount given, and 3 orders in the comparison period
- **THEN** the row shows "FREESHIP50", "4", "$32.00 off" and a 33.3% up change, with a full-length bar

### Requirement: Sales by payment method bars

The Sales by payment method card SHALL show the top 5 methods by Total sales,
each as a row with the method name, the Total sales, the order count as
"N orders" in a subdued color, the change in Total sales, and a horizontal bar
under the row. The bar length SHALL be the method's Total sales relative to the
method with the most Total sales. When no comparison is selected, or the method
had no Total sales in the comparison period, the row SHALL show no change.

#### Scenario: Payment method bars

- **WHEN** Stripe has $20,680.27 Total sales from 209 orders and a change of 36.1%, and PayPal has $13,112.74 from 143 orders and a change of 10.9%
- **THEN** the Stripe row shows "Stripe", "$20,680.27", "209 orders" and a 36.1% up change with a full-length bar, and the PayPal bar is about 63% of that length

#### Scenario: Drop in Total sales

- **WHEN** Klarna has a change of −8.8%
- **THEN** its row shows "8.8%" in red with a down icon

#### Scenario: No comparison

- **WHEN** the comparison is No comparison
- **THEN** no payment method row shows a change

### Requirement: Taxes collected by region bars

The Taxes collected by region card SHALL show the top 5 regions by Total tax,
each as a row with the region name, the Total tax and the change in Total tax,
a horizontal bar under the row, and under the bar the text "Product $X ·
Shipping $Y" in a subdued color. The bar length SHALL be the region's Total tax
relative to the region with the most Total tax. When no comparison is selected,
or the region had no tax in the comparison period, the row SHALL show no change.

#### Scenario: Tax region bars

- **WHEN** Texas, United States has Total tax $6.01, Product tax $5.00, Shipping tax $1.01 and a change of 25.0%
- **THEN** its row shows "Texas, United States", "$6.01", a 25.0% up change, a full-length bar and "Product $5.00 · Shipping $1.01" under the bar

#### Scenario: Tax regions with no comparison

- **WHEN** the comparison is No comparison
- **THEN** no tax region row shows a change

### Requirement: Shipping charges by method bars

The Shipping charges by method card SHALL show the top 5 methods by Shipping
charges, each as a row with the method name, the Shipping charges, the order
count as "N orders" in a subdued color, the change in Shipping charges, and a
horizontal bar under the row. The bar length SHALL be the method's Shipping
charges relative to the method with the most Shipping charges. When no
comparison is selected, or the method had no sales orders in the comparison
period, the row SHALL show no change.

#### Scenario: Shipping method bars

- **WHEN** Standard has Shipping charges $8.00 from 7 orders and a change of −10.0%
- **THEN** its row shows "Standard", "$8.00", "7 orders", a 10.0% down change in red and a full-length bar

#### Scenario: Shipping methods with no comparison

- **WHEN** the comparison is No comparison
- **THEN** no shipping method row shows a change

### Requirement: Inventory health layout

The Inventory health card SHALL show 3 tiles of equal width with a light
background: Out of stock, Low stock and In stock. Each tile SHALL show the count
in bold and the status name under it in a subdued color. The Out of stock count
SHALL use the critical color, the Low stock count the warning color, and the In
stock count the default text color. Under the tiles, the card SHALL show the
variant list in a box with a border and a divider between rows. Each row SHALL
show the product name, the variant name under it in a subdued color when the
variant has one, and on the right a status badge: "Out of stock" in the
critical tone or "Low stock" in the warning tone. The row SHALL NOT show the
quantity. When the list is empty, the box SHALL NOT show. Under the list, the
card SHALL show the note "Live, not affected by the date range" after a green
dot. The dot SHALL show a ripple that repeats, and the ripple SHALL NOT animate
when the user asks for reduced motion.

#### Scenario: Count tiles

- **WHEN** the store has 1 out-of-stock, 2 low-stock and 30 in-stock variants
- **THEN** the tiles show "1" in the critical color over "Out of stock", "2" in the warning color over "Low stock", and "30" over "In stock"

#### Scenario: Variant row badge

- **WHEN** the list contains the out-of-stock variant Hoodie, Blue / M, with −2 available
- **THEN** its row shows "Hoodie", "Blue / M" under it and an "Out of stock" badge in the critical tone, and does not show "−2"

#### Scenario: No variant needs attention

- **WHEN** no variant is out of stock or low stock
- **THEN** the card shows the 3 tiles and the live note, and no list box

#### Scenario: Reduced motion

- **WHEN** the user asks for reduced motion
- **THEN** the live dot shows without the ripple animation

### Requirement: Orders by time of day dots

The Orders by time of day card SHALL show a grid with one row for each weekday,
from Mon to Sun, and one column for each hour, from 12am to 11pm, in the store
time zone. Each cell SHALL show one dot. The hour labels 12a, 3a, 6a, 9a, 12p,
3p, 6p and 9p SHALL show under the grid. The right of each row SHALL show the
day's total orders in the current range, in both views.

Above the grid, the card SHALL show:

- "Busiest hour" with the weekday and the hour of the cell with the most
  orders, for example "Fri 6pm–7pm". When two cells have the same count, the
  earlier weekday (Mon first) and then the earlier hour SHALL win.
- "Busiest day" with the full name of the weekday with the most orders. When
  two days have the same total, the earlier weekday SHALL win.
- "After <hour>" with the percent of the orders, rounded to a whole number,
  that were placed from the start hour of the busiest hour to midnight, on all
  the weekdays, for example "After 6pm 38% of orders".

When a comparison is selected, the card SHALL show a "This period" and "Change"
toggle, with This period selected first. When the comparison is None, the card
SHALL NOT show the toggle and SHALL show This period.

In This period, the dot area SHALL grow with the cell's orders relative to the
cell with the most orders, and the dot color SHALL go from a light purple to a
dark purple as the orders grow. A cell with no orders SHALL show the smallest
dot. The legend SHALL read "Bigger, darker dot = more" and "Numbers on the
right: total per day".

In Change, the dot area SHALL grow with the absolute difference between the
cell's current and comparison orders, relative to the largest absolute
difference in the grid. A cell with more orders than the comparison SHALL be
purple, a cell with fewer orders SHALL be gray, and a cell with the same orders
SHALL show the smallest gray dot. The legend SHALL read "More than <comparison
range span>", "Fewer" and "Bigger dot, bigger change".

Hovering or focusing a dot SHALL show a tooltip with the weekday, the hour span
and the orders. In Change, the tooltip SHALL also show the comparison orders
and the signed difference. Each dot SHALL have the same text as its accessible
name. Hovering or focusing a dot SHALL also show a circular outline of
one fixed size around it, whatever the dot size.

On a card narrower than 640px, the grid SHALL keep a width of 640px and
scroll horizontally inside the card. The summary and the toggle SHALL wrap
above the grid.

When the range has no placed orders, the card SHALL show the empty state.

#### Scenario: Summary line

- **WHEN** Fri 6pm–7pm has the most orders, Tuesday has the most orders of all days, and 38 of 100 orders were placed from 6pm to midnight
- **THEN** the summary shows "Busiest hour Fri 6pm–7pm", "Busiest day Tuesday" and "After 6pm 38% of orders"

#### Scenario: Busiest hour tie

- **WHEN** Mon 2pm–3pm and Wed 9am–10am both have 7 orders, and no cell has more
- **THEN** the busiest hour is "Mon 2pm–3pm"

#### Scenario: Change colors

- **WHEN** the comparison is Previous period, Fri 12pm–1pm has 12 orders and 4 before, and Sat 3pm–4pm has 2 orders and 6 before
- **THEN** in Change, Fri 12pm–1pm shows a purple dot, Sat 3pm–4pm shows a smaller gray dot, and the tooltip of Fri 12pm–1pm shows "12 orders", "4 before" and "+8"

#### Scenario: Hover outline

- **WHEN** the merchant hovers the smallest dot and then the largest dot
- **THEN** each one shows a circular outline, and the two outlines have the same size

#### Scenario: No comparison

- **WHEN** Compare is None
- **THEN** the toggle does not show and the grid shows This period

#### Scenario: Narrow card

- **WHEN** the screen is 375px wide
- **THEN** the grid keeps a width of 640px and scrolls horizontally inside the card

### Requirement: Sales by location map

The Sales by location card SHALL show a world map at the left and, at the
right, a "Sales", "Orders" and "Customers" tab list with Sales selected first.
On a card narrower than 720px, the tab list and the list SHALL show below the
map. The map SHALL use geometry that is in the plugin bundle and SHALL NOT
load any file from another site.

The map SHALL color each country by its value for the selected tab. The
lowest value SHALL be a light purple, the highest value SHALL be a dark
purple, and a value between them SHALL mix the two colors by the square root
of its share between the lowest and the highest value. A country with no value
for the selected tab SHALL be gray. Below the map, the legend SHALL show the
tab name, the lowest value, a gradient, the highest value, and a gray swatch
with "None".

Hovering or focusing a country with a value SHALL show a border around that
country and a tooltip with the country name, the value and the change.
Hovering a country with no value SHALL also show a border around that country
and a tooltip with the country name and "No data". A country with no value
SHALL keep the default cursor, SHALL do nothing on a click, and SHALL NOT be
reachable with the keyboard. The map SHALL NOT zoom on the mouse wheel and SHALL NOT
pan on a drag. Each country with a value SHALL be reachable with the keyboard,
and its accessible name SHALL be the tooltip text.

With no country selected, the list SHALL show the top 5 countries by the
selected tab. Each row SHALL show the country name, the value, the change as
colored text, and a bar whose length is the value relative to the first row.

A click on a country with a value, Enter or Space on a focused country, or a
click on a country row SHALL select that country. The map SHALL then zoom with
an animation so that the country fits in the center of the map, and the other
countries SHALL fade. The list SHALL show "<Country> by region", a
"← All countries" link, and the top 5 regions of that country by the selected
tab, in the same row style. When the map has no shape for the selected
country (a small country that the bundled geometry leaves out), the map SHALL
NOT zoom and the list SHALL still show its regions. While the regions load, the list SHALL show
skeleton rows. When the regions request fails, the list SHALL show an error
with a retry action. A click on "← All countries", Escape, or a click on the
sea SHALL clear the selection and zoom the map back out.

When the range or the comparison changes, a selected country that still has
a value SHALL stay selected and its regions SHALL load for the new range. A
selected country with no value in the new range SHALL be cleared. The selected
country SHALL NOT be in the URL.

When the comparison is None, no row and no tooltip SHALL show a change. When
no country has a value, the card SHALL show the empty state.

#### Scenario: Color by tab

- **WHEN** the Customers tab is selected, the United States has 207 customers and Bangladesh has 12, and no country has fewer than 12 or more than 207
- **THEN** the United States is the dark purple, Bangladesh is the light purple, and the legend reads "Customers 12 … 207" and "None"

#### Scenario: Top countries

- **WHEN** no country is selected and the Sales tab is selected
- **THEN** the list shows the 5 countries with the highest Net sales, the first with a full bar

#### Scenario: Hover a country

- **WHEN** the merchant hovers Germany, which has Sales 5672.15 and a change of 111.2
- **THEN** Germany shows a border and the tooltip shows "Germany", "$5,672.15" and "111.2%" in green with an up icon

#### Scenario: Hover a country with no value

- **WHEN** the merchant hovers France, which has no value for the selected tab
- **THEN** France shows a border and the tooltip shows "France" and "No data", the cursor stays the default cursor, and a click does nothing

#### Scenario: Select a country

- **WHEN** the merchant clicks the United States
- **THEN** the map zooms so the United States fits in the center, the other countries fade, and the list shows "United States by region", "← All countries" and the top 5 regions by the selected tab

#### Scenario: Change tab in a country

- **WHEN** the United States is selected and the merchant selects the Orders tab
- **THEN** the list shows the top 5 regions by orders without a new request, and the map colors follow Orders

#### Scenario: Back to all countries

- **WHEN** the United States is selected and the merchant presses Escape
- **THEN** the map zooms back out and the list shows the top 5 countries

#### Scenario: Range change keeps the country

- **WHEN** the United States is selected and the merchant changes the range to Last 90 days, and the United States has orders in that range
- **THEN** the United States stays selected and its regions load for Last 90 days

#### Scenario: Range change clears the country

- **WHEN** Bangladesh is selected and the merchant changes the range to one in which Bangladesh has no value
- **THEN** the card shows All countries

### Requirement: Sales by location row ripple

When no country is selected, a mouse hover or a keyboard focus on a country row
in the Sales by location list SHALL show one ring on the map at the center of
that country's largest land part. The ring SHALL use the map ping purple. It
SHALL grow and fade one time in approximately 800 ms, and it SHALL NOT repeat
while the row keeps the hover or the focus. Each new hover or focus on a row
SHALL play the ripple again. The ring SHALL go when the hover or the focus goes.

The ring SHALL NOT receive pointer events and SHALL be hidden from assistive
technology. A row hover SHALL NOT show the country border or the map tooltip.
When the map has no shape for the country, no ring SHALL show. A region row
SHALL NOT show a ring, because the map has no region shapes. When the user asks
for reduced motion, the ring SHALL show at its full size with no animation while
the row has the hover or the focus.

#### Scenario: Hover a country row

- **WHEN** no country is selected and the merchant moves the mouse onto the Germany row
- **THEN** a purple ring shows at the center of Germany on the map, grows and fades one time, and Germany shows no border and no tooltip

#### Scenario: Hover the same row again

- **WHEN** the merchant moves the mouse off the Germany row and then onto it again
- **THEN** the ripple plays again on Germany

#### Scenario: Move to another row

- **WHEN** the Germany row has the hover and the merchant moves the mouse onto the United States row
- **THEN** the ring on Germany goes and a new ripple plays on the United States

#### Scenario: Keyboard focus on a country row

- **WHEN** the merchant moves the focus onto the Germany row with Tab
- **THEN** the ripple plays on Germany, and the ring goes when the focus leaves the row

#### Scenario: Country with no map shape

- **WHEN** the merchant hovers the Singapore row and the bundled map has no shape for Singapore
- **THEN** no ring shows

#### Scenario: Region row

- **WHEN** the United States is selected and the merchant hovers the California row
- **THEN** no ring shows

#### Scenario: Reduced motion ring

- **WHEN** the user asks for reduced motion and the merchant hovers the Germany row
- **THEN** a static purple ring shows at the center of Germany until the hover goes

### Requirement: Comparison legend

The Total sales, Average order value and Orders over-time charts SHALL show a
legend under the chart with the current range span and, when there is a
comparison, the comparison range span, each with a sample of its line or bar
style. When there is no comparison, the legend SHALL show only the current
range.

#### Scenario: With comparison

- **WHEN** the range is Oct 8 to Oct 14, 2026 and the comparison is Previous year
- **THEN** the legend shows "Oct 8 – 14, 2026" with a solid sample and "Oct 8 – 14, 2025" with a dashed sample

#### Scenario: No comparison

- **WHEN** Compare is None
- **THEN** the legend shows only the current range

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
