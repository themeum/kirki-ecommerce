## Why

`zod-first-type-declarations` closed the request side everywhere and the response side for 14 of 19 services, explicitly deferring the other 5 (`currency`, `payment`, `settings`, `shipping`, `tax`) to a follow-up because they needed entity shapes derived from `docs/ecommerce/*.yml`. This is that follow-up. Those 5 are exactly the settings family: every one of them still returns an unchecked `unwrapData<T>()` cast, with `T` coming from the hand-written `types/entities/settings.ts` (239 lines) and `types/entities/currency.ts` — the last two entity files still declaring shapes rather than re-exporting a schema's inferred type.

Because nothing checks them, they have already drifted from the API they claim to describe:

- `getDefaultSettings()` is typed `SettingsSectionData`, but `/app-config` returns `{ name, version, current_user, base_currency }` — a different resource entirely. Only `base_currency` is real; every other field a caller reads off it is `undefined` at runtime and `string | undefined` at compile time.
- `/settings/currency` returns `last_sync_at`, `next_sync_at`, and `usage`; none exist in `SettingsSectionData`.
- `/settings/payment` gateways carry no `id`, and `config` arrives as `[]` (PHP's empty associative array), while `PaymentGateway` declares `id` required and `config` an object.
- `getPaymentGateways()` already needs `unwrapDataList` to survive the endpoint returning an object keyed by gateway id — the pre-existing crash recorded in `project.md` (Known pre-existing issues) that makes `/settings/payments` unreachable.

Every one of these is the failure mode the `api-response-validation` capability exists to prevent: a response type asserted rather than derived, so the mismatch surfaces as a blank page or a `.map is not a function` instead of a reported validation error.

## What Changes

- **Response schemas for the 5 deferred services.** New `schemas/catalog/{shipping,tax,payment,currency,app-config,settings}.ts`, derived from the documented 200 bodies in `docs/ecommerce/` cross-checked against today's entity types. Where the two disagree the docs win, and entity-only fields survive as optional rather than being dropped.
- **`services/{settings,shipping,tax,payment,currency}.ts` switch to `parseData`/`parseResponse`/`parseMessage`**, following `services/customer.ts`. This closes the last gap in the `api-response-validation` capability: all 19 services then validate.
- **Settings reads become per-section.** A `SettingsSchemaMap` keyed on `SettingsSectionKey` mirrors the existing `SettingsPayloadMap`, so `useSettingsQuery('general')` returns `GeneralSettings` instead of the all-optional union. This removes three casts and one intersection hack at call sites (`shipping-rules.tsx`, `api-config.tsx`, `edit-region-eu.tsx`, `create-product.tsx`) rather than renaming them.
- **`getDefaultSettings()` gets its real type.** It parses a new `AppConfigSchema` instead of claiming to return settings.
- **The `/settings/payments` crash is fixed as a consequence.** The object-keyed-map coercion moves from `unwrapDataList`'s untyped fallback into a `z.preprocess` in front of the gateway schema, so the shape is normalized *and* validated.
- **Remaining mutation payloads get derived types.** `Record<string, unknown>` on the shipping/tax/payment mutations is replaced by the `XFormPayload` types those call sites already produce.
- **BREAKING** — `types/entities/settings.ts` and `types/entities/currency.ts` are deleted, along with `CurrencyFormData` (the last surviving `*FormData` type, kept back in `zod-first-type-declarations` task 6.6 precisely because `currency` was out of scope). `types/index.ts` re-exports the same names from `@/schemas/catalog/*`, so its 182 importers are untouched.

Out of scope: tightening any existing schema's leniency, and the `orders`/`default` settings sections (no endpoint, no caller).

## Capabilities

### New Capabilities

None. This change completes existing behavior rather than introducing new behavior.

### Modified Capabilities

- `api-response-validation`: The capability's requirements are already written to cover every operation, but were adopted with 5 services knowingly outside coverage. This change adds the requirement that a response schema's shape be traceable to the documented API contract, and that a settings read be typed by its section rather than by a union of all sections — the two properties that make "responses are validated" meaningful rather than nominal for this family.

## Impact

**Code:** 6 new files in `resources/app/schemas/catalog/`; the 5 services above; `resources/app/types/index.ts` plus deletion of 2 files in `resources/app/types/entities/`; ~20 call sites, concentrated in `resources/app/pages/settings/` with three outside it (`contexts/app-config-context.tsx`, `pages/products/create-product/create-product.tsx`, `components/form/weight-field.tsx`).

**Also touched:** `schemas/forms/tax-settings-form.ts` (its local `TaxRateSchema` moves to `schemas/catalog/tax.ts` and is imported back), and `schemas/forms/{add-currency-popup-form,exchange-rate-form}.ts` (their locally redeclared currency shapes fold onto `CurrencySchema`).

**Not impacted:** the `@/types` barrel's public names, so no change for its 182 importers. No new dependencies; no zod version change.

**Risk:** a schema stricter than the live backend turns a rendering settings page into an error toast. Mitigated by keeping every non-identity field optional/nullish with `.passthrough()`, by parse tests fed the exact documented response bodies, and by a live smoke test of all 8 settings routes — but the settings sections are the least-documented endpoints in `docs/ecommerce/`, so this is the real risk of the change and the reason the live pass is not optional.
