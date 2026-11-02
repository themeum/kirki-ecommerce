## MODIFIED Requirements

### Requirement: Cards

The Cards table row for Sales by payment method SHALL be:

| Card | Size | Content |
|---|---|---|
| Sales by payment method | half | Top 5 methods by Total sales, as one bar each with Total sales, order count and the change in Total sales |

All other rows, the rule that no card opens another page, and the existing
scenarios SHALL stay as they are.

#### Scenario: Payment method row

- **WHEN** the page shows the Sales by payment method card
- **THEN** each of the top 5 methods shows as one bar with its Total sales, its order count and its change in Total sales

## ADDED Requirements

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
