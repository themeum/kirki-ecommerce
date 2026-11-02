# Tasks

## 1. Normalize the limit when a variant is saved

- [x] 1.1 In `Variant::save()` ([app/Models/Variant.php](app/Models/Variant.php)), before calling the parent, set `max_per_order` to 1 when `has_limit_per_order` is true and `max_per_order` is null or less than 1; leave it alone when the flag is false. Verify with the tests in 1.2.
- [x] 1.2 Add integration tests (next to `VariantApiTest` / `VariantBulkUpdateApiTest`) for: create with flag on and no value stores 1; create with flag on and 5 stores 5; product update with flag on and null stores 1; single (partial) update that only turns the flag on over a stored null stores 1; partial update that only turns the flag on over a stored 5 keeps 5; bulk update with flag on and null stores 1 (a 0 never reaches the model through the API after 2.1, so the 0 case is covered by a model-level test); flag off with null stays null; flag off with a stored 3 keeps 3; a duplicated product whose variant has the flag on keeps the flag with a maximum of 1. Verify with `composer test:integration`.
- [x] 1.3 Add an integration test through the cart: a variant saved with the limit on and no value accepts 1 unit in the cart and rejects the 2nd (use `CartApiTest`). Verify with `composer test:integration`.
- [x] 1.4 Run the WordPress.org-required PHPCS standards on the changed PHP files and verify there are no new errors. Run `npm run typecheck && npm test` in `resources/app/` and verify they still pass (no TypeScript change is expected).

## 2. Validation rules

- [x] 2.1 In `ProductCreateRequest`, `ProductUpdateRequest`, `BulkUpdateVariantRequest` (`variants.*.max_per_order`) and `UpdateVariantRequest` (`max_per_order`), set the rule to `integer|min:1|nullable` and remove `required_if` and `gte:0`. Verify by reading the four files.
- [x] 2.2 Add API tests: a payload with `max_per_order: 0` and one with `-2` get a validation error on the field for product create, product update, single update and bulk update; null and a missing value pass in all four. Verify with `composer test:integration`.
- [x] 2.3 Run PHPCS on the changed files, then `npm run typecheck && npm test` in `resources/app/`, and verify both pass.

## 3. Final check

- [x] 3.1 Run `composer test` (unit and integration) and `openspec validate default-max-per-order-to-one`, and verify both pass.
- [ ] 3.2 Ask the user to confirm in the admin UI (visual confirmation is not done in this project's agent sessions): tick "limit orders" with an empty field, save, reload, and see 1; untick, save, and add more than the old limit to the cart.
