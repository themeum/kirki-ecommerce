## Why

The product form's right panel presents five related controls in four unrelated shapes. Categories is a bespoke always-open checkbox tree with a select-all row and a footer create form. Tags and Collections are `MultiSelect`s whose chips stack in a separate section beneath the control row, pushing the fields below them off a 320px panel. Brand is a bordered `Card` wrapping a `Combobox`, which becomes a different `Card` once a brand is chosen. Ribbon is a bare labelled text input that occupies permanent space whether or not the product has one.

A design draft (`sidebar-references/SidebarDraft.dc.html`) resolves all five into one shape: a token box whose chips and text cursor share a single wrapping row, with the option list dropping beneath it. Categories additionally collapses to a single chip plus a `+N more` link, because a category's full path is long and the panel is narrow. Collections and Ribbon hide behind `+ Add` links until a merchant wants them.

## What Changes

**The token box**

- **`MultiSelect`'s chips move inside the bordered box**, sharing one wrapping row with the text input rather than sitting in a bordered-off section beneath it. `ChipField` is no longer composed here; it keeps its other consumer.
- **The option list drops below the box** with a small gap, and the text input stays live and visible in the box while the list is open. There is no separate trigger and no panel-over-trigger anchoring.
- **Option rows get a checkbox** in the leading gutter in place of the `Check` icon.
- **Chip remove control becomes `X`** in place of `Minus`.
- **Chip overflow is a caller's decision.** A field may cap how many chips render; the remainder collapse behind a `+N more` link that expands to the full set and offers `Show less`. Uncapped fields wrap every chip.
- **Typing shortcuts.** Backspace on an empty input removes the last chip. On a creatable field, comma commits the typed text the way Enter does.
- **The create row is pinned below the list** behind a divider rather than scrolling with the options, and is labelled from the query: `+ Create "Shirt"`. A field may also supply a standing label shown when nothing is typed, for creation that does not start from a query.
- **A no-match search keeps its empty message.** The pinned create row is always reachable, so the message no longer has to make way for it.
- **The panel stays open after a selection or a create**, with the search cleared back to the full list. **BREAKING** for the `multi-select` capability's "Creation is recoverable" requirement, which currently closes the panel on a successful create.
- **The panel renders caller content in place of the list** when a field needs to ask a follow-up question inside the box — which is how categories collects a parent.

**Categories**

- **Categories becomes a `MultiSelect`-shaped field** sharing the card with the rest, with a scrollable fixed-height list.
- **Category selection stops cascading.** Each checkbox is independent.
- **Category chips carry the full path** — `Clothing Tops › Men › Outerwear`, ancestors subdued, the leaf in normal weight — truncated to the box width with the full path as its tooltip.
- **Only one category chip renders**, followed by `+N more`.
- **List rows indent by depth while browsing and switch to a full-path crumb while searching**, so a nested match still reads in context.
- **Category creation happens inside the panel.** The list is replaced by a name field, a parent dropdown and Cancel/Create; the created category is auto-selected and the list returns.
- **The "All Products" select-all row is removed.**

**Brand, Ribbon, and the panel**

- **Brand becomes the same token box** holding at most one chip, which keeps the brand logo as its leading image. Searching and `BrandAddEditPopover` creation are unchanged.
- **Ribbon collapses behind `+ Add ribbon`** until a merchant asks for it, and gains a remove control that clears it.
- **Collections collapses behind `+ Add to collection`** on the same rule.
- **The panel's two field cards merge into one**, ordered Categories, Brand, Tags, Collections, Ribbon.

## Capabilities

### New Capabilities

- `product-category-field`: the product form's category picker — nested tree selection inside the shared token box, independent (non-cascading) checkboxes, full-path chips capped at one, dual-mode row rendering, and in-panel creation that asks for a parent.
- `product-sidebar-fields`: how the product form's right panel composes its relation and presentation fields — one card, its order, which fields start collapsed behind an add link, and the single-value token box the brand field is built on.

### Modified Capabilities

- `multi-select`: chips render inside the field's box on the input's own row; the selection indicator becomes a checkbox; the create row pins below the list and is labelled from the query; a caller may cap visible chips; Backspace and comma gain meaning; the panel survives a selection or a successful create and can host caller content in place of its list.

### Unchanged Capabilities

- `dropdown-alignment` is **not** modified. Its "Multi-select and menus keep dropping below their trigger" requirement is exactly what this design restores, and the searchable select (the reference for trigger-covering anchoring) is untouched.

## Impact

**Rewritten**

- `resources/app/components/ui/multi-select.tsx` — the token box, checkbox rows, chip capping, pinned create row, keyboard shortcuts, panel content slot.
- `resources/app/features/products/components/product-form/sections/right-panel/brand.tsx` — onto the single-value token box.
- `resources/app/features/products/components/product-form/sections/right-panel/right-panel.tsx` — one card, new order, two disclosures.

**New**

- `resources/app/features/categories/components/fields/categories-field.tsx` — tree rendering, full-path chips, in-panel creation.
- A single-value token box for brand, and a disclosure wrapper for the two collapsible fields.

**Inherits the new design without edits**

- `resources/app/features/tags/components/fields/tags-field.tsx`
- `resources/app/features/collections/components/fields/collections-field.tsx`
- `resources/app/features/customers/components/fields/customer-selection-field.tsx`
- `resources/app/features/products/components/fields/attribute-values-field.tsx`
- `resources/app/features/products/components/product-table/filter-popup/categories-filter.tsx`
- `resources/app/components/form/multi-select-field.tsx`

**Removed**

- `resources/app/features/products/components/product-form/sections/right-panel/categories/` — `categories.tsx`, `list.tsx`, `single-item.tsx`, `add-new-category.tsx`, and the cascade helpers they carry.
- `resources/app/features/products/schemas/forms/product-add-category-form.ts` and its test.
- `resources/app/features/products/skeletons/category-list-skeleton.tsx`.
- `resources/app/components/ui/chip-overflow-row.tsx`, `chip-overflow-utils.ts` and their tests, if present in the working tree — the measured one-line rule they implement is replaced by a caller-supplied cap.

**Deliberately untouched**

- `resources/app/components/ui/combobox.tsx` — the searchable select and its trigger-covering anchor.
- `resources/app/components/ui/chip-field.tsx`, `resources/app/components/form/categories-dropdown-field.tsx`, `resources/app/components/ui/category-tree/` — other consumers, outside this change's blast radius.

**Out of scope, named so it is not mistaken for an omission**

- The draft's status card — status dot and "Saved 2 min ago", the Preview link, the date and time pickers, the inline `/products/` slug editor.
- The draft's ribbon **colour** swatches and preview badge. `ribbon` is a nullable string end to end; a colour needs a migration, model, DTO, request rule and resource, which would make this change no longer frontend-only. It is a follow-up.

**No backend impact.** The product payload still sends categories, tags and collections as ID arrays; the form value shapes are unchanged.
