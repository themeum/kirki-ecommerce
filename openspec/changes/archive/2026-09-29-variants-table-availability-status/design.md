## Context

See `proposal.md` — Why. Requirements live in `specs/`; this document covers only how they are met.

Four properties of the current code shape the approach:

- **Variant rows in the product form are not all persisted.** Newly generated combinations exist only in browser form state, with no id, until the product is saved. Anything that must render for them cannot come from the server.
- **The product list already eager-loads variants** (`ProductService::list_query()` loads `variants`), so a product-level status costs no extra queries there. It does *not* load `variants.product`, which `VariantResource` dereferences for the variant's name and fallback media.
- **Variants are persisted one row at a time** through `VariantService` inside a transaction, using mass assignment. A new column needs no repository or upsert work — only `$fillable`, the DTOs, and the request rules.
- **`available_quantity` is already net of committed.** `InventoryService::reserve_stock()` moves quantity out of available and into committed, so the algorithm reads available directly.

## Goals / Non-Goals

**Goals:**

- One statement of the algorithm per runtime, with the two kept demonstrably in step.
- A status that tracks live form edits in the variants table, not the last saved state.
- Server-side filtering that resolves thresholds exactly as the displayed status does, so a filter never disagrees with the label it filtered on.

**Non-Goals:**

- A shared cross-language definition of the algorithm (no code generation, no schema-driven rule table). Two small pure implementations plus a shared test case table is the cheaper and more legible trade at this size.
- Reconciling `InventoryService::has_stock()` with the new labels. The divergence is specified deliberately; see the back-order requirement in `specs/variant-availability-status/spec.md`.
- Reworking the variant-level inventory list, which keeps its existing two-state filter.

## Decisions

### The algorithm is implemented twice, and pinned by a shared case table

The variants table must re-render a status while the merchant is typing, for rows that may not exist server-side; the product list has no variant data in its response at all. Neither side can borrow the other's result, so the algorithm exists in both PHP and TypeScript as pure functions over explicit inputs — no model or component access — with the store default passed in rather than read internally.

*Alternative rejected:* compute only in PHP and have the table display it. The label would be stale on every keystroke and empty for newly generated variants, which is precisely the population a merchant is looking at after adding an attribute.

Drift is the real cost. Both suites assert the same enumerated case table — every Layer 1 branch, and Layer 2 including the order-independence pair — so a change to one side that is not mirrored fails a test rather than silently diverging.

### Layer 2 is a set rule, not a fold over the document's matrix

`availability-status.md` gives a pairwise matrix whose outputs include Partially Stocked but whose inputs do not, so folding across three or more variants reaches an undefined `PS + X` cell, and the result depends on variant order. The set rule in the spec reproduces all six defined cells of that matrix exactly while being total and order-independent.

*Alternative rejected:* extending the matrix with a PS input row. It preserves the document's framing but requires inventing three cells and still needs the operator to be associative to be safe.

### The threshold column is named for what it does, and the frontend field is renamed to match

`min_stock_threshold` already exists in the frontend — schema, form state, Inventory card, and save payload — but has no column, so PHP discards it. Since the new state it enables is called Low Stock, the column is `low_stock_threshold` and the frontend field is renamed.

*Alternative rejected:* naming the column `min_stock_threshold` to avoid frontend churn. It costs nothing today but leaves the persisted field named for a different concept than the state it drives, which is how the current mismatch arose.

Nothing was ever stored under the old name, so this is a rename in code only — there is no data migration and no compatibility window.

### Null and zero thresholds mean different things

`null` defers to the store default; `0` is an explicit "never warn me about this variant". The store default ships as `0`, so the upgrade is inert: no store's labels change until a merchant opts in.

*Alternative rejected:* shipping a non-zero default so the feature works out of the box. It would repaint every existing store's product list on upgrade without anyone asking for it.

### A new constants class, leaving `InventoryType` alone

`App\Constants\InventoryType` is shared by the product list and the variant-level inventory list. Partially Stocked cannot describe a single variant, so widening it would admit an impossible value into the variant list's validation set. A new `App\Constants\Product\AvailabilityStatus` carries all four states; `InventoryType` keeps serving the variant list unchanged.

### Filtering translates the set rule into `EXISTS` / `NOT EXISTS`

The set rule maps directly onto correlated subqueries over a product's variants, with the store default bound as a parameter so per-variant thresholds resolve via `COALESCE(low_stock_threshold, :default)`:

```
LS:  EXISTS(low)
PS:  NOT EXISTS(low) AND EXISTS(out) AND EXISTS(in)
IS:  NOT EXISTS(low) AND NOT EXISTS(out)
OS:  NOT EXISTS(variant that is not out)
```

This keeps filtering server-side and paginated. The alternative — filtering the current page in PHP after loading it — would make totals and pagination wrong, which the spec forbids.

The filter parameter is renamed to `availability_status`. The frontend currently sends `stock_status` while the backend reads `inventory_type`, so the filter does nothing today; there is no working behavior to preserve, and no consumer of either name.

### The product list computes its own status rather than reusing `VariantResource`

`VariantResource` reaches through `$this->product->title` and `$this->product->media`, which the list query does not eager-load. The list resource therefore calls the availability service directly over its already-loaded `variants` collection.

### `MoneyField` is hosted in a nested form

The group parent row is not a form field — there is no variant path meaning "this group". `MoneyField` resolves its control from context, so the price cell wraps its own single-field form provider and writes through to the real variants on change. UI-only state stays out of `ProductFormInput` and therefore out of the save payload.

*Alternative rejected:* pointing the field at the first child's path and mirroring to siblings. It makes the parent row secretly an editor for one specific child, and writes partial keystrokes into real product data.

### Propagation on keystroke, with a validity guard

Per the approved plan, each keystroke writes to every child rather than committing on blur. `MoneyField` emits the raw input string, so an empty or partial value would otherwise blank the children's prices; propagation is skipped unless the input parses to a number. Each write replaces the whole variants array, so a wide group re-renders on every character — acceptable at realistic group sizes, and revisitable if it proves slow.

### Parent media is aggregated by distinct id

Assigning media to a parent fills every child with the same image. Counting raw entries would then render a stack implying variety that does not exist, so the parent deduplicates by media id before deciding between a flat thumbnail and a stack.

This also requires fixing `getCombinedVariantData`, which today seeds its media array with the first child and then re-processes that same child, yielding `[first, first]` — so the existing stack renders one image twice. Two assertions in `variant-group.test.ts` pin that behavior deliberately, with a comment; they change with it. The same function must also stop collapsing min and max into a formatted string, since the range editor needs them as numbers.

## Risks / Trade-offs

- **The two implementations drift.** → Both suites assert the same enumerated case table, including the order-independence pair; a one-sided change fails a test.
- **The label contradicts purchasability for back-orderable variants at zero quantity.** → Specified and scenario-tested rather than left implicit, so it reads as a decision rather than a bug. Revisiting it means changing one Layer 1 branch and its cases on both sides.
- **Keystroke propagation rewrites the variants array per character.** → Guarded against invalid input; contained to one group. If profiling shows a problem, moving to a debounced or blur commit changes only the price cell.
- **The migration must be appended to the end of `config/migrations.php`.** That file is an explicitly ordered list whose comments forbid reordering. → Append only; never insert.
- **Filtering and display could disagree** if one resolves thresholds differently from the other. → Both take the store default from the same settings read, and the SQL mirrors the same coalesce.
- **The bulk-edit table's "Availability" column already means quantity.** → Renamed to "Quantity" in the same change, so the word means one thing across the admin.
- **A product with no variants still fatals** in both list resources, which dereference the first variant unconditionally. Pre-existing and out of scope, but the new code must not add a second way to fail — hence the empty-group requirement returning no state rather than defaulting.

## Migration Plan

The column is added by an alter migration appended to the end of `config/migrations.php`. Migrations run automatically on version update via the `before_each` hook in `config/version-updates.php`, and the migration repository records each one so it runs at most once per installation — so no version constant or manual step is involved.

The upgrade is behaviorally inert: the store default is `0` and every variant's threshold starts null, so Layer 1 can only return In Stock or Out of Stock until a merchant sets a threshold. Product list labels replace a number with a state, but no product changes which state it is in.

Rollback is the migration's `down()`, which drops the column. The frontend rename has no stored counterpart, so reverting the code is sufficient on that side.
