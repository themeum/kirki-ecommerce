## 1. Allow-list

- [x] 1.1 Add `OrderActivityType::customer_visible()` with the eight fulfillment types (with docblock and `@since`)

## 2. Service

- [x] 2.1 Add protected `customer_list_query()` in `OrderActivityService` (`list_query()` + `where_in` on the allow-list)
- [x] 2.2 Make `get_order_activity()` use it and remove the hardcoded `!=` checks and the todo
- [x] 2.3 Add `customer_paginated_for_order()` and `customer_all_for_order()` that use it

## 3. Customer REST endpoint

- [x] 3.1 In `Site\OrderActivityController::get`, call the customer service methods instead of `all_for_order()` / `paginated_for_order()`
- [x] 3.2 Add `Resources\Site\Order\OrderActivityListResource` (admin resource minus `notify_customer`) and use it in the controller
- [x] 3.3 Confirm the "all" path total and the paginated total count only visible activities

## 4. Tests

- [x] 4.1 Update `test_customer_can_view_own_order_activities`: expect `order-placed`, expect no `comment-added`
- [x] 4.2 Add a test: a payment-completed activity is not in the customer timeline
- [x] 4.3 Add a test: customer entries have no `notify_customer` key and keep the other fields
- [x] 4.4 Add a test: the customer pagination total excludes hidden activities
- [x] 4.5 Add a test: the admin timeline still returns comments and payment activities
- [x] 4.6 Add a service test: `get_order_activity()` keeps the allow-listed types and drops all others

## 5. Docs and verification

- [x] 5.1 Update the example response in `docs/ecommerce/account/order-activities.yml` (no comment, no `notify_customer`)
- [x] 5.2 Run the PHP integration tests for order activity and the PHP lint/phpcs checks on the changed files
