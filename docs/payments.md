# Payment Methods

The ways a shopper can pay at checkout. Each one is a **payment method** under
**Settings → Payments**. A method is either **online** (a gateway such as PayPal
takes the payment) or **offline** (a manual method such as Cash on Delivery or
Bank Transfer, where the payment happens outside the store).

The order of the list on the settings page is the order shoppers see at
checkout. Section 3 explains how that order is kept.

- [1. Quick start](#1-quick-start)
- [2. The payment methods list](#2-the-payment-methods-list)
- [3. Changing the order](#3-changing-the-order)
- [4. The order API](#4-the-order-api)
- [5. Methods added by other plugins](#5-methods-added-by-other-plugins)
- [6. Where this differs from WooCommerce](#6-where-this-differs-from-woocommerce)

---

## 1. Quick start

1. Go to **Settings → Payments**.
2. Click **Add**, then:
   - **Manual Payment** to create an offline method (name, icon, instructions), or
   - **Payment Gateways** to install an online gateway.
3. Move the pointer over a row and turn on its switch. Only enabled methods
   show at checkout.
4. To change the order, drag a row by its handle (section 3).

---

## 2. The payment methods list

Each method is one row: its icon and name at the left. When you move the
pointer over a row, or move keyboard focus into it:

- a **drag handle** replaces the icon, and
- three controls show at the right: **Delete**, **Edit** and the **enable/disable
  switch**.

On a touch screen, which cannot hover, the handle and the controls always show.

| Control | Offline method | PayPal |
|---|---|---|
| Delete | Asks for confirmation, then deletes the method. This cannot be undone. | Not shown. PayPal cannot be deleted. |
| Edit | Opens the manual payment dialog. | Opens the gateway settings dialog. |
| Switch | Enables or disables the method at checkout. | Same. |

The switch saves at once. There is no **Save** button on this page.

---

## 3. Changing the order

Drag a row by its handle and drop it at its new position. Only the handle starts
a drag; a click on the name or on a control does not.

With the keyboard: move focus to the handle with **Tab**, press **Space** to pick
up the row, use the **arrow keys** to move it, then press **Space** to drop it.
**Escape** cancels the move.

Each drop saves the new order at once:

- The list shows the new order immediately. No confirmation message shows.
- If the save fails, the list goes back to the previous order and an error
  message shows.
- A drop at the same position sends nothing.

### How the order is applied

The order is one list of method IDs, stored as `methods_order` in the `payment`
settings option. The store applies it everywhere it lists payment methods:

- the settings page (`GET /payment-methods`),
- the per-kind lists (`GET /online-payments`, `GET /offline-payments`), and
- checkout. Checkout shows only enabled methods, in this order, and selects the
  **first** one by default.

Methods that are not in the stored list go **last**, in the order they were
registered. This applies to a manual method you create after you saved an
order, a gateway you install later, and methods from other plugins (section 5).
An ID in the stored list that no longer matches a method (for example, a
deleted manual method) is ignored.

Saving other payment settings, or creating, editing, enabling or deleting a
method, does not reset the order.

---

## 4. The order API

```http
PUT /payment-methods/order
Content-Type: application/json

{ "ids": ["paypal", "3edc661d-227b-4ad8-ac22-4dc6b86a018d"] }
```

- Administrators only.
- `ids` is required and must be a list of strings.
- Each ID must be a registered payment method, and no ID can appear twice.
  Otherwise the request fails with `422` and the stored order does not change.
- You can send only some IDs. The methods you leave out go after them (section 3).
  The settings page always sends the full list.

The response is the full list of payment methods in the new order, with the same
fields as `GET /payment-methods`:

```json
{
  "data": [
    { "id": "paypal", "name": "PayPal", "is_enabled": true, "is_offline": false, "...": "..." },
    { "id": "3edc661d-…", "name": "Cash on Delivery", "is_enabled": true, "is_offline": true, "...": "..." }
  ],
  "message": "Payment methods reordered.",
  "success": true
}
```

`/payment-methods` itself is still list-only. Create, edit, enable and delete a
method through `/offline-payments` or `/online-payments`. Example requests are in
`docs/ecommerce/payment-methods/`.

---

## 5. Methods added by other plugins

A plugin adds a payment method through the `kirki_ecommerce_payment_providers`
filter. Such a method shows in the list and can be dragged like any other.
Until a merchant saves an order that includes it, it is listed after the
ordered methods.

If the plugin is deactivated, its method disappears from the list and from
checkout. Its ID stays in the stored order and is ignored. If the plugin comes
back before anyone saves a new order, the method returns to its old position.
A save in the meantime drops the ID, and the method then goes last.

---

## 6. Where this differs from WooCommerce

The page looks like WooCommerce's payment settings, but it does not match it
one-to-one:

- **Any number of manual methods.** WooCommerce ships three fixed offline
  methods (direct bank transfer, check, cash on delivery). Here you create your
  own manual methods, as many as you need, each with its own name, icon and
  instructions.
- **Online gateways cannot be removed from this page.** PayPal has no delete
  control. There is no uninstall endpoint for online gateways yet, so a gateway
  added by another plugin shows a delete control that does nothing; disable it
  with its switch instead.
- **One order for the whole store.** The same order applies to every shopper.
  There is no order per country, currency or device.
- **The enabled state shows only on hover.** The switch is hidden until you move
  the pointer over a row (or focus it), so the list does not show at a glance
  which methods are off.
- **No undo for a reorder.** Each drop saves at once. To undo, drag the row back.
