## Why

`resources/app/components/form/` holds 21 field components that wrap react-hook-form's `Controller` in one consistent envelope — generic over `<TFieldValues, TName>`, `control` from `useFormContext()`, and a `Field` / `FieldLabel` / `FieldDescription` / `FieldError` shell around a `components/ui` primitive. That envelope is what makes error display, `aria-invalid`, `data-invalid` and label association uniform across every form in the admin.

22 `Controller` blocks across 19 files bypass it and hand-roll the envelope, inconsistently: some omit `FieldDescription`, some render the label outside the `Field`, one subscribes to `fieldState` without binding a value at all. The result is drift — an accessibility or error-rendering fix made in `components/form/` never reaches them.

The current `product-form` spec permits this explicitly ("bind fields through `Controller` **or** shared form field components"), so nothing stops the pattern spreading. This change closes that allowance and makes it enforceable by lint.

## What Changes

The invariant: `Controller` may appear **only inside a field component** — `components/form/**` (generic fields) or `features/*/components/fields/**` (fields carrying domain logic). It is forbidden in pages, sections and dialogs.

- **Extend two shared fields** with data-shaped props only: `SelectField` gains `icon?: ReactNode` on its option type and widens option `value` to `string | number`; `TextField` gains `readOnly` and `onClick`. No render-props, `displayValue` overrides, or children passthrough — single-caller escape hatches were rejected in favour of purpose-built siblings.
- **Add six generic fields** to `components/form/`: `RadioCardField`, `ChipsInputField`, `UnitAmountField`, `TabsField`, `ProgressBarField`, `GroupTagTableField`.
- **Add four feature-scoped fields** for bindings carrying domain logic that may not enter shared code: `CouponCodeField`, `VatProcessField`, `TaxCollectionField`, `SchemaSelectField`.
- **Migrate 17 call sites** off inline `Controller`. One (`add-or-edit-attribute`) is not a binding at all — it subscribes only to `fieldState` — and becomes `useFormState`.
- **Relocate** `features/products/components/attribute-values-field.tsx` into a `fields/` folder, the only feature field wrapper not already in one, so the lint allowlist can key on that path.
- **Enforce with ESLint**: a `no-restricted-syntax` rule banning the `Controller` import everywhere except the two allowlisted roots, shipping at `error` because the change leaves zero violations.
- **Add Vitest coverage** for the six new generic fields; `components/form/` has none today.

Not breaking. The refactor is behavior-preserving at every call site. The one exception is deliberate and internal: `VatProcessField` collapses two single-item Radix `RadioGroup`s bound to the same field into one group, restoring arrow-key navigation between the two options. Visual output is unchanged.

The five existing `features/*/components/fields/*` wrappers are **not** violations and are not rewritten — they already are field components, as `multi-select` §"one field component per data type" requires.

## Capabilities

### New Capabilities
- `form-field-binding`: where react-hook-form `Controller` may be used, the envelope every field component renders, the split between generic and feature-scoped fields, and the lint rule enforcing it.

### Modified Capabilities
- `product-form`: the requirement that section components "bind fields through `Controller` or shared form field components" drops the `Controller` alternative — sections bind through field components only.

## Impact

- **Shared code**: `components/form/` — 2 files modified, 6 added, 6 test files added.
- **Feature code**: 4 new field components under `features/*/components/fields/`; 14 call-site files edited across coupons, customers, orders, products, and settings (email, essentials, shipping, tax); 1 file relocated.
- **Tooling**: `resources/app/eslint.config.js` gains one rule plus an allowlist override. It must use `no-restricted-syntax` (currently unused) rather than `no-restricted-imports`, because flat-config rule entries replace rather than merge and would silently clobber the existing feature-boundary patterns.
- **No changes** to schemas, API payloads, services, or PHP. No dependency changes.
- **Verification**: `npm run typecheck`, `npm run lint`, `npm test` in `resources/app/`. Lint reaching zero violations of the new rule is the completeness check that no `Controller` was missed.
