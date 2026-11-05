# Kirki eCommerce User Guide

Everything you need to set up and run your online store with Kirki eCommerce.

## Table of contents

- [1. Introduction](#1-introduction)
- [2. Before you start](#2-before-you-start)
- [3. Install and activate](#3-install-and-activate)
- [4. Set up your store](#4-set-up-your-store)
- [5. The Home page](#5-the-home-page)
- [6. Products](#6-products)
- [7. Organize your catalog](#7-organize-your-catalog)
- [8. Inventory](#8-inventory)
- [9. Orders](#9-orders)
- [10. Customers](#10-customers)
- [11. Coupons](#11-coupons)
- [12. Payments](#12-payments)
- [13. Shipping](#13-shipping)
- [14. Taxes](#14-taxes)
- [15. Currencies](#15-currencies)
- [16. Emails](#16-emails)
- [17. Checkout and legal consents](#17-checkout-and-legal-consents)
- [18. Other store settings](#18-other-store-settings)
- [19. Your storefront](#19-your-storefront)
- [20. Analytics](#20-analytics)
- [21. Move from WooCommerce](#21-move-from-woocommerce)
- [22. Help and support](#22-help-and-support)

---

## 1. Introduction

Kirki eCommerce is a free WordPress plugin for running an online store. It gives
you products, inventory, orders, checkout, payments, shipping, taxes, coupons,
emails and analytics in one place. You do not need any other plugin, and you
do not need a special theme.

Every feature is free. There is no premium version and no transaction fee.

**How to read this guide.** Follow sections 2 to 4 in order to get your store
running. After that, use the other sections when you need them. Each section
starts with a short explanation, then gives step-by-step instructions.

**Where to find things.** After you install the plugin, a new menu called
**eCommerce** appears in the left sidebar of your WordPress dashboard. In this
guide, a path such as **eCommerce → Settings → Payments** means: click
**eCommerce** in the sidebar, then **Settings**, then **Payments**.

---

## 2. Before you start

Make sure you have these things before you install the plugin:

| You need | Details |
|---|---|
| WordPress | Version 6.8 or newer. |
| PHP | Version 7.4 or newer. Your hosting company can tell you which version you have. |
| An administrator account | You must log in to WordPress as an administrator. |
| An SSL certificate (HTTPS) | Strongly recommended. Payment providers expect your checkout to use `https://`. Most hosting companies give you one for free. |
| A payment account (optional) | For example, a PayPal business account if you want to take card or PayPal payments. You can start with Cash on Delivery or Bank Transfer and add online payments later. |
| An exchange-rate API key (optional) | Only if you want to sell in more than one currency with automatic rate updates (see [section 15](#15-currencies)). |

> **Tip:** If you are moving from WooCommerce, keep WooCommerce installed
> (version 7.0 or newer). The setup wizard can copy your WooCommerce store for you.
> See [section 21](#21-move-from-woocommerce).

---

## 3. Install and activate

### Install from the WordPress dashboard

1. In your WordPress dashboard, go to **Plugins → Add New Plugin**.
2. In the search box, type **Kirki eCommerce**.
3. Find the plugin and click **Install Now**.
4. When the installation is done, click **Activate**.

### Install from a ZIP file

1. Download the plugin ZIP file.
2. In your WordPress dashboard, go to **Plugins → Add New Plugin**.
3. Click **Upload Plugin** at the top of the page.
4. Click **Choose File**, select the ZIP file, then click **Install Now**.
5. Click **Activate Plugin**.

After you activate the plugin, WordPress opens the setup wizard. Continue with
[section 4](#4-set-up-your-store).

---

## 4. Set up your store

The setup wizard asks a few questions about your business. Then it builds your
store for you. It takes about two minutes.

> **Note:** You must finish the wizard before you can use the other
> eCommerce pages. If you close it, it opens again the next time you click
> **eCommerce**.

### Step-by-step

1. **Store Basics.** Type your **store name** and choose your **industry**.
   Click **Continue**.
2. **Business Info.** Choose your **country**. The wizard tries to guess it for
   you. You can also type your store address. The address is optional.
   Click **Continue**.
3. **Essentials.** Choose your store **currency**. Then answer
   **Collect sales tax?**
   - Choose **No, not yet** if you do not collect tax. Then click **Create Store**.
   - Choose **Yes** to see one more step. Click **Continue**.
4. **Store Tax** (only if you collect tax). Choose how you enter product
   prices: **Including tax** or **Excluding Tax**. You can also type your
   **Tax ID** (for example, your VAT number). Click **Create Store**.
5. Wait while the wizard sets up your store. You see a check mark next to each
   item when it is ready.

### What the wizard does for you

- Saves your store name, address, currency and tax choices.
- Creates the **Shop**, **Cart**, **Checkout** and **Account** pages.
- Adds ready-made settings for your industry and country: product attributes
  (for example, sizes and colors), shipping zones, tax regions and legal texts.
- Adds two offline payment methods, **Cash on Delivery** and **Direct bank
  transfer**. They are turned off. You turn one on in [section 12](#12-payments).

> **Important:** The ready-made tax rates and shipping prices are only a
> starting point. They are not tax advice. Check them before you start selling.

### When the wizard is done

You see three choices:

| Choice | What it does |
|---|---|
| **Add your first product** | Opens the product editor. |
| **Go to Dashboard** | Opens the eCommerce Home page. |
| **Click here to load sample data!** | Adds five sample products for your industry and an inactive coupon called `WELCOME50`. Use this to try the store before you add your own products. |

> **Note:** You can load sample data only once from this screen. If you skip
> it, you can still load it from the Home page checklist while your store has
> no products.

---

## 5. The Home page

Go to **eCommerce → Home**.

### The setup checklist

While your store is new, the Home page shows a checklist. It tells you what to
do before you start selling:

1. **List your products.** Add your first product, or load sample data.
2. **Set up payments.** Turn on at least one payment method.
3. **Collect sales tax.** Check your tax rates. This step shows only when tax
   is turned on.
4. **Add shipping method.** Set up how you deliver orders.

Click a step to open it, then click its button. The button takes you to the
correct page. When you come back to Home, finished steps get a green check mark.

### The store overview

When you finish every checklist step, the Home page shows your store overview
instead. It shows your key numbers, your recent orders and your top-selling
products.

At the top of the Home page you also find:

- **View Live Site** – opens your store in a new browser tab.
- **Add Product** – opens the product editor.

---

## 6. Products

Go to **eCommerce → Products**. This page lists all your products. Use the
search box and the **Filter** button to find products by status, category,
brand, collection or stock.

### Create a simple product

1. Go to **eCommerce → Products** and click **Add Product**.
2. Type a **Title** (for example, *Yellow T-Shirt*).
3. Type a **Description**. To add a short summary as well, click **Add** next
   to **Short description**.
4. Under **Media**, add product images from your WordPress media library.
   Products accept images only.
5. In the **Price** card, type the **Price**. You can also type a **Sale price**
   (see [Pricing](#pricing)).
6. In the **Inventory** card, set your stock (see [Inventory settings on a
   product](#inventory-settings-on-a-product)).
7. In the **Shipping** card, type the product **Weight**. Shipping by weight
   uses this value.
8. On the right side, choose **Categories**, **Tags**, a **Brand** and
   **Collections** if you want.
9. Click **Create**. Your product is saved.

### Publish, draft or schedule a product

Use the **Status** card on the right side of the product editor:

- **Publish** – the product shows in your shop.
- **Draft** – the product is saved but hidden from customers.
- **Scheduled** – pick a date and time. The product publishes automatically at
  that time.

Click **Preview** to see the product page before you publish it.

### Products with options (variations)

Use variations when a product comes in different options, such as sizes or
colors. Each combination of options becomes a **variant**. Each variant can
have its own price, SKU, stock and image.

1. Open the product, or create a new one.
2. In the **Variations** card, click **Add**.
3. Choose an attribute from the list (for example, **Color** or **Size**), or
   click **Add new** to make a new one.
4. Choose or type the values (for example, *Small*, *Medium*, *Large*). For a
   color, you can pick the color swatch.
5. Click **Apply**. The plugin creates a variant for each combination.
6. Repeat steps 2 to 5 to add more attributes.
7. In the **Variants** table, set the price for each variant. To give a variant
   its own image, click its image box and select an image.
8. Click **Save**.

> **Tip:** To change many variants at the same time, select them in the
> **Variants** table and click **Bulk Edit**. See [Bulk edit](#bulk-edit).

To remove an attribute or a value, click **Delete** next to it. The plugin asks
you to confirm, because this also removes the matching variants.

### Pricing

The **Price** card has these fields:

| Field | What it does |
|---|---|
| **Price** | The normal price. |
| **Sale price** | A lower price. Customers see the normal price crossed out and the discount in percent. |
| **Unit price** | Shows a price per unit, for example "per 100 g". Click **Unit price**, type the **Total unit in product** (for example, 500 g) and the **Base unit** (for example, 100 g), then click **Okay**. |
| **Cost & profit** | Type the **Cost per item**. The plugin shows your **Profit** and **Margin**. Customers do not see this. |
| **Charge tax on this product** | Turn off to make the product tax free. You can also pick a tax profile with **Add Tax Profile** (see [section 14](#14-taxes)). |

### Inventory settings on a product

The **Inventory** card has these fields:

| Field | What it does |
|---|---|
| **Track quantity** | Turn on to let the plugin count your stock. Stock goes down when customers order. |
| **Available** | How many units you can sell now. |
| **Committed** | Units that are in orders but not shipped yet. You cannot type here. |
| **Low stock threshold** | When stock falls to this number, you get a low-stock email. |
| **Sell when out of stock** | Turn on to accept orders when stock is 0 (backorders). |
| **SKU** | Your stock code. Click **Generate** to make one for you. |
| **Limit orders to number of item** | Sets the most units a customer can buy in one order. |

If you turn off **Track quantity**, you choose **In Stock** or **Out of Stock**
by hand.

### Extra product details

- **Ribbon** – a small label on the product image, such as *Fresh Arrival*.
  Type the text and choose a color.
- **Additional Info** – extra sections on the product page, such as *Care
  Instructions* or *Return Policy*. Click **Add an Info Section**, type a title
  and a description.
- **Search Engines** and **Social Share** – the title and description that
  search engines and social networks show for this product. If you leave them
  empty, the plugin uses the product title and short description. See
  [Product SEO](#product-seo).

### Duplicate, trash or delete a product

1. Open the product.
2. Click the **More options** button (three dots) at the top right.
3. Choose one of these:
   - **Duplicate** – makes a copy of the product.
   - **Move to trash** – removes the product from your shop. You can restore it
     later.
   - **Delete permanently** – erases the product and its variants. You cannot
     undo this.

### Product SEO

Your product pages tell search engines and social networks about your products
automatically. This includes the product name, price, image and stock.

1. Open a product.
2. Find the card with the **Search Engines** and **Social Share** tabs.
3. On **Search Engines**, type the **Title** and **Meta description** for search
   results. A preview shows how the result can look.
4. On **Social Share**, type the title and description for shared links on
   social networks.
5. Click **Save**.

To control which extra product information goes to search engines, use
**schema profiles**. See [Essentials](#essentials).

### Bulk edit

Bulk edit opens a table where you change many variants at the same time, like a
spreadsheet.

1. Go to **eCommerce → Inventory**, or open a product's **Variants** table.
2. Select the variants you want to change.
3. Click **Bulk Edit**.
4. Change the values in the table. You can change price, sale price, cost, SKU,
   weight, stock, low-stock threshold, **Sell when out of stock**, purchase
   limits, visibility, tax and shipping profile.
5. Click **Columns** to show or hide columns.
6. Click **Save**.

> **Note:** If you leave the page without saving, the plugin asks you to
> confirm. Unsaved changes are lost.

---

## 7. Organize your catalog

Use categories, tags, brands and collections to help customers find products.

| Type | Use it for | Example |
|---|---|---|
| **Categories** | The main groups of your shop. Categories can have sub-categories. | *Clothing → T-Shirts* |
| **Tags** | Flexible labels for search and filters. | *cotton*, *summer* |
| **Brands** | The maker of the product. | *Nike* |
| **Collections** | Hand-picked groups, such as a sale or a new season. A collection has a banner and its own SEO. | *Winter Sale* |

### Create a category, tag or brand

1. Go to **eCommerce → Categories** (or **Tags**, or **Brands**).
2. Click **Create Category** (or **Create Tag**, or **Add brand**).
3. Type a **Name**. The **Slug** (the part of the web address) fills in
   automatically.
4. For a category, choose a **Parent** if it is a sub-category.
5. Add a **Description** and an image (**Thumb**) if you want.
6. Click **Add**.

> **Tip:** You can also create a category, tag or brand directly from the
> product editor. Type a new name in the field and choose to add it.

### Create a collection

1. Go to **eCommerce → Collections** and click **Create Collection**.
2. Type a **Title** and a **Description**.
3. Add a **Banner** image.
4. Click **Select Products** and choose the products for this collection.
5. Fill in the **SEO Settings** if you want.
6. Click **Create**.

Deleting a collection does not delete its products.

---

## 8. Inventory

Go to **eCommerce → Inventory**. This page shows the stock of every variant in
your store in one list.

| Column | Meaning |
|---|---|
| **Available** | Units you can sell now. |
| **Committed** | Units in orders that are not shipped yet. |

### Change stock for one variant

1. Go to **eCommerce → Inventory**.
2. Click the variant.
3. Change its image, price, stock or shipping. To hide the variant from
   customers, turn off **Visibility**.
4. Click **Save**.

### Change stock for many variants

Select the variants and click **Bulk Edit**. See [Bulk edit](#bulk-edit).

### How stock works

- When a customer places an order, the units move from **Available** to
  **Committed**. This reserves them, so two customers cannot buy the same last
  item.
- Customers cannot buy more than your available stock, unless the variant
  allows **Sell when out of stock**.
- When stock falls to the low-stock threshold, or to zero, you get an email.

### Set the default low-stock threshold

1. Go to **eCommerce → Settings → Products**.
2. Under **Units and Stock Defaults**, type the **Low stock threshold**.
3. Click **Save**.

A variant uses this number unless you set its own threshold.

---

## 9. Orders

Go to **eCommerce → Orders**. This page lists all orders. Use the search box
and the filters (**Status**, **Payment Status**, **Delivery Method**) to find
orders.

### Payment status and fulfillment status

Every order has two separate statuses. This helps you see what needs your
attention.

| Payment status | Meaning |
|---|---|
| **Unpaid** | The customer has not paid yet (for example, Cash on Delivery). |
| **Paid** | The payment is complete. |
| **Failed** | The payment did not go through. |

| Fulfillment status | Meaning |
|---|---|
| **Unfulfilled** | New order. Nothing done yet. |
| **Processing** | You are preparing the order. |
| **On hold** | You paused the order. |
| **Shipped** | The order is on its way. |
| **Delivered** | The customer has the order. |
| **Cancelled** | The order is cancelled. |

### Process an order step by step

1. Go to **eCommerce → Orders** and click the order.
2. Check the items, the customer details and the payment summary.
3. In the **Take an Action** card, choose the next step and click **Update**:
   - **Mark as processing** – you start to prepare the order.
   - **Mark as shipped** – you send the order.
   - **Mark as delivered** – the customer has the order.
4. The customer gets an email for each step automatically.

Other actions in the **Take an Action** card:

| Action | What it does |
|---|---|
| **Mark as paid** | Use this when you receive a payment outside the store, for example cash or bank transfer. Choose the payment method, then click **Mark as paid**. |
| **On hold** / **Resume fulfillment** | Pause an order, then continue it later. |
| **Cancel fulfillment** | Stop fulfilling the order. |
| **Cancel order** | Cancel the whole order. |
| **Add tracking** | Add a tracking number (see below). |
| **Resend order email** | Send the order confirmation email to the customer again. |
| **Archive order** | Move a finished order out of your main list. |

The list shows only the actions that are possible for the current status.

### Add a tracking number

You can add tracking after you mark the order as **shipped**.

1. Open the order and click **Add tracking No.** (or choose **Add tracking** in
   **Take an Action**).
2. Choose the **Carrier**. The list shows the carriers of the shipping zone for
   this address (see [Shipping carriers](#shipping-carriers)).
   - If your carrier is not in the list, choose **Other**. Then type the
     **Carrier name** and the **Tracking URL**.
3. Type the **Tracking number**. The dialog shows the tracking link.
4. Click **Save**.

The customer gets an email with a tracking link they can click.

### Notes, comments and flags

- **Timeline** – shows everything that happened to the order, in time order.
  To add a comment, type in **Add a comment...** and click **Post**. Select
  **Notify customer via email** to send the comment to the customer.
- **Notes** – private notes about the order. Customers do not see them.
- **Flag** – a short label, such as *Urgent* or *Backorder*, to help you sort
  orders.

### Create an order by hand

Use this for phone orders or other sales outside your shop.

1. Go to **eCommerce → Orders** and click **Add Order**.
2. Click **Add products** and choose the products and quantities.
3. In the **Customer** card, search for a customer, or click **Add new** to
   create one.
4. Check the shipping and billing addresses.
5. In the **Payment** card, you can add a discount code (**Edit Discount**) and
   choose the delivery method (**Edit Shipping**).
6. Click **Create Order**.

### Edit an order

You can edit an order when it is **not paid**, **not cancelled** and **not
shipped yet**.

1. Open the order and click **Edit**.
2. Change the items, quantities, coupons, addresses or shipping method.
   The totals update while you work.
3. Click **Update Order**.

> **Note:** You cannot edit an order after it is paid or shipped. The **Edit**
> button does not show for these orders.

---

## 10. Customers

Go to **eCommerce → Customers**. This page lists your customers with their
number of orders, amount spent and last order date. Use the filter to find
customers by country or city.

Customers are added automatically when they register or place an order. A
customer's earlier guest orders are joined to their account.

### Add a customer by hand

1. Go to **eCommerce → Customers** and click **Add Customer**.
2. Under **Basic info**, type the first name, last name, email and phone number.
3. Select **Create WordPress user** if the customer must be able to log in. The
   customer gets an email to set a password.
4. Click **Add new address** to add a shipping or billing address. You can set
   one as the default shipping address and one as the default billing address.
5. Add **Notes** and **Tags** (for example, *VIP*) if you want.
6. Click **Create**.

### Edit or delete a customer

- To edit, click the customer, change the details, then click **Save**.
- To delete, select the customer in the list and choose **Delete
  Permanently**. You cannot undo this.

> **Note:** If a customer has a WordPress user account, the email address stays
> the same in both places.

---

## 11. Coupons

Go to **eCommerce → Coupons**. Use coupons to give discounts.

### Discount types

| Type | What it does |
|---|---|
| **Amount Off** | A percentage (for example, 10%) or a fixed amount (for example, $5) off. It can apply to the **Entire Order** or to selected **Products**. |
| **Free Shipping** | Removes the shipping cost. |

### Coupon methods

| Method | How the customer gets it |
|---|---|
| **Code** | The customer types the code in the cart or at checkout. |
| **Automatic** | The discount applies by itself when the cart matches your rules. |

### Create a coupon

1. Go to **eCommerce → Coupons** and click **Create Coupon**.
2. On the **Details** tab:
   1. Choose the **Method**: **Code** or **Automatic**.
   2. For a code, type it in **Coupon Code**, or click **Generate Code**.
   3. Type a **Title** (only you see it).
   4. Choose the **Discount Type**: **Amount Off** or **Free Shipping**.
   5. For **Amount Off**, choose the **Discount Target**: **Entire Order** or
      **Products**.
   6. Under **Discount Value**, choose **Percentage** or **Fixed Amount** and
      type the value.
   7. Under **Eligible Items**, choose **All Products**, **Specific Products** or
      **Specific Categories**.
   8. Under **Validity Period**, set the **Start date**. To end the coupon on a
      date, select **Set end date** and choose the end date.
3. On the **Targeting** tab:
   1. Under **Countries**, choose **All Countries** or **Specific Countries**.
   2. Under **Include**, choose who can use the coupon: **Everyone**,
      **Specific customers**, **Only customers** (logged-in), or **Only guests**.
      Select **First time buyer only** to allow only new customers.
   3. Under **Exclude**, choose customers who cannot use the coupon.
4. On the **Conditions** tab, set **Usage Limit** if you want:
   - **Limit number of times this discount can be used in total**
   - **Limit usage per customer**
5. Check the summary on the right side of the page.
6. Click **Create**.

### Manage coupons

In the coupon list, open the menu of a coupon to **Duplicate**, **Activate**,
**Deactivate** or **Delete** it. A deactivated coupon cannot be used.

> **Tip:** Customers can use more than one coupon in the same cart. Product
> discounts apply first, then order discounts.

---

## 12. Payments

Go to **eCommerce → Settings → Payments**. This page lists your payment methods.
Customers see the enabled methods at checkout, in the same order as this list.

| Type | Examples | How it works |
|---|---|---|
| **Manual (offline)** | Cash on Delivery, Bank Transfer | The customer pays outside the store. You confirm the payment with **Mark as paid** on the order. |
| **Online gateway** | PayPal, Stripe, Mollie | The customer pays online. The order is marked paid automatically. |

### Turn on Cash on Delivery or Bank Transfer

1. Go to **eCommerce → Settings → Payments**.
2. Move your pointer over **Cash on Delivery** (or **Direct bank transfer**).
3. Click **Edit** to change the name, icon or **Payment Instructions**. For bank
   transfer, type your bank account details in the instructions. Click **Save**.
4. Turn on the switch on the row.

The switch saves at once. There is no separate **Save** button on this page.

### Add your own manual payment method

1. Go to **eCommerce → Settings → Payments**.
2. Click **Add**, then choose **Manual Payment**.
3. Type the **Method Name** (for example, *Pay at pickup*).
4. Add an **Icon** (recommended size: 48 × 48 pixels).
5. Type the **Payment Instructions** that the customer sees.
6. Click **Save**, then turn on the switch on the new row.

### Set up PayPal

PayPal is included in the plugin.

1. Log in to the PayPal Developer Dashboard and create an app. Copy the
   **Client ID** and the **Client Secret**.
2. In PayPal, create a webhook with your store's **Webhook URL**. You find this
   URL in the PayPal settings dialog in step 4. Select these events:
   `CHECKOUT.ORDER.APPROVED`, `PAYMENT.CAPTURE.COMPLETED` and
   `PAYMENT.CAPTURE.REFUNDED`. Copy the **Webhook ID**.
3. In WordPress, go to **eCommerce → Settings → Payments**.
4. Move your pointer over **PayPal** and click **Edit**.
5. Paste the **Client ID**, **Client Secret** and **Webhook ID**.
6. To test with fake payments first, turn on **Sandbox Mode**. Use sandbox keys
   from PayPal. Turn it off before you start selling.
7. Click **Save**, then turn on the switch on the PayPal row.

### Add another online gateway

You can install more gateways from the built-in list: Stripe, Mollie, Square,
Razorpay, Klarna, Paddle, PayStack, PayU, PayFast, PayMongo, Authorize.Net,
Eway, QuickPay, Redsys and 2Checkout.

1. Go to **eCommerce → Settings → Payments**.
2. Click **Add**, then choose **Payment Gateways**.
3. Find your gateway in **Available Payment Gateways** and click **Add**. The
   plugin downloads, installs and activates it for you.
4. Move your pointer over the new gateway row and click **Edit**.
5. Type the keys from your gateway account. If the dialog shows a **Webhook
   URL**, copy it into your gateway account, so that payments update your
   orders.
6. Click **Save**, then turn on the switch on the row.

To remove a gateway, click **Delete** on its row and confirm. Your saved keys
stay, so you can add the gateway again later without retyping them.

### Change the order at checkout

Drag a payment method by its handle (it shows when you move your pointer over
the row) to a new place in the list. Customers see the same order at checkout.

---

## 13. Shipping

Go to **eCommerce → Settings → Shipping**. Shipping has five parts:

| Part | What it is |
|---|---|
| **Shipping Zones** | The places you deliver to, for example *Domestic* or *Europe*. |
| **Shipping Methods** | The delivery options in a zone, with their prices. |
| **Shipping Rules** | Conditions that change a method's price. |
| **Shipping Profiles** | Groups of products that ship differently, such as heavy items. |
| **Shipping Box** | Your package sizes. |

The setup wizard already created zones for your country and region. A customer
outside all your zones sees no shipping method, so add a zone for every place
you deliver to.

### Create a shipping zone

1. Go to **eCommerce → Settings → Shipping**.
2. Next to **Shipping Zones**, click **Add**.
3. Type a **Title** (for example, *North America*).
4. Under **Regions**, choose the countries. You can also choose states or
   regions inside a country.
5. Save the zone.

### Add a shipping method to a zone

1. Open the zone.
2. Next to **Shipping Methods**, click **Add**.
3. Type a **Method Name** (for example, *Standard Delivery*).
4. Choose a **Method Type**:

| Method type | Settings |
|---|---|
| **Flat Rate** | One fixed **Rate** for the order. Add a **Description** such as *3–5 business days*. Select **This method is taxable** if shipping is taxed. |
| **Local Pickup** | The customer collects the order. Type the **Pickup address** and **Pickup Instructions**. You can add a pickup **Fee** and **Pickup time available**. |
| **Rate by Weight** | The price depends on the total weight of the cart. You can offer free shipping when the order is over an **Amount**. |

5. Save the method. It shows at checkout for addresses in this zone.

### Add a shipping rule

Rules change a method's price when a condition is true.

1. Open a shipping method.
2. Next to **Shipping Rules**, click **Add**.
3. Choose a condition: **Product Category**, **Shipping Profile**,
   **Destination**, **Cart Weight** or **Cart Subtotal**.
4. Choose the value (for example, *Cart Subtotal is at least 100*).
5. After **THEN**, choose an action:
   - **Set Shipping Price**
   - **Add Extra to Price**
   - **Multiply Price**
   - **Free Shipping**
   - **Disable This Shipping Method**
6. Click **Add**.

**Example:** *IF Cart Subtotal is at least 100 THEN Free Shipping.*

### Shipping profiles

Use a profile for products that need a different shipping price, such as
*Fragile* or *Bulky*.

1. Next to **Shipping Profiles**, click **Add**.
2. Type a **Title**. Select **Set as default profile** if most products use it.
3. Click **Save**.
4. In a product or in bulk edit, choose this profile for the products.
5. Use a shipping rule with the **Shipping Profile** condition to set its price.

### Shipping boxes

1. Next to **Shipping Box**, click **Add**.
2. Type a **Title** (for example, *Small Package*).
3. Type the **Length**, **Width** and **Height**, and choose the unit.
4. Click **Add**. To make this box the default, choose **Set as Default**.

### Shipping carriers

Add the carriers you ship with to each zone. Then you can add tracking to
orders, and customers get a working tracking link.

1. Open a shipping zone.
2. In the **Shipping Carriers** card, click **Add**.
3. Choose a carrier from the list: UPS, FedEx, DHL, USPS, Royal Mail, Canada
   Post, Australia Post, DPD or Aramex.
4. To add a carrier that is not in the list, choose **Add new**. Type the
   **Carrier name** and the tracking **URL**. Put `{tracking_number}` where the
   tracking number goes, for example:
   `https://www.ups.com/track?tracknum={tracking_number}`. Add a **Logo** if you
   want, then click **Save**.

> **Tip:** Carriers change their websites. Test each tracking link with a real
> tracking number before you use it.

### Weight and size units

1. Go to **eCommerce → Settings → Products**.
2. Under **Units and Stock Defaults**, choose the **Weight unit** (kg, g, lb,
   oz) and the **Dimension unit** (cm, in, mm, m).
3. Click **Save**.

---

## 14. Taxes

### Turn on tax

1. Go to **eCommerce → Settings → General**.
2. Turn on **Calculate tax**.
3. Click **Save**.

### Choose how prices show tax

1. Go to **eCommerce → Settings → Tax**.
2. Under **Tax Collection**, choose one:
   - **Tax is already included in product price** – your prices include tax.
   - **Tax should be calculated & displayed in the checkout page** – tax is
     added at checkout.
3. To show tax-included prices on your shop pages, select **Display prices
   inclusive tax to the product list**.
4. Click **Save**.

### Tax regions

A tax region is a country where you collect tax. The setup wizard may have
created some for you.

1. Go to **eCommerce → Settings → Tax**.
2. Next to **Tax Regions**, click **Add** and choose a country.
3. Set the **Product Tax Rate** and the **Shipping Tax Rate**.
4. To use different rates for different states, turn off **Apply one rate for
   the entire country**. Then click **Add** under **State & Rates** and set a
   rate for each state.
5. Save the region.

To stop collecting tax in a region for a while, choose **Disable** on its row.

### Sell to the European Union

1. Go to **eCommerce → Settings → Tax** and open the **European Union** region.
2. Under **How would you like to collect VAT?**, choose one:
   - **One Stop Shop (OSS)** – charge the VAT rate of the customer's country.
   - **Micro Business** – charge your own country's rate only. This is for
     sellers whose EU sales to other countries stay under €10,000 per year.
3. Under **VAT Collection**, click **Collect VAT** or **Edit Rates** to set the
   VAT rate of each country.
4. Save the region.

### Tax profiles

Use a tax profile for products that have a different tax rate, such as food,
books or digital goods.

1. Go to **eCommerce → Settings → Tax**.
2. Next to **Tax Profiles**, click **Add**.
3. Type a **Title** (for example, *Books*). Select **Set as default profile**
   if most products use it.
4. Click **Save**.
5. On a product, use **Add Tax Profile** in the **Price** card to choose the
   profile.

### Tax rules

Rules change the tax for some products or places.

1. Open a tax region and find **Tax Rules**. Click **Add**.
2. Add a condition after **IF**: **Product Category**, **Tax Profile** or
   **Destination**. Click **Add another condition** to add more (**AND IF**).
3. After **THEN**, choose what happens: set a product tax rate, set a shipping
   tax rate, or make the product **Tax Exempt**.
4. Click **Add**.

**Example:** *IF Tax Profile is Books THEN product tax rate is 5%.*

### Make one product tax free

Open the product and turn off **Charge tax on this product** in the **Price**
card. Click **Save**.

### Your tax ID

Go to **eCommerce → Settings → General → Store Contact Details** and type your
**Tax ID** (for example, your VAT number).

---

## 15. Currencies

Go to **eCommerce → Settings → Currency**.

Your **base currency** is the currency you set your prices in. You can add more
currencies. Customers can then see prices in their own currency.

### Change how prices look

Under **Currency Preferences**, set:

- **Currency format** – **Short** (`$`) or **Long** (`USD`).
- **Currency position** – **Before** or **After** the amount.
- **Thousands separator** and **Decimals separator**.

Click **Save**.

### Add a currency

1. Under **Available Currencies**, click **Add Currency**.
2. Search for the currencies you want and select them. Click **Next**.
3. Type the exchange rate for each currency. The rate is the number of units
   you get for 1 unit of your base currency. For example, if your base currency
   is USD and 1 USD = 0.92 EUR, type **0.92** for EUR.
4. Click **Save**, then click **Save** on the page.

Move your pointer over a currency row to change its rate, **Activate** or
**Deactivate** it, **Set as Base Currency**, or **Delete** it.

### Update exchange rates automatically

1. Turn on **Automatic Updates**.
2. Choose a provider: **CurrencyApi** or **ExchangeRate-API**.
3. Click **Configure**. Paste your **API Key** from the provider's website.
4. Choose the **Update Frequency** (from every 15 minutes to daily).
5. Click **Configure**, then click **Save** on the page.

To update rates now, click **Sync now** above the currency list.

> **Note:** If an automatic update fails, your current rates stay in place.
> The message under the currency list shows the error and when the plugin tries
> again.

### Let customers choose a currency

Add this shortcode to any page, post or widget:

```
[kecom_currency_switcher]
```

It shows a currency picker on your site.

---

## 16. Emails

Go to **eCommerce → Settings → Email**. Your store sends emails automatically
when something happens. You can turn each email on or off and change its text.

### Emails to customers

| Email | Sent when |
|---|---|
| New order | The customer places an order. |
| Order processing | You mark the order as processing. |
| Order on hold | You put the order on hold. |
| Order shipped | You mark the order as shipped. |
| Tracking added | You add a tracking number. |
| Order completed (Order Delivered) | You mark the order as delivered. |
| Cancelled order | The order is cancelled. |
| Payment failed | The payment fails. |
| Order note | You post a comment with **Notify customer via email**. |
| New account | A new customer account is created. |
| Reset password | The customer asks for a new password. |

### Emails to you (the store admin)

| Email | Sent when |
|---|---|
| New order | A customer places an order. |
| Cancelled order | An order is cancelled. |
| Payment failed | A payment fails. |
| Low stock | A product's stock falls to its low-stock threshold. |
| Out of stock | A product's stock falls to zero. |

Admin emails go to the **Store Email** in **Settings → General**. If that is
empty, they go to your WordPress admin email.

### Turn an email on or off

Use the switch on the email row. An email that is off is not sent.

### Change the text of an email

1. Click **Edit** on the email row.
2. Change the **Subject**, **Heading** and **Content**. Use the email shortcodes
   to add order and customer details, such as the order number.
3. Check the live **Preview**.
4. Click **Send test mail** to send a test to yourself.
5. Click **Save**.

To go back to the original text, click **Restore to Default**.

### Brand your emails

1. Under **Default Template**, click **Edit**.
2. Upload your **Logo** and set its height and position.
3. Under **Colors**, set the background, text, link and button colors.
4. Under **Content**, change the footer and the extra description.
5. Click **Save**.

### Set up your mail server

Emails are more reliable when you send them through an SMTP server.

1. On the Email settings page, find **Mail server Configuration** and click
   **Configure**.
2. Type the **From email** and **From name**.
3. Choose the **Mailer**: **SMTP** or **PHP Mailer**.
4. For SMTP, type the **Host**, **Encryption**, **Port**, and (if needed)
   turn on **Authentication** and type the **Username** and **Password**. Your
   email provider gives you these details.
5. Click **Save**. Then send a test mail from any email template.

> **Note:** Emails are sent in the background, so they can arrive a few
> moments after the action.

---

## 17. Checkout and legal consents

### Checkout settings

Go to **eCommerce → Settings → Checkout**.

| Setting | What it does |
|---|---|
| **Allow Guest Checkout** | Customers can buy without an account. |
| **Address Line**, **Phone Number**, **Company Name**, **Company ID** | Choose if each billing field is **Optional** or **Mandatory**. |
| **Apply Coupon Code** | Customers can enter coupon codes in the cart and at checkout. |
| **Customer Note** | Customers can add a note to their order. |

Click **Save** after you make changes.

### Legal consents

Use legal consents to ask customers to agree to your terms or privacy policy.

1. Go to **eCommerce → Settings → Legal** and click **Add**.
2. Type a **Consent Title**. Only you see it.
3. Under **Display on**, choose where the consent shows: **Signup page**,
   **Login page** and/or **Checkout**.
4. Type the **Consent Message**. To add a link to one of your pages, click the
   **+** button and choose the page. Example: *By continuing, you agree to our
   {privacy_policy}.*
5. Choose the **Consent Method**:
   - **Mandatory Checkbox** – the customer must tick the box to continue.
   - **Optional Checkbox** – the customer can tick the box.
   - **Display Text Only** – the customer only reads the text.
6. Click **Save changes**.

Consents save at once. To turn one off, use its switch.

> **Note:** A consent for the signup page shows only when WordPress allows
> registration. Turn on **Anyone can register** in **Settings → General** of
> WordPress.

> **Tip:** If a link in a consent stops working, check that the linked page is
> still published and has the same web address (slug).

---

## 18. Other store settings

All settings are in **eCommerce → Settings**. Use the search box at the top of
the settings menu to find a setting quickly. Click **Save** after you change a
setting.

### General

| Section | What you set |
|---|---|
| **Store Contact Details** | Store name, logo, email, phone and Tax ID. |
| **Store Address** | Where your store is. |
| **Selling Locations** | **Worldwide**, **Specific Countries** or **All Countries Except**. Customers can order only from these countries. |
| **Order ID** | A prefix and suffix for order numbers, for example `#ORD-1001`. |
| **Invoice ID** | A prefix, suffix and starting number for invoice numbers. You can restart the numbers every year on January 1. |
| **Calculate tax** | Turns tax on or off (see [section 14](#14-taxes)). |

### Products

| Section | What you set |
|---|---|
| **Units and Stock Defaults** | Weight unit, dimension unit and default low-stock threshold. |

### Essentials

**Variation Library** – reusable attributes for your products, such as *Color*
or *Size*.

1. Go to **eCommerce → Settings → Essentials**.
2. Under **Variation Library**, click **Add**.
3. Choose **Color** (values with a color swatch) or **List** (text values).
4. Type a **Title** and click **Save**.
5. Open the attribute and add its values. For a color, pick the color.

Now you can choose this attribute in the **Variations** card of any product.

**Schemas** – the extra information that search engines read from your product
pages.

1. Under **Schemas**, click **Add**.
2. Type a **Schema preset name** and choose the properties to include.
3. Click **Save schema**.

### Advanced

**Pages** shows which WordPress pages your store uses: Shop, Cart, Checkout and
Account. If a page is missing, deleted or not published, the plugin shows a
warning. Click **Run Fix** to repair it automatically.

---

## 19. Your storefront

Kirki eCommerce creates your shop pages for you. They work with any WordPress
theme.

### Pages for your customers

| Page | What customers do there |
|---|---|
| **Shop** | Browse products. Search, filter by category and brand, and sort by price. |
| **Product page** | See images, choose options (for example, size and color), see stock and add to cart. |
| **Cart** | Change quantities, remove items and apply coupon codes. |
| **Checkout** | Enter addresses, choose shipping and payment, and place the order. |
| **Order success / failed** | See the result of the payment. |
| **Account** | See orders, addresses, account details and the wishlist. |

### Customer accounts

Customers can register and log in from your storefront. In their **Account**
area, customers can:

- See the **Dashboard** with their recent orders.
- Open **Orders** to see each order and its activity (status changes and
  tracking).
- Manage **Addresses**: add several addresses and choose default shipping and
  billing addresses.
- Change their name, email and password in **Account Details**.
- See their **Wishlist**.

New customers confirm their email address with a link that the store sends
them.

### Wishlist

Logged-in customers can save products for later.

- On the shop page, they click the heart on a product.
- On a product page, they choose an option and click **Add to Wishlist**.
- They see saved products in **Account → Wishlist**.

Visitors who are not logged in go to the login page when they click the heart.

### Mini cart

A mini cart shows the cart in your site header or sidebar. Add it in one of two
ways:

- **Block editor:** add the **Mini Cart** block (Kirki eCommerce) to a page, a
  template or your site header.
- **Shortcode:** add this shortcode where you want the mini cart:

```
[kecom_mini_cart]
```

### Currency switcher

See [Let customers choose a currency](#let-customers-choose-a-currency).

---

## 20. Analytics

Go to **eCommerce → Analytics**. This page shows how your store performs.

### What you see

- **Key metrics:** gross sales, orders, average order value, returning customer
  rate and more.
- **Sales:** total sales over time, with discounts, returns, shipping and tax;
  sales by product, category, coupon code, payment method and location.
- **Orders:** orders over time, by fulfillment status and by time of day.
- **Customers:** new compared with returning customers.
- **Tax and shipping:** taxes by region and shipping charges by method.
- **Inventory health:** out-of-stock, low-stock and in-stock counts.

All amounts use your base currency.

### Choose dates

1. Click the date range at the top. Choose a preset (for example, **Last 7
   days**), or select two days in the calendar. Click **Apply**.
2. Click **Compare** to compare with the **Previous period**, the **Previous
   year**, a custom range, or **No comparison**. Click **Apply**.

### Customize the page

1. Click **Customize**.
2. Select or clear the key metrics and cards you want to see.
3. Drag items by their handle to change their order.
4. Under **Amounts**, choose **Short** (`$20.3K`) or **Long** (`$20,345.00`).
5. Click **Done**.

To hide one card quickly, click **⋯** on the card and choose **Hide from page**.
To go back to the original layout, click **Reset to default**.

Hover over the info icon of a number to read how it is calculated.

---

## 21. Move from WooCommerce

If WooCommerce is installed on your site (version 7.0 or newer), Kirki
eCommerce can copy your WooCommerce store during setup. WooCommerce does not
have to be active.

### What is copied

- Settings: units, stock threshold, guest checkout, selling countries, checkout
  fields, email settings, tax rates and shipping zones.
- Categories, tags, brands and attributes.
- Products and their variations, with prices, SKUs, stock, weights, images and
  SEO fields.
- Customers and their addresses.
- Coupons.
- Orders, with their notes.

Your WooCommerce data does not change. The migration only reads it. Passwords
and payment gateway keys are not copied, so enter your payment keys again in
[section 12](#12-payments).

### How to migrate

1. Install and activate Kirki eCommerce (see [section 3](#3-install-and-activate)).
2. In the setup wizard, check the answers. The wizard fills them in from your
   WooCommerce settings. Change them if you need to.
3. Click **Create Store**.
4. On the last screen, the **WooCommerce Migration** row runs. It shows the
   progress, for example *Migrating · Products 31-60 of 100*.
5. When it is done, click **Go to Dashboard**.

> **Note:** The migration sends no emails, does not change stock and does not
> count coupon uses. Your old orders keep their dates, numbers and totals.

### If the migration stops

- Click **Retry**. The migration continues from where it stopped.
- If you close the page, the migration continues the next time you open the
  wizard.

> **Important:** Settings from WooCommerce replace the default Kirki settings.
> If a WooCommerce coupon, tax rate or shipping zone cannot be copied exactly,
> it is skipped. Check your coupons, taxes and shipping after the migration.

---

## 22. Help and support

### Common questions

**Do I need the Kirki website builder?**
No. Kirki eCommerce works on its own.

**Do I need a special theme?**
No. The store pages work with any theme.

**Is it free?**
Yes. Every feature is free, with no paid upgrades and no transaction fees.

**A customer outside my country sees no shipping method. Why?**
The customer's address is not in any shipping zone. Add a zone for that place
(see [section 13](#13-shipping)).

**My Shop or Checkout page is missing. What do I do?**
Go to **eCommerce → Settings → Advanced** and click **Run Fix**.

**Customers do not get emails. What do I do?**
Check that the email is turned on in **Settings → Email**. Then set up an SMTP
server (see [Set up your mail server](#set-up-your-mail-server)) and send a
test mail.

**How do I test payments without real money?**
Turn on **Sandbox Mode** in the PayPal settings, or use the test mode of your
gateway. Turn it off before you start selling.

### Get help

- **Report a bug:** [GitHub Issues](https://github.com/themeum/kirki-ecommerce/issues).
  Tell us the steps, what you expected and what happened. Add screenshots if
  you can.
- **Share feedback or ask for a feature:** use the
  [feedback form](https://docs.google.com/forms/d/e/1FAIpQLSef9owKHWm9e5N761rET0G14Y_Pjsih_BDzBR89aGVYyvkHow/viewform).
- **Join the community:** [Kirki eCommerce Facebook group](https://www.facebook.com/groups/557837446451017).
