## Context

See proposal.md — Why. The source of truth for the visual design is `sidebar-references/SidebarDraft.dc.html`.

This change was previously planned and implemented against a different design, in which the search box moved into a popover that covered the trigger and chips sat beneath the box. The draft reverses both. The artifacts were rewritten in place rather than superseded, because nothing was committed or archived — so no spec history records a decision that never shipped, and `dropdown-alignment` never has to be broken and un-broken.

What shapes the approach:

- **The committed `MultiSelect` is already 70% of the draft.** Before the superseded attempt it wrapped cmdk's `Command` root around the whole field, put `CommandPrimitive.Input` in the field, and dropped the panel below with `sideOffset={4}`. That structure returns. What changes is the frame around the input (a token row rather than `ChipField`'s two stacked sections), the row's leading gutter (a checkbox), where the create row lives (pinned), and the new keyboard and capping behaviour.
- **cmdk's keydown handler sits on its root**, so the input must be a DOM descendant of `Command`. With the input back in the field, `Command` must wrap the field *and* the popover — which is what the committed version did.
- **React events cross portals.** `PopoverContent` is portalled to `body`, but a keydown inside it still bubbles to `Command`'s React `onKeyDown`. Anything interactive inside the field or the panel that is not a cmdk item therefore needs its keys stopped.
- **`filterCategoryTree`** in `components/ui/category-tree/utils.ts` already does ancestor-preserving filtering. `toggleCategorySelection` from the same file is the cascade we are dropping — one export used, not the other.
- **The panel is 320px wide.** Every layout decision is bounded by that, which is why the category chip truncates rather than wraps.

## Goals / Non-Goals

**Goals:**

- One control shape for all five panel fields, with the tree living in the categories field's option-building and not in `MultiSelect`.
- `MultiSelect` learns nothing about categories, trees, depth, parents or brands.
- No layout shift: the box's height changes only when the merchant's own action changes it.
- The seven call sites that are not panel fields keep working with no edits beyond dropping a retired prop.

**Non-Goals:**

- Virtualizing the option list. `Combobox` has a virtualized path for the country list; category/tag/collection counts do not justify it.
- Unifying `MultiSelect` and `Combobox`. They stay separate, and `Combobox` is untouched.
- Migrating `components/form/categories-dropdown-field.tsx` (coupons) onto the new field — see Risks.
- Ribbon colour, and the draft's status card. Both named in the proposal as out of scope.
- Any change to the product save payload or the form's value shapes.

## Decisions

### The box is a token row, not `ChipField`

`MultiSelect` renders its own bordered container: `display: flex; flex-wrap: wrap; align-items: center`, chips first, the input last as a flex child with `flex: 1; min-width: 80px`. Clicking the container focuses the input.

*Why not `ChipField`:* its contract is "a control row, then a bordered-off chip section beneath it, inside one box". The draft has one row that chips and the cursor share. Teaching `ChipField` a second layout would give it two contradictory jobs for one consumer's benefit. It stays as it is for `categories-dropdown-field`.

*Consequence:* `min-width: 80px` on the input means a box full of chips still has somewhere to type. Without it the input collapses to zero width and the field looks broken but is not.

### Chip capping replaces width measurement

The superseded attempt measured chip widths in a hidden row to fit exactly one line. That is deleted. A `maxVisibleChips` prop caps the count; categories passes 1, everything else passes nothing and wraps.

*Why:* the draft's rule is not "as many as fit" — it is "one, for categories only". Slicing an array is deterministic, needs no `ResizeObserver`, cannot disagree with itself across two renders, and removes the one place this change could regress layout stability. The measurement approach was chosen under the previous design's rule and does not survive its replacement.

*Cost:* a narrow box with one long chip and a `+N more` link can still wrap to two rows. Accepted — it wraps predictably, rather than being measured into a jump.

### The create row is pinned below the list

The create row moves out of `CommandList` into a bordered-off footer inside `PopoverContent`, as the draft has it. It is therefore not a cmdk item: arrow keys never reach it, and it is activated by click or by Enter-with-no-matches.

*Why that Enter rule:* cmdk always keeps an item active while the list is non-empty, so Enter would otherwise always select a row and never create. Falling through to creation only when nothing matched keeps "Enter creates the tag" true in exactly the case the brief describes, without stealing Enter from a visible match.

*Interpretation, flagged:* the draft's footer shows `+ New category` when nothing is typed. That only makes sense for a field whose create flow can ask for the missing name — categories, which opens a form. Tags and collections have nothing to create from an empty query. So the standing label is an opt-in prop (`createEmptyLabel`); categories supplies it, tags and collections do not, and their footer appears only once there is an unmatched query. This is a reading of the draft, not something it states.

*Click, not mousedown:* the draft uses `onMouseDown` because its input closes the panel on blur. Radix's `PopoverContent` already treats clicks inside itself as inside, so `onClick` is correct here and keeps the control keyboard-activatable.

### `Command` wraps the field again, and three things stop their keys

With the input back in the box, `Command` is the outermost element. Three interactive regions then sit inside its React tree without being cmdk items, and each stops keydown propagation:

1. the chip row — so Enter on a chip's remove button removes the chip instead of selecting the active option (this is the committed version's `chipsGuard`, kept, and it is what the `Removing a chip by keyboard` scenario asserts);
2. the `+N more` / `Show less` control, for the same reason;
3. the panel content slot, so a category create form's Enter submits the form rather than selecting a category.

*Alternative considered:* moving the list out of a portal so it is a real descendant. Rejected — the panel would then be clipped by the sidebar's overflow.

### Backspace and comma live on the input, not on `Command`

Both are handled in the input's own `onKeyDown`, guarded on the input being empty (Backspace) and on `onCreate` being present (comma), and comma calls `preventDefault` so it never reaches the value.

*Why on the input:* `Command`'s handler would also see keys from the chips and the panel slot, which is precisely what the guards above are stopping.

### The panel content slot

A `panel?: ReactNode` prop. When present, `PopoverContent` renders it instead of the list and the footer, the popover is forced open, and the slot's keys are stopped.

*Why a slot rather than a categories-specific branch:* it is the smallest surface that lets a field ask a follow-up question in place without `MultiSelect` knowing what the question is. It is one prop, and the alternative — a `CategoryQuickCreate` import inside `MultiSelect` — inverts the dependency the `multi-select` spec's "Domain fields own their own data" requirement sets up.

### Categories: flatten, and render rows two ways

`features/categories/components/fields/categories-field.tsx` holds `search`, passes `onSearchChange` (which turns cmdk's filtering off), runs `filterCategoryTree`, and flattens depth-first into options carrying `depth` and the full ancestor `path`.

`renderOption` indents by `depth` when `search` is empty and renders `path ›` unindented when it is not. `renderChip` renders the subdued path followed by the name.

*Why flatten rather than teach `MultiSelect` about trees:* cmdk's roving focus works over a flat list of `CommandItem`s. Nested DOM containers would break arrow-key order, and `MultiSelect` would acquire a second data model for one caller. Indentation is presentation, which is what `renderOption` is for.

*Why cmdk's filtering is off here:* ancestor preservation is not expressible as a per-item score. The trade-off is that categories search by substring while tags and collections keep fuzzy matching — `filterCategoryTree` is already the shipped behaviour for the coupon category field, so the two tree pickers agree.

### Categories: no cascade

`toggleCategorySelection` is not imported. Toggling appends or removes one ref, which is what `MultiSelect`'s own `handleToggle` already does, so the field passes `onChange` straight through.

`ProductCategoryRefSchema` keeps its optional `level` field; the field stops populating it, since depth is derived at render time from `parent_id`. Nothing reads `level` on submit — the payload flattens to IDs.

### Categories: creation is a small in-panel form, not the full dialog

A `CategoryQuickCreate` component — name input, parent `Select`, Cancel and Create — posts through `useCreateCategoryMutation` and maps server errors with `applyServerErrors`, the same as `CategoryAddEditPopover` does.

*Why not reuse `CategoryAddEditPopover`:* it also carries description and media fields and renders as a modal over a 320px panel. The draft puts two fields in the dropdown. Reuse would mean either showing four fields the draft does not have, or adding a "compact" mode to a dialog whose other caller does not want one.

*Cost, stated plainly:* there are now two places a category can be created, and a new required field on categories would have to be added to both. That is the price of the draft's flow; the mitigation is that both post the same payload through the same mutation, so only the form markup diverges.

### Brand: a single-value `MultiSelect`

`brand.tsx` renders `MultiSelect` with `maxVisibleChips={1}` and an `onChange` that keeps only the last option. The chip carries the logo through `Chip`'s existing `img` slot.

*Why not a `SingleSelect` variant:* "at most one" is a caller's constraint on the value, not a different control. The `multi-select` spec's single-value scenario says so. The field keeps `BrandAddEditPopover` on the create row, which now returns no promise and hands over to the dialog — the same path tags used before.

*What is lost:* the 48px card with the logo at 24px becomes a 28px chip with a smaller logo. That is the draft's treatment.

### Disclosures

A small `CollapsibleField` wrapper: renders a link-styled button until activated, then its children. It opens automatically when the bound value is non-empty on first render, so an existing ribbon or collection is never hidden behind a link.

*Why "on first render" and not "whenever non-empty":* a merchant who clears the field while working in it should not have it collapse out from under the cursor. The spec says this; the implementation is a `useState` initialiser, not an effect.

### Placeholder shortens once something is selected

Optional `selectedPlaceholder`, used when the selection is non-empty. Categories passes `Search`; the full `Search or add categories` shows only while empty.

*Why a prop rather than deriving it:* the shortened form is not mechanically derivable from the long one in any language, and this is a translated string.

## Risks / Trade-offs

**Seven call sites inherit a redesign they did not ask for** (customer-selection, attribute-values, product-table categories filter, `multi-select-field`, `group-select`) → The deliberate choice from grilling: one primitive, one design, consistent with the `multi-select` spec's "exactly one multi-select control". Each is exercised in the task list's verification pass. Attribute-values is the one to watch — it renders colour swatches through `renderChip`, and those chips now sit inside the box on the input's row.

**The chip row and the panel slot both suppress keys that cmdk wants** → Three `stopPropagation` guards is three chances to suppress a key something else needed. Mitigated by keeping each guard on the narrowest wrapper and by the keyboard scenarios in the spec, which are tests: chip removal by Enter, Enter selecting a match, Enter creating when nothing matches.

**Two category creation paths now exist** → Stated above. A follow-up worth taking: migrate the coupon field onto `CategoriesField` and delete `categories-dropdown-field`, at which point the tree helpers have one consumer.

**Dropping the cascade changes saved data for existing products** → No migration needed: previously saved selections still load and render. The behaviour change is forward only.

**Removing "All Products" removes the only bulk action** → A merchant who wants every category must check them one by one. Assigning a product to every category is not a real workflow.

**`Backspace` removing a chip can surprise** → It is a long-standing convention in token inputs, it is in the draft, and it is recoverable by re-selecting. Guarded on an empty input so it never interrupts editing.

## Migration Plan

Not applicable — frontend-only, no persisted data shape changes, no API changes. Rollback is reverting the change.

One note for `/opsx:sync`: the `multi-select` main spec's **Purpose** line still reads "the current selection listed as chips beneath it". A delta cannot change a Purpose, so that line must be edited in `openspec/specs/multi-select/spec.md` by hand at sync time to say the selection sits inside the field.

## Open Questions

None. The draft's contradictions with the earlier brief were resolved before this document: the blast radius, the fate of the measurement component, the create flow, the permanent footer, brand's logo, ribbon's colour, tag free-typing, path truncation, the card composition, and what to do with the superseded artifacts.
