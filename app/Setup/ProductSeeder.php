<?php

namespace Kirki\Ecommerce\App\Setup;

use Kirki\Ecommerce\App\Actions\Product\CreateProductAction;
use Kirki\Ecommerce\App\Constants\Product\ProductStatus;
use Kirki\Ecommerce\App\DTO\Product\CreateProductDTO;
use Kirki\Ecommerce\App\DTO\Variant\CreateVariantDTO;
use Kirki\Ecommerce\App\Models\Attribute;
use Kirki\Ecommerce\App\Models\AttributeValue;
use Kirki\Ecommerce\App\Models\Product;
use Kirki\Ecommerce\Framework\Database\Seeder;
use Kirki\Ecommerce\Framework\Supports\Facades\Log;
use Kirki\Ecommerce\Framework\Supports\Str;

use function Kirki\Ecommerce\Framework\app;

defined('ABSPATH') || exit;

/**
 * Seeds the onboarding starter products and imports their bundled imagery.
 *
 * @since 1.0.0
 */
class ProductSeeder extends Seeder
{
    /**
     * Stock assigned to every seeded variant.
     */
    const STARTING_QUANTITY = 25;

    /** @var MediaImporter */
    protected $importer;

    /**
     * Attachment ids keyed by bundled filename, so an image shared by a product
     * and one of its variants is imported once.
     *
     * @var array<string, int|null>
     */
    protected $attachments = [];

    /**
     * Whether every image resolved to an attachment during this run.
     *
     * @var bool
     */
    protected $media_complete = true;

    /**
     * Seed the starter products and import their imagery.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function run(): void
    {
        if (Product::query()->exists()) {
            return;
        }

        $this->ensure_demo_attributes();

        $this->importer = new MediaImporter();
        $action = app()->make(CreateProductAction::class);

        foreach (OnBoardingCatalog::get_products() as $product) {
            $action->execute(
                $this->make_product_data($product),
                $this->make_variant_data($product)
            );
        }

        Log::info('OnBoarding ProductSeeder created the starter products');

        $this->cleanup_bundled_images();
    }

    /**
     * Create the demo attributes and values the store does not have yet.
     *
     * Store setup creates attributes from the industry presets, so a store can
     * lack Material, or a Color value a demo variant uses. Existing attributes
     * and values are reused, never changed.
     *
     * @since 1.0.0
     *
     * @return void
     */
    protected function ensure_demo_attributes()
    {
        foreach (OnBoardingCatalog::get_demo_attributes() as $definition) {
            $values = $definition['values'];
            unset($definition['values']);

            $attribute = Attribute::query()->where('slug', $definition['slug'])->first();

            if (empty($attribute)) {
                $attribute = Attribute::create($definition);
            }

            foreach ($values as $value) {
                if (empty($this->find_attribute_value($attribute->id, $value['value']))) {
                    $attribute->values()->create($value);
                }
            }
        }
    }

    /**
     * Build the create-product payload for a catalog entry.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $product Catalog entry.
     * @return CreateProductDTO Product payload for the create action.
     */
    protected function make_product_data(array $product)
    {
        return CreateProductDTO::from_array([
            'title' => $product['title'],
            'slug' => Str::slug($product['title']),
            'status' => ProductStatus::PUBLISHED,
            'short_description' => $product['short_description'],
            'description' => $product['description'],
            'seo_title' => $product['title'],
            'seo_description' => $product['short_description'],
            'media' => $this->import_many($product['media']),
            'attributes' => $this->resolve_attributes($product['attributes']),
        ]);
    }

    /**
     * Build the variant payloads for a catalog entry.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $product Catalog entry.
     * @return CreateVariantDTO[] One variant payload per catalog variant.
     */
    protected function make_variant_data(array $product)
    {
        $sku_prefix = strtoupper(Str::slug($product['title']));

        return array_map(function ($variant) use ($product, $sku_prefix) {
            return CreateVariantDTO::from_array([
                'attribute_values' => $this->resolve_attribute_values($variant['attribute_values']),
                'media' => $this->import($variant['media']),
                'sku' => $sku_prefix . '-' . $variant['label'],
                'base_price' => $variant['base_price'],
                'base_cost_of_goods' => (int) round($variant['base_price'] * 0.6),
                'weight' => $variant['weight'],
                'weight_unit' => 'kg',
                'charge_taxes' => true,
                'track_inventory' => true,
                'available_quantity' => static::STARTING_QUANTITY,
                'in_stock' => true,
                'is_visible' => true,
                'is_physical_product' => true,
                'is_default' => $variant['is_default'],
            ]);
        }, $product['variants']);
    }

    /**
     * Build the product's attribute payload from names.
     *
     * @since 1.0.0
     *
     * @param array<string, string[]> $attributes Value names keyed by attribute name.
     * @return array<int, array<string, mixed>> Entries with the attribute id and its value ids.
     */
    protected function resolve_attributes(array $attributes)
    {
        $payload = [];

        foreach ($attributes as $attribute_name => $value_names) {
            $attribute = $this->find_attribute($attribute_name);

            if (empty($attribute)) {
                continue;
            }

            $values = [];

            foreach ($value_names as $value_name) {
                $value = $this->find_attribute_value($attribute->id, $value_name);

                if (!empty($value)) {
                    $values[] = $value->id;
                }
            }

            $payload[] = ['id' => $attribute->id, 'values' => $values];
        }

        return $payload;
    }

    /**
     * Build a variant's attribute value id list from names.
     *
     * @since 1.0.0
     *
     * @param array<string, string> $selection Value name keyed by attribute name.
     * @return int[] Attribute value ids.
     */
    protected function resolve_attribute_values(array $selection)
    {
        $ids = [];

        foreach ($selection as $attribute_name => $value_name) {
            $attribute = $this->find_attribute($attribute_name);

            if (empty($attribute)) {
                continue;
            }

            $value = $this->find_attribute_value($attribute->id, $value_name);

            if (!empty($value)) {
                $ids[] = $value->id;
            }
        }

        return $ids;
    }

    /**
     * Find an attribute by the slug of its name.
     *
     * @since 1.0.0
     *
     * @param string $name The attribute name.
     * @return Attribute|null
     */
    protected function find_attribute($name)
    {
        return Attribute::query()->where('slug', Str::slug($name))->first();
    }

    /**
     * Find a value of an attribute by its label.
     *
     * @since 1.0.0
     *
     * @param int    $attribute_id The owning attribute id.
     * @param string $value        The value name.
     * @return AttributeValue|null
     */
    protected function find_attribute_value($attribute_id, $value)
    {
        return AttributeValue::query()
            ->where('attribute_id', $attribute_id)
            ->where('value', $value)
            ->first();
    }

    /**
     * Import several bundled images, skipping any that fail.
     *
     * @since 1.0.0
     *
     * @param string[] $filenames Bundled image filenames.
     * @return int[] Attachment ids, in the given order.
     */
    protected function import_many(array $filenames)
    {
        $ids = [];

        foreach ($filenames as $filename) {
            $id = $this->import($filename);

            if ($id) {
                $ids[] = $id;
            }
        }

        return $ids;
    }

    /**
     * Import a bundled image, reusing the attachment if it was already imported.
     *
     * @since 1.0.0
     *
     * @param string $filename The bundled image filename.
     * @return int|null Attachment ID, or null when the import failed.
     */
    protected function import($filename)
    {
        if (!array_key_exists($filename, $this->attachments)) {
            $this->attachments[$filename] = $this->importer->import($this->bundled_images_path() . '/' . $filename);
        }

        if (empty($this->attachments[$filename])) {
            $this->media_complete = false;
        }

        return $this->attachments[$filename];
    }

    /**
     * Get the directory holding the bundled product images.
     *
     * @since 1.0.0
     *
     * @return string Absolute directory path.
     */
    protected function bundled_images_path()
    {
        return KIRKI_ECOMMERCE_ASSETS_PATH . '/images/products';
    }

    /**
     * Reclaim the bundled product images once they live in the media library.
     *
     * Only on an installed production plugin: in development the plugin directory
     * is the repository working tree, and the images are the source of truth
     * there. Skipped when anything failed to import, so a later run can still
     * read the source files.
     *
     * @since 1.0.0
     *
     * @return void
     */
    protected function cleanup_bundled_images()
    {
        if (!$this->media_complete) {
            return;
        }

        if (!defined('KIRKI_ECOMMERCE_MODE') || 'production' !== KIRKI_ECOMMERCE_MODE) {
            return;
        }

        $directory = $this->bundled_images_path();

        if (!is_dir($directory)) {
            return;
        }

        foreach (glob($directory . '/*') ?: [] as $file) {
            if (is_file($file)) {
                wp_delete_file($file);
            }
        }

        global $wp_filesystem;

        if (empty($wp_filesystem)) {
            require_once ABSPATH . '/wp-admin/includes/file.php';
            WP_Filesystem();
        }

        $wp_filesystem->rmdir($directory);

        Log::info('OnBoarding ProductSeeder removed the bundled product images');
    }
}
