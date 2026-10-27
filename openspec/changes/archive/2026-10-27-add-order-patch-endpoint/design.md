# Design

## Context

- `PUT /orders/{id}` runs `UpdateOrderAction`. It needs the full payload, recalculates totals and re-syncs items, stock, coupons and taxes in one transaction. See proposal.md - Why.
- `OrderService::partial_update_order(int $id, array $data)` already exists and updates only the given columns. It returns false when the order does not exist.
- `Order::flags` is stored as a comma separated string. The model setter `set_flags_attribute()` converts an array to that string and an empty array to null. `OrderResource` already returns `order_notes` and `flags`.
- `PATCH /orders/{id}/action` is the existing pattern for a narrow order write: its own `Request` class, a thin controller method, and the order resource in the response.
- The admin UI saves the note and flags through the PUT endpoint today. This change does not touch it.

## Goals / Non-Goals

**Goals:**
- A cheap, safe write for `order_notes` and `flags` that cannot fail on unrelated order data.

**Non-Goals:**
- Order activity log entries for note or flag edits. It needs a new activity type and a change to the customer-visible allow-list. It can be a separate change.
- Any admin UI change. The details page keeps using `PUT /orders/{id}` for now.
- Changing `PUT /orders/{id}`. It keeps accepting `order_notes` and `flags`.
- A generic "patch any order field" endpoint.
- Locking the order row. Two writers of one text field give last-write-wins. This is the same as the PUT endpoint today.

## Decisions

1. **Route `PATCH /orders/{id}`, with `->where('id', '[\d]+')`.** It sits next to the `action` route in the same admin group, so it gets the same permission check. Alternative: `PATCH /orders/{id}/meta`. Rejected: the plain resource path is the normal meaning of PATCH, and `/action` already shows the narrow route is not needed.

2. **Controller method `patch()` calls the service directly. No Action class.** The work is one validated write and a fetch. The rest of the controller uses Actions for multi-step work, such as the refund and update flows. Steps:
   - `find_order_or_fail($id)` for the 404.
   - Build `$data` from the keys that are present in the request.
   - `partial_update_order($id, $data)`.
   - Return `OrderResource::make($order->fresh())` with the message "Order updated".

3. **`OrderPatchRequest` separate from `OrderUpdateRequest`.** Reusing the update request would bring back all the required fields. Rules and filters copy the two fields from `OrderUpdateRequest`:
   - `order_notes`: `nullable|string`, filter `TEXTAREA`.
   - `flags`: `nullable|array`, filter `ARRAY`.
   - `flags.*`: `string`, filter `TEXT`.
   - `id`: `required|integer`, filter `INT`.

4. **"Only sent keys change" uses key presence, not value.** The controller checks `$request->has('order_notes')`. A sent null clears the field. An absent key keeps it.
   - Empty request: the validation library has no `required_without`. `OrderPatchRequest::rules()` returns `required` for `order_notes` when neither key is in the request, with a message that names both keys. This gives a 422. If the rule engine does not accept this, do the same check in `passed_validation()`.
   - Alternative considered: a 200 with no change. Rejected: it hides client bugs.

5. **Empty note is stored as null.** Sanitizer `TEXTAREA` keeps line breaks. The controller maps an empty string to null for `order_notes`, to match "A null or empty value SHALL clear the note" in the existing spec. Flags use the model setter, which already stores an empty list as null.

## Risks / Trade-offs

- [A client that holds an old copy of the order can send a PUT with old `order_notes` after a PATCH] → Accepted. Same as two PUT requests today.
- [No activity log entry, so a note edit has no audit trail] → Recorded as a non-goal. Raise it as a follow-up change.
- [Last write wins when two managers edit one order] → Accepted. Same as the PUT endpoint.
- [Empty-request rule may not fit the validation library] → Fallback in `passed_validation()` (decision 4).

## Open Questions

- None that change the specs or the task breakdown.

## Correction during implementation

- **Key presence:** `Request::has()` uses `isset`, so it treats a sent `null` as absent. The request class and the controller use `array_key_exists()` on `all()` instead. The empty-request rule is `Rule::required_if()` with a closure that is true when neither key is sent. It must come before `nullable` in the rule list, or `nullable` ends validation early and an empty body passes. Decision 4 is otherwise unchanged.
- **404:** `OrderService::find_order_or_fail()` throws `NotFoundException` without a code, so the API answers 500 (also for `GET /orders/{id}`). `patch()` uses `find_order()` and throws `NotFoundException` with `Response::NOT_FOUND`. The service method is not changed here.
- **Response:** `$order->fresh()` does not load the relations that `OrderResource` reads, and it fails. `patch()` loads the order again with `find_order()` after the update.
- **Tests:** `POST /orders` ignores `flags`, so the tests set flags through the model.
