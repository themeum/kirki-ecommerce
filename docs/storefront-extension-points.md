# Storefront Extension Points

The hooks and script options that a theme or plugin can use to change the Kirki
eCommerce storefront without replacing its code. There are four, all added in
Kirki eCommerce 1.0.3:

- a PHP filter that sets how many products one shop page shows,
- two options on the `addToCart()` component,
- a script event that fires after each successful add to cart, and
- a script API that reads the cart and changes or removes an item.

Each one keeps today's behavior when a theme does not use it.

- [1. Quick start](#1-quick-start)
- [2. Shop page size](#2-shop-page-size)
- [3. Add-to-cart options](#3-add-to-cart-options)
- [4. The item-added event](#4-the-item-added-event)
- [5. Cart API](#5-cart-api)
- [6. Where this differs from WooCommerce](#6-where-this-differs-from-woocommerce)

---

## 1. Quick start

Show 20 products per shop page. Put this in the theme's `functions.php`:

```php
add_filter('kirki_ecommerce_shop_per_page', fn() => 20);
```

Do something after a product goes into the cart. Put this in a theme script
that loads on storefront pages:

```js
window.addEventListener('kecom:cart:item-added', (event) => {
  const { variantId, quantity, imageUrl, sourceEl, cart } = event.detail;
  // For example, animate sourceEl to the header cart icon.
});
```

To turn off the built-in success toast for one button, and to tell the event
which element the add came from, pass the two options in the view markup:

```php
<div x-data="addToCart({ variantId: 12, sourceEl: $refs.image, showSuccessToast: false })">
    <img x-ref="image" src="…" alt="…">
    <button type="button" x-on:click="add()">Add to cart</button>
</div>
```

Read the cart, or change it, from any storefront page:

```js
const cart = await window.kecomCart.get();
await window.kecomCart.updateItem(cart.items[0].id, 2);
```

---

## 2. Shop page size

**Filter:** `kirki_ecommerce_shop_per_page` (PHP constant
`DevHookNames::SHOP_PER_PAGE`).

| Argument | Type | Holds |
|---|---|---|
| `$per_page` | `int` | The page size. Default `12`. |
| `$filters` | `array<string, mixed>` | The sanitized shop request filters, for example `search`, `sort_by` and `current_page`. |

The filter applies to both:

- the shop page (`/shop`, or the store's shop page slug), and
- `GET /wp-json/kirki/ecommerce/v1/shop/products`, which the shop page uses to
  load the next page without a reload.

Both get the same value for the same request filters, so the first page and the
pages after it always have the same size.

The returned value is limited:

| Returned value | Page size used |
|---|---|
| An integer from 1 to 100, or a numeric string such as `'20'` | That number (a decimal is cut to an integer) |
| Above 100 | 100 |
| 0, a negative number, `null`, or text that is not a number | 12 |

The limit of 100 protects the shop from slow requests: every product on the page
is loaded with its prices, images and stock.

The page size cannot come from the URL. A shopper cannot ask for more products
by adding a parameter to the shop URL.

A callback can change the size for some filters only:

```php
add_filter('kirki_ecommerce_shop_per_page', function ($per_page, $filters) {
    return empty($filters['search']) ? $per_page : 24;
}, 10, 2);
```

---

## 3. Add-to-cart options

The storefront's `addToCart()` Alpine component (used on the shop product cards
and the product page) takes two optional keys, in addition to the existing
`variantId`, `qty`, `cartUrl`, `buttonText`, `imageUrl`, `containerClass` and
`watchVariantId`:

| Key | Type | Default | Effect |
|---|---|---|---|
| `sourceEl` | `HTMLElement` or `null` | `null` | Not used by the component itself. It goes into the `kecom:cart:item-added` event (section 4), so a listener knows where the add started. |
| `showSuccessToast` | `boolean` | `true` | `false` turns off the "added to cart" toast for this button. **A failed add still shows its error toast.** |

In plugin and theme views, write Alpine attributes in the long form
(`x-on:click`, `x-bind:class`). `wp_kses()` removes the `@click` and `:class`
forms when a view is printed in a block theme header or footer.

---

## 4. The item-added event

**Event:** `kecom:cart:item-added` (script constant `EVENTS.CART_ITEM_ADDED` in
the storefront bundle), a `CustomEvent` dispatched on **`window`**.

It fires **once for each successful add** by `addToCart()`, after the server
accepts the item. It does **not** fire:

- when the add fails (for example, not enough stock),
- when a quantity changes or an item is removed on the cart page or in the mini
  cart.

`event.detail` holds:

| Field | Type | Holds |
|---|---|---|
| `variantId` | `number` | The variant that was added |
| `quantity` | `number` | The quantity that was added |
| `imageUrl` | `string` | The component's `imageUrl`, else the item's image from the cart response, else `''` |
| `sourceEl` | `HTMLElement` or `null` | The component's `sourceEl` option |
| `cart` | object | The whole cart from the server response, the same data as `kecom:cart-updated` |

**Order:** after a successful add, the component first dispatches the older
`kecom:cart-updated` event on **`document`** (as before 1.0.3), and then
`kecom:cart:item-added` on `window`. So the mini-cart count has updated when the
item-added listeners run.

`kecom:cart-updated` does not change. It still fires for adds, quantity changes
and removals. Use it to follow the cart's contents. Use
`kecom:cart:item-added` to react to an add.

Code inside the storefront bundle can use the typed helper:

```ts
import { EVENTS, listen } from '../events';

const off = listen(EVENTS.CART_ITEM_ADDED, ({ variantId, sourceEl }) => {
  // …
});
```

---

## 5. Cart API

**Global:** `window.kecomCart`. The storefront bundle sets it on every page
where it loads, before `DOMContentLoaded`. With Kirki eCommerce older than
1.0.3 it is `undefined`, so check for it first:

```js
if (window.kecomCart) {
  // Use the cart API.
}
```

Every method returns a `Promise`:

| Method | Resolves with |
|---|---|
| `get()` | The cart, the same data as `GET /kirki/ecommerce/v1/cart` gives in `data`. An empty array when there is no cart. |
| `updateItem(itemId, quantity)` | The updated cart, after the item has the new quantity. |
| `removeItem(itemId)` | The updated cart, or an empty array when the cart is now empty. |

`itemId` is the cart item `id` (`cart.items[n].id`), not the variant ID.

**Identity.** The methods send the same cart token header and REST nonce as the
cart page, so they act on the visitor's own cart.

**Rules and errors.** `updateItem()` and `removeItem()` use the same REST
endpoints as the cart page, so the same stock, per-order limit and availability
rules apply. When the server rejects a request, the `Promise` rejects with an
`Error` whose `message` is the server's message. The API never shows a toast.
The caller decides how to show the error.

```js
try {
  await window.kecomCart.updateItem(41, 9);
} catch (error) {
  showMessage(error.message); // For example "Not enough stock for this variant".
}
```

**Events.** After `updateItem()` or `removeItem()` succeeds, the API dispatches
`kecom:cart-updated` on `document` with the updated cart as `detail`, the same
event the cart page sends. So the mini cart count follows a change. `get()`
sends no event. No method sends `kecom:cart:item-added`, which is only for
adds from `addToCart()`.

There is no `addItem()`. Use the `addToCart()` component, so the item-added
event and its options work.

---

## 6. Where this differs from WooCommerce

- **Page size filter.** WooCommerce has `loop_shop_per_page` for its product
  archives. `kirki_ecommerce_shop_per_page` works the same way, but its value is
  limited to 100, and its second argument gives the shop filters. There is no
  admin setting for the page size yet. WooCommerce takes its default from the
  Customizer's rows and columns.
- **Add-to-cart event.** WooCommerce's classic AJAX add to cart triggers the
  jQuery event `added_to_cart` on `document.body`, with cart fragments, a cart
  hash and the jQuery button. Here, the event is a plain DOM `CustomEvent` on
  `window`, with no jQuery. It carries the whole cart and an element that the
  theme chooses (`sourceEl`), which does not have to be the button. It fires
  only from the `addToCart()` component, not after a non-AJAX form post.
- **No server-rendered notice to remove.** WooCommerce shows a "has been added
  to your cart" notice after a page reload, and a theme removes it with a PHP
  filter. Here, an add never reloads the page. The only success message is the
  toast, and a theme turns it off for each button with `showSuccessToast: false`.
  There is no global switch for all buttons.
- **No "View cart" link after the button.** WooCommerce adds an `added` class
  and a "View cart" link next to the button. Here, the component only sets its
  own `success` value to `true`, which a view can bind to. The "View Cart" link
  is in the success toast, so a theme that sets `showSuccessToast: false` must
  give its own way to reach the cart (for example, the mini cart).
- **Cart API.** WooCommerce Blocks has the Store API (`/wc/store/v1/cart`) and
  the `wc/store/cart` data store for `@wordpress/data`. Here, `window.kecomCart`
  is a small Promise API with three methods: read the cart, change a quantity
  and remove an item. It has no add, coupon, shipping or checkout methods, and
  no data store to subscribe to. Listen to `kecom:cart-updated` instead.
