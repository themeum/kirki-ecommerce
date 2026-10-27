# Tasks

## 1. Backend endpoint

- [x] 1.1 Add `OrderPatchRequest` in `app/Http/Requests/Order/` with the rules, filters and empty-request message from the design (decisions 3 and 4)
- [x] 1.2 Add `OrderController::patch()` with a docblock: 404 through `find_order_or_fail`, update only the present keys through `partial_update_order`, empty `order_notes` stored as null, return `OrderResource` with "Order updated" (decisions 2 and 5)
- [x] 1.3 Register `Route::patch('/orders/{id}', [OrderController::class, 'patch'])->where('id', '[\d]+')` next to the `action` route in `routes/api.php`
- [x] 1.4 Add integration tests in `tests/Integration/OrderApiTest.php` for every scenario of "Order note and flags can be partially updated" (note only, flags only, both, clear note, clear flags, line breaks and tags, other data untouched, empty request, invalid flags, not found, cancelled order)
- [x] 1.5 Add a PATCH case to `tests/Integration/AdminApiAccessTest.php` for the not-a-manager scenario
- [x] 1.6 Run the PHP test suite, `phpcs` for the changed PHP files, and fix any failure

## 2. Docs

- [x] 2.1 Update `docs/order-data-and-calculations.md`: describe `PATCH /orders/{id}` (body, response, errors) and say that it does not recalculate
- [x] 2.2 Add a short note in "9. Gaps and decisions for order edit" that note and flag edits write no activity log entry
