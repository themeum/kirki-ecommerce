## Context

See `proposal.md` — Why. The constraints that shape the approach:

- **zod 3.25.76.** `.transform()` and object-level `.superRefine()` both produce `ZodEffects`, which has no `.extend()`, `.merge()`, `.pick()`, or `.partial()`. This is the single biggest structural constraint. The version is also transitional (ships both v3 and v4 subpaths); `z.record(single-arg)` in `schemas/shared/media.ts` and `schema-profile.ts`, plus `MediaRefSchema`'s `z.lazy()` + `z.ZodType<MediaRef>` annotation, all break under v4.
- **react-hook-form 7.81 / @hookform/resolvers 5.4.** Both support the 3-generic `useForm<TFieldValues, TContext, TTransformedValues>`; no upgrade needed.
- **All 23 field components in `components/form/` are already generic** over `TFieldValues`, so they require no changes. Only the 27 concrete-typed `useFormContext<XFormValues>` sites in pages do.
- **`types/index.ts` is the only importer of `types/entities/*`**, and 182 files import that barrel. The entity files are an internal detail and can be restructured freely as long as the barrel keeps exporting the same names.
- **No tests and no ESLint exist.** `tsc --noEmit` is the only gate, and it cannot verify anything a transform does at runtime.

## Goals / Non-Goals

**Goals:**
- One declaration per concern, with the request payload type derived from the form rather than written beside it.
- Make `z.output<FormSchema>` literally the bytes on the wire, so the type is checkable documentation rather than an aspiration.
- Establish a pattern uniform enough that a reviewer can tell at a glance whether a form follows it.

**Non-Goals:**
- Tightening existing response-schema leniency. Turning `z.union([Enum, z.string()])` into a strict enum converts backend drift into user-facing failures; that is a production-risk change and belongs in its own PR.
- Migrating to zod v4.
- Rewriting the 182 files that import `@/types`.

## Decisions

### 1. Only the terminal schema is prepared and transformed

`prepareFormSchema()` and `.transform()` both return `ZodEffects`, which cannot be extended or merged. `ProductFormSchema` is built as `ProductBasicsFormSchema.extend({...}).merge(ProductSeoFormSchema)`, so those fragments must stay plain `ZodObject`.

Rule: fragments are shapes; only the terminal schema is prepared and transformed. This is a hard constraint, not a preference.

*Alternative rejected:* transforming fragments and composing the results. Impossible in zod v3 — composition would have to happen at the TypeScript level, reintroducing the hand-written mapping this change exists to remove.

### 2. Nested sub-schemas own their own transform

`ProductFormVariantSchema` ends in its own `.transform()`. `z.array(ProductFormVariantSchema)` then composes input→output automatically, so the parent transform maps only top-level fields.

*Why:* keeps the terminal transform readable, makes the variant payload independently testable, and gives the bulk-edit variant editor the same payload shape for free.

*Alternative rejected:* one ~70-line transform on `ProductFormSchema` mapping variants inline — essentially `buildProductPayload` relocated. Same length, no reuse.

### 3. Every schema transforms, naming each field explicitly

No spreads, even where the transform looks like an identity. A spread means a new form field silently joins the request body — the exact bug class the transform exists to prevent. The uniformity is also what makes "does this form follow the pattern?" answerable by inspection.

*Alternative rejected:* transform only where reshaping is needed. Leaves two visible patterns, and adding one reshaped field later forces a file restructure.

### 4. `processPayload` is deleted; the interceptor becomes a dev tripwire

`processPayload` rewrote every request body after the form produced it. Keeping it means the declared payload type can never be trusted.

The Date case decides it. If a form declares `z.date()` and the client stringifies it, `z.output<>` says `Date` while the server receives a `string` — the same lie in new clothing. A `dateString()` helper makes `z.output<>` say `string`, which is true. The "one common place where payloads take final shape" instinct is preserved, one layer up: `libs/zod.ts` holds the shared conversion vocabulary.

The interceptor is not simply removed — it is **inverted**. Instead of silently rewriting the body, it warns in development when an outgoing payload still contains a `Date`, a media object, or an empty string. Zero production behavior; every missed transform announces itself the first time the form is exercised.

*Alternatives rejected:* keeping it (payload type stays a lie); stripping only the destructive `''`/`undefined` branches (smaller diff, but leaves an invisible second transform readers must know about to predict a request body).

### 5. Hydration is a typed function, generic-first

The response has already been validated by its catalog schema, so re-parsing it into the form adds nothing while converting compile-time errors into runtime ones. Hydration is therefore a function, not a schema.

It is generic wherever possible: `pickFormValues(Schema, response, overrides)`. Making that viable requires the `?? ''` fallbacks currently living in mappers to move *into* the schemas as `.default()`, and `pickFormValues` to layer `getDefaults(schema)` beneath the picked values. A bespoke named mapper is written only where a generic genuinely cannot express the rule — product `variants` falling back to `[getDefaultVariantValues()]` when the record has none.

*Alternative rejected:* a fourth zod schema per entity (`EntitySchema.transform(→ form input)`). Symmetric, but doubles the schema count and re-validates already-validated data.

### 6. `required()` is the single required-field convention

`libs/zod.ts` `required()` works on any type, treats `''`/`[]`/`{}` as empty, composes with `requiredWhen`, and genuinely narrows `z.input` (`T|null|undefined`) → `z.output` (`T`). `validators.ts` `requiredString()` is strings-only with input === output.

*Correction during implementation:* `required()` is the wrong tool for a "non-empty array" field — it makes the field `.nullish()`, which several Group 5 dialogs' hand-written consumer code (`form.watch(...)`, `form.getValues(...)` used without a defensive cast) isn't written to expect, since the original schemas declared these arrays as plain required fields with no default. `z.array(...).min(1, message)` already expresses "must be non-empty" without introducing nullability, so it's the correct choice for array fields — `required()` stays for scalars. The same overreach happened with `.default([])` added to fields the original schema also left with no default (`selectedCountries` in `tax-rules-form.ts`, `selectedRegion` in `tax-region-popup-form.ts`): a default there widens the input type to optional even though the component always supplies the field explicitly, which broke strict (uncast) consumers three times before the pattern was recognized. The rule going forward: only add `.default()` to a field where the original code had one (or one is genuinely needed for `getDefaults()`/`pickFormValues()` to hydrate a brand-new record) — not reflexively on every field.

`validators.ts` shrinks to format builders wrapping `required()` (`email`, `slug`); `requiredString`/`optionalNullableString` are deleted. Because `required()` makes input types nullish, every required field pairs it with a `.default()` to avoid RHF uncontrolled-input warnings — which is the same `.default()` decision 5 needs.

*Alternative rejected:* standardizing on `requiredString()`. Zero churn, but no narrowing through the transform and still no answer for required numbers, arrays, or media refs.

*Sequencing discovered during implementation:* `mediaId()`'s output type (`number | { id, poster } | null`) does not structurally satisfy the legacy `*FormData` types' media fields (typed `MediaRef | string | number | null`, and `MediaRef` requires `url`), even for fields that can never be a video. Rather than defer every service's payload type to task 6.2 and fight that mismatch across four groups, each form's service is retyped to its `XFormPayload` in the same step the form converts — `processPayload` stays active and idempotent throughout, so there is no runtime change from doing this early. Task 6.2 becomes a verification sweep confirming zero remaining `*FormData` consumers, not fresh conversion work.

*Sequencing discovered during implementation:* `required()`'s nullish input type is only sound for a form already on the 3-generic `useForm<Input, unknown, Output>` pattern — `zodResolver` infers the resolver's `TFieldValues` from `z.input<Schema>`, so a still-1-generic `useForm<XFormValues>` site immediately fails to typecheck the moment its field switches from input===output to nullish-input. `validators.ts` therefore keeps `requiredString`/`optionalNullableString`/`slug`/`email` in their original input===output form, marked `@deprecated`, until each individual consumer converts in Groups 2–5. The canonical pattern in a converted form calls `required()` directly rather than through these shared re-exports (see the worked example above), so by the time every form has converted, `validators.ts`'s deprecated builders have zero remaining callers and are deleted outright — confirmed by grep, not assumed.

### 7. `libs/zod.ts` helpers are hardened before 44 schemas depend on them

Two latent bugs, both currently masked by having a single user:

- **`requiredWhen` keys a module-level `WeakMap` on field-schema object identity.** `coupon-form` is safe only because `.nullish()` happens to mint a fresh object. `requiredWhen(moneyAmount, …)` against the shared singleton would attach the rule to every form using it. Fix: clone the field schema on register — zod v3 `.describe()` returns a new instance via `new this.constructor({...this._def, description})`.
- **`prepareFormSchema` scans only top-level shape keys**, so a conditional rule on a nested field silently never fires and cannot target a nested error path. Fix: walk nested `ZodObject`s and emit issues at the full path. A rule registered on a nested field (e.g. `billing_address.postal_code`) receives the **root** form values in its condition callback, not the local nested slice — the customer-form use case this exists for is exactly a nested field's requiredness depending on a top-level sibling (`is_billing_same_as_shipping`), so passing only the nested object would make that condition unwritable.

Also fixed: `getDefaults` only recognizes a top-level `ZodDefault`, so any default wrapped by `required()`/`.nullish()` is invisible — it must unwrap `ZodEffects`/`ZodOptional`/`ZodNullable`.

New helpers: `mediaId()` (preserving the video `{id, poster}` case), `dateString()`, `numberOrNull()`, `booleanish()`.

*Alternative rejected:* dropping `requiredWhen` for explicit `.superRefine()` per schema. No hidden global state and nested paths work natively, but coupon-form's readable per-field declarations collapse into one block far from the fields they guard.

### 8. Settings form schemas own their whole section

The 7 settings forms all POST to one `updateSettings({key, data})`. Four of them build `data` by merging form values with the fetched settings blob or with component state — which a transform, being a pure function of form values, cannot see.

Rather than exempt them, each settings schema grows to cover every field of its section, so the merges disappear and `z.output<>` is the complete body. `updateSettings` is then typed by a `SettingsPayloadMap` keyed on `SettingsSectionKey` instead of the all-optional `SettingsSectionData` union.

*Correction during implementation:* both `shipping_zones` and `tax_regions` turned out to already live in form state, not component state — the actual merges were with the *fetched* settings blob (`{...shippingSettingsData, shipping_zones: values.shipping_zones}`), not local component state. Since each is genuinely the only field its section owns, the fix was simpler than planned: send `{shipping_zones}` / the parsed tax payload alone, no merge needed. Three additional call sites surfaced beyond the two page-level forms — `shipping-zone.tsx`, `shipping-delivery-method.tsx`, `edit-region-eu.tsx`, and `general-edit-region.tsx` all write into the shared `shipping`/`tax` keys from sub-editors, and needed the same fix.

*Correction during implementation:* passing the now-generic `updateSettings<K>` directly as `useMutation`'s `mutationFn` does not narrow `TVariables` per call site — TS resolves the generic against its constraint rather than the caller's literal key. `useUpdateSettingsMutation` itself became generic instead (`useUpdateSettingsMutation<'general'>()`), with each of the 13 call sites supplying its own key.

*Alternative rejected:* leaving the merges at the call site. The pattern would be nominally applied but untrue for 4 of 7 forms.

### 9. The `@/types` barrel survives; `*FormData` types do not

The barrel keeps entity/response types so its 182 importers are untouched. All `*FormData` types are deleted; pages and services import `XFormInput`/`XFormPayload` directly from the schema file they already import the schema from, consolidating two imports into one.

*Alternative rejected:* dissolving the barrel and importing entities from `@/schemas/catalog/*`. Purest, but rewrites imports in ~182 files, burying the behavioral changes in noise.

### 10. Vitest, with a payload test per form

This is the only mechanism that actually verifies a transform. Transforms are pure functions — no DOM, no mocking. Critically, these tests are what make deleting `processPayload` safe: they encode its removed behavior as explicit assertions.

## Risks / Trade-offs

- **`''` → `null` across 43 forms** → Every transform must emit `null` explicitly where `processPayload` previously coerced. A miss silently changes what the server stores. Mitigated by the dev tripwire and payload tests; not eliminated.
- **`undefined` semantics shift** → `processPayload` mapped `undefined` to `null`; without it `JSON.stringify` drops the key entirely. A backend distinguishing "absent" from "explicit null" will behave differently. Transforms must emit explicit nulls rather than relying on omission.
- **Nullish input types from `required()`** → Without a paired `.default()`, RHF logs uncontrolled-to-controlled input warnings. Mitigated by pairing every `required()` with `.default()`, which decision 5 needs anyway.
- **Media collapse now lives in schemas** → Only 3 forms actually depended on `processPayload` here (manual-payment `icon`, email-template `logo`, product `media[]`/variant `media`/`og_image`); the rest already pass `valueAs="id"`. Losing the video poster is the specific failure to watch, so `mediaId()` must preserve `{id, poster}`.
- **Settings restructure is the largest single piece** → Moving `shipping_zones` into form state touches shipping-settings broadly. Isolated to its own PR so it can be reverted without unwinding the pattern.
- **Collision with the active `product-form-design` change** → It scopes "wire `short_description` through frontend schemas, types, product form context, and create/update save payload" against the same file. It must land or rebase before the product phase begins.

## Migration Plan

Five stacked PRs against a shared branch, in dependency order. **`processPayload` deletion lands last**, only after every transform replacing it is merged and tested.

1. **Foundations** — harden `libs/zod.ts`, rebuild `validators.ts` on `required()`, add the new field helpers, set up Vitest.
2. **Simple CRUD forms** — brand, tag, category, collection, schema-profile, customer. Proves the pattern on low-risk surfaces. Customer carries real logic today (address copying and conditional billing duplication live in the component) and moves into the transform.
3. **Product, coupon, variants** — the composed schema, the variant sub-transform, and the 12 `useFormContext<ProductFormValues>` sites.
4. **Settings family** — the 7 section schemas and `SettingsPayloadMap`.
5. **Cutover** — delete `processPayload`, install the tripwire, rewire service payload types, close response-side gaps, prune `types/entities`.

Each PR keeps `tsc --noEmit` clean and adds payload tests for the forms it converts. Rollback is per-PR; because the cutover is last, reverting it restores the previous normalization behavior without unwinding any schema work.
