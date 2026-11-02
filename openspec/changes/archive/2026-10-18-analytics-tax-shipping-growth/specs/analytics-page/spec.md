## MODIFIED Requirements

### Requirement: Cards

The Cards table rows for Taxes collected by region and Shipping charges by
method SHALL be:

| Card | Size | Content |
|---|---|---|
| Taxes collected by region | half | Top 5 shipping regions by Total tax, as one bar each with Total tax, the product and shipping tax split, and the change in Total tax |
| Shipping charges by method | half | Top 5 methods by Shipping charges, as one bar each with Shipping charges, order count and the change in Shipping charges |

All other rows, the rule that no card opens another page, and the existing
scenarios SHALL stay as they are.

#### Scenario: Tax region row

- **WHEN** the page shows the Taxes collected by region card
- **THEN** each of the top 5 regions shows as one bar with its Total tax, its product and shipping tax split and its change in Total tax

#### Scenario: Shipping method row

- **WHEN** the page shows the Shipping charges by method card
- **THEN** each of the top 5 methods shows as one bar with its Shipping charges, its order count and its change in Shipping charges

## ADDED Requirements

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
