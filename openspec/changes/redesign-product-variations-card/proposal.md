## Why

Today the Product Variations card makes the merchant pick a List/Color type, find a "Variation Name" in a combobox, and only then pick values. Every new value is also written to the server the moment it is typed, so Cancel leaves orphan rows behind. The redesign makes the common path one click: pick a preset attribute, pick values, then Apply. Each attribute becomes an inline-editable card, and server writes are held back until the merchant commits.

## What Changes

- **Preset row.** Show up to 3 attribute buttons (`+ Color`, `+ Size`, `+ Material`), taken from the attributes table ordered by `id` ascending. Attributes already on the product are skipped and the next ones fill in. A `+ Add` button always follows. The row stays visible under the applied cards.
- **`+ Add` behavior.** If there are unattached attributes beyond the ones shown as presets, `+ Add` opens a searchable popover listing them, with a pinned `+ Add new` item at the bottom. Otherwise `+ Add` goes straight to the new-attribute form.
- **Attribute card, edit mode.**
  - The name is a borderless inline input that shows its border on hover.
  - Below it sits a tags-style value input: chips on the left, and an input that shrinks to a minimum width and then wraps to a full-width line.
  - The value popover is as wide as the card, and a `+ Add new value` / `+ Add "<keyword>"` action is pinned at its bottom.
  - Actions are Delete, Cancel and Apply. The new-attribute form has no Delete.
- **Attribute card, view mode.** Drag handle, name, and read-only chips, plus the hover-revealed Edit and Delete icon buttons (as today). Only the Edit button opens edit mode. Only one card can be in edit mode at a time.
- **Value creation.**
  - Typing a keyword and pressing Enter creates the value directly. For color attributes, the hex is resolved from CSS named colors, or left `null`.
  - `+ Add new value` with no keyword opens a dialog: title and color for color attributes, title only for list attributes.
- **Swatch color edit.** In edit mode, clicking a chip's swatch opens a color picker. On Apply the new hex is written to the shared value, which updates it globally.
- **Deferred, transactional writes.** Nothing reaches the server until Apply: not new attributes, not new values, not color changes. Apply then runs one transactional request.
- **Rename creates a new attribute.**
  - If the merchant edits a card's name and applies, a new attribute is created and the selected values are copied into it. The original attribute is untouched.
  - Saved variants are remapped by value name, so they keep their SKU, stock and price.
  - Name uniqueness is checked on blur (case-insensitive, against the loaded list), and the server's `unique:name` rule acts as the backstop.
- **Delete.**
  - On an applied card, Delete detaches the attribute from the product, never from the attributes table. It keeps today's "N saved variations will be deleted" confirmation.
  - On a never-applied card, Delete just discards it.
- **Removed:** the List/Color type toggle. Custom attributes are always `list`. Also removed: the separate "Variation Name" combobox.
- **Backend.**
  - `POST /attributes` accepts an optional `values[]`.
  - A new endpoint syncs an existing attribute's values (create new ones, update colors) in one transaction and returns the resulting values.

## Capabilities

### New Capabilities

- `attribute-bulk-write`: transactional backend writes that create an attribute together with its values, and sync (create/update) values on an existing attribute in one request.

### Modified Capabilities

- `product-variations-card`: replaces the attribute editor (type toggle + name combobox + values multi-select) with the preset row, the `+ Add` popover, inline-editable attribute cards with a view/edit mode (entered via the hover Edit button), deferred Apply-time persistence, direct and dialog value creation, swatch recoloring, rename-as-new-attribute with variant remapping, and on-blur name uniqueness.

## Impact

- **Frontend (`resources/app/features/products/`):**
  - `sections/variants/attribute-list/*` is rewritten: preset row, add popover, attribute card view/edit.
  - `components/fields/attribute-name-field.tsx` and `attribute-values-field.tsx` are replaced or reworked.
  - `attribute-value-types.tsx` gets new registry entries (inline creation with color resolution, dialog fields).
  - `schemas/forms/product-attribute-form.ts` gets a draft shape (values without ids, name without id).
  - `services/attribute.ts` gets the new mutations.
  - `lib/variant-matrix.ts` / `use-variant-matrix.ts` get a replace-attribute mutation that remaps value ids.
  - A new CSS-named-colors lookup util.
- **Shared UI:** `MultiSelect` may need a pinned footer action and an anchor/width override. Its existing consumers must keep working.
- **Backend:**
  - `AttributeCreateRequest` / `CreateAttributeDTO` / `AttributeService::create` accept `values[]`.
  - A new request, DTO, controller action and route for the value sync, wrapped in `DB::begin_transaction()`.
  - PHPCS wporg rules apply.
- **Unchanged:** Settings → Variation Library, the variant table, product save payload shape, DB schema.
