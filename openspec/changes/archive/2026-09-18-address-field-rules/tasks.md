## 1. Capture the current behaviour first

- [x] 1.0 **Added during implementation.** `resources/site/` had no test infrastructure at all — no vitest, no `test` script, no `*.test.ts`, and CI only typechecks `resources/app`. Tasks 1.1/1.2/8.4 assumed a storefront suite that did not exist. Confirmed with the user, then added `vitest`, `vitest.config.ts` and `vitest.setup.ts` (stubbing `window.wp.i18n` and `window.kirki_ecommerce`) to `resources/site/`, mirroring `resources/app`.

- [x] 1.1 Add a Vitest case pinning today's `validateAddress()` behaviour for a country with subdivisions (state required) and one without (state not required), so the change in behaviour is visible in the diff rather than silent. Done in `resources/site/ts/components/checkout-address.test.ts` — 6 tests, including one pinning the unconditional postal-code requirement.
- [x] 1.2 Run `npm test` in `resources/app/` and the site test suite; confirm green before touching anything. Site: 6/6. App: 138 files / 1,141 tests. Both typecheck clean.

## 2. Import the rules

- [x] 2.1 Write `bin/import-address-rules.php`: fetch `https://chromium-i18n.appspot.com/ssl-address/data/<CC>` (follow redirects — the endpoint 302s) for every country code in `resources/data/countries.php`.
- [x] 2.2 Derive each country's rules: state is `hidden` when `%S` is absent from `fmt`, `required` when `%S` is present and `S` appears in `require`, otherwise `optional`; postal code likewise from `%Z` and `Z`. Then apply the deliberate override from design.md — a country with no `%S` but with subdivisions in `states.php` becomes `optional`, not `hidden`.
- [x] 2.3 Map `state_name_type` to a label key (`state`, `province`, `prefecture`, `emirate`, `county`, `area`, `department`, `island`, `parish`, `do_si`, …). Where upstream gives none, fall back to a generic `region`.
- [x] 2.4 Emit `resources/data/address-rules.php`, keyed by country code, same generated-file conventions as `countries.php` — but with a header stating the importer is re-runnable against a living upstream, not a one-time conversion.
- [x] 2.5 Handle countries libaddressinput does not cover: fall back to state `optional` if we hold subdivisions else `hidden`, postcode `optional`. Report the count in the importer's summary rather than failing.
- [x] 2.6 Run it. Sanity-check the spot cases. **Two corrections:**
  - My expectation that "FR and GB state hidden" contradicted task 2.2's own rule. Both hold subdivisions (FR 123, GB 247), so the deliberate deviation makes them `optional`, not `hidden`. The task list was internally inconsistent; 2.2 is right and the behaviour is correct.
  - libaddressinput supplies no `state_name_type` for 11 countries whose state field is required, so CA, IT and ES came out labelled "Region". Added `LABEL_OVERRIDES` for the six that genuinely use "province" (CA, CN, CR, ES, ID, IT), cross-checked against Shopify's `provinceKey`. The remaining five (SV, IQ, PG, SO, VN) are correctly "region".

  Final: state required=37 optional=172 hidden=41; postal_code required=74 optional=107 hidden=69. All 250 countries resolved from upstream, no fallbacks. The 69 hidden postcodes corroborate Shopify's 67.

## 3. Loader

- [x] 3.1 Add `app/Supports/AddressRules.php` mirroring `CountryData`: lazy `require` on first call, memoized in a protected static, `protected` not `private`, `static::` not `self::`, PHP 7.4.
- [x] 3.2 Expose `for_country(string $code)` returning that country's rules, and `all()`. Unknown code returns the same fallback as 2.5 rather than null, so no caller has to branch.
- [x] 3.3 Add a unit test asserting every country in `countries.php` has a rule entry and every rule maps to a real country — the two datasets must not drift apart.

## 4. Publish the rules

- [x] 4.1 `app/Hooks/Filters/PageInlineScript.php` — add the rules to the inline config for the checkout and account-addresses pages, alongside `countries`.
- [x] 4.2 Include the rules in the country API payload. Added to `CountryResource` (single-country reads). **Deliberately not added to `CountryListResource`:** nothing consumes it yet — this change only updates the storefront, and the admin list is fetched with `limit: -1`, so adding rules there would ship 21KB of unused data to every admin page. Revisit when admin address forms adopt the rules.
- [x] 4.3 Measured: `address_rules` is 21,294 bytes against the existing 234,983-byte countries payload — **9.1% growth**, which is more than "small". Accepted as proportionate to fixing a checkout bug, and the verbose shape is kept for readability. Flagged for the deferred inline-payload change: once that cuts countries to ~20KB, these rules become a comparable share and will want a compact encoding.

## 5. Storefront rendering and validation

- [x] 5.1 `resources/site/ts/components/checkout-address.ts` — `validateAddress()` takes the country's rules and requires state/postcode only when marked required. Delete the `states.length > 0` heuristic at line 153.
- [x] 5.2 ~~`state-field.ts` — render nothing when the state rule is hidden.~~ **Premise was wrong.** `stateField` is registered in `index.ts` (`Alpine.data('stateField', stateField)`) but **no view mounts it** — the address forms are driven by `checkout()` and the address-modal composable instead. I added `isVisible`/`label` to it, found nothing consumed them, and reverted the file to untouched rather than ship dead code. The hidden-field behaviour is delivered by 5.3 through `shippingRule`/`billingRule`/`addressRule`.

  Flagging, not fixing: `stateField` looks like pre-existing dead code — registered but unmounted. Out of scope for this change.
- [x] 5.3 Update `resources/views/site/checkout/parts/{shipping,billing}-form.php` and `resources/views/site/account/parts/address-form.php`: conditional state and postcode fields, label driven by the rule, initial visibility server-rendered for the preselected country so there is no flash of the wrong fields.
- [x] 5.4 Verify switching country updates fields, labels and required-ness. Covered by the `switching country` tests. **Found and fixed a real gap:** `onShippingCountryChange`/`onBillingCountryChange` already cleared `state` on country change, but not `postal_code` — so switching GB → AE carried a stale postcode into a country that has none, which the spec forbids ("a hidden field SHALL NOT be submitted"). Both handlers now clear it when the new country hides the field.
- [x] 5.5 No browser preview used, per CLAUDE.md §0 (a PostToolUse hook suggested one; the project instruction overrides it). Covered by 14 site tests + 8 PHP tests. **Visual confirmation is yours to do** — in particular that the fields actually disappear rather than leaving a gap in the layout, which a unit test cannot see.

## 6. Server-side alignment (separable — can be dropped)

- [x] 6.1 `app/Http/Requests/Account/AddressCreateRequest.php` and `AddressUpdateRequest.php` — make `state` and `postal_code` conditionally required on the submitted country instead of always `nullable|string`.
- [x] 6.2 Error messages use the country's own term ("Prefecture is required"), not a generic "State is required".
- [x] 6.3 Integration tests: required-state country with state omitted is rejected; hidden-state country with state omitted is accepted; hidden-postcode country with postcode omitted is accepted.
- [x] 6.4 Group was **not** dropped — server and client now agree. **Two findings while wiring it:**
  - `postal_code` was `required|string` server-side (only `state` was `nullable`), so the no-postcode-country half of the bug existed on the server too, not just the client.
  - Relaxing validation exposed a pre-existing NOT NULL constraint: `addresses.state` and `addresses.postal_code` are non-nullable, and an omitted field now reached the DB as `null` (500). Fixed by defaulting absent values to `''` in `prepare_for_validation()` rather than widening the schema — `''` is what every existing row already holds, so there is one representation of "no subdivision" instead of two. That hook is the correct seam because the DTO reads `sanitized()`, which is built before `passed_validation()`; it is safe because the validator treats `''` as missing, so a required field still fails.

## 7. Don't break what exists

- [x] 7.1 Confirm an address stored with a state for a now-hidden country still loads, displays and can be re-saved without losing the value. **Worth knowing:** all 41 hidden-state countries have zero subdivisions, because the optional-not-hidden deviation means any country with data becomes `optional`. So this case is only reachable from an older row or a direct write, never from the UI. Covered anyway (`test_a_stored_subdivision_survives_for_a_country_that_hides_the_field`) plus the realistic variant on an `optional` country.
- [x] 7.2 Confirm `tests/Integration/AddressApiTest.php` still passes. It does, **unmodified** — its payloads all use US addresses, which still require both fields. No existing expectation needed changing.
- [x] 7.3 Confirm the country dataset itself is untouched: `git diff --stat -- resources/data/countries.php resources/data/states.php` must be empty.
- [x] 7.4 Confirm tax and shipping still resolve by country code — `app/Tax/TaxStrategyFactory.php` uses `is_eu_by_code()`, so it should be unaffected; verify rather than assume.

## 8. Final gates

- [x] 8.1 Unit: 314 tests / 7,086 assertions. Integration: 460 tests / 9,813 assertions (up from 454 — the six new ones). **Note:** an earlier integration run reported 12 errors / 33 failures; that was my own fault for running a filtered suite concurrently against the same `kirki_ecommerce_test` database, not a regression. A clean serial run is green.
- [x] 8.2 `composer phpcs:wporg` passes.
- [x] 8.3 `npm run typecheck:app` passes.
- [x] 8.4 `resources/app`: 138 files / 1,141 tests. `resources/site`: 14 tests (new suite). Both typecheck clean. Added a `storefront-tests` CI job so the new suite is enforced rather than left to rot.
- [x] 8.5 Re-read the final diff; every changed line traces to this change.
