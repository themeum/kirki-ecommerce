## Context

See proposal.md — Why. The design-relevant facts:

- The product form is one `useForm<ProductFormInput>` over the whole product;
  its variant-level cards address `variants.0.*`. The variant edit page is a
  separate `useForm<VariantFormInput>` whose fields sit at the root.
- The cards bind fields by passing a `name` string to wrapper components
  (`MoneyField`, `NumberField`, `CheckboxField`, …) and by calling
  `useWatch`/`setValue` with the same strings. Nothing else in a card depends
  on which form hosts it.
- Price additionally watches the *whole* variant object to feed
  `calculateProfit` — `useWatch({ control, name: 'variants.0' })` on the
  product form versus `useWatch({ control })` on the variant form.
- In the product form the cards render inside a
  `showSimpleVariantSections` guard in `product-form.tsx`; on the variant edit
  page they render directly in `edit-inventory.tsx`'s `PageContent`.
- Zod is pinned to v3 and `openspec/project.md` requires `prepareFormSchema` /
  `.transform()` only on the terminal schema. A shared *shape* is therefore
  safe to extract; a shared transformed *schema* is not.

## Goals / Non-Goals

**Goals:**

- One definition per card and one definition of the variant field set.
- A card can be dropped into either form without knowing the host form's type.
- A wrong field name fails `npm run typecheck` wherever that is achievable.

**Non-Goals:**

- Full RHF generic typing inside the shared cards (see Decisions).
- Unifying the two forms' submit/validation/error plumbing — each keeps its own
  `useForm`, resolver, and `applyServerErrors` call.
- Any layout, copy, or interaction change beyond the two cosmetic
  convergences named in the proposal.

## Decisions

### Field names come from context, not props

`VariantFieldScope` provides a `prefix` (`''` or `` `variants.${number}.` ``);
`useVariantField()` returns a `field(key)` resolver that concatenates it.
Sections call `field('base_price')`.

*Why:* the prefix is a property of the host form, not of any individual card,
and it must reach nested children (`shipping.tsx` → `shipping-profile.tsx`,
Price → `BaseUnitPopover`). A `namePrefix` prop would be declared once per card
and then forwarded through components that have no other use for it.

*Alternative considered:* a `namePrefix` / `variantIndex` prop drilled through
each card. Rejected for the forwarding cost; also, two sibling cards could
then disagree about the prefix, which context makes impossible.

### Sections read an untyped form context; the key argument carries the types

A shared card cannot name its host form's type, so it uses
`useFormContext()` (RHF's `FieldValues` default) and `field()` returns
`string`. The type safety moves to `field`'s parameter, which is
`keyof VariantFieldsInput` — derived from the shared zod shape, so a renamed or
misspelled field is a compile error at the call site.

*Why:* this is where the checking is worth paying for. `setValue`/`useWatch`
argument types inside a card add nothing once the name itself is verified.

*Alternative considered:* making every card generic in `TFieldValues` and
threading the parameter through props and children. It types the `setValue`
calls but infects every prop signature and every nested component, and still
cannot express "this form has these fields, possibly under a prefix" without
a mapped-path type that Zod's inferred input type does not give us cheaply.

*Trade-off accepted:* inside a shared card, `setValue(field('sku'), value)` is
not checked against the host form's shape. The key is checked; the host form's
possession of that key is guaranteed by the shared shape, which both form
schemas are now built from.

### `useVariantValues()` for whole-object reads

Price needs the entire variant object. A second hook resolves the scope to an
object read: `useWatch({ control, name: 'variants.0' })` under a prefix, or
`useWatch({ control })` at the root, returning `VariantFieldsInput`.

*Why:* it is the only whole-object read in the set, and leaving it to each card
would re-introduce the exact branch the scope exists to remove.

### Shared zod shape, separate terminal schemas

`VariantFieldsShape` holds the fields both forms share, including the
`requiredWhen` sale-price rule. `VariantFormShape` is
`VariantFieldsShape` as-is; `ProductFormVariantShape` is
`VariantFieldsShape.extend({ name, barcode, dimension_unit, attribute_values,
is_default })`. Each keeps its own `prepareFormSchema(...).transform(...)`.

*Why:* project.md forbids a non-terminal `.transform()` under zod v3, and the
two payload shapes genuinely differ. Sharing the shape removes the duplication
that matters (field list plus validators) without touching that rule.

*Note on `requiredWhen`:* it reads root values, so the sale-price rule already
resolves against whichever root it is mounted under. Extraction does not change
its behaviour on either form.

### Inventory's divergences are props, not branches

`onGenerateSku: () => void` is required; `committedQuantity?: number | null`
renders the read-only Committed field only when supplied.

*Why:* the product form's SKU payload reads `title`, `brand`, `categories` and
`attribute_values` — fields that do not exist in the variant form's type and
that sit outside the variant scope. A card that reached for them would be
lying about its own boundaries. The callback keeps the card's knowledge to
"there is a button, it has a pending state".

### Location: `features/products/components/variant-sections/`

Re-exported from the `@/features/products` barrel, which
`features/inventory` already imports (`BaseUnitPopover`, `UnitPriceValue`,
variant schemas). No new top-level feature, no new dependency direction.

## Risks / Trade-offs

- **A `field()` result that does not exist on the host form fails silently —
  RHF registers an unknown path rather than erroring.** → The key argument is
  typed against the shared shape, both schemas are built from that shape, and
  the resolver gets a unit test covering both scopes. This is the one new piece
  of logic in the change and the only thing tested directly.
- **The two cards move and their `variants.0.` literals all change at once, so
  a review diff cannot be read as a pure rename.** → Nothing else changes in
  the same change; the redesign is deliberately deferred to change 2, so any
  behavioural difference found later is attributable to one of the two.
- **`useVariantValues()` at the root scope returns the whole variant form,
  which is a superset check the types cannot enforce.** → Acceptable: the
  variant form's fields *are* the shared shape, and the only consumer
  (`calculateProfit`) reads three price fields.
- **The variant edit page changes visibly (placeholder `600` → `0`, one symbol
  shade).** → Intentional, listed in the proposal; per CLAUDE.md §0 there is no
  browser verification in this project, so the user confirms these two by eye.
- **`product-inventory-card`'s spec already describes a Committed field on the
  product form that the code does not render.** → Pre-existing drift, preserved
  deliberately rather than fixed here; noted in the proposal's Impact.

## Migration Plan

Not applicable — no data, API, or persisted state is touched. The change is
atomic within the SPA bundle: both consumers are updated in the same commit as
the extraction, and the old files are deleted rather than deprecated. Rollback
is a revert.
