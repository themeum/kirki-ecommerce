# Coupons

How coupons are applied to carts and orders in Kirki eCommerce. A coupon has a
code. It is redeemed in one of two ways: the shopper types the code, or the
store applies the coupon automatically. A coupon can also allow or block
stacking with other coupons.

This page covers the coupon method, automatic coupons on the storefront cart,
and the combinability rule. Section 5 lists the paths that use the same
validation. Section 6 lists known limits.

- [1. Quick start](#1-quick-start)
- [2. Coupon method](#2-coupon-method)
- [3. Automatic coupons](#3-automatic-coupons)
- [4. Combinability](#4-combinability)
- [5. Where each rule runs](#5-where-each-rule-runs)
- [6. Where this differs from WooCommerce](#6-where-this-differs-from-woocommerce)

---

## 1. Quick start

To make a coupon that applies by itself:

1. Create a coupon with `method` set to `automatic`. You do not need to send a
   code: the store generates one.
2. Set its conditions: dates, minimum spend, region, customer eligibility and
   usage limits.
3. Save it.

From then on, every storefront cart that meets the conditions gets the coupon.
The shopper does not type anything. The shopper cannot remove it.

To stop a coupon from stacking with other coupons, set `is_combinable` to
`false` in the REST API. See section 4.

---

## 2. Coupon method

The column `coupons.method` has two values.

| Value | Meaning |
|---|---|
| `code` | The shopper types the code. |
| `automatic` | The store applies the coupon when the cart is valid for it. |

An automatic coupon still has a code. The code is used to identify the coupon
in the cart, in the order and in the order edit request.

The store generates the code of an automatic coupon when you save it without
one:

- On create, a coupon without a code gets a generated code. A code that you send
  is kept.
- On update, a request without a code keeps the code that the coupon has. If the
  coupon has no code yet (for example, it changes to `automatic`), the store
  generates one.
- A `code` coupon still needs a code. The request fails with HTTP 422 without
  one.

An automatic coupon with no code is never attached. The rules above mean that a
coupon saved through the API always has a code.

---

## 3. Automatic coupons

Available from version 1.0.1.

### 3.1 Storefront cart

When the store calculates a storefront cart, it does these steps:

1. It finds the active coupons with `method = automatic` and a code.
2. It checks each coupon with the same validation as a typed code. The checks
   are: dates, spend condition, region, customer eligibility, usage limits and
   combinability.
3. It attaches each valid coupon to the cart.
4. It skips each invalid coupon. The shopper sees no error.

The store checks the coupons again on every cart calculation:

- A coupon that becomes invalid is detached. The shopper sees no error.
- A coupon that becomes valid again is attached again.

### 3.2 Checkout

The order takes the coupons that are on the cart. When the store creates the
order, it also attaches the automatic coupons that are valid for the cart, even
if the shopper did not load the cart after the coupon became valid. The store
validates all coupons again at that time. A coupon that is invalid at that time
is left out of the order. The shopper sees no error.

### 3.3 Removing a coupon

A shopper cannot remove an automatic coupon. The request
`DELETE cart/coupon` returns HTTP 422 with this message:

```
This coupon is applied automatically and cannot be removed.
```

A shopper can still remove a `code` coupon.

### 3.4 The "can apply coupon code" setting

The checkout setting "can apply coupon code" controls typed codes only.

- When it is on, shoppers can type codes.
- When it is off, the store removes `code` coupons from the cart. Automatic
  coupons stay on the cart and still apply at checkout.

### 3.5 Admin orders

| Path | Automatic coupons |
|---|---|
| Manual (admin-created) order | Not attached by the store. |
| Order preview | Not attached by the store. |
| Order edit | Not attached by the store. |

In a manual order, the admin can select an automatic coupon by hand. The store
validates it like any other coupon.

In order edit, the admin removes an automatic coupon from an order by leaving
its code out of `coupon_codes` in the update request.

---

## 4. Combinability

### 4.1 The column

`coupons.is_combinable` is a boolean. The column cannot be null and its database
default is `true`. The migration sets `true` on all existing coupons, so they
keep stacking as before.

The column is allowed on `code` coupons and on `automatic` coupons.

### 4.2 REST API

The field `is_combinable` is required in these requests. A request without it
fails validation with HTTP 422.

- `POST` coupons (create)
- `PUT` coupons (update)

The list response and the show response return the field.

### 4.3 The rule

When another coupon is already applied, the store rejects a new coupon if one
of these is true:

- The new coupon has `is_combinable = false`.
- Any applied coupon has `is_combinable = false`.

The coupon that is already applied stays. The store does not remove it.

The error message is:

```
This coupon cannot be combined with the coupons already applied.
```

A single non-combinable coupon on its own applies normally.

These older rules still apply:

- The same coupon cannot be applied twice.
- Only one free-shipping coupon can be applied.

### 4.4 Order of checks

The store checks automatic coupons after the coupons that are already on the
cart. A coupon that the shopper already applied wins over a new automatic
coupon.

### 4.5 The old column

The column `coupons.combinations` is not used. It is unchanged.

---

## 5. Where each rule runs

The combinability rule is the same on every path.

| Path | What happens to a conflicting coupon |
|---|---|
| Cart apply (typed code) | The store rejects the code with the error message. |
| Automatic attach | The store skips the coupon. No error. |
| Checkout | The store leaves the coupon out of the order. No error. |
| Manual order | The store validates the selected coupon like any other coupon. |
| Order edit | Coupons stored on the order stay. A new conflicting coupon is reported as invalid and left off. |

The cart response lists each applied coupon in `pricing.coupons`. Each entry has
a `method` field (`code` or `automatic`), so a client can tell an automatic
coupon from a typed one.

---

## 6. Where this differs from WooCommerce

- **Automatic coupons.** WooCommerce core has no automatic coupons. They need
  an extension. Kirki eCommerce has them built in.
- **Stacking.** WooCommerce uses "individual use only". When a shopper applies
  such a coupon, WooCommerce removes the other coupons. In Kirki eCommerce,
  `is_combinable = false` rejects the new coupon and keeps the applied coupon.
  The store never removes an applied coupon because of this flag.
- **No priority.** There is no priority order and no "best coupon wins" rule
  between automatic coupons. The store attaches all valid coupons, in database
  order, as far as combinability allows.
- **No opt-out.** A shopper cannot opt out of an automatic coupon.
- **Required field.** Coupon create and update requests must send
  `is_combinable`. A client that does not send it gets HTTP 422.
