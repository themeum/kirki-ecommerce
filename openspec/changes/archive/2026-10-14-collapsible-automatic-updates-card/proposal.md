## Why

The Automatic Updates switch is disabled until a provider and an API key are saved, but
the provider selection and the API configuration are always visible below it. This
order is backwards: the administrator must configure a provider before the switch they
see first can be used. The card colors are also the reverse of the new design (grey
header, white body instead of a white header and a grey body).

## What Changes

- The Automatic Updates switch is always enabled. It turns the provider section on and
  off, and its value is saved as the administrator sets it.
- When the switch is off, the card is collapsed: only the header shows, with no chevron.
  The provider selection and the API configuration are hidden, but stay saved.
- Turning the switch on expands the card and shows a chevron. The chevron collapses
  and expands the card while the switch is on. Turning the switch off collapses it.
- The card header has a white background and the expanded body has a grey background.
  The provider card inside the body stays white.
- The "no provider" footer message of the available-currencies panel now tells the
  administrator to turn on Automatic Updates, because the provider selection is hidden
  while the switch is off.
- Automatic sync still runs only when the switch is on, a provider is selected and an
  API key is saved.
- **Follow-ups:**
  - The "Cache exchange rates to reduce API calls" option is removed: the checkbox, the
    `api_config.is_cache_enabled` field in the forms, the settings response and the
    update request. It never had an effect. A value that is already stored is ignored.
  - Each sync status footer message is shortened to fit on one line at the default
    panel width. No message loses a fact (state, time, error, next step). A long error
    text can still wrap.
  - The provider cards show each provider's own logo in place of the generic flag icon.
    The logos are the existing PNG files that `get_icon()` already returns. The
    ExchangeRate-API PNG is replaced (by the user) because it was the logo of a
    different service (exchangeratesapi.io).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `multi-currency-settings`: "Exchange rate provider and automatic updates are
  configurable" (switch always enabled, card collapses and expands with it, no cache
  option, provider logo) and "Sync status footer" (shorter one-line messages). The second requirement comes from
  `redesign-available-currencies-panel`, so archive that change first.

## Impact

- `resources/app/features/settings/multi-currency/pages/api-config/api-config.tsx`
- `resources/app/components/option-accordion.tsx` (optional controlled open state)
- `resources/app/features/settings/multi-currency/schemas/forms/multi-currency-settings-form.ts`
  and its payload test
- `resources/app/features/settings/multi-currency/lib/currency-list.tsx` and its test
- `resources/app/features/settings/multi-currency/pages/api-config/` (dialog, cards)
- `resources/app/features/settings/multi-currency/schemas/forms/api-configuration-form.ts`,
  `resources/app/schemas/catalog/settings.ts` and their tests
- `app/Resources/SettingResource.php`, `app/Http/Requests/Settings/SettingsUpdateRequest.php`
- `resources/images/currency-exchange-providers/exchangeratesapi.png` (new logo, supplied by the user)
- `docs/currencies.md`, `docs/ecommerce/settings/currency.yml`
- API: the currency settings response no longer has `api_config.is_cache_enabled`, and
  the update request no longer accepts it.
