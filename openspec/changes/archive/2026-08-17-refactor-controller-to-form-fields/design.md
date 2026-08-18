## Context

See proposal.md — Why.

The constraint that shapes most of this design is already in the lint config. `resources/app/eslint.config.js:34` lists `components` among `SHARED_ROOT_DIRS`, and the `kirki/shared-no-feature-import` block bans `@/features/**` imports there at severity `error`. Shared code cannot depend on a feature, so "put every field component in one directory" is not available as an option — four of the bindings being migrated carry feature queries, mutations or cross-field side effects.

`eslint.config.js` also already uses `no-restricted-imports` in two separate blocks to enforce the feature boundary. That matters for how the new rule is expressed.

The audit that drove this: 22 `Controller` blocks across 19 files. Five are already correct — the field wrappers under `features/*/components/fields/` — leaving 17 to migrate across 14 files.

## Goals / Non-Goals

**Goals:**

- Every migrated call site is behavior-preserving, so the change can be reviewed as a refactor rather than a product change.
- The end state is lint-enforceable at `error` with zero violations and zero inline suppressions.
- Generic field components come out of this with a prop surface no wider than the data they render.

**Non-Goals:**

- Rewriting the five existing feature field wrappers. They already satisfy the spec.
- Refactoring `WeightField` onto the new `UnitAmountField` despite the overlap. It works; CLAUDE.md §1 "Surgical Changes" applies.
- Backfilling tests for the 21 pre-existing field components. Only the six new ones get coverage.
- Resolving the display-vs-value divergence in the product SEO schema select. It is required behavior — see Decision 5.

## Decisions

### 1. The boundary is role, not directory

`Controller` is permitted in `components/form/**` and `features/*/components/fields/**`. A field component is identified by what it is — generic over `<TFieldValues, TName>`, reading `control` from `useFormContext()`, rendering the `Field` envelope — and the directory is how lint recognises that role.

*Alternative considered:* consolidate every field component into `components/form/`. Rejected — it is a hard lint error, not a preference. `tags-field` and `collections-field` import feature services; `regions-field` and `shipping-box-field` import dialogs from `features/*/pages/`, which would additionally invert the page→shared dependency direction. `multi-select`'s existing spec already assigns per-data-type field components to their features.

Consequence: `features/products/components/attribute-values-field.tsx` moves into `features/products/components/fields/`. It is the only feature field wrapper not already in a `fields/` folder, and the allowlist glob keys on that path.

### 2. Purpose-built siblings, not escape hatches

Generic fields gain only data-shaped props: `icon?: ReactNode` on `SelectFieldOption`, option `value` widened to `string | number` (matching the existing `CreatableSelectFieldOption`), and `readOnly` / `onClick` on `TextField` (`NumberField` already has `readOnly`). These are inert for existing callers.

Where a call site needs different *structure*, a new sibling field is added rather than a prop that alters rendering. Six result: `RadioCardField`, `ChipsInputField`, `UnitAmountField`, `TabsField`, `ProgressBarField`, `GroupTagTableField`.

*Alternative considered:* add `renderOption` to `RadioGroupField`, an adornment slot to `TextField`, a `displayValue` override to `SelectField`. Rejected under CLAUDE.md §1 — each would have exactly one caller, and every future reader of the generic field would pay for the branch. A `displayValue` override is the worst of them: it lets any select report a value it is not bound to.

`UnitAmountField` takes its unit list as `unitOptions` data plus a `unitShortText` mapper, rather than the `SelectContent` children `base-unit-dialog` passes today — same reasoning.

### 3. Feature-scoped fields absorb the domain logic

Four bindings carry logic that cannot move into shared code. Each becomes a field component in its own feature, which also shrinks the page it came from:

| New field | Absorbs |
|---|---|
| `coupons/…/fields/coupon-code-field` | `isManualCodeEditRef`, debounced `useValidateQuery`, `useGenerateNewCodeQuery`, the `setError`/`clearErrors` effect, the Generate Code button, the spinner overlay |
| `settings/tax/…/fields/vat-process-field` | `handleProcessChange` and its `resolveVatProcessChange` side effect on `product_tax` |
| `settings/tax/…/fields/tax-collection-field` | the `boolean` ↔ `'inclusive' \| 'not_inclusive'` mapping and the permanently disabled second option |
| `products/…/fields/schema-select-field` | the default-profile display resolution — see Decision 5 |

`tax-collection-field` is why `RadioGroupField` needs no changes at all: the boolean mapping and per-option disabling stay domain-side.

The coupon code field is also what resolves the "label beside an action" case — the label and Generate Code button move inside the field's shell, rather than `TextField` growing a label slot.

### 4. One deliberate behavior change: VAT radio grouping

`edit-region-eu` renders two separate Radix `RadioGroup`s, each holding a single `RadioGroupItem`, both bound to `type`. Radix scopes roving tabindex per group, so arrow keys cannot currently move between "One Stop Shop" and "Micro Business". `VatProcessField` collapses them into one `RadioGroup` wrapping both Cards.

Visual output is unchanged; DOM grouping and keyboard focus change. This is the only intentional behavioral delta in the change and should be called out in review.

### 5. The SEO schema select preserves its display-vs-value divergence

`seo-settings/schema.tsx` binds its Select to a `displayValue` derived from `resolvedSchemaId` — falling back to the default profile — rather than to `field.value`, so the control shows a profile that is not in form state.

This is required, not accidental: `openspec/specs/product-seo-card/spec.md` scenario "Default profile display without persisting" mandates that `schema_id` stay null until the merchant explicitly selects a profile. `SelectField` binds to `field.value` and has no way to display something else, so this call site gets `SchemaSelectField` instead.

*Alternative considered:* seed the form value on load so display and value agree. Rejected — it violates the requirement above and would change the save payload. If that behavior is ever wanted, it belongs in its own change with a `product-seo-card` delta.

Consequence: `SelectField` needs only the `icon` prop; `valueAsNumber` is not required by any call site in this change and is not added.

### 6. `add-or-edit-attribute` is not a binding

Its `render` destructures only `fieldState`; `field` is never used. The Combobox's value comes from `formData.id` and changes route to `handleAttributeSelect`. It uses `Controller` purely to subscribe to validation state.

It becomes `useFormState({ control, name: 'name' })` with a plain `Field` + `Combobox`. Converting it to `ComboboxField` would be wrong — that would bind the control to `name`, taking ownership of a value it does not drive.

### 7. Lint via `no-restricted-syntax`, not `no-restricted-imports`

A `no-restricted-syntax` entry over `**/*.{ts,tsx}` selecting:

```
ImportDeclaration[source.value='react-hook-form'] > ImportSpecifier[imported.name='Controller']
```

plus an override block setting it `off` for `components/form/**` and `features/*/components/fields/**`.

*Alternative considered:* fold a `paths` entry into the existing `no-restricted-imports` blocks. Rejected — flat-config rule entries **replace rather than merge**, so a broad-glob `no-restricted-imports` config would silently clobber the feature-boundary patterns at `eslint.config.js:52` and `:70`, disabling an `error`-level boundary while appearing to add a rule. `no-restricted-syntax` has zero existing occurrences, so it is collision-free.

Ships at `error`, since the change leaves no violations. It lands last — it cannot go green until every call site is migrated.

### 8. Test scope

Six co-located `*.test.tsx` files for the new generic fields, picked up by the `dom` (jsdom) vitest project (`vitest.config.ts:28`), using `@testing-library/react` per `components/ui/pagination.test.tsx`, wrapped in `FormProvider` + a local `useForm` following `use-bulk-edit-row.test.tsx:17`.

Each covers three cases: renders label and initial value; a user interaction writes the expected shape to form state; an injected error renders the error and marks the control invalid. `components/form/` has no tests today, so this sets the baseline rather than matching one.

## Risks / Trade-offs

- **A "behavior-preserving" swap silently changes behavior** → The riskiest are the ones where the old code did something non-obvious. Each is called out in tasks.md with what to preserve, and the manual verification list is ordered by risk. `inventory`'s `?? 'true'` fallback and `vat-collection-dialog`'s flags are the two easiest to lose.
- **The VAT regrouping changes focus behavior** → Intentional and documented in Decision 4; needs a keyboard check during manual verification.
- **Extracting `CouponCodeField` moves a debounce, an effect and a ref together** → Highest-churn extraction in the change. It stays a pure move; the validate/generate/manual-edit interplay is verified by hand against the current behavior.
- **The lint rule catches only the named import** → An aliased or namespace import (`import * as RHF`) would evade the selector. Acceptable: no such import exists, and the intent is to stop the ordinary pattern reappearing, not to defeat deliberate circumvention.
- **Six new generic fields is real surface area** → Mitigated by each being a thin wrapper on the existing template, and by tests landing with them. The alternative — escape hatches on existing fields — concentrates the same complexity where it is harder to see.
- **No test coverage for the migrated call sites** → Typecheck plus lint prove completeness, not correctness. Correctness rests on manual verification of seven screens, listed in tasks.md.

## Migration Plan

Single PR, no runtime migration or feature flag — this is compile-time only.

Task order keeps the tree typechecking at every step: extend generic field props → add generic fields with tests → add feature-scoped fields → migrate call sites → add the lint rule last. Rollback is a revert; nothing is persisted and no payload shape changes.
