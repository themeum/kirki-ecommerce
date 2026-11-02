## Context

See proposal.md — Why. Current state of the code:

- `CurrencyService` has four paths that change the base: `update()` (used by
  `PUT /currencies`, the admin "Set as default" action and the exchange-rate sync),
  `create()` / `insert()` (`POST /currencies`), `ensure_base()` (onboarding) and
  `set_base()` (no caller today). All except `set_base()` go through
  `with_demoted_bases()`, which opens a transaction, clears `is_base` on every row and
  runs a save callback.
- Only `ensure_base()` writes `exchange_rate = 1`. The others store the rate from the
  request, or keep the stored rate.
- `CurrencyController::update()` applies the `items` of one request one by one, in
  request order, each through `CurrencyService::update()`.
- The admin "Set as default" action (`buildCurrencyUpdatePayload()` in
  `resources/app/features/settings/multi-currency/lib/currency-list.tsx`) sends the
  full list, with the stored rates of all rows, and moves `is_base` to the chosen row.
- `exchange_rate` is `decimal(15,6)`; the model casts it to `float`. Conversion
  multiplies a base amount by the target currency's rate
  (`MoneyManager::convert_to_currency()`).

## Goals / Non-Goals

**Goals:**

- One place computes the recalculation, and every base-change path uses it in the
  same transaction as the flag change.
- The base rate is 1 after every write.
- The admin UI cannot overwrite recalculated rates with old ones.

**Non-Goals:**

- Widening `exchange_rate` past 6 decimals (separate change; see Risks).
- Fetching fresh rates from the exchange-rate provider after a base change.
- Changing stored product, cart or order amounts. They stay `base_*` amounts and are
  read in the current base, as today.

## Decisions

### 1. Recalculate inside `with_demoted_bases()`

`with_demoted_bases(callable $save, $previous_rate = null)` gets a second argument:
the new base's rate against the current base. Inside the transaction, before it
demotes the old base:

1. If a base currency exists and `$previous_rate > 0`, every stored currency gets
   `exchange_rate = round(exchange_rate / $previous_rate, 6)`.
2. Demote all bases (as today).
3. Run `$save`, which writes the new base with `exchange_rate = 1`.

The step is a PHP loop over `Currency::all()` with one `update()` per row. A store has
few currencies, and the loop needs no raw SQL from the framework query builder.

Each caller passes the rate it knows:

| Path | `$previous_rate` |
| --- | --- |
| `update()` | stored `exchange_rate` of the currency being promoted (not the request value) |
| `create()` | `exchange_rate` of the request |
| `insert()` | `exchange_rate` of the one item flagged `is_base` |
| `ensure_base()` | stored rate when the currency exists; `null` when it is created |
| `set_base()` | stored rate; the method moves onto `with_demoted_bases()` so it is atomic too |

Alternative considered: the UI computes the new rates and sends them in the full-list
request. Rejected: other API clients and onboarding would not get the recalculation,
and the server is the source of truth for rates.

Alternative considered: recalculate after `$save`. Rejected: the loop would then also
divide the rates of rows the same request just wrote (for example the other items of
an `insert()`), which are already relative to the new base.

### 2. The stored rate is the factor for `update()`

`update()` uses the rate in the database, not the request value. The UI sends the
stored rate anyway, and the database value is the one the other rates are relative
to. The request value for the base row is ignored: the base is written with 1.

### 3. The base row is always written with rate 1

`update()` sets `$attributes['exchange_rate'] = 1` when the currency was the base or
becomes the base. `create()` and `insert()` do the same for the item flagged as base.
This keeps the "Base currency rate is fixed" behavior true on the server, not only in
the UI.

### 4. Items in one request apply in order

The controller is not changed. A full-list `PUT /currencies` that makes a currency the
base and then sends other rows with explicit rates stores those rates as sent. This is
the documented contract (spec: "Rates sent in the same request after the base
changes"). The server cannot tell if a sent rate is against the old base or the new
one, so it does not guess.

### 5. "Set as default" sends only the new base row

`buildCurrencyUpdatePayload(list, item, 'is_base')` returns
`{ items: [toCurrencyDraft({ ...selected, is_base: true })] }`. The server demotes the
old base itself (`test_single_row_request_setting_new_base_leaves_exactly_one_base`
covers this). The list refetches on success, so it shows the new rates.

## Risks / Trade-offs

- [Precision loss against a weak base] With 6 decimals, a change to a base such as VND
  gives rates such as 0.000037 for EUR (approx. 0.5% error), and each further base
  change adds rounding error. → Documented in `docs/currencies.md`; the administrator
  can enter rates again or run a provider sync. A wider column is a separate change.
- [A rate rounds to 0] A ratio above 2,000,000:1 rounds to 0.000000. → Not handled in
  this change; outside real currency pairs for the bundled list except extreme cases.
  Documented with the precision limit.
- [Onboarding with a new currency] When setup creates the selected currency, there is
  no rate to divide by, so the other rates stay as they are (relative to the old
  base). → Same as today; the spec states it. A provider sync fixes the rates.
- [API response differs from the request] A client that sends a non-1 rate for the
  base gets 1 back. → Intended; the spec states it.

## Migration Plan

No data migration. Stores that already changed the base keep their current rates; the
administrator can correct them by hand or with a sync. Rollback is a code revert.
