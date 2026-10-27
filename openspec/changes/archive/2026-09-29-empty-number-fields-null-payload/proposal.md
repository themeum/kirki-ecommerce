## Why

A merchant who clears a numeric input — a price, a sale price, a unit amount, a weight — currently sends an empty string to the REST API instead of `null`. `VariantFormSchema.parse({ base_price: '', base_sale_price: '', weight: '', base_unit_amount: '' })` returns those four keys as `''`, because money-typed fields are declared as a bare `z.union([z.number(), z.string()])` and their payload transforms use `values.x ?? null`, which does not catch `''`. Text fields already get this right (`stringOrNull()`), and integer fields already get it right (`numberOrNull()`); money is the one numeric shape that was never given an equivalent builder, so it leaks the raw input value. The `form-schema-contract` spec already requires "a blank input becoming null" and the dev-only tripwire in `libs/api.ts` warns about exactly this — the warning is firing on real submits.

## What Changes

- Add a `moneyOrNull()` field builder to `resources/app/libs/zod.ts`, alongside the existing `numberOrNull()` / `stringOrNull()` / `dateString()` builders: it accepts `number | string`, is nullish, maps `''`, whitespace-only and nullish input to `null`, and otherwise passes the value through unchanged so no money value is re-parsed or re-rounded on the way out.
- Move the **currency** form fields onto that builder — `base_price`, `base_sale_price`, `base_cost_of_goods` and `coupon-form.ts`'s `discount_amount` — across `product-form.ts` (`ProductFormVariantShape`), `variant-form.ts`, `base-unit-form.ts` and `bulk-edit-form.ts`.
- Move the fields that were only ever *shaped* like money onto `numberOrNull()`: `weight` (a mass, `Sanitizer::FLOAT` server-side) and `base_unit_amount` / `total_unit_amount` (units of measure, which CLAUDE.md already documents as "a weight/volume unit, not money, despite the `base_` in the name"). They were declared with the shared money schema before this change; that was a pre-existing mislabel, and the new builder name would have made it an assertion rather than an accident.
- Retire `moneyAmount` from `schemas/forms/shared/validators.ts`. It is deprecated scaffolding with only three consumers, all of which this change converts, so the export goes away rather than being re-pointed.
- Normalize an emptied input to `null` in the three field components that still hand react-hook-form a raw `''`: `money-field.tsx`, `unit-amount-field.tsx`, `weight-field.tsx`. This matches the convention already established in `weight-range-field.tsx` and `bulk-edit-cell-fields.tsx`, and it is what makes `bulk-edit-form.ts` — which has no payload transform at all — correct.
- Extend the per-schema Vitest payload tests to cover the emptied-input case for each converted form.

Not changing: `MoneyAmountSchema` in `schemas/shared/api.ts`. It also parses API **responses** across the product, variant, order, coupon and customer catalog schemas, where `''` is not a case that arises and a form-shaped transform would be wrong. Only the form side moves.

Not changing: `number-field.tsx` and `input-group-field.tsx`, which emit `undefined` on empty. That already resolves to `null` through `numberOrNull()`, and making them emit `null` instead would break `shipping-box-form.ts`, whose non-nullable `length`/`width`/`height` rely on `undefined` to fall back to their declared defaults. No form field actually loses a key to `undefined` — `coupon-form.ts`'s `usage_limit` / `customer_limit` looked like they did, but `.default(null)` is their outermost wrapper and already resolves `undefined` to `null` (see design.md — Decision 5).

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `form-schema-contract`: the "Request body fidelity" requirement currently spells out the blank-to-null conversion only for text. It gains the numeric counterpart — a cleared numeric or money input is sent as an explicit `null` — and the "Payload regression coverage" requirement gains the cleared-input case, so a form's payload test proves it rather than only covering filled values.

## Impact

- `resources/app/libs/zod.ts` — new `moneyOrNull()` export.
- `resources/app/schemas/forms/shared/validators.ts` — `moneyAmount` export removed.
- Form schemas: `features/products/schemas/forms/product-form.ts`, `features/products/schemas/forms/base-unit-form.ts`, `features/inventory/schemas/forms/variant-form.ts`, `features/bulk-edit/schemas/forms/bulk-edit-form.ts`, `features/coupons/schemas/forms/coupon-form.ts`.
- Field components: `resources/app/components/form/money-field.tsx`, `unit-amount-field.tsx`, `weight-field.tsx`.
- Tests: the payload tests co-located with each converted schema, plus `libs/zod.test.ts`.
- REST API: request bodies for product create/update, variant update, bulk variant edit and coupon create/update now carry `null` where they previously carried `''`. No PHP change is needed — `UpdateVariantRequest` and its siblings already declare these fields `number|min:0|nullable` and their `prepare_for_validation()` already skips empty values before `Money::to_minor()`, so `null` is the shape those rules were written for, and `''` never was.
- Filled **currency** inputs are untouched: passed through as typed, so money precision and the existing string-or-number payload shape are unaffected.
- Filled **weight / unit amount** inputs narrow from `string | number` to `number`, since `numberOrNull()` coerces. This matches what the server already does with them (`Sanitizer::FLOAT` for `weight`, `INT` for the unit amounts) and is covered by typecheck plus the payload tests.
