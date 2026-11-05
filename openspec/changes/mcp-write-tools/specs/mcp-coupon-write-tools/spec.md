## Purpose

Defines the MCP tools that create a coupon, turn a coupon on or off or copy
it, and change the rules of a coupon. Each tool uses the same coupon rules as
the admin coupon form.

## ADDED Requirements

### Requirement: Create a coupon

`kirki-ecommerce-create-coupon` SHALL create a coupon with the fields and the
rules of the admin coupon form: method, title, code, discount type, target
and value, eligible items, spend condition, start and end date-times,
countries, customer eligibility, usage limits and `is_active`. A fixed
discount SHALL be a decimal amount in the store currency, and a percentage
SHALL be a number from 0 to 100. When the method is a code and no `code` is
sent, the preview SHALL contain a new code that the store generates, and the
done change SHALL use that code. The preview SHALL show the full rule set in
plain words, for example "20% off all products, from 1 November, for each
customer once".

#### Scenario: Black Friday code

- **WHEN** a confirmed call creates a 20% code coupon `"BF20"` that ends on 30 November
- **THEN** the coupon exists with code `"BF20"`, and the result shows its stored rules

#### Scenario: Code exists

- **WHEN** `code` is the code of an existing coupon
- **THEN** the tool returns a tool error that names `code`, and gives no token

#### Scenario: Generated code

- **WHEN** a preview is made for a code coupon without `code`
- **THEN** the preview has a generated code, and the confirmed call creates the coupon with that code

### Requirement: Set coupon state

`kirki-ecommerce-set-coupon-state` SHALL require `coupon_id` and `action`,
one of `activate`, `deactivate` and `duplicate`. `duplicate` SHALL create a
copy with a new generated code and " - Copy" after the title. The preview
SHALL show the current and the new state, and for `duplicate` the title of
the copy.

#### Scenario: Stop a leaked code

- **WHEN** a confirmed call sends `action` `"deactivate"` for an active coupon
- **THEN** the coupon is inactive and cannot be used at checkout

#### Scenario: Already inactive

- **WHEN** `action` is `"deactivate"` for an inactive coupon
- **THEN** the tool returns a tool error that says the coupon is already inactive, and gives no token

### Requirement: Update a coupon

`kirki-ecommerce-update-coupon` SHALL require `coupon_id` and at least one
field of `create-coupon`. Fields that are not sent SHALL keep their current
values. The result SHALL pass the same rules as the admin coupon form. The
preview SHALL show the current and the new value of each field that changes,
and the number of times the coupon was used.

#### Scenario: Extend the end date

- **WHEN** a confirmed call sends a later `end_datetime` for coupon 7
- **THEN** only the end date-time of coupon 7 changes

#### Scenario: Not valid together

- **WHEN** `has_usage_limit` is true and the coupon has no `usage_limit` and none is sent
- **THEN** the tool returns a tool error that names `usage_limit`
