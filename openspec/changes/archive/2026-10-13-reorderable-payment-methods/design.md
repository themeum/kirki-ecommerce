## Context

- `PaymentManager` builds `providers_registry` once per request in `init_registry()`: offline
  providers from `payment.offline_payments`, then PayPal, then the
  `kirki_ecommerce_payment_providers` filter. Every getter (`get_all_providers`,
  `get_online_providers`, `get_available_providers`, …) returns registry order. Checkout
  (`SiteController`) uses `get_available_providers()`.
- `AppSettings::set()` does a top-level `array_merge`, so a new `methods_order` key survives the
  existing offline-payment writes and `PUT /settings/payment`.
- The admin list (`payment-methods.tsx`) renders one `Card` per provider with a `Switch` and a
  `DropdownButton`. Its toggle and delete mutations already do optimistic updates on
  `paymentKeys.methods.all` through `updatePaymentMethodsCache` / `restorePaymentMethodsCache`.
- `StackedItems` draws a 1px divider between rows and hides `[data-action-group="true"]` until
  hover/focus. It has 14 other consumers.
- `attribute-list.tsx` is the in-repo reference for `@dnd-kit` with `DragOverlay`. It portals the
  overlay because the page wrapper keeps a transform from its enter animation.

## Goals / Non-Goals

**Goals:**

- One ordering source for the admin list and checkout, applied in `PaymentManager`.
- A list UI that matches the screenshot without changing `StackedItems` for other consumers.

**Non-Goals:**

- A generic sortable mode for `StackedItems`.
- An uninstall/delete endpoint for online gateways.
- Pruning stale IDs from `methods_order` when a provider is deleted (they are ignored on read).
- Separate orders for the admin list and checkout.

## Decisions

### 1. Sort at read time in `PaymentManager`, not at registration time

Add a protected `ordered_providers()` that reads `methods_order` from the `payment` settings on
each call and returns the registry sorted by it: ordered IDs first (stored-list position), then
the rest in registration order. All public list getters filter that result instead of the raw
registry. `get_provider($id)` stays a keyed lookup.

The sort itself is the public `order_providers(array $providers)` (also on the `Payment`
facade), because `OfflinePaymentService::get()` builds `GET /offline-payments` from the settings
option, not from the registry, and must apply the same order.

*Why:* the `PUT` handler writes the order and returns the list in the same request. A sort inside
`init_registry()` would return the old order unless the registry is rebuilt. Reading at call time
also covers the filter, which runs after registration.

*Alternative:* re-sort in `init_registry()` and call `init_registry()` after a write. Rejected:
re-runs the filter and rebuilds every provider object for one write.

### 2. Endpoint shape: `PUT /payment-methods/order` with `{ ids: string[] }`

- New `PaymentMethodOrderRequest` under `app/Http/Requests/PaymentMethod/`: `ids` required array,
  each item a string, distinct, and each a registered provider ID (custom rule against
  `Payment::get_provider`). Sanitize items as text.
- `PaymentMethodService::reorder(array $ids)` writes `methods_order` with `AppSettings::set()`
  and returns `get()`.
- `PaymentMethodController::reorder()` returns
  `PaymentMethodListResource::collection(...)` with a success message, the same shape as
  `get()`.
- Partial lists are accepted; omitted providers fall to the end by Decision 1. The UI always
  sends the full list.

*Why `PUT` on a sub-path:* the full order is replaced (idempotent), and `/payment-methods` itself
stays listing-only, which keeps the existing "combined path is read-only" scenario true.

### 3. Frontend: local sortable row, `StackedItems` untouched

New file `features/settings/payment/components/list/sortable-payment-method.tsx`:

- Wraps `StackedItem` with `useSortable({ id })`. The `StackedItem` ref receives `setNodeRef`;
  `transform`/`transition` go through the `style` prop (runtime values).
- `StackedItemMedia` holds two stacked children in one fixed 20×20 slot: the provider icon and a
  grip `Button` (`DragHandleDots2Icon`, `aria-label` "Reorder {name}") that receives
  `attributes`, `listeners` and `setActivatorNodeRef`. CSS swaps their `visibility` on the same
  conditions that reveal the actions, so nothing shifts.
- `StackedItemActions` with `data-action-group="true"` holds: delete `Button` (omitted when
  `method.id === 'paypal'`), edit `Button`, `Switch`. This reuses the `StackedItems` reveal rule
  (hover, `:focus-within`, `data-actions-open`).
- `isDragging` applies a reduced-opacity placeholder style.

`payment-methods.tsx` keeps the dialogs and handlers, replaces the card loop with
`DndContext` → `StackedItems` → `SortableContext(verticalListSortingStrategy)`, and portals
`DragOverlay` to `document.body` as in `attribute-list.tsx`. The overlay renders a light row
(grip + name) with `radius.lg`, `border.secondary`, a surface background and a small shadow.

Sensors: `PointerSensor` with `activationConstraint: { distance: 4 }` and `KeyboardSensor` with
`sortableKeyboardCoordinates`. Modifiers: `restrictToVerticalAxis`, `restrictToParentElement`.
Because `listeners` attach only to the grip, a click elsewhere never starts a drag.

*Alternative:* add `sortable` support to `StackedItems`. Rejected by the user for now; extract
when a second list needs it.

### 4. List style through `cssOverride`

Pass a local style to `StackedItems`/`StackedItem` that:

- removes the wrapper `borderBottom` divider (the divider is on the scoped wrapper around each
  `Item`, so the override targets `[data-slot="stacked-items"] > div` from the group level);
- gives each row a transparent 1px top and bottom border by default, and
  `border.secondary` plus `background.surfaceAlt` on hover/focus-within. The transparent border
  reserves the space, so hover causes no layout shift;
- under `@media (hover: none)`, shows actions and the grip at all times (the base primitive has
  no such rule today).

### 5. Reorder mutation

`reorderPaymentMethods(ids)` in `services/payment.ts` calls `PUT endpoints.PAYMENT_METHODS_ORDER`
and parses the list with `ResourceCollectionSchema(PaymentMethodSchema)` through
`parseResponse`. `useReorderPaymentMethodsMutation`:

- `onMutate`: `updatePaymentMethodsCache` with the methods sorted by `ids`.
- `onError`: `restorePaymentMethodsCache` + `toastMutationError`.
- `onSuccess`: write the server list to the cache, invalidate `paymentKeys.online.all` and
  `paymentKeys.offline.all`. No success toast: the list itself shows the result.

The list renders from a local `orderedMethods` copy of the query data (synced by `useEffect`, as
in `attribute-list.tsx`). `handleDragEnd` reorders that copy synchronously, then calls the
mutation. *Why:* TanStack Query runs `onMutate` asynchronously and `updatePaymentMethodsCache`
awaits `cancelQueries`, so the cache write lands after the drop. Without the local copy, the
`DragOverlay` drop animation measures the old slot and flies back to it before the list
reorders. A rollback still works: the restored cache is a new array, and the effect resets the
copy.

## Risks / Trade-offs

- [The page shows `PaymentSettingsSkeleton` while `isFetching`, so a background refetch after a
  drop would flash the skeleton] → the reorder mutation does not invalidate
  `paymentKeys.methods.all`; the server response is already the source in the cache. Keep the
  toggle mutations' current behaviour.
- [Stale IDs collect in `methods_order` after deletes] → harmless on read (ignored); the next
  drop rewrites the full list.
- [Hiding delete by the literal ID `'paypal'`] → this matches the user's rule. A future
  uninstall endpoint replaces the check with a capability flag on the provider payload.
- [A third-party provider removed from the filter keeps its slot ID] → ignored on read, same as
  deletes.

## Migration Plan

No data migration. A missing `methods_order` key means registration order, which is today's
behaviour. Rollback: remove the route and the sort; the stored key is then unused.

## Open Questions

- Online gateways other than PayPal (none ship today) will show a delete button whose handler is
  the existing `@todo`. Decide the behaviour when the first such gateway, or an uninstall
  endpoint, lands.
