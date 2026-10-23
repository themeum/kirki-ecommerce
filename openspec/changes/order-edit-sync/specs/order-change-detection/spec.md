# Spec Delta

## Purpose

Reports, for an order edit preview, what changed since the order was last saved that affects its calculation, as state keys on each line item, each coupon and the order root, so a client can explain why totals moved.

## ADDED Requirements

### Requirement: Item, coupon and order root each carry a current_state list
In the order calculation payload, each line item, each coupon entry and the root SHALL have a `current_state` key. Its value is a list of change keys. The list SHALL be empty when nothing that affects the calculation changed, and the list SHALL NOT hold the same key two times.

#### Scenario: Nothing changed
- **WHEN** an admin previews an edit of an order and no price, coupon rule, shipping cost or tax mode changed since it was saved
- **THEN** every item, every coupon and the root have an empty `current_state` list

### Requirement: States compare against the order as last saved
Change keys SHALL compare the current calculation with the order as it is stored now (its last create or edit save). They SHALL NOT compare with an earlier version of the order.

#### Scenario: Price changed, then the order was edited
- **WHEN** a variant's price changed, an admin saved an edit, and the admin then previews another edit without further price changes
- **THEN** that line's `current_state` is empty

### Requirement: Order creation never reports changes
A calculation without an order ID SHALL return an empty `current_state` list on every item, coupon and the root.

#### Scenario: Create preview
- **WHEN** an admin previews a new order
- **THEN** every `current_state` list in the payload is empty

### Requirement: A line whose variant was deleted reports item_deleted
For each stored line whose variant or product no longer exists, an edit preview SHALL include one item row with `current_state` set to `["item_deleted"]` and no other key. These rows SHALL NOT be counted in any total or in the item count.

#### Scenario: Deleted product on the order
- **WHEN** an admin previews an edit of an order with a line whose product was deleted
- **THEN** the payload has a row for that line with `current_state` `["item_deleted"]`, its stored quantity and amounts, and the totals do not include it

### Requirement: A line whose catalog price changed reports price_changed
A line already on the order SHALL report `price_changed` when the variant's current price (sale price, or regular price when there is no sale) or its current regular price differs from the catalog price stored on the line. A new line SHALL NOT report it.

#### Scenario: Sale price raised
- **WHEN** a line was saved with a catalog sale price of 25.00 and the variant's sale price is now 28.00
- **THEN** that line's `current_state` is `["price_changed"]`

#### Scenario: Only the regular price changed
- **WHEN** a line's sale price is unchanged but the variant's regular price changed
- **THEN** that line's `current_state` is `["price_changed"]`

#### Scenario: Quantity changed, price did not
- **WHEN** an admin changes a line's quantity and the variant's prices are unchanged
- **THEN** that line's `current_state` is empty

#### Scenario: New line
- **WHEN** an admin adds a new line in an edit preview
- **THEN** that line's `current_state` is empty

### Requirement: A coupon that was on the order but is no longer applied reports coupon_removed
When a coupon is on the stored order and is not applied by the edit preview, the coupons list SHALL still include it with `current_state` `["coupon_removed"]` and a zero discount amount. The coupon may be deleted, expired, inactive, over its limits or no longer eligible. No other key SHALL be set on that coupon.

#### Scenario: Coupon expired
- **WHEN** an order's coupon expired after the order was saved and an admin previews an edit that still sends the code
- **THEN** the coupons list has that code with `current_state` `["coupon_removed"]` and a zero discount

#### Scenario: Coupon deleted
- **WHEN** an order's coupon was deleted after the order was saved
- **THEN** the coupons list has the stored code and title with `current_state` `["coupon_removed"]`

#### Scenario: Admin removed the coupon
- **WHEN** an admin previews an edit that no longer sends a code that is on the stored order
- **THEN** the coupons list has that code with `current_state` `["coupon_removed"]`

#### Scenario: New code that does not apply
- **WHEN** an admin sends a code that is not on the stored order and the calculation does not apply it
- **THEN** that code is not in the coupons list, the same as for order creation

### Requirement: A coupon whose discount rules changed reports coupon_changed
A coupon applied by the preview that is also on the stored order SHALL report `coupon_changed` when one of its discount rules differs from the coupon record stored on the order. The discount rules are: discount type, target, value type, fixed amount, percentage, eligible item type, reward quantity, reward value, targeted products (with the reward flag) and targeted categories.

#### Scenario: Percentage raised
- **WHEN** an order's coupon gave 10% and the coupon now gives 15%
- **THEN** that coupon's `current_state` is `["coupon_changed"]`

#### Scenario: Target products changed
- **WHEN** a product-targeted coupon on the order now targets a different set of products
- **THEN** that coupon's `current_state` is `["coupon_changed"]`

#### Scenario: Discount amount changed only because quantity changed
- **WHEN** an admin raises a line's quantity, so the order's 10% coupon gives a larger discount, and the coupon's rules are unchanged
- **THEN** that coupon's `current_state` is empty

#### Scenario: Stored coupon record has no rule details
- **WHEN** the order's stored coupon record holds no rule details
- **THEN** that coupon does not report `coupon_changed`

### Requirement: Eligibility-only coupon changes do not report coupon_changed
A change to a coupon's dates, usage limits, spend conditions, countries, customers or active flag SHALL NOT report `coupon_changed`. Such a change either makes the coupon not apply, which reports `coupon_removed`, or it does not change the calculation.

#### Scenario: Usage limit raised
- **WHEN** the coupon's usage limit was raised and its discount rules are unchanged
- **THEN** that coupon's `current_state` is empty

#### Scenario: End date extended
- **WHEN** the coupon's end date was moved later and its discount rules are unchanged
- **THEN** that coupon's `current_state` is empty

### Requirement: An unavailable stored shipping method reports shipping_method_removed
The root SHALL report `shipping_method_removed` when the preview's shipping method is the same as the order's stored shipping method and that method is not available for the preview. When this key is set, the root SHALL NOT also report `shipping_cost_changed`.

#### Scenario: Method disabled in the settings
- **WHEN** the order's stored shipping method was disabled and an admin previews an edit with that method
- **THEN** the root `current_state` has `shipping_method_removed` and not `shipping_cost_changed`

#### Scenario: Admin picked another method
- **WHEN** the stored method is unavailable but the admin previews an edit with a different, available method
- **THEN** the root `current_state` does not have `shipping_method_removed`

### Requirement: A different shipping total reports shipping_cost_changed
The root SHALL report `shipping_cost_changed` when the preview's shipping total (after shipping discount, with shipping tax) differs from the order's stored shipping total, unless `shipping_method_removed` is set.

#### Scenario: Flat rate raised
- **WHEN** the order's shipping method's flat rate was raised after the order was saved
- **THEN** the root `current_state` has `shipping_cost_changed`

#### Scenario: Free-shipping coupon removed
- **WHEN** an order's free-shipping coupon is no longer applied
- **THEN** that coupon reports `coupon_removed` and the root `current_state` has `shipping_cost_changed`

### Requirement: A different tax mode reports tax_mode_changed
The root SHALL report `tax_mode_changed` when the store's current tax-inclusive setting differs from the setting stored on the order. This key SHALL be able to appear together with a shipping key.

#### Scenario: Store moved to tax-inclusive prices
- **WHEN** an order was saved under tax-exclusive pricing and the store now uses tax-inclusive pricing
- **THEN** the root `current_state` has `tax_mode_changed`

#### Scenario: Two root changes together
- **WHEN** the tax mode changed and the shipping total also differs
- **THEN** the root `current_state` has both `shipping_cost_changed` and `tax_mode_changed`
