# home-customize Specification

## Purpose

Lets the merchant choose the period, the header quick actions, the key numbers
and the sections that the Home dashboard shows, and their order, and keeps that
choice in the browser.

## Requirements

### Requirement: Period subtitle

In dashboard mode, the Home page SHALL show the subtitle "Your store at a
glance:" below the "Welcome" heading, followed by a period button that shows
the selected period and a down chevron. Selecting the button SHALL open a menu
with "This month", "This week", "Today" and "All time", with the selected
period highlighted. The default period SHALL be This month. Selecting a period
SHALL close the menu and SHALL change the Key numbers and the Top selling
products at once. The period SHALL NOT change Recent orders, Needs your
attention or Restock soon. This month SHALL be from the first day of the
current month to today. This week SHALL be from the first day of the current
week, as set by the site's "Week starts on" setting, to today. Today SHALL be
today. All time SHALL be from the day of the first order to today. Days SHALL
be in the request time zone, the same as Analytics. Home SHALL NOT show a
comparison with an earlier period, a change percentage or a trend arrow. The
subtitle SHALL NOT show in checklist mode.

#### Scenario: Default period

- **WHEN** a merchant with a completed setup opens Home for the first time
- **THEN** the subtitle reads "Your store at a glance: This month" and the Key numbers cover the current month to today

#### Scenario: Change the period

- **WHEN** the merchant selects the period button and then "Today"
- **THEN** the menu closes, the button reads "Today", and the Key numbers and Top selling products show today's data

#### Scenario: Week starts on Sunday

- **WHEN** the site's week starts on Sunday, today is Wednesday Nov 18, 2026, and the period is This week
- **THEN** the Key numbers cover Nov 15 – Nov 18, 2026

#### Scenario: Recent orders ignore the period

- **WHEN** the merchant changes the period from This month to Today
- **THEN** Recent orders still lists the 5 newest orders

#### Scenario: Checklist mode

- **WHEN** at least one setup step is not completed
- **THEN** Home shows no subtitle

### Requirement: Quick actions

In dashboard mode, the Home header SHALL show the checked quick actions as
buttons, at most 3. The quick actions SHALL be: Create order (opens the create
order page), View live site (opens the site's front-end home URL in a new
tab), Add product (opens the create product page), Create coupon (opens the
create coupon page) and Add customer (opens the create customer page). The
header SHALL place the checked actions from right to left in list order: the
first checked action SHALL be the primary button and SHALL be the right-most
action, and each next checked action SHALL be a secondary button immediately
to the left of the action before it. By default, Create order and View live
site SHALL be checked, in this order, and the others not checked. When no
action is checked, the header SHALL show only the Customize button. In
checklist mode, the header SHALL keep the "View Live Site" and "Add Product"
buttons.

#### Scenario: Default actions

- **WHEN** a merchant with a completed setup opens Home for the first time
- **THEN** the header shows a secondary "View live site" button and a primary "Create order" button on its right

#### Scenario: Main button moves

- **WHEN** the merchant drags Add product above Create order in the sheet
- **THEN** Add product becomes the primary button, and Create order becomes a secondary button

#### Scenario: Three actions go from right to left

- **WHEN** Add product, View live site and Create order are checked, in this order
- **THEN** the header shows, from left to right, a secondary "Create order" button, a secondary "View live site" button and a primary "Add product" button

#### Scenario: Open a coupon form

- **WHEN** the merchant selects the Create coupon quick action
- **THEN** the create coupon page opens

#### Scenario: Live site

- **WHEN** the merchant selects View live site
- **THEN** the site's front-end home URL opens in a new tab

### Requirement: Customize button

In dashboard mode, the Home header SHALL show an icon-only button with a
sliders icon, the accessible name "Customize home" and a "Customize home"
tooltip, at the right of the quick actions. Selecting it SHALL open the
Customize home sheet. In checklist mode, the button SHALL NOT show.

#### Scenario: Open the sheet

- **WHEN** the merchant selects the Customize home button
- **THEN** the "Customize home" sheet opens from the right

### Requirement: Customize home sheet

The sheet SHALL have the title "Customize home" and four groups, in this
order:

1. **Quick actions**: an info icon with the tooltip "Buttons at the top of
   Home. Up to 3; the first one is the main button.", a count "N/3" on the
   right, and the 5 quick actions. The first checked action SHALL show the
   note "Main button".
2. **Key numbers**: an info icon with the tooltip "Numbers at the top of Home,
   in this order. Up to 4.", a count "N/4" on the right, and the 11 key
   numbers.
3. **Sections**: an info icon with the tooltip "Sections of Home, in this
   order." and the 5 sections.
4. **Amounts**: an info icon with the tooltip "How money amounts are shown on
   Home." and a radio group with "Short" and "Long". Each option SHALL show the
   `short_display` (Short) or the `display` (Long) of the `meta.amount_example`
   of the loaded key numbers in parentheses, for example "Short ($20.3K)". When
   the key numbers are not loaded, the options SHALL show only "Short" and
   "Long". The sheet SHALL NOT load the key numbers only for the example.

Each item SHALL show a drag handle, a checkbox and the item title. Each group
SHALL show its items in the current order. When a group with a maximum has
reached it, the checkboxes of its unchecked items SHALL be disabled and their
titles SHALL be shown muted. The Sections group SHALL have no maximum and no
minimum. The footer SHALL show "Reset to default" on the left and "Done" on
the right. "Done" SHALL close the sheet. The sheet SHALL support the floating
mode of the Sheet.

#### Scenario: Default sheet

- **WHEN** the merchant opens the sheet with the default layout
- **THEN** Quick actions shows "2/3" with Create order (Main button) and View live site checked; Key numbers shows "4/4" with Total sales, Net sales, Orders and Items ordered checked; Sections has Key numbers, Recent orders, Top selling products and Needs your attention checked and Restock soon not checked; Amounts has Short selected

#### Scenario: Amount examples

- **WHEN** the key numbers are loaded and the example amount is 20,345 in USD
- **THEN** the Amounts options read "Short ($20.3K)" and "Long ($20,345.00)"

#### Scenario: Quick action maximum

- **WHEN** 3 quick actions are checked
- **THEN** the count reads "3/3" and the checkboxes of the 2 unchecked actions are disabled

#### Scenario: Key number maximum

- **WHEN** 4 key numbers are checked and the merchant clears Net sales
- **THEN** the count reads "3/4" and all unchecked key number checkboxes become enabled

#### Scenario: All sections off

- **WHEN** the merchant clears every section
- **THEN** every section checkbox stays enabled and the page shows "Every section is hidden. Customize Home to add some back." with a "Customize Home" link button that opens the sheet

### Requirement: Turn items on and off and reorder them

Checking or clearing an item SHALL show or hide that quick action, key number
or section on the page at once. The merchant SHALL be able to drag an item by
its handle to a new position in its group, with a pointer or with the
keyboard. An item SHALL NOT move to another group. The page SHALL show the new
order at once.

#### Scenario: Reorder sections

- **WHEN** the merchant drags Needs your attention above Recent orders
- **THEN** Needs your attention shows before Recent orders on the page

#### Scenario: Keyboard reorder

- **WHEN** the merchant focuses the handle of Orders, presses Space, presses Arrow Up and presses Space
- **THEN** Orders moves above Net sales in the list and on the page

### Requirement: Reset to default

"Reset to default" SHALL apply the default layout and save it. The default
layout SHALL be:

- Quick actions: Create order (on), View live site (on), Add product, Create
  coupon, Add customer.
- Key numbers: Total sales, Net sales, Orders, Items ordered (on), then Gross
  sales, Average order value, Returning customer rate, Discounts, New
  customers, Customers, Shipping charges (off).
- Sections: Key numbers (on), Recent orders (on), Top selling products (on),
  Restock soon (off), Needs your attention (on).
- Amounts: Short.

Reset SHALL NOT change the selected period.

#### Scenario: Reset

- **WHEN** the merchant has hidden Recent orders, checked Add product and selected Today, and selects Reset to default
- **THEN** the page and the sheet show the default layout, and the period stays Today

### Requirement: Key numbers section

The Key numbers section SHALL show one card for each checked key number, in
the layout order, in one row of up to 4 cards on wide screens, 2 columns on
medium screens and 1 column on narrow screens. The key numbers SHALL be the 11
Analytics key metrics (Gross sales, Orders, Average order value, Returning
customer rate, Net sales, Total sales, Items ordered, Discounts, New
customers, Customers, Shipping charges), with the same title, the same value
and the same info text as on Analytics for the same days. Each card SHALL show
its title and its value only. It SHALL NOT show a change, a comparison value,
a chart or a link. Money values SHALL use the Home amount format (Short or
Long) from the Amounts group of the sheet. The Home amount format SHALL NOT
change or follow the Analytics amount format. Short amounts that differ from the long
text SHALL have the long text as a native hover title. When no key number is
checked, the section SHALL show "No key numbers chosen." with a "Customize"
link button that opens the sheet. A card SHALL NOT be a link to another page.

#### Scenario: Same number as Analytics

- **WHEN** the Home period is This month and the Analytics page shows Month to date
- **THEN** each key number on Home equals the same key metric on Analytics

#### Scenario: Long amounts

- **WHEN** the merchant selected Long in the Amounts group of the Customize home sheet and Total sales is $20,345.00
- **THEN** the Total sales card on Home shows `$20,345.00`

#### Scenario: No comparison

- **WHEN** the Key numbers show
- **THEN** no card shows a percentage, an arrow or a "vs" text

#### Scenario: Click a card

- **WHEN** the merchant clicks the Orders card
- **THEN** the page does not change

### Requirement: Sections layout

The Home page SHALL show the checked sections in the layout order. Key
numbers SHALL take the full width. Each other section SHALL take half the
width in a 2-column grid on wide screens. A half-width section that is alone
in its row SHALL take the full width. On narrow screens, every section SHALL
take the full width. Two half-width sections in the same row SHALL have the
same height.

#### Scenario: Odd section

- **WHEN** the checked sections are Key numbers, Recent orders, Top selling products and Needs your attention, in this order
- **THEN** Recent orders and Top selling products share a row and Needs your attention takes the full width of the next row

### Requirement: Card information tooltips and Hide from page

Each key number card and each section card SHALL show an information icon next
to its title. The icon SHALL be hidden until the pointer is over the card, and
SHALL always show on devices without hover. When the pointer is over the icon,
a tooltip SHALL show a plain-language, translatable description of the card.
Each key number card and each section card SHALL have a menu button with three
dots and the accessible name "More actions for <title>", with one item, "Hide
from page". Selecting it SHALL hide that key number or section, the same as
clearing its checkbox. The menu button SHALL show and hide with the same rules
as on the Analytics page.

#### Scenario: Hide a section from the page

- **WHEN** the merchant opens the Recent orders menu and selects Hide from page
- **THEN** Recent orders is no longer on the page and its checkbox in the sheet is clear

#### Scenario: Info tooltip

- **WHEN** the merchant moves the pointer over the information icon next to "Net sales"
- **THEN** a tooltip shows the Analytics definition of Net sales

### Requirement: Saved Home layout

The page SHALL keep the order and the on or off state of each quick action,
key number and section, the selected period and the amount format, in the browser's local
storage, and SHALL use them each time Home opens. When there is no saved
layout, or it cannot be read, the page SHALL use the default layout and This
month. A saved layout SHALL ignore keys that the page does not know, SHALL add
keys that it does not have at the end of their group with their default
state, SHALL keep only the first 3 checked quick actions and the first 4
checked key numbers, SHALL use This month for a period it does not know, and
SHALL use Short for an amount format that is missing or is not "short" or
"long".
When local storage is not available, the page SHALL still work and SHALL keep
the layout only until it closes. The layout SHALL NOT be saved on the server.

#### Scenario: Layout persists

- **WHEN** the merchant hides Recent orders, selects This week and opens Home again
- **THEN** Recent orders is still hidden and the period is This week

#### Scenario: Broken value

- **WHEN** the saved value is not valid JSON
- **THEN** Home shows the default layout and This month

#### Scenario: Too many key numbers saved

- **WHEN** the saved layout has 6 key numbers on
- **THEN** only the first 4 of them are on

#### Scenario: New section after an update

- **WHEN** the saved layout has no entry for a section that a later version adds
- **THEN** that section is at the end of the sections, with its default state
