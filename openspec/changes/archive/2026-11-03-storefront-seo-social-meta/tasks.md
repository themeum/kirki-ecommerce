# Tasks

Verification commands used below ("the checks"): `composer test:unit`, `composer test:integration`, `composer phpcs:wporg`, `composer phpcs:docblocks`, and `npm run typecheck && npm test` in `resources/app/`. Code follows `.claude/rules/php-standards.md` (PHP 7.4, `protected` not `private`, `static::`, docblock on every member).

## 1. SEO data resolver and hook plumbing

- [x] 1.1 Add `DevHookNames` constants for the three public filters (disable output, resolved data, JSON-LD) and a `WP_ROBOTS` constant in `WPHookNames`. Verify with `composer phpcs:docblocks`.
- [x] 1.2 Add `ProductSeo` in `app/Supports/`: from the `view_data()` array, resolve meta description, OG title, OG description, image (OG image, featured image, store fallback, with width and height), canonical URL, `indexable` flag (published and not preview), visible variants, price range and availability, using the fallbacks in the specs and design decisions 3, 6 and 7. Verify with unit tests for each fallback step, each availability mapping value (including unknown), sale price, several variants, a zero-decimal currency, and plain-text conversion of the short description.
- [x] 1.3 Apply the data filter and the disable filter around the resolver result. Verify with a test where a callback changes a value and a test where a callback disables the output.
- [x] 1.4 Run the checks.

## 2. Meta tags, canonical, robots

- [x] 2.1 Rework `AddWpHeadMeta` to print the meta description and keywords from `ProductSeo`, escaped, with no empty tags. Verify with integration tests for the three description scenarios.
- [x] 2.2 Print one canonical link with the clean product URL. Verify with an integration test that `?preview=1&utm_source=x` still gives exactly one clean canonical, and that core adds none.
- [x] 2.3 Add a robots filter hook class on `wp_robots`, register it in `config/hooks.php`, and add `noindex` only when the product is not indexable. Verify with tests for a draft preview and a published product.
- [x] 2.4 Check `ReplaceSiteTitle` against the document-title requirement and change it only if a scenario fails. Verify with title tests for set and empty SEO title.
- [x] 2.5 Run the checks.

## 3. Open Graph and Twitter tags

- [x] 3.1 Print `og:image` as a URL string with width and height when known, using the image chain. Verify with integration tests for each chain step and an assertion that the value is a URL, not an array.
- [x] 3.2 Print `og:type`, `og:url`, `og:site_name`, `og:locale`, `og:title` and `og:description` with the admin-preview fallbacks. Verify with tests for set values, for fallback values, and for a product with an SEO title but no OG title.
- [x] 3.3 Print `product:price:amount` and `product:price:currency` only when a visible variant has a price. Verify with tests for price present, sale price and no price.
- [x] 3.4 Print the Twitter Card tags with `summary_large_image` or `summary`. Verify with tests for the image and no-image cases.
- [x] 3.5 Add an escaping test with quotes and angle brackets in the OG title. Verify the output is one valid tag.
- [x] 3.6 Run the checks.

## 4. Product JSON-LD

- [x] 4.1 Add `ProductSchemaProfile`: choose the product profile, then the default, then the built-in set; keep only listed groups and fields; skip unknown and empty fields; treat invalid JSON as no profile. Verify with unit tests for product profile, default profile, built-in set, invalid JSON, missing `Offer` group, field without data and unknown field.
- [x] 4.2 Add `ProductJsonLd` with the candidate Product, Brand and category values, `sku`, `gtin` rules, and the safe JSON flags. Verify with a test that decodes the block and a test with `</script>` in the title.
- [x] 4.3 Add `Offer` / `AggregateOffer` with availability and sale price, and omit offers when no variant is visible. Verify with tests for one variant, three variants, sale price, a hidden variant, no visible variant, out of stock and back order.
- [x] 4.4 Print the block from `AddWpHeadMeta`, apply the JSON-LD filter, and make sure no `aggregateRating` or `review` key is printed even when the profile lists them. Verify with a filter test and a key assertion.
- [x] 4.5 Run the checks.

## 5. Documentation and final check

- [x] 5.1 Write `docs/seo-and-social-meta.md` like `docs/emails.md`: table of contents, numbered sections, quick start first, the tag and JSON-LD reference, how schema profiles choose the fields, the filters, and a "Where this differs from" section (Yoast / Rank Math / WooCommerce: no reviews, no sitemap, product page only, no collection tags, social title does not use the SEO title). Verify that every filter name and tag in the doc exists in the code.
- [x] 5.2 Run the whole set of checks. Verify all pass.
- [x] 5.3 Ask the user to check one real product page source and a Rich Results Test / share-preview result, because browser checks are not allowed in this project. Verify the user confirms. (Done from the page source the user pasted for `/shop/hm-silk-scarf`; the Rich Results Test was not run because the site is on localhost.)

## Workflow follow-up

- Archive the change after review.
- Release (version, tag, package) is a separate step after archive; see `docs/release-package.md`.
