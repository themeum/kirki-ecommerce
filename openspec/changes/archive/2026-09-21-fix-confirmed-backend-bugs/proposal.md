## Why

While adding docblocks to every PHP file, agents flagged suspicious code. Checking each item against the code and the existing specs confirmed six real backend defects, one of them a security hole (anyone can mark an order as paid) and one a data-loss risk (customer "delete all" ignores its filters). They are small, independent fixes worth doing together now, before the alpha ships further.

## What Changes

- **PayPal webhook is authenticated.** The public webhook route currently acts on any JSON body. It will verify the request with PayPal before changing any order, and reject it when the Webhook ID setting is missing or verification fails.
- **Customer "delete all" respects country and city.** The controller builds a filter object that has no country or city, so those filters are silently dropped and more customers than listed can be deleted. It will use the customer filter object.
- **Exactly one base currency.** Nothing on the server stops two currencies being flagged as base; today only the frontend's habit of resending every row prevents it. Saving a currency as base will demote every other currency, so the rule holds for any client and any row order. The rate sync that was meant to follow a base change never fired (its check compared against a model that was already updated) and has been removed; refreshing rates after a base change is left to the existing "Sync now" for now.
- **Failed bulk operations roll back.** `DB::roll_back()` does not exist (the method is `rollback()`), so the failure path crashes instead of returning the intended error. Two call sites are corrected.
- **Currency settings response stays currency-only.** A missing `break` makes the currency case also run the email formatter, adding email keys to the response. The case will end after currency formatting.
- **Two small mistakes.** Guest-order merge sets a new customer's last name to their first name. The admin product list shows the wrong price when the cheapest variant is the one on sale; it will show the lowest effective price with the regular price it reduces.

Out of scope: the leftover `/test` route and the failed-payment-shows-success redirect (both seen in the same review, deferred by choice), and everything else in the archived `findings.md`.

## Capabilities

### New Capabilities

- `payment-webhook-authentication`: payment webhooks must be verified as coming from the provider before they change any order.
- `customer-bulk-delete-scope`: a bulk "delete all" acts only on the customers matching the active list filters.
- `bulk-operation-rollback`: a bulk operation that fails partway leaves no partial changes and reports the intended error.
- `settings-response-isolation`: a settings group's API response contains only that group's data.
- `guest-order-merge`: when guest orders are attached to an account, a new customer record carries the user's real first and last name.
- `admin-product-list-pricing`: the admin product list shows the lowest effective price across a product's variants.

### Modified Capabilities

- `multi-currency-settings`: adds a requirement that exactly one base currency exists whatever the client sends. Existing requirements are unchanged.

## Impact

- `app/Payment/Providers/PayPal.php`, `app/Payment/WebhookController.php`
- `app/Http/Controllers/Api/CustomerController.php`, `app/Services/CurrencyService.php`
- `app/Services/VariantService.php`, `app/Services/CustomerService.php`
- `app/Resources/SettingResource.php`, `app/Resources/Product/ProductListResource.php`, `app/Services/OrderService.php`
- No database migration and no frontend change. The PayPal fix makes the existing, currently optional Webhook ID setting mandatory for webhooks to be accepted, so a store with PayPal enabled must have it filled in.
- Tests: new PHPUnit tests alongside each fix (unit where the code can run without WordPress, integration otherwise).
