# Design

## Context

See proposal.md for the problem. Current state:

- Variant payloads reach the database through two shapes. Product create/update and duplication
  build `CreateVariantDTO` / `UpdateVariantDTO`. The single variant update
  (`VariantController::update` -> `partial_update`) and bulk update (`bulk_update`) pass plain
  arrays to `VariantService::update_variant()`, with no DTO. Updates can be partial: a payload may
  carry only the flag, or only the value.
- Every path ends in `Variant::create()` or `$variant->update()`, which call `Variant::save()`. The
  framework `Model` has no saving event; it has `save()`, `set_*_attribute` mutators, and `boot()`
  hooks.
- Read paths (`InventoryService`, `OrderCalculationContextService`, `CartResource`,
  `PageInlineScript`, `cart-item.php`) already check the flag before using the value. Only
  the value is wrong when the flag is on and the value is null or 0.
- `Sanitizer::INT` casts with `(int)`, so an empty string becomes 0. Null stays null.
- The admin form already shows 1 for an empty value (`product-form.ts`), so the UI and the backend
  will now agree.
- The plugin is not released yet, so there are no production rows to repair.

## Goals / Non-Goals

**Goals:**
- A stored variant with the limit on always has `max_per_order >= 1`, whichever endpoint saved it.

**Non-Goals:**
- No change to read paths, REST response shape, or admin form.
- No clearing of `max_per_order` when the flag is off. The stale value stays and is ignored.
- No data migration for existing rows (the plugin is not released). No DB-level constraint (a CHECK would also constrain rows with the flag off, and the column is nullable on purpose).

## Decisions

**1. Normalize in `Variant::save()`, before the parent save runs.**
If `has_limit_per_order` is true and `max_per_order` is null or less than 1, set `max_per_order` to 1.
At that point the model holds the existing row merged with the incoming change, so a partial update
is judged on the final state: turning the flag on over a stored 5 keeps 5, turning it on over a
stored null gives 1, and turning it off changes nothing. Create, update, duplicate, single, bulk, and
seeder paths all end in `save()`, so one rule covers all of them.
*Alternatives:* (a) DTOs: rejected, because single and bulk update never build a DTO, and a DTO sees
only the incoming payload, so a partial payload that omits `max_per_order` would be judged on a
missing value and could overwrite a stored 5 with 1. (b) `VariantService` (`create` and
`update_variant`): central too, but needs its own merge of payload and stored row, and other code
that saves a `Variant` directly would skip it. (c) a `set_max_per_order_attribute` mutator: it
cannot rely on the flag being assigned first. (d) copy the rule into each request class: four
copies, and request classes validate, they do not transform.

**2. Validation is `integer|min:1|nullable`; no `required_if`.**
`nullable` skips `min:1` for null, so an unchecked or empty field passes. Defaulting to 1 in the model
replaces the need for `required_if`, which also avoids the unresolved `has_limit_per_order` key
inside `variants.*` arrays. An explicit 0 with the flag off is rejected by `min:1`. This is
accepted, because 0 has no meaning for this field.
*Alternative:* keep `gte:0` and let the DTO fix 0. Rejected by the user: the field should never be 0.

**3. Flag off leaves the value alone.**
Read paths already ignore it, and clearing it would lose the number a merchant typed before
unchecking. The user chose this explicitly.

## Risks / Trade-offs

- [`''` sent with the flag off becomes 0 through `Sanitizer::INT` and fails `min:1`] → The admin
  form sends a number or null, so the UI is not affected; only a hand-built API call can hit it. The
  error message names the field.
- [A write that skips `save()`, such as a raw query-builder update] → No code in the repo does this
  for these two columns today (checked: updates use `$variant->update()`). A model test pins the
  behavior so a future bypass is noticed in review.
- [`save()` skips the update when the model is not dirty] → The rule runs first and changes the
  attribute, so a row repaired by the rule becomes dirty and is written.
