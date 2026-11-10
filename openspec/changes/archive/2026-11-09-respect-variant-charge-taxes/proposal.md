# Proposal

## Why

Each variant has a `charge_taxes` switch, and the admin can set it. The price
calculation does not read it. An item marked "do not charge tax" is still
taxed in the cart, at checkout and on new order lines. This is gap G9 in
`docs/order-data-and-calculations.md`.

## What Changes

- The cart and order calculation read `charge_taxes` from the variant. A
  variant with `charge_taxes` off gets no item tax lines and zero item tax.
- The flag matters only when tax calculation is on in the store settings
  (`is_tax_calculation_enabled`) and a tax region exists. The existing
  `Tax::should_calculate_tax()` check already gates this. No new setting check
  is added.
- The calculation item (`CalculationItemDTO`) gets a `charge_taxes` property
  that defaults to `true`.
- The cart and the "new line on an order" builders copy the value from the
  variant. They do not cast it, because `Variant` already casts it to boolean.
- The item list built for the tax engine leaves out items with
  `charge_taxes` off. No tax strategy changes.
- A line already on an order does not read the flag again. An edit keeps the
  stored tax rates of the line.
- `CreateVariantDTO` and `UpdateVariantDTO` default `charge_taxes` to `true`,
  not `false`. This matches the database default (`1`) and the admin form. Before
  this change nothing read the value, so the `false` default had no effect. Now a
  variant sent through the API without `charge_taxes` would lose its tax.
- Docs: gap G9 is marked as fixed.

Not in scope: the "Incl. Tax" and "Incl. VAT" labels on the shop card and the
product page (`Tax::should_show_incl_tax_on_shop_page()`). A variant-specific
override for these labels will be designed later.

## Capabilities

### New Capabilities
- `variant-tax-opt-out`: A variant can opt out of item tax with `charge_taxes`.
  Covers the cart, new order lines and edited orders. Shipping tax is not
  covered.

### Modified Capabilities

None. The existing tax specs describe how tax is calculated for the items
given to the engine. They do not change.

## Impact

- `app/DTO/Calculation/CalculationItemDTO.php`: new `charge_taxes` property.
- `app/DTO/Calculation/CalculationContextDTO.php` (`from_cart()`): copy the flag.
- `app/Services/OrderCalculationContextService.php` (`build_new_item()`): copy the flag.
- `app/Actions/Cart/RecalculateCartAction.php` (`build_tax_context()`): skip untaxed items.
- `app/DTO/Variant/CreateVariantDTO.php`, `app/DTO/Variant/UpdateVariantDTO.php`: default `charge_taxes` to `true`.
- `tests/Unit/Actions/Cart/RecalculateCartActionTest.php`: new cases.
- `docs/order-data-and-calculations.md`: update the `charge_taxes` row and gap G9.
- No database change, no API change, no new setting.
