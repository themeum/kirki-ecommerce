## 1. Backend: generalize address validation from fixed blocks to array items

- [x] 1.1 In `app/Concerns/ValidatesAddressFields.php`, add `address_item_field_rule(string $field)`: a closure reading the submitted row's own `country` (from the wildcard callback's row data, not a fixed block) and applying `AddressRules::is_required($country, $field)`, replacing the current `address_field_rule(string $country, string $field)` usage for array items.
- [x] 1.2 Add `required_when_address_item_present(string $field)`: a closure treating an `addresses.*` item as "present" once any other field on that same row is non-empty, mirroring the existing `required_when_address_present` style (do not use `required_if`/`required_unless` against a wildcard sibling — confirmed not to resolve per-row in this framework's validator). Also added `required_when_address_item_type()` to the trait (not originally listed) so create/update requests can share the "label required when type=others" closure the same way, instead of duplicating it in both request classes.
- [x] 1.3 Keep `state_required_message()` unchanged.

## 2. Backend: rewrite `CustomerCreateRequest` and `CustomerUpdateRequest` onto `addresses[]`

- [x] 2.1 `CustomerCreateRequest`: remove all `shipping_address`/`billing_address` rules, the `prepare_for_validation()` address-block coercion loop, their `filters()` entries, and the two now-superseded closure-builder methods.
- [x] 2.2 Add `addresses` rules: `'addresses' => 'array|nullable'`; per item `id` (nullable int), `first_name`/`email`/`phone`/`address_line1`/`city`/`country` via `required_when_address_item_present()`, `last_name`/`address_line2` nullable, `state`/`postal_code` via `address_item_field_rule()`, `type` (`in:home,office,others`), `label` (required-when-`others` via a closure, not `required_if`), `is_default_shipping`/`is_default_billing` (nullable boolean).
- [x] 2.3 Update `prepare_for_validation()` to loop `addresses` items (not two fixed keys), coercing `state`/`postal_code` to `''` when absent (NOT NULL columns).
- [x] 2.4 Add email uniqueness: `'email' => 'required|email|unique:' . Customer::get_table_name() . ',email'` — confirmed the `unique:table,column,ignore_id` syntax against `UniqueRule::table_column_and_ignore_id()` and existing Brand/Category/Tag update requests.
- [x] 2.5 Apply the same rewrite to `CustomerUpdateRequest`: `addresses` optional (`array|nullable`, not `required|array`), same per-item rules, `'email' => 'required|email|unique:' . Customer::get_table_name() . ',email,' . $this->int('id')` (self-excluding). Removed the `messages()` override entirely since its only two entries were the now-removed `shipping_address.state.required`/`billing_address.state.required` messages.
- [x] 2.6 Verification: `composer phpcs:wporg` on both changed request files — clean, exit 0.

## 3. Backend: `UpdateCustomerDTO` gains `addresses`

- [x] 3.1 Add `public $addresses = [];` (`UpdateAddressDTO[]`) to `app/DTO/Customer/UpdateCustomerDTO.php`. Do not add `user_id` (email stays immutable via this endpoint — see design.md D on email disabling).

## 4. Backend: extract shared default-resolution trait

- [x] 4.1 Create `app/Concerns/ResolvesAddressDefaults.php` with `resolve_addresses()`/`find_default()` moved out of `CreateCustomerAction`, unchanged in behavior.
- [x] 4.2 `CreateCustomerAction` `use`s the new trait instead of its own private methods; no behavior change (verify against `openspec/specs/customer-address-provisioning/spec.md`'s existing scenarios).

## 5. Backend: `CreateCustomerAction::create_user()` honors the three linking cases

- [x] 5.1 Rewrite `create_user()`: existing-`user_id` short-circuit unchanged; then `get_user_by('email', $customer->email)` — if found, return that user's ID (attach, case 2); then `if (empty($customer->create_wordpress_user)) { return null; }` (case 3, `Customer.user_id` is nullable); otherwise the existing `wp_insert_user()` block (case 1).
- [x] 5.2 Confirm the existing `is_wp_error($user_id)` handling stays as a defensive net (now unreachable specifically for a duplicate email, since that path no longer reaches `wp_insert_user()`).

## 6. Backend: `UpdateCustomerAction` full rewrite for address reconciliation

- [x] 6.1 Change `execute()` signature to `execute(UpdateCustomerDTO $customer_payload, array $address_payloads)` (`UpdateAddressDTO[]`).
- [x] 6.2 Implement reconciliation modeled on `app/Actions/Product/UpdateProductAction.php`'s variant handling: diff `$customer->addresses` current IDs against submitted IDs, `AddressService::bulk_delete()` what's missing, `update_without_transaction()` items with an `id`, `create_without_transaction(CreateAddressDTO::from_array($address->all()))` items without one.
- [x] 6.3 Run `resolve_addresses()` (from the shared trait) across the full submitted `$address_payloads` list before persisting any row, so defaults resolve the same way as creation.
- [x] 6.4 Keep the whole method inside the existing `DB::begin_transaction()`/`commit()`/`rollback()` block.

## 7. Backend: `CustomerService` changes

- [x] 7.1 Widen `Customer::with('billing_address', 'shipping_address')` to also eager-load `addresses` in both `find()` and `update()`.
- [x] 7.2 Remove the dead `if (!empty($data->user_id) && ...) { wp_update_user(...) }` block from `update()` (provably unreachable — `UpdateCustomerDTO` has no `user_id`).
- [x] 7.3 Add `find_by_email(string $email)`, mirroring `find_by_user_id()`.
- [x] 7.4 Add `sync_email_from_wordpress_user(int $user_id, string $email)`: looks up by `find_by_user_id()`, writes only the `email` column via a partial `update()`, no-ops if no matching customer.
- [x] 7.5 Add `attach_wordpress_user(string $email, int $user_id)`: looks up by `find_by_email()`, writes only the `user_id` column, no-ops if no matching customer OR the customer already has a `user_id` (never overwrite an existing link).

## 8. Backend: `CustomerController` call-shape updates

- [x] 8.1 `create()`: map `$validated['addresses']` through `array_map(fn($a) => CreateAddressDTO::from_array($a), ...)` before building `CreateCustomerDTO` (raw arrays would break `resolve_addresses()`'s object-property access).
- [x] 8.2 `update()`: build `UpdateCustomerDTO` plus `array_map(fn($a) => UpdateAddressDTO::from_array($a), $validated['addresses'] ?? [])`, call the new two-argument `execute()`.

## 9. Backend: `CustomerResource` output

- [x] 9.1 Replace `shipping_address`/`billing_address` keys with `'addresses' => ...`, reusing `app/Resources/Address/AddressResource.php` per item if it fits this shape (check its existing usage) rather than dumping raw model attributes.
- [x] 9.2 Add `accepts_marketing`, `notes`, `language` keys (existing `Customer` columns/DTO fields currently dropped by this resource).

## 10. Backend: the two WordPress sync hooks

- [x] 10.1 Create `app/Wordpress/Hooks/Actions/SyncCustomerEmailFromWordPressUser.php` (`BaseHook`): `get_name()` → `profile_update`, `get_type()` → `HookTypes::ACTION`, `get_args_count()` → `2` (BaseHook defaults to 1; `profile_update` fires `($user_id, $old_user_data)`), `handle()` compares the new email against `$old_user_data->user_email` and calls `CustomerService::sync_email_from_wordpress_user()` only when it changed. Added `WPHookNames::PROFILE_UPDATE`/`USER_REGISTER` constants to match the codebase's named-constant convention for hook strings.
- [x] 10.2 Create `app/Wordpress/Hooks/Actions/AttachCustomerToNewWordPressUser.php` (`BaseHook`): `get_name()` → `user_register`, `get_args_count()` → `1`, `handle()` looks up the new user's email and calls `CustomerService::attach_wordpress_user()`.
- [x] 10.3 Checked `Container::autowire()` (`vendor/libraries/framework/src/Container.php`): `make()`/`tagged()` resolve unbound classes via reflection-based constructor autowiring, so constructor injection of `CustomerService` works with no fallback needed.
- [x] 10.4 Register both classes in `config/hooks.php`'s `'actions'` array.
- [x] 10.5 Verification: `composer phpcs:wporg` on both new hook files and `config/hooks.php` — clean, exit 0.

## 11. Backend: test coverage and full verification

- [x] 11.1 Extend `tests/Integration/Actions/Customer/CreateCustomerActionTest.php` with `create_user()` cases: existing WP user by email → attached, no duplicate; no user + `create_wordpress_user=true` → new user created; no user + `create_wordpress_user=false` → `user_id` null.
- [x] 11.2 Add `tests/Integration/Actions/Customer/UpdateCustomerActionTest.php` (new, same `RestTestCase` base as the create test): update-in-place with `id`, create-without-`id`, delete-when-omitted-from-submitted-list, default resolution across the full post-reconciliation set.
- [x] 11.3 Extend `tests/Integration/CustomerApiTest.php`: duplicate email on create → 422 with a field error on `email`; duplicate email on update (different customer) → 422; own unchanged email on update → not rejected; `addresses.*` validation (missing required field on a touched row, `others` without `label`, country-conditional `state` missing). This required rewriting the whole file's `shipping_address`/`billing_address` payload shape and assertions onto `addresses[]`, since the old shape no longer validates at all.
- [x] 11.4 Added `tests/Integration/CustomerWordPressUserSyncTest.php`: real `wp_update_user()`/`factory()->user->create()` dispatch for the email-follows-user and new-user-attaches cases (this environment's Integration suite boots the full plugin against a real WP install, so the hooks are genuinely registered); the "don't overwrite an existing link" guard is exercised as a direct `CustomerService::attach_wordpress_user()` call instead, since WordPress itself refuses to create a second real user sharing an existing user's email.
- [x] 11.5 Run `composer phpcs:wporg` across every changed/new PHP file — clean, exit 0.
- [x] 11.6 Ran the dockerized suites (`kirki-test integration`, `composer test:unit`): 513/513 integration tests pass, 361/361 unit tests pass. One real bug surfaced and fixed along the way: an address submitted with no `type` failed with a DB "column cannot be null" 500 (`type` has no default coercion like `state`/`postal_code`); fixed by defaulting it to `home` in both requests' `prepare_for_validation()`.

## 12. Frontend: `customer-form.ts` schema changes

- [x] 12.1 Add `label: z.string().nullish().default('')` to `AddressFormShape`; change `type` to `z.enum(['home', 'office', 'others']).nullish().default('home')`.
- [x] 12.2 Add a `.superRefine` on the `addresses` array field in `CustomerFormShape`: skip a fully-blank row; for a touched row, require `first_name`/`email`/`phone`/`address_line1`/`city`/`country`, `state`/`postal_code` via `isAddressFieldRequired()` from `resources/app/libs/address-rules.ts`, and `label` when `type === 'others'`.
- [x] 12.3 Confirm the schema's `.transform()` still passes `addresses` through unchanged (no bespoke per-item mapping needed).
- [x] 12.4 Update `resources/app/features/customers/tests/schemas/forms/customer-form.test.ts`: blank row passes, partially-filled row fails on the touched fields, `others` without `label` fails, a country requiring `state` fails without it. Rewrote the whole file — it still tested the old `shipping_address`/`billing_address`/`is_billing_same_as_shipping` shape, which this schema had already moved off of before this session.
- [x] 12.5 Verification: `npm run typecheck && npm test` (from `resources/app/`) — both clean (1155/1155 tests pass) after fixing a fixture bug this task's own new test uncovered (SG's `postal_code` rule needed to be non-required to isolate the state-hidden assertion).

## 13. Frontend: catalog `customer.ts` schema changes

- [x] 13.1 `CustomerAddressSchema`: add `label`, widen `type` (keep the existing `z.union([enum, string])` pattern), add `is_default_shipping`/`is_default_billing`.
- [x] 13.2 `CustomerSchema`: remove `shipping_address`, `billing_address`, `is_billing_same_as_shipping`; add `addresses: z.array(CustomerAddressSchema).optional()`, `accepts_marketing`/`notes`/`language`.
- [x] 13.3 Verification: `npm run typecheck && npm test` (from `resources/app/`) — clean.

## 14. Frontend: `customer-basic-info.tsx`

- [x] 14.1 Add an optional `isNew` prop (default `true`); disable the `email` `TextField` when `!isNew`.
- [x] 14.2 Restore the `accepts_marketing` `CheckboxField` (present in `CustomerFormShape`, dropped from this new file).
- [x] 14.3 Gate the `create_wordpress_user` `CheckboxField` on `isNew`.
- [x] 14.4 Verification: `npm run typecheck && npm test` (from `resources/app/`) — clean.

## 15. Frontend: repeatable addresses list

- [x] 15.1 Rewrite `customer-address-card.tsx` (keep the file name and `CustomerAddressCard` barrel export) to render a `useFieldArray({ control, name: 'addresses' })` list instead of a single hardcoded billing card, following the `field.id`-keyed / separate-`useWatch` pattern from `resources/app/features/settings/tax/strategies/general/components/tax-state-rows.tsx`.
- [x] 15.2 Move the "Add new address" button (currently an inert placeholder in `customer-details.tsx`) into this component, wired to `append(...)` with sane defaults (`type: 'home'`).
- [x] 15.3 Create co-located `address-card-item.tsx` rendering, per index `i`: `RadioGroupField` for `addresses.${i}.type` (Home/Office/Other), a conditional `TextField` for `addresses.${i}.label` shown only when that row's type is `others`, `CountryField`/`StateField` (state needs `country={useWatch({ control, name: `addresses.${i}.country` })}` per row — fixes a pre-existing bug in the file being replaced), first/last name, address lines, city/state/postal/phone, `is_default_shipping`/`is_default_billing` checkboxes, and a remove button calling `remove(i)`.
- [x] 15.4 Implement default-checkbox mutual exclusivity: checking `is_default_shipping`/`is_default_billing` on one card unchecks the same flag on every other card via `update(j, { ...addresses[j], is_default_shipping: false })` (or billing), not `setValue`.
- [x] 15.5 Verification: `npm run typecheck && npm test` (from `resources/app/`) — clean.

## 16. Frontend: wire up `customer-details.tsx`

- [x] 16.1 Remove the orphaned standalone "Add address" button (now owned by `CustomerAddressCard`).
- [x] 16.2 Pass `<CustomerOverview isNew={isNew} />`.
- [x] 16.3 Verification: `npm run typecheck` passes clean across the whole project (see task 18.1 for the one pre-existing break it caught and fixed).

## 17. Frontend: confirm `add-customer-dialog.tsx` compatibility

- [x] 17.1 Confirm `add-customer-dialog.tsx` compiles and behaves correctly unchanged — `CustomerOverview`'s `isNew` prop defaults to `true`, `CustomerAddressCard` needs no new prop. Confirmed by reading the file and the passing project-wide typecheck; it imports both from the `@/features/customers` barrel, which already re-exports the rewritten components.
- [x] 17.2 Verification: `npm run typecheck && npm test` (from `resources/app/`) — both clean project-wide. Per this project's CLAUDE.md, browser-based verification was skipped; if visual confirmation of the new repeatable-addresses UI is wanted, that needs a manual check.

## 18. Frontend: fix an untracked `Customer.shipping_address`/`billing_address` consumer (not in original scope)

- [x] 18.1 `resources/app/features/orders/lib/customer-address.ts`'s `toOrderAddresses()` (used by `order-create/customer-card.tsx` to prefill the order form from a selected customer) read `customer.shipping_address`/`billing_address`/`is_billing_same_as_shipping`, which no longer exist on `Customer` after task 13.2 — `npm run typecheck` caught this as a compile error. Rewrote it to find the `is_default_shipping`/`is_default_billing` address in `customer.addresses`, and derive `is_billing_same_as_shipping` as "the same address won both defaults" (`shipping.id === billing.id`), which is the equivalent condition under the new model.

## 19. Post-review fixes from design/UX feedback (not in original scope)

- [x] 19.1 Reworked the address card UI to match the reference design: no per-address `CardHeader`, no per-address email field originally (later restored, de-emphasized, paired with phone), 3-column City/State/Zip row, stacked default checkboxes, `variant="link"` "Add new address" action. `accepts_marketing` hidden from `customer-basic-info.tsx` pending future design.
- [x] 19.2 Fixed a real bug: an untouched/default "Add new address" row (type defaults to `home`, no other fields filled) was being submitted and persisted as a near-blank address. `customer-form.ts`'s `AddressFormShape.country` is now unconditionally required (`required()`, not gated behind `isAddressRowTouched`) so a freshly-added row fails validation immediately until the user picks a country or removes the row — this also makes the earlier `isAddressRowTouched` payload-filter redundant (removed) since a row can no longer reach `.transform()` without a country.
- [x] 19.3 `email`/`phone` were removed from `ADDRESS_REQUIRED_FIELDS` in `customer-form.ts` (touched-row validation), matching the design's de-emphasis of per-address email/phone. Relaxed `addresses.*.email`/`addresses.*.phone` in `CustomerCreateRequest`/`CustomerUpdateRequest` from `required_when_address_item_present()` to plain `nullable|string` to match, avoiding a 422 the frontend would no longer warn about. `composer phpcs:wporg` clean; customer integration suite re-run to confirm no regression.
