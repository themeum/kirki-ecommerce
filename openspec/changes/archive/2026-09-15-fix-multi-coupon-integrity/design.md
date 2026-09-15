## Context

`PersistsOrderCoupons::sync_order_coupons()` is shared by `CreateOrderAction` and `UpdateOrderAction`: it deletes every `order_coupons`/`order_item_coupons` row for the order and rebuilds them from the latest `CalculationResultDTO`. Only `CreateOrderAction` currently touches `coupons.current_usage_count` after calling it. The whole order-items pipeline (`CreateOrderAction`, `UpdateOrderAction`, the calculation engine's `CalculationResultDTO::$items`) is keyed by `variant_id` end to end — `UpdateOrderAction::$existing_items_map` and `CreateOrderAction`'s `$calculated_result->items[$item_data['variant_id']]` lookups both assume one order item per variant. See proposal.md - Why.

## Goals / Non-Goals

**Goals:**
- Keep `coupons.current_usage_count` and `order_coupons.usage_reversed_at` correct through order creation, order edit, and order cancellation, in any order.
- Make the reconciliation assertions actually catch the failure modes the multi-coupon-stacking spec already promises (invoiced-currency drift, silent item-attribution loss).
- Bring `CartResource`'s coupon fields in line with the project's money-field and Resource conventions.

**Non-Goals:**
- Fixing the storefront pricing-key mismatch or the admin `order-details.tsx` stale field read (proposal.md - Impact / Out of scope) — separate frontend fix.
- Adding `base_*`/`display_*` prefixes to `CalculationContextDTO`/`TaxCalculationContextDTO`/`TaxableItemDTO`/`CouponDiscountResultDTO` — separate naming cleanup, no functional bug.
- Reporting why an auto-removed invalid coupon was dropped, and de-duplicating the coupon/tax formatting helpers shared by `CartResource`/`OrderCalculationResource` — both deferred by the user for now; invalid coupons keep being silently discarded, and the two Resources keep their duplicated helper methods as-is.
- Handling multiple order items for the same variant in `sync_order_coupons()`. The calculation engine and both order actions are variant-keyed throughout (`CalculationResultDTO::$items`, `CreateOrderAction`, `UpdateOrderAction::$existing_items_map`), so an order cannot structurally end up with two order items for one variant. Building dedicated handling for it in `sync_order_coupons()` alone would be speculative code for a state the rest of the system already prevents.

## Decisions

**Usage-count sync: diff old vs. new coupon_id sets, gated by order status.**
`sync_order_coupons()` will read the order's *existing* `order_coupons` (keyed by `coupon_id`) before deleting them, compute the new set from `$calculated_result->coupon_results`, and diff:
- Coupons in both sets: carry the old row's `usage_reversed_at` forward unchanged. No usage-count change.
- Coupons only in the new set (added by the edit): if the order's current status is cancelled/refunded, create the row already marked `usage_reversed_at = now()` and do not increment usage count (consistent with "this order's coupon usage doesn't count"); otherwise increment usage count and leave `usage_reversed_at` null.
- Coupons only in the old set (removed by the edit): if the old row wasn't already reversed, decrement usage count.

This is a method on the `PersistsOrderCoupons` trait (`protected function sync_order_coupons(...)`), called identically by both actions — `CreateOrderAction` stops doing its own separate `increment('current_usage_count')` loop after `sync_order_coupons()`, since the diff (nothing old, everything new) now covers creation too. Considered keeping usage-count logic only in `CreateOrderAction` and adding parallel logic in `UpdateOrderAction`: rejected, since it's exactly the duplication that let this bug happen in the first place — one diff-based implementation shared by both call sites.

**Reconciliation: add a tolerance-bounded invoiced-currency assertion, fail loudly on unmatched items.**
`assert_order_coupons_reconcile()` gains a second sum-check over `invoiced_discount_amount` against `convert_amount($calculated_result->base_discount_total, ...)` (`CalculationResultDTO` has no ready-made invoiced total field, so this is computed the same way the calling actions already derive `order.invoiced_discount_total`). `sync_order_coupons()` replaces the `empty($order_items_by_variant_id[$variant_id]) → continue` with a `throw_if`, matching how the sibling tax-reconciliation path already fails hard elsewhere in this trait's neighborhood (`assert_order_taxes_reconcile()`).

→ **Correction during implementation**: an exact-equality invoiced check turned out to be unsafe. Each order-coupon's `invoiced_discount_amount` is converted independently (`convert_amount()` per coupon), so `sum(invoiced_discount_amount)` across several coupons is not guaranteed to equal converting the pre-summed base total in one shot - independent per-value rounding can land a few minor units apart even with no bug at all (e.g. two coupons each rounding up by a fraction sum to one more minor unit than converting their combined base total does). Asserting exact equality here would throw on legitimate multi-coupon, non-1:1-rate orders. The check instead allows a tolerance of one minor unit per order-coupon (`count($order_coupons)`), which comfortably covers expected rounding while still catching a genuinely wrong or missing invoiced amount. The base-currency check stays exact, since `base_discount_amount` is never independently rounded - it's the discount engine's own minor-unit total, copied as-is.

**Money object: `display_discount_amount_fixed_money_object`, not touching `base_discount_amount_fixed`.**
`base_discount_amount_fixed` is a coupon *configuration* field (the fixed-amount value set on the coupon), not a computed line total — unlike `display_discount_amount_money_object` (already present, computed from `coupon_result->total_discount`), which is the actual amount applied. Per CLAUDE.md, any `base_*` field needs its `display_*`/`*_money_object` sibling regardless of whether it's config or computed, so the fix adds the missing money object rather than removing the raw field.

## Risks / Trade-offs

- [Usage-count diff logic adds a query to read the pre-edit `order_coupons` before deleting them] → Already an N+1-safe single `where('order_id', ...)` query; negligible next to the rest of order-edit's cost.
- [Changing `CreateOrderAction` to rely on `sync_order_coupons()`'s diff instead of its own increment loop touches a currently-working path] → Covered by existing `CreateOrderAction` coupon tests plus new diff-specific tests (empty-old-set case, the "everything is added" path, which is what order creation always hits).
- [Adding an `invoiced_*` reconciliation assertion could newly throw on production orders that were already silently drifting] → Acceptable: it only runs at write time for orders being created or edited going forward, not retroactively against existing rows.

## Migration Plan

No schema changes. No backfill: `usage_reversed_at`/`current_usage_count` on existing `order_coupons`/`coupons` rows are not retroactively corrected by this change (see proposal.md's `order-coupon-attribution` spec — "Orders placed before this change are not migrated" already covers this precedent). If existing production data has already drifted from prior order edits, that's a separate one-off data-fix, not part of this change.
