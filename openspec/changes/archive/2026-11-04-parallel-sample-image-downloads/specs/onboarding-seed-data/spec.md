## ADDED Requirements

### Requirement: Sample images are downloaded together

When the merchant loads sample data, the import SHALL download the images of all
the products that it will create before it creates the first product. It SHALL
send the image requests at the same time, with at most 25 requests in flight, and
not one after the other. Each image URL SHALL be requested at most one time for
each load, also when a product and one of its variants use the same image. The
import SHALL NOT request an image that an earlier load already imported from the
same URL, an image from an untrusted URL, or an image of a product that it skips
because the store already has one of its SKUs. A failed image request SHALL affect
only that image: the other images are imported, and every product is still
created.

#### Scenario: All images in one batch

- **WHEN** the merchant loads the sample data of an industry whose five products name 22 different images, and no image was imported before
- **THEN** the 22 image requests are sent together in one batch, before any product is created, and each image URL is requested one time

#### Scenario: Shared product and variant image

- **WHEN** a product names `linen-shirt-coral.jpg` as an image, and one of its variants names the same file
- **THEN** that image URL is requested one time, and the product and the variant use the same media library item

#### Scenario: Image imported by an earlier load

- **WHEN** the merchant loads sample data again, and an earlier load imported every image of the industry
- **THEN** no image is requested, and the products use the existing media library items

#### Scenario: Skipped product

- **WHEN** the store already has a variant with the SKU of a sample product
- **THEN** that product is skipped, and its images are not requested

#### Scenario: One image fails in the batch

- **WHEN** one image request in the batch times out, and the other images return 200
- **THEN** the other images are imported, and the product with the failed image is created without that image

#### Scenario: More images than the limit

- **WHEN** the products to create name 30 different images that were not imported before
- **THEN** no more than 25 image requests are in flight at the same time, and all 30 images are requested
