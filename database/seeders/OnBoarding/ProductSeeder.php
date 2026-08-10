<?php

namespace Kirki\Ecommerce\Database\Seeders\OnBoarding;

use Kirki\Ecommerce\App\Actions\Product\CreateProductAction;
use Kirki\Ecommerce\App\Constants\Product\ProductStatus;
use Kirki\Ecommerce\App\DTO\Product\CreateProductDTO;
use Kirki\Ecommerce\App\DTO\Variant\CreateVariantDTO;
use Kirki\Ecommerce\App\Models\Attribute;
use Kirki\Ecommerce\App\Models\AttributeValue;
use Kirki\Ecommerce\App\Models\Category;
use Kirki\Ecommerce\App\Models\Currency;
use Kirki\Ecommerce\App\Models\Product;
use Kirki\Ecommerce\Framework\Database\Seeder;
use Kirki\Ecommerce\Framework\Supports\Facades\Log;
use Kirki\Ecommerce\Framework\Supports\Str;

use function Kirki\Ecommerce\Framework\app;

class ProductSeeder extends Seeder
{
    /**
     * Stock assigned to every seeded variant.
     */
    const STARTING_QUANTITY = 25;

    /**
     * @var MediaImporter
     */
    protected $importer;

    /**
     * Attachment ids keyed by bundled filename, so an image shared by a product
     * and one of its variants is imported once.
     *
     * @var array
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
     * @return void
     * @since 1.0.0
     */
    public function run(): void
    {
        if (Product::query()->exists()) {
            return;
        }

        $this->importer = new MediaImporter();
        $action = app()->make(CreateProductAction::class);
        $currency_id = $this->resolve_base_currency_id();

        foreach (OnBoardingCatalog::get_products() as $product) {
            $action->execute(
                $this->make_product_data($product, $currency_id),
                $this->make_variant_data($product)
            );
        }

        Log::info('OnBoarding ProductSeeder created the starter products');

        $this->cleanup_bundled_images();
    }

    /**
     * @param array    $product     Catalog entry.
     * @param int|null $currency_id The base currency id.
     *
     * @return CreateProductDTO
     * @since 1.0.0
     */
    protected function make_product_data(array $product, $currency_id)
    {
        $category_id = $this->resolve_category_id($product['category_path']);

        return CreateProductDTO::from_array([
            'title' => $product['title'],
            'slug' => Str::slug($product['title']),
            'status' => ProductStatus::PUBLISHED,
            'currency_id' => $currency_id,
            'short_description' => $product['short_description'],
            'description' => $product['description'],
            'seo_title' => $product['title'],
            'seo_description' => $product['short_description'],
            'media' => $this->import_many($product['media']),
            'categories' => $category_id ? [$category_id] : [],
            'attributes' => $this->resolve_attributes($product['attributes']),
        ]);
    }

    /**
     * @param array $product Catalog entry.
     *
     * @return CreateVariantDTO[]
     * @since 1.0.0
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
     * Resolve a category by walking its path, matching each name within its parent.
     *
     * Matching on name rather than slug because a repeated name is slugged with a
     * parent prefix, which the catalog paths do not carry.
     *
     * @param array $path Category names from the top level down.
     *
     * @return int|null
     * @since 1.0.0
     */
    protected function resolve_category_id(array $path)
    {
        $parent_id = null;

        foreach ($path as $index => $name) {
            $query = Category::query()->where('name', $name)->where('level', $index + 1);

            if ($parent_id) {
                $query->where('parent_id', $parent_id);
            }

            $category = $query->first();

            if (empty($category)) {
                Log::warning(sprintf('OnBoarding ProductSeeder could not resolve the category "%s"', $name));

                return null;
            }

            $parent_id = $category->id;
        }

        return $parent_id;
    }

    /**
     * Build the product's attribute payload from names.
     *
     * @param array $attributes Value names keyed by attribute name.
     *
     * @return array
     * @since 1.0.0
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
     * @param array $selection Value name keyed by attribute name.
     *
     * @return array
     * @since 1.0.0
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
     * @param string $name The attribute name.
     *
     * @return Attribute|null
     * @since 1.0.0
     */
    protected function find_attribute($name)
    {
        return Attribute::query()->where('slug', Str::slug($name))->first();
    }

    /**
     * @param int    $attribute_id The owning attribute id.
     * @param string $value        The value name.
     *
     * @return AttributeValue|null
     * @since 1.0.0
     */
    protected function find_attribute_value($attribute_id, $value)
    {
        return AttributeValue::query()
            ->where('attribute_id', $attribute_id)
            ->where('value', $value)
            ->first();
    }

    /**
     * @return int|null
     * @since 1.0.0
     */
    protected function resolve_base_currency_id()
    {
        $currency = Currency::query()->where('is_base', 1)->first();

        return !empty($currency) ? $currency->id : null;
    }

    /**
     * @param array $filenames Bundled image filenames.
     *
     * @return array Attachment ids, in the given order.
     * @since 1.0.0
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
     * @param string $filename The bundled image filename.
     *
     * @return int|null
     * @since 1.0.0
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
     * @return string
     * @since 1.0.0
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
     * @return void
     * @since 1.0.0
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
                unlink($file);
            }
        }

        rmdir($directory);

        Log::info('OnBoarding ProductSeeder removed the bundled product images');
    }
}
