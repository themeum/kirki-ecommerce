# Wishlist

A logged-in customer can save products to a wishlist and come back to them
later. The heart button on every product card and on the product page adds and
removes products, and **My account → Wishlist** lists what the customer saved.

A wishlist entry belongs to a **product**. It can also remember one **variant**
the customer chose, but the variant is optional. This means an entry stays on
the wishlist when a merchant deletes that variant.

- [1. Quick start](#1-quick-start)
- [2. What an entry stores](#2-what-an-entry-stores)
- [3. Adding and removing](#3-adding-and-removing)
- [4. Which variant the wishlist shows](#4-which-variant-the-wishlist-shows)
- [5. The heart button](#5-the-heart-button)
- [6. When a variant, product or customer is deleted](#6-when-a-variant-product-or-customer-is-deleted)
- [7. Where this differs from WooCommerce](#7-where-this-differs-from-woocommerce)

---

## 1. Quick start

A customer must be logged in. A visitor who clicks the heart goes to the login
page.

1. On the shop page, click the heart on a product card. The product is saved
   with no variant.
2. On a product page, pick a variant and click **Add to Wishlist**. The product
   is saved with that variant.
3. Open **My account → Wishlist** to see the saved products. Click the heart on
   a card there to remove it.
4. **Clear Wishlist** removes every entry.

---

## 2. What an entry stores

Table `kirki_ecommerce_wishlist`:

| Column       | Meaning                                                              |
| ------------ | -------------------------------------------------------------------- |
| `user_id`    | The customer. The entry is deleted with the user.                    |
| `product_id` | The saved product. The entry is deleted with the product.            |
| `variant_id` | The variant the customer chose. `NULL` when they chose none, or when that variant was deleted. |

A customer has **at most one entry per product**. `WishlistService` enforces
this: it returns the existing entry when a product is saved again. The table
has a plain index on `(user_id, product_id)` for lookups and **no unique key**,
so the database does not stop a duplicate. Two requests that save the same
product at the same moment can create two entries.

The table has no unique key on purpose. A later change can store several
variants of one product as separate entries without a schema migration.

---

## 3. Adding and removing

All routes need a logged-in user and only touch that user's own entries.

| Action        | Route                              | Notes                                                    |
| ------------- | ---------------------------------- | -------------------------------------------------------- |
| List          | `GET /account/wishlist`            | One product card per entry.                              |
| Add           | `POST /account/wishlist`           | Body: `product_id` (required), `variant_id` (optional).  |
| Remove        | `DELETE /account/wishlist/{id}`    | `{id}` is the **product ID**.                            |
| Clear         | `DELETE /account/wishlist/empty`   | Removes every entry of the user.                         |

Rules for **add**:

- The product must exist and be published, or the answer is 404 (`Product not found.`).
- A given `variant_id` must belong to `product_id`, or the answer is 404 (`Variant not found.`).
- If the product is already saved, the single entry is kept and returned (201).
  A `variant_id` in the request replaces the entry's variant. A request with no
  `variant_id` leaves the entry as it is.

**Remove** answers 404 (`Wishlist item not found.`) when the product is not on
the user's wishlist, including when only another customer saved it.

The Bruno examples are in `docs/ecommerce/account/Wishlist/`.

---

## 4. Which variant the wishlist shows

Each wishlist card shows one variant, for its price, image and link. The plugin
picks it when the page loads, in this order:

1. the variant the customer chose, if the entry has one;
2. the product's variant marked **default** (`is_default`);
3. the product's first variant, when the merchant marked no default.

The card links to the product page with `?variant_id=` only in case 1. In cases
2 and 3 it links to the plain product page.

The plugin does not copy the default variant into the entry. If the merchant
marks another variant as default, entries with no variant show the new one on
the next page load.

---

## 5. The heart button

The heart is filled when the customer has an entry for the product, whatever
variant the entry holds.

- On the shop page the heart sends only `product_id`.
- On the product page the heart sends `product_id` and the selected variant.
- If the customer saved variant A and then selects variant B on the product
  page, the heart stays filled. Clicking it removes the product from the
  wishlist. It does not switch the saved variant.

---

## 6. When a variant, product or customer is deleted

| What is deleted | What happens to the entry                                             |
| --------------- | --------------------------------------------------------------------- |
| The saved variant | The entry stays. `variant_id` becomes `NULL`, and the card shows the default variant. |
| The product       | The entry is deleted.                                                |
| The customer      | The entry is deleted.                                                |

A product moved to the trash or set to draft is **not** deleted, so its entries
stay. The wishlist list does not hide them.

---

## 7. Where this differs from WooCommerce

WooCommerce has no wishlist in core. A wishlist comes from a plugin, and the
details differ by plugin. These are the gaps in this store's wishlist:

- **Logged-in customers only.** There is no guest wishlist kept in a cookie.
- **No sharing.** A customer cannot share a wishlist link or make it public.
- **One entry per product.** A customer cannot keep two variants of the same
  product as two entries. The newest chosen variant is kept. The service
  enforces this, not the database, so two parallel requests can create a
  duplicate. The schema is ready for several variants per product later.
- **One list per customer.** There are no named lists and no folders.
- **Stock and sale flags come from the shown variant.** A card does not look at
  every variant of the product, so a card can show "in stock" for the shown
  variant while another variant is sold out.
- **No notifications.** The store sends no email when a wishlisted product goes
  on sale or comes back in stock.
- **Trashed and draft products stay listed.** The list does not filter by
  product status.
