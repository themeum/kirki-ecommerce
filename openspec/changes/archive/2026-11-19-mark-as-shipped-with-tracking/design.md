## Context

See proposal.md - Why. This design records decisions that are already in the
code on branch `update/mark-as-shipped-action`. Before this change, tracking was
validated inside `PerformOrderAction::resolve_tracking()`, the order details
page passed order state and action callbacks down as props from
`use-order-details.ts`, and `mark-as-shipped` ran at once from the Take-action
card.

## Goals / Non-Goals

**Goals:**

- Ship and add tracking in one request and one transaction.
- Pre-select the carrier the merchant used last, with no new per-order data.
- Let the merchant remove tracking.
- Reject bad tracking input before the action starts.

**Non-Goals:**

- Sending or suppressing emails based on `notify_customer`. The field is
  accepted only, so the UI can add the checkbox later without an API change.
- Per-user or per-zone last used carrier.
- Changing the content or trigger of the Order Shipped or Tracking added emails.

## Decisions

### D1. Tracking rides on the `mark-as-shipped` action

`PerformOrderAction` handles `MARK_AS_SHIPPED` by calling
`OrderManager::mark_as_shipped()` and then, when `has_tracking_info()` is true
(a tracking number and a carrier id or name), `OrderManager::add_tracking()`
with `resolve_tracking()`. All of this runs inside the existing
`DB::begin_transaction()` block, so a failure rolls back both.

Alternative: the dialog sends `mark-as-shipped` and then `add-tracking`. Rejected:
two requests can leave a shipped order without the tracking the merchant typed.

### D2. Tracking validation lives in `OrderActionRequest`

The request uses `Rule::required_if` / `Rule::prohibited_if` closures so that
`carrier` and `carrier_id` are exclusive, one is required for add-tracking, a
number is required with a carrier, and Other needs a URL. The `carrier_id`
closure resolves the order and calls
`ShippingService::find_carrier_for_address()` to check the zone.
`resolve_tracking()` keeps its zone lookup to read the carrier's name and
template, and drops its own checks.

Alternative: keep checks in the action. Rejected because `mark-as-shipped` now
also takes tracking, and request validation gives field-level errors that the
form maps with `applyServerErrors`.

Trade-off: the order is loaded twice (request and action). Acceptable for an
admin action.

### D3. Last used carrier is one store option

`ShippingService::set_last_used_carrier()` writes
`OptionKeys::LAST_USED_SHIPPING_CARRIER` through the framework `Option` facade
as `{ carrier_id, carrier }`: the id for a listed carrier, the name for Other.
It is written after a successful add-tracking or a mark-as-shipped with
tracking, inside the action. `GET /shipping-carriers/last-used` reads it.

Alternatives: derive it from the latest order with tracking (query cost and
cannot tell a listed carrier from Other by name), or user meta (merchants share
carriers across staff). Rejected.

The client decides whether the stored id applies, using the order's zone
carriers (`getInitialTrackingValues()` in `lib/shipping-tracking.ts`). The
mutation invalidates `orderKeys.lastUsedShippingCarrier()` after every action.

### D4. `remove-tracking` is a separate action

`OrderManager::remove_tracking()` sets the three tracking columns to `null`
with `partial_update_order()`. The guard allows it wherever add-tracking is
allowed. It does not send an email and does not touch the last used carrier.

### D5. Order id is passed to `execute()`, not through the DTO

`OrderController::action()` calls `$action->execute($dto, $request->get_int('id'))`
and `PerformOrderActionDTO::$order_id` is removed, so the DTO built from the
request holds only request fields. **This is a break of released API**. The
owner accepted it (task 1.9). See Backward compatibility.

### D6. Order details state in two contexts

`OrderDetailsProvider` holds the order query, the partial-update form, and
badges. `OrderActionProvider` holds the action mutation, the open state of the
Add-tracking, Mark-as-paid, and Mark-as-shipped dialogs, and the handlers. The
dialogs and `TakeActionCard` read them through `useOrderDetails()` and
`useOrderAction()` instead of props. Behavior does not change.

### D7. Tracking form returns `{}` without a number

`AddTrackingFormSchema`'s terminal `.transform()` returns `{}` when no tracking
number is set, so the Mark-as-shipped dialog can spread the payload into the
action without sending empty tracking fields. The transform stays on the
terminal schema, as the zod v3 rule requires.

**Correction during implementation:** the `{}` branch cannot be reached through
parsing. `tracking_number` is `required(...)`, so an empty number fails
validation and zod v3 does not run the transform. The Mark-as-shipped dialog
does not depend on the branch. When the tracking details are hidden, it sends
`tracking: null` and does not run the form. The payload test (task 2.5) checks
for the rejection, not for `{}`. The branch is harmless dead code and stays
as it is.

### D8. Pickup details are stored in the order snapshot

`ShippingService::get_selected_shipping_method_snapshot()` adds `description`
and `is_taxable` to `shipping_metadata.shipping_method` for every method, and
`address`, `pickup_time_start`, and `pickup_time_end` for a local-pickup method.
It copies them from the selected option of
`get_final_available_shipping_options()`, which already applies the rules
(pickup fields `null` for other methods; times only when pickup time is on and
both times are set). The admin `OrderResource` maps the keys to
`shipping_meta` (`{ description, is_taxable, address, pickup_time_start,
pickup_time_end }`) for every order, with the same key names as the snapshot.
Missing keys (other methods, older orders) are `null`.

Alternative: read the current method from the shipping settings by
`order.shipping_method`. Rejected by the owner. The dialog shows the data from
order time, and it still works after the method is deleted or changed.

## Backward compatibility

Checked against `origin/main`.

| Surface | Released | Change | Status |
|---|---|---|---|
| `PerformOrderAction::execute(PerformOrderActionDTO $dto)` | yes | new required `int $order_id` | **Breaks** callers. Owner accepted the break (task 1.9). The only caller in the plugin is `OrderController::action()`. |
| `PerformOrderActionDTO::$order_id` | yes | removed | **Breaks** code that sets it. Owner accepted the break (task 1.9). |
| `PATCH /orders/{id}/action` request | yes | rejects `carrier` + `carrier_id` together; rejects Other without `tracking_url`; requires `tracking_number` on any action that sends a carrier | **Breaks** some released requests. Owner chose to keep it strict (task 1.10). Documented as "Changed in 1.0.2" in `docs/shipping-carriers.md` §7. |
| `PATCH /orders/{id}/action` request | yes | new action `remove-tracking`, new optional fields on `mark-as-shipped`, new `notify_customer` | Additive. Compatible. |
| `GET /shipping-carriers/last-used` | no | new route | Additive. |
| Option `kirki_ecommerce_last_used_shipping_carrier` | no | new stored data | New option, no migration. Owner approved (task 1.11). |
| `OrderManager::remove_tracking()`, `ShippingService::{get,set}_last_used_carrier()` | no | new public methods | Additive. |
| `shipping_metadata.shipping_method` (stored) | yes | new keys `description` and `is_taxable` for every method; `address`, `pickup_time_start`, `pickup_time_end` for local pickup | Additive. Old orders lack the keys; reads use `?? null`. No migration. Owner approved (design D8). |
| Admin order response | yes | new field `shipping_meta` | Additive. |

## Risks / Trade-offs

- [Two emails when shipped with tracking: Order Shipped and Tracking added] →
  Each follows its own Email settings. Record in docs; revisit with
  `notify_customer`.
- [The last used id may not exist in the next order's zone] → the client
  falls back to "Select carrier" (or Other), covered by tests.
- [Stricter REST validation can reject a released client] → accepted (task 1.10).
  The change is documented in `docs/shipping-carriers.md` §7.
- [`notify_customer` accepted but ignored may confuse API users] → documented
  as reserved in the spec.

## Open Questions

- When `notify_customer` is wired up, does `false` suppress the Order Shipped
  email, the Tracking added email, or both? Deferred to the change that adds the
  checkbox.
