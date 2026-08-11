# kirki-ecommerce

## Tech stack

- WordPress plugin backend (PHP) exposing a REST API under `/wp-json/kirki/ecommerce/v1/*`.
- Admin UI: a React 19 SPA mounted into `wp-admin`, in `resources/app/`. Vite (dev server + build), TypeScript, React Router (`createHashRouter`, hash-based routing since it's embedded in a WP admin page).
- Forms: React Hook Form 7 + `@hookform/resolvers/zod` + **Zod 3.25.76** (not v4 — do not upgrade; several schemas rely on v3-only behavior, see below).
- Data fetching: TanStack Query v5 (no per-query `onError` in v5 — see `services/helpers.ts`).
- Styling: Emotion (`@emotion/react`), a small `theme` module, no CSS-in-JS framework beyond that.
- Tests: Vitest (`resources/app/vitest.config.ts`), currently scoped to `schemas/**/*.test.ts` — one payload test per form schema, asserting the exact `z.output<>` body for representative input.
- Local dev: Docker Compose (`docker-compose.yml`) running WordPress + MariaDB + phpMyAdmin; the WP admin origin and the Vite dev server run on different ports (Vite proxies module requests, WP serves the shell page and REST API).

## Canonical form-schema pattern

Every form under `resources/app/schemas/forms/*.ts` follows one shape — this was established as the primary convention by the `zod-first-type-declarations` change (see `openspec/changes/zod-first-type-declarations/design.md` for full rationale and rejected alternatives):

```ts
const XFormShape = z.object({ /* fields, using required()/requiredWhen() from @/libs/zod */ });

const XFormSchema = prepareFormSchema(XFormShape).transform((values) => ({
  // every payload field named explicitly — never a spread, even for identity fields
}));

type XFormInput = z.input<typeof XFormSchema>;
type XFormPayload = z.output<typeof XFormSchema>;
```

- `useForm<XFormInput, unknown, XFormPayload>(...)` — the 3-generic form, always.
- Child components read `useFormContext<XFormInput>()`.
- Hydration from an API response is generic-first: `pickFormValues(XFormSchema, source, overrides?)`. Write a bespoke mapper only where a generic genuinely can't express the logic (documented inline when that happens, e.g. `mapProductToFormValues` in `product-form.ts`).
- Response/entity schemas live in `resources/app/schemas/catalog/*.ts` (or `schemas/reference/*.ts`, `schemas/shared/*.ts` for cross-cutting shapes like `MediaRefSchema`). They stay **lenient** on purpose — do not tighten `.nullish()` fields or widen unions into strict enums; the backend is the source of truth and drift should not become a user-facing crash. `schemas/shared/media.ts`'s `MediaRefSchema.date` accepting `string | number | Date` is a concrete example: WordPress's media picker and its AJAX/REST endpoints don't agree on a single shape for that field, so the schema has to accept all of them.
- `resources/app/libs/zod.ts` is the home for shared zod helpers: `required()`, `requiredWhen()`, `prepareFormSchema()`, `getDefaults()`, `pickFormValues()`, `mediaId()`, `dateString()`, `numberOrNull()`, `booleanish()`. Extend this file rather than hand-rolling a field pattern that already exists here.
- `resources/app/schemas/forms/shared/validators.ts` is deprecated scaffolding kept only until every remaining form converts to the pattern above — do not add new usages.

## Hard constraints (zod v3 + this codebase)

- `prepareFormSchema()` and the final `.transform()` apply **only to the terminal schema**. Both produce `ZodEffects`, which cannot be `.extend()`ed or `.merge()`d in zod v3 — composable fragments (e.g. `product-basics-form.ts`) must stay a plain `ZodObject` and let the parent schema apply the transform once, at the top.
- `requiredWhen()` rule conditions receive **root form values**, not the local nested slice — needed for cross-field rules like "billing address required only if `is_billing_same_as_shipping` is false".
- `z.coerce.number()`'s `z.input` type does not widen to accept a string even though runtime coercion works. For a text input backing a numeric field, use an explicit `z.union([z.string(), z.number()])` input with `Number(...)` in the transform instead.
- Only add `.default()` to a field where the equivalent default already existed before conversion. Adding one to a previously-required field with no default silently widens its input type to include `undefined`, which breaks any consumer reading `form.watch()`/`form.getValues()` without a defensive cast. This has been the single most common regression during the form-conversion work — when in doubt, match the original schema's looseness exactly rather than "improving" it in the same change.
- Non-empty-array validation is `.min(1, message)`, not `required()` — `required()` is for scalar fields (it wraps in `.nullish().refine(!isEmptyValue)`), and using it on an array widens the input type the same way a stray `.default()` does.

## Request/response plumbing

- `resources/app/libs/api.ts` has **no request-body normalization**. There used to be a `processPayload` interceptor that silently coerced dates, empty strings, and media objects on every outgoing request — it was deleted. Every form schema's `.transform()` is now solely responsible for shaping its own payload. A dev-only tripwire (`import.meta.env.DEV`-gated) still warns in the console if an outgoing body somehow retains a raw `Date`, media object, or `''`, but it never mutates the request.
- `resources/app/services/helpers.ts` has the response-handling primitives: `parseData` (for `useQuery`, toasts directly on schema mismatch since React Query v5 has no per-query `onError`), `parseResponse` (for mutations, only throws — the mutation's own `onError`, or a page-level catch, reports it), and `parseMessage` (for delete/bulk endpoints that return only `{success, message}`, validated against `schemas/shared/api.ts`'s `MessageResponseSchema`). Both `parseData`/`parseResponse` validate the outer `{ data }` envelope via `ApiEnvelopeSchema` before touching `.data`, so a malformed response reports a clean `ApiValidationError` instead of a raw property-access crash.
- All 19 services validate their responses — the `currency`/`payment`/`settings`/`shipping`/`tax` services that `zod-first-type-declarations` deferred were closed out by `settings-response-schemas`. Their catalog schemas live in `schemas/catalog/{currency,payment,shipping,tax,app-config,settings}.ts`; `settings.ts` also holds `SettingsSchemaMap` (`SettingsSectionKey` → response schema, 8 sections) and is what `useSettingsQuery`/`getSettings` are generic over.
- `getSettings`/`useSettingsQuery` are generic over `K extends SettingsSectionKey` (read; 8 keys — `orders`/`default` excluded, no endpoint). `updateSettings`/`useUpdateSettingsMutation` are generic over the narrower `K extends keyof SettingsPayloadMap` (write; 7 keys — `payment` has no form schema, written through `services/payment.ts` instead). The two key sets are not identical on purpose.

## Known pre-existing issues (not caused by this change, left as-is / flagged separately)

- A tax region's `product_tax`/`shipping_tax` rate entries are keyed by `state` for a general region but by `country` for an EU/OSS region (confirmed against live `GET /settings/tax` data — neither `docs/ecommerce/settings/tax.yml` nor the original entity type recorded the `country` variant). `TaxRateSchema` (`schemas/catalog/tax.ts`) accepts both, but `tax-region-eu-form.ts` and the EU region dialog UI (`edit-region-eu.tsx`, `vat-collection.tsx`) still read/write these entries under the field name `state`, which is likely wrong for what they actually persist as an EU region. Not fixed here — it's a write-side/UI concern, and `settings-response-schemas` only widened the response schema to tolerate whichever key shows up.
