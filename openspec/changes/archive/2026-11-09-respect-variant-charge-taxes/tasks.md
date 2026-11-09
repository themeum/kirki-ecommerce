# Tasks

## 1. Calculation item flag

- [x] 1.1 Add `public $charge_taxes = true;` with a `@var bool` docblock to `CalculationItemDTO`. Verify the existing `RecalculateCartActionTest` cases still pass (`composer test:unit`), because the default keeps the old behavior.
- [x] 1.2 In `CalculationContextDTO::from_cart()`, set `$item_dto->charge_taxes = $variant->charge_taxes;` with no cast. Verify with a unit test that a cart item built from a variant with `charge_taxes` off has `charge_taxes === false`.
- [x] 1.3 In `OrderCalculationContextService::build_new_item()`, set `$item_dto->charge_taxes = $variant->charge_taxes;` with no cast. Leave `build_existing_item()` unchanged. Verify with a unit test: a new line for a variant with `charge_taxes` off gets `false`, and an existing line keeps `true`.

## 2. Skip untaxed items in the tax engine input

- [x] 2.1 In `RecalculateCartAction::build_tax_context()`, skip items where `!$item->charge_taxes` with an early `continue`. Verify with `RecalculateCartActionTest` cases:
  - an item with the flag off has zero tax and no tax lines;
  - an item with the flag on is taxed as before;
  - a cart with one taxed and one untaxed item taxes only the first item;
  - tax calculation off gives zero tax whatever the flag.
- [x] 2.2 Add tax-inclusive cases to `RecalculateCartActionTest`. Verify that an untaxed item has subtotal, total and catalog price all equal to its price, for example 110.00 stays 110.00 with tax 0.00.
- [x] 2.3 Add shipping cases to `RecalculateCartActionTest`. Verify that:
  - with the Default strategy, shipping tax is the same with a taxed or an untaxed item;
  - with the EU strategy, shipping tax is shared only across the taxed items;
  - with the EU strategy and only untaxed items, shipping uses the plain member-country rate.
- [x] 2.4 Add order-edit cases to `RecalculateCartActionTest` using `StoredOrderTermsDTO`. Verify that:
  - a stored taxed line keeps its tax when its flag is `true`;
  - a stored untaxed line (empty rate list) stays untaxed;
  - a new line with the flag off next to a stored taxed line has no tax and the stored line is unchanged.

## 3. Variant DTO default

- [x] 3.1 In `CreateVariantDTO` and `UpdateVariantDTO`, change the `charge_taxes` default from `false` to `true`. Verify with a unit test that `from_array([])` gives `true` and `from_array(['charge_taxes' => false])` gives `false`, for both DTOs.
- [x] 3.2 Verify the 11 tax integration tests that failed now pass (`composer test:docker:integration` or `bash kirki-ecommerce-test integration`). Only the unrelated `ProductHeadMetaTest` failure may remain.

## 4. Docs and final checks

- [x] 4.1 In `docs/order-data-and-calculations.md`, change the `charge_taxes` row of the variant table to "Yes", and mark gap G9 as **Fixed** in the style of G1 to G3. Add the shipping note from design D4. Verify that no other part of the document still says `charge_taxes` is unused (search for `charge_taxes`).
- [x] 4.2 Run `composer test:unit`, `composer test:integration` and `composer phpcs:wporg`. Verify that all pass with no new warnings in the changed files. (Result: unit 880 pass; integration 1483 of 1484 pass, and the one failure, `ProductHeadMetaTest` 29.99 vs '29.99', also fails without this change; PHPCS clean on the changed files.)
- [x] 4.3 Run `npm run typecheck && npm test` in `resources/app/` as the project regression check. No frontend file changes in this change, so verify that the results equal the results before the change.
