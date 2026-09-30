## Why

The admin app declares the same data three different ways and they disagree. Only 1 of 44 form schemas (`coupon-form.ts`) derives its request payload from zod; the other 43 export a single `z.infer<>` type and hand-build payloads across ~23 scattered sites — named mappers (`buildProductPayload`, 70 lines), local helpers (`toSubmitPayload`, `buildRule`), and inline `const payload = {...}` blocks in submit handlers — most terminated by an `as SomeApiType` cast that suppresses exactly the drift the type system should catch.

Worse, the payload type is not the truth: `processPayload` in `libs/api.ts` silently rewrites every request body *after* the form produces it (`''`→`null`, media object→id, `Date`→ATOM string), so any declared payload type describes something the server never receives. `checklist.md` already carries "Use zod for API response validation" as an open TODO — this finishes that work and closes the request side with it.

## What Changes

- **New canonical form contract.** Every form schema in `schemas/forms/` ends in an explicit `.transform()` that names each payload field individually (never a spread), and exports `XFormInput` (`z.input<>`) and `XFormPayload` (`z.output<>`). All 43 `useForm` sites adopt `useForm<XFormInput, unknown, XFormPayload>`; child components use `useFormContext<XFormInput>()`.
- **`z.output<FormSchema>` becomes literally the request body.** **BREAKING** — `processPayload` is deleted from `libs/api.ts`. Its behaviors move into named `libs/zod.ts` field helpers (`mediaId()`, `dateString()`, `numberOrNull()`, `booleanish()`), and the request interceptor is replaced by a dev-only tripwire that warns when an outgoing body still contains a `Date`, a media object, or an empty string.
- **`libs/zod.ts` becomes the shared vocabulary and is hardened.** `requiredWhen` currently keys a module-level `WeakMap` on field-schema object identity, so a rule registered against a shared singleton leaks across every form using it; `prepareFormSchema` scans only top-level keys, so nested conditional rules silently never fire. Both are fixed, along with `getDefaults` (blind to defaults wrapped in `required()`) and `pickFormValues` (no default layering).
- **`required()` becomes the single required-field convention.** `schemas/forms/shared/validators.ts` shrinks to format builders wrapping it; `requiredString`/`optionalNullableString` are removed.
- **Settings forms own their whole section.** Each of the 7 settings form schemas covers every field of its section so its transform produces the complete body, and `updateSettings` is typed by a `SettingsPayloadMap[K]` lookup instead of the all-optional `SettingsSectionData` union.
- **Response-side gaps closed** in the 14 services that already validate: a shared `MessageResponseSchema` for the ~12 delete/bulk operations that validate nothing, real schemas for coupon's `validateCode`/`generateNewCode`, envelope validation, and unified failure reporting so mutation schema mismatches surface to the user (`parseResponse` is silent today). Existing schema leniency is deliberately **not** tightened.
- **Dead type removal.** **BREAKING** — every `*FormData` type is deleted (replaced by `z.output<>`), along with `types/entities/order.ts` (zero references), `Toast`/`ShowToastPayload`, 13 unused settings types, and `ProductAttributePayload`/`ProductVariantPayload`. The `@/types` barrel keeps entity/response types so its 182 importers are untouched.
- **Vitest is introduced**, with one payload test per form schema asserting the exact `z.output<>` body.

Out of scope, deferred to a follow-up change: new zod response schemas for the 5 services that validate nothing (`currency`, `payment`, `settings`, `shipping`, `tax`), which require deriving `Currency`, `PaymentGateway`, `PaymentMethod`, `ShippingProfile`, `ShippingBox`, `TaxProfile`, and `SettingsSectionData` from `docs/ecommerce/*.yml`.

## Capabilities

### New Capabilities
- `form-schema-contract`: How every form declares its shape — zod schema with an explicit payload transform, the `z.input`/`z.output` type pair, RHF binding via three generics, generic-first hydration, required/conditional validation semantics, and the guarantee that the transform output reaches the wire unmodified.
- `api-response-validation`: How API responses are validated — response schemas in `schemas/catalog/`, envelope handling, coverage of delete/bulk operations, and what the user sees when a response fails its schema.

### Modified Capabilities
- `product-form`: Two requirements change. "Payload mapping on submit" names `ProductFormData` as the transform target — that type is deleted and replaced by `z.output<typeof ProductFormSchema>`, with the mapping moving from `buildProductPayload` into the schema transform. "Unified validation schema" gains the constraint that composed section fragments must remain plain `ZodObject` (zod v3 cannot `.extend()`/`.merge()` a `ZodEffects`), so only the terminal schema is prepared and transformed.

## Impact

**Code:** all 44 files in `resources/app/schemas/forms/`, all 43 `useForm` sites and 27 concrete-typed `useFormContext` sites under `resources/app/pages/`, `resources/app/libs/zod.ts`, `resources/app/libs/api.ts`, `resources/app/services/` (14 services plus `helpers.ts`), and `resources/app/types/` (entity pruning plus barrel update).

**Not impacted:** the 23 field components in `resources/app/components/form/` are already generic over `TFieldValues` and need no changes. The `@/types` barrel keeps its entity exports, so the 182 files importing it are untouched.

**Dependencies:** adds Vitest as a dev dependency. Stays on zod v3.25.76 — `z.record(single-arg)` in `schemas/shared/media.ts` and `schema-profile.ts`, and `MediaRefSchema`'s `z.lazy()` + `z.ZodType<MediaRef>` annotation, all break under v4, so no upgrade is attempted here.

**Risk:** deleting `processPayload` means every transform must emit `null` explicitly where an empty string previously became null, and `undefined` now drops the key entirely rather than becoming null. The payload tests and dev tripwire mitigate this but do not eliminate it.

**Coordination:** the active `product-form-design` change scopes "wire `short_description` through frontend schemas, types, product form context, and create/update save payload" against the same `product-form.ts`. It must land or rebase before this change's product phase begins.
