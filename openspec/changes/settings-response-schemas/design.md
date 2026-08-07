## Context

See `proposal.md` — Why. The constraints that shape the approach:

- **`services/customer.ts` is the reference implementation.** 14 services already follow it; this change adds no new plumbing, only new schemas. `parseData`/`parseResponse`/`parseMessage` and `PaginatedDataSchema`/`ResourceCollectionSchema`/`ApiEnvelopeSchema` all exist and are unchanged here.
- **`SettingsPayloadMap` already exists** in `services/settings.ts`, keyed on `SettingsSectionKey`, and `useUpdateSettingsMutation<K>()` is already generic — established by `zod-first-type-declarations` Decision 8. The read side is the missing half of a pattern already in the file.
- **The settings endpoints are the least documented in `docs/ecommerce/`.** `settings/*.yml` records one example body per section with no field-level annotation, so "is this field ever absent?" is answerable only from the recorded body plus the entity type plus what the pages actually read. All three disagree in places.
- **`types/index.ts` is the only importer of `types/entities/*`**, and 182 files import that barrel. Entity files can be deleted freely as long as the barrel keeps exporting the same names.
- **Schemas stay lenient** (`project.md` — Canonical form-schema pattern). Backend drift must not become a user-facing crash; this is a coverage change, not a tightening change.

## Goals / Non-Goals

**Goals:**
- All 19 services validate their responses, closing the gap `zod-first-type-declarations` left open.
- Every settings call site's type comes from a schema, so a wrong assumption about the response is a compile error.
- Response schemas live where their peers live and are composed from each other, not re-declared per consumer.

**Non-Goals:**
- Tightening any existing schema's leniency, here or in the schemas being added.
- Refactoring the settings pages themselves. Call-site edits are confined to what a type change forces.
- The `orders` and `default` settings sections — no endpoint, no caller, nothing to model.

## Decisions

### 1. A per-key schema map, mirroring `SettingsPayloadMap`

`SettingsSchemaMap` is a `const` record from `SettingsSectionKey` to that section's schema. `getSettings` and `useSettingsQuery` become generic over `K extends SettingsSectionKey` and resolve their return type through `SettingsSchemaMap[K]`.

*Why:* the write side already works this way, so the read side becomes symmetric rather than novel. It is also the only option under which validation means anything — a single combined schema would need every field optional (that is what `SettingsSectionData` is), which accepts `{}` from every endpoint and proves nothing.

The generic requires dropping `| string` from the key parameter. All 19 call sites pass a literal, so this costs nothing and prevents a caller from requesting an unmodeled section.

*Alternative rejected:* one wide `SettingsSchema` with all fields optional. Smallest diff, but reproduces today's type exactly and leaves every cast at the call sites in place.

*Follows from this:* `useUpdateSettingsMutation<K>` can now parse its response through the same map, so a section's shape is declared once and used by both directions.

*Correction during implementation:* `SettingsSchemaMap` ended up with 8 keys, not the 10 `SettingsSectionKey` currently has. `orders` and `default` are dropped, as planned — `docs/ecommerce/settings/` has no `orders.yml`/`default.yml`, so there is no documented body to derive a schema from, and grep confirms no call site ever requests either key. `payment` is kept, but its status is worth recording precisely: it also has zero frontend callers today (`payment-settings.tsx` reads `services/payment.ts`'s dedicated gateway/method endpoints, never `useSettingsQuery('payment')`), the same "no caller" situation as `orders`/`default`. It stays in the map anyway because, unlike those two, it *does* have a documented endpoint and response body (`settings/payment.yml`) and the schema is nearly free once `PaymentGatewaySchema` exists — modeling it costs nothing and leaves the section ready if a caller is ever added, whereas `orders`/`default` would have to be guessed at with no source to check against.

*Correction during implementation:* `payment`'s read/write asymmetry (readable, never written) means `SettingsPayloadMap` and `SettingsSchemaMap` can no longer share one key set. `updateSettings`/`useUpdateSettingsMutation`'s generic bound changes from `K extends SettingsSectionKey` to `K extends keyof SettingsPayloadMap` — 7 keys, exactly the sections with a real form schema. This is a narrowing of the write-side generic's bound, not a behavior change: no call site ever passed `payment` (or `orders`/`default`) to `updateSettings`, so nothing that compiled before stops compiling now; the change only makes explicit what was already true, that these three keys were never valid write targets.

### 2. Nested shapes are modeled, but every non-identity field is optional

Shipping zones/methods/regions/rules and tax regions/rates become real object schemas with `.passthrough()`, not `z.record(z.any())`.

The form schemas deliberately keep these loose (`shipping-settings-form.ts` and `tax-settings-form.ts` both say so in a comment, citing `zod-first-type-declarations` Decision 6) — but that decision was about *payloads*, where the sub-dialogs own the shape and a wrong guess would corrupt a write. On the read side the situation is inverted: roughly ten shipping and tax pages already consume `ShippingZone`, `ShippingMethod`, `ShippingRegion`, `ShippingRule`, and their field-level types. Modeling loosely would delete types those pages have today, which is a regression dressed as caution.

The safety comes from optionality rather than from vagueness: only the identity fields (`id`, and `type` where a page switches on it) are required; everything else is optional or nullish, and `.passthrough()` keeps unrecognized fields. That satisfies the capability's "tolerate benign backend variation" requirement while keeping the types real.

*Alternative rejected:* `z.array(z.record(z.any()))` for the nested collections, matching the form side. Lowest risk of a parse failure, but the shipping and tax pages lose their types and gain defensive casts.

*Correction during implementation, found live rather than in the docs:* "only the identity fields are required" undersold how much a rate entry's identity varies. `TaxRateSchema` initially required `state: z.string()`, following the one documented `settings/tax.yml` example and the original entity type — both of which only show a general (non-EU) region. The live `GET /settings/tax` response revealed EU/OSS regions key their `product_tax`/`shipping_tax` entries by `country` instead (`{"country":"AT","rate":20}`, no `state` key at all), which immediately failed validation on page load. Fixed by making both `state` and `country` optional — this is the risk the plan's Risks section called out by name ("the documented bodies are one example each, not a contract") and it is exactly what happened. `CurrencySettingsSchema.api_config` had the same class of failure for a different reason: it arrives as `[]`, PHP's empty-associative-array-as-JSON-array quirk, the identical issue `PaymentGateway.config` was already built to tolerate — just not one that had been applied here yet, since currency wasn't in the same code path. Both were only findable by exercising the real backend, which is why the live-verification task in this plan is load-bearing rather than a formality.

### 3. One schema file per API resource; sections compose from them

`schemas/catalog/{shipping,tax,payment,currency,app-config}.ts` hold the resource shapes; `schemas/catalog/settings.ts` holds the eight section schemas and the map, built from those resources — `ShippingSettingsSchema` is `{ shipping_zones: z.array(ShippingZoneSchema) }`, not a second declaration of a zone.

*Why:* it matches the existing `services/` split one-to-one, and it makes the one-resource-two-surfaces cases (a shipping zone appears inside the shipping *section* and nowhere else; a payment gateway appears both inside the payment section and at `/payment-gateways`) resolve to a single declaration.

*Consequence worth naming:* three shapes are currently declared twice, and this change collapses each to one — `TaxRateSchema` (in `schemas/forms/tax-settings-form.ts`, moved to `schemas/catalog/tax.ts` and imported back), and the currency item shapes in `add-currency-popup-form.ts` and `exchange-rate-form.ts`.

*Correction during implementation:* those two currency item shapes do not fold onto `CurrencySchema` as originally planned — they fold onto a new `CurrencyDraftSchema`. `CurrencySchema` models the stored resource, where `id` is server-assigned and always present (`docs/ecommerce/currencies/list-1.yml`). The item shapes in question describe a currency *being added or edited*: `add-currency-popup-form.ts`'s selection has no `id` yet (it comes from the world-currency picker, not the store), and `exchange-rate-dialog.tsx` submits those same id-less selections as the create payload. Reusing `CurrencySchema` directly would make `id` required on data that structurally can't have one yet. `CurrencyDraftSchema` (`schemas/catalog/currency.ts`) is the same fields with `id` optional, and both form schemas import it instead of redeclaring the shape.

A second, unplanned finding surfaced in the same file: `getAllCurrencies()` (`GET /currencies/list`) was typed `Currency[]` but the documented response (`docs/ecommerce/currencies/all-currency-list.yml`) is `{name, code, symbol}` — no `id`, no `exchange_rate`, no `is_base`. It's the world-currency catalog for the "Add Currency" picker, an unrelated resource to the store's configured currencies. This was never correct; added `CurrencyOptionSchema` to name it properly rather than continuing to borrow `Currency`.

### 4. The gateway map coercion moves into the schema

`getPaymentGateways()` calls `unwrapDataList`, whose object-to-array fallback exists specifically because this endpoint returns `{"stripe": {...}}` rather than `[{...}]`. Replacing it with `z.preprocess(normalize, ResourceCollectionSchema(PaymentGatewaySchema))` keeps the coercion and puts validation behind it.

*Why here rather than as a separate fix:* `project.md` flags this as a standalone issue precisely because it could not be fixed without a gateway schema. The schema is the fix; splitting it into two changes would mean writing the schema and deliberately not using it.

*Note:* `/settings/payment` embeds gateway objects with no `id` and `config: []`, while `/payment-gateways` returns them with an `id`. One schema covers both by making `id` optional and accepting `config` as an object *or* an empty array — not by declaring two gateway types, since the pages treat them as one thing.

*Correction during implementation:* the unified schema turned out to cover a fourth surface too — `GET /payment-gateways/installable`, which adds `is_installed` and omits `is_enabled`/`is_manual`. `payment-gateway-dialog.tsx` and `payment-gateway-edit-dialog.tsx` each already carried a local intersection type (`AvailablePaymentGateway`/`PaymentGatewayDetail`) bolting `is_installed`, or `settings`/`fields`/`webhook_url`/`webhook_events`, onto `PaymentGateway` — visible proof the type was already known to be incomplete. Adding those fields to `PaymentGatewaySchema` directly let both local types be deleted rather than kept as a second, competing definition of the same resource.

The trade-off is that `id` being optional (needed for the settings-embedded surface) now applies everywhere, including the two surfaces where it's actually always present. `payment-gateway.tsx` and `payment-gateway-dialog.tsx` gained an `item.id === undefined` guard before every call that needs it (`installPaymentGateway`, `setEnabledPaymentGateway`, `getPaymentGateway`) — a genuine, if slightly unfortunate, consequence of one schema covering surfaces with different guarantees. The alternative (a second, narrower gateway type for the two id-guaranteed surfaces) was rejected as the same "two competing definitions of one resource" problem this decision exists to avoid.

### 5. Entity files are deleted, not shimmed

`types/entities/settings.ts` and `types/entities/currency.ts` are removed and `types/index.ts` re-exports from `@/schemas/catalog/*` directly.

*Why not a re-export shim* (what `brand.ts`, `category.ts`, `media.ts`, `country.ts`, and `schema.ts` do today): the shim was the migration mechanism, not the destination. Keeping it here adds a hop that exists only to be deleted later, and the stated direction is to retire `types/entities/` gradually. After this change two files remain (`product.ts`, holding `UnitPriceValue`/`UpdateVariantsPayload` which have no response schema, and `toast.ts`).

`SettingsSectionKey` has no response schema — it is a key union, not a shape. It lives in `schemas/catalog/settings.ts` beside the map it keys, as a plain type.

`CurrencyFormData` goes with them. Both `createCurrency` and `updateCurrency` actually take `{ items: [...] }` (see `available-currency-list.tsx` and `exchange-rate-dialog.tsx`) — *as implemented*, that item shape is `CurrencyDraftSchema` (`schemas/catalog/currency.ts`), not `CurrencySchema` itself; see Decision 3's correction note for why `id` needed to stay optional there. `services/currency.ts` exports `CurrencyBulkPayload = { items: CurrencyDraft[] }` as the single declared shape both mutations and both call sites now share.

## Risks / Trade-offs

- **A schema stricter than the live backend breaks a settings page** → This is the change's real risk and the reason the live smoke test is a required task, not a nicety. Mitigated by: every non-identity field optional/nullish, `.passthrough()` everywhere, parse tests fed the exact documented bodies, and visiting all 8 settings routes against a real WordPress backend before the change is called done.
- **The documented bodies are one example each, not a contract** → A field that happens to be populated in the sample gets modeled as present-and-typed when it may be nullable in practice. Mitigated by defaulting to `.nullish()` for everything the pages do not require, and by cross-checking against the entity types, which encode behavior observed by whoever wrote them.
- **`/settings/payments` is unreachable today, so its schema cannot be validated against live data until the same change fixes the crash** → The fix and its verification are in the same task group; if the route still fails after the gateway schema lands, that is a finding to record, not a step to skip.
- **Per-key generics ripple further than expected** → `useUpdateSettingsMutation<K>` already needed to become generic for exactly this reason (`zod-first-type-declarations` Decision 8, correction note), so the read side may surface the same inference limits. Typecheck catches these immediately; the cost is call-site churn, not runtime risk.
- **Deleting the entity files is irreversible in one direction** → Any consumer missed by the barrel update is a compile error, not a silent `any`, so the typecheck gate is sufficient here.
- **Some mutations have two callers with two different payload shapes** → `updatePaymentMethod` and `updateShippingBox` are each called once with a proper form payload and once with a full-entity spread from a quick list-view toggle (`manual-payment.tsx`, `shipping-box.tsx`). Retyping `data` to the strict form payload alone would break the toggle call site. Both parameters are typed as `FormPayload | Record<string, unknown>` instead — narrower than before (some checking on the common path) without forcing the toggle sites into a shape they don't produce. Not discovered until Group 3's typecheck pass; not anticipated in the original task list.

## Migration Plan

Sequenced so that each group leaves `npm run typecheck` clean:

1. **Resource schemas** — `shipping`, `tax`, `payment`, `currency`, `app-config`, with their parse tests. Nothing consumes them yet.
2. **Section schemas and the map** — `schemas/catalog/settings.ts`, composed from group 1.
3. **Services** — the 5 services switch to `parseData`/`parseResponse`/`parseMessage` and to derived payload types. Call sites still compile against the old entity names via the barrel.
4. **Barrel and call sites** — delete the two entity files, repoint `types/index.ts`, fix the ~20 call sites the compiler surfaces.
5. **Verification** — typecheck, tests, then the live pass over all 8 settings routes plus a save on general/shipping/tax.

Rollback is per-group up to group 3; groups 4 and 5 are a single unit, since deleting the entity files is what forces the call sites.
