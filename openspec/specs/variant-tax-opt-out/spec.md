# variant-tax-opt-out Specification

## Purpose

Lets a variant opt out of item tax with its `charge_taxes` setting, so an item the merchant marked as "do not charge tax" is not taxed in the cart, at checkout or on an order.

## Requirements

### Requirement: A variant with charge taxes off gets no item tax

When tax is calculated for a cart or an order, an item whose variant has `charge_taxes` off SHALL get no item tax lines and zero item tax. An item whose variant has `charge_taxes` on SHALL be taxed as before.

#### Scenario: Item with charge taxes off in a cart

- **WHEN** tax calculation is on, a tax region applies, and the cart holds a variant with `charge_taxes` off
- **THEN** the item has no tax lines and its tax amount is zero

#### Scenario: Item with charge taxes on in a cart

- **WHEN** tax calculation is on, a tax region applies, and the cart holds a variant with `charge_taxes` on
- **THEN** the item is taxed at the rate of the tax region, as it was before this change

#### Scenario: Cart with taxed and untaxed items

- **WHEN** a cart holds one variant with `charge_taxes` on and one with `charge_taxes` off
- **THEN** only the first item has tax, and the cart tax total equals the tax of that item and of shipping

### Requirement: A variant charges tax unless it is set not to

A variant created or updated without a `charge_taxes` value SHALL have `charge_taxes` on. Only an explicit `false` SHALL turn it off.

#### Scenario: Variant created without charge taxes

- **WHEN** a variant is created through the API and the request has no `charge_taxes` value
- **THEN** the stored variant has `charge_taxes` on and its item is taxed

#### Scenario: Variant created with charge taxes off

- **WHEN** a variant is created with `charge_taxes` set to `false`
- **THEN** the stored variant has `charge_taxes` off

#### Scenario: Product update without charge taxes

- **WHEN** a product is updated through the API and a variant in the request has no `charge_taxes` value
- **THEN** that variant has `charge_taxes` on after the update

### Requirement: The store tax setting decides first

The `charge_taxes` setting of a variant SHALL matter only when tax calculation is on in the store settings and at least one tax region is set up. When tax calculation is off, no item SHALL be taxed, whatever its `charge_taxes` value.

#### Scenario: Tax calculation is off

- **WHEN** tax calculation is off in the store settings and the cart holds a variant with `charge_taxes` on
- **THEN** the item has no tax

#### Scenario: Charge taxes cannot turn tax on

- **WHEN** tax calculation is off and the cart holds a variant with `charge_taxes` off
- **THEN** the item has no tax, the same as an item with `charge_taxes` on

### Requirement: An untaxed item keeps its catalog price under tax-inclusive pricing

When the store prices items inclusive of tax, an item with `charge_taxes` off SHALL have no tax extracted from its price. The final total of the item SHALL equal its catalog price total minus any discount.

#### Scenario: Tax-inclusive pricing and charge taxes off

- **WHEN** the store prices items inclusive of tax and a variant with `charge_taxes` off is priced at 110.00
- **THEN** the item subtotal is 110.00, its tax is 0.00 and its total is 110.00

### Requirement: Shipping tax does not depend on item charge taxes

The `charge_taxes` setting of a variant SHALL NOT turn shipping tax on or off. Whether shipping is taxed stays decided by the shipping method and the tax logic of the region.

#### Scenario: Taxable shipping and an untaxed item

- **WHEN** the shipping method is taxable and the only item in the cart has `charge_taxes` off
- **THEN** the shipping charge is still taxed by the tax logic of the region

### Requirement: A line already on an order keeps its stored tax when the order is edited

When an order is edited, a line that was already on the order SHALL keep the tax rates stored for it, whatever the current `charge_taxes` value of its variant. A line added during the edit SHALL follow the current `charge_taxes` value of its variant.

#### Scenario: Charge taxes turned off after the order was placed

- **WHEN** an order has a taxed line, the variant is later set to `charge_taxes` off, and the order is edited
- **THEN** the existing line keeps its stored tax rates and its tax

#### Scenario: Charge taxes turned on after the order was placed

- **WHEN** an order has an untaxed line, the variant is later set to `charge_taxes` on, and the order is edited
- **THEN** the existing line stays untaxed

#### Scenario: New line with charge taxes off

- **WHEN** an order is edited and a new line is added for a variant with `charge_taxes` off
- **THEN** the new line has no tax, and the existing lines keep their stored tax
