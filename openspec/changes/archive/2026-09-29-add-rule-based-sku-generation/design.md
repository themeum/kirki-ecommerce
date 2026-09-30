## Context

See proposal.md — Why.

Constraints that shape the approach:

- `kirki_ecommerce_variants.sku` is `varchar(100) UNIQUE NULL`. Uniqueness is
  enforced by the database, so a generator that can return a duplicate turns into
  a save failure the merchant cannot act on.
- `app/Supports/OrderNumberGenerator.php` is the nearest existing thing — a small
  static composer for a formatted identifier — and sets the shape for where this
  code lives, though not for how its number is obtained (see decision 2).
- MySQL 5.7 is the floor wordpress.org allows, so `REGEXP_SUBSTR` and the other
  MySQL 8 regex functions are unavailable.
- The two wand call sites have very different context. The product form
  (`sections/inventory/inventory.tsx`) holds an unsaved draft: title, `brand.id`,
  `categories[]` and the variant's `attribute_values[]` all live in React Hook
  Form state, and for a new product no variant row exists yet. The variant form
  (`features/inventory/.../sections/inventory.tsx`) edits a saved variant by id,
  and its loaded resource (`InventoryResource`) carries `product.name` and
  `attribute_value_labels` but **not** brand or categories.
- Attribute values are `value` or, for colour-type values, `color` — the same
  `value ?? color` fallback `InventoryResource` already uses.
- The plugin targets wordpress.org, so the new endpoint is held to the
  escaping/sanitization/nonce/capability subset enforced by
  `composer phpcs:wporg`.

## Goals / Non-Goals

**Goals:**

- One place where the SKU rule lives, on the server, with no client-side copy.
- A sequence that never skips a number because a merchant generated a SKU and
  then abandoned it.
- Both wands keep working without new data being plumbed into `InventoryResource`.

**Non-Goals:**

- Backfilling or regenerating SKUs for existing variants.
- Making the segment order, separator, or segment width configurable.
- Guaranteeing that sequence numbers are contiguous per product, or that two
  merchants generating simultaneously get different numbers — see the trade-offs
  below.

## Decisions

### 1. The rule lives in `app/Supports/SkuGenerator.php`, not a service

Mirrors `OrderNumberGenerator`: a small static composer with no repository or DI
surface of its own, reading the one model it needs directly.

*Alternative considered:* a `SkuService` alongside `VariantService`. Rejected —
services in this codebase own CRUD for a resource; this owns a string format,
which is exactly what `app/Supports/` already holds.

### 2. The sequence is read from stored SKUs; nothing is persisted

`next_sequence()` is one past `MAX(CAST(SUBSTRING_INDEX(sku, '-', -1) AS UNSIGNED))`
over `variants`. No option key, no seeder entry, no counter to keep in step with
reality.

This replaces an earlier design that persisted a `last_sku_sequence` option and
advanced it atomically on every generate, mirroring `OrderNumberGenerator`. That
version was rejected once built, for a reason worth recording: **a reserved number
is burned when the merchant does not save.** Clicking the wand five times and
saving once consumed four numbers permanently, so the next product started at
`006`. Numbers stayed unique, but the visible behaviour — the 001…009 then 010
progression this feature exists to produce — broke under ordinary use.

Reading the sequence instead of reserving it means a number is only claimed when
a variant holding it is actually stored. Repeating the request returns the same
SKU, which is also better behaviour for a merchant clicking the wand twice.

`SUBSTRING_INDEX` + `CAST` rather than `REGEXP_SUBSTR`: the latter needs MySQL
8.0, and this plugin supports the MySQL 5.7 floor wordpress.org allows. A
non-numeric trailing segment casts to `0` and so never raises the sequence, which
is what keeps legacy `SKU-ABC-WXYZ` values from interfering.

Verified directly against MySQL 5.7.44 with its stock `sql_mode`
(`ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,...`): `BLU-…-001`→1, `FIR-009`→9,
`SKU-ABC-WXYZ`→0, `010` (no hyphen)→10, `ANY-0042`→42, `MAX(...)` over the set→42,
and an empty table→`NULL`, which `(int) null + 1` turns into 1. The non-numeric
cast raises `Warning 1292 Truncated incorrect INTEGER value`, not an error, even
under `STRICT_TRANS_TABLES`. `ONLY_FULL_GROUP_BY` is satisfied because the select
list is the lone aggregate — `once_with_columns()` only injects `['*']` when no
select has been set, and `select_raw()` has set one. This matters because MariaDB,
which the test harness runs, does **not** enable `ONLY_FULL_GROUP_BY` by default
and so would not have caught a violation.

*Alternative considered:* keep the counter but advance it only when a generated
SKU is saved. It avoids burning numbers and keeps deletes from rewinding, but it
needs a hook in the variant save path, carries the same poisoning risk as reading
from SKUs, and still lets two simultaneous generates hand out the same number —
so it buys monotonicity at the cost of real complexity.

### 3. `POST /variants/generate-sku`, taking either a variant id or a draft

One endpoint, one SKU per call:

```
POST /variants/generate-sku
{
  "variant_id": int|null,
  "title": string|null,
  "brand_id": int|null,
  "category_ids": int[],
  "attribute_value_ids": int[]
}
→ { "data": { "sku": "BLU-RED-SMA-NIK-APP-010" }, "message": "..." }
```

When `variant_id` is present the server loads the variant with
`product.brand`, `product.categories` and `attribute_values` and ignores the
draft fields; that is what makes the variant-edit wand work without extending
`InventoryResource`. Otherwise the draft fields are used and the server resolves
brand, category and attribute-value **names from their ids** — the client never
sends the text that ends up in the SKU.

*Alternatives considered:* `GET /variants/{id}/generate-sku` — rejected, the draft
case has no id to put in the path and its inputs (title, brand, category and
attribute-value ids) are a body, not a query string. Sending resolved names from
the client — rejected, it would let the browser dictate SKU content and duplicate
the `value ?? color` fallback on both sides.

### 4. "First category" is the first element of the submitted `category_ids`,
or the first row of the `categories` relation for a saved variant

Product↔category is many-to-many with no explicit ordering column, so "first"
means pivot insertion order on the saved path and form order on the draft path.
These can disagree for the same product; both are stable within their own path,
and the sequence number — not the category segment — is what carries uniqueness.

### 5. No collision retry — uniqueness holds by construction

The candidate's number is strictly greater than every number a stored SKU ends
with, so no stored SKU can equal it. An earlier version looped up to ten times
checking `variants.sku` and taking another number on a hit; with the sequence read
from those same SKUs that branch is unreachable, so it was removed rather than
left as dead code.

The residual exposure is two merchants generating at the same instant: both read
the same maximum, both get the same SKU, and the second one to save hits the
unique index. See the trade-offs below.

### 6. Both wands become `useMutation` calls

A mutation, not a query: it is triggered by an explicit click rather than by
rendering, and must not be cached, refetched on focus, or deduplicated — its
result depends on live table state. While in flight the wand is disabled; on
error the field is left untouched and the failure is surfaced through the
existing `toastMutationError` helper. Response parsing goes through
`parseResponse` + a zod schema — `parseData` is the `useQuery` primitive, which
toasts schema failures itself.

### 8. The bulk edit grid generates in one batch, not one call per row

`POST /variants/generate-skus` takes a set of variant ids and returns one
`{ variant_id, sku }` per id, numbered consecutively from a single
`next_sequence()` read.

This is not an optimisation. Because decision 2 reads the sequence from stored
SKUs and persists nothing, N separate calls would each see the same maximum and
return the same number N times — the grid would fill every selected row with an
identical SKU, and the second save would hit the unique index. Reading once and
advancing in memory is what makes a multi-row generate correct at all.

An id matching no variant is skipped rather than 404ing the batch: the grid holds
rows loaded earlier in the session, and one stale row should not cost the
merchant every other SKU in the selection.

### 9. Filling the SKU column generates instead of copying

Every other column's fill-handle drag copies the origin row's value down.
`handleFillCommit` routes the `sku` field into the same batch generate the header
action uses, so each dragged row gets its own rule-based SKU. Copying would
produce a column of identical SKUs, which the unique index rejects on save — the
one gesture that is guaranteed to be wrong for this column.

The SKU branch generates over the whole fill range rather than the usual
`targetRows`. Every other column excludes the origin row because it holds the
value being copied outward; SKU copies nothing, so excluding it only skips the
cell the merchant dragged from — which is exactly what a merchant selecting the
top cell and dragging to the bottom reported as a bug.

*Alternative considered:* leave fill copying and rely on the header action alone.
Rejected — the handle is present on every selectable column, so a merchant will
drag it; doing the wrong thing silently is worse than doing the useful thing.

### 10. The grid's selection is read imperatively, not subscribed to

`getSelectedRows(field)` is an action read at click time. Components that need to
*show* something for a selection subscribe to `useSelectedRowCount(field)`, a
number. `selectionRange()` allocates a fresh array per call, and
`useSyncExternalStore` compares snapshots with `Object.is` — subscribing to the
array directly would report a change on every store notification, which in this
grid means every mousedown and every mouseenter during a drag.

### 7. `generateSku()` and `randomSkuSegment()` are deleted outright

They have exactly two call sites, both replaced here. Leaving the random
generator behind as a fallback would mean two SKU schemes in one store.

## Risks / Trade-offs

- **Two simultaneous generates hand out the same SKU.** Both read the same maximum
  before either saves, so the second save hits the unique index on `variants.sku`
  with a constraint error rather than a friendly message. → Accepted as the cost of
  not reserving numbers. It needs two merchants on the same store clicking the wand
  between one save and the next; the alternative — reserving a number per click —
  was tried and burned a number on every abandoned generate, which is the far more
  frequent event. Worth revisiting only if it is actually reported.
- **A SKU ending in an absurdly large number poisons the sequence.** A hand-typed
  or imported `X-99999999` pushes every later SKU past it. A tail wide enough to
  exceed `PHP_INT_MAX` is worse: MySQL saturates the cast at `18446744073709551615`
  (confirmed on 5.7.44), and `(int) … + 1` in PHP overflows to a float that renders
  as the literal segment `9.2233720368548E+18`. → Accepted for the ordinary case
  and unhandled for the overflow, which needs someone to store a SKU ending in a
  20-digit number; this is the known cost of reading the sequence from
  user-editable data.
- **Sequence numbers interleave between products.** Numbers are claimed in save
  order, so "product 1 takes 001–009, product 2 starts at 010" holds only if the
  merchant finishes one product before starting the next. → Accepted: numbers stay
  unique, which is what the format needs them for. Strict per-product contiguity
  would require the bulk generation action that was explicitly ruled out of scope.
- **Deleting a variant releases its number**, so a later SKU can reuse it. →
  Accepted, and it is what makes abandoning a draft free. The released number is
  free precisely because nothing holds it any more.
- **Colour attribute values produce meaningless segments.** A value stored only
  as `#FF0000` normalizes to `FF0`. → Accepted: it matches how the rest of the
  admin already labels those values, and the SKU stays unique regardless.
- **A SKU longer than 100 characters would be truncated by MySQL**, potentially
  breaking uniqueness. → Not handled. It takes roughly 23 attributes on a single
  product to reach the ceiling; adding trimming logic for that would be dead code.
  Noted here so it is a known bound rather than a surprise.
- **`MAX(...)` over `variants.sku` is a full scan of that column.** The expression
  wraps the column so the unique index cannot serve it directly. → Accepted; one
  aggregate over an indexed column per wand click is not a load a store of any
  realistic size will notice.
- **The wand now needs a round trip.** A slow or offline admin gets a visibly
  disabled button instead of an instant value. → Accepted as the cost of the
  server owning the rule; the request is a single small POST.
- **Existing SKUs are now in a different format from new ones.** → Accepted; no
  backfill is in scope and both formats satisfy the unique index. Legacy
  `SKU-ABC-WXYZ` values cast to `0` and never raise the sequence, though a legacy
  SKU whose random tail happens to be all digits does count toward it.

- **A grid batch can still collide with a concurrent one.** Two merchants
  generating over overlapping rows at the same moment read the same maximum, and
  the wider the batch the wider the overlap. → Accepted on the same terms as the
  single-SKU case above; the batch does not create the race, only widens the
  window it applies to.
- **Generated SKUs in the grid are lost if the merchant navigates away.** They
  live in form state until Save, like every other bulk edit. → Accepted, and
  consistent: the unsaved-changes guard already covers them.

## Migration Plan

No data migration and no new stored state. The generator reads whatever is in
`variants.sku` on an existing install, so the first generated SKU simply follows
the highest number already there. Rolling back means reverting the code; nothing
is left behind.
