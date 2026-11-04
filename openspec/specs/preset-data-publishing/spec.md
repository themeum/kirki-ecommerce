# preset-data-publishing Specification

## Purpose
Defines how the preset and sample product data is kept in the repository, the rules
that make the links between products, categories, tags and attributes always
resolve, and the command that checks the data and uploads it to the local or the
real S3 bucket.

## Requirements
### Requirement: Source data lives in the repository

The editable preset and sample product data SHALL live in the repository in one
folder that uses the remote layout (`presets.json`, and one folder for each industry
and for `other` with `products.json` and `images/`). The repository is the source of
truth, and S3 holds a published copy. Git SHALL ignore the `images/` folders: the
image files are local only, and S3 holds the shared copy.

#### Scenario: Edit a category tree

- **WHEN** a developer changes the Fashion category tree
- **THEN** the change is a diff to `fashion-and-apparel/products.json` in the repository, and the next publish sends it to S3

### Requirement: Category and tag slugs are explicit and unique

Every category and every tag in a products file SHALL have an explicit slug and a
name. Within one products file, no two categories SHALL have the same slug, and no
two tags SHALL have the same slug. A category's parent SHALL be the slug of a
category listed before it in the same file.

#### Scenario: Duplicate slug

- **WHEN** two categories in one products file have the same slug
- **THEN** the check fails and names the file and the slug

#### Scenario: Parent not listed before the child

- **WHEN** the category `pens` names the parent `stationery`, and `stationery` is listed after `pens` or not at all
- **THEN** the check fails and names the file and the category

### Requirement: Product links resolve

Every reference in a `products.json` SHALL resolve:

- each category slug SHALL be a category of the same file;
- each tag slug SHALL be a tag of the same file;
- each variant option SHALL name an attribute slug from the common attributes or the
  attributes of the file's industry in `presets.json` (for `other`, the `other`
  entry), and a value of that attribute. When the common and the industry attributes
  have the same slug, their values are used together.

#### Scenario: Unknown category slug

- **WHEN** a Fashion product references the category slug `clothing-shirts`, which is not in the Fashion products file
- **THEN** the check fails and names the product and the slug

#### Scenario: Unknown attribute value

- **WHEN** a variant has the option Color "Sand", and neither the common Color nor the industry's `color` entry has the value "Sand"
- **THEN** the check fails and names the product, the attribute and the value

#### Scenario: Industry color value

- **WHEN** a Fashion variant has the option Color "Marigold", the common Color has no "Marigold", and the Fashion `color` entry has it
- **THEN** the check passes

### Requirement: Product data rules

Each `products.json` SHALL hold at least five products. Every product slug SHALL be
unique in its file. Every variant SKU SHALL be unique across all the products files.
Every product SHALL have at least one variant, and exactly one default variant. A
unit price, when present, SHALL have a positive base amount, a positive total amount
and a unit for each.

#### Scenario: Too few products

- **WHEN** an industry's `products.json` holds four products
- **THEN** the check fails and names the industry

#### Scenario: Duplicate SKU

- **WHEN** a Fashion variant and a Sports variant have the same SKU
- **THEN** the check fails and names the SKU and both products

### Requirement: Images live in the industry folder

Every image that a product names SHALL be a file in the `images/` folder of the
products file's industry. There is no fallback image. When the file is missing, the
check SHALL fail.

#### Scenario: Image present

- **WHEN** a Fashion product names `linen-shirt-coral.jpg` and `fashion-and-apparel/images/linen-shirt-coral.jpg` exists
- **THEN** the publish uploads it to `{prefix}/fashion-and-apparel/images/linen-shirt-coral.jpg`

#### Scenario: Missing image

- **WHEN** a product names an image that is not in its industry's `images/` folder
- **THEN** the check fails and names the product and the filename

### Requirement: Publish command

One command SHALL check the data and, only if every check passes, upload it. It
SHALL upload the images first, then each `products.json`, then `presets.json` last.
Without configuration it SHALL target the `kirki-ecommerce` bucket on AWS S3 under
the `preconfigured-data` prefix. Environment values of its own SHALL select another
endpoint, bucket or key prefix. The payments script's S3 settings SHALL NOT change
where the presets are published.

#### Scenario: A check fails

- **WHEN** any data check fails
- **THEN** the command uploads nothing and exits with a non-zero status

#### Scenario: Default publish

- **WHEN** the developer runs the command with no preset environment values
- **THEN** the data is uploaded to `s3://kirki-ecommerce/preconfigured-data/` on AWS S3

#### Scenario: Payments settings in .env

- **WHEN** `.env` sets the payments script's endpoint to the local S3 and its bucket to `kirki-payments`
- **THEN** the presets are still published to `s3://kirki-ecommerce/preconfigured-data/` on AWS S3
