## 1. Backend — on-demand sync endpoint

- [x] 1.1 Add `sync(Request $request)` to `app/Http/Controllers/Api/CurrencyExchangeController.php`: return `Response::BAD_REQUEST` with a "configure a provider first" message when `CurrencyExchange::get_active_provider()` is null; wrap `CurrencyExchange::sync()` in `try/catch (\Throwable $e)` returning `Response::BAD_REQUEST` + `$e->getMessage()`; on success return `{ last_sync_at, next_sync_at, usage }` from the refreshed `Settings::get(OptionKeys::CURRENCY_SETTINGS)` with a success message. Follow PHP standards (`static::`, snake_case, short arrays, no `private`, PHP 7.4, docblocks with `@return`).
- [x] 1.2 Register `Route::post('/currency-exchange/sync', [CurrencyExchangeController::class, 'sync']);` in `routes/api.php` inside the existing `AuthMiddleware` group, next to the providers route.
- [x] 1.3 Add `tests/Integration/CurrencyExchangeApiTest.php` covering: unauthenticated → 401; no provider configured → 400 (no external HTTP).
- [x] 1.4 Run `composer phpcs:wporg` (clean on touched files) and `composer test:integration` (`CurrencyExchangeApiTest` green).
- [x] 1.5 Run `npm run typecheck && npm test` from `resources/app/`.

## 2. Backend — currency update failure status

- [x] 2.1 In `app/Http/Controllers/Api/CurrencyController.php::update()`, collect caught exception messages into `$errors`; when `error_count === total_count && total_count > 0` return `Response::UNPROCESSABLE_ENTITY` with `'errors' => $errors`; keep the partial-success `201` branch but add `'errors' => $errors`.
- [x] 2.2 Add a `CurrencyApiTest` case: `PUT /currencies` whose only item targets a missing id returns a non-2xx status.
- [x] 2.3 Run `composer phpcs:wporg` and `composer test:integration`.
- [x] 2.4 Run `npm run typecheck && npm test` from `resources/app/`.

## 3. Frontend — currency-list lib + payload hygiene

- [x] 3.1 Add `toCurrencyDraft(item)` to `lib/currency-list.tsx` returning only `{ id, name, code, symbol, exchange_rate, is_base, is_active }`; route both branches of `buildCurrencyUpdatePayload` through it.
- [x] 3.2 Remove the `{ value: 'edit' }` entry from `getActionArray` (leaving `delete` + `set_base`); remove `rightIcon` / `rightText` from `buildCurrencyListItems` and `CurrencyListItem`, and the now-unused `IncreaseIcon` import.
- [x] 3.3 Update `tests/lib/currency-list.test.ts`: `getActionArray` expectation → `['delete', 'set_base']`; drop `rightText` assertions; `buildCurrencyUpdatePayload` assertions → the `toCurrencyDraft` shape.
- [x] 3.4 Run `npm run typecheck && npm test` from `resources/app/`.

## 4. Frontend — inline exchange-rate editing

- [x] 4.1 Delete `pages/edit-currency-dialog.tsx`, `schemas/forms/edit-currency-form.ts`, and `tests/schemas/forms/edit-currency-form.test.ts` after grepping that nothing else imports them.
- [x] 4.2 In `hooks/use-available-currency-list.ts`: add `handleRateChange(item, rate)` → `updateData({ items: [toCurrencyDraft({ ...selected, exchange_rate: rate })] })`; remove `editCurrency` / `setEditCurrency` state, `EditCurrencyItem`, and the `'edit'` branch of `handleAction`; expose the base currency `code`.
- [x] 4.3 In `available-currency-list.tsx`: add a `CurrencyRateInput` subcomponent (`NumberInput` from `@/components/ui/number-input` + local `useState` seeded from `item.exchange_rate`) that commits on blur / Enter only when the value is `> 0` and changed, otherwise reverts; render it per row; base row shows a fixed, non-editable `1`; remove the `<EditCurrencyDialog>` block.
- [x] 4.4 Run `npm run typecheck && npm test` from `resources/app/`.

## 5. Frontend — three-dot menu + confirmation dialogs

- [x] 5.1 Rewrite `CurrencyRowActions` in `available-currency-list.tsx` using `DropdownMenu` / `DropdownMenuTrigger` (`<Button variant="ghost" size="icon-sm">` + `MoreVertical`) / `DropdownMenuContent` with "Set as default" and "Delete" items; keep the active `<Switch>` for non-base rows; render no menu for the base row. Wrap the switch + menu in a plain right-aligned `<Flex>` (not `ActionGroup`) so the actions stay visible instead of hiding until row hover; no `useStackedItem` wiring needed.
- [x] 5.2 Consume `confirmAction` via `useOutletContext`; "Set as default" → `confirmAction({ variant: 'warning', ... })`, "Delete" → `confirmAction({ variant: 'delete', ... })`; each runs the action only on confirm.
- [x] 5.3 Simplify `handleDeleteCurrencyItem` in `hooks/use-available-currency-list.ts` to a direct `deleteCurrencyMutate(item.id, { onSuccess: () => refetch() })`; drop the `dispatchToastMessage` import if unused.
- [x] 5.4 Run `npm run typecheck && npm test` from `resources/app/`.

## 6. Frontend — add-flow rate validation

- [x] 6.1 In `schemas/forms/exchange-rate-form.ts`, constrain the item rate in `ExchangeRateFormShape` via `CurrencyDraftSchema.extend({ exchange_rate: z.union([z.string(), z.number()]).refine((v) => Number(v) > 0, __('Exchange rate must be greater than 0', 'kirki-ecommerce')) })`; do not modify the shared `CurrencyDraftSchema`; keep `prepareFormSchema(...).transform()` terminal.
- [x] 6.2 Update `tests/schemas/forms/exchange-rate-form.test.ts` with a rejects-non-positive-rate case.
- [x] 6.3 Run `npm run typecheck && npm test` from `resources/app/`.

## 7. Frontend — provider config + "Sync now"

- [x] 7.1 Add `CURRENCY_EXCHANGE_SYNC: '/currency-exchange/sync'` to `resources/app/config/endpoints.ts`; add `syncCurrencyRates()` and `useSyncCurrencyRatesMutation()` to `services/currency.ts` (post to the endpoint via `parseMessage`; on success toast + invalidate `currencyKeys.all` and `settingsKeys.section('currency')`; on error `toastMutationError`).
- [x] 7.2 In `pages/api-config/api-config.tsx`: remove `disabled` from `<OptionAccordion>`; relabel `<Badge>Work in progress</Badge>` → `Manual sync only` (or drop); keep `<SwitchField name="is_automatic_update_enabled" disabled />` disabled and the form transform unchanged.
- [x] 7.3 Add a "Sync now" button, shown only when `selectedAPI && hasAPIConfiguration`, disabled while `useFormContext().formState.isDirty` with helper text; wire to `useSyncCurrencyRatesMutation`.
- [x] 7.4 Run `npm run typecheck && npm test` from `resources/app/`.

## 8. Frontend — "Last synced" indicator

- [x] 8.1 In `hooks/use-available-currency-list.ts` / `available-currency-list.tsx`, replace the `showApiProviderStatus` gate (`is_automatic_update_enabled === true`) with a "Last synced: %s" line shown whenever `api_provider` && `last_sync_at` exist; drop the `next_sync_at` "Next update" clause.
- [x] 8.2 Run `npm run typecheck && npm test` from `resources/app/`.

## 9. Verification & docs

- [x] 9.1 Full `cd resources/app && npm run typecheck && npm test`; `composer phpcs:wporg`; `composer test:integration` (or `composer test:docker:integration`).
- [ ] 9.2 Manual check (user; no browser tool per CLAUDE.md §0): add a currency (rate > 0 enforced); edit a rate inline (blank/0/negative reverts, valid persists on blur); toggle active; three-dot menu → "Set as default" / "Delete" each confirm before acting; configure a provider + key, Save, then "Sync now" — rates + "Last synced" refresh; bad key toasts the provider error; no-provider path 400s / button hidden.
- [x] 9.3 If any user-facing docs cover currency settings, update them in this change; otherwise note that none exist.

## Implementation notes (premise corrections)

- **3.2** `rightIcon`/`rightText` were computed by `buildCurrencyListItems` but never
  consumed by any component — removed along with the `IncreaseIcon` import.
- **5.1** Used a plain right-aligned `<Flex>` rather than `ActionGroup` for the
  row-action cluster. `ActionGroup`'s `data-action-group="true"` marker makes
  `StackedItem` hide its actions until hover / focus-within; with the always-visible
  inline rate input in the same cluster that split was inconsistent, so the switch +
  menu are always visible now. Dropped the `useStackedItem()` / `setOpen` wiring that
  only kept hover-hidden actions open while the menu was open.
- **6.1** Used `z.union([z.string(), z.number()]).nullish().refine(...)` rather than the
  non-nullish union in the task text: a strict union narrows `ExchangeRateFormInput` so
  it no longer accepts the add-flow's seed items (which carry an absent/`null`
  `exchange_rate` until the user types one), breaking `exchange-rate-dialog.tsx`
  typechecking. The `.refine` still rejects blank / `0` / negative.
- **7.2** Task premise was stale against the working tree: `<Badge>Work in progress</Badge>`
  and the `disabled` prop on `<OptionAccordion>` had already been removed; the `disabled`
  prop on `<SwitchField name="is_automatic_update_enabled">` had been commented out.
  Restored `disabled` on that SwitchField (the spec requires the auto-update toggle stay
  non-interactive) and deleted the dead `// disabled` comments.
- **8.1** The pre-change `showApiProviderStatus` gate also required
  `is_automatic_update_enabled === true` and `next_sync_at`; both were dropped, leaving
  `api_provider && last_sync_at`.
- **9.3** No `docs/<feature>.md` narrative doc for currency settings exists. Added the
  Bruno API-collection entry `docs/ecommerce/currency-exchange/sync-1.yml` for the new
  endpoint; `PUT /currencies` docs (`docs/ecommerce/currencies/edit-1.yml`) already show
  the partial-failure shape.
- **9.2** Left unchecked — manual verification is the user's to run (no browser tool per
  CLAUDE.md §0).
