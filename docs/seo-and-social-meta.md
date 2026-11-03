# SEO, Social Share and Structured Data

What the single product page prints in its `<head>`: the search description, a
canonical link, Open Graph and Twitter Card tags for shared links, and
schema.org Product data (JSON-LD) for rich search results. All of it comes from
the product's **AI & Web Presence** card and the product itself. It only applies
to the product page (`/shop/<slug>`).

- [1. Quick start](#1-quick-start)
- [2. What gets printed](#2-what-gets-printed)
- [3. Where each value comes from](#3-where-each-value-comes-from)
- [4. Structured data and schema profiles](#4-structured-data-and-schema-profiles)
- [5. Search engines: canonical and robots](#5-search-engines-canonical-and-robots)
- [6. Hooks](#6-hooks)
- [7. Where this differs from Yoast, Rank Math and WooCommerce](#7-where-this-differs-from-yoast-rank-math-and-woocommerce)

---

## 1. Quick start

Open a product and fill the **AI & Web Presence** card:

- **Search Engines** tab: SEO title, meta description.
- **Social Share** tab: social title, social description.

Leave a field empty and the page uses the fallback in section 3. Nothing else
needs to be set up: the tags, the canonical link and the JSON-LD are printed for
every published product.

To check a page, view its source and look for `og:title`, `rel="canonical"` and
`application/ld+json`. Google's Rich Results Test and the Facebook Sharing
Debugger read the same tags.

---

## 2. What gets printed

| Group | Tags |
|---|---|
| Search | `description`, `keywords`, `<link rel="canonical">` |
| Open Graph | `og:type` (always `product`), `og:url`, `og:site_name`, `og:locale`, `og:title`, `og:description`, `og:image`, `og:image:width`, `og:image:height` |
| Price | `product:price:amount`, `product:price:currency` |
| Twitter Card | `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image` |
| Structured data | One `<script type="application/ld+json">` with a schema.org `Product` |

A tag with no value is not printed. Every value is escaped for its place in the
page.

---

## 3. Where each value comes from

| Tag | Used first | Then |
|---|---|---|
| Document title | SEO title | Product title and site name |
| `description` | SEO description | Short description, as plain text |
| `og:title`, `twitter:title` | Social title | Product title |
| `og:description`, `twitter:description` | Social description | Short description, as plain text |
| `og:image`, `twitter:image` | Social image set through the API | First product image, then the store fallback image |
| `product:price:amount` | Lowest price of the visible variants (the sale price when set) | Not printed when there is no price |

The social title does **not** fall back to the SEO title. This is what the
Social Share preview in the admin shows, so the preview and the real page match.
To share a different title, fill the social title.

Prices are plain numbers in the store's **base currency**, never the visitor's
display currency. Hidden variants are ignored.

---

## 4. Structured data and schema profiles

The JSON-LD is a schema.org `Product`. `@context`, `@type` and `url` are always
printed. **Which other fields are printed is decided by the product's schema
profile**, a saved list of fields per group:

```json
{ "Product": ["name", "description", "image", "sku"],
  "Brand":   ["name", "logo"],
  "Offer":   ["price", "priceCurrency", "availability"] }
```

The page picks a profile in this order:

1. The profile assigned to the product (`schema_id`).
2. The profile marked as default.
3. A built-in set: Product name, description, image and sku; Brand name; Offer price, priceCurrency and availability.

A stored profile that cannot be read is skipped. A group that the profile does
not list is not printed (no `Offer` group means no price in rich results). A
field with no data, and a field name the plugin does not know, is skipped.

| Group | Fields the plugin can fill |
|---|---|
| Product | `name`, `description`, `image`, `sku` (also prints `gtin` when the barcode is 8, 12, 13 or 14 digits), `category` (for example `Lighting > Lamps`) |
| Brand | `name`, `logo` |
| Offer | `price`, `priceCurrency`, `availability`, `itemCondition`, `seller.name` |

**Offers.** One visible variant gives an `Offer`. Several give an
`AggregateOffer` with `lowPrice`, `highPrice` and `offerCount`. A product with
no visible variant prints no offer.

**Availability.** A variant that is in stock or low on stock is `InStock`. A
variant out of stock that allows back orders is `BackOrder`. Anything else,
including a state the plugin does not know, is `OutOfStock`. For several
variants the offer is `InStock` if any is, else `BackOrder` if any is, else
`OutOfStock`.

**Not printed.** `AggregateRating` and `Review` can be listed in a profile but
print nothing, because the plugin stores no reviews. `mpn`, `color`, `material`,
`size` and `priceValidUntil` are skipped for the same reason: there is no data.

---

## 5. Search engines: canonical and robots

The canonical link is always the clean product URL, so `?preview=1`, tracking
parameters and variant links all point to one address.

A product page gets `noindex` in its robots directive when the product is not
published, or when the page is opened through a preview link. A published
product opened normally gets no `noindex` from the plugin. The tag itself is
printed by WordPress, which merges the plugin's value with other robots rules.

---

## 6. Hooks

| Filter | Purpose |
|---|---|
| `kirki_ecommerce_seo_head_enabled` | Return `false` to print none of the tags, the canonical link or the JSON-LD, and to stop the plugin changing robots. Use it when an SEO plugin already handles the product page. |
| `kirki_ecommerce_product_seo_data` | Change the resolved values before they are printed. Receives the resolved array and the product array. |
| `kirki_ecommerce_product_json_ld` | Change the final JSON-LD array before it is printed. Receives the array, the resolved values and the product array. |

```php
add_filter('kirki_ecommerce_product_json_ld', function ($data) {
    $data['mpn'] = 'MPN-123';

    return $data;
});
```

---

## 7. Where this differs from Yoast, Rank Math and WooCommerce

- **Product page only.** The shop page, collections, the home page and account pages get no tags from this feature. Collections store SEO fields but have no storefront page yet.
- **No reviews or ratings.** The store has no reviews, so there is no `aggregateRating` or `review`, even if a profile lists them. WooCommerce and Yoast WooCommerce SEO print them.
- **No sitemap, no hreflang, no breadcrumb data.** Use a sitemap plugin if you need one.
- **No automatic detection of SEO plugins.** If one is active, switch this output off with `kirki_ecommerce_seo_head_enabled`, or you may get duplicate tags.
- **Social title does not use the SEO title.** Yoast falls back to the SEO title; here it falls back to the product title.
- **Fixed field list.** A profile chooses from the fields in section 4. It cannot add custom JSON-LD properties; use `kirki_ecommerce_product_json_ld` for that.
- **No social image upload.** The Social Share tab has no image field. The first product image is used.
- **One schema type.** Only `Product` is printed. There is no Organization, WebSite or Article data.
