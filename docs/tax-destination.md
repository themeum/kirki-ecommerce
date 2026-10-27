# Tax Destination

Every order records which address its tax was calculated from, in
`orders.tax_destination`. Tax can depend on a different address in each
country, so the order keeps the answer instead of leaving it to be guessed
later.

- [1. Quick start](#1-quick-start)
- [2. Values](#2-values)
- [3. Which address is used](#3-which-address-is-used)
- [4. Adding a country strategy](#4-adding-a-country-strategy)
- [5. Where this differs from WooCommerce](#5-where-this-differs-from-woocommerce)

---

## 1. Quick start

Nothing needs setting up. When an order is created or recalculated, the tax
calculation reports the address it used and the order stores it. Read it from
the `tax_destination` key of the order in the admin API, or the storefront
order API.

```json
{ "is_tax_inclusive": false, "tax_destination": "shipping" }
```

The value is `null` when no tax was calculated: tax calculation is off, the
store has no tax region for the country, or no address has a country.

---

## 2. Values

| Value | Meaning |
|-------|---------|
| `shipping` | The order's shipping address set the tax. |
| `billing` | The order's billing address set the tax. |
| `store` | The store's own address set the tax. |

The value is what the calculation really used. It is refreshed each time the
order is recalculated, so it always matches the tax amounts on the order.

---

## 3. Which address is used

The `tax.tax_destination` setting names the address: `shipping`, `billing` or
`store`. It defaults to `shipping`, and a missing or unknown value means
`shipping`. There is no screen for it yet. The cart calculation then picks the
address in this order:

1. The address the setting names, when it has a country.
2. Otherwise the store address (**Settings → General**), when it has a
   country. The value is `store`.
3. Otherwise no tax is calculated and the value is `null`.

The strategy for the chosen country may then report a different value. The EU
strategy does this for a **micro business**: it charges its own country's rate
to every shopper in the EU, so the store sets the tax and the order stores
`store`, whatever address the cart has. Under the **one-stop-shop** (OSS) the
shopper's country sets the rate, so it keeps the value it was given.

---

## 4. Adding a country strategy

A strategy extends `AbstractTaxStrategy`. It is built from its region settings
and a destination value. In `calculate()` it reads the address its tax is based
on with `$this->tax_address($context)`, and it reports the value
through `tax_destination()`.

- If the country's tax follows the destination the strategy was built for, do
  nothing. The default returns that value.
- If it does not, override `tax_destination()` and return the value of the
  address that really set the tax (`OrderTaxDestination::SHIPPING`, `BILLING`
  or `STORE`).
- Set `$result->tax_destination = $this->tax_destination();` on the result in
  `calculate()`.

The calculation context carries the shipping, billing and store addresses, so
a strategy can read any of them with `address_for()`. The decision rules always
get the real shipping and billing addresses, never the tax address under
another name. Other countries are not affected.

The strategy for an order is chosen from the country of the destination
address. A strategy can use another address for rates inside that country. A law that
needs the billing country to choose the strategy itself needs a change to the
factory first.

---

## 5. Where this differs from WooCommerce

- WooCommerce has a **Calculate tax based on** setting (shipping, billing or
  store base) in its settings screen. Here the `tax.tax_destination` setting
  exists, but there is no screen for it yet, and a country strategy can
  override it.
- WooCommerce does not save the choice on the order. Here it is saved in
  `tax_destination`.
- The default is the shipping address, and the store address is the fallback
  when it has no country.
- Orders created before this field existed have no value. The product was not
  released, so there is no backfill.
