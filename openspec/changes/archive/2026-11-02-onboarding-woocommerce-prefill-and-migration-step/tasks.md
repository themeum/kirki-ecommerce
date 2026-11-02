## 1. Defaults endpoint (PHP)

- [x] 1.1 Add the defaults reader class (uses `VersionProbe`, `SettingsReader`) with the industry map
- [x] 1.2 Add `GET /onboarding/defaults` controller method, route and admin middleware
- [x] 1.3 PHP integration tests: supported, unsupported, missing, empty industry, no country
- [x] 1.4 Run the PHP tests and phpcs (docker runner) and confirm they pass

## 2. Settings group (PHP)

- [x] 2.1 Remove currency, address and tax-switch saving and their snapshot/revert code
- [x] 2.2 Add units, checkout and review options per the design table, with notes for gaps
- [x] 2.3 Update revert to restore the new keys
- [x] 2.4 Update the group description text; update integration tests
- [x] 2.5 Run the PHP tests and phpcs and confirm they pass

## 3. Prefill in the wizard (React)

- [x] 3.1 Add `useOnboardingDefaultsQuery` service and schema
- [x] 3.2 Merge order defaults < prefill < draft; wait for the query; fall back on error
- [x] 3.3 Country: use WooCommerce value before browser detection
- [x] 3.4 Tests for the merge and payload of `onboarding-form`
- [x] 3.5 Run `npm run typecheck && npm test` in `resources/app/`

## 4. Rings and buttons (React)

- [x] 4.1 Add `ProgressRing` component and tests
- [x] 4.2 Use rings in `setup-complete-step`; add the Migrate row after Configurations
- [x] 4.3 Button rules: busy, failure, migration done, no migration
- [x] 4.4 Hide the sample data link by the same rules
- [x] 4.5 Run `npm run typecheck && npm test` in `resources/app/`

## 5. Automatic migration (React)

- [x] 5.1 Add `autoStart` mode to `MigrationFlow` and the runner start with all groups
- [x] 5.2 Wire the wizard: start after setup rows end; resume a saved run; remove Skip
- [x] 5.3 Top bar text "Migrating · message"; right label "Setup Complete"
- [x] 5.4 Migrate ring takes the real percent; failure shows Retry and Go to Dashboard
- [x] 5.5 Wizard tests for each button state
- [x] 5.6 Run `npm run typecheck && npm test` in `resources/app/`

## 6. Docs

- [x] 6.1 Update `docs/onboarding.md` and `docs/migration.md`, with a "Where this differs from WooCommerce" section
- [x] 6.2 Run the final typecheck, lint and tests

## 7. Replace rule (WooCommerce always wins)

- [x] 7.1 `SettingsGroup::save_option`: remove the "keep a different value" branch; set the WooCommerce value whenever it is not null
- [x] 7.2 Clear `tax_regions` and `shipping_zones` once in the store item (after the snapshot) when WooCommerce has rates or zones; keep them otherwise
- [x] 7.3 Update integration tests: replace over a changed value, keep when WooCommerce has none, list clear, revert restores the old lists
- [x] 7.4 Update `docs/migration.md` ("Settings are filled, not replaced" bullet, section 2 and "Where this differs") and the class docblock
- [x] 7.5 Run the PHP tests and phpcs, then `npm run typecheck && npm test`

## 8. Zone states and extra settings

- [x] 8.1 Add one helper that returns all state ids (strings) of a country; use it in `ShippingZonePresets::make_zone` and `ShippingZoneMapper::regions`
- [x] 8.2 Tests: preset zone and WooCommerce zone get all states; country without states stays empty
- [x] 8.3 `SettingsReader::store()` reads the extra options (store email, allowed countries, checkout fields, tax display, price format, email flags, footer, colors)
- [x] 8.4 `SettingsGroup` writes them with the replace rule, notes for unsupported values, and snapshots/reverts the general, currency and email groups
- [x] 8.5 Integration tests for each mapping, the hidden and unknown-value notes, and revert
- [x] 8.6 Update `docs/migration.md` (section 2 table, "Where this differs") and `docs/onboarding.md` for the zone states
- [x] 8.7 Run PHP tests and phpcs

## 9. Order number format

- [x] 9.1 `OrdersGroup::persist` builds `order_number` with `OrderNumberGenerator` (prefix, WooCommerce id padded to 6, suffix)
- [x] 9.2 Integration test for the prefix and suffix; update the existing order number assertion
- [x] 9.3 Update the Orders row in `docs/migration.md`

## 10. Top bar progress

- [x] 10.1 Shell: input steps fill `(step - 1) / (N + 1)`; the completion screen has no fixed full value
- [x] 10.2 Wizard: one bar percent for the completion screen (setup rows 10% and migration 90% with WooCommerce, setup rows 100% without) and the `Setting up · <row>` left text
- [x] 10.3 Update the shell and wizard tests and the progress text in `docs/onboarding.md`
- [x] 10.4 Run `npm run typecheck && npm test` in `resources/app/`

## 11. Remove the standalone migration

- [x] 11.1 Remove the `/migration/woo-commerce` route (`route-config.ts`, `routes.tsx`, `features/migration/routes.tsx`), the page and its test
- [x] 11.2 Remove the dashboard "Migrate from WooCommerce" button and its sources query from `home.tsx`; update the home tests
- [x] 11.3 Remove `MigrationFlow`, the scan, summary, revert and layout step components and their tests; remove the revert parts of `useMigrationRunner`, `services/migration.ts`, the schemas and `endpoints.ts`
- [x] 11.4 Backend: remove the revert routes and controller actions, `MigrationReverter`, `revert_record()` (contract and every group), the revert states of `RunStatus`, and the `SettingsGroup` snapshots
- [x] 11.5 Remove the revert tests (`WooCommerceRevertTest`, the revert parts of the settings group test and `FakeGroupMigrator`); keep the other group tests passing
- [x] 11.6 Update `docs/migration.md` and `docs/onboarding.md`: remove Revert and the standalone page, add a "Where this differs" note
- [x] 11.7 Run PHP tests and phpcs, then `npm run typecheck && npm run lint && npm test` in `resources/app/`

## 12. Row label and ledger cleanup

- [x] 12.1 Rename the last completion row to `<source label> Migration` in `onboarding-wizard.tsx`; update the wizard tests
- [x] 12.2 Add `MigrationRunner::clear_ledger(source)` and call it from the run controller when the last chunk is done; integration tests for done, failed and Retry
- [x] 12.3 Update `docs/migration.md` (ledger cleared, re-run risk) and `docs/onboarding.md` (row name)
- [x] 12.4 Run PHP tests and phpcs, then `npm run typecheck && npm run lint && npm test` in `resources/app/`
