## 1. Server-owned sync state

- [x] 1.1 In `SettingsController::update`, for the currency settings key, remove `sync_token`, `sync_fingerprint`, `last_sync_at`, `next_sync_at`, `last_sync_error`, `last_sync_error_at` and `usage` from `$data` before `set()`
- [x] 1.2 Add `last_sync_error` and `last_sync_error_at` to `SettingResource::get_currency_settings()` (not `sync_token` or `sync_fingerprint`)
- [x] 1.3 Integration test: a currency settings save that sends `next_sync_at`, `last_sync_at` and `sync_token` does not change the stored values
- [x] 1.4 Verify: run the PHP Integration suite for settings and currency exchange, phpcs on touched files, then `npm run typecheck && npm test` from `resources/app/` (note: `vendor/bin/phpunit` exits silently with code 0 because `autoload.files` loads the ABSPATH-guarded helpers before `autoload-dev` loads `bootstrap/abspath.php`; ran with `-d auto_prepend_file=bootstrap/abspath.php`)

## 2. Scheduled sync job and manager

- [x] 2.1 Add an interval-in-seconds helper for `UpdateFrequency` values (default 24 hours) in `CurrencyExchangeManager`; remove `get_next_sync_at()` and stop `sync()` writing `next_sync_at`
- [x] 2.2 Add `CurrencyExchangeManager::start_schedule()` (new token, fingerprint, dispatch job now), `stop_schedule()` (clear token and `next_sync_at`), `reschedule_after_sync()` (new token, `next_sync_at = now + interval`, dispatch delayed job) and a fingerprint helper over enabled, provider, API key and frequency
- [x] 2.3 Add `app/Jobs/SyncExchangeRatesJob.php` (queue `currency-sync`, `$tries = 1`): no-op when off or token mismatch; on success clear `last_sync_error*`; on failure record `last_sync_error` and `last_sync_error_at`; always set `next_sync_at` and dispatch the next job with the same token; all settings writes with `set(..., false)`
- [x] 2.4 Integration tests (`QueueFake` where the existing tests use it; the 1.3 test is in `tests/Integration/CurrencySyncScheduleTest.php` with the others): successful run reschedules with the right delay; stale token does nothing; disabled does nothing; failed run keeps rates, records the error and reschedules; success after failure clears the error
- [x] 2.5 Verify: run the new and existing currency Integration tests, phpcs, then `npm run typecheck && npm test` from `resources/app/`

## 3. Start, stop, restart and repair

- [x] 3.1 Change `UpdateCurrencyRatesListener`: off or no active provider → `stop_schedule()`; fingerprint changed → `start_schedule()`; else nothing. Remove the in-request `sync()` call
- [x] 3.2 Change `CurrencyExchangeController::sync`: when automatic updates are on, call `reschedule_after_sync()` in a `finally` after the sync; keep the response shape
- [x] 3.3 Add `app/Hooks/Actions/RepairCurrencySyncSchedule.php` on the `{prefix}queue_sweep` action and register it in `config/hooks.php`: when on, provider active, and `next_sync_at` empty or older than now minus one interval → `start_schedule()`
- [x] 3.4 Integration tests: save turning on dispatches one job and does not call the provider in the request; save changing frequency replaces the token; save changing only the decimal separator dispatches nothing; save turning off clears `next_sync_at`; "Sync now" with automatic updates on sets `next_sync_at` one interval ahead and replaces the token (also on provider failure); repair starts a schedule when `next_sync_at` is two intervals old and does nothing when it is in the future
- [x] 3.5 Verify: run the full PHP Integration suite, phpcs on touched files, then `npm run typecheck && npm test` from `resources/app/` (864 tests; 2 failures in `OnboardingApiTest` also fail on HEAD without this change — unrelated)

## 4. Admin UI

- [x] 4.1 `multi-currency-settings-form.ts`: send the form's `is_automatic_update_enabled` instead of `false`; remove `last_sync_at` and `next_sync_at` from the payload; add read-only `last_sync_error` and `last_sync_error_at` to the shape; update `tests/schemas/forms/multi-currency-settings-form.test.ts` in the same task
- [x] 4.2 Add `last_sync_error` and `last_sync_error_at` to the currency settings catalog schema (`resources/app/schemas/catalog/settings.ts`)
- [x] 4.3 `api-config.tsx`: render the `is_automatic_update_enabled` switch in the Automatic Updates header actions, disabled while no provider or no API key; the switch is the only header action (correction: a plain `Switch` with an `aria-label` rather than `SwitchField`, because `SwitchField` gives an unlabelled switch no accessible name) (no vertical-ellipsis menu); remove the commented-out `rightActions` block
- [x] 4.4 Remove the fallback-behaviour select from `api-configuration-dialog.tsx` and the fallback line from `api-configuration-card.tsx`; keep `fallback_behaviour` in `api-configuration-form.ts` so the stored value round-trips, and update its payload test if the shape changes (correction: the field was `required()`; a hidden required field blocks the dialog when the stored value is null, so it is now optional with the same default, and a test covers null)
- [x] 4.5 Verify: `npm run typecheck`, lint and `npm test` from `resources/app/`. Ask the user to check the toggle and the dialog visually (no browser verification) — typecheck, full lint and 1464 Vitest tests pass; visual check handed to the user

## 5. Docs

- [x] 5.1 Update `docs/currencies.md`: automatic updates (toggle, frequency, schedule restart on save and on "Sync now", failure behaviour, repair), and add to "Where this differs" that runs depend on site traffic (WP-Cron), that a failed run waits a full interval, and that there is no fallback-behaviour option
- [x] 5.2 Verify: `npm run typecheck && npm test` from `resources/app/` and `openspec validate automatic-exchange-rate-sync --strict`
