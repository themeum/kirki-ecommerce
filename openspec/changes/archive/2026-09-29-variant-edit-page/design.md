## Context

See `proposal.md` — Why. What shapes the approach here:

- `resources/app/eslint.config.js` enforces two rules that constrain every file
  placement below. A feature may not deep-import another feature's internals
  (only its `index.ts` barrel), shared root directories may not import
  `@/features/*` at all, and React Hook Form's `Controller` may only be used
  inside `components/form/**` or `features/**/components/fields/**`.
- Three OpenSpec changes are open against the product form's cards:
  `product-form-price-card`, `product-form-shipping-box`, `product-form-design`.
- The product form's Price / Inventory / Shipping sections bind to hardcoded
  `variants.0.*` names and read a root-level `currency` field that only exists
  on the product response.
- `VariantService::find()`, `update(UpdateVariantDTO)` and
  `app/DTO/Variant/UpdateVariantDTO.php` are all written and currently
  unreachable — no controller method or route calls them.
- `openspec/project.md` fixes the form-schema pattern (`prepareFormSchema` then
  a terminal `.transform()` naming every payload field), and the zod v3
  constraints that go with it.

## Goals / Non-Goals

**Goals:**

- One vertical slice: endpoints, page, and the route into it, reviewable together.
- The page's cards read as the product form's cards, so a merchant moving
  between the two screens sees one design.
- No regression risk to the product form while its own changes are in flight.

**Non-Goals:**

- Deleting a variant. `VariantService::delete()` exists but the semantics are
  undecided (a product left with no variants, orders referencing the variant,
  the default variant), so no `DELETE /variants/{id}` here.
- Creating a variant from this screen. Variants are still created through the
  product form's variant matrix.
- Reworking the bulk-edit grid or its endpoints.
- Editing a variant's attribute values. The header displays them; the form does
  not change them.

## Decisions

### A real single-variant endpoint rather than reusing the bulk one

`GET /variants/bulk/{id}` and `PUT /variants/bulk` with a one-element array
would have worked with zero backend change, and the bulk mutation hook already
invalidates the right query keys. Rejected because of what it costs the client:
a missing id returns an empty collection rather than a 404, so the page cannot
distinguish "no such variant" from "an empty result", and server validation
errors come back keyed `variants.0.sku`, forcing the page to strip a prefix
before `applyServerErrors` can map them onto flat field names. Both are
permanent client-side workarounds for a missing route. The route also activates
`UpdateVariantDTO` and `VariantService::update()`, which were written for this
and never wired up.

**Route ordering is load-bearing.** `PUT /variants/bulk` and
`PUT /variants/{id}` are both single-segment; `bulk` matches `{id}`. The bulk
route must stay registered above the new one. This is the one way this change
can silently break an existing feature, so it gets its own verification step.

### Inventory-local card sections, accepting the duplication

The alternative was adding a `namePrefix` prop to the product form's three
sections, re-exporting them from `@/features/products`, and rendering them from
inventory. Single source of truth, no drift — but it edits three live
product-form files while three OpenSpec changes are open against exactly those
files, and it makes the inventory feature depend on the products feature for its
core UI.

Chosen instead: adapted copies under
`features/inventory/components/variant-form/sections/`. This is real
duplication (~600 lines) and is accepted deliberately, not overlooked. The trade
is regression risk and merge conflict now against drift later. Extraction is a
reasonable follow-up change once `product-form-design` is archived; it is not
attempted here.

Field names on the copies are flat (`base_price`, not `variants.0.base_price`),
which is what lets server errors map onto the form without prefix handling.

### Currency symbol from app config, not a new response field

The product form reads `currency.symbol` off the product response;
`VariantResource` has no equivalent and adding one would mean deciding what a
variant's currency even means. `useAppConfig()`
(`contexts/app-config-context.tsx`) already exposes `base_currency.symbol` to
any component, which is the same value the product form ends up showing for a
single-currency store. Falls back to `'$'`, as the product form does.

### The unsaved guard and toast move to shared, rather than being copied

Opposite call to the cards, for a reason: `use-unsaved-navigation-guard.ts` is
generic `useBlocker` plumbing and `unsaved-toast.tsx` already takes a `message`
prop with a default — they were written to be reused and simply live in the
wrong directory. Neither imports `@/features/*`, so both are legal under the
shared-directory lint rule. The move touches two import lines in the product
form and changes no behaviour there, which is a much smaller intrusion than
editing its cards. Copying generic plumbing would have no design justification.

The alternative — re-exporting them from the products barrel — was rejected
because it would make the inventory feature depend on the products feature for
form plumbing that belongs to neither.

### No barcode, against the screenshot

The supplied screenshot shows a barcode field with a generator.
`openspec/specs/product-inventory-card/spec.md` forbids barcode on the product
form's Inventory card, and no other screen in the admin exposes it. Showing it
on only this screen would make the two variant-editing surfaces disagree.
Omitted, per the decision recorded in the approved plan.

### `attribute_values` gets a validation rule on the new request

`BulkUpdateVariantRequest` sanitizes `variants.*.attribute_values` in
`filters()` but never declares it in `rules()` — values pass through
unvalidated. The new `UpdateVariantRequest` declares it properly.
**The bulk request is left alone**: fixing it is out of scope for this change
and would alter behaviour the bulk-edit grid depends on. Flagged here so it is
not mistaken for an oversight.

## Risks / Trade-offs

- **Route ordering regresses bulk updates** → `PUT /variants/{id}` registered
  after `PUT /variants/bulk`, plus an explicit verification step asserting the
  bulk endpoint still reaches `bulk_update`.
- **The duplicated cards drift from the product form's** → Accepted knowingly.
  The three in-flight product-form changes will land first; whatever they change
  must be mirrored, and the spec's "field parity with the product form"
  requirement is what a future reviewer checks against.
- **Moving the guard and toast conflicts with the open
  `product-form-unsaved-toast` work** → The move is import-only and carries a
  delta spec. If that change is mid-implementation when this one applies, do the
  move last so its conflict surface is two lines.
- **`product_id` added to `VariantResource`** → Additive; no consumer reads a
  fixed key set. The bulk-edit grid parses through `VariantSchema`, which is
  lenient by project convention.
- **Row-click navigation competes with row selection** → The selection checkbox
  must stop propagation. `DataTable` already ships `onRowClick` with a
  `clickable` style, so this is existing, exercised behaviour rather than new
  wiring.
- **A large form with no server-side draft** → Out of scope; the unsaved-changes
  guard is the mitigation, same as the product form.

## Migration Plan

None. Two additive routes, one additive response field, one new client route.
No database migration, no dependency change, nothing removed. Rollback is
reverting the change; the bulk endpoints that previously served all variant
editing are untouched throughout.

## Corrections during implementation

### `UpdateVariantDTO` is not safe for a partial write — using `partial_update()` instead

The proposal and task 1.4 said the new `update` endpoint would hydrate
`UpdateVariantDTO` and call `VariantService::update()`, activating code that was
written and never wired up. In the code, that path corrupts data:

- `DTO::from_request()` builds the object from `$request->sanitized()`, and the
  constructor only assigns keys that are present. Every absent property keeps
  its **declared default**.
- `VariantService::update()` then calls `$data->all()`, which returns *every*
  public property — defaults included — and passes the whole array to
  `$variant->update()`.
- `product_id` and `is_default` are both in `Variant::$fillable`. The variant
  edit form deliberately sends neither, so a save would write
  `product_id = null` and `is_default = false`, detaching the variant from its
  product and clearing a product's default variant.

`VariantService::partial_update($id, $data)` writes only the keys handed to it,
and `Sanitizer::traverse_and_sanitize()` skips any rule whose key is absent from
the request, so `$request->sanitized()` contains exactly the submitted fields.
The controller uses that pair instead.

Consequences:

- `UpdateVariantDTO` remains unused. The proposal's claim that this change wires
  it up does not hold, and is corrected there.
- `attribute_values` is not accepted by `UpdateVariantRequest` at all, rather
  than being given the validation rule the Decisions section describes. The
  attribute-value sync lives in `VariantService::update()`, which is no longer
  on this path, and editing attribute values was already a Non-Goal. The
  observation about `BulkUpdateVariantRequest` declaring it in `filters()` but
  not `rules()` still stands as a pre-existing gap, still out of scope.
- `barcode` and `is_default` are likewise not accepted — the screen edits
  neither, and accepting a field the form never sends is how the clobbering
  above happens.

### Route collision guarded by a constraint, not just ordering

The Decisions section made registration order the mitigation for `bulk` matching
`{id}`. The codebase already has a stronger idiom — `->where('id', '[\d]+')`, as
used by the coupon and product routes. Both new routes carry it, so `bulk` can
never match `{id}` regardless of order. Ordering is preserved as well.

### `BaseUnitDialog` needed no copy

Task 5.1 assumed the unit-price dialog would have to be copied and adapted to
flat field names. It does not bind to the parent form at all — it runs its own
`useForm` over `BaseUnitFormSchema` and communicates through `data` / `onChange`
props — and it is already exported from the `@/features/products` barrel. The
page imports it. This is the one piece of the product form's pricing UI that was
already prefix-agnostic.

### `preview_url` added so "View on store" has something to open

The header's overflow menu was specified as holding "View on store", but
`preview_url` lives on `ProductResource` (passed in by `ProductController` from
`ProductService::get_preview_url()`), not on the variant. `VariantResource` now
takes the same optional constructor argument and `VariantController::show()`
supplies it from the variant's product slug; `VariantResource::collection()`
calls are unaffected and pass `null`. The menu renders only when a URL is
present, matching how the product form gates its own Preview action.

### The header's title is rendered as `children`, not `text`

`PageHeading`'s `text` prop is typed `string`, so the linked product name cannot
go through it. The name, the separator and the attribute-value line are all
rendered in `children` with a compensating negative margin, since `PageHeading`
still emits its (empty) heading element ahead of them.

### The repo has no phpcs, and `eslint .` does not pass on `main`

Two verification steps were written against tooling that does not behave as
assumed. There is no phpcs config or binary in the repo, so PHP checking is
`php -l` plus the docker integration suite (`composer test:docker:integration`,
270 tests). And `npx eslint .` reports 17 pre-existing errors on `main`, so the
bar used throughout was *no new errors* against that baseline, verified by
diffing the failing-file list. The moved import in `product-form.tsx` was sorted
by hand rather than with `--fix`, to avoid silently fixing unrelated debt in
that file.
