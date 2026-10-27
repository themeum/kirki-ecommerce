## Context

`AnalyticsQueryService::money()` builds every Analytics money object with
`Money::prepare_amount_object_from_minor()`, which returns the shared
`MoneyDTO` (`raw`, `display`, `currency`). `MoneyManager::format()` makes
`display` from the store currency preferences (symbol, position, separators).
The frontend shows money through `formatMoney()` in
`features/analytics/lib/format.ts`, which returns `money.display`. The layout
(`lib/layout.ts`, `hooks/use-analytics-layout.ts`) is kept in local storage
under `kirki-ecommerce:analytics:layout`. Chart points are raw minor amounts
that the frontend formats with `createMinorFormatter` (tooltips) and
`createCompactMinorFormatter` (axes).

## Goals / Non-Goals

**Goals:**

- One place on the server makes the short text, with the same currency
  preferences as the long text.
- The format switch is instant and does not fetch again.

**Non-Goals:**

- Short text for chart points (tooltips stay long, axes stay as they are).
- A short format for counts (Orders, Items ordered) or percentages.
- Translatable unit letters.
- A server-side saved preference.

## Decisions

### `MoneyManager::format_short(Money $money)`

Next to `format()`, and it reads the same currency preferences. When the
absolute major amount is less than 1,000 it returns `format($money)`. Else it
picks the largest unit (`K` 1e3, `M` 1e6, `B` 1e9, `T` 1e12) that is not more
than the absolute amount, rounds `abs / unit` to one decimal, and moves to the
next unit when the result is 1,000 and a next unit exists. It formats the value
with `number_format()` with 1 decimal, or 0 decimals when the decimal is 0, and
the store separators. It puts the sign and the symbol in the same places as
`format()` does, so a negative amount reads the same way in both texts. The
`Money` facade docblock gets the `@method`.

*Alternative:* a protected method in `AnalyticsQueryService`. Rejected (user
choice): the manager owns money text, and the rule can be used again.

*Alternative:* `NumberFormatter` with compact notation. Rejected: the `intl`
extension is not always on the hosts of wp.org users, and it does not use the
store separators.

### `AnalyticsMoneyDTO extends MoneyDTO`

A new DTO with one more property, `short_display`. `AnalyticsQueryService::money()`
builds the `MoneyDTO` as now and returns an `AnalyticsMoneyDTO` with its
values and `short_display`. Only the Analytics responses change.

*Alternative:* add `short_display` to `MoneyDTO`. Rejected: every API that
returns money would change.

### `meta.amount_example`

`AnalyticsQueryService::meta()` adds `amount_example`, the money object of
20,345 in major units of the base currency (built from major, so currencies
with 0 or 3 decimals are correct). The sheet reads it from the `kpis` query,
which always runs because one key metric is always on. Before it loads, the
options show only their names.

*Alternative:* format the examples in the frontend. Rejected: the frontend
does not know the store separators and position, and the user wants the
backend to own the short text.

### Frontend: format in the layout, context for the readers

`AnalyticsLayout` gets `amounts: 'short' | 'long'`. `DEFAULT_LAYOUT.amounts`
is `'short'`, `StoredLayoutSchema` reads `amounts` as optional, and
`normalizeLayout` uses `'short'` when it is missing or unknown, so old saved
layouts keep their items. `useAnalyticsLayout` gets `setAmounts`. `reset`
already applies `DEFAULT_LAYOUT`.

The analytics money schema is `MoneyObjectSchema.extend({ short_display:
z.string() })`, used in place of `MoneyObjectSchema` in the Analytics catalog
schema only.

`formatMoney(money, format)` returns `short_display` or `display`. A small
`AmountFormatContext` (provided by the page from the layout) and a
`useMoney()` hook give the components the `format` and a helper that returns
`{ text, title }`, where `title` is the long text only in Short mode when it
differs. `HBarList` rows and the ranked lists take an optional `title`. The map
tooltip uses only the text. `lib/location.ts` takes the format as an argument.

*Alternative:* pass the format as a prop through `CARD_REGISTRY.render`.
Rejected: it would touch every card signature, and some readers are pure
helpers deep in the tree.

## Risks / Trade-offs

- [Old saved layouts switch to Short after the update] → This is the chosen
  default. The doc says so, and Long is one click away.
- [Fixed English letters in other languages] → Listed in "Where this differs"
  in `docs/analytics.md`.
- [Rounding at the edge of a unit] → Unit tests for 999,950, 999,949 and the
  `T` limit (amounts above 999.95T keep `T`, for example `$1500T`).
- [Float rounding in `number_format`] → Use the `Money` amount as a decimal
  string and `round(..., 1)` before the format, and test values such as
  20,350 (`$20.4K`, not `$20.3K`).

## Corrections during implementation

- **Key metric titles.** A key metric value is truncated `Text`, and `Text`
  already sets its `title` to its own text when it truncates. So in Long mode,
  and for a small amount in Short mode, a key metric has a title that is the
  same as its text, not "no title". The spec scenarios now say that the title
  is not a different amount. `Text` now keeps a `title` that the caller gives,
  so the long amount wins over the truncate title in Short mode.
- **Amounts inside a sentence.** The coupon detail ("$3.2K off") and the tax
  note ("Product … · Shipping …") follow the format but get no title, because
  the title of a whole sentence would not be one amount. The spec says so.
- **Key order.** PHP lists the properties of a child class first, so an
  Analytics money object has the keys `short_display`, `raw`, `display`,
  `currency`, in that order.
- **Other APIs scenario.** The test uses the dashboard overview, not an order
  API, as the other API that keeps the plain money object.
