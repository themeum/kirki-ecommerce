## Why

A merchant ships an order and then adds tracking in a second, separate step. Most
merchants use the same carrier for most orders, but the Add-tracking dialog asks
for the carrier every time, and wrong tracking cannot be removed. This change
lets the merchant ship and track in one step, pre-selects the carrier they used
last, and lets them remove tracking.

> This change records work that is already implemented on branch
> `update/mark-as-shipped-action`. Tasks that are done are marked `[x]`.
> Open review items are left `[ ]`.

## What Changes

- **Mark as shipped dialog.** The "Mark as shipped" action opens a dialog. The
  merchant can add tracking details (optional) in the same step. A local-pickup
  order shows a "Ready for pickup" variant without tracking fields.
- **Shipping method details.** An order stores its shipping method's
  description and taxable flag, and for local pickup also the pickup address
  and hours. The admin order response returns them as `shipping_meta` for every
  order, and the "Ready for pickup" dialog shows the pickup details.
- **mark-as-shipped accepts tracking.** `PATCH /orders/{id}/action` with
  `mark-as-shipped` accepts optional `carrier_id` or `carrier`,
  `tracking_number`, and `tracking_url`. With a carrier and a number, the order
  is marked shipped and the tracking is stored in one transaction.
- **Last used carrier.** The store remembers the carrier of the last tracking
  added to any order. New route `GET /shipping-carriers/last-used`. The
  Add-tracking and Mark-as-shipped dialogs pre-select it when the order has no
  tracking and the order's zone lists it.
- **Remove tracking.** New order action `remove-tracking` clears the carrier,
  tracking number, and tracking URL of an order. The Add-tracking dialog shows a
  "Remove tracking" button when the order has tracking.
- **Tracking on the order page.** For a shipped order, the Take-action card
  shows the stored tracking (carrier logo, name, number; menu to copy the
  number, edit, and open the link) or an empty state with "Add Tracking".
- **Request validation moved to the request.** `carrier` and `carrier_id` are
  validated before the action runs: one of them is required for add-tracking,
  they cannot be sent together, `carrier_id` must be a carrier of the order's
  zone, a carrier needs a `tracking_number`, and an Other carrier needs a
  `tracking_url`.
- **BREAKING (REST)**: `PATCH /orders/{id}/action` now rejects a request that
  sends both `carrier` and `carrier_id`, and an add-tracking request that sends
  `carrier` without `tracking_url`. Released clients could send these before.
  The owner accepted this change. See design.md - Backward compatibility.
- **BREAKING (PHP API)**: `PerformOrderAction::execute()` takes a new required
  `$order_id` parameter and `PerformOrderActionDTO::$order_id` is removed. Both
  are released. The owner accepted this break.
- New request field `notify_customer` (boolean) is accepted. It has no effect
  yet; the UI checkbox is not shown.
- Order details page state moves into `OrderDetailsProvider` and
  `OrderActionProvider` contexts (refactor, no behavior change).

## Capabilities

### New Capabilities

- `order-mark-as-shipped`: the Mark-as-shipped dialog and the mark-as-shipped
  action with optional tracking, including the local-pickup variant.

### Modified Capabilities

- `order-tracking-carriers`: carrier pre-selection from the last used carrier,
  the last-used-carrier endpoint, remove tracking, the tracking summary on the
  order page, and the stricter request validation for tracking fields.

## Impact

- **Backend:** `app/Actions/Order/PerformOrderAction.php`,
  `app/Http/Requests/Order/OrderActionRequest.php`,
  `app/Http/Controllers/Api/OrderController.php`,
  `app/Services/ShippingService.php`, `app/Managers/OrderManager.php`,
  `app/Constants/Order/OrderAction.php`, `app/Constants/OptionKeys.php`,
  `app/DTO/Order/PerformOrderActionDTO.php`, `app/Resources/Order/OrderResource.php`,
  `routes/api.php`.
- **Stored data:** new option `kirki_ecommerce_last_used_shipping_carrier`
  (`{ carrier_id: string|null, carrier: string|null }`). New keys
  `description` and `is_taxable` in the order's
  `shipping_metadata.shipping_method` for every method, and `address`,
  `pickup_time_start`, `pickup_time_end` for local pickup. No schema change.
- **REST API:** new `GET /shipping-carriers/last-used`; new action value
  `remove-tracking`; new optional fields on `mark-as-shipped`; stricter
  validation on tracking fields; new admin order field `shipping_meta`.
- **Frontend:** `resources/app/features/orders/` - new
  `mark-as-shipped-dialog.tsx`, `tracking-fields.tsx`, `tracking-info.tsx`,
  `notify-customer.tsx`, `contexts/`, `hooks/use-order-action.ts`,
  `lib/shipping-tracking.ts`; changes to `add-tracking-dialog.tsx`,
  `take-action-card.tsx`, `mark-as-paid-dialog.tsx`, `pages/order-details.tsx`,
  `hooks/use-order-details.ts`, schemas, services, query keys, endpoints.
- **Docs:** `docs/shipping-carriers.md`,
  `docs/ecommerce/orders/get-last-used-shipping-carrier.yml`.
- **Tests:** `tests/Integration/OrderTrackingCarriersApiTest.php`,
  `resources/app/features/orders/tests/components/order-details/add-tracking-dialog.test.tsx`.
