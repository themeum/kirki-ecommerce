## Why

A merchant cannot undo a migration, cannot see the result of a finished migration after a page reload, and sees a failed run as "Resume". The stale-link problem seen in development (links that point at deleted Kirki rows) also has no clean fix. In addition, the migration code has style and naming gaps that review found: untranslated exception messages, `+=` array merges, raw WooCommerce status strings, `kirki` names that should be `kirki_ecommerce`, an unclear `IdMap` name, and routes loaded by a manual `include`.

## What Changes

- Add a **Revert** action. It deletes the Kirki rows that the run created, newest group first, and restores the old value of each Kirki setting that the run changed. It changes only Kirki data. It keeps rows that new Kirki data depends on and reports how many.
- Save the state "completed" with the run. On reload the screen shows the completed summary with **Revert** and **Go to dashboard**.
- After Revert the run is marked `reverted`, its ledger rows are removed, and the screen returns to the scan step so the merchant can migrate again.
- Rename **Resume** to **Retry**. It shows only when a run fails in the middle, and continues from the saved position.
- Show a short description under each group label on the scan step (secondary color, small text).
- Rename `IdMap` to `RecordLedger` (class, model `MigrationRecordLedger`, table `migration_record_ledger`). The ledger also stores the old value of changed settings.
- Cleanup, with no behavior change:
  - rename identifiers named `kirki` (for example `kirki_id`) to `kirki_ecommerce` forms;
  - load the routes with `use_routing()` instead of `include` in `boot()`;
  - translate the `LogicException` messages in `WooCommerceGroup` with `esc_html__`;
  - replace `+=` array merges with `array_merge()`;
  - add constants for the WooCommerce order statuses and use them in `OrderMapper`.
- The word "migration" stays as the name of the feature and of the schema migrations.
- **BREAKING** (development data only): the ledger table is renamed and gets new columns. The feature has not shipped, so the table is changed in its create class, with no upgrade step.

## Capabilities

### New Capabilities
- `migration-revert`: Revert a finished or failed run and restore the previous Kirki state.
- `migration-run-recovery`: Retry after a failure, and a saved completed state that survives reload.
- `migration-group-descriptions`: Short description of each group on the scan step.

### Modified Capabilities

## Impact

- PHP: `app/Migration/Core` (`IdMap` to `RecordLedger`, `MigrationRunner`, new `MigrationReverter`), `Models`, `Database/Migrations`, `Http/Controllers/MigrationController.php`, `routes.php` (new revert endpoint), `Providers/MigrationServiceProvider.php`, `Sources/WooCommerce` (groups, mappers, new status constants, settings group saves old values).
- React: `resources/app/features/migration` (summary step, scan step, runner hook, services, schemas, route state), `resources/app/config/endpoints.ts`.
- Docs: `docs/migration.md`. Tests: `tests/Integration/Migration`, feature tests under `resources/app/features/migration`.
- Earlier change `woocommerce-migration` has specs that still say `IdMap` and "Resume". They are not edited here.
