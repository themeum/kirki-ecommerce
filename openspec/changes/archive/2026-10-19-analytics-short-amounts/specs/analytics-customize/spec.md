## ADDED Requirements

### Requirement: Amount format

The page SHALL show each money amount of the key metrics, the card headlines,
Total sales breakdown, the ranked lists, Sales by category, Sales by product
and Sales by location (its rows, its legend and its map tooltip) in the selected format:
the `short_display` of its money object for Short, and its `display` for Long.
In Short mode, an amount whose short and long text are different SHALL have
the long text as its native `title`, except in the map tooltip and in a text
with other words, such as "$3.2K off". A change of
format SHALL change the page at once and SHALL NOT fetch the data again. Chart
tooltips SHALL always show the long amount, and chart axes SHALL always show
short amounts, in both formats.

#### Scenario: Short format

- **WHEN** the format is Short and Gross sales is $20,345.00
- **THEN** the Gross sales key metric shows `$20.3K`, with the title `$20,345.00`

#### Scenario: Long format

- **WHEN** the merchant selects Long
- **THEN** the Gross sales key metric shows `$20,345.00`, the Total sales over time headline shows `$20,345.00` with no title, and no metric request is sent

#### Scenario: Small amount in Short format

- **WHEN** the format is Short and Average order value is $85.50
- **THEN** the key metric shows `$85.50`, and its title is not a different amount

#### Scenario: Chart tooltip

- **WHEN** the format is Short and the merchant hovers a point of Total sales over time
- **THEN** the tooltip shows the long amount of that point

## MODIFIED Requirements

### Requirement: Customize sheet

Selecting Customize SHALL open a sheet from the right with the title
"Customize analytics" and three groups. The "Key metrics" group SHALL list the
11 key metrics, with the help text "Shown across the top, 4 in each row, in
this order. N/11 on. Drag to reorder." where N is the number of key metrics
that are on. The "Cards" group SHALL list the 15 cards, with the help text
"Shown in this order. Drag to reorder." and the note "Full width" on each full
card. Each item SHALL show a drag handle, a checkbox and the item title. Both
groups SHALL show their items in the current page order. The "Amounts" group
SHALL be below "Cards", with the help text "How money amounts are shown." and a
radio group with "Short" and "Long". Each option SHALL show the
`short_display` (Short) or the `display` (Long) of `meta.amount_example` in
parentheses, for example "Short ($20.3K)" and "Long ($20,345.00)". When the
example is not loaded, the options SHALL show only "Short" and "Long". The
footer SHALL show "Reset to default" on the left and "Done" on the right.
"Done" SHALL close the sheet.

#### Scenario: Open the sheet

- **WHEN** the merchant selects Customize with the default layout
- **THEN** the sheet shows the 11 key metrics with Gross sales, Orders, Average order value and Returning customer rate checked, the 15 cards all checked, and Short selected in Amounts

#### Scenario: Full width note

- **WHEN** the sheet is open
- **THEN** Total sales over time, Orders by time of day and Sales by location show "Full width", and no other card does

#### Scenario: Amount examples

- **WHEN** the sheet is open and the base currency is USD
- **THEN** the Amounts options read "Short ($20.3K)" and "Long ($20,345.00)"

#### Scenario: Done

- **WHEN** the merchant selects Done
- **THEN** the sheet closes and the page keeps the changes

### Requirement: Saved layout

The page SHALL keep the order and the on or off state of each key metric and
card, and the amount format, in the browser's local storage, and SHALL use them
each time the page opens. When there is no saved layout, or it cannot be read,
the page SHALL use the default layout. A saved layout SHALL ignore keys that
the page does not know, SHALL add keys that it does not have at the end of
their group with their default state, and SHALL turn on the first item of a
group when no item of that group is on. A saved layout with no amount format,
or with an amount format that is not "short" or "long", SHALL use Short. When
local storage is not available, the page SHALL still work and SHALL keep the
layout only until it closes.

#### Scenario: Layout persists

- **WHEN** the merchant hides Sales by coupon code and opens the page again
- **THEN** Sales by coupon code is still hidden

#### Scenario: Amount format persists

- **WHEN** the merchant selects Long and opens the page again
- **THEN** the page shows long amounts and the sheet has Long selected

#### Scenario: Layout saved before the amount format

- **WHEN** the saved layout has no amount format
- **THEN** the page keeps the saved items and shows short amounts

#### Scenario: Broken value

- **WHEN** the saved value is not valid JSON
- **THEN** the page shows the default layout

#### Scenario: New card after an update

- **WHEN** the saved layout has no entry for a card that a later version adds
- **THEN** that card shows at the end of the cards, on

### Requirement: Default layout

The default layout SHALL have the key metrics in this order: Gross sales,
Orders, Average order value, Returning customer rate, Net sales, Total sales,
Items ordered, Discounts, New customers, Customers and Shipping charges, with
only the first 4 on. It SHALL have all 15 cards on, in the order of the
"Cards" requirement. Its amount format SHALL be Short. "Reset to default" SHALL
apply the default layout and save it.

#### Scenario: Reset

- **WHEN** the merchant has hidden 3 cards, reordered the key metrics and selected Long, and selects Reset to default
- **THEN** the page and the sheet show the default layout, with short amounts
