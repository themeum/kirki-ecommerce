## Context

The `analytics-short-amounts` change added `MoneyManager::format_short()` and
an `AnalyticsMoneyDTO` (a `MoneyDTO` with `short_display`). Only
`AnalyticsQueryService::money()` builds that DTO. `DashboardService` builds its
money objects with `Money::prepare_amount_object_from_minor()`, which returns a
plain `MoneyDTO`. The Home cards read `display` from those objects. Recent
orders come from `OrderListResource`, which the Orders page also uses.

## Goals / Non-Goals

**Goals:**

- One server-side place builds a money object with `short_display`, for
  Analytics and for the dashboard overview.
- Home shows short amounts with the long amount as a native title tooltip.

**Non-Goals:**

- No Short/Long option on Home, and no link to the Analytics layout setting.
- No change to `OrderListResource` or to the Recent orders card.
- No change to the short rules. They stay in `format_short()`.

## Decisions

### Rename the DTO to `ShortMoneyDTO` and add `Money::to_short_dto()`

`AnalyticsMoneyDTO` becomes `ShortMoneyDTO` (same `short_display` property). A
new `MoneyManager::to_short_dto($minor_amount, $currency = null)` returns
`ShortMoneyDTO::from_array(array_merge($this->to_dto(...)->all(), ['short_display' => $this->format_short(...)]))`.
`AnalyticsQueryService::money()` calls it, and `DashboardService` calls it for
the two metric money objects and for `base_revenue_money_object`. The `Money`
facade gets an `@method` line.

- *Alternative:* use `AnalyticsMoneyDTO` in `DashboardService`. Rejected: the
  name then says "Analytics" for a dashboard value.
- *Alternative:* copy the `array_merge` code into `DashboardService`. Rejected:
  two copies of the same build step.

The rename is safe: the DTO is new in the uncommitted Analytics work, and only
`AnalyticsQueryService` uses it. The JSON key order stays
`short_display, raw, display, currency`.

### Home schema extends the shared money schema locally

`dashboard-overview.ts` defines
`DashboardMoneySchema = MoneyObjectSchema.extend({ short_display: z.string() })`
and uses it for the three money objects. It does not import the Analytics
schema, so the two features stay independent. `recent_orders` keeps
`OrderListItemSchema`.

### Title only when the texts are different

The metric card gets an optional `valueTitle` prop and passes it to its
truncated `Text` (which keeps a given title). The top products row sets
`title` on the revenue `Text` to the long sentence. Both set the title only when
`short_display !== display`, the same rule as Analytics Short mode. A small
helper in `features/home/lib/money.ts` gives `{ text, title }` for a money
object, so the two cards use the same rule.

## Risks / Trade-offs

- [The Home revenue sentence is "{amount} generated". Translators see the same
  string with a short or long amount.] → The `%s` placeholder already takes any
  amount text. The translator comment says "with currency", which is still
  true.
- [An API client that reads the overview gets one more key.] → The change is
  additive. Existing keys keep their values.
