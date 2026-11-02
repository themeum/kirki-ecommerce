## Context

- `IdMap` links source id to Kirki id in `migration_id_map` (`kirki_id`, `run_id`). It trusts the link and never checks that the Kirki row exists. A stale link makes a run skip everything.
- `MigrationRunner` runs one chunk of one group per request and saves cursor and counts in `migration_runs`. `RunStatus` has `pending`, `running`, `failed`, `done`.
- Groups write through services and models only. Created and reused records are both linked, so the ledger cannot tell them apart today.
- `SettingsGroup` fills empty Kirki settings and does not save the old value.
- The screens are `migration-scan-step`, `migration-progress-step`, `migration-summary-step`, driven by `use-migration-runner`. A failed run shows "Resume".
- Routes are loaded by `include` in `MigrationServiceProvider::boot()`.

## Goals / Non-Goals

**Goals:**
- Revert a run, restoring Kirki data only, and keep that safe for data the merchant added later.
- Survive reload with a saved completed state.
- Fix the stale-link problem as a side effect of the ledger.
- Make the listed cleanups with no behavior change.

**Non-Goals:**
- A full database snapshot.
- Retrying skipped items.
- Renaming "migration", or the schema migrations.
- Changing WooCommerce data in any way.
- An upgrade path for the old table (the feature has not shipped).

## Decisions

1. **`RecordLedger` replaces `IdMap`.** Class `Core/RecordLedger`, model `Models/MigrationRecordLedger`, table `kirki_ecommerce_migration_record_ledger`, create class `CreateMigrationRecordLedgerTable`. The table changes in its create class, because nothing has shipped. New columns: `origin` (`created` or `reused`) and `previous_value` (nullable JSON, used for settings). Column `kirki_id` becomes `kirki_ecommerce_id`.
   *Alternative:* keep two tables (links and an undo log). Rejected: one row per record is simpler and revert reads one table.

2. **Revert deletes by ledger, newest group first, in chunks.** `MigrationReverter` reads rows with `origin = created` for the run, in reverse group order (orders, coupons, customers, products, attributes, tags, categories). Each ledger entity maps to a delete action through a `deleter` per entity, kept in the source (`Sources/WooCommerce`), so the engine stays source-neutral. A row with `origin = reused` is only unlinked.
   *Alternative:* full table snapshot. Rejected: heavy for 1000+ orders and it erases data added later.

3. **Settings keep their old value.** `SettingsGroup` writes `previous_value` to the ledger before it changes a setting. Revert writes it back. Settings that were not changed have no ledger row.

4. **In-use rows are kept.** Before a delete, the deleter asks if something outside the run depends on the row (for example an order item that points to the product, and the order is not from this run). A row in use is kept and counted. The count is saved in the run and shown in the result. Because the run's own orders are removed first, products are normally free.

5. **Run state.** `RunStatus` gets `reverting` and `reverted`. The run gets a `revert_state` JSON (cursor, removed, kept) so revert can also be retried after a failure. When revert finishes: status `reverted`, ledger rows of the run deleted.

6. **API.** `POST /migration/runs/{id}/revert` starts revert. `POST /migration/runs/{id}/revert/chunk` runs the next chunk and returns progress, like `/chunk`. `GET /migration/runs/active` becomes `GET /migration/runs/latest?source=`, which returns the latest run that is not `reverted`. Both stay admin only. The client calls revert chunks in a loop like migration chunks.

7. **Self-healing ledger.** `RecordLedger::resolve()` is not changed. Stale links cannot appear any more because Revert clears the rows, and a migration run starts only when there is no active (non-reverted) run for the source. This avoids an extra lookup per item.

8. **Retry.** The button text becomes "Retry" and shows only when the phase is `failed`. The server already continues from the saved cursor. Skipped items never set `failed`.

9. **Screen state from the server.** `use-migration-runner` loads the latest run on mount: `done` shows the summary (with Revert and Go to dashboard), `failed` or unfinished shows progress with Retry, `reverted` or none shows the scan step. This replaces the "offer to resume" prompt for finished runs.

10. **Group descriptions.** `GroupMigrator` gets `description()`. The scan response returns `description` for each group. `migration-scan-step` renders it under the label with `Text variant="small" color="secondary"`. All strings use `__()` or `esc_html__()`.

11. **Cleanups.** `use_routing()` replaces the `include` in `boot()` (check that the framework's `use_routing()` accepts an absolute path; if not, record a "Correction during implementation" note). `WooCommerceGroup` throws with `esc_html__()`. `+=` array merges in `CouponMapper` become `array_merge()` (the numeric counters in `MigrationRunner` are not array merges and stay). A new `Sources/WooCommerce/Constants/WooCommerceOrderStatus` holds the `wc-*` strings and `OrderMapper::statuses()` uses them. Names with `kirki` (for example `kirki_id`, `$kirki_id`) become `kirki_ecommerce_id` forms.

## Risks / Trade-offs

- A deleter bug can remove too much. Mitigation: delete only ids that are in the ledger with `origin = created`, and test it against a Kirki row that the merchant created.
- "In use" checks are per entity and need care for each entity. Mitigation: start with products, variants, customers and coupons (the rows that orders point to); other entities have no dependents.
- Revert is not an exact rollback of everything: rows added by the merchant that depend on migrated rows stay. The result screen says so.
- Orders removed by revert are deleted for good. The confirmation dialog says this.
- Assumption: "named just `kirki`" is read as identifiers like `kirki_id`; no other plain `kirki` name was found in `app/Migration` or the migration feature folder.

## Open Questions

- None that block tasks.

## Corrections during implementation

- **Settings snapshot.** The settings group saves one snapshot on the store item: the store address, the tax switches, `tax_regions`, `shipping_zones` and the base currency code. Revert restores these keys as a whole. Tax regions and shipping zones added by the merchant after the migration are therefore also reset. The per-setting old value in decision 3 was too fine for append-only lists.
- **No start block.** The backend does not refuse a new run when a finished run exists. The screen decides: it shows the summary until Revert. Decision 7 is replaced by this rule, because a second run of the same source is already safe (it reuses the ledger).
- **Guest customers.** A customer created for a guest order is recorded in the ledger as `guest_customer`, so Revert can remove it when no other order uses it.
- **`use_routing()`** accepts any file path, so no extra step was needed.
