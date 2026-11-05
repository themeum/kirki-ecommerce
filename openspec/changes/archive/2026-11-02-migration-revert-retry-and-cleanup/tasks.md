## 1. Cleanups with no behavior change

- [x] 1.1 Rename `kirki_id` and similar `kirki` identifiers to `kirki_ecommerce_id` forms in `app/Migration`, the ledger/links table, models and tests
- [x] 1.2 Replace the `include` in `MigrationServiceProvider::boot()` with `use_routing()` and confirm the 6 routes still resolve
- [x] 1.3 Translate the `LogicException` messages in `WooCommerceGroup` with `esc_html__()`
- [x] 1.4 Replace `+=` array merges in `CouponMapper` with `array_merge()`
- [x] 1.5 Add `WooCommerceOrderStatus` constants and use them in `OrderMapper::statuses()`
- [x] 1.6 Verify: run the migration integration tests, `phpcs` on `app/Migration`, and `composer phpcs:wporg`

## 2. Rename IdMap to RecordLedger

- [x] 2.1 Rename `Core/IdMap` to `Core/RecordLedger` and update every use (groups, mappers, runner, tests, support classes)
- [x] 2.2 Rename model to `MigrationRecordLedger` and the create class and table to `migration_record_ledger`, adding `origin` and `previous_value` columns
- [x] 2.3 Record `origin` (created or reused) in `AbstractGroupMigrator` when a link is saved
- [x] 2.4 Update `docs/migration.md` for the new name
- [x] 2.5 Verify: run the migration integration tests and `phpcs`

## 3. Revert backend

- [x] 3.1 Add `reverting` and `reverted` to `RunStatus` and a `revert_state` column to the runs table
- [x] 3.2 Save the old value of each changed setting in `SettingsGroup` through the ledger
- [x] 3.3 Add per-entity deleters in `Sources/WooCommerce` with the "in use" check (products, variants, customers, coupons, categories, tags, attributes, orders)
- [x] 3.4 Add `MigrationReverter` that removes `created` rows in reverse group order in chunks, restores settings, counts kept rows, and on finish marks the run `reverted` and clears its ledger rows
- [x] 3.5 Add `POST /migration/runs/{id}/revert` and `.../revert/chunk`, and change the active-run endpoint to `GET /migration/runs/latest`; block a new run while a non-reverted run exists
- [x] 3.6 Write integration tests: revert removes created rows, keeps reused rows, restores a setting, keeps an in-use product and reports it, and allows a second migration after revert
- [x] 3.7 Verify: run the migration integration tests and `phpcs`

## 4. Group descriptions backend

- [x] 4.1 Add `description()` to `GroupMigrator` and each WooCommerce group, and return it in the scan response
- [x] 4.2 Add a test for the scan response

## 5. Frontend

- [x] 5.1 Add endpoints, services and zod schemas for the latest run, revert and revert chunk (with `description` on scan groups)
- [x] 5.2 Show the group description under each checkbox label in `migration-scan-step` (small text, secondary color)
- [x] 5.3 Load the latest run on mount in `use-migration-runner` and choose the screen: scan, progress, or summary
- [x] 5.4 Rename Resume to Retry and show it only for a failed run
- [x] 5.5 Add Revert to the summary step with a confirmation dialog, a revert progress view, and a result that says how many records were kept; return to the scan step when revert ends
- [x] 5.6 Update `docs`-style strings with `__()` and domain `kirki-ecommerce`; update the onboarding and route tests that use the migration flow
- [x] 5.7 Verify: `npm run typecheck && npm test` from `resources/app/`

## 6. Docs

- [x] 6.1 Update `docs/migration.md`: Revert, Retry, saved completed state, the ledger, and a "Where this differs" note that revert keeps rows that are in use
