<?php

namespace Kirki\Ecommerce\Database\Seeders;

use Kirki\Ecommerce\App\Actions\Product\CreateProductAction;
use Kirki\Ecommerce\App\Models\Attribute;
use Kirki\Ecommerce\App\Models\AttributeValue;
use Kirki\Ecommerce\App\Models\Category;
use Kirki\Ecommerce\Framework\Database\Seeder;
use Kirki\Ecommerce\App\DTO\Product\CreateProductDTO;
use Kirki\Ecommerce\App\DTO\Variant\CreateVariantDTO;
use Kirki\Ecommerce\Framework\Supports\Facades\Log;
use Kirki\Ecommerce\Framework\Supports\Str;

use function Kirki\Ecommerce\Framework\app;
use function Kirki\Ecommerce\Framework\collection;
use function Kirki\Ecommerce\Framework\faker;

/**
 * Seeds the curated product catalog with variants and generated placeholder images.
 *
 * @since 1.0.0
 */
class ProductSeeder extends Seeder
{
    /**
     * Names of the curated Color attribute values the product catalog rotates through.
     *
     * AttributeSeeder now creates its attributes from the Shopify-derived catalog, so
     * value ids are not known ahead of time - names are resolved to ids at run time by
     * resolve_attributes() instead of being hardcoded.
     *
     * @var string[]
     */
    protected $color_names = ['Black', 'Blue', 'Brown', 'Gray', 'Green', 'Navy', 'Red', 'White'];

    /**
     * Three-letter SKU code for each curated color, by name.
     *
     * @var array<string, string>
     */
    protected $color_code_by_name = [
        'Black' => 'BLK',
        'Blue' => 'BLU',
        'Brown' => 'BRN',
        'Gray' => 'GRY',
        'Green' => 'GRN',
        'Navy' => 'NVY',
        'Red' => 'RED',
        'White' => 'WHT',
    ];

    /**
     * Rotation of light/dark color-name pairs used by two-color variant schemes.
     *
     * Indexed by product position (mod count) so different products land on
     * different pairs instead of every product in a scheme sharing the same
     * two colors.
     *
     * @var array<int, array{0:string,1:string}>
     */
    protected $color_pair_rotation = [
        ['Black', 'Blue'],
        ['Brown', 'Gray'],
        ['Green', 'Navy'],
        ['Red', 'White'],
        ['Black', 'Navy'],
        ['Brown', 'Red'],
        ['Green', 'White'],
        ['Blue', 'Gray'],
    ];

    /**
     * Rotation of three-color name sets used by the accessory-color scheme.
     *
     * @var array<int, array{0:string,1:string,2:string}>
     */
    protected $color_triple_rotation = [
        ['Black', 'Green', 'Navy'],
        ['Brown', 'White', 'Blue'],
        ['Red', 'Gray', 'Navy'],
    ];

    /**
     * Names of the curated Size attribute values used for apparel variants.
     *
     * @var string[]
     */
    protected $size_names = ['Extra small (XS)', 'Small (S)', 'Medium (M)', 'Large (L)', 'Extra large (XL)', 'Double extra large (XXL)'];

    /**
     * The three Size values an 'apparel-size' product is sold in.
     *
     * @var string[]
     */
    protected $size_variant_names = ['Small (S)', 'Medium (M)', 'Large (L)'];

    /**
     * SKU code for each curated size, by name.
     *
     * @var array<string, string>
     */
    protected $size_code_by_name = [
        'Extra small (XS)' => 'XS',
        'Small (S)' => 'S',
        'Medium (M)' => 'M',
        'Large (L)' => 'L',
        'Extra large (XL)' => 'XL',
        'Double extra large (XXL)' => 'XXL',
    ];

    /**
     * Names of the curated Shoe size attribute values used for footwear variants.
     *
     * @var string[]
     */
    protected $shoe_size_names = ['7', '8', '9', '10', '11', '12'];

    /**
     * The three Shoe size values a 'footwear-size' product is sold in.
     *
     * @var string[]
     */
    protected $shoe_size_variant_names = ['9', '10', '11'];

    /**
     * Attribute id for the Color attribute, resolved at run time.
     *
     * @var int
     */
    protected $color_attribute_id;

    /**
     * Attribute id for the Size attribute, resolved at run time.
     *
     * @var int
     */
    protected $size_attribute_id;

    /**
     * Attribute id for the Shoe size attribute, resolved at run time.
     *
     * @var int
     */
    protected $shoe_size_attribute_id;

    /**
     * Curated Color attribute value ids, keyed by value name.
     *
     * @var array<string, int>
     */
    protected $color_value_ids = [];

    /**
     * Curated Size attribute value ids, keyed by value name.
     *
     * @var array<string, int>
     */
    protected $size_value_ids = [];

    /**
     * Curated Shoe size attribute value ids, keyed by value name.
     *
     * @var array<string, int>
     */
    protected $shoe_size_value_ids = [];

    /**
     * Category id, keyed by slug, resolved at run time.
     *
     * @var array<string, int>
     */
    protected $category_ids_by_slug = [];

    /**
     * Color attribute value labels, keyed by attribute value id.
     *
     * @var array<int, string>
     */
    protected $color_codes = [];

    /**
     * Color attribute hex values, keyed by attribute value id.
     *
     * Mirrors the swatches created by AttributeSeeder, so a variant's
     * generated placeholder image matches its actual Color attribute.
     *
     * @var array<int, string>
     */
    protected $color_hex = [];

    /**
     * Size attribute value labels, keyed by attribute value id.
     *
     * @var array<int, string>
     */
    protected $size_codes = [];

    /**
     * Shoe size attribute value labels, keyed by attribute value id.
     *
     * @var array<int, string>
     */
    protected $shoe_size_codes = [];

    /**
     * Generated placeholder image attachment ids, keyed by brand + label + color.
     *
     * Reused across every variant that shares the same brand, product type, and
     * color so a size range does not re-generate or re-upload the same photo.
     *
     * @var array<string, int|null>
     */
    protected $image_cache = [];

    /**
     * Seed products with deterministic catalog data.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function run(): void
    {
        $this->resolve_attributes();

        $faker = faker();
        $action = app()->make(CreateProductAction::class);

        foreach (SeedCatalog::get_products() as $index => $product) {
            $product_data = $this->make_product_data($faker, $product, $index);
            $variant_data = $this->make_variant_list_data($faker, $product, $index);
            $action->execute($product_data, $variant_data);
        }

        Log::info('ProductSeeder run successfully');
    }

    /**
     * Resolve the Color/Size/Shoe size attribute and value ids the curated catalog rotates
     * through, and every category id by slug.
     *
     * AttributeSeeder and CategorySeeder create these from the Shopify-derived catalog, so
     * their ids are not known ahead of time - this resolves them once by name/slug instead
     * of assuming a fixed insert order.
     *
     * @since 1.0.0
     *
     * @return void
     */
    protected function resolve_attributes(): void
    {
        $color = Attribute::query()->where('slug', 'color')->first();
        $size = Attribute::query()->where('slug', 'size')->first();
        $shoe_size = Attribute::query()->where('slug', 'shoe-size')->first();

        $this->color_attribute_id = $color->id;
        $this->size_attribute_id = $size->id;
        $this->shoe_size_attribute_id = $shoe_size->id;

        $this->color_value_ids = $color->values()->where_in('value', $this->color_names)->pluck('id', 'value')->all();
        $this->size_value_ids = $size->values()->where_in('value', $this->size_names)->pluck('id', 'value')->all();
        $this->shoe_size_value_ids = $shoe_size->values()->where_in('value', $this->shoe_size_names)->pluck('id', 'value')->all();

        foreach ($this->color_value_ids as $name => $id) {
            $this->color_codes[$id] = $this->color_code_by_name[$name];
        }

        foreach ($this->size_value_ids as $name => $id) {
            $this->size_codes[$id] = $this->size_code_by_name[$name];
        }

        foreach ($this->shoe_size_value_ids as $name => $id) {
            $this->shoe_size_codes[$id] = $name;
        }

        $this->color_hex = AttributeValue::query()->where_in('id', array_values($this->color_value_ids))->pluck('color', 'id')->all();

        $this->category_ids_by_slug = Category::query()->pluck('id', 'slug')->all();
    }

    /**
     * Resolve the attribute value combinations for a variant scheme.
     *
     * Each combination is a list of attribute value ids. A 'none' scheme
     * yields a single empty combination, producing exactly one variant
     * with no attribute values.
     *
     * @since 1.0.0
     *
     * @param string $variant_scheme Variant scheme key.
     * @param int    $product_index  Position of the product in the catalog, used to
     *                               rotate which colors this product is sold in.
     * @return int[][] Attribute value id combinations, one per variant.
     */
    protected function get_combinations($variant_scheme, $product_index = 0)
    {
        switch ($variant_scheme) {
            case 'apparel-size':
                [$color_a, $color_b] = $this->get_color_pair($product_index);
                $combinations = [];
                foreach ([$color_a, $color_b] as $color) {
                    foreach ($this->size_variant_names as $size_name) {
                        $combinations[] = [$color, $this->size_value_ids[$size_name]];
                    }
                }
                return $combinations;

            case 'footwear-size':
                [$color_a, $color_b] = $this->get_color_pair($product_index);
                $combinations = [];
                foreach ([$color_a, $color_b] as $color) {
                    foreach ($this->shoe_size_variant_names as $shoe_size_name) {
                        $combinations[] = [$color, $this->shoe_size_value_ids[$shoe_size_name]];
                    }
                }
                return $combinations;

            case 'accessory-color':
                return collection($this->get_color_triple($product_index))
                    ->map(fn($color) => [$color])
                    ->all();

            default:
                return [[]];
        }
    }

    /**
     * Resolve the product-level attribute definitions for a variant scheme.
     *
     * @since 1.0.0
     *
     * @param string $variant_scheme Variant scheme key.
     * @param int    $product_index  Position of the product in the catalog, used to
     *                               rotate which colors this product is sold in.
     * @return array<int, array<string, mixed>> Attribute definitions with an id and value ids.
     */
    protected function get_attributes_for_scheme($variant_scheme, $product_index = 0)
    {
        switch ($variant_scheme) {
            case 'apparel-size':
                return [
                    ['id' => $this->color_attribute_id, 'values' => $this->get_color_pair($product_index)],
                    ['id' => $this->size_attribute_id, 'values' => collection($this->size_variant_names)->map(fn($name) => $this->size_value_ids[$name])->all()],
                ];

            case 'footwear-size':
                return [
                    ['id' => $this->color_attribute_id, 'values' => $this->get_color_pair($product_index)],
                    ['id' => $this->shoe_size_attribute_id, 'values' => collection($this->shoe_size_variant_names)->map(fn($name) => $this->shoe_size_value_ids[$name])->all()],
                ];

            case 'accessory-color':
                return [
                    ['id' => $this->color_attribute_id, 'values' => $this->get_color_triple($product_index)],
                ];

            default:
                return [];
        }
    }

    /**
     * Rotate to a light/dark color-value-id pair for a two-color variant scheme.
     *
     * @since 1.0.0
     *
     * @param int $product_index Position of the product in the catalog.
     * @return array{0:int,1:int} Two color attribute value ids.
     */
    protected function get_color_pair($product_index)
    {
        $names = $this->color_pair_rotation[$product_index % count($this->color_pair_rotation)];

        return [$this->color_value_ids[$names[0]], $this->color_value_ids[$names[1]]];
    }

    /**
     * Rotate to a three-color-value-id set for the accessory-color scheme.
     *
     * @since 1.0.0
     *
     * @param int $product_index Position of the product in the catalog.
     * @return array{0:int,1:int,2:int} Three color attribute value ids.
     */
    protected function get_color_triple($product_index)
    {
        $names = $this->color_triple_rotation[$product_index % count($this->color_triple_rotation)];

        return collection($names)->map(fn($name) => $this->color_value_ids[$name])->all();
    }

    /**
     * Build product DTO data for seeding.
     *
     * @since 1.0.0
     *
     * @param \Faker\Generator     $faker         Faker instance.
     * @param array<string, mixed> $product       Product catalog entry.
     * @param int                  $product_index Position of the product in the catalog.
     * @return CreateProductDTO Product payload for the create action.
     */
    protected function make_product_data($faker, array $product, $product_index = 0)
    {
        $title = $product['title'];
        $slug = Str::slug($title);
        $brand_name = SeedCatalog::get_brand_name($product['brand_id']);
        $category_label = SeedCatalog::get_category_label($product['category_type']);

        $product_payload = [
            'title' => $title,
            'slug' => $slug,
            'status' => $product['status'],
            'ribbon' => $product['ribbon'],
            'currency_id' => 1,
            'brand_id' => $product['brand_id'],
            'description' => $this->make_description($product, $brand_name, $category_label),
            'additional_info' => $this->make_additional_info($product, $category_label),
            'seo_title' => $title . ' | Kirki Ecommerce',
            'seo_description' => 'Shop ' . $title . ' from ' . $brand_name . '. Free returns on ' . $category_label . '.',
            'seo_keywords' => collection($product['tags'])->map(function ($tag_id) {
                foreach (SeedCatalog::get_tags() as $tag) {
                    if ($tag['id'] === $tag_id) {
                        return $tag['slug'];
                    }
                }

                return null;
            })->filter(fn($slug) => $slug !== null)->values()->all(),
            'llm_instructions' => 'Recommend ' . $title . ' when customers ask about ' . $category_label . ' from ' . $brand_name . '.',
            'has_variants' => $product['variant_scheme'] !== 'none',
            'media' => $this->make_product_media($product, $brand_name, $product_index),
            'categories' => collection($product['categories'])->map(fn($slug) => $this->category_ids_by_slug[$slug])->all(),
            'tags' => $product['tags'],
            'collections' => $this->make_collections($product),
            'attributes' => $this->get_attributes_for_scheme($product['variant_scheme'], $product_index),
        ];

        return CreateProductDTO::from_array($product_payload);
    }

    /**
     * Build the product gallery: one generated photo per color the product is sold in.
     *
     * @since 1.0.0
     *
     * @param array  $product       Product catalog entry.
     * @param string $brand_name    Brand name.
     * @param int    $product_index Position of the product in the catalog.
     * @return int[] Unique attachment IDs of the generated photos.
     */
    protected function make_product_media(array $product, $brand_name, $product_index = 0)
    {
        $combinations = $this->get_combinations($product['variant_scheme'], $product_index);
        $media = [];

        foreach ($combinations as $values) {
            $media[] = $this->get_or_create_variant_image($values, $product, $brand_name);
        }

        return collection($media)->filter()->unique()->values()->all();
    }

    /**
     * Resolve collection ids for a product based on its gender and pricing.
     *
     * @since 1.0.0
     *
     * @param array $product Product catalog entry.
     * @return int[] Collection IDs.
     */
    protected function make_collections(array $product)
    {
        $gender_to_collection = [
            'men' => 3,
            'women' => 4,
            'kids' => 5,
            'unisex' => 6,
        ];

        $collections = [$gender_to_collection[$product['gender']] ?? 6];

        if ($product['sale_price'] !== null) {
            $collections[] = 7;
        }

        return $collections;
    }

    /**
     * Build product description from catalog entry.
     *
     * @since 1.0.0
     *
     * @param array  $product        Product catalog entry.
     * @param string $brand_name     Brand name.
     * @param string $category_label Category label.
     * @return string Product description text.
     */
    protected function make_description(array $product, $brand_name, $category_label)
    {
        if (!empty($product['flagship'])) {
            return $product['title'] . ' delivers flagship performance from ' . $brand_name
                . '. Designed for customers who want the best in ' . $category_label
                . ' with premium build quality and the latest features.';
        }

        return $product['title'] . ' — available from ' . $brand_name
            . '. Shop the latest in ' . $category_label . ' with fast shipping and easy returns.';
    }

    /**
     * Build additional info rows based on product category type.
     *
     * @since 1.0.0
     *
     * @param array  $product        Product catalog entry.
     * @param string $category_label Category label.
     * @return array<int, array<string, string>> Rows with title and description.
     */
    protected function make_additional_info(array $product, $category_label)
    {
        $info_by_type = [
            'tops' => [
                ['title' => 'Care Instructions', 'description' => 'Machine wash cold. Tumble dry low.'],
                ['title' => 'Fit', 'description' => 'True to size. Refer to the size chart before ordering.'],
            ],
            'bottoms' => [
                ['title' => 'Care Instructions', 'description' => 'Machine wash cold with like colors.'],
                ['title' => 'Fit', 'description' => 'True to size with slight stretch for comfort.'],
            ],
            'outerwear' => [
                ['title' => 'Care Instructions', 'description' => 'Spot clean or dry clean as directed on the label.'],
                ['title' => 'Fit', 'description' => 'Designed for a comfortable, layered fit.'],
            ],
            'dresses' => [
                ['title' => 'Care Instructions', 'description' => 'Hand wash cold or dry clean.'],
                ['title' => 'Fit', 'description' => 'True to size. Runs slightly fitted at the waist.'],
            ],
            'footwear' => [
                ['title' => 'Sizing', 'description' => 'True to size. Order half a size up if between sizes.'],
                ['title' => 'Care', 'description' => 'Wipe clean with a soft, damp cloth.'],
            ],
            'kids' => [
                ['title' => 'Care Instructions', 'description' => 'Machine wash cold. Tumble dry low.'],
                ['title' => 'Safety', 'description' => 'Meets child safety clothing standards.'],
            ],
            'accessories' => [
                ['title' => 'Materials', 'description' => 'Crafted from premium, durable materials.'],
                ['title' => 'Care', 'description' => 'Store in a dry place away from direct sunlight.'],
            ],
        ];

        return $info_by_type[$product['category_type']] ?? [
            ['title' => 'Details', 'description' => 'Quality ' . $category_label . ' product.'],
        ];
    }

    /**
     * Build the SKU suffix label for a variant combination.
     *
     * @since 1.0.0
     *
     * @param array  $values         Attribute value ids for the combination.
     * @param string $variant_scheme Variant scheme key.
     * @return string Label such as 'BLS-M', or 'STD' when no combination applies.
     */
    protected function make_variant_label(array $values, $variant_scheme)
    {
        if (empty($values)) {
            return 'STD';
        }

        if ($variant_scheme === 'accessory-color') {
            return $this->color_codes[$values[0]] ?? 'STD';
        }

        $color_code = $this->color_codes[$values[0]] ?? 'STD';

        if ($variant_scheme === 'footwear-size') {
            return $color_code . '-' . ($this->shoe_size_codes[$values[1]] ?? 'STD');
        }

        return $color_code . '-' . ($this->size_codes[$values[1]] ?? 'STD');
    }

    /**
     * Resolve the swatch hex color for a variant combination.
     *
     * Combinations that carry a color attribute value use its real hex.
     * Combinations with no color attribute (the 'none' scheme) fall back to
     * the product's curated accent color.
     *
     * @since 1.0.0
     *
     * @param array $values  Attribute value ids for the combination.
     * @param array $product Product catalog entry.
     * @return string Hex color.
     */
    protected function resolve_swatch_color(array $values, array $product)
    {
        if (!empty($values) && isset($this->color_hex[$values[0]])) {
            return $this->color_hex[$values[0]];
        }

        return $product['accent_color'] ?? '#333333';
    }

    /**
     * Get (or generate) the placeholder photo attachment for a variant combination.
     *
     * @since 1.0.0
     *
     * @param array  $values     Attribute value ids for the combination.
     * @param array  $product    Product catalog entry.
     * @param string $brand_name Brand name.
     * @return int|null Attachment ID, or null when generation failed.
     */
    protected function get_or_create_variant_image(array $values, array $product, $brand_name)
    {
        $hex = $this->resolve_swatch_color($values, $product);
        $cache_key = $brand_name . '|' . $product['image_label'] . '|' . $hex;

        if (isset($this->image_cache[$cache_key])) {
            return $this->image_cache[$cache_key];
        }

        $attachment_id = $this->generate_placeholder_attachment($brand_name, $product['image_label'], $hex);
        $this->image_cache[$cache_key] = $attachment_id;

        return $attachment_id;
    }

    /**
     * Render a color-swatched placeholder photo and register it in the media library.
     *
     * Real product photography can't be sourced for seed data, so this renders a
     * simple, original placeholder card: the product's actual variant color as the
     * background with the brand and product type printed on top. It is registered
     * through the same wp_insert_attachment flow WordPress uses for any upload.
     *
     * @since 1.0.0
     *
     * @param string $brand_name Brand name to print on the card.
     * @param string $label      Product type label to print on the card.
     * @param string $hex        Background color, e.g. '#1F2A44'.
     * @return int|null The attachment id, or null if generation or upload failed.
     */
    protected function generate_placeholder_attachment($brand_name, $label, $hex)
    {
        if (!function_exists('imagecreatetruecolor')) {
            Log::warning('ProductSeeder could not generate a placeholder image: the GD extension is not installed.');
            return null;
        }

        $bytes = $this->render_placeholder_image($brand_name, $label, $hex);

        if (empty($bytes)) {
            Log::warning('ProductSeeder failed to render a placeholder image for ' . $brand_name . ' ' . $label . '.');
            return null;
        }

        $filename = sanitize_file_name(strtolower($brand_name . '-' . $label . '-' . ltrim($hex, '#'))) . '.jpg';
        $upload = wp_upload_bits($filename, null, $bytes);

        if (!empty($upload['error']) || empty($upload['file'])) {
            Log::warning('ProductSeeder could not write placeholder upload for ' . $filename . ': ' . ($upload['error'] ?? 'unknown error'));
            return null;
        }

        $filetype = wp_check_filetype($filename, null);

        $attachment_id = wp_insert_attachment([
            'post_mime_type' => $filetype['type'] ?? 'image/jpeg',
            'post_title' => $brand_name . ' ' . $label,
            'post_content' => '',
            'post_status' => 'inherit',
        ], $upload['file']);

        if (is_wp_error($attachment_id)) {
            Log::warning('ProductSeeder could not insert placeholder attachment for ' . $filename . ': ' . $attachment_id->get_error_message());
            return null;
        }

        if (empty($attachment_id)) {
            Log::warning('ProductSeeder wp_insert_attachment returned no id for ' . $filename . '.');
            return null;
        }

        require_once ABSPATH . 'wp-admin/includes/image.php';

        wp_update_attachment_metadata(
            $attachment_id,
            wp_generate_attachment_metadata($attachment_id, $upload['file'])
        );

        return (int) $attachment_id;
    }

    /**
     * Render a placeholder product card as JPEG bytes using GD.
     *
     * Text is drawn at a quarter of the final size and scaled up, since GD's
     * built-in bitmap font has a single fixed size — scaling is what makes the
     * label readable at 800x800 without shipping a bundled font file.
     *
     * @since 1.0.0
     *
     * @param string $brand_name Brand name to print on the card.
     * @param string $label      Product type label to print on the card.
     * @param string $hex        Background color, e.g. '#1F2A44'.
     * @return string|null Raw JPEG bytes, or null on failure.
     */
    protected function render_placeholder_image($brand_name, $label, $hex)
    {
        $scale = 4;
        $width = 200;
        $height = 200;

        $canvas = imagecreatetruecolor($width, $height);

        if (!$canvas) {
            return null;
        }

        [$r, $g, $b] = $this->hex_to_rgb($hex);
        $background = imagecolorallocate($canvas, $r, $g, $b);
        imagefill($canvas, 0, 0, $background);

        $text_color = $this->contrasting_color($canvas, $r, $g, $b);
        $font = 5;
        $font_width = imagefontwidth($font);
        $font_height = imagefontheight($font);

        $brand_text = strtoupper($brand_name);
        $label_text = strtoupper($label);

        $this->draw_centered_string($canvas, $font, $brand_text, $width, ($height / 2) - $font_height - 4, $font_width, $text_color);
        $this->draw_centered_string($canvas, $font, $label_text, $width, ($height / 2) + 4, $font_width, $text_color);

        imagerectangle($canvas, 6, 6, $width - 7, $height - 7, $text_color);

        $final = imagecreatetruecolor($width * $scale, $height * $scale);
        imagecopyresampled($final, $canvas, 0, 0, 0, 0, $width * $scale, $height * $scale, $width, $height);
        imagedestroy($canvas);

        ob_start();
        imagejpeg($final, null, 85);
        $bytes = ob_get_clean();
        imagedestroy($final);

        return $bytes ?: null;
    }

    /**
     * Draw a horizontally centered string with GD's built-in bitmap font.
     *
     * @since 1.0.0
     *
     * @param \GdImage $canvas       Target image.
     * @param int      $font         GD built-in font identifier.
     * @param string   $text         Text to draw.
     * @param int      $canvas_width Canvas width in pixels.
     * @param float    $y            Vertical position in pixels.
     * @param int      $font_width   Width of a single character for the chosen font.
     * @param int      $color        Allocated GD color identifier.
     * @return void
     */
    protected function draw_centered_string($canvas, $font, $text, $canvas_width, $y, $font_width, $color)
    {
        $x = (int) round(($canvas_width - strlen($text) * $font_width) / 2);
        imagestring($canvas, $font, max($x, 2), (int) round($y), $text, $color);
    }

    /**
     * Pick a readable text color (near-black or near-white) for a background color.
     *
     * @since 1.0.0
     *
     * @param \GdImage $canvas Target image.
     * @param int      $r      Background red channel.
     * @param int      $g      Background green channel.
     * @param int      $b      Background blue channel.
     * @return int Allocated GD color identifier.
     */
    protected function contrasting_color($canvas, $r, $g, $b)
    {
        $luminance = (0.299 * $r + 0.587 * $g + 0.114 * $b);

        return $luminance > 150
            ? imagecolorallocate($canvas, 25, 25, 25)
            : imagecolorallocate($canvas, 245, 245, 245);
    }

    /**
     * Convert a '#RRGGBB' hex color into an [r, g, b] triple.
     *
     * @since 1.0.0
     *
     * @param string $hex Hex color, e.g. '#1F2A44'.
     * @return int[] Red, green and blue channels.
     */
    protected function hex_to_rgb($hex)
    {
        $hex = ltrim($hex, '#');

        return [
            hexdec(substr($hex, 0, 2)),
            hexdec(substr($hex, 2, 2)),
            hexdec(substr($hex, 4, 2)),
        ];
    }

    /**
     * Build variant data for a single combination.
     *
     * @since 1.0.0
     *
     * @param array            $values     Attribute value identifiers.
     * @param \Faker\Generator $faker      Faker instance.
     * @param array            $product    Product catalog entry.
     * @param string           $brand_name Brand name.
     * @param bool             $is_default Whether this variant is the product's default.
     * @return array<string, mixed> Variant fields for CreateVariantDTO.
     */
    protected function make_variant_data(array $values, $faker, array $product, $brand_name, $is_default)
    {
        $variant_scheme = $product['variant_scheme'];
        $variant_label = $this->make_variant_label($values, $variant_scheme);
        $sku_prefix = strtoupper(Str::slug($product['title']));
        $sale_price = $product['sale_price'] ?? $product['price'];
        $track_inventory = $variant_scheme !== 'none';
        $available_quantity = $track_inventory ? $faker->numberBetween(10, 100) : 0;

        return [
            'attribute_values' => $values,
            'media' => $this->get_or_create_variant_image($values, $product, $brand_name),
            'sku' => $sku_prefix . '-' . $variant_label,
            'barcode' => $faker->ean13(),
            'base_price' => $product['price'],
            'base_unit' => null,
            'base_unit_amount' => null,
            'total_unit' => null,
            'total_unit_amount' => null,
            'base_sale_price' => $sale_price,
            'base_cost_of_goods' => (int) round($product['price'] * 0.6),
            'weight' => $this->get_weight_for_category($product['category_type']),
            'weight_unit' => 'kg',
            'charge_taxes' => true,
            'track_inventory' => $track_inventory,
            'available_quantity' => $available_quantity,
            'in_stock' => $track_inventory ? $available_quantity > 0 : true,
            'has_limit_per_order' => false,
            'max_per_order' => null,
            'is_visible' => true,
            'is_physical_product' => true,
            'is_default' => $is_default,
        ];
    }

    /**
     * Resolve default weight (kg) by category type.
     *
     * @since 1.0.0
     *
     * @param string $category_type Category type key.
     * @return float Weight in kilograms.
     */
    protected function get_weight_for_category($category_type)
    {
        $weights = [
            'tops' => 0.3,
            'bottoms' => 0.5,
            'outerwear' => 0.9,
            'dresses' => 0.4,
            'footwear' => 1.0,
            'kids' => 0.25,
            'accessories' => 0.3,
        ];

        return $weights[$category_type] ?? 0.5;
    }

    /**
     * Build variant DTO list for a product.
     *
     * @since 1.0.0
     *
     * @param \Faker\Generator $faker         Faker instance.
     * @param array            $product       Product catalog entry.
     * @param int              $product_index Position of the product in the catalog.
     * @return CreateVariantDTO[] One variant DTO per combination; the first is the default.
     */
    protected function make_variant_list_data($faker, array $product, $product_index = 0)
    {
        $combinations = $this->get_combinations($product['variant_scheme'], $product_index);
        $brand_name = SeedCatalog::get_brand_name($product['brand_id']);

        return collection($combinations)->map(function ($values, $index) use ($faker, $product, $brand_name) {
            return CreateVariantDTO::from_array($this->make_variant_data($values, $faker, $product, $brand_name, $index === 0));
        })->all();
    }
}
