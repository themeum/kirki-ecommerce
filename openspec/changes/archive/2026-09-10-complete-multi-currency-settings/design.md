## Context

See `proposal.md` — Why. Relevant current state:

- `resources/app/features/settings/multi-currency/` holds the page (`multi-currency-settings.tsx`),
  the available-currencies panel + hook (`available-currency-list.tsx`,
  `hooks/use-available-currency-list.ts`), row-item builders (`lib/currency-list.tsx`,
  `lib/currency-selection.ts`), the add / edit / exchange-rate dialogs, the API-config
  sub-tree (`pages/api-config/*`), form schemas (`schemas/forms/*`), and the currency
  service (`services/currency.ts`).
- Backend: `CurrencyController` (`GET/POST/PUT/DELETE /currencies`, bulk),
  `CurrencyExchangeController` (`GET /currency-exchange/providers` only),
  `CurrencyService`, `CurrencyExchangeManager` (`sync()`, `get_active_provider()`),
  `CurrencyExchangeFactory`, providers `CurrencyApiProvider` (`currency_api`) and
  `ExchangeRatesApiProvider` (`exchange_rates_api`), the `CurrencyExchange` facade.
- `CurrencyExchangeManager` is a lazy container singleton built in
  `CurrencyServiceProvider` from `Settings::get(OptionKeys::CURRENCY_SETTINGS)`
  (`api_provider`, `api_config`).
- The settings page already wraps its content in one React Hook Form (`<Form>`); the
  API-config panel writes `api_provider` / `api_config` into that form via
  `setValue(..., { shouldDirty: true })` and persists on the page's existing Save.
- The settings layout (`features/settings/pages/settings-layout.tsx`) exposes
  `confirmAction({ action, otherProps })` through `useOutletContext`; the shared
  `ConfirmationDialog` (`@/components/modal/confirmation-dialog`) supports
  `variant: 'default' | 'warning' | 'delete'`. `shipping-zone-actions.tsx` is the
  reference pattern for a three-dot menu wired to `confirmAction`.

## Goals / Non-Goals

**Goals:**

- Ship the manual currency-management flow end to end with the row UX the proposal
  describes (inline rate input, overflow menu, confirmation dialogs).
- Add on-demand sync with clear failure messaging, without touching the automatic /
  scheduled path.
- Keep the change surgical: reuse `confirmAction`, `NumberInput`, existing service /
  query-key conventions; do not refactor the API-config panel's internals.

**Non-Goals:**

- Recurring rate scheduler; the `update_frequency` default-constant bug in
  `resources/data/settings/currency.json`; API-key encryption at rest. (Listed in
  `proposal.md` and left as follow-ups.)
- Migrating `exchange-rate-dialog.tsx` (the add flow's step 2) off `TextField`, or
  reworking `ApiConfig`'s local-state shadow of form values.

## Decisions

### Inline rate input uses `NumberInput`, not `NumberField`

`NumberField` (`@/components/form/number-field`) requires a `useFormContext`, and the
currency rows are not fields of the page form. Use the primitive it wraps —
`NumberInput` (`@/components/ui/number-input`) — inside a small `CurrencyRateInput`
component with local `useState` seeded from `item.exchange_rate`, committing on blur /
Enter. Rejecting an invalid value reverts local state and skips the mutation.
Alternative considered: adding a `currencies` field array to the page form — rejected
as a large structural change for one editable cell, and it would entangle rate edits
with the page's dirty-tracking / Save button.

### Row actions route through `confirmAction`

Replace `DropdownButton` in `CurrencyRowActions` with `DropdownMenu` +
`MoreVertical`, mirroring `shipping-zone-actions.tsx`. "Set as default" →
`confirmAction({ variant: 'warning', ... })`; "Delete" →
`confirmAction({ variant: 'delete', ... })`. This drops the current toast-with-undo
delete (`dispatchToastMessage('delete', ...)`) — an explicit confirm dialog plus a
soft-undo toast is redundant, and the dialog is the pattern the rest of settings uses.

Wrap the switch + menu in a plain right-aligned `Flex`, not `ActionGroup`.
`ActionGroup` sets `data-action-group="true"`, which the `StackedItem` row uses to
hide its actions until hover / focus-within. The inline `CurrencyRateInput` sits in
the same cluster and is always visible, so the switch and menu are kept always-visible
too rather than split across two visibility rules — which also removes the
`useStackedItem()` / `setOpen` wiring that only held the hover-hidden actions open
while the menu was open.

### `toCurrencyDraft` picker for write payloads

`buildCurrencyListItems` enriches rows with `icon`, `actionsArray`, and (currently)
`rightIcon: <IncreaseIcon />` — a React element. Spreading a list item into a
`PUT /currencies` body can make `JSON.stringify` throw on a dev-build circular
`_owner`, and always ships fields the backend filter discards. Add
`toCurrencyDraft(item)` in `lib/currency-list.tsx` returning only
`{ id, name, code, symbol, exchange_rate, is_base, is_active }`, and route both
`buildCurrencyUpdatePayload` branches and the new `handleRateChange` through it.
Removing the now-unused `rightIcon` / `rightText` / `IncreaseIcon` is cleanup of code
this change makes dead.

### Add-flow validation via field-level refinement

`exchange-rate-form.ts` currently inherits a nullish `exchange_rate` from the shared
`CurrencyDraftSchema`. Constrain it in `ExchangeRateFormShape` only —
`items: z.array(CurrencyDraftSchema.extend({ exchange_rate: z.union([z.string(), z.number()]).nullish().refine(v => v != null && v !== '' && Number(v) > 0, msg) }))` —
so the shared schema (used for the clean write payload) is untouched. The refinement
keeps `.nullish()` in the input type on purpose: the add flow seeds items with an
absent `exchange_rate` until the user types one, and a non-nullish union would break
`exchange-rate-dialog.tsx`'s `defaultValues`. This follows `openspec/project.md`'s
zod-v3 rules: field-level `.refine`, `prepareFormSchema(...).transform()` stays on the
terminal schema. `edit-currency-form.ts` is deleted with its dialog; the inline input
enforces `> 0` in its commit handler.

### Sync endpoint is a thin controller action

`POST /currency-exchange/sync` on `CurrencyExchangeController`:

1. `CurrencyExchange::get_active_provider() === null` → `400` with a "configure a
   provider first" message. This is the guard that keeps `CurrencyExchangeManager::sync()`
   from fataling on a null provider — the manager is left unchanged.
2. `try { CurrencyExchange::sync(); } catch (\Throwable $e)` → `400` with
   `$e->getMessage()` (providers throw `Exception` with human-readable messages).
3. Success → `{ last_sync_at, next_sync_at, usage }` from the refreshed currency
   settings + a success message.

The manager reads settings when the container resolves it, and `sync()` is its own
request, so a just-saved provider config is always visible. Alternative considered:
accepting provider + key in the request body — rejected; it would duplicate the
settings contract and let a sync run against unsaved config.

### `CurrencyController::update` failure status

Collect caught messages into `$errors`. All items failed
(`error_count === total_count && total_count > 0`) → `422` with `errors`. Partial
failure keeps `201` but adds `errors`. Matches the `bulk_actions` error shape already
in the controller.

### "Sync now" placement and gating

The button lives in `api-config.tsx`, shown only when `selectedAPI && hasAPIConfiguration`,
and disabled while `useFormContext().formState.isDirty` (the backend syncs persisted
settings). `useSyncCurrencyRatesMutation` in `services/currency.ts` invalidates
`currencyKeys.all` and `settingsKeys.section('currency')` so rates and the "Last
synced" line refresh. The "Last synced" line moves off the `is_automatic_update_enabled`
gate to `api_provider && last_sync_at`.

## Risks / Trade-offs

- **Inline commit-on-blur can fire an update the user didn't mean to finalize (e.g.
  tabbing away).** → Only commit when the parsed value is positive *and* differs from
  the persisted rate; otherwise revert silently.
- **`sync()` calls `CurrencyService::update()` per changed currency, each dispatching
  model events.** → Same code path already used by the (dormant) settings-save
  listener; currency count is small (store-configured), so N is tiny.
- **No `Http::fake` in the integration suite** → the new `CurrencyExchangeApiTest`
  covers only the no-external-call paths (401 unauthenticated, 400 no provider); a
  real provider round-trip stays a manual check.
- **Deleting `edit-currency-dialog.tsx` / `edit-currency-form.ts`** is safe only if
  nothing else imports them → grep before deleting; both are currently referenced only
  by each other and `available-currency-list.tsx`.
- **`PUT /currencies` returning `422` on total failure** is a contract change for any
  API consumer → in practice only the admin UI calls it, and it currently mishandles
  the "success" it receives.
