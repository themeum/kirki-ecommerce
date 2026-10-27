## Why

The backend already has `GET /orders/{id}/edit`. It returns the order with live stock, per-order limits, line reachability and the shipping methods that can be chosen. The edit screen does not use it. It loads `GET /orders/{id}` and guesses stock values for stored lines (in stock, back orders allowed, no limit) until the first price preview returns. Until then, an unreachable line is not locked, the quantity ceilings are wrong, and the shipping popover is empty.

## What Changes

- The order edit context loads the order from `GET /orders/{id}/edit` instead of `GET /orders/{id}`.
- Add `OrderEditInfoSchema` to `features/orders/schemas/catalog/order.ts`. It extends `OrderSchema` with the stock and reachability keys on each item and with `available_shipping_methods`. `OrderSchema` stays as it is for the detail, list and action responses.
- Share the shipping method shape between `OrderCalculationSchema` and `OrderEditInfoSchema` through one `OrderShippingMethodSchema`.
- Add `getOrderEditInfo`, `useOrderEditInfoQuery` and a query key for it. The query does not retry, because 404 and 422 answers are final.
- Stored lines take their stock ceiling, per-order ceiling and reachability from the edit read before the first price preview. The old guessed values stay only for a line whose variant was deleted (stock keys are null).
- The shipping popover shows `available_shipping_methods` from the edit read until the first price preview returns, then the preview list.
- A 422 answer from the edit read shows the blocked state with the server message. A 404 answer shows the error state with retry.
- No backend change.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `order-editing`: the edit screen fills its form, stored line limits, line lock and shipping choices from the edit read, and shows the blocked state when the edit read is refused.

## Impact

- `resources/app/features/orders/schemas/catalog/order.ts`, `services/order.ts`, `services/query-keys.ts`
- `resources/app/features/orders/contexts/order-edit-context.tsx`, `lib/order-items.ts`, `types.ts`, `pages/order-form.tsx`, `components/order-form/order-item/order-item-row.tsx`
- Vitest tests for the schema and `order-items` helpers, and a context test for edit mode.
- `OrderController::edit` and `OrderEditResource` are read only inputs. The detail page keeps `useOrderQuery`.
