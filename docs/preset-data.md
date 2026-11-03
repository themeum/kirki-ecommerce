# Preset Data

The store presets and the sample products live on S3, not in the plugin. Store
setup downloads `presets.json` (see [`docs/onboarding.md`](onboarding.md#4-industry-and-location-presets)),
and **Load sample data** downloads one industry's categories, tags, products and
images (see [`docs/onboarding.md`](onboarding.md#5-loading-sample-data)).

This document is for developers who edit that data. The repository holds the
editable source, a check command makes sure every link in it resolves, and a
publish command uploads it to the local or the real bucket.

- [1. Quick start](#1-quick-start)
- [2. Layout](#2-layout)
- [3. The presets file](#3-the-presets-file)
- [4. The products files](#4-the-products-files)
- [5. Images](#5-images)
- [6. Checks](#6-checks)
- [7. Publishing](#7-publishing)
- [8. Changing the data format](#8-changing-the-data-format)
- [9. Where this differs from WooCommerce's sample data](#9-where-this-differs-from-woocommerces-sample-data)

---

## 1. Quick start

```bash
npm run check:presets    # check the data, no upload
npm run publish:presets  # check, then upload to the kirki-ecommerce bucket on AWS S3
```

`publish:presets` needs the AWS CLI, with credentials that can write to the
`kirki-ecommerce` bucket. The plugin's default preset URL,
`https://kirki-ecommerce.s3.us-east-1.amazonaws.com/preconfigured-data`, then serves
what you uploaded, for example `.../preconfigured-data/presets.json`. The bucket must
allow anonymous `s3:GetObject` on `preconfigured-data/*`.

---

## 2. Layout

The source folder `resources/data/preconfigured-data/` has the same layout as the
bucket below the `preconfigured-data/` prefix:

```
presets.json                     common, blocs, countries, industries
<industry-slug>/products.json    categories, tags and 5 or more products of one industry
<industry-slug>/images/<file>    the images of that industry's products
other/products.json              the set for "Other", and for an industry with no file
other/images/<file>
```

The industry slugs are the industry values of the onboarding wizard
(`resources/app/features/onboarding/lib/steps.ts`), `other` included. The
make-package script leaves this folder out of the plugin zip.

---

## 3. The presets file

`presets.json` has `version` `2` and the sections that
[`docs/onboarding.md`](onboarding.md#43-the-preset-data-file) describes. An industry
holds its attributes, shipping profiles, shipping rules and tax profiles. It holds
no categories and no tags: those are in its products file.

The industry's attributes are the ones that its sample products use, next to the
general ones of that trade:

```json
"books-stationery-and-gifts": {
  "attributes": [
    { "name": "Nib", "slug": "nib", "type": "list",
      "values": [ { "value": "Fine" }, { "value": "Medium" } ] },
    { "name": "Color", "slug": "color", "type": "color",
      "values": [ { "value": "Cobalt", "color": "#2456C9" } ] }
  ]
}
```

- **Common and industry attributes merge by slug.** `color` is a common attribute
  with 30 values. An industry `color` entry holds only the extra colors of its
  products. Store setup creates the common attributes first and skips an industry
  entry whose slug exists, so a store gets only the 30 common colors at setup.
  **Load sample data** uses the values of both entries, and creates an extra color
  when a product needs it.
- **Other attributes** of an industry are created at store setup with all their
  values.
- `other` has an entry with `attributes` only.
- A `color` type value needs a hex `color`. A `list` type value has none.

---

## 4. The products files

```json
{
  "version": 1,
  "categories": [
    { "slug": "stationery", "name": "Stationery", "parent": null },
    { "slug": "notebooks", "name": "Notebooks", "parent": "stationery" }
  ],
  "tags": [ { "slug": "gift-idea", "name": "Gift Idea" } ],
  "products": [
    {
      "slug": "kraft-gift-wrap",
      "title": "Kraft Gift Wrap · Unit pricing",
      "short_description": "Recycled kraft paper on a roll, priced per metre.",
      "description": "...",
      "ribbon": null,
      "categories": ["gift-wrap"],
      "tags": ["gift-idea", "eco"],
      "images": ["kraft-gift-wrap-1.jpg", "kraft-gift-wrap-2.jpg"],
      "variants": [
        {
          "sku": "SMP-BSG-KGW-5M",
          "options": { "length": "5 m" },
          "image": null,
          "price": "9.00",
          "sale_price": null,
          "cost": "4.00",
          "stock": 20,
          "low_stock_threshold": 5,
          "allow_back_order": false,
          "max_per_order": null,
          "weight_g": 300,
          "unit_price": { "base_amount": 1, "base_unit": "m", "total_amount": 5, "total_unit": "m" },
          "is_default": true
        }
      ]
    }
  ]
}
```

| Field | Rule |
|---|---|
| `categories` | Flat list. `parent` is `null` or the slug of a category listed before it. **Load sample data** finds each one by slug, or creates it. |
| `tags` | `slug` and `name`. Found by slug, or created. |
| `products[].slug` | Lowercase slug, unique in the file. The product gets it (with a number added when the store already uses it). |
| `ribbon` | `null`, or `text` plus an optional hex `color`. |
| `products[].categories`, `tags` | Slugs from the same file. |
| `images` | Filenames in the industry's `images/` folder. The first one is the main image. |
| `variants[].options` | Attribute slug → value. The attribute is a common one or one of the industry's, and the value is one of its values. Every variant of a product uses the same attributes. A simple product has one variant with `{}`. |
| `variants[].image` | `null`, or one of the product's `images`. |
| `price`, `sale_price`, `cost` | Decimal strings in major units (`"38.00"`). `sale_price` and `cost` can be `null`. The store uses them in its base currency, with no conversion. |
| `weight_g` | Whole grams. |
| `unit_price` | Optional. Positive amounts, and units from `App\Constants\Unit` (`g`, `kg`, `ml`, `l`, `m`, …). |
| `sku` | Unique across every products file. The import uses it to skip products a store already has, so do not reuse a SKU for a different product. |
| `is_default` | Exactly one `true` per product. |

The current content is the product owner's sample catalog: five products for each
industry, one for each pattern (a simple product, a product with variants, a
product on sale, a product with an order limit or unit pricing, and a product with
mixed stock levels). The titles and descriptions say which pattern a product shows.

---

## 5. Images

The plugin downloads `<base>/<industry>/images/<file>`. The publish command uploads
each file that a product of that industry names, from
`resources/data/preconfigured-data/<industry>/images/`. Files that no product names
are not uploaded. There is no placeholder image: a missing file fails the check.

Git ignores the `images/` folders, so a clone has no images. Before you run
`npm run check:presets` or `npm run publish:presets`, put the images into these
folders (for example, download them from the bucket with `aws s3 sync`).

---

## 6. Checks

`npm run check:presets` (and every publish) fails with one line per problem when:

- a category or a tag has no slug or no name, or a slug is used twice in one file;
- a category's parent is not listed before it;
- a product names a category or a tag that its file does not have, or an attribute
  or an attribute value that the common and industry attributes do not have;
- an industry, or `other`, has no products file, or fewer than five products;
- a product slug is used twice in one file, or a SKU is used twice in any of the files;
- a product has no variant, or not exactly one default variant, or variants with
  different attributes;
- a price is not a decimal string, a weight is not whole grams, or a unit price is
  not valid;
- an image is not in the industry's `images/` folder.

The checks live in `bin/lib/preset-data.js`, with tests in
`bin/test/preset-data.test.js` (`npm run test:payments` runs every `bin/test` file).

---

## 7. Publishing

`npm run publish:presets` checks the data, copies it into a temporary folder in
the bucket layout, and uploads with the AWS CLI in this order: images, then the
products files, then `presets.json`. A store never reads a products file that
names an image that is not uploaded yet. JSON files get
`Content-Type: application/json` and `Cache-Control: max-age=60`. Nothing is
deleted from the bucket.

| Variable | Default | Meaning |
|---|---|---|
| `PRESETS_S3_ENDPOINT` | empty (AWS S3) | Another S3-compatible endpoint, for example a test bucket. |
| `PRESETS_S3_BUCKET` | `kirki-ecommerce` | Target bucket. |
| `PRESETS_S3_PREFIX` | `preconfigured-data` | Folder in the bucket. |

The variables can also come from the repository `.env` file. They have their own
`PRESETS_` prefix, so the `S3_*` values of the payments script never apply here.
The AWS credentials come from the AWS CLI configuration (`aws configure`, or the
`AWS_*` environment variables).

To point a site at another location, define the constant in `wp-config.php`:

```php
define('KIRKI_ECOMMERCE_PRESETS_URL', 'https://example.com/preconfigured-data');
```

Because the publish never deletes, the bucket can keep files from an older layout
or from removed products. The plugin does not read them. Delete them with the AWS
CLI or the S3 console when you want a clean bucket.

---

## 8. Changing the data format

The plugin accepts only `presets.json` version `2` and products files version `1`
(`PresetRepository::PRESETS_VERSION` and `PRODUCTS_VERSION`). Any other version is
treated as a failed read. To change the format in a way old plugin versions cannot
read, raise the version in the data and in the plugin together. Stores on the old
plugin then get no presets until they update, so prefer additions that old
versions ignore.

---

## 9. Where this differs from WooCommerce's sample data

- **Downloaded, not bundled.** WooCommerce ships its sample products as a CSV file
  inside the plugin, with images on its own servers. Here the products and the
  images are both downloaded from S3, and the plugin ships neither.
- **One catalog per industry.** WooCommerce has one sample catalog for every store.
  Here each industry has its own products, categories and tags.
- **Categories come with the sample data.** WooCommerce's importer creates the
  categories that its CSV rows name. Here too, the categories and tags are created
  only when sample data is loaded. Store setup creates none. A category or tag with
  the same slug is reused, and never changed.
- **No importer screen.** WooCommerce imports its CSV through the product
  importer, with column mapping. Here there is no CSV and no mapping: the products
  file has one fixed format, and the import has no options.
- **No undo.** Sample products are normal products. There is no "remove sample
  data" action and no marker tag; delete them by hand, for example by their
  `SMP-` SKUs.
- **No currency conversion.** Prices are used as numbers in the store's base
  currency.
- **No per-store updates.** A published change reaches only stores that load
  sample data, or run store setup, after it.
