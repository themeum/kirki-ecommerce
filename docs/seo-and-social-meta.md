# SEO, Social Share and Structured Data

What the single product page prints in its `<head>`: the search description, a
canonical link, Open Graph and Twitter Card tags for shared links, and
schema.org Product data (JSON-LD) for rich search results. All of it comes from
the product's **AI & Web Presence** card and the product itself. It only applies
to the product page (`/shop/<slug>`).

- [1. Quick start](#1-quick-start)
- [2. What gets printed](#2-what-gets-printed)
- [3. Where each value comes from](#3-where-each-value-comes-from)
- [4. Structured data](#4-structured-data)
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

## 4. Structured data

The JSON-LD is a schema.org `Product`. Every product prints the same field set,
filled from the product data. `@context`, `@type` and `url` are always printed.
A field with no data is left out, never printed empty. There is no setting that
changes the field set; site code changes it with `kirki_ecommerce_product_json_ld`
(section 6).

| Field | Value |
|---|---|
| `name`, `description`, `image`, `url` | The resolved SEO values in section 3 |
| `sku` | The default variant, else the first visible variant that has one |
| `gtin` | The barcode of that variant, only when it is 8, 12, 13 or 14 digits |
| `category` | The deepest assigned category path, for example `Lighting > Lamps` |
| `brand.name`, `brand.logo` | The product's brand; no `brand` when the product has none |
| `offers.price` (or `lowPrice` / `highPrice` / `offerCount`) | The visible variant prices in the base currency, sale price when set |
| `offers.priceSpecification` | One visible variant only: its base price as a `StrikethroughPrice`, when its sale price is lower than its base price |
| `offers.priceCurrency` | The store base currency |
| `offers.availability` | See **Availability** below |
| `offers.itemCondition` | Always `https://schema.org/NewCondition` |
| `offers.seller.name` | The WordPress site name; no `seller` when it is empty |

**Offers.** One visible variant gives an `Offer`. Several give an
`AggregateOffer` with `lowPrice`, `highPrice` and `offerCount`. A product with
no visible variant prints no offer.

**Strikethrough price.** When the one visible variant is on sale, the `Offer`
also prints its base price as a `UnitPriceSpecification` with `priceType`
`https://schema.org/StrikethroughPrice`, so Google Search can show the old price
struck through. An `AggregateOffer` prints the price range only, because Google
does not support a strikethrough price on it.

```json
"offers": {
  "@type": "Offer",
  "price": 15.5,
  "priceCurrency": "USD",
  "priceSpecification": {
    "@type": "UnitPriceSpecification",
    "priceType": "https://schema.org/StrikethroughPrice",
    "price": 20,
    "priceCurrency": "USD"
  }
}
```

**Availability.** A variant that is in stock or low on stock is `InStock`. A
variant out of stock that allows back orders is `BackOrder`. Anything else,
including a state the plugin does not know, is `OutOfStock`. For several
variants the offer is `InStock` if any is, else `BackOrder` if any is, else
`OutOfStock`.

**Not printed.** `aggregateRating` and `review` are never printed, because the
plugin stores no reviews. `mpn`, `color`, `material`, `size` and
`priceValidUntil` are not printed for the same reason: there is no data.

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
- **No reviews or ratings.** The store has no reviews, so there is no `aggregateRating` or `review`. WooCommerce and Yoast WooCommerce SEO print them.
- **No sitemap, no hreflang, no breadcrumb data.** Use a sitemap plugin if you need one.
- **No automatic detection of SEO plugins.** If one is active, switch this output off with `kirki_ecommerce_seo_head_enabled`, or you may get duplicate tags.
- **Social title does not use the SEO title.** Yoast falls back to the SEO title; here it falls back to the product title.
- **Fixed field list.** Every product prints the fields in section 4. There is no per-product or store setting to add, remove or customise JSON-LD properties; use `kirki_ecommerce_product_json_ld` for that. `itemCondition` is always `NewCondition`, because a product has no condition field.
- **No social image upload.** The Social Share tab has no image field. The first product image is used.
- **No strikethrough price for several variants.** A product with several variants prints an `AggregateOffer` with the price range, and Google does not support a strikethrough price on it. There is no `ProductGroup` / `hasVariant` data per variant, so these products are also not eligible for Google merchant listings.
- **One schema type.** Only `Product` is printed. There is no Organization, WebSite or Article data.
