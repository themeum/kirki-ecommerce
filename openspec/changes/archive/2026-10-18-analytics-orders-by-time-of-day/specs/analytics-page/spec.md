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

## ADDED Requirements

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
