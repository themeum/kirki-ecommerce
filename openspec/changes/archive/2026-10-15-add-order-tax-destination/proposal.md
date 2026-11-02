# Proposal

## Why

Tax can depend on a different address in each country. Today the system always taxes by the shipping address, and an order does not record this. When a country needs billing or store location, we cannot tell from an order which address set its tax. An order needs to keep that fact, and the design must let any future country strategy choose its address without changes to other code.

## What Changes

- Add a nullable `tax_destination` column to `kirki_ecommerce_orders`. Values: `shipping`, `billing`, `store`.
- Each tax strategy reports the address it used. The default is `shipping`. A strategy can report another value without changes to other strategies.
- The EU strategy reports `store` for a micro business, because one fixed rate of the seller's country applies and the shopper's address does not matter.
- A `tax.tax_destination` setting (`shipping`, `billing` or `store`; default `shipping`) names the address tax is calculated from. There is no UI for it yet. The cart calculation picks that address itself and falls back to the store address when it has no country. The stored value is then `store`.
- The calculation context gets the store address, next to the shipping and billing addresses.
- The calculation result carries `tax_destination`. Order create and order update copy it to the order.
- The order API resources show `tax_destination`.
- No settings UI for the destination yet.
- No backfill. The product is not released.

## Capabilities

### New Capabilities
- `order-tax-destination`: An order records which address its tax was calculated from.

### Modified Capabilities
- `tax-calculation-strategy`: A strategy decides and reports the address used for tax, and the address comes from the tax destination setting, with a store address fallback.

## Impact

- Database: `database/migrations/CreateOrdersTable.php` (squashed migrations, so edit the create file).
- Tax: `app/Tax/Strategies/AbstractTaxStrategy.php`, `app/Tax/TaxStrategyFactory.php`, `app/Supports/Tax.php` (setting and store address readers), `app/DTO/Tax/TaxCalculationContextDTO.php`, `app/DTO/Tax/TaxCalculationResultDTO.php`.
- Calculation: `app/Actions/Cart/RecalculateCartAction.php`, `app/DTO/Calculation/CalculationResultDTO.php`.
- Orders: `app/Actions/Order/CreateOrderAction.php`, `app/Actions/Order/UpdateOrderAction.php`, order DTOs, `app/Models/Order.php`, order resources, `app/Constants/Order/` (new constants class).
- Docs: the order and tax docs under `docs/`.
- No frontend change is required.
