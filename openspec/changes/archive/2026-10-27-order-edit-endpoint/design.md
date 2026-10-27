# Design

## Context

The edit screen needs the order plus data that the calculation payload gives: per item reachability and live stock values, and the shipping methods to choose from. See proposal.md - Why.

Today:
- `OrderResource` is used by the admin detail read, the create and update responses and about 12 mails. It must stay as it is.
- `OrderCalculationResource` builds the stock keys in `prepare_stock_values()` and shapes the shipping list inline. It gets its data from a `CalculationContextDTO`, which `OrderCalculationContextService::build()` makes from an `OrderCalculationInputDTO` and the stored order.
- `OrderCalculationController` finds the order to edit with a protected `find_editable_order()`: 404 when missing, 422 when `is_editable()` is false.
- An edit is a complete payload (lines as `id` plus `quantity`, coupon codes, method, addresses), so the context of an unchanged order is the stored order sent back as it is.

```
GET /orders/{id}/edit
   OrderService: find editable order (404 / 422)
        |
        +--> OrderEditResource  (extends OrderResource, flat payload)
        |       items: + is_reachable, 6 stock keys   <- FormatsVariantStock
        |       root:  + available_shipping_methods   <- FormatsShippingOptions
        |
        +--> context: OrderCalculationInputDTO::from_order() -> context service -> ShippingService
```

## Goals / Non-Goals

**Goals:**
- One flat response for the edit screen with the order and the missing pieces.
- `OrderResource` and its other callers do not change.
- The stock keys and the shipping option shape each have one owner.

**Non-Goals:**
- No change to the calculation payload, the preview endpoint or the save.
- No frontend change.
- No coupon trait. The coupon rule keys are only three lines and the two resources read different sources.
- No nested response shape (`order` plus `calculation`). Only the missing pieces are added, so no key collides.

## Decisions

**1. `OrderEditResource extends OrderResource`.**
It overrides `prepare_items()` to add `is_reachable` and the stock keys to each item the parent builds, and `to_array()` to add `available_shipping_methods`. It reads the variant from `$item->variant`, so stock needs no calculation.
- *Alternative: flags on `OrderResource`.* Rejected. Every caller would then carry edit-only code and branches.
- *Alternative: merge the order payload and the calculation payload.* Rejected. They share keys such as `totals` and `items`, and the screen needs only the missing pieces.

**2. `FormatsVariantStock` trait with one method.**
`format_variant_stock_fields($variant)` returns the six variant keys (all null for a missing variant). `OrderCalculationResource` and `OrderEditResource` use it. `is_reachable` is not in it: the calculation reads it from its item, and `OrderEditResource` computes `$variant !== null && $variant->is_available()`. Both rely on `Variant::is_available()`. The trait already exists; this change keeps it.

**3. `FormatsShippingOptions` trait with one method.**
`format_shipping_options($options)` turns each option's `base_cost` into `base_cost_money_object`. It moves out of `OrderCalculationResource` and is used by both resources, so the list has one shape.

**4. `OrderCalculationInputDTO::from_order(Order $order)`.**
It builds the payload array the stored order stands for - lines as `id` plus `quantity`, the codes of the stored order coupons, the shipping method, the customer and the shipping and billing fields - and returns `from_payload()` of it. The existing context service then builds the context, so the edit read and the preview use one code path.
- *Alternative: build the context by hand in the controller.* Rejected. It would copy the context service.

**5. Shared "find editable order" rule.**
`OrderService::find_editable_order_or_fail($id)` holds the 404 and 422 rule. `OrderCalculationController::find_editable_order()` calls it when an `order_id` is sent, and `OrderController::edit()` calls it. So the preview and the edit read cannot differ.

**6. The endpoint loads what it needs.**
`OrderController::edit()` loads `items.variant.product` on the order itself. `OrderService::find_order()` does not change.

**7. Casts.**
The model already casts the variant columns, so the trait does not cast again.

## Risks / Trade-offs

- [One edit read runs a full calculation and live shipping quotes] → Only this endpoint pays it, and the screen calls it once on open.
- [The saved shipping method may not be in the live list] → The order's own `shipping_method` keys stay as saved. The spec says so, and the screen must handle it.
- [`from_order()` may not rebuild exactly what the screen would send] → An integration test compares the list and the stock keys with a preview of the unchanged order.
- [The stock values are live, not a snapshot] → The spec and docs say so.

## Open Questions

- How `OrderEditResource` receives the shipping options or the context (constructor argument, or a method on the resource) depends on how the framework `Resource` base class is built. This does not change the specs or the tasks. The constraint is that `OrderResource` stays unchanged.
