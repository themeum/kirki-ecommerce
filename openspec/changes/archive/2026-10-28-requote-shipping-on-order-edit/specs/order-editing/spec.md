# Spec Delta

## ADDED Requirements

### Requirement: An edit always quotes shipping again
The edit preview and the save SHALL quote the shipping charge and the shipping method record again from the current shipping settings, for the order as it is sent: its lines, its quantities, its shipping address and its shipping method. The stored shipping charge and the stored shipping method record SHALL NOT be used by an edit.

#### Scenario: Quantity raised under a weight-based rate
- **WHEN** the order's shipping method charges by weight and an admin raises the quantity of a line
- **THEN** the shipping charge is quoted again for the new total weight

#### Scenario: Line added
- **WHEN** an admin adds a new line to the order
- **THEN** the shipping charge is quoted again with the new line included

#### Scenario: Only the postal code changed
- **WHEN** an admin saves an edit that changes only the shipping postal code
- **THEN** the shipping charge and the method record are quoted from the current settings for that address

#### Scenario: Address changed to another state
- **WHEN** an admin saves an edit that changes the shipping state
- **THEN** the shipping charge and the method record are quoted from the current settings for the new address

#### Scenario: Rate changed after the order was placed
- **WHEN** the store's flat rate was raised after the order was placed, and an admin saves an edit that changes only the order notes
- **THEN** the shipping charge is the current flat rate and the method record is the current one

#### Scenario: Preview and save agree
- **WHEN** an admin previews an edit and then saves the same payload with the same store settings
- **THEN** the saved shipping charge equals the shipping charge of the preview

### Requirement: An edit always checks the shipping method
The edit preview and the save SHALL check the selected shipping method against the current shipping settings for the order as it is sent. When the method is not available, the request SHALL fail with a 422 error whose message tells the admin to select another shipping method. This SHALL apply also when the edit does not change the shipping address or the shipping method.

#### Scenario: Shipping method not available at the new address
- **WHEN** an admin changes the shipping country and the selected shipping method does not serve it
- **THEN** the request fails with a 422 error

#### Scenario: Method removed from the store, nothing else changed
- **WHEN** the order's shipping method was removed from the store and an admin saves an edit that changes only a quantity
- **THEN** the request fails with a 422 error that tells the admin to select another shipping method

#### Scenario: Admin selects an available method
- **WHEN** the order's shipping method was removed from the store and an admin saves an edit with a shipping method that is available for the address
- **THEN** the edit is saved with the new method's charge and method record

### Requirement: The shipping tax of an edit follows the new shipping quote
The system SHALL calculate the shipping tax of an edit from the current settings, for the new shipping charge. This SHALL apply also when the line tax rates stay stored because the address that tax follows did not change.

#### Scenario: Tax rate raised, address not changed
- **WHEN** the store's tax rate was raised after the order was placed, and an admin saves an edit that changes only a quantity
- **THEN** the lines on the order keep the stored rate and the shipping is taxed at the current rate

#### Scenario: Method no longer taxable
- **WHEN** the order's shipping method was made not taxable after the order was placed, and an admin saves an edit
- **THEN** the shipping tax of the edit is zero

## MODIFIED Requirements

### Requirement: Tax keeps its stored rates when the tax address is the same
The system SHALL use the tax rates stored on the order for the lines on the order when the country and the state of the address that tax follows are the same as on the stored order. The address that tax follows is the order's tax destination: its shipping address, its billing address or the store address. The store address never changes. Other address fields SHALL NOT count as a new address. The shipping tax SHALL NOT use stored rates.

#### Scenario: Tax rate not changed
- **WHEN** an admin saves an edit with the same country and state, after the store's tax rate was raised
- **THEN** the lines on the order are taxed with the stored rate

#### Scenario: Only the street changed
- **WHEN** an admin saves an edit that changes only the street and city of the address
- **THEN** the stored line tax rates are used, and the shipping charge and the shipping tax are quoted again

### Requirement: Shipping tax rates survive a zero shipping charge
The system SHALL retain shipping tax rates in zero-amount tax rows when shipping is free, on creation and on edits. Split shipping tax SHALL retain each item's rate even when every item's taxable amount is zero.

#### Scenario: Free shipping is applied and later removed
- **WHEN** an order has a 10% shipping tax rate, free shipping is saved, the live rate changes to 20%, and free shipping is removed without changing the address
- **THEN** the shipping charge is quoted again and taxed at the current 20% rate

#### Scenario: Free shipping at checkout
- **WHEN** a new order has taxable shipping waived by a coupon
- **THEN** its shipping tax rates are stored with zero amounts

#### Scenario: Split shipping with no taxable amount
- **WHEN** free shipping is split between items with different tax rates and every item's taxable amount is zero
- **THEN** each item retains its shipping tax rate with a zero amount

### Requirement: An edit preview refuses what the save refuses
The edit preview (`POST /calculate/order` with an `order_id`) SHALL apply the currency check and the shipping-method check of the save. A `currency_code` that differs from the order's currency SHALL fail the preview with a 422 error. A shipping method that is not available for the edit as it is sent SHALL fail the preview with a 422 error.

#### Scenario: Preview with a different currency
- **WHEN** an admin previews an edit of a EUR order with currency code USD
- **THEN** the preview fails with a 422 error, as the save does

#### Scenario: Preview with a method that does not serve the new address
- **WHEN** an admin previews an edit that changes the shipping country and the selected shipping method does not serve it
- **THEN** the preview fails with a 422 error, as the save does

#### Scenario: Preview with the same address and method
- **WHEN** an admin previews an edit with the same shipping country, state and method, and the method was removed from the store since
- **THEN** the preview fails with a 422 error, as the save does

## REMOVED Requirements

### Requirement: Shipping keeps its stored charge when the address and method are the same
**Reason**: The shipping rules use the lines, the weight, the subtotal and the full address. A stored charge is wrong after an edit changes any of these.
**Migration**: An edit always quotes shipping again. See "An edit always quotes shipping again" and "An edit always checks the shipping method".

### Requirement: A new shipping address or method quotes shipping again
**Reason**: Shipping is now quoted again on every edit, not only when the address or the method changes.
**Migration**: See "An edit always quotes shipping again" and "An edit always checks the shipping method".
