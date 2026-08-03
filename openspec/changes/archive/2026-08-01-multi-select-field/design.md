## Context

See proposal.md for motivation. Two multi-select implementations existed; `AttributeValuesField` picked the cmdk one and bent it into the shape of the other by editing the shared primitive.

Constraints: React + Emotion design system, react-hook-form for form state, react-query for option lists, cmdk already vendored and wrapped as `components/ui/command.tsx`, Radix Popover already wrapped as `components/ui/popover.tsx`. No test runner in this repo — `tsc --noEmit`, the preview gallery and a manual pass are the verification surface. PHP/backend unchanged.

## Goals / Non-Goals

**Goals:**

- One multi-select widget in the codebase
- An extension point that never requires reopening the primitive for a new decoration
- Keyboard navigation and active-descendant semantics, which `Suggestions` lacked
- Domain fields that are the single source of truth for their own data type

**Non-Goals:**

- Server-side option search (all three fields still fetch with `limit: -1` and filter client-side)
- Moving `VariationPopover` out of `pages/` (`AttributeValuesField` still imports it across layers, as before)
- Reworking `Chip`, `Command` or `Popover`
- Consolidating the now-unused `components/form/combobox-field.tsx`

## Decisions

### 1. `MultiSelect` is `Suggestions` renamed and hardened, not a third component

- **Choice:** Port `Suggestions`' outer layout into `components/ui/multi-select.tsx`, delete `Suggestions` and `TagManager`, migrate all call sites. Revert `combobox.tsx`.
- **Why:** The design already existed and was battle-tested across six call sites; `TagManager` was pure prop-renaming, so each migration is mechanical. A third implementation would leave three.
- **Alternatives:** Keep `TagManager` as an adapter and migrate later (leaves two names for one widget indefinitely); build fresh on cmdk and migrate `Suggestions` separately (same work, more churn).

### 2. Presentation is supplied through render slots, not option-data flags

- **Choice:** `renderOption` / `renderChip`, defaulting to `option.title`. `MultiSelect` is generic over `TOption extends { value: string | number; title: string }`.
- **Why:** This is the extension point that stops the option type from growing. A colour swatch, a thumbnail or a subtitle is composed by the caller; the primitive never learns about any of them. The generic constraint keeps the slots purely additive — callers passing plain options compile unchanged.
- **Alternatives:** A single `adornment?: ReactNode` on the option (smaller, but `Chip`'s hardcoded `color`/`img`/`subText` stays a second bottleneck); compound `<MultiSelect.Option>` children (maximum flexibility, but the component can no longer filter options because they are JSX rather than data).
- **Note:** `Chip.text` is already `ReactNode`, so `renderChip(option)` passes straight into it and `Chip` needed no change.

### 3. `value` / `onChange` carry option objects, not ids

- **Choice:** `value: TOption[]`, `onChange(next: TOption[])`, identity via `getOptionId`.
- **Why:** It matches what the RHF schemas already hold (`tags: {id, name}[]`, `collections: {id, title}[]`), and it deletes the `optionsById` merge block that existed purely so a just-created value would render as a chip before its query refetched. Optimistic create becomes a one-line prepend.
- **Trade-off:** A selected item's label can go stale if that tag is renamed elsewhere in the app. Accepted — the product form reloads its option lists on mount.

### 4. `onCreate` may return a promise, and `MultiSelect` awaits it

- **Choice:** `onCreate: (query: string) => void | Promise<void>`. A promise puts the create row in a pending state; the search text is cleared and the popover closed **only on resolve**. A rejection leaves both intact.
- **Why:** `Suggestions` cleared and closed unconditionally, so a duplicate-name validation failure silently discarded what the user typed. The three fields all `throw` after mapping the error onto the field, which now reads as recoverable UX rather than a lost entry.
- **Consequence:** the colour flow returns `void` (it hands off to `VariationPopover`), so it closes immediately — which is what that flow wants.

### 5. Per-attribute-type behaviour lives in a registry

- **Choice:** `components/form/attribute-value-types.tsx` maps a type slug to `{ renderOption, renderChip, createVia }`, falling back to `list`.
- **Why:** Keeps `AttributeValuesField` type-agnostic; adding an image type is an entry plus its renderer.
- **Honest scope:** a new attribute type still touches the type button group in `add-or-edit-attribute.tsx` and the backend enum. The registry localises the *field's* half of it, not all of it.
- **Placement:** the registry sits in `components/form/` beside its only consumer rather than under `pages/`, to avoid a second components→pages import.

### 6. `ChipField` is extracted so read-only pickers are not forced to be multi-selects

- **Choice:** The bordered frame (control slot + chips row, with error/disabled states) is its own component. `MultiSelect` composes it; `shipping-zone` composes it directly with a read-only `Input`.
- **Why:** `shipping-zone` used `Suggestions` with `readOnly`, `hasAddBtn={false}` and an `onClick` that opened a *separate* region dialog — it was never a multi-select. Serving it through `MultiSelect` would mean adding `readOnly` and `onClick` props to the primitive for one consumer, which is the exact pattern this change removes. As a side effect the `as unknown as SelectOption` casts at that call site are gone.

### 7. Selected options stay in the list with a checked state

- **Choice:** Toggle semantics — selecting does not remove the option from the list.
- **Why:** Required by the existing `product-variations-card` spec ("its row shows a checked state"), and it matches cmdk/`Combobox`. `Suggestions` filtered selected items out, so Tags, Collections and the category filter change behaviour here; deselecting from the list is now possible.

### 8. cmdk drives the list, with the input in the field and the list in the portal

- **Choice:** The whole field is wrapped in `Command`; the search input is cmdk's `Command.Input` inside the `ChipField` control slot, and `CommandList` lives in the portalled `PopoverContent`.
- **Why:** cmdk resolves items through the list's own ref rather than the root, so a portalled list works; its keydown handler is on the root, so the input only has to be a DOM descendant. This buys arrow keys, `aria-activedescendant` and filtering without hand-rolling a roving tabindex.
- **Consequences:** cmdk's `Command.Input` is used directly rather than `ui/command`'s `CommandInput`, which ships a search icon and its own bordered wrapper this layout does not want. And because the chips end up inside cmdk's root — whose Enter handler calls `preventDefault()` — the chips row stops keydown propagation so Enter still activates a chip's remove button.

### 9. Free-text entry is a field-level concern

- **Choice:** `MultiSelectField` takes `creatable`, which offers the typed text and appends it to the selection; `valueAs="strings"` maps a `string[]` field to and from options.
- **Why:** Customer Details tags are free text with no option list. Appending to the form value is RHF bookkeeping, so it belongs in the field wrapper, not in `MultiSelect`.

## Risks / Trade-offs

- **Six migrated call sites, no automated tests.** `tsc --noEmit` covers shape errors because the generic constraint forces every call site through the compiler, but interaction regressions need the manual pass in tasks.md.
- **Behaviour changes users will notice:** selected options remain in the list (decision 7); Customer Details tags and Selling Location now show the create row and chips-below layout rather than their previous affordances.
- **`limit: -1` option fetching is unchanged**, so a store with thousands of tags still loads them all. Adding server-side search later means a controlled search value and a `loading` flag on `MultiSelect` — roughly two props, deliberately deferred.
