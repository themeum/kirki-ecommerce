## 1. Single-variant REST surface

- [x] 1.1 Add `product_id` to `app/Resources/Variant/VariantResource.php::to_array()`
- [x] 1.2 Create `app/Http/Requests/Variant/UpdateVariantRequest.php`, mirroring `BulkUpdateVariantRequest` with the `variants.*` nesting removed: `prepare_for_validation()` converts `base_price`, `base_sale_price`, `base_cost_of_goods` major → minor via `Money::to_minor()`; same nullable rules for sku, media, money, unit, boolean, quantity and profile-id fields; `attribute_values` declared in `rules()` as `nullable|array` with integer members; `committed_quantity` not accepted
- [x] 1.3 Add `show($id)` to `VariantController` returning `VariantResource::make($this->variant_service->find($id))` — `find()` already throws `NotFoundException`
- [x] 1.4 Add `update(UpdateVariantRequest $request)` to `VariantController` — **corrected**: writes via `VariantService::partial_update()` with `$request->sanitized()`, not `UpdateVariantDTO`/`VariantService::update()`, which would clobber `product_id` and `is_default` with DTO defaults. See design.md — Corrections during implementation
- [x] 1.5 Register `GET /variants/{id}` and `PUT /variants/{id}` in `routes/api.php` below the existing `/variants/bulk` routes, each constrained with `->where('id', '[\\d]+')` as the coupon/product routes do — the constraint, not the ordering, is what makes `bulk` unmatchable
- [x] 1.6 Verify — 6 integration tests added to `tests/Integration/VariantApiTest.php`, all 270 integration tests pass (`composer test:docker:integration`); frontend 774 tests + typecheck clean. Note: repo has no phpcs config or binary, so PHP linting is `php -l` plus the integration suite. Covered: `PUT /variants/bulk` still reaches `bulk_update`; `GET /variants/{id}` returns `product_id`; `PUT /variants/{id}` with `base_price: 29.00` persists 2900 minor units; an unknown id returns not-found. Run the project's PHP lint over the changed files, then `npm run typecheck && npm test` from `resources/app/`

## 2. Shared unsaved-changes primitives

- [x] 2.1 Move `features/products/components/product-form/use-unsaved-navigation-guard.ts` to `resources/app/hooks/use-unsaved-navigation-guard.ts` and export it from `hooks/index.ts`
- [x] 2.2 Move `features/products/components/product-form/unsaved-toast.tsx` to `resources/app/components/unsaved-toast.tsx`
- [x] 2.3 Re-point the product form's two imports; change nothing else there
- [x] 2.4 Verify — **corrected**: `npx eslint .` does not pass on `main` either (17 pre-existing `simple-import-sort` / `consistent-type-imports` errors), so the bar is *no new errors*. Confirmed back at exactly the 17-error baseline, with the moved import hand-sorted rather than autofixed so unrelated debt was left alone. Feature-boundary rule holds — neither moved file imports `@/features/*`. Typecheck clean, 774 tests pass

## 3. Client routing and data access

- [x] 3.1 Add the `EditInventory: defineRoute('/:id')` child to `Inventory` in `config/route-config.ts`
- [x] 3.2 Add a `VARIANT` entry to `config/endpoints.ts` returning `/variants/<id>` for a given id, matching the `PRODUCT` / `COUPON` convention
- [x] 3.3 Add `lists()` and `detail(id)` to `features/inventory/services/query-keys.ts`, matching the products feature's factory
- [x] 3.4 Add `useVariantQuery(id)` (via `parseData(VariantSchema, …)`) and `useUpdateVariantMutation()` (via `parseResponse`) to `features/inventory/services/inventory.ts`, toasting with `toastMutationSuccess`/`toastMutationError` and invalidating `inventoryKeys.all`, `bulkEditKeys.all` and `productKeys.lists()` — copy the invalidation set from `features/bulk-edit/services/bulk-edit.ts`
- [x] 3.5 Export the new hooks from `features/inventory/index.ts`
- [x] 3.6 Verify — typecheck clean, 781 tests pass. Also added `product_id` to `VariantSchema` (the response schema) so the page can read it, and nested `list()` under `lists()` so the new `lists()` invalidation actually matches the list query

## 4. Variant form schema

- [x] 4.1 Create `features/inventory/schemas/forms/variant-form.ts` following `openspec/project.md`'s canonical pattern — `prepareFormSchema(VariantFormShape)` then a terminal `.transform()` naming every payload field explicitly, never a spread. Base the shape on `ProductFormVariantShape` minus `barcode`, `is_default` and `attribute_values`, with flat field names; carry over the `requiredWhen` sale-price-vs-regular-price rule; only keep a `.default()` where the product form already had one
- [x] 4.2 Write `features/inventory/tests/schemas/forms/variant-form.test.ts` covering the payload shape, the sale-price rule, and the null-normalising defaults
- [x] 4.3 Verify — 7 payload tests pass. Note: used `MoneyAmountSchema` from `@/schemas/shared/api` directly rather than `moneyAmount` from `schemas/forms/shared/validators.ts`, which `openspec/project.md` marks as deprecated scaffolding (no new usages)

## 5. Form sections

- [x] 5.1 **Not needed — premise wrong.** `BaseUnitDialog` uses its own local `useForm` and takes `data`/`onChange` props; it binds no product field names, so there is nothing to adapt. It is also already exported from the `@/features/products` barrel, so the page imports it rather than copying 190 lines verbatim
- [x] 5.2 Create `features/inventory/components/variant-form/sections/price.tsx` — regular and sale price, the unit-price row, charge-tax with its tax-profile reveal, and derived read-only profit and margin via `calculateProfit`. Currency symbol from `useAppConfig()`, falling back to `'$'`
- [x] 5.3 Create `sections/inventory.tsx` — track quantity, the Available / Committed (read-only) / low-stock-threshold grid when tracking is on, the stock-status select when it is off, SKU with its generator, sell-when-out-of-stock, and the limit-orders row. **No barcode field**
- [x] 5.4 Create `sections/shipping.tsx` — weight with unit, `ShippingBoxField` and shipping profile, importing from `@/features/settings` (barrel only)
- [x] 5.5 Create `sections/image.tsx` (`MediaField` bound to `media`) and `sections/visibility.tsx` (`SwitchField` bound to `is_visible`)
- [x] 5.6 Verify — no new lint errors (identical to the 17-error baseline); no `Controller` used outside the permitted directories (every binding goes through `components/form/*`); cross-feature imports are barrel-only (`@/features/products`, `@/features/settings`). Typecheck clean, 781 tests pass

## 6. The page

- [x] 6.1 Create `features/inventory/skeletons/edit-inventory-skeleton.tsx`, mirroring `collection-details-skeleton.tsx`
- [x] 6.2 Create `features/inventory/pages/edit-inventory.tsx` — `useParams()` → `useVariantQuery`, `useForm<VariantFormInput, unknown, VariantFormPayload>` seeded with `getDefaults`, hydrated with `pickFormValues(VariantFormSchema, variant, { max_per_order: … ?? 1, available_quantity: … ?? 0 })`, submitting through the update mutation with `applyServerErrors` on failure. 70/30 flex layout inside `<Form {...form}>` + `Container`, as in `product-form.tsx`
- [x] 6.3 Build the sticky `PageHeading` — back action, product name linking to `RouteConfig.Products.get('EditProduct')`, the `attribute_value_labels` line with a distinguished separator and a fallback when empty, a `…` menu holding "View on store", plus Cancel and Save
- [x] 6.4 Wire the unsaved-changes guard and toast with `message={__('Unsaved variant', 'kirki-ecommerce')}`
- [x] 6.5 Register the route in `features/inventory/routes.tsx` using the file's existing `withSuspense` helper
- [x] 6.6 Handle the not-found case so an unknown `:id` reports it rather than rendering an empty form
- [x] 6.7 Verify — typecheck clean, 781 tests pass. Two additions beyond the task text: `preview_url` added to `VariantResource` (constructor arg, mirroring `ProductResource`) and to `VariantSchema`, because 'View on store' had no URL to open; and the header renders the linked product name via `children` rather than `text`, since `PageHeading.text` is a plain string and cannot hold a link

## 7. Entry point from the listing

- [x] 7.1 Pass `onRowClick` to the `DataTable` in `features/inventory/components/inventory-table/inventory-table.tsx`, navigating to `RouteConfig.Inventory.get('EditInventory').buildLink({ id: item.id })`
- [x] 7.2 Confirmed — no change needed: `DataTable` already calls `event.stopPropagation()` on the select column's cell (`components/data-table/data-table.tsx:355`). Bulk-edit path untouched
- [x] 7.3 Verify — typecheck clean, 781 tests pass, lint at baseline

## 8. Close out

- [x] 8.1 Full pass — typecheck clean; 781 frontend tests pass; eslint identical to the 17-error `main` baseline; `php -l` clean on every changed PHP file; 270 PHP integration tests pass
- [x] 8.2 `openspec validate variant-edit-page --strict` — valid
- [x] 8.3 Six corrections recorded in `design.md` — the `UpdateVariantDTO` clobbering bug, the route constraint, `BaseUnitDialog` needing no copy, the `preview_url` addition, the `PageHeading.text` limitation, and the phpcs/eslint tooling assumptions
