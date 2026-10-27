## 1. Database

- [x] 1.1 Remove the `show_unit_price` column from `database/migrations/CreateVariantsTable.php`
- [x] 1.2 Add `database/migrations/DropShowUnitPriceFromVariantsTable.php` modelled on `DropIsBillingSameAsShippingFromCustomersTable`, with `down()` restoring `boolean('show_unit_price')->default(0)`
- [x] 1.3 Register the new migration at the end of the list in `config/migrations.php`
- [x] 1.4 Drop `show_unit_price` from `database/seeders/ProductSeeder.php` and `is_unit_price_visible` from `database/seeders/SettingsSeeder.php`

## 2. Backend model, DTOs and requests

- [x] 2.1 Remove the `show_unit_price` cast and fillable entry from `app/Models/Variant.php`
- [x] 2.2 Remove the property from `app/DTO/Variant/CreateVariantDTO.php` and `app/DTO/Variant/UpdateVariantDTO.php`
- [x] 2.3 Remove the validation rule and sanitizer entry from `ProductCreateRequest`, `ProductUpdateRequest`, `BulkUpdateVariantRequest` and `UpdateVariantRequest`
- [x] 2.4 Remove the `data.is_unit_price_visible` rule and sanitizer entry from `app/Http/Requests/Settings/SettingsUpdateRequest.php`

## 3. Display rule

- [x] 3.1 Delete the flag guard at the top of `app/Supports/UnitPrice.php::make()`, keeping every subsequent null-returning check and the unused `Settings` import removed with it
- [x] 3.2 Remove the `show_unit_price` key from `app/Resources/Variant/VariantResource.php`
- [x] 3.3 Remove the flag from the variant payload in `app/Hooks/Filters/PageInlineScript.php`
- [x] 3.4 Change `resources/views/site/shop/single.php` to guard on `selectedVariant?.display_unit_price` alone
- [x] 3.5 Run the PHP test suite and `composer phpcs:wporg` — phpcs: 0 errors; unit suite: 321 passed after removing `test_returns_null_when_unit_pricing_disabled` (the test for the removed requirement) and stripping the flags from `UnitPriceTest`, `VariantApiTest`, `SettingsApiTest` and a `TestCase` docblock. **Integration suite not run**: the WP test library is not installed in this environment (`composer test:docker:install` needed), so the two integration files edited here are unverified

## 4. Admin SPA

- [x] 4.1 Remove `show_unit_price` from `features/products/schemas/forms/variant-fields.ts`, both payload transforms (`product-form.ts`, `variant-form.ts`), `getDefaultVariantValues`, and `features/products/schemas/catalog/variant.ts`
- [x] 4.2 Stop seeding it in `features/products/pages/create-product.tsx`
- [x] 4.3 In the shared Price card, delete the `show_unit_price` `CheckboxField` and unwrap the `is_unit_price_visible` conditional so the base-price-per-unit row always renders; change nothing else about the card
- [x] 4.4 Remove the `show_unit_price` gate column, its `BulkEditGate` union member and the cell's `gatedBy` from `features/bulk-edit/lib/columns.tsx`, and the field from `features/bulk-edit/lib/payload.ts`
- [x] 4.5 Remove `is_unit_price_visible` from `features/settings/products/schemas/forms/products-settings-form.ts` and `resources/app/schemas/catalog/settings.ts`
- [x] 4.6 Remove the "Show unit price" switch block from `features/settings/products/pages/standard-unit.tsx` and reconcile the adjacent separators
- [x] 4.7 Update the tests in `features/{products,inventory,bulk-edit,settings}` that assert either flag — also had to wrap `bulk-edit-table.test.tsx`'s render in `AppConfigProvider`: ungating the unit-price cell makes `UnitPriceControl` mount on every row, and it calls `useBaseCurrencySymbol`, which the harness never provided. Pre-existing harness gap the gate was hiding; fixed with the same wrapping `shipping-settings.test.tsx` already uses

## 5. Verification

- [x] 5.1 `npm run typecheck` passes
- [x] 5.2 Lint passes on the changed files
- [x] 5.3 `npm test` in `resources/app/` passes
- [x] 5.4 `grep -rn "show_unit_price\|is_unit_price_visible"` over `app/`, `database/`, `config/`, `resources/views/` and `resources/app/` returns zero hits
- [x] 5.5 Confirm the storefront template and the inline-script payload agree — `display_unit_price` is the only thing the product page consults
