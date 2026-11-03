# Design

## Context

Today `AddWpHeadMeta` (on `wp_head`) prints five tags from `view_data()`, the `ProductResource` array that `SiteController::shop_single_page()` passes to the view. Facts that shape the plan:

- Only the `shop.single` route is a product page. The shop page is a normal WordPress page; collections have no storefront route. The router replaces the query vars and answers on `template_redirect`, so WordPress core sees no singular post and prints no canonical link for this route.
- `ProductResource` returns `og_image` as a `MediaAttachment` array (`url`, `width`, `height`, ...), so the current `esc_attr($og_image)` does not print a URL. The admin form always saves `og_image` as `null` (spec `product-seo-card`), so in practice the image comes from the featured image.
- The admin Social Share preview already defines the fallbacks merchants see: OG title -> product title, OG description -> short description. The storefront must match what the preview shows.
- Variants carry `base_price`, `base_sale_price`, `sku`, `barcode`, `is_visible`, `is_default`, `allow_back_order` and `availability_status` (`in_stock`, `low_stock`, `out_of_stock`).
- Schema profiles already exist: table `kirki_ecommerce_product_schemas` (`name`, `is_default`, JSON `schema`), a service and CRUD API, seeders and presets. A profile is a field whitelist per JSON-LD group, and a product points to one through `schema_id`. The admin form has no profile picker, so most products rely on the default profile. Nothing prints a profile on the storefront yet.
- Project rules: PHP 7.4, no `private`, `static::`, a docblock on every member, `composer phpcs:wporg` and `composer phpcs:docblocks`, hooks listed in `config/hooks.php`, hook names in `WPHookNames` (core) and `DevHookNames` (public, `kirki_ecommerce_` prefix). See proposal.md for motivation.

## Goals / Non-Goals

**Goals:**
- One resolver for the product's SEO data, used by every output, so tags, social tags and JSON-LD never disagree.
- Storefront values equal to what the admin previews show.
- Correct, escaped output; merchant values first, safe fallbacks.
- Output that sites can adjust or switch off.

**Non-Goals:**
- Collection, shop, home or account pages; sitemap; hreflang.
- Reviews and ratings.
- Changing the profile table, its API, or building a profile editor. Profiles are read only.
- Admin UI or `ProductResource` changes.
- The release itself (version, tag, package). See `docs/release-package.md`.

## Decisions

1. **Three small classes in `app/Supports/`; hooks only print.**
   - `ProductSeo`: turns the `view_data()` array into resolved values (title, descriptions, OG values, image, canonical URL, visible variants, price range, availability, indexable flag).
   - `ProductSchemaProfile`: picks the profile and filters candidate JSON-LD fields.
   - `ProductJsonLd`: builds the candidate values and the final JSON-LD array.
   One place per concern; the fallback rules live once. Alternative: build each block inside the hook. Rejected: the three outputs would drift.

2. **Reuse the loaded data; no extra product query, no API change.**
   The image comes from `og_image['url']`, then `media[0]['url']`, then `Url::get_product_fallback_image()`. Width and height come from the same array when present. The profile is the only added query (one read, only on the product page).

3. **Fallbacks match the admin previews.**
   OG title: `og_title` -> `title`. OG description: `og_description` -> plain text of `short_description`. Meta description: `seo_description` -> plain text of `short_description`. Plain text means tags removed and whitespace collapsed. The SEO title is not used for social tags, because the admin Social Share preview does not use it. Document title keeps today's rule.

4. **`AddWpHeadMeta` stays the single `wp_head` entry for tags and JSON-LD.**
   Hook registration is unchanged. Escaping: `esc_attr` / `esc_url` for tags; `wp_json_encode` with `JSON_HEX_TAG | JSON_HEX_AMP | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE` for JSON-LD, so text cannot close the script tag.

5. **Canonical: print it ourselves; robots: through core.**
   Core prints no canonical on this route, so we print exactly one from `Url::get_product_url($slug)`; a test proves there is only one. Robots uses the core `wp_robots` filter in a new hook class (added to `config/hooks.php`, with a `WP_ROBOTS` constant in `WPHookNames`). It adds `noindex` when the product is not published or the request is a preview. Alternative: print our own robots meta. Rejected: it can duplicate core's tag.

6. **Prices from minor units through `Money`, not floats.**
   Use `Money::from_minor($minor, Money::get_base_currency())` and read its decimal amount string, so zero-decimal and three-decimal currencies are correct. `prepare_amount_from_minor` returns a float and is not used. The currency is the store base currency, never the visitor's display currency. Sale price is used when `base_sale_price` is set. Only visible variants count.

7. **Offer shape and availability.**
   One visible variant -> `Offer`; several -> `AggregateOffer` (`lowPrice`, `highPrice`, `offerCount`, `priceCurrency`); none -> no offers. Per variant: `in_stock` or `low_stock` -> `InStock`; `out_of_stock` with `allow_back_order` -> `BackOrder`; anything else, including unknown values -> `OutOfStock`. An aggregate offer is `InStock` when any variant is `InStock`, else `BackOrder` when any is `BackOrder`, else `OutOfStock`. `gtin` comes from the default variant's `barcode`, only when it has 8, 12, 13 or 14 digits.

8. **Schema profile selects the JSON-LD fields.**
   `ProductJsonLd` first builds all candidate values (Product: name, description, image, sku, mpn, category, color, material, size, url; Brand: name, logo; Offer: price, priceCurrency, availability, itemCondition, priceValidUntil, seller.name). `ProductSchemaProfile` picks the profile and cleans it to known groups; `ProductJsonLd` then keeps only the groups and fields the profile lists. Profile choice: product `schema_id`, then the `is_default` profile, then a built-in set (Product name, description, image, sku; Offer price, priceCurrency, availability; Brand name). `@context`, `@type` and `url` are always kept. Unknown groups and fields, and fields with no data, are skipped. `AggregateRating` and `Review` groups print nothing. Invalid profile JSON uses the built-in set. The profile column can be edited by merchants or imports, so nothing is trusted. Alternative: ignore profiles. Rejected: merchants already choose fields in profiles.

9. **Public extension points in `DevHookNames`.**
   Three filters with the `kirki_ecommerce_` prefix: one to turn the whole SEO head output off, one for the resolved data, one for the final JSON-LD array. No automatic SEO plugin detection; the docs explain the off filter.

10. **Tests.**
    Unit tests for `ProductSeo` fallbacks, price formatting, availability mapping and profile filtering (pure arrays). Integration tests render the head for a seeded product and assert tags, the single canonical, robots, and the decoded JSON-LD.

## Risks / Trade-offs

- [Duplicate tags with Yoast, Rank Math or a theme] -> The off filter and docs; canonical is checked to be single.
- [Wrong price format breaks rich results] -> Decision 6 uses `Money`; tests include sale price, many variants and a zero-decimal currency.
- [Over-promising stock] -> Unknown status maps to `OutOfStock`.
- [Social title differs from the SEO title] -> Intended: it matches the admin Social Share preview. Merchants set `og_title` to change it.
- [Profile lists a field we cannot fill, or has bad JSON] -> Skip the field; invalid JSON uses the built-in set.
- [Profile has no `Offer` group, so rich results lose price] -> Followed as the merchant set it; docs say so.
- [Search engines may ignore `keywords`] -> Kept because merchants already enter it.

## Corrections during implementation

- Product titles are sanitized on save, so markup such as `</script>` cannot reach the title through the API. The script-escape integration test injects the value through the SEO data filter instead; a unit test covers the encoding flags.
- Meta, Open Graph and Twitter text is converted to plain text (markup removed) before it is escaped, so `<b>` in an Open Graph title is removed, not shown.
- The schema profile builder lists no GTIN field, so the `gtin` value prints when the profile lists the SKU (or `gtin`).
- Integration tests clear the `product_schemas` table in `setUp` and after `tear_down`, because those rows are not rolled back with the test transaction.
- Not covered by an integration test: the head output for a product with no price, and the `summary` Twitter card (it needs an empty fallback image). Both are covered by unit tests of the resolver.
