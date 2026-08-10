# Design — shipping settings forms

## Context

See `proposal.md` — Why. The constraints that shape the approach:

- **The stored shape is deliberately untyped.** `shipping-settings-form.ts` declares
  `shipping_zones: z.array(z.record(z.any()))`, recorded in `zod-first-type-declarations`
  task 4.6. Zone/method/rule shapes were left unmodeled on purpose, so nothing in the type
  system will catch a payload-shape mistake in this area — tests carry that weight instead.
- **Zod v3 hard constraints** (`openspec/project.md`): `prepareFormSchema()` and the final
  `.transform()` only on the terminal schema; `requiredWhen()` conditions receive **root**
  form values; arrays use `.min(1, msg)` rather than `required()`; `.default()` only where
  an equivalent default already existed.
- **`requiredWhen` does not recurse into arrays.** `collectIssuesForShape` in
  `libs/zod.ts` walks nested *objects* (`!Array.isArray(nestedValue)`) but not array
  elements, so a per-row conditional rule inside `ranges` would never fire.
- **The existing form-field template is strict** (`components/form/text-field.tsx`):
  `useFormContext()` + `Controller`, never a `control` prop; `Field`/`FieldLabel`/
  `FieldError` shell; `data-invalid` + `error` + `aria-invalid`; `defineStyles` after the
  default export. New fields must not invent a different shape.
- The three method sub-forms today receive `{ handleOnChange, dataObj }` props. Every
  migrated settings section instead takes **no props** and reads form context
  (`checkout-settings/legal-info.tsx` is the reference).

## Goals / Non-Goals

**Goals:**

- Every shipping form reports validation on the field that failed, before any request.
- The three method sub-forms stop passing state through props and read form context.
- Two genuinely reusable form fields land in `components/form/` under the existing template.
- No change to what the server receives beyond removing the whole-blob spread.

**Non-Goals:**

- Modeling `shipping_zones` in `shipping-settings-form.ts`. Out of scope by prior decision.
- Response validation for `services/shipping.ts` — `openspec/project.md` scopes that as a
  separate change for all five unvalidated services.
- Shipping Careers, Shipping Simulator, Shipping Solution sections.
- Extracting the settings empty-state block into a shared component. It is duplicated in
  six places; consolidating it is worth doing, but not inside this change.

## Decisions

### 1. One method schema with `requiredWhen`, not three schemas

The method form is a single `ShippingMethodFormShape` holding `type`, `name`, `description`
and every per-type field, with type-specific requirements expressed as
`requiredWhen(field, (values) => values.type === 'flat_rate' && isEmptyValue(values.amount))`.

*Alternative rejected:* three schemas (`flat-rate-form.ts`, …) behind a discriminated union.
Zod v3 cannot `.extend()` a `ZodEffects`, so the shared `name`/`description` fragment would
have to be duplicated or composed before the transform; worse, switching method type would
require swapping the `useForm` instance, losing the shared name — which the spec requires be
preserved. A single form with conditional rules keeps one `useForm` for the page.

### 2. The transform, not a sanitizer, decides what a method persists

`METHOD_SCHEMAS` + `sanitizeByMethodType` currently pick which keys survive a save, at
runtime, by spreading a per-type key map. That is exactly the spread the
`form-schema-contract` spec forbids. The schema's `.transform()` instead names every payload
field explicitly and emits only the fields belonging to the selected `type`, satisfying both
"Declared request payload" and the spec's *Switching type drops the previous type's values*
scenario. `METHOD_SCHEMAS` is deleted; its default values move onto the schema fields as
`.default()` — legitimate under the project rule, since those exact defaults already existed.

### 3. Weight ranges validate with plain zod, not `requiredWhen`

`ranges` is `z.array(z.object({ from, to, amount })).default([])`, with per-row fields
validated inside the row object and the non-empty check as `.min(1, msg)` — required only
when `type === 'weight'`, which is expressed by applying the rule at the array level via
`requiredWhen` on the `ranges` field itself (a rule on the array, which `collectIssuesForShape`
does reach, rather than on its elements, which it does not).

### 4. `RegionsField` owns search; the state tree stays a dialog

Typing filters countries inline through the existing `getSearchedCountries` helper. Choosing
a country **with states** still opens `ShippingRegionPopup`, because picking a subset of ~50
states is not a dropdown interaction. The field owns a single `regions` value; the dialog
becomes a controlled child that returns a value rather than the current arrangement where
the dialog mirrors every change back into four separate parent `useState`s via `syncParent`.
That dual source of truth is the reason zone edits are hard to follow today.

### 5. `WeightRangeField` is purpose-named, not a generic repeater

There is exactly one repeatable-row consumer in the codebase. CLAUDE.md forbids abstractions
for single-use code, so the field hard-codes from/to/rate rather than taking a row render
prop. It keys rows by `useFieldArray`'s `field.id` — the current implementation keys by array
index, which corrupts state when a middle row is deleted.

### 6. The rule builder becomes an inline card, reusing the schema unchanged

`ShippingRuleFormSchema` already performs the flat→nested `{relation, conditions, action}`
reshape in its transform. Only the container changes: dialog → an inline card rendered above
the rule list, with the same `SelectField`/`TextField` wiring. Edit renders the same card in
place of the row being edited. The destination picker stays a dialog (`select-destination-dialog.tsx`).

### 7. Fixing the condition key at the source

`utils.tsx`'s `conditionOptions` emits `product_categories` while every consumer keys on
`product_category`. The option value is corrected to the singular form the consumers already
expect, rather than changing the consumers — the singular form is what is written into saved
rules today, so changing the consumers would orphan existing stored rules.

## Risks / Trade-offs

- **No type-level safety net.** `shipping_zones` is `z.record(z.any())`, so a wrong payload
  shape typechecks fine and surfaces only at runtime. → Payload tests for both new schemas
  assert the exact `z.output<>` body per method type; browser verification checks the actual
  PUT body.
- **Stored rules written before the key fix carry `product_categories`.** Decision 7 assumes
  the singular form is what was persisted. → Verify against real saved data during browser
  verification before shipping; if plural values exist in the wild, read both keys when
  loading and normalize on save.
- **Six files rewritten at once**, several with no test coverage. → Land in the four task
  groups, verifying in the browser at each group boundary rather than only at the end.
- **`is_taxable` / `amount` are shared across method types** in the current stored shape;
  the weight type also wrote its free-shipping amount to `amount`. Separating it to
  `free_shipping_min_amount` (the field the type already declares) is a **stored-shape
  change** for existing rate-by-weight methods. → Small blast radius (the value is currently
  written to a key the type declares but never reads, i.e. it is already broken), but call it
  out in the task and confirm against real data.
- **Deleting `shipping-rule-dialog.tsx`** removes the only caller of some `utils.tsx`
  helpers. → Grep for orphans after the deletion rather than assuming; remove only what this
  change orphaned, per CLAUDE.md.
