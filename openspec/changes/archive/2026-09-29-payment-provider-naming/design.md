## Context

See proposal.md — Why. The state that shapes the approach:

- `app/Payment/PaymentGateway.php` is one class for both kinds. `::make()`
  builds online providers, `::from_manual()` builds offline ones, and
  `is_manual()` discriminates. It is also the public extension point:
  `payments/kirki-stripe/src/Stripe.php` does `extends PaymentGateway` and
  registers via `add_filter('kirki_ecommerce_all_payment_gateways', …)`.
- Offline providers are not a table. They live as an array inside the
  `payment` settings option, under the key `payment_gateways`, and are
  writable through *two* surfaces: `/payment-methods` and
  `/settings/payment` (`SettingsUpdateRequest.php:368-387`).
- `orders` has both `payment_method` and `payment_gateway`.
  `CreateOrderAction.php:198-199` writes the same value into both;
  `CreateRefundAction.php:45` is the only reader of `payment_gateway`.
- `Migrator::run()` never records migration history — its
  `update_migrations()` call is commented out
  (`libraries/framework/Database/Migrations/Migrator.php:69`). Migrations
  re-run on every boot, so there is no place to host a one-shot data
  migration and no "has this upgrade run?" record to build one on.
- `orders.is_manual` exists and means "admin-created order" — an entirely
  separate concept from provider `is_manual`.

## Goals / Non-Goals

**Goals:**

- One vocabulary end-to-end, so a reader never has to work out whether
  "gateway", "method", or "manual" is meant.
- Keep the diff mechanical and reviewable: this is a rename, and every changed
  line should trace to it.
- Leave the addon extension point coherent after the break — a single base
  type and a single hook, both named for what they actually cover.

**Non-Goals:**

- No behavior change. Same endpoints (renamed), same payloads (renamed
  fields), same availability logic.
- No consolidation of the duplicate resource classes, and no fix for the
  broken migration-history mechanism. Both are flagged, not fixed.
- No backward-compatibility layer of any kind — no legacy route aliases, no
  legacy hook, no legacy settings-key fallback.

## Decisions

### 1. One base class named `PaymentProvider`, not a subclass split

Both online and offline payments stay a single class discriminated by an
`is_offline` flag.

*Alternative considered:* split into `OnlinePayment` / `OfflinePayment`
subclasses and delete the boolean, letting the type carry the classification.
Rejected — it is the cleanest model but turns a rename into a redesign, and
addons would have to re-target `extends OnlinePayment` for a benefit no
consumer currently needs. The flag is read in exactly a handful of places.

*Alternative considered:* keep the name `PaymentGateway` and rename only the
application layer. Rejected — "gateway" is precisely the word that means
"online" everywhere else in the domain, so keeping it on the shared base is
what caused the confusion in the first place.

`PaymentProvider` was chosen over reusing `PaymentMethod` because "payment
method" is being retired as a term for offline payments; recycling it as the
generic base would leave the old meaning half-alive.

### 2. Two vocabularies, applied by layer

Registry, manager, facade, and service methods are **provider-centric**
(`get_online_providers()` returns `PaymentProvider[]`). Routes, resources, and
frontend files are **payment-centric** (`/online-payments`,
`OnlinePaymentResource`).

This is deliberate rather than sloppy: a method returning `PaymentProvider[]`
should say "providers", while the REST surface and the settings UI are about
*payments* as the user thinks of them. The seam is the service/controller
boundary — `OnlinePaymentService` (payment-centric name) internally calls
`Payment::get_online_providers()` (provider-centric).

### 3. Break the extension point rather than dual-register

The hook becomes `kirki_ecommerce_payment_providers` with no fallback to the
old name.

*Alternative considered:* apply both filters during a deprecation window.
Rejected — the base class is already renamed, so an addon registering through
the legacy hook would hand back an instance of a class that no longer exists.
A partial compatibility shim would fail at a confusing place instead of
failing loudly at the obvious one. `kirki-stripe` is updated in this change;
the plugin is unreleased, so no third-party addon exists to protect.

### 4. Drop `orders.payment_gateway` rather than rename it

`payment_method` becomes `payment_provider` and the duplicate column is
removed, with `CreateRefundAction` repointed at `payment_provider`.

*Alternative considered:* rename both and keep the redundancy. Rejected —
under the new naming there is no honest pair of names for two columns holding
the same provider id, and preserving the duplication would carry forward the
exact ambiguity this change exists to remove. The column has one reader and
one writer, so the collapse is contained.

### 5. No data migration for the settings key

`payment_gateways` → `offline_payments` with no read-time fallback and no
upgrade routine.

*Alternative considered:* a read-time fallback in `OfflinePaymentService`.
Rejected — it is a permanent shim for a pre-release schema, and it would only
half-work, since `/settings/payment` writes the same list through a second
path. *Alternative considered:* a version-gated upgrade routine. Rejected —
there is no working "has this run?" record to gate it on (see Context), so
building one is a larger change than the rename itself.

Consequence: existing dev installs lose their configured offline payments and
must re-seed. Accepted; the seeded data is placeholder (`"id": "fdsf"`).

### 6. `is_offline` stays in request payloads

Offline create/update still accept `is_offline` even though the route already
implies it, matching today's shape 1:1.

*Alternative considered:* drop it from requests and have the service set it.
Rejected for this change — it is a contract change beyond a rename and would
pull the offline form's `.transform()` into scope. Left as a follow-up.

### 7. Ordering: domain first, then callers, then contracts

Rename in dependency order so the tree is never broken for long — core
(`app/Payment/`) → addon → services/controllers/resources → routes →
orders/DB → frontend → docs/tests. Each group ends with
`npm run typecheck && npm test` per `openspec/config.yaml`.

## Risks / Trade-offs

- **A stale reference to a renamed symbol survives and only fails at runtime**
  → PHP has no compile-time check here. Mitigated by a repo-wide grep gate in
  the verification step asserting zero hits for `PaymentGateway`,
  `ManualPayment`, `PaymentMethod`, `payment_gateways`, `get_gateway`,
  `payment-gateways`, `payment-methods`, and `all_payment_gateways` outside
  `libraries/framework/`, `vendor/`, `node_modules/`, and `__()` strings —
  plus `php -l` on every touched file.

- **`orders.is_manual` gets swept into the `is_manual` → `is_offline` rename**
  → it is a different concept in the same table. A blanket search-and-replace
  on `is_manual` would silently corrupt admin-created-order handling. Mitigated
  by never replacing `is_manual` globally: each occurrence is changed by hand,
  and the grep gate excludes `orders.is_manual` explicitly.

- **Existing dev databases break on the orders column changes** → migrations
  re-run every boot but `Schema::create` will not alter an existing table, so
  a stale `kirki_ecommerce_orders` keeps the old columns and every order query
  fails. Mitigated by dropping and re-migrating the orders table as an explicit
  verification step, called out rather than assumed.

- **Visible product text drifts** → the same words being renamed in code
  ("Payment gateways", "Manual payment methods") are also on screen and must
  not change. Mitigated by treating every `__()` argument as off-limits; the
  only string touched is wrapping the bare `Coming Soon` literal in `__()`,
  which changes no wording.

- **Frontend response schemas get "improved" while being renamed** →
  `openspec/project.md` requires catalog schemas stay lenient and forbids
  adding `.default()` to previously-required fields. Mitigated by renaming
  identifiers only, leaving every `.nullish()`/`.passthrough()` as-is.

## Correction during implementation

**The baseline was already red before this change started.** `npm run
typecheck && npm test` in `resources/app/` at the pre-change commit reports:

- 1 typecheck error in
  `pages/settings/multi-currency-settings/add-currency-dialog.tsx:80` (a
  `CurrencyDraftSchema` input-type mismatch).
- 4 failing tests, in `schemas/catalog/currency.test.ts`,
  `schemas/forms/add-currency-popup-form.test.ts`,
  `schemas/forms/exchange-rate-form.test.ts`, and
  `schemas/forms/multi-currency-settings-form.test.ts`.

All five are multi-currency; none touch the payment surface. The verification
steps in tasks.md say "clean", which is not achievable and was written on the
assumption of a green baseline. The real pass criterion for this change is
**exactly this set still failing and nothing new added** — 4 failed / 276
passed, one typecheck error, in that one file. These are pre-existing and are
not fixed here; they are unrelated to the rename and fixing them would violate
the surgical-change rule.

**Task 6.2's premise was half wrong.** It said `PaymentSettingsSchema` types
its list with `PaymentGatewaySchema` even though the list holds offline
methods, and to simply repoint it at `OfflinePaymentSchema`. The entity call
was right, but the reason the *online* schema was there in the first place was
not an oversight: `PaymentGatewaySchema.id` is optional, and the offline
entries embedded in `GET /settings/payment` genuinely have **no `id`** (see
`docs/ecommerce/settings/payment.yml` and the `settings.test.ts` case named
"including gateways with no id"). `OfflinePaymentSchema.id` is required,
because the `/offline-payments` list UI uses it for React keys and for its
update/delete calls. A straight repoint broke that test.

Resolved by adding `OfflinePaymentSettingsSchema` — `OfflinePaymentSchema`
with `id` made optional — and using it only for the settings-embedded list.
This loosens rather than tightens, so it stays inside the response-schema rule
in `openspec/project.md`, and it keeps `/offline-payments` strict where the UI
depends on `id`.

**A component name collided with a type name.** Naming the offline list
component `OfflinePayment` clashed with the imported
`OfflinePayment` type and broke the `displayName` expando assignment
(`TS2339`). Renamed to `OfflinePaymentComponent`, matching the existing
`OnlinePaymentComponent` on the online side.

**The repo-wide grep gate earned its place.** Per-directory greps came back
clean while `payments/kirki-stripe/src/Stripe.php:586` still called
`OrderManager::set_payment_gateway_fee()` — renamed in task 5.3. Only the
final cross-directory sweep caught it. Left unfixed it would have been a fatal
`Error: Call to undefined method` on every successful Stripe charge, in the
fee-recording path, which no test covers.

**`SettingsSeeder` was not run against the dev database.** The migration plan
below calls for it, but it rewrites all seven settings sections, not just
`payment` — running it to fix one renamed key would have destroyed the
developer's general/shipping/tax/checkout/currency configuration. Verified the
schema against the integration test database instead (rebuilt per run), and
confirmed read-only that the dev install's `payment` option still holds one
orphaned entry under the legacy `payment_gateways` key with `offline_payments`
unset — precisely the consequence Decision 5 accepted.

## Migration Plan

1. Rename in the order given in Decision 7.
2. Drop `kirki_ecommerce_orders` in the dev database and let the boot migrator
   recreate it with `payment_provider`.
3. Re-run `SettingsSeeder` so the `payment` option carries `offline_payments`.
4. Confirm `Payment::get_provider('stripe')` resolves with `kirki-stripe`
   active, proving the renamed hook and `extends PaymentProvider` still wire up.

**Rollback:** revert the branch. There is no forward data migration to undo —
the only persisted casualties are the orphaned `payment_gateways` settings key
and the dropped orders column, neither recoverable and both accepted above.
