## Purpose

Shows the merchant on Home the work that waits for them now (orders to ship,
payments to collect, products out of stock) and the variants that are low on
stock, with a direct way to the matching list.

## ADDED Requirements

### Requirement: Needs your attention checks

The Needs your attention section SHALL show three checks, each counted from
the data as it is now and not from the Home period. Archived orders SHALL NOT
count.

1. **Orders to ship**: orders whose fulfillment status is `unfulfilled` or
   `processing` and whose payment status is `paid`, or is `unpaid` with an
   offline payment method.
2. **Payments to collect**: orders whose payment status is `unpaid` with an
   offline payment method and whose fulfillment status is not `cancelled`,
   plus orders whose payment status is `failed` and that were created in the
   last 7 days.
3. **Out of stock**: variants that the Inventory list shows for its "Out of
   stock" filter: tracked variants with an available quantity of 0 or less,
   and untracked variants that are marked out of stock.

An order uses an offline payment method when the payment method saved on the
order is marked offline.

#### Scenario: Unpaid bank transfer order

- **WHEN** an order paid with an offline method has payment status `unpaid` and fulfillment status `unfulfilled`
- **THEN** it counts in Orders to ship and in Payments to collect

#### Scenario: Online payment not finished

- **WHEN** an order paid with an online method has payment status `unpaid`
- **THEN** it counts in neither Orders to ship nor Payments to collect

#### Scenario: Old failed payment

- **WHEN** an order with payment status `failed` was created 8 days ago
- **THEN** it does not count in Payments to collect

#### Scenario: Archived order

- **WHEN** a paid, unfulfilled order is archived
- **THEN** it does not count in Orders to ship

#### Scenario: Same count as the inventory filter

- **WHEN** the Inventory list with the Out of stock filter shows 7 variants
- **THEN** the Out of stock check shows 7

### Requirement: Needs your attention card

The card SHALL have the title "Needs your attention", an info icon, and on
the right "N of 3 need you" when N checks have a count above 0, or "All caught
up" when no check has. Each check SHALL be one row with an icon, its label, its
count and an info tooltip with its rule in plain words. Checks with a count
above 0 SHALL be listed first, in the order of the requirement above, then the
checks with a count of 0. A check with a count of 0 SHALL show a check mark and
"Clear" in place of the count. Under its label, Orders to ship SHALL show
"N waiting over 2 days" when N of its orders were paid, or were created when
not paid, more than 2 days ago, and Payments to collect SHALL show the sum of
the base-currency totals of its orders as a money amount. Selecting a row
SHALL open its list:

- Orders to ship: the order list with the "To ship" attention filter.
- Payments to collect: the order list with the "To collect" attention filter.
- Out of stock: the Inventory list with the Out of stock filter.

While the data loads, the card SHALL show a skeleton. When the request fails,
the card SHALL show an error message with a retry button, and the other
sections SHALL still render.

#### Scenario: Two checks need work

- **WHEN** Orders to ship is 3, Payments to collect is 0 and Out of stock is 2
- **THEN** the card reads "2 of 3 need you", Orders to ship and Out of stock are listed first, and Payments to collect shows "Clear"

#### Scenario: All caught up

- **WHEN** every check is 0
- **THEN** the card reads "All caught up" and every row shows "Clear"

#### Scenario: Open orders to ship

- **WHEN** the merchant selects the Orders to ship row
- **THEN** the order list opens with the "To ship" filter and shows the same orders that the count counts

#### Scenario: Money at stake

- **WHEN** Payments to collect has two orders with base totals 40.00 and 60.00 USD
- **THEN** its row shows $100.00 under the label

### Requirement: Restock soon card

The Restock soon section SHALL be off by default. Its card SHALL have the
title "Restock soon", an info icon with the tooltip "Tracked variants at or
under their low-stock threshold that still have stock. Restock them before
they sell out.", and a "View inventory" button that opens the Inventory list
with the Low stock filter. The card SHALL list up to 5 tracked variants with
an available quantity above 0 and at or under their low-stock threshold (the
store default threshold when the variant has none), fewest available first,
then by variant ID. Each row SHALL show the product image, the product name,
the variant name and "N left". Selecting a row SHALL open the inventory edit
page of that variant. When no variant matches, the card SHALL show "Nothing
is low on stock." The card SHALL NOT use the Home period.

#### Scenario: Low stock variant

- **WHEN** the store default threshold is 5 and a tracked variant with no own threshold has 3 available
- **THEN** the variant is listed with "3 left"

#### Scenario: Out of stock is not listed

- **WHEN** a tracked variant has 0 available
- **THEN** it is not in Restock soon

#### Scenario: Order of rows

- **WHEN** variants have 4, 1 and 2 left
- **THEN** the rows are listed with 1, 2 and 4 left, in this order

#### Scenario: Nothing low

- **WHEN** no tracked variant is low on stock
- **THEN** the card shows "Nothing is low on stock."

### Requirement: Attention endpoint

The system SHALL provide `GET /kirki/ecommerce/v1/dashboard/attention`. It
SHALL require an authenticated administrator, like the other admin endpoints.
The response data SHALL contain:

- `to_ship`: the Orders to ship count and the count of those waiting over 2
  days.
- `to_collect`: the Payments to collect count and the sum of their
  base-currency totals as a money object.
- `out_of_stock`: the Out of stock count.
- `low_stock`: the Restock soon rows (up to 5, each with the variant ID, the
  product ID, the product name, the variant name, the product image and the
  available quantity) and the total count of low-stock variants.

The endpoint SHALL NOT accept a date range.

#### Scenario: Non-admin request

- **WHEN** a user who is not an administrator calls the endpoint
- **THEN** the request is rejected and no store data is returned

#### Scenario: Empty store

- **WHEN** the store has no orders and no tracked variants
- **THEN** every count is 0, the money sum is 0 in the base currency, and the low-stock rows are empty
