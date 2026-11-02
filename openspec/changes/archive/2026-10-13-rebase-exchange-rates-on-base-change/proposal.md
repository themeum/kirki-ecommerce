## Why

Each stored exchange rate means "units of this currency per 1 unit of the base
currency". When an administrator changes the base currency, the store only moves the
`is_base` flag. The new base keeps its old rate (not 1), and every other rate stays
relative to the old base. Prices that the storefront converts with these rates are
then wrong until somebody enters all rates again by hand.

## What Changes

- When a currency becomes the base, its exchange rate SHALL be set to 1.
- In the same operation, every other stored currency's rate SHALL be recalculated
  against the new base: `new_rate = old_rate / previous_rate_of_new_base`. The
  previous base becomes `1 / previous_rate_of_new_base`.
- The recalculation applies to every path that changes the base: "Set as default"
  (`PUT /currencies`), onboarding store setup, and creating a currency as base
  (`POST /currencies`).
- A currency that stays the base always keeps a rate of 1, also when a request sends
  a different rate for it.
- The admin "Set as default" action sends only the row of the new base, so the
  old rates of the other rows cannot overwrite the recalculated rates.
- The `exchange_rate` column stays `decimal(15,6)`. The precision limit after a
  change to a weak base currency is documented, not fixed, in this change.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `multi-currency-settings`: "Set as default" now recalculates all exchange rates
  against the new base and fixes the base rate at 1; the update request for that
  action carries only the new base row.
- `store-setup`: making the selected currency the base during setup recalculates
  the rates of the other stored currencies when the selected currency already
  exists with a known rate.

## Impact

- `app/Services/CurrencyService.php` — `update()`, `create()`, `insert()`,
  `ensure_base()`, `with_demoted_bases()`; `set_base()` also changes the base and
  gets the same behavior.
- `resources/app/features/settings/multi-currency/lib/currency-list.tsx` —
  `buildCurrencyUpdatePayload()` for `is_base`, plus its test.
- `tests/Integration/CurrencyApiTest.php` — new rate assertions for base changes.
- API: `PUT /currencies` and `POST /currencies` responses can now show rates that
  differ from the sent values (base forced to 1). No new fields. Not breaking for the
  admin UI.
- Docs: new `docs/currencies.md`; `docs/onboarding.md` step 4 updated.
- No schema change, no new dependency.
