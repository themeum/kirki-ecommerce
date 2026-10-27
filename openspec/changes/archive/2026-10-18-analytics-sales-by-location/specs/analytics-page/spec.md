## MODIFIED Requirements

### Requirement: Cards

Below the key metrics, the page SHALL show these cards, in this order, at most
two in a row, with "full" cards taking a whole row and a card left alone in a
row filling it. On screens narrower than 720px, every card SHALL take a whole row.

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
| Sales by payment method | half | Top 5 methods by Total sales, with order count |
| Taxes collected by region | half | Top 5 shipping regions by Total tax |
| Shipping charges by method | half | Top 5 methods by Shipping charges, with order count |
| Inventory health | half | Counts of out-of-stock, low-stock and in-stock variants, the 4 lowest variants, and the note "Live, not affected by the date range" |

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

- **WHEN** the page shows its cards on a wide screen
- **THEN** Orders by time of day takes a whole row directly after the row of New vs returning customers and Sales by coupon code

#### Scenario: Sales by location row

- **WHEN** the page shows its cards on a wide screen
- **THEN** Sales by location takes a whole row directly after Orders by time of day

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

## ADDED Requirements

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
country and a tooltip with the country name, the value and the change. A
country with no value SHALL show no border and no tooltip, and SHALL do
nothing on a click. The map SHALL NOT zoom on the mouse wheel and SHALL NOT
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

- **WHEN** the merchant hovers a country with no value for the selected tab
- **THEN** no border and no tooltip show, and a click does nothing

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
