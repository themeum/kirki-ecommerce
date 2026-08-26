# Code Review — `main`...`dev` — **RESOLVED**

**Scope:** `git diff main...dev` — 1,210 files, ~54k insertions / ~20k deletions, 100+ commits.
**Date:** 2026-08-21
**Status:** all 12 accepted findings fixed, plus 2 further bugs found while verifying.

## Verification

| | before | after |
|---|---|---|
| PHP integration (`composer test:docker`) | 22 failures, 3 errors | **4 failures, 0 errors** |
| Frontend (`npm test`, `resources/app`) | 669 passed | 669 passed |

The 4 remaining failures all exist on `main` and exercise code this branch does not
touch — see [Not fixed](#not-fixed) below.

### Withdrawn after review feedback

| Item | Reason |
|---|---|
| Open redirect in `handle_login` | Not an issue. `redirect()` returns a `RedirectResponse` whose `send()` uses `wp_safe_redirect()` (`libraries/framework/Http/RedirectResponse.php:84`). |
| Guest cart merge overwrites quantity | Intentional — guest quantity wins by design. |
| Migrations edited in place / no upgrade path | Handled on a separate branch. |

---

## Fixed

### 1. Reflected XSS in the login form's hidden `redirect` field — CRITICAL
`resources/views/site/login.php:61`

`request('redirect', '')` was echoed raw into an HTML attribute, so
`/login?redirect="+onfocus%3dalert(1)+autofocus="` executed script on the store's
origin. **Fix:** wrapped in `esc_url()`.

### 2. Duplicating a coupon dropped its discount amount — HIGH
`app/Actions/Coupon/DuplicateCouponAction.php`

The coupons table has no `discount_amount` column (the value lives in
`base_discount_amount_fixed` / `discount_amount_percentage`), so
`CreateCouponDTO::from_array($coupon->to_array())` left it `null` and the copy
applied a 0 discount. **Fix:** populate `discount_amount` from the typed column
that matches `discount_value_type`. Covered by a new assertion in
`tests/Integration/CouponApiTest.php`.

### 3. `null` coupon datetimes stored as "now" — HIGH
`app/helpers.php`

`to_utc_datetime_string()` had no empty guard and `Somoy::parse(null)` resolves to
`'now'`, so every coupon saved with `has_end_datetime = false` got
`end_datetime = <creation timestamp>`. **Fix:** both `to_utc_date_string()` and
`to_utc_datetime_string()` now return `null` for an empty value, restoring the
behaviour of the `to_utc()` helper they replaced. Their `function_exists()` guards
also named the wrong FQN (`Kirki\Ecommerce\…` instead of `Kirki\Ecommerce\App\…`)
and were corrected at the same time.

### 4. Percentage coupons could be created but not updated — HIGH
`app/Http/Requests/Coupon/CouponUpdateRequest.php:41`

`discount_amount` was validated as `integer` on update but `number` on create, so a
`12.5%` coupon saved once and then failed every subsequent save. **Fix:** update now
uses `number`, matching create.

### 5. Checkout customer provisioning ran for orders that have no customer — HIGH
`app/Actions/Order/CreateOrderAction.php`

The `!$dto->is_manual && !empty($dto->created_by)` guard had been dropped, so
`resolve_checkout_customer_id()` ran unconditionally. Two live failures resulted:

- a **manual** order with no customer picked provisioned a Customer from the *admin's*
  WordPress user and linked the order to it;
- a **guest** checkout (no `created_by`) fell through to `create_customer_action`,
  which died on `wp_insert_user` with *"Cannot create a user with an empty login
  name"*, or violated the `customers_created_by_foreign` FK.

**Fix:** resolve a customer only when there is one to resolve —
`!empty($dto->customer_id) || (!$dto->is_manual && !empty($dto->created_by))`. This
keeps the branch's new address-sync path for a chosen customer and for signed-in
shoppers. `resolve_checkout_cart()` was also moved ahead of it so an empty or
consumed cart is rejected before any customer/address write happens.

This fixed 4 previously failing integration tests (`Checkout guest order has no
customer`, `Order customer contact uses billing for guest checkout`, `Checkout
empties guest cart by token`, `Checkout rejects consumed guest cart token`).

> **Partially addressed:** the customer/address writes still happen *outside* the
> order transaction, so a later failure (e.g. out-of-stock) leaves them committed.
> Full atomicity is not fixable here: `Connection::begin_transaction()` issues a
> bare `START TRANSACTION` with no savepoint/nesting support, and
> `CreateCustomerAction` opens its own transaction — wrapping `execute()` would
> make the inner `COMMIT` close the outer one. Reordering removes the common
> failure paths; proper nesting needs framework support and is filed as follow-up.

### 6. Submit buttons never disabled during submission — MEDIUM
`resources/views/site/login.php:92`, `resources/views/site/register.php:112`

`:disable` → **`:disabled`**. The typo let a double-click fire two `wp_insert_user`
requests.

### 7. `echo printf(...)` printed the byte count after the order number — MEDIUM
`resources/views/site/account/order-details.php:76`

"Order #1005" rendered as "Order #100512". **Fix:** dropped the redundant `echo`,
escaped the order number, and wrapped the two adjacent badge-class attributes in
`esc_attr()`.

### 8. `to_date`-only filters ignored; end day truncated — MEDIUM
`app/Traits/HasDateRangeFilter.php`

The outer `when(!empty($from_date))` made a `to_date`-only filter a silent no-op
(returning the *unfiltered* list), and `to_utc_datetime_string('2026-08-21')` yields
`00:00:00`, so a same-day filter matched almost nothing. **Fix:** the two bounds are
now independent, and the range is widened with `start_of_day()` / `end_of_day()` in
the site timezone before conversion to UTC — matching what the admin date-range
picker actually sends (`formatDateValue` → `yyyy-MM-dd`).

### 9. Square webhook HMAC compared with `===` — MEDIUM
`payments/kirki-square/src/SquareClient.php:52` → `hash_equals()`.

### 10. Order-details ownership check passed when both IDs were `NULL` — MEDIUM
`app/Http/Controllers/Site/AccountController.php`

A logged-in user with no Customer record satisfied `null !== null === false` for
every order with a `NULL` `customer_id`. **Fix:** reject outright when
`get_customer_id()` is empty.

### 11. N+1 query on the account order list — MEDIUM
`app/Resources/Site/Order/OrderListResource.php`, `app/Services/OrderService.php`

`get_items_images()` called `$this->items()->get()` per row. **Fix:** use the loaded
`$this->items` relation and eager load `items` in `get_current_customer_orders()`.

### 12. Viewing a past order re-opened a live gateway payment session — MEDIUM
`app/Resources/Site/Order/OrderResource.php`

`Payment::pay()` runs on every render of this resource, which the branch newly wired
into the account order-details page — creating a real Klarna/Square session for
historical orders, and throwing a fatal if the gateway had since been disabled.
**Fix:** extracted `resolve_payment_next_step()`, which returns `null` for orders
already settled (`paid`, `refunding`, `refunded`) and otherwise behaves as before,
preserving the retry path for `unpaid`/`failed`.

---

## Found while verifying (not in the original review)

### 13. Creating a tax or shipping profile always failed — HIGH
`app/Http/Requests/{TaxProfile,ShippingProfile}/*`, `app/DTO/{TaxProfile,ShippingProfile}/*`

The `is_default` field added by this branch had two defects that compounded:

1. the rule was `'boolean'` without `|nullable` (the codebase writes `'boolean|nullable'`
   47 times vs 10), and `BooleanRule`'s accepted values exclude `null`, so any request
   omitting the field 422'd;
2. once past validation, the DTO property defaulted to `null` while the column is
   `boolean NOT NULL DEFAULT 0`, producing
   *"Column 'is_default' cannot be null"* — a 500.

**Fix:** `|nullable` on the three rules added by this branch, and `= false` on all four
DTO properties (matching how `CreateCouponDTO`/`UpdateCouponDTO` declare their booleans).
This turned 18 failing tax/shipping-profile tests green.

### 14. Free-shipping and buy-x-get-y coupons were silently never applied — HIGH
`app/Services/DiscountService.php`

The new `validate_items_eligibility()` ran `get_eligible_items()` for every coupon, but
that method returns an empty collection when `eligible_item_type` is `null` — which is
the normal state for a free-shipping or buy-x-get-y coupon. The resulting
"No eligible items found" was swallowed by `RecalculateCartAction`, so the coupon was
dropped with no error and the shopper was charged full shipping.

**Fix:** skip the item-eligibility check when the coupon declares no item scope. A
coupon scoped to specific products/categories still requires a matching cart item.
This fixed `Checkout accepts first time buyer coupon for new customer` and
`Checkout accepts customer usage limit coupon for new customer`.

### Also corrected
- `tests/Integration/CouponApiTest.php:318` asserted `$duplicated['customers']` was a
  list of IDs, but `CouponResource` was changed in this branch to return
  `CustomerInfoResource::collection(...)`. The sibling `categories`/`products`
  assertions had been updated; this one had not.

---

## Not fixed

Four integration tests still fail. **All four exist on `main`** and exercise code this
branch does not modify, so they are outside the scope of this review — and both root
causes are decisions rather than clear defects:

| Test | Root cause |
|---|---|
| `Create refund on order` | `CreateRefundAction` requires `payment_status = paid` **and** `fulfillment_status ∈ {delivered, cancelled}`; the test refunds a freshly created order. The action carries a `// @todo: need to fix this`. Whether the guard or the test is wrong is a product decision. |
| `Duplicate variant combination is rejected`<br>`Update without attribute values is rejected`<br>`Variant referencing an unlisted value is rejected` | All three fail on a shared helper at `ProductApiTest.php:251`, creating an attribute value. `AttributeValueCreateRequest` declares `unique:kirki_ecommerce_attribute_values,value` (**globally** unique) while the migration declares `unique(['attribute_id', 'value'])` (unique **per attribute**). Two attributes can therefore never both have a value "Red". The framework's `UniqueRule` supports only `table,column,ignore_id`, so fixing this needs either a scoped-unique rule in `libraries/framework` (vendored — CLAUDE.md says do not hand-edit) or a custom check in the request. |

## Remaining minor items (not addressed)

- **`resources/site/ts/components/checkout.ts:302,350`** still `$dispatch` the legacy
  `'shipping-method-change'` / `'payment-method-change'` names, absent from the new
  `Events` registry (`kecom:shipping-method:changed` / `kecom:payment-method:changed`).
  Nothing listens to either, so it is dead code.
- **`kecom:cart-updated`** (`cart.ts:39,54`, `add-to-cart.ts:81`,
  `MiniCartService.php:45`) is dispatched on `document` as a raw `CustomEvent` and is
  not in the `Events` registry.
- **`app/Traits/HasDateRangeFilter.php`** — CLAUDE.md §2 puts traits under `Concerns/`;
  `app/Concerns/` exists and the new `HasCartToken` trait went there correctly.
- **`app/Supports/Url.php:159,161`** — uses `self::` where the standard is `static::`,
  and `urlencode($redirect)` is applied before the query-param builder encodes it again.
- **`app/Services/MiniCartService.php:27`** — method name typo: `get_mimi_cart_html`.
- **`app/Services/CustomerService.php:151-155`** — unreachable `if (empty($customer))`
  after `find()`, which already throws.
- **`CouponService::delete_all()` / `CustomerService::delete_all()`** call `->delete()`
  on a query carrying `order_by`, eager loads and aggregates — worth confirming the
  QueryBuilder strips those before compiling the DELETE.
- **`UpdateAccountAddressesAction.php:56-63`** — customer created before
  `DB::begin_transaction()`, so a failed address write leaves an orphan row. Same
  nested-transaction limitation as finding 5.
- **`SiteController.php:271-279`** — `register_page()`'s `registration_enabled()` guard
  is unreachable; `routes/site.php:41` only registers the route when it is enabled.
- **`ProductSchema{Create,Update}Request`** have the same bare `'is_default' => 'boolean'`
  as finding 13, but predate this branch, so they were left alone.
- 8 pre-existing `npm run typecheck` errors on `dev` (`DropdownTriggerButtonProps`,
  unused vars in `dropdown-button.tsx`) — untouched, no `.ts`/`.tsx` files were changed.
