## 1. PayPal webhook verification

Groups 1 to 7 touch disjoint files and can run as parallel sub-agents; group 8 runs after all of them.

- [x] 1.1 In `PayPal::webhook()`, read the `PAYPAL-AUTH-ALGO`, `PAYPAL-CERT-URL`, `PAYPAL-TRANSMISSION-ID`, `PAYPAL-TRANSMISSION-SIG` and `PAYPAL-TRANSMISSION-TIME` headers through `Superglobals::server()` (never `$_SERVER`)
- [x] 1.2 Add a protected method that calls `POST {base}/v1/notifications/verify-webhook-signature` with those headers, the configured `webhook_id` and the decoded event, using the existing access-token flow, and returns true only for `verification_status` `SUCCESS`
- [x] 1.3 Call it at the top of `webhook()` before the event switch; return `false` for missing headers, empty Webhook ID, failed call or non-success status. Leave the event handlers unchanged. Update docblocks so `phpcs:docblocks` passes
- [x] 1.4 Confirm the buyer-return capture path (`handle_return`) does not depend on the webhook, so a rejected webhook does not lose an order; record the answer in design.md's open question (premise was wrong: PayPal has no buyer-return capture, so capture and paid marking depend on the webhook; design.md risks corrected)
- [x] 1.5 Tests: missing headers, empty Webhook ID, failed verification call and non-success status are all rejected with no order change; a verified `PAYMENT.CAPTURE.COMPLETED` marks the order paid. Use a unit test if the HTTP client can be faked in the lightweight container, otherwise an integration test
- [x] 1.6 Search `docs/` and admin field text for PayPal Webhook ID guidance; update if it describes the field as optional
- [x] 1.7 Verify: `php -l` on edited files, `composer phpcs:docblocks`, `composer phpcs:wporg`, `composer test:unit`

## 2. Customer delete-all filters

- [x] 2.1 In `CustomerController::bulk_actions`, build the `DELETE_ALL` filter with `CustomerListFilterDTO::from_array($request->all())`, as `index` does
- [x] 2.2 Integration test in `tests/Integration/CustomerApiTest.php`: with customers in two countries, delete-all filtered by one country deletes only those; with country and city both apply; with no filters all are deleted
- [x] 2.3 Verify: `php -l`, `composer phpcs:docblocks`, `composer phpcs:wporg`, `composer test:unit`

## 3. One base currency

- [x] 3.1 Remove the dead `if ($data->is_base && !$currency->is_base) { CurrencyExchange::sync(); }` block from `CurrencyService::update()` (already done in the working tree)
- [x] 3.2 Remove the now-unused `use Kirki\Ecommerce\App\Facades\CurrencyExchange;` import from `CurrencyService.php`
- [x] 3.3 In `CurrencyService::update()`, capture `$was_base` before saving; when the request sets `is_base` on a currency that was not base, demote all other currencies and save the new base in one transaction; when it clears `is_base` on the current base, keep it as base; update the docblock
- [x] 3.4 Give `CurrencyService::create()` the same demotion when a currency is created as base; check the callers of `insert()` and enforce there too if it can receive API input
- [x] 3.5 Integration tests in `tests/Integration/CurrencyApiTest.php`: a single-row request setting a new base leaves exactly one base; a whole-list request leaves exactly one base with the old base first and again with the new base first; a request clearing the only base leaves it as base; creating a currency as base leaves exactly one base (also replaced the random currency-code helper in CurrencyApiTest with a counter: two random characters collided with committed rows and made the suite fail intermittently)
- [x] 3.6 Verify: `php -l`, `composer phpcs:docblocks`, `composer phpcs:wporg`, `composer test:unit`

## 4. Rollback method name

- [x] 4.1 Replace `DB::roll_back()` with `DB::rollback()` in `VariantService::bulk_update` and `CustomerService::delete_all` (already applied and staged in the working tree for both files; a search of `app/` finds no `roll_back` left, nothing to do)
- [x] 4.2 Integration test: a bulk variant update where a later variant cannot be updated returns the "could not be updated" error, not a server error, and keeps none of the earlier changes (the test showed the failure still returned HTTP 500, so `bulk_update` now throws with `Response::NOT_FOUND`; the failure is simulated because `update_variant()` never returns false through the API)
- [x] 4.3 Verify: `php -l`, `composer phpcs:docblocks`, `composer phpcs:wporg`, `composer test:unit`

## 5. Settings response isolation

- [x] 5.1 Add the missing `break;` after the `CURRENCY_SETTINGS` case in `SettingResource::to_array()` (already applied and staged in the working tree; verified in the diff, nothing to do)
- [x] 5.2 Integration test in `tests/Integration/SettingsApiTest.php`: currency settings response has no `default_template` or `customer_emails`; email settings response still has the resolved logo and the order confirmation shortcodes
- [x] 5.3 Verify: `php -l`, `composer phpcs:docblocks`, `composer phpcs:wporg`, `composer test:unit`

## 6. Guest-order merge last name

- [x] 6.1 In `OrderService::merge_guest_orders`, set `last_name` from `$user->get_last_name()` (already applied and staged in the working tree; verified in the diff, nothing to do)
- [x] 6.2 Test: a user with first and last name gets a customer with both; a user without a last name gets an empty last name; an existing customer is reused
- [x] 6.3 Verify: `php -l`, `composer phpcs:docblocks`, `composer phpcs:wporg`, `composer test:unit`

## 7. Admin product list price

- [x] 7.1 In `ProductListResource`, add a protected method returning the variant with the lowest effective price (sale when `> 0` and below regular, else regular), with a docblock
- [x] 7.2 Use it in `to_array()` for regular price, sale price and the money objects, replacing the two `min()` calls; leave the no-variants behavior as it is today
- [x] 7.3 Unit tests (model on `CartResourceCouponFormattingTest`): cheapest variant on sale, a non-cheapest variant on sale, no sale anywhere, single variant
- [x] 7.4 Verify: `php -l`, `composer phpcs:docblocks`, `composer phpcs:wporg`, `composer test:unit`

## 8. Final gate (after groups 1 to 7)

- [x] 8.1 `php -l` on every changed file and confirm `git status` shows only the files named in the proposal's Impact plus new tests
- [x] 8.2 `composer phpcs:docblocks` and `composer phpcs:wporg` pass on the whole tree
- [x] 8.3 `composer test:unit` passes
- [x] 8.4 Run the new integration tests with `composer test:docker:integration` if the environment is available; if not, say they were not run
- [x] 8.5 `openspec validate fix-confirmed-backend-bugs --strict` passes
- [x] 8.6 Report what changed, what was tested and what was not run. Do not commit or push; the user asks for that separately
