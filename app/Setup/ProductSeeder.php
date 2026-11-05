<?php

namespace Kirki\Ecommerce\App\Setup;

use Kirki\Ecommerce\App\Actions\Product\CreateProductAction;
use Kirki\Ecommerce\App\Constants\Product\ProductStatus;
use Kirki\Ecommerce\App\Constants\WeightUnit;
use Kirki\Ecommerce\App\DTO\Product\CreateProductDTO;
use Kirki\Ecommerce\App\DTO\Variant\CreateVariantDTO;
use Kirki\Ecommerce\App\Facades\Money;
use Kirki\Ecommerce\App\Models\Attribute;
use Kirki\Ecommerce\App\Models\AttributeValue;
use Kirki\Ecommerce\App\Models\Category;
use Kirki\Ecommerce\App\Models\Product;
use Kirki\Ecommerce\App\Models\Tag;
use Kirki\Ecommerce\App\Models\Variant;
use Kirki\Ecommerce\App\Setup\Presets\PresetRepository;
use Kirki\Ecommerce\Framework\Supports\Facades\Log;
use Throwable;

use function Kirki\Ecommerce\Framework\app;

defined('ABSPATH') || exit;

/**
 * Creates the sample categories, tags and products read from the preset location, with their images.
 *
 * @since 1.0.0
 */
class ProductSeeder
{
    /** @var MediaImporter */
    protected $importer;

    /** @var PresetRepository */
    protected $presets;

    /**
     * The product set that the sample data was read from; it names the image folder.
     *
     * @var string
     */
    protected $set = '';

    /**
     * Attachment ids keyed by image URL, so an image shared by a product and
     * one of its variants is downloaded once.
     *
     * @var array<string, int|null>
     */
    protected $attachments = [];

    /**
     * Create the seeder.
     *
     * @since 1.0.0
     *
     * @param MediaImporter    $importer Downloads the product images.
     * @param PresetRepository $presets  Builds the image URLs.
     */
    public function __construct(MediaImporter $importer, PresetRepository $presets)
    {
        $this->importer = $importer;
        $this->presets = $presets;
    }

    /**
     * Create the sample categories and tags, then each sample product the store does not have yet.
     *
     * A category or tag with the same slug is reused as it is. A product counts
     * as present when the store has a variant with one of its SKUs, so a load
     * that was cut off can run again. Each product is created on its own: one
     * that fails is logged and the next one still runs.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed>                $catalog     The products file with categories, tags, products and the `set` it was read from.
     * @param array<string, array<string, mixed>> $definitions Preset attribute definitions keyed by slug.
     * @return int The number of products created.
     */
    public function run(array $catalog, array $definitions)
    {
        $this->set = $catalog['set'];
        $category_ids = $this->ensure_categories($catalog['categories'] ?? []);
        $tag_ids = $this->ensure_tags($catalog['tags'] ?? []);
        $this->prefetch_images($catalog['products']);
        $action = app()->make(CreateProductAction::class);
        $created = 0;

        foreach ($catalog['products'] as $product) {
            try {
                if ($this->exists($product)) {
                    continue;
                }

                $this->ensure_attribute_values($product, $definitions);
                $action->execute($this->make_product_data($product, $category_ids, $tag_ids), $this->make_variant_data($product));
                $created++;
            } catch (Throwable $exception) {
                Log::error(sprintf('Sample data skipped the product %s: %s', $product['title'] ?? '', $exception->getMessage()));
            }
        }

        Log::info(sprintf('Sample data created %d products', $created));

        return $created;
    }

    /**
     * Find each sample category by slug, or create it under its parent.
     *
     * Categories are listed parents first, so a parent is always in the map
     * when its children are read. An existing category is not changed.
     *
     * @since 1.0.0
     *
     * @param array<int, array<string, mixed>> $categories Categories with slug, name and parent slug.
     * @return array<string, int> Category ids keyed by slug.
     */
    protected function ensure_categories(array $categories)
    {
        $found = [];

        foreach (array_values($categories) as $index => $node) {
            $slug = sanitize_title($node['slug'] ?? '');
            $name = sanitize_text_field($node['name'] ?? '');

            if ($slug === '' || $name === '') {
                continue;
            }

            $category = Category::query()->where('slug', $slug)->first();

            if (empty($category)) {
                $parent = $found[sanitize_title($node['parent'] ?? '')] ?? null;
                $category = Category::create([
                    'parent_id' => $parent ? $parent->id : null,
                    'name' => $name,
                    'slug' => $slug,
                    'level' => $parent ? $parent->level + 1 : 1,
                    'ordering' => $index + 1,
                    'is_active' => true,
                    'is_deletable' => true,
                    'created_by' => get_current_user_id() ?: null,
                ]);
            }

            $found[$slug] = $category;
        }

        return array_map(fn($category) => (int) $category->id, $found);
    }

    /**
     * Find each sample tag by slug, or create it.
     *
     * @since 1.0.0
     *
     * @param array<int, array<string, mixed>> $tags Tags with slug and name.
     * @return array<string, int> Tag ids keyed by slug.
     */
    protected function ensure_tags(array $tags)
    {
        $ids = [];

        foreach ($tags as $node) {
            $slug = sanitize_title($node['slug'] ?? '');
            $name = sanitize_text_field($node['name'] ?? '');

            if ($slug === '' || $name === '') {
                continue;
            }

            $tag = Tag::query()->where('slug', $slug)->first()
                ?? Tag::create(['name' => $name, 'slug' => $slug, 'created_by' => get_current_user_id() ?: null]);
            $ids[$slug] = (int) $tag->id;
        }

        return $ids;
    }

    /**
     * Download the images of every product that will be created, all at once.
     *
     * Products the store already has are left out. The attachments fill the
     * per-request cache that import() reads.
     *
     * @since 1.0.0
     *
     * @param array<int, array<string, mixed>> $products Sample products.
     * @return void
     */
    protected function prefetch_images(array $products)
    {
        $urls = [];

        foreach ($products as $product) {
            if ($this->exists($product)) {
                continue;
            }

            $filenames = array_merge($product['images'] ?? [], array_filter(array_column($product['variants'] ?? [], 'image')));

            foreach ($filenames as $filename) {
                $urls[] = $this->presets->get_image_url($this->set, $filename);
            }
        }

        $this->attachments = array_merge($this->attachments, $this->importer->import_urls($urls, $this->presets->get_base_url()));
    }

    /**
     * Check whether the store has a variant with one of the product's SKUs.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $product Sample product.
     * @return bool
     */
    protected function exists(array $product)
    {
        $skus = array_filter(array_column($product['variants'] ?? [], 'sku'));

        return !empty($skus) && Variant::query()->where_in('sku', $skus)->exists();
    }

    /**
     * Create the attributes and values the product's variants use and the store does not have.
     *
     * Each one is created from its preset definition. Existing attributes and
     * values are reused, never changed.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed>                $product     Sample product.
     * @param array<string, array<string, mixed>> $definitions Preset attribute definitions keyed by slug.
     * @return void
     */
    protected function ensure_attribute_values(array $product, array $definitions)
    {
        foreach ($product['variants'] as $variant) {
            foreach ($variant['options'] ?? [] as $slug => $value) {
                $definition = $definitions[$slug] ?? null;

                if (empty($definition)) {
                    continue;
                }

                $attribute = $this->find_attribute($slug);

                if (empty($attribute)) {
                    $attribute = Attribute::create([
                        'name' => sanitize_text_field($definition['name']),
                        'slug' => sanitize_title($definition['slug']),
                        'type' => $definition['type'],
                    ]);
                }

                if (!empty($this->find_attribute_value($attribute->id, $value))) {
                    continue;
                }

                $preset_values = array_column($definition['values'] ?? [], null, 'value');
                $row = ['value' => sanitize_text_field($value)];

                if (isset($preset_values[$value]['color'])) {
                    $row['color'] = sanitize_hex_color($preset_values[$value]['color']);
                }

                $attribute->values()->create($row);
            }
        }
    }

    /**
     * Build the create-product payload for a sample product.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $product      Sample product.
     * @param array<string, int>   $category_ids Category ids keyed by slug.
     * @param array<string, int>   $tag_ids      Tag ids keyed by slug.
     * @return CreateProductDTO Product payload for the create action.
     */
    protected function make_product_data(array $product, array $category_ids, array $tag_ids)
    {
        $media = [];

        foreach ($product['images'] ?? [] as $filename) {
            $id = $this->import($filename);

            if ($id) {
                $media[] = $id;
            }
        }

        return CreateProductDTO::from_array([
            'title' => $product['title'],
            'slug' => Product::generate_unique_slug($product['slug'] ?? $product['title']),
            'status' => ProductStatus::PUBLISHED,
            'ribbon' => $product['ribbon']['text'] ?? null,
            'ribbon_color' => $product['ribbon']['color'] ?? null,
            'short_description' => $product['short_description'],
            'description' => $product['description'],
            'seo_title' => $product['title'],
            'seo_description' => $product['short_description'],
            'media' => $media,
            'categories' => $this->pick_ids($category_ids, $product['categories'] ?? []),
            'tags' => $this->pick_ids($tag_ids, $product['tags'] ?? []),
            'attributes' => $this->resolve_attributes($product['variants']),
        ]);
    }

    /**
     * Build the variant payloads for a sample product.
     *
     * Prices are numbers in the store's base currency, with no conversion.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $product Sample product.
     * @return CreateVariantDTO[] One variant payload per sample variant.
     */
    protected function make_variant_data(array $product)
    {
        return array_map(function ($variant) {
            $max_per_order = $variant['max_per_order'] ?? null;
            $unit_price = $variant['unit_price'] ?? null;

            return CreateVariantDTO::from_array([
                'attribute_values' => $this->resolve_attribute_values($variant['options'] ?? []),
                'media' => !empty($variant['image']) ? $this->import($variant['image']) : null,
                'sku' => $variant['sku'],
                'base_price' => Money::to_minor($variant['price']),
                'base_sale_price' => $variant['sale_price'] !== null ? Money::to_minor($variant['sale_price']) : null,
                'base_cost_of_goods' => $variant['cost'] !== null ? Money::to_minor($variant['cost']) : null,
                'base_unit_amount' => $unit_price['base_amount'] ?? null,
                'base_unit' => $unit_price['base_unit'] ?? null,
                'total_unit_amount' => $unit_price['total_amount'] ?? null,
                'total_unit' => $unit_price['total_unit'] ?? null,
                'weight' => $variant['weight_g'],
                'weight_unit' => WeightUnit::GRAM,
                'charge_taxes' => true,
                'track_inventory' => true,
                'available_quantity' => (int) $variant['stock'],
                'low_stock_threshold' => $variant['low_stock_threshold'] ?? null,
                'allow_back_order' => (bool) ($variant['allow_back_order'] ?? false),
                'in_stock' => true,
                'has_limit_per_order' => $max_per_order !== null,
                'max_per_order' => $max_per_order,
                'is_visible' => true,
                'is_physical_product' => true,
                'is_default' => (bool) $variant['is_default'],
            ]);
        }, $product['variants']);
    }

    /**
     * Build the attribute payload from the options the variants use, in order of first use.
     *
     * @since 1.0.0
     *
     * @param array<int, array<string, mixed>> $variants Sample variants.
     * @return array<int, array<string, mixed>> Attributes with id and the ids of the values used.
     */
    protected function resolve_attributes(array $variants)
    {
        $axes = [];

        foreach ($variants as $variant) {
            foreach ($variant['options'] ?? [] as $slug => $value) {
                $axes[$slug][$value] = true;
            }
        }

        $payload = [];

        foreach ($axes as $slug => $values) {
            $attribute = $this->find_attribute($slug);

            if (empty($attribute)) {
                continue;
            }

            $value_ids = [];

            foreach (array_keys($values) as $value) {
                $model = $this->find_attribute_value($attribute->id, (string) $value);

                if (!empty($model)) {
                    $value_ids[] = $model->id;
                }
            }

            $payload[] = ['id' => $attribute->id, 'values' => $value_ids];
        }

        return $payload;
    }

    /**
     * Resolve a variant's options to attribute value ids.
     *
     * @since 1.0.0
     *
     * @param array<string, string> $options Values keyed by attribute slug.
     * @return int[]
     */
    protected function resolve_attribute_values(array $options)
    {
        $ids = [];

        foreach ($options as $slug => $value) {
            $attribute = $this->find_attribute($slug);
            $model = $attribute ? $this->find_attribute_value($attribute->id, $value) : null;

            if (!empty($model)) {
                $ids[] = $model->id;
            }
        }

        return $ids;
    }

    /**
     * Get the ids of the given slugs from a slug → id map. Slugs not in the map are left out.
     *
     * @since 1.0.0
     *
     * @param array<string, int> $ids   Ids keyed by slug.
     * @param string[]           $slugs Slugs from the sample product.
     * @return int[]
     */
    protected function pick_ids(array $ids, array $slugs)
    {
        return array_values(array_intersect_key($ids, array_flip(array_map('sanitize_title', $slugs))));
    }

    /**
     * Find an attribute by slug.
     *
     * @since 1.0.0
     *
     * @param string $slug Attribute slug.
     * @return Attribute|null
     */
    protected function find_attribute($slug)
    {
        return Attribute::query()->where('slug', $slug)->first();
    }

    /**
     * Find an attribute value by its label.
     *
     * @since 1.0.0
     *
     * @param int    $attribute_id Attribute ID.
     * @param string $value        Value label.
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
     * Download a product image once per request.
     *
     * @since 1.0.0
     *
     * @param string $filename Image filename.
     * @return int|null Attachment ID, or null when the import failed.
     */
    protected function import($filename)
    {
        $url = $this->presets->get_image_url($this->set, $filename);

        if (!array_key_exists($url, $this->attachments)) {
            $this->attachments[$url] = $this->importer->import_url($url, $this->presets->get_base_url());
        }

        return $this->attachments[$url];
    }
}
