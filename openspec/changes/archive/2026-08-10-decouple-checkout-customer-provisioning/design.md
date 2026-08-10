## Context

See proposal.md - Why. Relevant current code:

- `CreateCustomerAction::execute()` wraps user+customer+addresses creation in its own `DB::begin_transaction()`/`commit()`/`rollback()`. `provision()` is the same work without the transaction wrapper, `public` only so `CreateOrderAction` can call it inside the order's own transaction. Before commit 7dd36a8d, this logic lived directly in `execute()` — `provision()` was extracted purely to give `CreateOrderAction` a transaction-free entry point; it has no other reason to exist and, once that caller switches to `execute()`, no other caller at all.
- `CreateOrderAction::execute()` currently: builds the calculation context (`customer_id = dto->customer_id ?? 0`) → validates shipping method → runs `recalculate_cart_action` (which validates any applied coupon via `DiscountService::validate_coupon()`, reading `context->customer_id`) → builds `create_order_dto` → opens the order transaction → resolves/auto-provisions the customer via `provision()` → creates the order, items, reserves stock, empties cart → commits.
- Confirmed `ShippingService::has_valid_shipping_method()` depends only on `shipping_address` / `shipping_method_id` on the context, not `customer_id` — so its position relative to customer resolution is not behaviorally significant.

## Goals / Non-Goals

**Goals:**
- Restore the one-public-method-per-Action convention.
- Make customer auto-provisioning transactionally independent of order creation.
- Make the resolved `customer_id` available to cart/coupon calculation.

**Non-Goals:**
- Not changing how a customer is matched/created (WP user lookup, field sourcing, address creation) — only when and how it's invoked.
- Not changing guest checkout, manual/admin order creation, or the `UniqueConstraintViolationException` race-condition fallback logic in `resolve_checkout_customer_id()` — that stays as-is, just runs earlier.
- Not addressing customer-tier pricing (as opposed to coupon eligibility) — out of scope; no such logic exists in `RecalculateCartAction` today.

## Decisions

**Resolve customer at the very top of `CreateOrderAction::execute()`, before `prepare_calculation_context_dto()`.**
This is the earliest point `dto->customer_id` can be set so that both the calculation context and `create_order_dto` (which derives `customer_id` from the context) pick it up naturally. Placing it any later (e.g. just before `DB::begin_transaction()`, as first discussed) would fix the transaction-ownership problem but leave `context->customer_id` at `0` during coupon validation, leaving the `first_time_buyer_only` / `has_customer_limit` / customer-include-list coupon bug in place. Confirmed shipping-method validation has no customer dependency, so ordering relative to it is not a concern.

**Mutate `$dto->customer_id` directly, rather than introducing a separate resolved-customer variable.**
`prepare_calculation_context_dto()` and `prepare_create_order_dto()` (via `$context->customer_id`) both already read from `dto`/`context`, so setting `$dto->customer_id` once at the top removes the need for the current in-transaction `$create_order_dto->customer_id = $this->resolve_checkout_customer_id($dto)` assignment entirely — that line and its guarding `if` are deleted.

**Call `create_customer_action->execute()` instead of `->provision()`, and inline `provision()`'s body back into `execute()` rather than just making it `protected`.**
`execute()` already does exactly what's needed (transactional user+customer+addresses creation) — no new method needed on `CreateCustomerAction`. Once `CreateOrderAction` stops calling `provision()`, it has exactly one caller left: `execute()` itself. Keeping it as a `protected` single-use method would leave dead-weight indirection with no purpose (the project's own guidelines rule out abstractions for single-use code); removing it restores `execute()` to its pre-7dd36a8d shape.

**Leave `UniqueConstraintViolationException` handling in `resolve_checkout_customer_id()` untouched.**
That fallback (look up the existing customer by `user_id` when a concurrent request already created one) is orthogonal to transaction placement and still applies the same way regardless of where the call happens.

## Risks / Trade-offs

- **[Orphan customers on failed checkout]** A shopper can now end up with a WP user + `Customer` + two addresses even when their checkout ultimately fails for an unrelated reason (invalid coupon, bad shipping method, out-of-stock item) → Accepted per proposal.md; this is the explicit intent of the change. No mitigation planned (e.g. no cleanup job) since the user has confirmed this is acceptable.
- **[Wider provisioning window than originally scoped]** Moving resolution above shipping/coupon validation (not just above `DB::begin_transaction()`) means provisioning can now be triggered by failures that have nothing to do with order persistence itself → Accepted; this is required to fix the coupon-eligibility bug, and is the direct trade-off documented above.

## Migration Plan

No data migration. This is a pure code-ordering/visibility change deployed as a normal release. No feature flag — the corrected behavior (coupon eligibility, transaction independence) is strictly better than today's and has no opt-out path in the existing code.

## Correction during implementation

While writing the `first_time_buyer_only` coupon test (tasks.md 3.2), found that `DiscountService::validate_coupon()`'s first-time-buyer check has two conditions: `!$context->customer_id` ("please login") and `$context->customer_order_count > 0` ("you've ordered before"). This change fixes the first. The second was assumed to already work — it does not: `CreateOrderAction::prepare_calculation_context_dto()` never populates `customer_order_count` (it stays at the `CalculationContextDTO` default of `0`), unlike `CalculationContextDTO::from_cart()` and `OrderCalculationController`, which do. So through the actual order-creation path, a `first_time_buyer_only` coupon is accepted for any authenticated customer with a resolved `customer_id` — including repeat customers — regardless of this change.

Decided (user confirmed) to leave this out of scope: the spec's first-time-buyer scenario was narrowed to claim only what this change actually delivers (not rejected for missing `customer_id`), not full order-count enforcement. The `customer_order_count` gap is a separate, pre-existing bug to be tracked and fixed independently.
