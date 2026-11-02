## Why

`OrderResource.php` and `OrderCalculationResource.php` already satisfy the `admin-order-pricing-breakdown`, `admin-order-calculation-breakdown`, `order-tax-lines`, and `order-coupon-attribution` capabilities (exclusive/inclusive money-object pairs, itemized multi-coupon and multi-tax-line breakdowns, per-item strikethrough pricing) — but the frontend catalog schema (`resources/app/features/orders/schemas/catalog/order.ts`) and the components that consume it were never updated to match, so today's admin order-create/order-details UI still renders single combined discount/tax figures and, in places, reads money fields that no longer exist on the API response. Separately, the admin order-create quantity stepper has no stock ceiling, and the create form doesn't reconcile itself when the calculation endpoint disagrees with what was submitted (a stock-clamped quantity, a rejected coupon code, a defaulted shipping method), leaving the merchant looking at a form that silently drifts from what will actually be charged.

## What Changes

- Rewrite `resources/app/features/orders/schemas/catalog/order.ts` to match the current `OrderResource.php`/`OrderCalculationResource.php` output exactly: rename `OrderItemSchema` → `OrderSchema`, extract a dedicated line-item schema (`OrderLineItemSchema`) for `OrderSchema.items`, and rewrite `OrderCalculationSchema`/its item schema to the current calculation payload shape (base-currency-only, no `display_*` fields). **BREAKING** (internal): every consumer importing the old `OrderItemSchema`/`OrderItem` names or reading a field this rewrite removes must be updated in the same change.
- Redesign `payment-summary-card.tsx` to render one row per applied coupon and one row per tax line (matching the provided screenshots), plus a second "pre-shipping/tax" totals row, replacing the current single combined discount/tax figures. Its props are derived from `OrderSchema`/`OrderCalculation` via `Pick`, not a hand-rolled type.
- Update `order-form.ts`'s `OrderFormSchema`/`OrderCalculationRequestSchema` to accept every field `OrderCreateRequest.php`/`OrderCalculationRequest.php` already validate (`payment_provider`, `shipping_id`, `billing_id`, `customer_email`, `customer_phone`, `consents`), as nullable pass-through fields.
- Plumb `available_quantity` (already on the variant API response, currently dropped by the product-selection mapper) through to the order-create quantity stepper, and cap the '+' control at that value.
- Add reconciliation logic to `use-order-create.ts`: when the calculation result's items/coupons/shipping method differ from what was submitted, update the form to match without triggering another calculation request, and surface a rejected coupon code to the discount editor as a dismissible banner.
- Add a feature-scoped `OrderCreateContext` to stop prop-drilling calculation/rows state through the order-create component tree, and fix `customer-card.tsx`'s unscoped form-wide `useWatch` re-render hotspot.

No backend PHP changes — verified directly against the resource/request classes; everything this change needs is already emitted/accepted.

## Capabilities

### New Capabilities
- `admin-order-item-quantity-limits`: the admin order-create screen enforces a line's available stock as a hard ceiling on the quantity a merchant can set for that variant, mirroring the storefront's `cart-item-quantity-limits` capability for the admin-created-order context.
- `order-create-calculation-reconciliation`: when the admin order-create calculation result disagrees with the payload that produced it (a clamped item quantity, a rejected coupon code, a changed shipping method), the create form is silently updated to match the calculation result, and a rejected coupon code is surfaced to the merchant, without issuing a redundant recalculation request.

### Modified Capabilities
(none — this change makes the frontend correctly consume payload shapes that `admin-order-pricing-breakdown`, `admin-order-calculation-breakdown`, `order-tax-lines`, and `order-coupon-attribution` already require of the backend; no backend requirement changes)

## Impact

- `resources/app/features/orders/schemas/catalog/order.ts` and every consumer of its exported types/schemas: `services/order.ts`, `order-details.tsx`, `items-table.tsx`, `payment-summary-card.tsx`, `order-item-row.tsx`, `product-selection-card.tsx`, order feature test fixtures.
- `resources/app/features/orders/schemas/forms/order-form.ts` and its consumers (`use-order-create.ts`, `use-order-details.ts`).
- `resources/app/features/products/schemas/catalog/product-selection.ts` and `.../select-products-dialog/build-selection.ts` (adds `availableQuantity`).
- New file: `resources/app/features/orders/contexts/order-create-context.tsx`.
- `resources/app/features/coupons/index.ts` (barrel gains three enum re-exports the new order schema needs).
- `resources/app/features/orders/components/order-create/**` (quantity-stepper, order-item-row, customer-card, discount-popover, order-create.tsx) and `resources/app/features/orders/pages/order-create.tsx`.
