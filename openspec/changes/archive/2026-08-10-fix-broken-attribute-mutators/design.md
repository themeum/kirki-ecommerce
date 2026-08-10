## Context

See proposal.md - Why. Six mutators across five models return a computed value instead of assigning `$this->attributes[$key]`, so `Model::set_attribute()` (which delegates entirely to a mutator once one exists, per `libraries/framework/Database/Concerns/HasAttributes.php:311`) silently drops the write. Four more mutators assign correctly but duplicate the `'json'` cast already declared for the same field. `Order::flags` has the same return-instead-of-assign bug but has no cast fallback (it's a comma-separated string column).

## Goals / Non-Goals

**Goals:**
- Make every field listed in proposal.md actually persist assigned values.
- Reduce duplication by letting the `'json'` cast own encode/decode wherever a mutator was only replicating it.
- Surface (not silently absorb) the `NULL` → `"[]"` behavior delta for empty-array assignment.

**Non-Goals:**
- Backfilling existing rows where data was historically dropped by these bugs. Any such row already has `NULL`/stale data and there is no way to recover the originally-intended value from the DB alone — a backfill isn't possible, only future writes can be fixed.
- Changing the framework's `set_attribute()`/mutator-delegation behavior itself. It matches Laravel's own legacy mutator contract (a `set_X_attribute` method is expected to self-assign); the bug is in these six mutators not following that contract, not in the framework.
- Touching `Coupon::set_start_datetime_attribute`/`set_end_datetime_attribute` — correct, and doing real work (UTC normalization) a cast can't express.

## Decisions

**Delete the JSON mutators rather than fix them in place.**
Once a mutator is removed, `set_attribute()` falls through to the `is_json_castable($key)` branch, which calls `Arr::json_encode()` — functionally identical to what the mutators were doing by hand. Keeping a mutator that just does `$this->attributes[$key] = Arr::json_encode($value)` (Product/Coupon's working ones) adds no behavior over the cast; keeping it "fixed" (`return` → assignment) for the broken ones would leave duplicate logic in two places that must stay in sync. Deleting is the smaller, more maintainable diff, and it's a strict behavior superset (see empty-array note below) rather than a change to the encode format itself — `Arr::json_encode` is the same call the cast machinery makes.

**Fix `Order::flags` in place rather than removing it.**
`flags` has no cast entry — it's a hand-rolled comma-separated string, not JSON. There's no cast fallback to delete down to. The fix is mechanical: assign the already-correct computed value to `$this->attributes['flags']` instead of returning it. The paired `get_flags_attribute` (explode on comma back into an array) is correct as-is and untouched.

**Accept the `NULL` → `"[]"` empty-array behavior delta rather than special-casing it.**
The old mutators encoded `!empty($value) ? json_encode($value) : null` — collapsing `[]` to `NULL`. The bare cast encodes any non-null value, so `[]` becomes the string `"[]"`. Preserving the old `NULL`-for-empty-array behavior would mean keeping a thin mutator around specifically to special-case emptiness, defeating the goal of deleting the duplication. Both `NULL` and `"[]"` decode back to `[]` on read (`cast_primitive_type`'s `array`/`json` branch: `is_array($value) ? $value : $this->from_json($value)`), so this is invisible to any code that reads through the model. The only risk is code that queries the raw column directly (`WHERE column IS NULL`) instead of through the model — covered by a verification task before implementation, not a design workaround.

## Risks / Trade-offs

- **[Risk]** Some query or report might filter `WHERE tags IS NULL` (or the same for `product_data`, `tax_breakdown`, `schema`, `additional_info`, `seo_keywords`, `target_countries`, `combinations`) expecting to match "empty array" rows, and would miss rows now stored as `"[]"`. → **Mitigation**: tasks.md includes a grep across `app/` and `database/` for raw `IS NULL`/`whereNull`/`is_null()` usage on these specific columns before deleting the mutators; any hit gets evaluated case-by-case (most likely means "no value was ever set" semantically, which still holds for genuinely-unset fields — only explicitly-assigned-empty-array rows shift from `NULL` to `"[]"`).
- **[Risk]** `Order::flags` fix is behavior-changing (**BREAKING** per proposal): any code currently relying on flags never persisting (e.g. code that assumed `$order->flags` is always empty after save, if any exists) would see new behavior. → **Mitigation**: grep for `->flags` usage on `Order` as part of verification; expected to be low-risk since "flags don't save" reads as an unambiguous bug rather than relied-upon behavior.
- **[Trade-off]** No backfill for historically-dropped data. Accepted per Non-Goals — recovering lost data isn't possible from current DB state, and backfilling with empty/default values wouldn't be meaningfully better than leaving `NULL`.

## Correction during implementation

Fixing `Order::set_flags_attribute` (so `flags` now actually persists as `NULL` when cleared, instead of never persisting at all) made a **separate, pre-existing bug** reachable for the first time: `Model::offsetExists()` (`libraries/framework/Database/Concerns/HasAttributes.php` via `Model.php:1061`) is `isset($this->attributes[$offset]) || isset($this->relations[$offset])`. PHP's `isset()` on an array value returns `false` when that value is `null`, even though the key legitimately exists. `Resource::__get()` (`libraries/framework/Resource.php`) reads via `$this->resource->{$name} ?? null` — the `??` operator calls `__isset()` first, so when the raw `flags` attribute is `null`, `offsetExists()` reports "not set" and `??` returns its fallback `null` *without ever calling* `Model::__get()`. This skips `Order::get_flags_attribute()` entirely, so `OrderResource`'s `'flags' => $this->flags` returns raw `null` instead of the mutator's `[]` for a cleared order — visible only in the API response, not in the database (`Order::find($id)->get_attributes()['flags']` is correctly `null`).

This is orthogonal to every `set_*_attribute` mutator this change touches — it lives in the base `Model`/`Resource` classes and would affect *any* get-mutator designed to turn a `null` attribute into a non-null value (not just `flags`), whenever that field is read through a `??`-based magic-property access. It was unreachable before this change only because `Order::flags` never actually persisted a value (the bug this change fixes). It does not affect any of the eight JSON-cast fields in scope, because their cast path returns `null` for a `null` raw value anyway — there's no transformation for the `??` bypass to skip, so the bypass is unobservable there.

Left unfixed here per this change's Non-Goals (touching only the six named mutators, not base framework classes). `test_update_order_clears_flags` (tasks.md 5.3) was adjusted to assert persistence at the model layer instead of the API response shape, with a comment on the test pointing to this note. Recommend a follow-up change to fix `Model::offsetExists()` to check `array_key_exists()` instead of `isset()` for the `attributes` branch — flagged separately to the user rather than folded into this proposal's scope.
