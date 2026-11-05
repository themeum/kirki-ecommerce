# Error Status Codes

How a failed API request gets its HTTP status, and how to throw a failure so a
shopper or admin sees "Not enough stock" and not "Internal Server Error".

The rule is one question: **can the person who sent the request fix it?** If
yes, the status is a 4xx and the message tells them what to do. If no, it is a
5xx and the message goes to the log. Section 2 lists the statuses, section 3
shows how to throw each one, and section 6 describes the test that stops a
failure from slipping back to 500 by accident.

- [1. Quick start](#1-quick-start)
- [2. Which status for which failure](#2-which-status-for-which-failure)
- [3. How to throw each status](#3-how-to-throw-each-status)
- [4. What the response looks like](#4-what-the-response-looks-like)
- [5. How the storefront and admin show it](#5-how-the-storefront-and-admin-show-it)
- [6. The guard test](#6-the-guard-test)
- [7. Where this differs from Laravel](#7-where-this-differs-from-laravel)

---

## 1. Quick start

Throw with `throw_if()` (or `throw_anyway()`), and always say which exception
and which status:

```php
// The shopper can fix it: 422.
throw_if(
    !$this->inventory_service->has_stock($variant_id, $quantity),
    __('Not enough stock for this variant', 'kirki-ecommerce'),
    ValidationException::class,
    Response::UNPROCESSABLE_ENTITY
);
```

A call with only a message, `throw_if($cond, $message)`, throws a plain
`Exception` with code 0. The API answers every such failure with **500**. That
was DEF-020: two checkouts raced for the last unit, the loser threw a plain
`Exception`, and the shopper saw a server error for an out-of-stock item.

---

## 2. Which status for which failure

| The failure is | Status | Example |
|---|---|---|
| Wrong or missing input, or a business rule the user can satisfy | 422 | Not enough stock, max per order exceeded, empty cart, invalid shipping method |
| The record does not exist | 404 | Cart item, refund, order, variant, payment gateway |
| The user may not do this | 403 | A cart item that belongs to another cart |
| It would repeat or duplicate something that exists | 409 | A coupon that is already active, a customer that already exists for the user, a payment method that is already installed |
| The server or a service it depends on failed | 500 | Payment gateway error, exchange-rate API error, order totals that do not match their tax lines, a database write that returned nothing |

A "could not be updated" or "could not be deleted" failure that is thrown with
`Exception::class, Response::BAD_REQUEST` answers 400. Those predate this page
and keep their status.

---

## 3. How to throw each status

| Status | Throw |
|---|---|
| 422 | `ValidationException::class, Response::UNPROCESSABLE_ENTITY` |
| 404 | `NotFoundException::class, Response::NOT_FOUND` |
| 403 | `AuthorizationException::class, Response::FORBIDDEN` |
| 409 | `HttpException::class, Response::CONFLICT` |

Two details cause most mistakes:

- **A class alone is not enough for most classes.** The API handler recognises
  `ValidationException`, `HttpException` and `ModelNotFoundException` by type.
  `NotFoundException` and `AuthorizationException` are plain `Exception`
  subclasses, so their status comes from the code you pass. `NotFoundException::class`
  without `Response::NOT_FOUND` answers 500.
- **`HttpException` takes its status from the code.** Without a code it
  defaults to 500.

Keep the message for the person who reads it. It is shown to the shopper as it
is, so write it as a sentence and wrap it in `__()`.

---

## 4. What the response looks like

| Thrown | Body |
|---|---|
| `ValidationException` with a message | `{"message": "...", "errors": null}`, status 422 |
| `ValidationException::with_errors([...])` | `{"message": "...", "errors": {"field": ["..."]}}`, status 422 |
| `HttpException` | `{"message": "...", "code": "http_error"}`, with the exception's status |
| Any other `Exception` | `{"message": "..."}`, with the exception's code as status when it is 100-599, otherwise 500 |

Use `ValidationException::with_errors()` when the failure belongs to a form
field, so the frontend can show it under that field. The stock checks throw a
message only: they do not belong to one field, so the frontend shows a toast.

---

## 5. How the storefront and admin show it

Neither frontend reads the status code. Both read `message`, and both show it in
a toast when no field error took it.

- **Storefront.** `resources/site/ts/api/client.ts` copies `message` (and
  `errors`, when set) onto the error. `add-to-cart`, `cart` and `checkout` then
  show `message` in a toast. In checkout, errors keyed by a field the form has
  (`shipping_*`, `billing_*`, `customer_email`, `consents`, `shipping_method`)
  show under that field, and any other error shows as a toast.
- **Admin.** `resources/app/libs/api.ts` turns a null `errors` into `{}` and
  keeps `message`. `toastMutationError()` shows the message in a toast.

So changing a failure from 500 to 422 changes what monitoring and API clients
see. It does not change what the shopper sees, because the message was already
shown. A 5xx is logged as a server error, so a 4xx for a user-correctable
failure also keeps those logs clean.

The tests `resources/site/ts/components/error-status.test.ts` and
`resources/app/services/error-toast.test.ts` check that both statuses show the
message.

---

## 6. The guard test

`tests/Unit/ThrowStatusGuardTest.php` reads the PHP files under `app/Actions`,
`app/Services`, `app/Concerns` and `app/Http` and fails when a `throw_if()`,
`throw_unless()` or `throw_anyway()` call leaves the status to the 500 fallback:

- it names no exception class, or
- it names a class the handler does not recognise by type, and passes no status code.

The failure message gives the file and line. Fix the call, or, if the failure
really is a server fault, add the file to `SERVER_FAULTS` in the test with the
number of calls and a one-line reason. A second test fails when an entry is out
of date, so the list cannot fill up with stale lines.

The guard looks at the call, not at the cause. It cannot tell that a message
you wrote for a server fault would also have been fixable by the user. A
reviewer still has to decide that.

---

## 7. Where this differs from Laravel

The helper names match Laravel's, but the behaviour does not:

- **`throw_if()` takes a message and a class.** Laravel's takes an exception
  instance or class. Here the third and fourth arguments are the class and the
  constructor arguments, so a status code is just a constructor argument. It is
  easy to leave out, and nothing warns you except the guard test.
- **No `abort()` helper.** Laravel's `abort(404)` always gives a status. Here
  there is no short form, so you pick the class and the code yourself.
- **Fewer exceptions are mapped.** Laravel maps `AuthorizationException`,
  `AuthenticationException` and its `NotFoundHttpException` family by type.
  This framework maps `ValidationException`, `HttpException` and
  `ModelNotFoundException` only. Everything else depends on the exception code.
- **A message-only `ValidationException` has `errors: null`.** Laravel's
  `ValidationException::withMessages()` always gives an `errors` map, so the
  client can rely on its shape. Here the stock and cart-limit failures have no
  field, so there is no map.
- **`ThrottleRequestsException` is the only 429.** The verification-email
  cool-down is not a 429: `AccountController` catches every exception from the
  service and answers 422 with the message.
- **The guard is a unit test, not a lint rule.** It does not run while you edit,
  and its list of accepted server faults is kept by hand.
