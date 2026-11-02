## Context

See proposal.md for motivation. Facts that shape the approach:

- **Queue.** The framework queue (`Framework\Queue`) supports `Job::dispatch(...)->delay($when)`
  and per-job `$tries` / `$backoff`. It has no recurring schedule and cannot cancel a
  queued job. `PublishScheduledProductJob` handles this by re-checking state when it
  runs and doing nothing when it is no longer due.
- **Queue sweep.** `QueueServiceProvider::register_sweep()` registers the WP-Cron event
  `{prefix}queue_sweep` every minute. The app can add its own callback to that action.
- **Current sync.** `CurrencyExchangeManager::sync()` fetches rates, updates changed
  currencies, then writes `usage`, `last_sync_at` and `next_sync_at` with
  `$currency_settings->set($settings_array, false)` (no `SettingsChangedEvent`).
  It writes `next_sync_at` even though nothing runs at that time.
- **Save hook.** `AppSettings::set()` dispatches `SettingsChangedEvent($key)`.
  `UpdateCurrencyRatesListener` handles it and calls `CurrencyExchange::sync()` inside
  the request when `is_automatic_update_enabled` is true and a provider is active.
  The event carries only the key, not the old values.
- **Validation.** `SettingsUpdateRequest` already requires `api_provider` and
  `api_config` when `is_automatic_update_enabled` is true.
- **UI.** The toggle is commented out in `api-config.tsx` (`rightActions`). The fallback
  field is in `api-configuration-dialog.tsx` and `api-configuration-card.tsx`.

## Goals / Non-Goals

**Goals:**
- Background sync at the saved frequency, with no request waiting on the provider.
- At most one live schedule at a time, without the ability to delete queued jobs.
- No silent stop: failures continue the chain; a lost chain is repaired.

**Non-Goals:**
- Caching provider responses or currency lookups (`api_config.is_cache_enabled` stays
  unused).
- Applying `fallback_behaviour`. The stored value is kept; only the UI is removed.
- Recording errors from on-demand "Sync now" (the request already returns the error).

## Decisions

**One self-chaining job, guarded by a schedule token.**
- `SyncExchangeRatesJob(string $token)` on queue `currency-sync`, `$tries = 1`.
- `handle()`: read currency settings. If automatic updates are off or the stored
  `sync_token` does not equal `$this->token`, return (a replaced schedule).
- Otherwise call the manager's sync. On `Throwable`, write `last_sync_error` (message)
  and `last_sync_error_at`. On success, clear both.
- In both cases, write `next_sync_at = now + interval` and dispatch
  `SyncExchangeRatesJob($token)->delay(next_sync_at)`.
- *Alternative rejected:* WP-Cron events per frequency. It adds a second scheduler and
  custom cron intervals; the queue already gives delay, retries and a worker.
- *Alternative rejected:* queue retries (`$tries > 1`). A retry runs minutes later and
  then the chain needs extra logic to avoid a double schedule. One try plus "always
  reschedule" is simpler and matches the chosen failure behaviour.

**Start, stop and restart live in `CurrencyExchangeManager`.**
- `start_schedule()`: generate a new token (`wp_generate_uuid4()`), store `sync_token`,
  store `sync_fingerprint`, dispatch `SyncExchangeRatesJob($token)` with no delay.
- `stop_schedule()`: clear `sync_token` and `next_sync_at`. Queued jobs then do nothing.
- `sync()` stops writing `next_sync_at`; only the job writes it. Interval calculation
  moves from `get_next_sync_at()` to a seconds-based helper used by both the job and
  the repair check.
- All writes use `set(..., false)` so they do not dispatch `SettingsChangedEvent` and
  cannot re-enter the listener.

**Detect relevant changes with a fingerprint, not old values.**
- The event carries no old values. The manager stores
  `sync_fingerprint = md5(json_encode([enabled, provider, api_key, frequency]))` when a
  schedule starts.
- `UpdateCurrencyRatesListener`: if automatic updates are off or no provider is active →
  `stop_schedule()`. Else if the current fingerprint differs from the stored one →
  `start_schedule()`. Else do nothing. It no longer calls `sync()`.
- *Alternative rejected:* restart on every currency settings save. A change to the
  decimal separator would then spend an API request.

**"Sync now" restarts the schedule after its own sync.**
- `CurrencyExchangeController::sync` runs `sync()` as today. Then, when automatic updates
  are on, it stores a new token and dispatches the next job with
  `delay(now + interval)`, and writes `next_sync_at` — the same as a job run, without
  the immediate job. The restart happens in a `finally` so a failed on-demand sync also
  restarts the schedule (spec: "successful or failed").
- Response keeps returning `next_sync_at`.

**Repair on the queue sweep.**
- New action class `App\Hooks\Actions\RepairCurrencySyncSchedule` on
  `{prefix}queue_sweep`, registered in `config/hooks.php`.
- When automatic updates are on, a provider is active, and `next_sync_at` is empty or
  older than `now - interval`, call `start_schedule()`.
- The grace of one interval avoids a restart while a due job waits for the worker.
- Cost: one option read per minute (settings are already autoloaded).

**UI.**
- `api-config.tsx`: render the `is_automatic_update_enabled` switch in the
  OptionAccordion header actions; `disabled` while `api_provider` or `api_config.api_key`
  is empty. The switch is the only header action: no overflow (vertical ellipsis)
  menu, although the design screenshot shows one. Turning it on does not need extra client logic; the save path handles it.
- Remove the fallback select from the dialog and the fallback line from the card.
  Keep `fallback_behaviour` in the form schemas so a save round-trips the stored value.
- The form schema's `.transform()` hard-codes `is_automatic_update_enabled: false`.
  Send the form value instead, and update the payload test.
- Add read-only `last_sync_error` / `last_sync_error_at` to `SettingResource`, the
  settings catalog schema, and the form shape, for change B to read. Do not add them to
  the payload.
- `sync_token` and `sync_fingerprint` stay server-only: `SettingResource` does not
  return them.

**Sync state is server-owned.**
- `AppSettings::set()` merges top-level keys, and `Request::all()` does not filter to
  the rule keys. So any key the client sends overwrites the stored value. Today the
  payload sends `last_sync_at` and `next_sync_at` back, which can overwrite a value the
  job wrote while the page was open.
- Remove `last_sync_at` and `next_sync_at` from the form payload.
- In `SettingsController::update`, for the currency key, drop `sync_token`,
  `sync_fingerprint`, `last_sync_at`, `next_sync_at`, `last_sync_error`,
  `last_sync_error_at` and `usage` from `$data` before `set()`.
- *Alternative rejected:* filter in `SettingsUpdateRequest`. The request has no
  "allowed keys" hook today; the controller is the single write path.

## Risks / Trade-offs
- **[Risk]** A low-traffic site runs WP-Cron late, so a run can be late by the time
  between visits. → Same limit as every WP-Cron/queue feature; documented in
  "Where this differs".
- **[Risk]** Two sweeps in the same minute could both start a schedule. → The second
  token replaces the first; the first chain's next run does nothing. At most one extra
  provider request.
- **[Trade-off]** A failed run retries only at the next interval, not sooner. A daily
  frequency with a short outage keeps old rates for a day. → The footer (change B)
  shows the error, and "Sync now" is one click.
- **[Trade-off]** `fallback_behaviour` stays stored but unused and hidden.

## Migration Plan

1. No schema migration. New settings keys default to empty.
2. A store that had the toggle saved as on (not possible from the current UI, but
   possible through the API) gets a schedule on the first sweep after the update,
   through the repair check.
3. Rollback: the old code ignores the new keys; queued `SyncExchangeRatesJob` rows
   fail to unserialize and go to failed jobs.
