## MODIFIED Requirements

### Requirement: Sales metric cards

The overview SHALL show four metric cards, in this order:

1. **Total sales**: the sum of the base-currency total of all counted orders.
2. **Net sales**: Total sales minus the base-currency tax total, minus the
   base-currency shipping total, minus the base-currency amount of completed
   refunds on counted orders.
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
