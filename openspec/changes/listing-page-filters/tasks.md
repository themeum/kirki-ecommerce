## 1. Shared draft hook

- [x] 1.1 Add `resources/app/hooks/use-filter-draft.ts` owning draft state seeded from `params` on open, `'all'`/empty → `undefined` resolution on apply, `appliedCount`, and `handleApply`/`handleClear` writing through `setParams`
- [x] 1.2 Export it from `resources/app/hooks/index.ts`
- [x] 1.3 Add `resources/app/hooks/use-filter-draft.test.ts` covering: draft edits do not change params until apply; dismiss discards the draft; reopening reseeds from params; a multi-valued control counts once; a default-valued control counts zero; clear removes only the governed filters

## 2. Products — fix the dead collection filter

- [x] 2.1 ~~Remove the unused `brand_ids` property from `ProductListFilterDTO`~~ — **premise was wrong**: `brand_ids` is live storefront code (shop page passes it as an array via `ShopPageFilterRequest` into the same DTO). Kept the DTO property and its `where_in` branch; the admin list simply stops sending the key, which is what made it bypass `ProductListRequest`
- [x] 2.2 Reconcile the `category_ids` contract in `ProductListRequest` — **this was a second, larger bug than the collection one**: the rule was `nullable|string`, so the array the frontend actually sends failed `StringRule` and the endpoint returned 422. Now `nullable|array` + `category_ids.*` integer, sanitized with `Sanitizer::ARRAY`/`INT`, and the `explode()` in `passed_validation()` is gone
- [x] 2.3 Change `resources/app/features/products/types.ts` to `brand_id?: number` / `collection_id?: number` scalars with number parsers, replacing the `parseNumberArray` entries
- [x] 2.4 Stop wrapping the selection in an array in `filter-popup/brand-filter.tsx` and `filter-popup/collection-filter.tsx`
- [x] 2.5 Migrate `features/products/components/product-table/filter-popup/filter-popup.tsx` onto `useFilterDraft`, dropping its local `EMPTY_FILTERS`/`appliedCount`/`handleApply`/`handleClear`, and remove the vestigial unused `onChange`/`buttonProps`/`data` props
- [x] 2.6 Added 7 integration cases to `ProductApiTest`. **Correction:** `collection_id` was never a no-op *server-side* — the server always honoured it; only the admin frontend sent the wrong key (`collection_ids`). The test locks the contract. `category_ids` genuinely 422'd before task 2.2

## 3. Inventory — wire the existing backend to a new overlay

- [x] 3.1 Add `InventoryListFilter` and its `ListFilterConfig` to `resources/app/features/inventory/types.ts` with `category_ids`, `brand_id`, `collection_id`, `inventory_type`, and add the missing `search: ''` default
- [x] 3.2 Widen `getInventory`/`useInventoryQuery` in `features/inventory/services/inventory.ts` from `ListQueryParams` to `ListParams<InventoryListFilter>`
- [x] 3.3 Added `features/inventory/components/inventory-table/filter-popup/` on `useFilterDraft`. Reuses the existing product category/collection/brand filter components rather than duplicating them (the precedent `select-products-dialog` already sets); only the two-option stock control is new
- [x] 3.4 Render the overlay from `inventory-table-filters.tsx` and pass `useDataTableParams<InventoryListFilter>(inventoryListOptions)` through `inventory-table.tsx`
- [x] 3.5 Added 5 integration cases to `VariantApiTest`. **Extra fix required:** `VariantListRequest` carried the same `category_ids` `nullable|string` + `explode()` bug as the product one, so the new inventory category filter would have 422'd; corrected the same way (verified red before green by stashing the fix)

## 4. Coupons — harden and migrate

- [x] 4.1 Add `app/Http/Requests/Coupon/CouponListRequest.php` with `in:` rules from `CouponStatus`, `CouponMethod` and `DiscountType`, and use it in `CouponController::get()`
- [x] 4.2 Migrate `features/coupons/components/coupon-table/filter-popup/filter-popup.tsx` onto `useFilterDraft`, deleting its local `resolveValue`
- [x] 4.3 Confirmed the option's value is `inactive` (= `CouponStatus::INACTIVE`); its **label** read "Inactive", so renamed it to "Not Active" to match the design
- [x] 4.4 Add integration coverage in `tests/Integration/CouponApiTest.php` for each derived status state, `method`, `discount_type`, and a 422 on an unrecognised status

## 5. Orders — mapped status and delivery method

- [x] 5.1 Add `Order::scope_apply_status_filter($status)` implementing the mapping table in `design.md`, modelled on `Coupon::scope_apply_status_filter()`
- [x] 5.2 Add a constants class for the merchant-facing order filter states so the request rules and the scope share one source
- [x] 5.3 Add `shipping_method` to `app/DTO/Order/OrderListFilterDTO.php`; route `status` through the new scope in `OrderService::list_query()` instead of `where('order_status', ...)`, and apply `where('shipping_method', ...)`
- [x] 5.4 Add `ShippingService::get_all_shipping_methods()` collecting enabled methods across all enabled zones, deduped by id
- [x] 5.5 Exposed the deduped methods as `{id, name, type}` via `ShippingMethodController` on `GET /shipping-methods`. **Note:** the framework cannot autowire `ShippingService` (its constructor takes an `array`), so the controller resolves it from the container the way `CartResource` already does, and every action needs a `Request` parameter
- [x] 5.6 Add `app/Http/Requests/Order/OrderListRequest.php` validating `status`, `payment_status` and `shipping_method`, and use it in `OrderController::get()`
- [x] 5.7 Replace the `fulfillment_status` control with the mapped status control in `features/orders/types.ts` and `order-table/filter-popup/filter-popup.tsx`, keep payment status, add delivery method, and migrate onto `useFilterDraft`
- [x] 5.8 Add a service + query key for the shipping-method options in `features/orders/services/`
- [x] 5.9 Add integration coverage in `tests/Integration/OrderApiTest.php`: each mapped status resolves to the right condition (including a shipped-and-unpaid order matching `order shipped`), `payment_status`, `shipping_method`, a status + payment combination, and a 422 on an unrecognised status

## 6. Customers — location filtering from scratch

- [x] 6.1 Add `app/DTO/Customer/CustomerListFilterDTO.php` extending `ListFilterDTO` with `country` and `city`
- [x] 6.2 Add `app/Http/Requests/Customer/CustomerListRequest.php` and switch `CustomerController::get()` from `ListFilterDTO` to the new DTO
- [x] 6.3 Apply `where_has('shipping_address', ...)` on `country` and `city` in `CustomerService::list_query()`
- [x] 6.4 Add a service method returning the distinct country/city pairs on customers' default shipping addresses, scoped by an optional country
- [x] 6.5 Expose it through a controller action and register the route alongside the existing `/customers` routes
- [x] 6.6 Add the filter config to `resources/app/features/customers/types.ts` and widen `services/customer.ts` to `ListParams<CustomerListFilter>`
- [x] 6.7 Add `features/customers/components/customer-table/filter-popup/` with country and city controls on `useFilterDraft`, city refetching on country change and clearing when the country clears or no longer contains it
- [x] 6.8 Render the overlay from `customer-table-filters.tsx`
- [x] 6.9 Added 6 integration cases to `CustomerApiTest`. **Note:** creating a customer through the API *always* writes a default shipping address, so the no-address case is reached by deleting the rows afterwards — which is the real-world path anyway. Also had to avoid the framework collection's `pluck()->unique()` (it assumes models and fatals on scalars), so `list_locations()` reduces in PHP

## 7. Docs and verification

- [x] 7.1 Extend `docs/data-table.md` §6 with the per-screen filter inventory and the `useFilterDraft` contract, noting that the refund status options may match nothing until refunds are implemented
- [x] 7.2 `cd resources/app && npm run typecheck` clean
- [x] 7.3 `cd resources/app && npm test` — new hook test green, `use-data-table-params.test.tsx` and `data-table.test.tsx` still green
- [x] 7.4 PHPUnit suite green, including every integration case added above
- [x] 7.5 ESLint clean on every touched TypeScript file; PHP has no PHPCS config in `composer.json`, so PHP was verified with `php -l` on each touched file
