## 1. Pre-flight verification

- [x] 1.1 Grep `app/` and `database/` for raw `IS NULL` / `whereNull` / `is_null()` usage against the affected columns (`tags`, `product_data`, `tax_breakdown`, `schema`, `additional_info`, `seo_keywords`, `target_countries`, `combinations`, `flags`) to catch any code relying on the old `NULL`-for-empty-array behavior (see design.md - Decisions).
- [x] 1.2 Grep for `->flags` usage on `Order` to confirm nothing currently assumes `flags` never persists (design.md - Risks).
- [x] 1.3 Document any hits found and resolve or explicitly accept them before proceeding.
- [x] 1.4 Verification: `bash bin/phpunit --testdox` passes on current `main` (baseline, no code changes yet).

## 2. Remove broken JSON mutators

- [x] 2.1 Remove `Customer::set_tags_attribute()` from `app/Models/Customer.php`.
- [x] 2.2 Remove `OrderItem::set_product_data_attribute()` and `OrderItem::set_tax_breakdown_attribute()` from `app/Models/OrderItem.php`.
- [x] 2.3 Remove `ProductSchema::set_schema_attribute()` from `app/Models/ProductSchema.php`.
- [x] 2.4 Confirm each field's `'json'` cast entry is still present in `$casts` on the respective model (no changes needed there, just verifying nothing else relied on the mutator existing).
- [x] 2.5 Verification: `bash bin/phpunit --testdox` passes; `npm run typecheck && npm test` (from `resources/app/`) passes.

## 3. Remove redundant (working) JSON mutators

- [x] 3.1 Remove `Product::set_additional_info_attribute()` and `Product::set_seo_keywords_attribute()` from `app/Models/Product.php`.
- [x] 3.2 Remove `Coupon::set_target_countries_attribute()` and `Coupon::set_combinations_attribute()` from `app/Models/Coupon.php`.
- [x] 3.3 Confirm `Coupon::set_start_datetime_attribute()` / `set_end_datetime_attribute()` are left untouched.
- [x] 3.4 Verification: `bash bin/phpunit --testdox` passes; `npm run typecheck && npm test` (from `resources/app/`) passes.

## 4. Fix Order::flags mutator

- [x] 4.1 In `app/Models/Order.php`, change `set_flags_attribute()` to assign its computed value to `$this->attributes['flags']` instead of returning it (mirror the working pattern in `Product`/`Coupon`'s mutators before their removal, e.g. `$this->attributes['flags'] = ...`).
- [x] 4.2 Confirm `get_flags_attribute()` (the paired accessor) needs no changes.
- [x] 4.3 Verification: `bash bin/phpunit --testdox` passes; `npm run typecheck && npm test` (from `resources/app/`) passes.

## 5. Test coverage

- [x] 5.1 Add/extend integration tests asserting array values persist and round-trip through create/update for: `Customer.tags`, `OrderItem.product_data`, `OrderItem.tax_breakdown`, `ProductSchema.schema`, `Product.additional_info`, `Product.seo_keywords`, `Coupon.target_countries`, `Coupon.combinations` (extend `tests/Integration/CustomerApiTest.php`, `tests/Integration/CouponApiTest.php`, and add coverage for `OrderItem`/`ProductSchema`/`Product` alongside existing integration tests for those models, following the existing test conventions in `tests/Integration/`).
- [x] 5.2 Add a test asserting an empty array (`[]`) assignment persists and reads back as `[]` for at least one of the fields above (covers the `NULL` → `"[]"` behavior delta from design.md).
- [x] 5.3 Add/extend a test asserting `Order.flags` persists a non-empty array on create and reads back correctly, and that clearing it (`[]`/`null`) persists as `null`. Discovered a separate pre-existing bug in `Model::offsetExists()`/`Resource::__get()` along the way (see design.md - Correction during implementation) — the "clears flags" test asserts DB-level persistence rather than the API response shape because of it.
- [x] 5.4 Verification: `bash bin/phpunit --testdox` passes; `npm run typecheck && npm test` (from `resources/app/`) passes.

## 6. Final validation

- [x] 6.1 Run `openspec validate --change fix-broken-attribute-mutators --strict` and resolve any issues.
- [x] 6.2 Verification: `bash bin/phpunit --testdox` passes; `npm run typecheck && npm test` (from `resources/app/`) passes.
