## Context

See proposal.md - Why. The edit read (`OrderController::edit` + `OrderEditResource`) already returns the detail payload plus seven item keys and `available_shipping_methods`. It answers 404 for an unknown order and 422 for an order that cannot be edited. The seven item keys have the same names as the keys on `OrderCalculationItemSchema`, so the stock helpers (`toQuantityLimitSource`, `getQuantityLimit`) already know the shape.

Today the stored row display (`toStoredRowDisplay` in `lib/order-items.ts`) invents permissive stock values, and `pages/order-form.tsx` reads the shipping list only from the calculation.

## Goals / Non-Goals

**Goals:**
- Every field the edit screen needs before the first price preview comes from one request.
- The edit read is typed by a schema that extends the detail schema, so the two cannot drift apart.

**Non-Goals:**
- No change to the backend, the price preview, or the detail page.
- No change to the correction effects for coupons, quantity and shipping method in the context.

## Decisions

**1. Extend `OrderSchema`, do not edit it.** `OrderEditInfoSchema = OrderSchema.extend({ items, available_shipping_methods })`. The backend states the detail payload does not carry the edit-only keys (spec: "The order detail payload does not carry the edit-only fields"), so adding required keys to `OrderSchema` would break parsing of detail, list and action responses. Alternative: make the keys optional on `OrderSchema`. Rejected: it hides a missing key on the edit read.

**2. Item schema reuses calculation item fields.** `OrderEditLineItemSchema = OrderLineItemSchema.extend(OrderCalculationItemSchema.pick({...seven keys}).shape)`. One definition of each key, so `is_reachable` and the stock keys keep the same types in both places. Stock keys stay `nullish` because the backend sends null for a deleted variant.

**3. Share the shipping method shape.** The inline object in `OrderCalculationSchema.available_shipping_methods` moves to `OrderShippingMethodSchema`. Same shape, so no behavior change.

**4. Stored display carries real stock.** `toStoredRowDisplay` takes the edit line item and maps the seven keys to `OrderRowDisplay`, adding `isReachable`. When a stock value is null (deleted variant) it keeps the old permissive default for that field. `getQuantityLimit` already floors the ceiling at `storedQuantity`, so an unchanged line still saves. `order-item-row.tsx` locks a line when `calculationItem?.is_reachable ?? display.isReachable` is false: the preview wins once it exists.

**5. Shipping list in local state.** The context keeps `availableShippingMethods` in local state, the same way it keeps `paymentSummary`. The effect that fills the form from the edit read sets it from `order.available_shipping_methods`. The effect that runs when a calculation arrives replaces it with `calculation.available_shipping_methods`. `order-form.tsx` reads the state from the context. On the create screen the first effect never runs, so the state starts empty and only calculations fill it: create behavior is unchanged. Alternative: derive it with `calculation?.available_shipping_methods ?? order?.available_shipping_methods`. Rejected: it mixes two sources in one expression, and it differs from how `paymentSummary` handles the same two sources.

**6. Own query key under `details()`.** `orderKeys.edit(id)` is `[...orderKeys.detail(id), 'edit']`. The existing `invalidateQueries({ queryKey: orderKeys.detail(id) })` calls in the update and action mutations then match it by prefix, with no change to them. The edit read has `retry: false` because 404 and 422 do not change on retry; `isOrderError` stays the single signal for the existing error and blocked states. The page keeps its `order.is_editable` check as the fallback and shows the server message from the 422 answer when it has one.

**7. `useOrderQuery` stays for the detail page.** `use-order-details.ts` still reads the detail payload.

## Risks / Trade-offs

- [The edit read refuses a non-editable order with 422, and the page cannot tell it from other errors] → Read the error status in the page or in the query's `select`/`throwOnError` path and map 422 to the blocked state; unit test both branches.
- [Stale edit read after a save] → Covered by prefix invalidation (decision 6). Tested with a mutation success test.
- [Extra request for the shipping list is replaced by data in one request, but the edit read is heavier than the detail read] → Accepted; it runs once per screen open and is not repeated on focus unless the admin asks.
- [Form reset runs once (`isFormFilledRef`); a background refetch of the edit read does not update the form] → Intended: it protects the admin's changes. Stock fields refresh through `displayByVariantId`, which reads from `order`.
