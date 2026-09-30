## Why

The payment domain has two kinds of payment — **online** (gateway-backed:
PayPal, Stripe) and **offline** (manual: Cash on Delivery, Bank Transfer) —
but the code names them inconsistently and in several places contradicts
itself. `PaymentGateway` is a single class serving *both* kinds; offline
methods are persisted under a settings key literally named
`payment_gateways`; `orders` carries both a `payment_method` and a
`payment_gateway` column that are written the same value; and "gateway",
"method", and "manual" are used interchangeably across routes, services,
resources, and the admin UI. Every new payment feature has to re-learn which
word means which thing, and the settings-key collision makes the offline data
model actively misleading.

## What Changes

- **BREAKING** — `PaymentGateway` is renamed to `PaymentProvider`. It remains
  a single class covering both kinds, with `is_manual()` replaced by
  `is_offline()` and `from_manual()` by `from_offline()`. Every payment addon
  must update its `extends`.
- **BREAKING** — the registration hook `kirki_ecommerce_all_payment_gateways`
  becomes `kirki_ecommerce_payment_providers`. Addons must re-register.
- **BREAKING** — REST routes move: `/payment-gateways*` → `/online-payments*`,
  `/payment-methods*` → `/offline-payments*`. The webhook route parameter
  `{gateway_id}` becomes `{provider_id}`.
- **BREAKING** — the JSON field `is_manual` becomes `is_offline` on every
  payment payload (responses and offline create/update requests).
- **BREAKING** — the offline payment list moves from the `payment_gateways`
  key of the `payment` settings option to `offline_payments`. No backward
  compatibility shim; existing saved data is not migrated.
- **BREAKING** — `orders.payment_method` becomes `orders.payment_provider`,
  the redundant `orders.payment_gateway` column is **removed**, and
  `orders.invoiced_payment_gateway_fee` becomes
  `invoiced_payment_provider_fee`. The order API renames its `payment_method`
  field to `payment_provider` to match.
- Bundled PayPal moves from `app/Payment/Gateways/` to `app/Payment/Providers/`.
  Installable addons stay in the root `payments/` folder, unchanged.
- Services, controllers, requests, DTOs, resources, and their frontend
  counterparts are renamed to the `OnlinePayment*` / `OfflinePayment*` pair.
  Registry/manager methods use provider-centric names
  (`get_online_providers()`), while routes and resources use payment-centric
  names (`/online-payments`).
- No behavior changes: no new endpoints, no new payment implementations, and
  no change to the `is_available` / "Coming Soon" logic in the installable
  dialog. All user-visible `__()` strings keep their current wording.

## Capabilities

### New Capabilities

- `payment-providers`: the naming and classification contract for payment
  providers — the online/offline split, the addon extension point (base class
  + registration hook), the REST surface for each kind, the persisted settings
  key for offline providers, and how a placed order records which provider was
  used.

### Modified Capabilities

(none — no existing spec in `openspec/specs/` covers the payment domain)

## Impact

- **Extension point (breaking for addons):** `payments/kirki-stripe` must be
  updated in this change. Any third-party payment addon built against
  `PaymentGateway` or `kirki_ecommerce_all_payment_gateways` breaks and must
  be updated by its author.
- **Database:** `kirki_ecommerce_orders` — two columns renamed, one dropped,
  one index renamed. `Migrator::run()` does not record migration history (its
  `update_migrations()` call is commented out), so existing dev databases must
  be dropped and re-migrated by hand; there is no upgrade path and none is
  added.
- **Persisted options:** offline payments saved under the old
  `payment_gateways` settings key are orphaned. Acceptable — the plugin is
  unreleased 1.0.0 and the seeded data is placeholder.
- **PHP:** ~45 files across `app/`, `database/`, `routes/`, `tests/`.
- **Frontend:** ~20 files across `resources/app/` — 7 file renames plus
  schema, service, endpoint, query-key, and type updates. Response schemas
  stay lenient per `openspec/project.md`; no `.default()` is added to any
  previously-required field.
- **API docs:** `docs/ecommerce/payment-gateways/` and
  `docs/ecommerce/payment-methods/` are renamed and their URLs and example
  bodies updated.
- **Not addressed:** the three byte-identical payment resource classes stay
  duplicated, and `orders.is_manual` ("admin-created order") is deliberately
  untouched — it is unrelated to the provider `is_manual` being renamed.
