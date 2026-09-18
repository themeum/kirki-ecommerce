## Context

See proposal.md — Why. The relevant current state:

- `libs/zod.ts` already owns a family of field builders that each end in a `.nullish().transform(...)`: `mediaId()`, `dateString()`, `numberOrNull()`, `stringOrNull()`, `booleanish()`. Money never got one. Instead, money form fields reach for `moneyAmount` in `schemas/forms/shared/validators.ts`, which is a plain re-export of `MoneyAmountSchema` = `z.union([z.number(), z.string()])`. That union happily accepts `''`, and the payload transforms guard with `?? null`, which does not.
- `MoneyAmountSchema` is dual-purpose: it is also the money shape in the **response** schemas for product, variant, order, coupon and customer. Those must stay lenient and transform-free (project.md — response schemas stay lenient).
- `validators.ts` is documented in project.md as deprecated scaffolding: "do not add new usages". `moneyAmount` has exactly three consumers.
- The ordering inside these builders is load-bearing. `numberOrNull()` is `z.union(...).nullish().transform(...)` — `.nullish()` **before** `.transform()`, so the transform still runs for `undefined` and `null` and can return `null`. Written the other way round (`.transform(...).nullish()`), zod v3's `ZodOptional`/`ZodNullable` short-circuit and hand back `undefined`/`null` without ever entering the transform. That is why `numberOrNull()` fields already produce `null` from an emptied `NumberField`, and it is the single detail a new builder has to copy exactly.

## Goals / Non-Goals

**Goals:**

- One named builder that every money-typed form field uses, so the blank-to-null rule is declared once and visible in the payload type.
- No change to what a filled-in money field sends.
- Leave the form's editing state and its payload agreeing with each other, so cross-field `requiredWhen` rules and the profit/margin calculators see the same "no value" that the server does.

**Non-Goals:**

- Normalizing money to a single runtime type. The payload stays `number | string | null`; this change is about the blank case only.
- Touching the response-side money schema, or the `libs/api.ts` tripwire (it should simply stop firing for these fields).
- A general sweep of every `undefined`-emitting field component. Only the one field pair that actually loses a key (`coupon-form`'s limits) is fixed.

## Decisions

### Decision 1: A `moneyOrNull()` builder in `libs/zod.ts`, not a tightened `MoneyAmountSchema`

`moneyOrNull()` joins the existing builder family in `libs/zod.ts` and follows their shape exactly:

```ts
function moneyOrNull() {
  return z
    .union([z.number(), z.string()])
    .nullish()
    .transform((value): number | string | null => {
      if (!isDefined(value) || (typeof value === 'string' && value.trim() === '')) {
        return null;
      }
      return value;
    });
}
```

`.nullish()` precedes `.transform()` for the reason in Context — otherwise an untouched field still comes out `undefined` and its key disappears from the body.

Alternative considered: add the transform to `MoneyAmountSchema` in `schemas/shared/api.ts`. Rejected — that schema parses API responses across five catalog schemas, where a form-shaped blank-to-null conversion has no meaning and would quietly rewrite response data. Keeping the request-side and response-side money shapes separate is the same split the codebase already draws between `schemas/forms/` and `schemas/catalog/`.

Alternative considered: reuse `numberOrNull()` for money. Rejected — it returns `number | null`, so every money payload would change from `number | string` to `number`. That is a larger, unrelated diff across five schemas and their payload tests, and it re-parses amounts the merchant typed. If normalizing money to a number is wanted, it deserves its own change.

### Decision 1a: `moneyOrNull()` is for currency only, and the field list is drawn from the server

Added during implementation, after review flagged that `weight` is a mass, not money.

The six fields this change touched were all declared with the same shared money schema beforehand. That was already wrong, but harmlessly so while the schema was an anonymous `z.union([z.number(), z.string()])`. Naming the builder `moneyOrNull()` turns a sloppy inheritance into a claim, so the split has to be made here rather than deferred.

The server draws the line unambiguously, so the frontend follows it instead of guessing from field names:

| Field | Sanitizer | `prepare_for_validation()` | Builder |
| --- | --- | --- | --- |
| `base_price`, `base_sale_price`, `base_cost_of_goods` | `INT` | `Money::to_minor()` | `moneyOrNull()` |
| `base_unit_amount`, `total_unit_amount` | `INT` | — | `numberOrNull()` |
| `weight` | `FLOAT` | — | `numberOrNull()` |

Only the first group is a currency amount, and only it needs the value preserved exactly as typed — everything else is free to coerce, which is what `numberOrNull()` already does. CLAUDE.md's money-prefix rules say the same thing independently: `total_unit_amount` and `base_unit_amount` are called out by name as units of measure rather than money.

The consequence is that `weight` and the two unit amounts narrow from `string | number | null` to `number | null` in the payload. That is a real change beyond the blank-to-null fix, and it is the correct one: the server coerces them to `FLOAT`/`INT` on arrival regardless, so the string form was never meaningful.

`moneyOrNull()`'s docblock names both groups, so the next money-shaped field has a rule to follow rather than a precedent to copy.

### Decision 2: A builder function, not a shared schema instance

`moneyAmount` is a shared **instance**. `requiredWhen()` only avoids leaking a rule into every form that imports it because it defensively clones via `.describe()` (see the comment in `libs/zod.ts`). A builder called per field — `moneyOrNull()` — hands every field its own instance, which is why the rest of the family are functions. New money fields get that property for free.

### Decision 3: Delete `moneyAmount` rather than re-point it

All three consumers (`product-form.ts`, `base-unit-form.ts`, `bulk-edit-form.ts`) convert in this change, leaving the export with no callers. project.md marks `validators.ts` as scaffolding to be drained, so removing the export is the intended direction. `customer-form.ts`'s `email` import is untouched.

### Decision 4: Also normalize in the field components, as a second layer

The schema change alone makes every payload correct. The component change — `money-field.tsx`, `unit-amount-field.tsx`, `weight-field.tsx` sending `null` instead of `''` to `field.onChange` — earns its place because form **state** is read directly, before any transform runs:

- `requiredWhen()` conditions receive raw root values. `isDefined('')` is `true` while `isDefined(null)` is `false`, so a cleared field reads differently to a conditional rule depending on which value sits in state.
- The profit and margin readouts in the price cards compute off raw watched values.

This also brings the three components in line with `weight-range-field.tsx` and `bulk-edit-cell-fields.tsx`, which already do `event.target.value === '' ? null : ...`. There is no third convention to invent.

### Decision 5: Leave `number-field.tsx` and `input-group-field.tsx` emitting `undefined`

They look like the same bug, and they are not. Their `undefined` already becomes `null` in the payload wherever the field is declared `numberOrNull()`, because that builder's transform runs on `undefined`.

Making them emit `null` would break `shipping-box-form.ts`, where `length`/`width`/`height` are `z.union([z.string(), z.number()]).default(n)` — non-nullable with a default. Today, clearing one falls back to its default; with `null` it would fail the union and surface a raw zod type error to the merchant. Fixing that properly means deciding what a cleared box dimension should mean, which is a product question outside this change.

**Corrected during implementation.** This decision originally claimed `coupon-form.ts`'s `usage_limit` / `customer_limit` lost their key, reading `z.number().nullish().default(null)` as `.default()` sitting inside `.nullish()`. It does not: `.default()` is applied last and is therefore the outermost wrapper, so `undefined` hits `ZodDefault` first and comes out as `null`. Verified by parsing `z.object({ usage_limit: z.number().nullish().default(null) }).parse({})` — the key is present with value `null`.

Those two fields are therefore left alone. Converting them to `numberOrNull()` would widen `CouponFormInput` from `number` to `number | string`, which breaks `coupon-preview.tsx`'s `_n()` calls with no payload benefit to show for it. With that correction, no `undefined`-emitting component has a gap left to close, and this decision reduces to: leave `number-field.tsx` and `input-group-field.tsx` alone.

### Decision 6: Blank means blank, zero means zero

The transform treats only nullish and empty/whitespace-only strings as blank. `0` and `'0'` pass through as themselves — a merchant who sets a price to zero is not the same as one who set no price. On the PHP side the money rules already read `number|min:0|nullable` (`UpdateVariantRequest` and siblings), so `null` is a shape those rules were written to accept; `''` never was.

## Risks / Trade-offs

- **A `requiredWhen` condition somewhere relies on a cleared money field reading as "defined".** → Audited the four conditions that touch money (`base_sale_price` in `product-form` / `variant-form` / `bulk-edit-form`, `discount_amount` in `coupon-form`). Each funnels through `Number(...)`, where `Number('')` and `Number(null)` are both `0`, so the outcome is unchanged. The payload tests added for the blank case pin this.
- **A payload test asserts the current `''`.** → Expected, and the point: those assertions flip to `null` in the same change, which is the regression barrier the spec asks for.
- **A screen reads a money field's raw state and assumes a string.** → `value={field.value ?? ''}` is already the pattern in all three components, so the rendered input is unaffected; typecheck covers the rest.
- **The payload type stays `number | string | null`.** → Accepted; narrowing it is a separate change (Decision 1).

## Migration Plan

Frontend-only; no data migration, no PHP change, no coordinated deploy. Rollback is a revert of the change. Worth exercising once after merge: clear a variant's sale price and save, then reload — the field should come back empty rather than as `0`.
