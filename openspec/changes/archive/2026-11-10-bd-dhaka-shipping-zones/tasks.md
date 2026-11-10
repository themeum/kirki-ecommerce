## 1. BD state list

- [x] 1.1 In `resources/data/states.php`, BD list: delete entries `807` (Barisal Division) and `758` (Mymensingh Division)
- [x] 1.2 In the same list, remove the " District" suffix from the 61 remaining names (for example `Dhaka District` → `Dhaka`, `Rangamati Hill District` → `Rangamati Hill`); keep every ID
- [x] 1.3 In `database/seeders/SettingsSeeder.php` (BD tax state `771`), change `"Dhaka District"` → `"Dhaka"`
- [x] 1.4 Verify: `bash bin/phpunit --testsuite Integration --filter 'StorePresetsTest|LocalPresetSourceTest'` passes, and `npm run typecheck && npm test` (from `resources/app/`) passes — note: `bin/phpunit` exits silently with no WordPress test install; the integration suite runs with `bash kirki-ecommerce-test integration --filter='StorePresetsTest|LocalPresetSourceTest'` (Docker)

## 2. Zone builder

- [x] 2.1 In `app/Setup/Presets/Local/ShippingZoneBuilder.php`, `make_methods()`: add parameter `array $country_methods` and use it in place of the internal `get_country(...)['shipping'][$kind]` lookup; update its docblock
- [x] 2.2 Add `protected function get_zone_states(string $country_code, array $zone)`: `states` → its keys as strings; `exclude_states` → `CountryData::state_ids()` minus its keys (as strings), reindexed; full docblock with `@since 1.0.0`
- [x] 2.3 In `build()`: for kind `domestic`, when `$country['shipping']['domestic_zones']` is not empty, add one zone for each entry (`title`, `is_enabled` true, one region with the store country and `get_zone_states()`, `methods` from `make_methods($context, 'domestic', $templates, $entry['methods'] ?? [])`); otherwise keep the current zone, and pass `$country['shipping'][$kind] ?? []`
- [x] 2.4 Verify: `composer phpcs:wporg` shows no new violations, the integration filter from 1.4 passes, and `npm run typecheck && npm test` (from `resources/app/`) passes

## 3. BD preset data

- [x] 3.1 In `resources/data/preconfigured-data/presets.json`, BD entry: add `shipping.domestic_zones` with "Inside Dhaka" (`states` `{"771": "Dhaka"}`, methods = copy of the 3 BD `domestic` methods) and "Outside Dhaka" (`exclude_states` `{"771": "Dhaka"}`, one Standard Delivery flat-rate method, `base_amount` 18000, `is_taxable` false)
- [x] 3.2 Remove the BD `shipping.regional` and `shipping.domestic` lists — correction: first `domestic` was kept for older plugin versions; removed because backward compatibility is not needed (see design.md)
- [x] 3.3 Verify: `npm run check:presets` passes, and `npm run typecheck && npm test` (from `resources/app/`) passes — note: `check:presets` reports 352 problems, all "image ... is not in the images folder" (no `images/` folders in this checkout); 0 data problems

## 4. Tests

- [x] 4.1 In `tests/Integration/StorePresetsTest.php`, change `test_country_without_bloc_gets_only_the_domestic_zone` from BD/BDT to AU/AUD
- [x] 4.2 Add `test_bangladesh_store_gets_inside_and_outside_dhaka_zones` (BD, BDT): titles `['Inside Dhaka', 'Outside Dhaka']`; zone 0 states `['771']`; zone 1 has 60 states, no `771`, all in `CountryData::state_ids('BD')`; Inside Dhaka methods Standard Delivery 12000, Express Delivery 20000, Local Pickup, all enabled; Outside Dhaka method Standard Delivery 18000, enabled
- [x] 4.3 Add a test for BD with USD: both zones exist, all methods disabled, and flat-rate methods have `base_amount` 0
- [x] 4.4 Add a test: BD with an industry that has a domestic rule (for example `food-beverage-and-gourmet`, Frozen disables the domestic Standard method). The rule is on Standard Delivery in both zones — also asserts the regional Perishable rule is on neither zone
- [x] 4.5 Verify: `bash bin/phpunit --testsuite Integration --filter 'StorePresetsTest|LocalPresetSourceTest'` passes, and `npm run typecheck && npm test` (from `resources/app/`) passes

## 5. Docs

- [x] 5.1 `docs/onboarding.md`: in the `countries.<ISO2>` row (§4.3), add `domestic_zones`. In the Shipping zones row (§4.4), add that a country with `domestic_zones` gets those zones in place of *Domestic* (Bangladesh: *Inside Dhaka*, *Outside Dhaka*)
- [x] 5.2 `docs/preset-data.md` §3: add a short paragraph and a JSON example for `domestic_zones` (`states` / `exclude_states` as ID → name maps with the name only for readability, inline `methods`, rules match as `domestic`, old plugins read `domestic`)
- [x] 5.3 Verify: the docs agree with the BD data and with the spec delta, and `npm run typecheck && npm test` (from `resources/app/`) passes

## 6. Publish

- [x] 6.1 After the merge, run `npm run publish:presets` so that stores get the new BD zones (needs AWS credentials; the user runs it)
