## Context

See proposal.md - Why. Relevant existing state:

- `orders.payment_provider` (string) stores only the raw provider id, passed through unresolved from `CreateOrderPayloadDTO` → `CreateOrderDTO` → `Order::create()` in `CreateOrderAction::prepare_create_order_dto()`. No enrichment happens at creation time.
- `orders.payment_metadata` (JSON-cast text column) exists in the schema and model but is written/read nowhere in the codebase.
- Offline providers are entries in a WP settings array (`OfflinePaymentService`), fully admin-editable/deletable, id often a `Str::uuid()`. Online providers are PHP classes registered in `PaymentManager::$providers_registry`, keyed by a hardcoded id (e.g. `'paypal'`). Both are read through the same `Payment::get_provider($id)` facade call and share the `PaymentProvider` base class (`id()`, `title()`, `icon()`, `is_offline()`).
- `orders.base_payment_provider_fee` exists alongside `invoiced_payment_provider_fee` but is never written. `OrderManager::set_payment_provider_fee(int $id, int $fee)` only writes `invoiced_payment_provider_fee`.
- Every other `base_*`/`invoiced_*` pair on the order is computed together at creation time (`base` is the calculation engine's source of truth, `invoiced = base * exchange_rate` via `Money::convertedTo()`). The provider fee is different: it arrives later, asynchronously, via gateway webhook, already denominated in the order's invoiced (transaction) currency — so deriving `base` from `invoiced` here runs in the opposite direction from the rest of the order, using the order's own frozen `exchange_rate` column (not a live currency-table re-fetch) to keep the derivation consistent with amounts computed at order-creation time.
- `PaymentManager::pay()` reads `$order->payment_method`, a nonexistent attribute post the `payment_provider` rename — always resolves no gateway, so `Site\Order\OrderResource`'s `payment_next_step` is always `null`.

## Goals / Non-Goals

**Goals:**
- Freeze provider identity (id/name/icon/is_offline) on the order at creation time so later admin edits, deletions, or addon uninstalls can't change what a historical order displays.
- Make `base_payment_provider_fee` a real, populated value derived consistently from `invoiced_payment_provider_fee`.
- Fix the dead `pay()` lookup as a small adjacent correction.

**Non-Goals:**
- No new database columns/migration — reuses `payment_metadata` and the already-existing `base_payment_provider_fee`.
- No backfill of historical orders (plugin unpublished, no production data — proposal.md Impact).
- No change to how the live registry is used for actually processing payments/refunds (`CreateRefundAction` still resolves the live provider to call its refund API — the snapshot is display-only, not a substitute for live provider resolution where an API call is required).
- Does not address the Stripe `balance_transaction.currency` vs invoiced-currency mismatch risk (flagged in proposal.md as a known limitation, out of scope here since it requires a currency-conversion decision Stripe's API doesn't hand us directly the way PayPal's does).

## Decisions

**1. Snapshot storage: `payment_metadata` JSON, namespaced under a `payment_provider` key, not new flat columns or the raw `payment_provider` column repurposed.**
Chosen over new dedicated columns (the `discount_details`/`order_items.product_data` precedent) because `payment_metadata` already exists for exactly this "extra data about the payment" purpose and is currently dead weight — using it avoids a migration entirely. Namespacing (`{"payment_provider": {"id", "name", "icon", "is_offline"}}` rather than writing those four keys at the JSON root) leaves room for other future gateway metadata (e.g. raw webhook payloads) under sibling keys without conflicting with the provider snapshot. The existing `payment_provider` column is left as the raw id, unchanged — it's still what `Payment::get_provider()` and `CreateRefundAction` use for live lookups; the JSON blob is purely the enrichment/display layer.

**2. Snapshot resolved once, at order-creation time, via the existing `Payment::get_provider($id)` facade — for both online and offline providers.**
`CreateOrderAction::prepare_create_order_dto()` already assigns `$order_dto->payment_provider = $dto->payment_provider` (the raw id). Immediately after, resolve `Payment::get_provider($dto->payment_provider)` and, if found, set `$order_dto->payment_metadata = ['payment_provider' => [...]]`. If the id doesn't resolve (shouldn't happen given request validation, but defensively), `payment_metadata` stays null rather than throwing — order creation must not fail because of a snapshot enrichment step.

**3. Base fee derivation lives inside `OrderManager::set_payment_provider_fee()`, not pushed onto callers.**
The method's signature stays `set_payment_provider_fee(int $id, int $fee)` — callers (Stripe, PayPal) keep passing only the invoiced-currency fee they read from their own webhook. Internally, the method now also computes `base_fee` from the order's own stored `exchange_rate` (loaded via `$id`) and writes both columns in the same update. This keeps currency-conversion knowledge in one place instead of duplicating it across every gateway integration, mirroring how `CreateOrderAction::convert_amount()` centralizes the base→invoiced conversion for the rest of the order.

**4. Base fee uses the order's frozen `exchange_rate`, not a live currency-table rate.**
Alternative considered: re-fetch `Currency::exchange_rate($order->currency_code)` at fee-write time. Rejected because the fee webhook can arrive well after order creation, by which point the live rate may have moved — using a fresh rate would make `base_total` (computed at order time) and `base_payment_provider_fee` (computed later) implicitly reflect two different rates for the same order, which breaks reporting consistency. The order's own `exchange_rate` column is already the historically-correct rate for that order.

**5. PayPal fee capture checks currency before storing; Stripe's existing call is left as-is.**
PayPal's `PAYMENT.CAPTURE.COMPLETED` webhook resource includes `seller_receivable_breakdown.paypal_fee.value` alongside `seller_receivable_breakdown.paypal_fee.currency_code` — since the currency is handed to us for free, compare it against the order's `currency_code` and skip the `set_payment_provider_fee()` call (log, don't throw) on mismatch, per the resolved design-fork answer. Stripe's `balance_transaction` doesn't expose an equally cheap invoiced-currency comparison in the current integration, so its existing unconditional call is left unchanged — it's an existing latent risk, not one this change is positioned to fully close (see Non-Goals).

**6. `PaymentManager::pay()` fix is a one-line change bundled into this proposal rather than filed separately.**
It touches the same `PaymentManager` class the fee-derivation logic lives near, and its scope (`$order->payment_method` → `$order->payment_provider`) is trivial enough not to warrant a separate change.

## Risks / Trade-offs

- **[Risk]** `payment_metadata` being reused for the provider snapshot forecloses using that exact column name for unrelated future gateway metadata without namespacing discipline. → **Mitigation**: namespaced under a `payment_provider` key (Decision 1) specifically so future data can live under sibling keys.
- **[Risk]** If `Payment::get_provider($id)` returns null at order-creation time (e.g. a race where a provider was deleted between checkout page load and order submission), the order is left with no snapshot at all for that edge case. → **Mitigation**: acceptable degradation — the raw `payment_provider` id column is still stored, so the order isn't unidentifiable, just not enriched; this is a narrow race window already possible today for the exact same reason `CreateRefundAction`'s live lookup can fail.
- **[Risk]** Stripe's settlement-currency fee is stored without a currency check, unlike PayPal's. → **Mitigation**: explicitly called out as a known, pre-existing limitation (Non-Goals) rather than silently accepted; a future change can add Stripe-side currency verification once a reliable source for the order's expected settlement currency is identified.

## Migration Plan

Payment provider snapshot: no database migration, plain code change:
1. `CreateOrderAction` starts writing `payment_metadata` for all newly-created orders. Orders created before deploy simply have `payment_metadata: null` — `OrderResource` must handle that gracefully (fall back to nulls/omit fields, not error).
2. `OrderManager::set_payment_provider_fee()` starts writing `base_payment_provider_fee` for all future fee-setter calls. No retroactive computation for orders whose fee was already set pre-deploy (none exist yet, per proposal.md Impact — plugin unpublished).
3. No feature flag needed; no rollback complexity beyond a standard revert (no data migration to undo).

Shipping method snapshot (added during implementation — see note below): does need a new column, `shipping_metadata`, added directly to `database/migrations/CreateOrdersTable.php` (not a separate alter migration — the plugin is unpublished, so there's no existing deployment history to preserve, and every other order column so far lives in this same create migration). Same deploy shape otherwise: pre-existing orders get `shipping_metadata: null`, `OrderResource`/`OrderListResource` handle that gracefully.

## Correction during implementation

Two things changed after this design was first written, both requested directly by the user after reviewing the initial implementation:

1. **`OrderListResource` scope reversed.** Decision 1 originally scoped the provider snapshot to `OrderResource` (details) only, treating `OrderListResource` as out of scope (Non-Goals implied this via the proposal's "if the list view needs it" hedge). The user asked for list-view parity after seeing the details-only version, so `OrderListResource` now also exposes `payment_provider_name`/`_icon`/`_is_offline`, sourced from the same `payment_metadata` blob.
2. **Shipping method snapshot added, extending this change's scope beyond payment providers.** The user identified that `orders.shipping_method` has the exact same problem as `orders.payment_provider` — it's a raw id into an admin-editable settings blob (`shipping_zones[].shipping_methods[]`, keyed by `OptionKeys::SHIPPING_SETTINGS`), with the method's `name`/`type` resolvable at order-creation time via `ShippingService::get_selected_shipping_method($context)` but never captured. This is architecturally identical to Decision 2 (resolve once, at creation, via a facade/service already available in `CreateOrderAction`), but had no equivalent unused column to reuse the way `payment_metadata` was — hence the one new `shipping_metadata` column noted above. Non-Goal #1 ("No new database columns/migration") no longer holds for the change as a whole; it was true only for the payment-provider half.

Also surfaced along the way (see tasks.md for full detail): two unrelated pre-existing bugs (`CreateVariantDTO::$committed_quantity` defaulting to `null` against a `NOT NULL` column, and `Customer::get_shipping_address()`/`OrderCreateRequest`'s null-address fallback chains) were blocking the integration suite from running order/product tests at all in this environment. Both were fixed with explicit user sign-off since they were required to actually verify this change's own tests end-to-end.
