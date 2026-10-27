## Context

See `proposal.md` for the problem. Current state:

- `AddOrEditAttribute` receives `source` and `applied` as props. They fix the card's value options and type for its whole life. The form holds `source_attribute_id` and `source_name`. `ProductAttributeFormSchema` turns a name change into a `create` plan (copies the values) and an unchanged name into a `sync` plan.
- `AttributeNameInput` flags any clash on blur. `useApplyAttribute.apply` repeats that check and blocks.
- `useApplyAttribute.commit` already calls `replaceAttribute` when the persisted attribute id differs from `appliedId`.
- The chip color picker (`withEditableSwatch`) renders its content in a portal. React events from a portal bubble to the React parent, so they reach `MultiSelect`'s `handleBoxClick`. That handler focuses the input and opens the value popover. The new popover then counts the picker as an outside interaction and closes it.

## Goals / Non-Goals

**Goals:**

- A card can change the attribute it works on after a name blur.
- Picker interactions never open the value popover.

**Non-Goals:**

- No API, database or schema change. No server-side duplicate-name change.
- No change to the preset row or `+ Add` popover contents.
- No type chooser in the new-attribute form.

## Decisions

### 1. The card owns its source in state

`AddOrEditAttribute` keeps `activeSource` in `useState`, starting from `source ?? applied`. `existingValues` and `type` for `AttributeValuesField` come from `activeSource`. Switching sets `activeSource` and writes the form fields `source_attribute_id`, `source_name`, `name` (stored name), `type` and `values` (`[]`).

Alternative: remount the card with a new `source` prop. Rejected: the parent would own transient draft state, and the name input would lose focus and its blur sequence.

### 2. One classifier for a name match

`product-attribute-form.ts` gets a pure function that takes the typed name, the store attributes, the ids applied to the product (without the card's own `appliedId`), the current `source_attribute_id` and the selected value count. It returns `none`, `reuse`, `selected-clash` or `applied-clash` with the matched attribute. `AttributeNameInput` and `useApplyAttribute.apply` both use it, so the blur check and the Apply backstop cannot disagree. `findAttributeNameClash` stays as the matching primitive.

`AttributeNameInput` gets two new props: `appliedIds` and `onReuse(attribute)`. On `reuse` it calls `onReuse` and clears the name error. The two clash kinds set a `duplicate` error with different messages.

Alternative: put the match logic inside the card only. Rejected: the Apply backstop needs the same rules.

### 3. Apply needs no new write path

After a switch, `source_attribute_id` is the switched-to attribute and `name` equals its stored name. The schema returns a `sync` plan. New values are added to that attribute through the existing batch request. When the card edits an applied attribute with another id, `commit` already takes the `replaceAttribute` branch. No change is needed there. The unique-name-with-values path already returns a `create` plan with copied values, so the original stays unchanged. A test proves it.

### 4. Portal events are ignored by the box click handler

`handleBoxClick` returns early when the event target is not a DOM descendant of the box (`!event.currentTarget.contains(event.target as Node)`). This ignores clicks that bubbled through a portal. It applies to every `MultiSelect` consumer. It is safe: no consumer relies on a portal click opening the panel.

### 5. A layer-open signal stops the outside click from opening the popover

Radix closes the picker on pointer down. The click that follows can land on the box and open the popover. `MultiSelect` provides a small context. A chip renderer reports `open` and `closed` through it. The box records on `pointerdown` (capture) whether a chip layer was open, and `handleBoxClick` skips the open action once when it was. The context and its hook live in `components/ui/multi-select-chip-layer.ts`. A new `EditableSwatch` component (`features/products/components/editable-swatch.tsx`) reports through `ColorPicker`'s `onOpenChange`; `withEditableSwatch` renders it. The context is opt-in: a consumer that never reports behaves as before.

Alternatives: (a) query the DOM for an open Radix layer. Rejected: couples to library internals. (b) Keep the picker open and handle outside clicks ourselves. Rejected: re-implements dismiss behaviour.

## Risks / Trade-offs

- [Switching drops the card's name focus or draft] → The switch runs in the blur handler and only touches name, type, source fields and the empty `values`. It runs only when no values are selected, so no draft is lost.
- [Stale `activeSource` after the attribute list refetches] → The store list changes only through Apply, which closes the card.
- [Pointer-down flag goes stale] → The flag is recomputed at every `pointerdown`, and consumed by the next click.
- [Change in `MultiSelect` affects other fields] → Decision 4 only removes portal-bubbled clicks. Decision 5 is opt-in. Existing `multi-select` tests must still pass.
