## Context

See proposal.md for the motivation. This is how the current code is laid out:

- `DiscountService::validate_conditions()` checks the per-customer usage limit by counting `order_coupons` rows for `coupon_id` + `customer_id` where `usage_reversed_at IS NULL`. It has the same `user()` guard. `order_coupons` snapshots `customer_id`, but not the email. `UpdateOrderAction`'s context includes the edited order's own row, so editing an order whose coupon has a limit of 1 drops the coupon.
- `DiscountService::validate_customers_eligibility()` checks first-time-buyer coupons using a precomputed `CalculationContextDTO::$customer_order_count`. It guards with `empty($context->customer_id) && empty(user()->get_id())`. `user()` is whoever is signed in, which is the admin on admin order screens.
- Four places build `CalculationContextDTO`:
  - `CalculationContextDTO::from_cart()`, used by `CartResource`, `ApplyCouponAction` and `UpdateCartAction`
  - `OrderCalculationController::prepare_context_dto()`, the admin "calculate totals" endpoint
  - `CreateOrderAction::prepare_calculation_context_dto()`
  - `UpdateOrderAction::prepare_calculation_context_dto()`

  The first three each compute `customer_order_count`, two by `order_status` and one by `fulfillment_status`. The fourth never sets it, so it is always `0`.
- `DiscountService::calculate()` re-validates every coupon and silently moves failures into `invalid_coupons`. That is how checkout and order edit enforce eligibility. `ApplyCouponAction` calls `validate_coupon()` directly and surfaces the error.
- `orders.customer_email` exists and is indexed. `OrderCreateRequest`, `OrderUpdateRequest` and `OrderCalculationRequest` already accept `customer_email`. The cart has no contact email. It only has `shipping_address.email` / `billing_address.email` inside JSON columns, and the storefront doesn't send those for guests.
- The storefront guest contact email lives in a separate Alpine `form()` component (`#contact-form`, `resources/views/site/checkout/parts/contact-info.php`). `checkout.ts` reads it only in `placeOrder()`.
- `DiscountService` has no constructor today. `DiscountServiceTest` and `RecalculateCartActionTest` instantiate it with `new DiscountService()`.

## Goals / Non-Goals

**Goals:**
- One definition of "prior orders" and one place that decides who the buyer is.
- Context builders pass through raw identity (customer ID, user ID, email, order being edited) and stop computing derived counts.
- No order-count query unless a first-time-buyer coupon is actually being validated.

**Non-Goals:**
- **Normalizing emails on write.** Stored `orders.customer_email` / `carts.customer_email` keep their casing as entered.
- **Rate-limiting coupon attempts** (see Risks).
- **Sending the email with the apply-coupon request.** The apply-coupon endpoint keeps `{ code }` only. The email reaches the server through cart update.

## Decisions

### D1. The cart gets a real `customer_email` column, not a field in the address JSON

Add a nullable `string(255)` column, `customer_email`, after `user_id` on `kirki_ecommerce_carts`, mirroring `orders.customer_email`.
- **Why a column:** the contact email is not an address attribute. Guests may never fill a shipping email, and this keeps cart → order naming 1:1.
- **Rejected alternative:** reading `shipping_address.email`. It's semantically wrong, the storefront doesn't populate it, and it would need JSON digging in the context builder.
- **Validation and output:** `CartUpdateRequest` validates `customer_email` as `email|nullable` with `Sanitizer::EMAIL`. `CartResource` returns it.
- **Write semantics:** `CartService::partial_update` already writes only the keys present, so an omitted field leaves the stored value untouched, and an explicit `null` or `''` clears it. Verify this during apply.

### D2. The buyer's email is resolved when the context is built; the counts stay lazy

`CalculationContextDTO` changes:
- **Removed:** `$customer_order_count`.
- **Added:** `$customer_email` (`string|null`), the email that identifies the buyer, already resolved and lowercased. It is `null` only for a guest who hasn't entered one yet.
- **Added:** `$order_id` (`int|null`), the order being edited, so it is excluded from its own counts.

**One resolver:** `CustomerService::resolve_buyer_email($customer_id, $user_id, $entered_email)` returns the customer record's email, else the WordPress account's email, else the entered email. The result is trimmed and lowercased, or `null` when there is none. It never falls back to the current user. All four context builders call it, so the precedence lives in one place, and anything reading the context gets the buyer's email directly.

**Why `CustomerService`, not `app/Supports/`:** resolving the email reads customer records and WordPress users, which is data access. `Supports/` holds stateless, domain-agnostic helpers. The `customer()` helper (`App\Wordpress\Customer`) is deliberately avoided: with a null `user_id` it falls back to the current user, which would bring back the admin-as-buyer bug.

**Why the counts stay lazy:** only first-time-buyer and per-customer-limited coupons need them, so `DiscountService` runs them only while validating those coupons. Resolving the email up front costs at most one primary-key lookup per context build.

**Rejected alternative:** resolving the email lazily inside `DiscountService`. That worked, but it left `customer_email` meaning "whatever was typed", which is ambiguous for every other reader of the context, and it gave `DiscountService` a `CustomerService` dependency it doesn't otherwise need.

**Why account email wins for registered buyers:** orders placed by registered shoppers store the account email (`CreateOrderAction::resolve_customer_contact_details()`). Prior-order matches must use the same identity. It also stops a signed-in shopper from typing a fresh email to look "new".

### D3. One prior-order definition: `OrderService::count_prior_orders($customer_id, $email, $exclude_order_id = null)`

The query, in pseudo-SQL:

```
WHERE (customer_id = :customer_id OR customer_email = :email)
  AND order_status NOT IN (FAILED_CANCELLED, REFUNDED)
  AND id <> :exclude_order_id   -- only when given
```

- Each identity clause is added only when its value is non-empty. When both are empty, it returns `0` without querying.
- **Status rule:** this keeps the `order_status` rule used by the cart and the calculation endpoint (`order_status` is the composite lifecycle status). The `fulfillment_status` variant in `CreateOrderAction` is removed. That variant is the source of the cart-versus-checkout disagreement.
- **Implementation:** the OR group needs a nested-where closure on the framework query builder. Confirm the builder supports `where(fn ($q) => ...)` during apply. If it doesn't, use `where_raw` with bound parameters.
- **Why `OrderService`:** it already owns order lookups by email (`get_guest_orders_by_email`). `DiscountService` receives it by constructor injection, matching the actions' style. Both tests that build `DiscountService` directly are updated to pass a mock.

### D3b. Per-customer coupon usage: `OrderService::count_coupon_usages($coupon_id, $customer_id, $email, $exclude_order_id = null)`

The query, in pseudo-SQL:

```
FROM order_coupons JOIN orders ON orders.id = order_coupons.order_id
WHERE order_coupons.coupon_id = :coupon_id
  AND order_coupons.usage_reversed_at IS NULL
  AND (order_coupons.customer_id = :customer_id OR orders.customer_email = :email)
  AND order_coupons.order_id <> :exclude_order_id   -- only when given
```

- The identity clauses follow the same "only when non-empty" rule as D3.
- **Why join orders instead of adding an email snapshot to `order_coupons`:** `orders.customer_email` is already the stored contact email and is indexed, and a join avoids a second migration plus a backfill of existing rows.
- **Rejected alternative:** snapshot `customer_email` onto `order_coupons`, mirroring its `customer_id` snapshot. That's cleaner for reads, but it needs a backfill and a write-path change in `PersistsOrderCoupons` for no behavioural gain.
- **Builder support:** if the framework builder lacks `join`, use `where_in('order_id', <subquery on orders>)`. Confirm this alongside the nested-where check.
- **Why it lives with `count_prior_orders`:** both methods sit on `OrderService` and take the same identity triple, so the two rules can't drift apart.

### D4. Case-insensitive matching by normalizing the input, not the column

- The input email is lowercased and trimmed in PHP.
- The column comparison uses a plain `=`, relying on the table's case-insensitive collation (WordPress creates tables with `*_ci` collations), so the `customer_email` index stays usable.
- **Rejected alternative:** `LOWER(customer_email) = ?`, which defeats the index.

### D5. Guard and messages

Both buyer-scoped rules share one guard, a protected `ensure_buyer_identity($context)`. When the context has neither a `customer_id` nor a `customer_email`, it rejects with "Please enter your email address to use this coupon.". A signed-in buyer always has an account email, so in practice only a guest who hasn't entered an email reaches it.

- **First-time buyer:** if `count_prior_orders > 0`, reject with "This coupon is only available for first time buyers." (unchanged).
- **Per-customer limit:** if `count_coupon_usages >= customer_limit`, reject with "You have reached the usage limit for this coupon." (unchanged).

`DiscountService` no longer reads `user()` at all. The only account lookup is in `resolve_buyer_email()`, for the cart owner's explicit `user_id`, so the acting admin never leaks into the check.

### D6. What each context builder supplies

| Builder | `customer_id` | `user_id` | `customer_email` | `order_id` |
|---|---|---|---|---|
| `from_cart` | cart owner's customer | cart owner | resolved from customer, owner, `$cart->customer_email` | – |
| `OrderCalculationController` | selected customer | – | resolved from customer, request `customer_email` | – |
| `CreateOrderAction` | resolved/provisioned customer | – | resolved from customer, payload `customer_email` | – |
| `UpdateOrderAction` | order's customer | – | resolved from customer, payload `customer_email` | edited order id |

- There is no fallback to `billing_email` or `shipping_email`. Storefront guests must send `customer_email` (`required_if:is_guest,1`). Registered buyers are identified by their customer record or account email, which `CustomerService::resolve_buyer_email()` checks first. An address email isn't a reliable buyer identity, so a buyer with none of these gets the "enter your email" rejection instead of a guess.
- The order flows deliberately leave `user_id` unset. For admin flows that keeps the admin out. For storefront checkout, the signed-in shopper already has a resolved or provisioned `customer_id` before the context is built.

### D7. Storefront sync

Changes in `resources/site/ts/components/checkout.ts`:
- **Cart updates:** `updateCart()` includes `customer_email` only when the contact form's value passes email validation, so a half-typed email never fails the whole cart update.
- **Debounced sync:** changes to the contact email trigger the existing debounced `updateCart`. The contact form dispatches a change event, or checkout watches the form; pick whichever matches the existing `form()` helper's API.
- **Before applying a coupon:** `applyCoupon()` first awaits `updateCart()` when the valid contact email differs from `cartData.customer_email`.
- **Pre-fill:** on init, if `cartData.customer_email` is set and the contact field is empty, the contact form is pre-filled.
- **Signed-in shoppers:** they have no contact form and send nothing. The server resolves their account email.
- **Types:** the `Cart` type in `resources/site/ts/types.ts` gains `customer_email?: string | null`.

### D8. Admin coupon form

`targeting-tab.tsx` renders the "First time buyer only" checkbox unconditionally. The form schema and payload already carry `first_time_buyer_only` for every eligibility, so there's no schema change. The existing payload test still gets a guests + first-time case added to lock this in.

## Risks / Trade-offs

- **[Email enumeration]** Applying a first-time coupon reveals whether an email has ordered before. → Accepted. The message doesn't confirm an account exists, and this matches common e-commerce behaviour. Rate limiting is out of scope.
- **[New email bypass]** A guest can use a fresh email each time. → Accepted by product: the email is the identity for guests.
- **[Case-sensitive collation on some installs]** A site whose tables use a `_bin` collation would compare case-sensitively. → WordPress's default `dbDelta` collations are `_ci`, so this is a low risk. If it matters later, normalize emails on write in a follow-up rather than adding `LOWER()` to the query.
- **[Extra query when a buyer-scoped coupon sits on a cart]** Every cart render recalculates, so it runs one indexed count query per such coupon (plus at most one customer lookup). → Less work than today, which runs the prior-order count on every signed-in cart render regardless of coupons.
- **[Guest usage matched through `orders.customer_email`]** If an admin later edits an order's `customer_email`, that order's coupon usage moves with it. → Acceptable: the order's contact email is the guest's identity, by design.
- **[Cart coupon silently dropped at checkout]** This happens if the guest changes email to one with prior orders. → Intended (see spec). It's the existing `invalid_coupons` behaviour.
- **[Constructor change to `DiscountService`]** → It's resolved from the container everywhere except the two tests, which are updated.

## Migration Plan

- **Migration:** add `AlterCartsAddCustomerEmailColumn` (`up` adds the column after `user_id`; `down` drops it). Register it at the end of the `// Since v1.0.0-beta.1` group in `config/migrations.php`, matching the current plugin version.
- **Upgrades:** existing carts get `NULL` and behave exactly as a guest who hasn't entered an email yet.
- **Rollback:** revert the code and run the migration's `down`. Nothing else stores the column.

## Corrections during implementation

- **D3b: subquery, not join.** The query builder supports `join`, but no app code uses it, and joined queries need table-prefixed column names. `count_coupon_usages()` takes the D3b fallback instead: `or_where_in('order_id', Order::query()->select('id')->where('customer_email', ...))`, which lets the model apply the prefix.
- **D6: the `billing_email` fallback was removed.** It was first implemented in all three order builders and then dropped after review: `customer_email` is required for guest checkout, and registered buyers resolve through their customer or account email. All three builders now pass the payload's `customer_email` straight through, so the calculation preview and the saved order still reach the same verdict.
- **D7: the initial checkout config was missing the email.** `cartData` on checkout load comes from `config.checkout_cart`, which `PageInlineScript::set_checkout_page_data()` builds from a fixed list of cart keys. `customer_email` was added there, and to the config's TypeScript type, so the reload pre-fill works.
- **D7: `form()` has no change hook.** Checkout listens for the native `input` event bubbling from `#contact-form` and syncs only when `hasUnsyncedContactEmail()` is true. The email regex is now exported from `form.ts` as `EMAIL_PATTERN`, so the "valid email" test matches the field's own validation.
- **D2: email resolution moved from `DiscountService` to the context builders.** This was first implemented as a lazy `DiscountService::resolve_buyer_email()`. After review it moved to `CustomerService::resolve_buyer_email()`, called by every context builder, so `$context->customer_email` always means the buyer's resolved email and `DiscountService` depends only on `OrderService`. `ensure_buyer_identity()` now checks only `customer_id` and `customer_email`. The framework's `QueryBuilder::value()` turned out to return the model's table name instead of the column value, so the resolver uses `Customer::find()`.
