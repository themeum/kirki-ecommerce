## 1. Shared field builder

- [x] 1.1 Add `moneyOrNull()` to `resources/app/libs/zod.ts` next to `numberOrNull()`, following design.md — Decision 1: `z.union([z.number(), z.string()]).nullish().transform(...)` with `.nullish()` **before** `.transform()`, returning `null` for nullish and empty/whitespace-only strings and passing every other value through unchanged. Export it from the file's sorted export block.
- [x] 1.2 Add `moneyOrNull()` cases to `resources/app/libs/zod.test.ts`: `''`, `'   '`, `null` and `undefined` each produce `null`; `0`, `'0'`, `12.5` and `'12.50'` each come back unchanged.

## 2. Form schema conversion

- [x] 2.1 `features/inventory/schemas/forms/variant-form.ts` — replace the six `MoneyAmountSchema.nullish()` fields (`base_price`, `base_unit_amount`, `total_unit_amount`, `base_sale_price`, `base_cost_of_goods`, `weight`) with `moneyOrNull()`, and drop the now-unused `MoneyAmountSchema` import.
- [x] 2.2 `features/products/schemas/forms/product-form.ts` — same six fields in `ProductFormVariantShape`, replacing `moneyAmount.nullish()` with `moneyOrNull()`; remove the `@/schemas/forms/shared/validators` import.
- [x] 2.3 `features/products/schemas/forms/base-unit-form.ts` — replace `moneyAmount.nullish().default(null)` with `moneyOrNull().default(null)` on `total_unit_amount`, `base_unit_amount` and `base_price`; remove the validators import.
- [x] 2.4 `features/bulk-edit/schemas/forms/bulk-edit-form.ts` — replace `moneyAmount.nullish()` with `moneyOrNull()` on `base_price`, `base_sale_price`, `base_cost_of_goods` and `weight`; remove the validators import. This schema has no `.transform()`, so the builder is the only thing standing between a cleared cell and the request body.
- [x] 2.5 `features/coupons/schemas/forms/coupon-form.ts` — `discount_amount` moves from `MoneyAmountSchema.nullish()` to `moneyOrNull()`; drop the `MoneyAmountSchema` import. **Premise corrected:** `usage_limit` / `customer_limit` were left as `z.number().nullish().default(null)`. Design Decision 5 claimed `.default()` sat *inside* `.nullish()` so `undefined` passed through — it does not. `.default(null)` is the outermost wrapper, so `z.number().nullish().default(null)` already parses an empty input to `null` (verified). Converting them to `numberOrNull()` only widened `CouponFormInput` to `number | string`, which broke `coupon-preview.tsx`'s `_n()` calls, for no payload benefit.
- [x] 2.6 Remove the `moneyAmount` export (and its `MoneyAmountSchema` import, if orphaned) from `resources/app/schemas/forms/shared/validators.ts`, leaving `email` and the other deprecated helpers untouched. Confirm no consumers remain: `grep -rn "moneyAmount" resources/app`.

## 3. Field components

- [x] 3.1 `resources/app/components/form/money-field.tsx` — `onChange` sends `event.target.value === '' ? null : event.target.value`, matching `weight-range-field.tsx`. Leave `value={field.value ?? ''}` alone.
- [x] 3.2 `resources/app/components/form/unit-amount-field.tsx` — same normalization on the amount input's `onChange`; the unit select is unaffected.
- [x] 3.3 `resources/app/components/form/weight-field.tsx` — same normalization in `handleWeightChange`, and check the `onFieldChange` payload it forwards (`getValues(name) || ''` in `handleUnitChange`) reports a cleared weight consistently rather than re-introducing `''`.

## 4. Payload regression coverage

- [x] 4.1 `features/inventory/tests/schemas/forms/variant-form.test.ts` — add a blank-input case asserting all six money fields come out `null`, and a companion case asserting `0` survives as `0`.
- [x] 4.2 `features/products/tests/schemas/forms/product-form.test.ts` — same blank-variant case through `ProductFormVariantSchema` / `ProductFormSchema`.
- [x] 4.3 `features/products/tests/schemas/forms/base-unit-form.test.ts` — blank case for the three converted fields.
- [x] 4.4 `features/coupons/tests/schemas/forms/coupon-form.test.ts` — assert a cleared `discount_amount` comes out `null`. Also pin the `usage_limit` / `customer_limit` behaviour that task 2.5 turned out to already be correct, with an explicit key-presence assertion (`toEqual` ignores an `undefined` value, so only key presence catches a regression here).
- [x] 4.5 Add `features/bulk-edit/tests/schemas/forms/bulk-edit-form.test.ts` — this schema has no payload test today; cover a cleared money cell parsing to `null` and a filled one passing through.
- [x] 4.6 No assertion needed updating — no existing test asserted `''` for a money field, which is why the leak survived (the pre-change suite passed both before and after the schema conversion). The new cases in 4.1-4.5 are the first coverage of the blank case.

## 5. Verification

- [x] 5.1 `npm run typecheck` in `resources/app/` — clean.
- [x] 5.2 `npm test` in `resources/app/` — full suite green, including the `dom` project (`bulk-edit-table.test.tsx` renders the converted cells).
- [x] 5.3 `npm run lint` — clean on every file this change touches (verified with a targeted `npx eslint` run). The repo-wide `npm run lint` reports 7 pre-existing errors in files this change does not touch (`accordion.tsx`, `utils/string.ts`, and five import-sort violations); left alone as out of scope.
- [x] 5.4 Re-run the blank-payload probe from design.md — Migration Plan intent: parsing `VariantFormSchema` with every money field empty yields `null` for all of them, with no `''` left.

## 6. Money / non-money split (added after review)

- [x] 6.1 `weight`, `base_unit_amount` and `total_unit_amount` moved from `moneyOrNull()` to `numberOrNull()` in `variant-form.ts`, `product-form.ts`, `base-unit-form.ts` and `bulk-edit-form.ts`. Review flagged that `weight` is a mass, not money; the same applies to the two unit amounts, which CLAUDE.md already documents as units of measure. The pre-change code declared all six with the shared money schema, so the mislabel predates this change — but the new builder name would have promoted it from accident to assertion. Server contract confirms the split (`Money::to_minor()` + `Sanitizer::INT` for the three currency fields; plain `INT`/`FLOAT` for the rest). See design.md — Decision 1a.
- [x] 6.2 `moneyOrNull()`'s docblock now names which fields qualify as currency and points everything else (weight, units of measure, counts, percentages, rates) at `numberOrNull()`.
- [x] 6.3 Payload tests updated for the narrowing: `weight` and the unit amounts now come out as numbers, currency still comes out as typed. Added a case to `variant-form.test.ts` and `product-form.test.ts` pinning both sides of that split in one assertion.
- [x] 6.4 Re-verified: `npm run typecheck` clean, 1132 tests pass, lint clean on every touched file.
