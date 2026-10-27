## Context

`ApiConfig` renders the card with `OptionAccordion`, which is uncontrolled: `open` only
sets the initial state, and `expandable={false}` hides both the chevron and the body.
The card overrides the colors to a grey wrapper and a white body. The form payload sends
`is_automatic_update_enabled` only when a provider and an API key are also set. On the
server, `CurrencyExchange::is_automatic_update_active()` already requires the toggle, a
provider and an API key, and every scheduling path (listener, job, repair hook, Sync now)
checks it.

## Goals / Non-Goals

**Goals:**
- Toggle drives the visibility of the provider section.
- Chevron appears only while the toggle is on and controls the collapse state.
- Header white, body grey, provider card white.

**Non-Goals:**
- No change to the sync schedule or the provider API calls.
- No persistence of the collapse state (it is UI state only).
- No change to the API configuration dialog or the configured-provider card.

## Decisions

1. **Send the toggle value as it is.** The payload sends
   `Boolean(is_automatic_update_enabled)`. Otherwise a toggle turned on before an API key
   is saved would come back off after save, and the card would collapse and hide the
   provider the administrator just selected. The server guard keeps syncs off until the
   provider and key exist. Alternative (keep the client guard): rejected for that reason.
2. **Controlled open state in `OptionAccordion`.** Add an optional `onOpenChange` prop.
   When it is set, `open` is controlled: the accordion gets `value` and `onValueChange`
   and the item always has the value `option-item`. Without `onOpenChange`, the current
   uncontrolled behavior does not change, so other users of the component are not
   affected. Alternative (use `Accordion` directly in `ApiConfig`): rejected, because it
   copies the header layout of `OptionAccordion`.
3. **Expandable follows the toggle.** `ApiConfig` keeps `isExpanded` in local state,
   initialised from the saved toggle value. It passes `expandable={isAutomaticUpdateEnabled}`
   (no chevron, no body while off) and `open={isExpanded}` with `onOpenChange`. The switch
   handler sets the form value and sets `isExpanded` to the same value.
4. **Colors.** Remove the `cssOverride` that swaps the colors. Set the wrapper to
   `background.surface` and the body card to `background.surfaceAlt` with only a top
   border. The provider select trigger and the provider card keep their own white
   (surface) background.
5. **Footer copy.** Only state 1 changes its text (see the spec). The "provider without
   API key" message still says "below", because the administrator can see the provider
   after turning the toggle on.

### Correction during implementation

Decision 3 kept `isExpanded` with its initial value from the saved toggle. That value is
read once, at the first render, so the card would stay collapsed if the saved settings
reached the form after it, and a discard that turns the toggle back on would not reopen
it. `ApiConfig` keeps `isCollapsed` instead (initially `false`) and passes
`open={!isCollapsed}`. The card is open whenever the toggle is on, unless the
administrator collapsed it with the chevron; turning the toggle on clears `isCollapsed`.

## Follow-up decisions

6. **Remove the cache option completely.** It never had an effect. Remove the checkbox,
   `is_cache_enabled` from `ApiConfigSchema` (both form schemas), the catalog settings
   schema, `SettingResource`, the `SettingsUpdateRequest` rule and sanitizer, and the
   docs. A stored value stays in the option but is no longer returned; the next save of
   the currency settings writes `api_config` without it. Alternative (checkbox only):
   rejected, because the API would keep a field that does nothing.
7. **One-line footer copy.** Keep the five states and their order. Shorten the words,
   not the facts: every message still says the state, the relevant time, the error, and
   the next action. "Automatic" stays in the failure message, because only the
   automatic job records `last_sync_error`, and a "Sync now" failure does not. The
   footer keeps wrapping (no `nowrap` or ellipsis), so a long provider error is never
   cut off.
8. **Provider logos from the existing PNG files.** `get_icon()` already returns
   `resources/images/currency-exchange-providers/<id>.png`, and the providers query
   already returns that URL as `icon`. The user replaced `exchangeratesapi.png` with the
   ExchangeRate-API logo; `currencyapi.png` stays. The cards render
   `<img src={icon} alt="">` at 16px, and keep `FlagIcon` when a provider has no icon.
   Alternative (SVG files or inline components in `icons.tsx`, like `PaypalIcon`):
   rejected by the user; the PNG files are kept.

### Correction during implementation (provider logos)

Decision 8 assumed `get_icon()` already returned working URLs. It did not: the
framework's `resource_url()` drops `resources` for a path with a leading slash
(`path_join()` returns an absolute path unchanged), and `Application::base_url()` adds
no separator for a path without one. Both providers now call
`app()->base_url('/resources/images/currency-exchange-providers/<file>.png')`, the same
pattern as `PayPal.php` and `PaymentProvider.php`. The framework bug must be fixed
upstream in `themeum/framework`, not in `vendor/libraries/framework/src/`.

## Risks / Trade-offs

- [The toggle can be saved as on while no sync runs (no provider or no key)] → The footer
  shows the "no provider" or "not connected" message in that case, because those states
  come first in the footer order.
- [Turning the toggle off hides a configured provider] → Its values stay saved, and the
  footer still says "API connected. Automatic updates are off." with "Sync now".
- [A short message still wraps on a narrow screen] → Accepted; wrapping is better than
  cutting off facts.
- [Dependency on `redesign-available-currencies-panel`] → The "Sync status footer"
  requirement only exists in the main spec after that change is archived. Archive it
  before this change.
