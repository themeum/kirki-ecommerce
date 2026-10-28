# Design

## Context

The edit preview (`OrderCalculationController::get`) and the save (`UpdateOrderAction`) both build the calculation context with `OrderCalculationContextService::build()`. That method asks `StoredOrderTermsService::build()` for the terms the order keeps. Today, `StoredOrderTermsService::is_shipping_quoted_again()` decides whether the edit keeps the stored shipping charge:

```
StoredOrderTermsService::build
   |
   +-- method or country/state changed? --no--> shipping_subtotal, shipping_tax_rates,
   |                                             is_shipping_tax_split  (stored)
   |                                                   |
   |                                                   v
   |                   context->uses_stored_shipping() == true
   |                     - RecalculateCartAction::get_shipping_total returns stored charge
   |                     - StoredRateTaxStrategy taxes shipping at stored rates
   |                     - validate_edit skips the method check
   |                     - UpdateOrderAction keeps old shipping_metadata
   |
   +-- yes --> live quote everywhere
```

The "yes" branch already exists and is tested: it is what happens today when the method or the region changes. This change makes that branch the only one.

## Goals / Non-Goals

**Goals:**
- One shipping path for an edit: the live quote, the live method check, the live shipping tax and a new `shipping_metadata` snapshot.
- Remove the stored-shipping code that has no use after that.

**Non-Goals:**
- No change to the stored line prices, stored coupons, stored line tax rates, the exchange rate or the tax-inclusive setting.
- No change to order creation or checkout.
- No change to how zero-amount shipping tax rows are made. The live tax strategies already make them.
- No new admin UI. The edit screen already shows a preview error as a toast.

## Decisions

### 1. Remove the stored shipping terms, do not only flip the condition

`StoredOrderTermsService::build()` stops setting any shipping value. Then `StoredOrderTermsDTO::$shipping_subtotal`, `$shipping_tax_rates`, `$is_shipping_tax_split`, `has_stored_shipping()` and `CalculationContextDTO::uses_stored_shipping()` always give "not stored". We remove them and every branch that reads them:

| Place | Now | After |
|---|---|---|
| `StoredOrderTermsService` | `is_shipping_quoted_again()`, `get_shipping_subtotal()`, `get_shipping_tax_rates()` | removed; `build()` sets only coupons, tax-inclusive, tax destination and line tax rates |
| `StoredOrderTermsDTO` | 3 shipping properties + `has_stored_shipping()` | removed |
| `CalculationContextDTO` | `uses_stored_shipping()` | removed |
| `RecalculateCartAction::get_shipping_total()` | stored-charge early return | removed |
| `OrderCalculationContextService::validate_edit()` | method check skipped when stored | always checked |
| `UpdateOrderAction` | keeps `$order->shipping_metadata` when stored | always `get_selected_shipping_method_snapshot($context)` |
| `StoredRateTaxStrategy` | `calculate_shipping_lines()`, `first_item_rate()` | removed; `$result->shipping = $live_result->shipping` |

*Alternative:* return `true` from `is_shipping_quoted_again()`. This is a one-line diff, but it leaves about 150 lines of code and tests for a path that can never run. The user asked for the cleanup, so we remove it.

`StoredRateTaxStrategy` stays. It still taxes the lines on the order at their stored rates. `get_line_keys_by_order_item_id()` stays because `get_item_tax_rates()` still uses it. Check each helper's other callers before you remove it.

### 2. Shipping tax is always live

With a new charge there is no reason to keep the old shipping tax rate. The new charge can come from another method with another taxable flag. Today, a changed method already gets live shipping tax while the line rates stay stored. So this is the current behavior of the "quoted again" branch, now used on every edit.

*Alternative:* keep the stored shipping tax rates and apply them to the new charge. Rejected: it keeps `calculate_shipping_lines()` and the EU split logic, and it gives a wrong rate when the method or its taxable flag changed.

Edge case: when the store does not calculate tax now (`Tax::should_calculate_tax()` is false) but the order has stored line rates, `get_tax_result()` uses `StoredRateTaxStrategy` with a null live strategy. Then the lines keep their stored tax and the shipping tax becomes zero. This matches "shipping tax follows the current settings". We record it in the docs.

### 3. A clear 422 for an unavailable method

`validate_edit()` now runs the method check on every edit. The current message, "Invalid shipping method", does not tell the admin what to do. The edit check uses a new message: "The shipping method of this order is not available. Select another shipping method." `CreateOrderAction` keeps its own message. It is out of scope.

*Alternative:* fall back to the stored charge when the method is gone. Rejected in exploration: it brings back the stored-shipping path and gives a charge that the current rules cannot explain.

## Risks / Trade-offs

- [An order whose method was removed cannot be edited until the admin selects another method] → The 422 message names the fix. The edit read already lists `available_shipping_methods` without the removed method, so the admin can select one. On the edit screen, a failed preview reverts the form, so the admin must change the method first and then the other fields. We accept this; a UI hint is a possible follow-up.
- [An edit that changes nothing can change the shipping charge and the total] → Documented in `docs/order-editing.md` and in the "Where this differs from WooCommerce" section. The preview shows the new charge before the save.
- [Old orders with stored shipping tax rates that differ from the current rates] → They get the current shipping tax on their next edit. The stored rows are replaced on save, as they are today when the method changes.

## Migration Plan

No data migration. Stored orders keep their stored shipping values until their next edit. Rollback is a code revert.
