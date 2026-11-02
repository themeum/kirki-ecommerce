## Why

The Currency settings page lets an administrator pick an exchange-rate provider and an
update frequency, but no scheduled sync runs: rates change only when someone clicks
"Sync now" or saves the settings (which syncs inside the request). The plugin now has a
queued job runner, so rates can stay current on their own.

## What Changes

- Turn on the "Automatic updates" toggle in the Automatic Updates card. It can be
  switched on only when a provider and an API key are set.
- While the toggle is on, a queued job syncs rates at the saved update frequency. Each
  run schedules the next run and stores `next_sync_at`.
- Saving a change to the toggle, provider, API key or frequency starts a new schedule.
  An older scheduled run that is no longer current does nothing.
- "Sync now" restarts the schedule when automatic updates are on, so the next run is one
  full interval after the manual sync.
- A failed automatic sync keeps the current rates, records the error and its time, and
  still schedules the next run. The next successful sync clears the error.
- The queue's every-minute sweep repairs a schedule that has stopped (no run for more
  than one interval past `next_sync_at`).
- Saving the currency settings no longer runs a sync inside the request.
- When automatic updates are off, `next_sync_at` is empty.
- Remove the "Fallback Behavior" field from the API configuration dialog and the
  configured-provider card. A failed sync always keeps the last known rates. The stored
  value is left alone.
- **BREAKING (spec)**: replaces the requirement "Exchange rate provider is configurable,
  automatic updates stay off".
- Out of scope: caching (provider responses or currency lookups), and the Available
  Currencies panel redesign (change `redesign-available-currencies-panel`).

## Capabilities

### New Capabilities

- `automatic-exchange-rate-sync`: Scheduled exchange-rate syncing at the configured
  frequency — when it runs, how it reschedules, how it recovers, and how failures are
  recorded.

### Modified Capabilities

- `multi-currency-settings`: The provider-configuration requirement changes from
  "automatic updates stay off" to an enabled toggle; "Sync now" restarts the schedule;
  the fallback-behaviour setting is no longer shown.

## Impact

- PHP: new queued job in `app/Jobs/`; `CurrencyExchangeManager` (schedule start/stop,
  error recording, `next_sync_at` only when on); `UpdateCurrencyRatesListener` (start or
  stop the schedule instead of syncing in the request); `CurrencyExchangeController::sync`
  (restart schedule); a hook on the queue sweep action registered in `config/hooks.php`.
- Settings data: new keys in the currency settings option — `sync_token`,
  `sync_fingerprint`, `last_sync_error`, `last_sync_error_at`. No migration.
- React: `api-config.tsx` (toggle), `api-configuration-dialog.tsx` and
  `api-configuration-card.tsx` (remove fallback), the currency settings form schema and
  its payload test, and the settings catalog schema for the new read-only keys.
- Docs: `docs/currencies.md`.
- Tests: new PHP integration tests next to `tests/Integration/CurrencyExchangeApiTest.php`.
