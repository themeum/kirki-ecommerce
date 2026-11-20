## MODIFIED Requirements

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
