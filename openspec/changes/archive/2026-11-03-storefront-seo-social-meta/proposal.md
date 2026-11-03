# Proposal

## Why

Merchants can enter SEO and Open Graph values in the product "AI & Web Presence" card, but the storefront uses them only in part. The single product page prints five tags and nothing else: no canonical link, no `og:url`/`og:type`, no Twitter card, and no Product structured data. The `og:image` tag is also wrong: the resource returns the image as an object, so the tag does not hold a URL. Search engines and social platforms cannot show rich results or correct share cards for our products.

## What Changes

- Fix `og:image` so it prints the image URL, and add fallbacks: Open Graph title and description fall back to the product title and short description, the same as the admin Social Share preview; the image falls back to the featured image, then to the store fallback image.
- Add the missing Open Graph tags: `og:type` (`product`), `og:url`, `og:site_name`, `og:locale`, and `product:price:*` tags.
- Add Twitter Card tags (`twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`).
- Add a canonical link and robots control on the product page. Preview URLs and non-published products are `noindex`.
- Print Product JSON-LD on the product page. The product's schema profile (the existing `product_schemas` table, `schema_id`, default profile) chooses which fields print: name, description, images, sku, gtin, brand, category, `Offer` / `AggregateOffer`, availability, seller. Ratings and reviews never print because the plugin has no review data.
- Add filters so themes and SEO plugins can change or switch off the output, and avoid duplicate tags.
- Add `docs/seo-and-social-meta.md`.
- Out of scope: changing the schema profile table, API or editor; collection and shop-page tags, a sitemap, hreflang, and the release itself (version, tag, package).

## Capabilities

### New Capabilities
- `storefront-seo-meta`: document title, meta description, keywords, canonical link and robots rules for the single product page.
- `storefront-social-meta`: Open Graph and Twitter Card tags for the single product page, with fallbacks.
- `product-structured-data`: schema.org Product JSON-LD for the single product page, with fields chosen by the product's schema profile.

### Modified Capabilities

(none)

## Impact

- Code: `app/Hooks/Actions/AddWpHeadMeta.php` (extended or split), `app/Hooks/Filters/ReplaceSiteTitle.php` (reused), a new robots filter hook in `app/Hooks/Filters/` registered in `config/hooks.php`, three small classes in `app/Supports/` (SEO data, schema profile, JSON-LD), new constants in `WPHookNames` and `DevHookNames`.
- No database change, no REST API change, no admin UI change. `ProductResource` output stays the same.
- Reads the existing schema profile table; no write.
- Docs: new `docs/seo-and-social-meta.md`.
- Tests: new PHP tests for the tag and JSON-LD output.
