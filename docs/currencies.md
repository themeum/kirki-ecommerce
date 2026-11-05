# Currencies and Exchange Rates

The currencies a customer can shop in, and the rates the store uses to convert
prices into them. Every price, cart and order amount is stored in the **base
currency**; the other currencies are only display conversions computed from their
exchange rate.

This page covers what a rate means, what happens to the rates when the base
currency changes, how rates update automatically, and the limits of the stored
precision.

- [1. Quick start](#1-quick-start)
- [2. What an exchange rate means](#2-what-an-exchange-rate-means)
- [3. Changing the base currency](#3-changing-the-base-currency)
- [4. The currencies API and request order](#4-the-currencies-api-and-request-order)
- [5. Automatic updates](#5-automatic-updates)
- [6. Precision](#6-precision)
- [7. Where this differs from WooCommerce](#7-where-this-differs-from-woocommerce)

---

## 1. Quick start

Go to the **Currency** settings page. The "Available Currencies" list shows every
stored currency, base first. Each row shows the currency symbol, code and name.

- **Add Currency** opens a two-step dialog. Step 1, **Select Additional Currencies**,
  lets you search and tick the currencies to add, then click **Next**. Step 2,
  **Set Exchange Rates**, shows one rate input per selected currency ("rates per 1"
  base currency). Every rate must be greater than 0, or **Save** is refused. **Save**
  adds the currencies to the list with those rates, and you can still edit a rate in
  the list before saving the page. The catalog returns a `flag` for each currency,
  taken from the region in its locale (empty when unknown); the dialog shows it
  before the code. On a store with no currencies, the first one
  becomes the base.
- The base row has a **Base Currency** badge and rate 1.00. It cannot be edited,
  deactivated or deleted.
- Each other row shows its rate. Hover over or focus the row to show an inline rate
  input and a three-dot menu with **Activate** or **Deactivate**, **Set as Base
  Currency** and **Delete**. An inactive row has an **Inactive** badge, grey text,
  and shows its rate only on hover.
- **Sync now**, in the list header, pulls fresh rates for all currencies from the
  configured exchange-rate provider. It shows only when there is more than one
  currency.
- The **Automatic Updates** switch syncs the rates in the background at the update
  frequency you choose (see section 5).

With more than one currency, the last row of the list tells you how rates update:

| Footer message starts with | Meaning |
| --- | --- |
| "Rates are updated manually." | No provider is selected. Turn on **Automatic Updates** to select one. |
| "<Provider> is not connected." | The provider has no API key yet. |
| "API connected, automatic updates off." | The provider works, but only **Sync now** updates rates. |
| "Automatic updates on." | Automatic updates are on. It shows the last sync and the next sync. |
| "Automatic sync failed" (orange) | The last automatic sync failed. The rates did not change; the message shows the error and when the sync tries again. |

## 2. What an exchange rate means

A currency's rate is **how many units of that currency equal 1 unit of the base
currency**. With USD as the base:

| Currency | Rate | Meaning |
| --- | --- | --- |
| USD (base) | 1 | 1 USD = 1 USD |
| EUR | 0.5 | 1 USD = 0.5 EUR |
| GBP | 0.25 | 1 USD = 0.25 GBP |

A display price is the base amount multiplied by the rate: a 10 USD product shows as
5 EUR. The base currency's rate is always 1. The store writes 1 for it whatever rate a
request sends.

## 3. Changing the base currency

When a currency becomes the base, all stored rates must be relative to it. The store
does this in the same database transaction as the base change:

1. Every stored rate is divided by the **previous rate of the new base**, and rounded
   to 6 decimal places.
2. The new base gets rate 1, and the old base stops being the base.

Choosing **Set as default** on EUR in the table above gives:

| Currency | Before | After | Calculation |
| --- | --- | --- | --- |
| EUR (new base) | 0.5 | 1 | 0.5 / 0.5 |
| USD (old base) | 1 | 2 | 1 / 0.5 |
| GBP | 0.25 | 0.5 | 0.25 / 0.5 |

This applies to every way the base changes:

- **Set as default** on the Currency settings page (`PUT /currencies`).
- **Creating a currency as the base** (`POST /currencies` with `is_base: true`). The
  rate sent for it is read as its rate against the current base. With no current
  base there is nothing to recalculate, and it is stored at rate 1.
- **Store setup** in onboarding (see [`docs/onboarding.md`](onboarding.md)). If the
  selected currency is already stored, its stored rate is used. If setup creates it,
  there is no previous rate, so the other rates stay unchanged; enter them again or
  run **Sync now**.

Stored product, cart and order amounts do **not** change. They are read in the new
base currency from then on.

## 4. The currencies API and request order

`PUT /currencies` takes an `items` list and applies the items **one at a time, in
request order**. If one item makes a currency the base and a later item sends a rate
for another currency, that later rate is stored as sent; the server does not know if
it was meant against the old base or the new one.

To change the base without that risk, send only the new base row, as the admin UI
does:

```json
{
  "items": [
    { "id": 2, "code": "EUR", "name": "Euro", "symbol": "€", "exchange_rate": 0.5, "is_base": true, "is_active": true }
  ]
}
```

The server demotes the old base itself. For an existing currency it divides by the
**stored** rate, not by the `exchange_rate` in the request.

## 5. Automatic updates

Turn on the switch in the **Automatic Updates** card header. The card opens and shows
the provider selection. Select a provider, add its API key and an update frequency
(every 15 or 30 minutes, every 1, 6 or 12 hours, or daily), and save.

- **The switch shows the provider section.** While the switch is off, the card is
  collapsed and has no chevron. When you turn it on, the card opens and a chevron lets
  you collapse and expand it. Turning the switch off hides the provider and API key, but
  does not delete them.
- **Syncs need a provider and an API key.** You can save the switch as on before you add
  them, but no automatic sync runs until both are saved.
- **Each provider keeps its own configuration.** The settings store the API key and
  update frequency of each provider in `api_configs`, keyed by provider id. There is no
  separate `api_config`: the sync uses `api_configs[api_provider]`. When you select
  another provider, the page shows that provider's configuration. A provider with no API
  key shows **Configure** and an empty dialog. Values that you enter for a provider stay
  on the page until you save or discard, also when you select another provider in
  between. Clearing the provider and saving keeps all configurations.
- **A save merges `api_configs` per provider.** Each provider entry that a save sends
  replaces that provider's stored entry. Providers that the save does not send keep
  their stored entry. Only `api_key` and `update_frequency` are stored; other fields are
  dropped.

- **The save does not wait for the provider.** A background job syncs the rates soon
  after the save, then queues the next sync one interval later. The time of that next
  run is stored as `next_sync_at`.
- **Only a change to the switch, provider, API key or frequency restarts the
  schedule.** A save that changes only, for example, the decimal separator leaves the
  next run where it is.
- **Sync now restarts the schedule** when automatic updates are on: the next automatic
  sync runs one interval after the manual one, whether the manual sync succeeds or
  fails.
- **A failed sync keeps the current rates.** The error and its time are stored as
  `last_sync_error` and `last_sync_error_at`, and the next run is still queued. The
  next successful sync, automatic or **Sync now**, clears them. A failed **Sync now**
  shows its error in a toast and does not store it.
- **Sync times are stored in UTC** (`last_sync_at`, `next_sync_at`,
  `last_sync_error_at`, as `Y-m-d H:i:s`). The footer reads them as UTC and shows them
  relative to the viewer's clock.
- **A stopped schedule repairs itself.** Once a minute, the queue's maintenance run
  checks the schedule. If automatic updates are on and `next_sync_at` is empty or more
  than one interval in the past, it starts a new schedule.
- **Turning the switch off** clears `next_sync_at`. A run that is still queued does
  nothing when it starts.

`last_sync_at`, `next_sync_at`, `last_sync_error`, `last_sync_error_at` and `usage`
are written only by the sync. `PUT /settings` ignores them for the `currency` key.

## 6. Precision

Rates are stored with **6 decimal places** (`decimal(15,6)`). This is enough for most
pairs, but a change to a base with a low unit value (for example VND or IDR) gives
very small rates that lose precision:

- EUR against a VND base is approx. 0.92 / 25000 = 0.0000368, which is stored as
  0.000037, an error of approx. 0.5%.
- Each further base change rounds again, so the errors add up.
- A rate below 0.0000005 is stored as 0.

After a change to such a base, check the rates or run **Sync now** to get them from
the provider again.

## 7. Where this differs from WooCommerce

- **WooCommerce core has one store currency and no exchange rates.** Changing it under
  **WooCommerce → Settings → General** changes only the symbol and format; prices are
  not converted. Multi-currency needs an extension, and each extension has its own
  rate model.
- **Here, changing the base recalculates the stored rates** but, like WooCommerce,
  does not convert stored prices. A product priced 10 in USD reads as 10 EUR after EUR
  becomes the base.
- **Rates have a fixed precision of 6 decimal places** (see section 6). There is no
  per-currency rounding or price-charm rule (for example "round to .99").
- **No rate history.** The previous rates are not kept after a base change or a
  sync; only the current rate is stored.
- **Automatic updates run on WP-Cron.** WordPress runs scheduled work only when the
  site gets a request, so on a site with little traffic a sync can start later than
  `next_sync_at`.
- **A failed sync waits a full interval before it tries again.** With a daily
  frequency, a short provider outage can leave the rates one day old. Use **Sync now**
  to try again at once.
- **No fallback-behaviour option.** A failed sync always keeps the last known rates;
  the store never resets the rates to the base currency.
- **No rate caching.** Each sync calls the provider. There is no option to cache
  the rates.
- **A saved provider configuration cannot be deleted from the page.** Selecting another
  provider or clearing the provider keeps it. To remove a key, select that provider,
  enter a new key, and save.
