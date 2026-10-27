## Purpose

Lets the merchant choose which key metrics and cards the Analytics page shows,
and in which order, and keeps that choice in the browser.

## ADDED Requirements

### Requirement: Customize sheet

Selecting Customize SHALL open a sheet from the right with the title
"Customize analytics" and two groups. The "Key metrics" group SHALL list the
11 key metrics, with the help text "Shown across the top, 4 in each row, in
this order. N/11 on. Drag to reorder." where N is the number of key metrics
that are on. The "Cards" group SHALL list the 15 cards, with the help text
"Shown in this order. Drag to reorder." and the note "Full width" on each full
card. Each item SHALL show a drag handle, a checkbox and the item title. Both
groups SHALL show their items in the current page order. The footer SHALL show
"Reset to default" on the left and "Done" on the right. "Done" SHALL close the
sheet.

#### Scenario: Open the sheet

- **WHEN** the merchant selects Customize with the default layout
- **THEN** the sheet shows the 11 key metrics with Gross sales, Orders, Average order value and Returning customer rate checked, and the 15 cards all checked

#### Scenario: Full width note

- **WHEN** the sheet is open
- **THEN** Total sales over time, Orders by time of day and Sales by location show "Full width", and no other card does

#### Scenario: Done

- **WHEN** the merchant selects Done
- **THEN** the sheet closes and the page keeps the changes

### Requirement: Turn items on and off

Checking or clearing an item's checkbox SHALL show or hide that key metric or
card on the page immediately. The page SHALL NOT have a limit on the number of
key metrics that are on.

#### Scenario: Hide a card

- **WHEN** the merchant clears Sales by coupon code
- **THEN** the Sales by coupon code card is no longer on the page

#### Scenario: Show a key metric

- **WHEN** the merchant checks Net sales
- **THEN** Net sales shows in the key metrics row, in its position in the list

#### Scenario: All key metrics on

- **WHEN** the merchant checks all 11 key metrics
- **THEN** all 11 show, and no checkbox is disabled

### Requirement: Reorder items

The merchant SHALL be able to drag an item by its handle to a new position in
its group, with a pointer or with the keyboard. An item SHALL NOT move to the
other group. The page SHALL show the new order immediately, for items that are
on and items that are off.

#### Scenario: Drag a card

- **WHEN** the merchant drags Inventory health above Total sales over time
- **THEN** Inventory health is the first card on the page

#### Scenario: Keyboard reorder

- **WHEN** the merchant focuses the handle of Orders, presses Space, presses Arrow Up and presses Space
- **THEN** Orders moves above Gross sales in the list and on the page

#### Scenario: No move between groups

- **WHEN** the merchant drags Gross sales over the Cards group and drops it
- **THEN** Gross sales stays in the Key metrics group

### Requirement: One item on in each group

At least 1 key metric and at least 1 card SHALL stay on. When only 1 item of a
group is on, its checkbox SHALL be disabled and its "Hide from page" item SHALL
be disabled.

#### Scenario: Last key metric

- **WHEN** only Orders is on in Key metrics
- **THEN** the Orders checkbox is disabled, and the Orders menu has "Hide from page" disabled

#### Scenario: Other group not affected

- **WHEN** only 1 key metric is on and all cards are on
- **THEN** every card checkbox is enabled

### Requirement: Hide from page menu

Each key metric and each card on the page SHALL have a menu button with three
dots and the accessible name "More actions for <title>" at the top-right corner.
The menu SHALL have only one item, "Hide from page", with an X icon. Selecting
it SHALL hide that key metric or card, the same as clearing its checkbox. The
menu button SHALL be hidden by default. It SHALL show when the pointer is over
the key metric or card, when the key metric, the card or the button has keyboard
focus, or while the menu is open. On devices without hover, the button SHALL
always show. A card that shows an error SHALL also have the menu.

#### Scenario: Hide a key metric

- **WHEN** the merchant opens the Gross sales menu and selects Hide from page
- **THEN** Gross sales is no longer on the page, and its checkbox in the sheet is clear

#### Scenario: Button is hidden until hover

- **WHEN** the pointer is not over the Orders key metric
- **THEN** its menu button is not visible

#### Scenario: Touch device

- **WHEN** the device has no hover
- **THEN** every menu button is visible

### Requirement: Saved layout

The page SHALL keep the order and the on or off state of each key metric and
card in the browser's local storage, and SHALL use it each time the page
opens. When there is no saved layout, or it cannot be read, the page SHALL use
the default layout. A saved layout SHALL ignore keys that the page does not
know, SHALL add keys that it does not have at the end of their group with
their default state, and SHALL turn on the first item of a group when no item
of that group is on. When local storage is not available, the page SHALL still
work and SHALL keep the layout only until it closes.

#### Scenario: Layout persists

- **WHEN** the merchant hides Sales by coupon code and opens the page again
- **THEN** Sales by coupon code is still hidden

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
"Cards" requirement. "Reset to default" SHALL apply the default layout and
save it.

#### Scenario: Reset

- **WHEN** the merchant has hidden 3 cards and reordered the key metrics, and selects Reset to default
- **THEN** the page and the sheet show the default layout
