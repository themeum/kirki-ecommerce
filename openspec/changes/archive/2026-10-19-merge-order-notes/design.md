## Context

See proposal.md for motivation. Current state: `orders` has `customer_notes` and `admin_notes`; `carts` has `customer_notes`. The order update request accepts only `admin_notes`. The details page reuses the create-page `NotesCard` read-only and hides it when `admin_notes` is empty. `FlagCard` and `CustomerCard` already save through `handleSaveOrder` from `useOrderDetails` (full form PUT).

## Goals / Non-Goals

**Goals:**
- One `order_notes` name in DB, PHP, API, and TS.
- Details page can add, edit and clear the note.

**Non-Goals:**
- Customer editing of a note after the order is placed.
- Note history, per-author notes, or a data-migration of old values.

## Decisions

- **Edit migrations in place.** The project edits these create-table migrations directly. Alternative: a new migration that copies and drops columns. Rejected by the user; it adds a file and the old data is dev data.
- **Rename cart column too.** Cart and checkout use the same name as the order. Alternative: keep `customer_notes` on cart and map. Rejected: two names for one value. The checkout page sends the note in the checkout request; the cart note is not copied onto the order automatically.
- **No ignored-key shim for old names.** Unknown keys are dropped by the request sanitizers already. No alias code.
- **Email fallback removed.** `CustomerOrderNoteMail` uses only the passed note, so a private merchant note cannot leak into a customer email by default. The `customer-note.php` part reads `order_notes`, as it read `customer_notes` before.
- **Save through the existing form submit.** The details notes component receives `onSave` and `isSaving` and calls `handleSaveOrder` (same pattern as `FlagCard`). No new API call. Alternative: a dedicated notes endpoint. Rejected: more surface, no need.
- **Local view/edit state.** The read/edit toggle is local component state. Cancel resets the form field to the last saved value with `resetField`/`setValue` from the fetched order. `NotesCard` is a card with a `mode` prop: `create` always shows the textarea; `edit` shows the saved note read-only with a pencil icon, and the pencil opens the textarea with Cancel and Save in the card footer. No new file is added.
- **Skip recalculation.** `order-create-context` already skips recalculation for note fields; the key list changes to `order_notes`.

## Risks / Trade-offs

- [Existing dev DBs still have old columns] → Re-run migrations on dev databases. State this in the PR.
- [A customer's checkout note is now editable by the merchant and shown in the same field] → Intended by the request.
- [Full-form PUT on Save sends other unsaved form values] → The details form is reset from the server order, and the other cards already save the same way.

## Migration Plan

Edit both migrations, then reset local databases. No rollback path beyond reverting the commit.
