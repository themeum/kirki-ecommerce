## 1. Database and constants

- [x] 1.1 Add `tax_destination` (string 20, nullable, comment lists `shipping, billing, store`) after `is_tax_inclusive` in `database/migrations/CreateOrdersTable.php`
- [x] 1.2 Add `app/Constants/Order/OrderTaxDestination.php` with `SHIPPING`, `BILLING`, `STORE`, in the style of `OrderTaxType`
- [x] 1.3 Verify: run `php -l` on edited files and the project phpcs rules, then `npm run typecheck && npm test` from `resources/app/`

## 2. Tax calculation

- [x] 2.1 Add `store_address` to `TaxCalculationContextDTO` and `tax_destination` to `TaxCalculationResultDTO`
- [x] 2.2 Make `TaxStrategyFactory::make()` and `Tax::get_tax_strategy()` take the country and a destination (default `shipping`). Build strategies from region settings and a destination, with no raw address. Add `address_for()` to `TaxCalculationContextDTO` and `tax_destination()` to `AbstractTaxStrategy`
- [x] 2.3 Make `DefaultTaxStrategy` and `EUTaxStrategy` read their tax address with `address_for()`, pass the real shipping and billing addresses to the rules, and set `tax_destination` on their result
- [x] 2.3a Make `EUTaxStrategy::tax_destination()` return `store` when the region is a micro business (one fixed country rate for the whole EU), and the received label otherwise
- [x] 2.4 Add `Tax::get_store_address()` and `Tax::get_tax_destination()` (reads `tax.tax_destination`, `shipping` when missing or unknown)
- [x] 2.5 Add `RecalculateCartAction::resolve_tax_destination()` (setting value, else `store` when that address has no country, else null). Build the tax context first, use the destination's country to get the strategy, pass `store_address` in `build_tax_context()`, and add `tax_destination` to `CalculationResultDTO` (null when no tax was calculated)
- [x] 2.6 Verify: run `php -l` on edited files and the project phpcs rules, then `npm run typecheck && npm test` from `resources/app/`

## 3. Orders

- [x] 3.1 Add `tax_destination` to the order create and update DTOs, and to the `Order` model fillable and casts if they exist
- [x] 3.2 Copy `tax_destination` from the calculation result to the order DTO in `CreateOrderAction` and `UpdateOrderAction`, next to `is_tax_inclusive`
- [x] 3.3 Add `tax_destination` to the admin and storefront `OrderResource` output
- [x] 3.4 Verify: run `php -l` on edited files and the project phpcs rules, then `npm run typecheck && npm test` from `resources/app/`

## 4. Docs

- [x] 4.1 Update the order and tax docs under `docs/` with the new field and the "shipping, then store" rule. Add a short note on how a country strategy reports another address
- [x] 4.2 Verify: run `npm run typecheck && npm test` from `resources/app/`
