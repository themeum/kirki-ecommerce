## Context

See proposal.md — Why. The design-relevant facts:

- The card is shared. `price.tsx` resolves every field through `field('...')`
  from `useVariantField()` and watches a named key subset through
  `useVariantValues([...])`, so it works under the product form's
  `variants.0.` scope and at the variant form's root without knowing which.
  Everything below applies to both surfaces.
- Profit and margin already come from `calculateProfit(kind, variant)` and are
  not stored. They are currently rendered into disabled `Input`s, which is the
  only reason they look editable.
- `MoneyField` already accepts `autoFocus`, so focusing a newly revealed row
  needs no new plumbing.
- The `Badge` primitive has a `success` variant, which is the green pill in the
  design.
- Clearing a field means `setValue(field(key), null, { shouldDirty: true })` —
  the same call the unit-price popover already makes — and the form schema
  already maps empty money values to `null` in the payload.
- `component-logic-separation` requires decisions that are not rendering to be
  reachable without rendering.

## Goals / Non-Goals

**Goals:**

- A merchant sees exactly the pricing controls their product uses.
- What the card shows and what the product stores never disagree: a hidden row
  means no data.
- The two decisions with real logic — the discount percentage, and which rows
  open on load — are testable without a DOM.

**Non-Goals:**

- Changing which fields exist, their validation, or the saved payload. Every
  field the card writes today it still writes.
- Making the row set configurable or data-driven. There are exactly three
  optional rows; a registry would be more code than the three of them.
- Any change to the variant edit page beyond inheriting the shared card.

## Decisions

### Visibility is local state, seeded once from the loaded values

A single `useState` holding which rows are open, initialised from whether each
row's fields hold a value. After mount, only the add/remove controls write to
it.

*Why:* deriving visibility from the values on every render is the obvious
alternative and it is unusable — deleting the last character of a sale price
would unmount the input mid-keystroke. Seeding once gives the same first render
without that behaviour.

*Consequence to watch:* the seed must run against loaded values, not the
form's empty defaults. On the product edit page the form is populated by a
`reset()` after the product query resolves, so the card can mount before the
values exist. The initialiser therefore cannot be a bare `useState(...)`
evaluated on first render alone — the rows must re-seed when the form
transitions from empty to populated, while never re-seeding in response to the
merchant's own edits.

### Clearing is explicit, and only the remove control does it

Remove sets each of the row's fields to `null` with `shouldDirty: true`, then
closes the row. Nothing else in the card clears a value.

*Why:* it is the one place the card can destroy merchant data, so it should be
reachable by exactly one deliberate gesture and no other path. It also makes
the rule easy to state in the spec and to test.

### The pure parts move out of the component

Two functions in a React-free module: the discount percentage from a price and
sale price (returning null when there is no genuine discount), and the initial
open-row set from a variant's values. The component renders what they return.

*Why:* `component-logic-separation` asks for exactly this, and these are the
two places a bug would be invisible in a screenshot — an off-by-one in
rounding, or a row that fails to open for a product that has data.

*Alternative considered:* inline both in the component and test through the
rendered card. Rejected — it needs a DOM, a form provider and a query client to
assert a percentage.

### Profit and margin become text, not disabled inputs

Rendered as `Text`, in the three-column row with cost per item.

*Why:* they are derived and unstored; a disabled input is a control that
promises editing and then refuses it. The design draws them as text for the
same reason.

### The rows are written out, not generated

Three explicit JSX blocks and three explicit add controls, rather than a
config array mapped over.

*Why:* the rows have little in common — one has a badge, one wraps a popover,
one is a three-column grid with two derived readouts. A shared abstraction
would be parameterised nearly to the point of being the three blocks again.
The repetition here is three similar-looking wrappers, which is cheaper than
the indirection.

## Risks / Trade-offs

- **Remove discards data with no undo.** → Intended and specified; it is the
  only way to express "this product has no sale price". Mitigated by being the
  sole clearing path, and by the row being visibly gone, which is the feedback
  that something was removed.
- **The seeding effect could fight the merchant** — a re-seed triggered by an
  edit would reopen a row the merchant just removed. → The seed must key off
  the form being populated, not off the values changing. This is the part of
  the change most worth a careful read at implementation time, and the
  open-rows helper is unit-tested.
- **The redesign reaches the variant edit page, which was never in the
  screenshots.** → Called out in the proposal. It is the shared card working as
  intended, but it is a second surface for the user to eyeball.
- **Dropping the visible price label risks an unlabelled input.** → The input
  keeps an accessible name via `aria-label`; the spec states the requirement so
  it cannot be quietly lost.
