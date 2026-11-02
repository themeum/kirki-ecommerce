<?php

namespace Kirki\Ecommerce\Tests\Integration\Migration;

use Kirki\Ecommerce\App\Migration\Constants\MigrationHookNames;
use Kirki\Ecommerce\App\Migration\Core\RecordLedger;
use Kirki\Ecommerce\App\Migration\Core\MigrationRunner;
use Kirki\Ecommerce\App\Migration\Core\SourceRegistry;
use Kirki\Ecommerce\App\Migration\Sources\WooCommerce\Probe\ExtensionDetector;
use Kirki\Ecommerce\App\Migration\Sources\WooCommerce\WooCommerceSource;
use Kirki\Ecommerce\App\Models\Attribute;
use Kirki\Ecommerce\App\Models\AttributeValue;
use Kirki\Ecommerce\App\Models\Brand;
use Kirki\Ecommerce\App\Models\Category;
use Kirki\Ecommerce\App\Migration\Models\MigrationRecordLedger;
use Kirki\Ecommerce\App\Migration\Models\MigrationRun;
use Kirki\Ecommerce\App\Models\Product;
use Kirki\Ecommerce\App\Models\Tag;
use Kirki\Ecommerce\App\Models\Variant;
use Kirki\Ecommerce\Tests\Support\Migration\BuildsWooCommerceFixtures;
use Kirki\Ecommerce\Tests\Support\RestTestCase;
use Kirki\Ecommerce\Tests\Support\SeedsTestCurrency;

/**
 * Covers migrating WooCommerce products and variations.
 */
class WooCommerceProductsGroupTest extends RestTestCase
{
    use BuildsWooCommerceFixtures;
    use SeedsTestCurrency;

    /** @var MigrationRunner */
    protected $runner;

    /** @var WooCommerceSource */
    protected $source;

    /** @var callable */
    protected $source_filter;

    /**
     * Set up WooCommerce fixtures and the runner.
     *
     * @return void
     */
    protected function setUp(): void
    {
        parent::setUp();

        $this->register_woo_taxonomies();
        register_taxonomy('product_type', 'product');
        register_taxonomy('pa_size', 'product');
        $this->purge();
        $this->seed_base_currency();
        update_option('woocommerce_version', '8.4.0');
        update_option('woocommerce_weight_unit', 'kg');
        $this->create_woo_tables(false);

        $this->source = $this->source_with(['wordpress-seo']);
        $this->source_filter = function ($sources) {
            $sources[] = $this->source;

            return $sources;
        };
        add_filter(MigrationHookNames::SOURCES, $this->source_filter, 20);
        $this->runner = new MigrationRunner(new SourceRegistry());
    }

    /**
     * Remove created rows and fixtures.
     *
     * @return void
     */
    protected function tearDown(): void
    {
        remove_filter(MigrationHookNames::SOURCES, $this->source_filter, 20);
        $this->purge();
        $this->drop_woo_tables();
        delete_option('woocommerce_weight_unit');

        parent::tearDown();
    }

    /**
     * A simple product becomes one product with one default variant carrying price, stock and SKU.
     *
     * @return void
     */
    public function test_simple_product_becomes_a_product_with_a_default_variant()
    {
        $image = self::factory()->attachment->create();
        $id = $this->simple_product('Mug', [
            '_sku' => 'MUG-1', '_regular_price' => '19.99', '_sale_price' => '14.50', '_manage_stock' => 'yes', '_stock' => '12',
            '_stock_status' => 'instock', '_backorders' => 'notify', '_weight' => '0.4', '_low_stock_amount' => '3',
            '_thumbnail_id' => (string) $image, '_tax_status' => 'taxable', '_sold_individually' => 'yes',
        ], ['post_content' => 'Long text', 'post_excerpt' => 'Short']);

        $this->migrate();

        $map = new RecordLedger('woocommerce');
        $product = Product::find($map->resolve('product', $id));
        $variant = Variant::query()->where('product_id', $product->id)->first();

        $this->assertSame('Mug', $product->title);
        $this->assertSame('published', $product->status);
        $this->assertSame('Long text', $product->description);
        $this->assertFalse((bool) $product->has_variants);
        $this->assertSame([$image], Product::find($product->id)->media()->get()->pluck('ID')->map('intval')->all());
        $this->assertSame('MUG-1', $variant->sku);
        $this->assertSame(1999, (int) $variant->base_price);
        $this->assertSame(1450, (int) $variant->base_sale_price);
        $this->assertTrue((bool) $variant->track_inventory);
        $this->assertSame(12, (int) $variant->available_quantity);
        $this->assertTrue((bool) $variant->allow_back_order);
        $this->assertSame(3, (int) $variant->low_stock_threshold);
        $this->assertSame('kg', $variant->weight_unit);
        $this->assertTrue((bool) $variant->has_limit_per_order);
        $this->assertTrue((bool) $variant->is_default);
        $this->assertSame((int) $variant->id, $map->resolve('variant', $id), 'A simple product links its default variant under its own source id.');
    }

    /**
     * A product keeps its category, tag and brand links from the earlier groups.
     *
     * @return void
     */
    public function test_product_links_to_migrated_categories_tags_and_brands()
    {
        $category = $this->woo_term('product_cat', 'Kitchen');
        $tag = $this->woo_term('product_tag', 'Gift');
        $brand = $this->woo_term('product_brand', 'Acme');
        $id = $this->simple_product('Pan', ['_regular_price' => '30']);
        wp_set_object_terms($id, [$category], 'product_cat');
        wp_set_object_terms($id, [$tag], 'product_tag');
        wp_set_object_terms($id, [$brand], 'product_brand');

        $this->migrate(['categories', 'tags', 'brands', 'products']);

        $map = new RecordLedger('woocommerce');
        $product = Product::with(['categories', 'tags'])->find($map->resolve('product', $id));

        $this->assertSame([$map->resolve('category', $category)], $product->categories->pluck('id')->map('intval')->all());
        $this->assertSame([$map->resolve('tag', $tag)], $product->tags->pluck('id')->map('intval')->all());
        $this->assertSame($map->resolve('brand', $brand), (int) $product->brand_id);
    }

    /**
     * A variable product becomes one product with a variant for each variation, using a global attribute.
     *
     * @return void
     */
    public function test_variable_product_with_a_global_attribute()
    {
        $attribute_id = $this->insert_woo_row('woocommerce_attribute_taxonomies', ['attribute_name' => 'size', 'attribute_label' => 'Size']);
        $small = $this->woo_term('pa_size', 'Small');
        $large = $this->woo_term('pa_size', 'Large');
        $id = $this->woo_product(['post_title' => 'Shirt'], [
            '_product_attributes' => ['pa_size' => ['name' => 'pa_size', 'value' => '', 'position' => 0, 'is_visible' => 1, 'is_variation' => 1, 'is_taxonomy' => 1]],
        ]);
        wp_set_object_terms($id, ['variable'], 'product_type');
        wp_set_object_terms($id, [$small, $large], 'pa_size');
        $this->woo_product(['post_title' => 'Shirt S', 'post_type' => 'product_variation', 'post_parent' => $id], ['_sku' => 'SH-S', '_regular_price' => '25', 'attribute_pa_size' => 'small', '_manage_stock' => 'no', '_stock_status' => 'instock']);
        $this->woo_product(['post_title' => 'Shirt L', 'post_type' => 'product_variation', 'post_parent' => $id], ['_sku' => 'SH-L', '_regular_price' => '27', 'attribute_pa_size' => 'large', '_manage_stock' => 'yes', '_stock' => '5', '_stock_status' => 'instock']);

        $this->migrate(['attributes', 'products']);

        $map = new RecordLedger('woocommerce');
        $product = Product::find($map->resolve('product', $id));
        $variants = Variant::query()->where('product_id', $product->id)->order_by('id')->get();
        $size = Attribute::find($map->resolve('attribute', $attribute_id));

        $this->assertTrue((bool) $product->has_variants);
        $this->assertCount(2, $variants);
        $this->assertSame(['SH-S', 'SH-L'], $variants->pluck('sku')->all());
        $this->assertSame([2500, 2700], $variants->pluck('base_price')->map('intval')->all());
        $this->assertTrue((bool) $variants[0]->is_default);
        $this->assertFalse((bool) $variants[1]->is_default);
        $this->assertSame(5, (int) $variants[1]->available_quantity);
        $this->assertSame('Size', $size->name);
        $this->assertSame([$map->resolve('attribute_value', $small)], $variants[0]->attribute_values()->get()->pluck('id')->map('intval')->all());
        $this->assertSame([$map->resolve('attribute_value', $large)], $variants[1]->attribute_values()->get()->pluck('id')->map('intval')->all());
        $this->assertSame((int) $variants[1]->id, $map->resolve('variant', $this->variation_id('Shirt L')));
    }

    /**
     * A product-level custom attribute creates a Kirki attribute by name and reuses it for the next product.
     *
     * @return void
     */
    public function test_custom_attribute_is_created_once_and_reused()
    {
        foreach (['Cap', 'Hat'] as $title) {
            $id = $this->woo_product(['post_title' => $title], [
                '_product_attributes' => ['color' => ['name' => 'Color', 'value' => 'Red | Blue', 'position' => 0, 'is_visible' => 1, 'is_variation' => 1, 'is_taxonomy' => 0]],
            ]);
            wp_set_object_terms($id, ['variable'], 'product_type');
            $this->woo_product(['post_type' => 'product_variation', 'post_parent' => $id], ['_regular_price' => '10', 'attribute_color' => 'Red']);
            $this->woo_product(['post_type' => 'product_variation', 'post_parent' => $id], ['_regular_price' => '10', 'attribute_color' => 'Blue']);
        }

        $this->migrate(['products']);

        $this->assertSame(1, Attribute::query()->where('name', 'Color')->count());
        $this->assertSame(2, AttributeValue::query()->count());
        $this->assertSame(2, Product::query()->count());
        $this->assertSame(4, Variant::query()->count());
    }

    /**
     * A product type Kirki cannot represent is skipped and reported, and the others are created.
     *
     * @return void
     */
    public function test_unsupported_type_is_skipped_and_reported()
    {
        $grouped = $this->woo_product(['post_title' => 'Bundle']);
        wp_set_object_terms($grouped, ['grouped'], 'product_type');
        $this->simple_product('Fine', ['_regular_price' => '5']);

        $this->migrate();

        $run = MigrationRun::query()->first();
        $this->assertSame(1, Product::query()->count());
        $this->assertSame($grouped, $run->skipped_items[0]['source_id']);
        $this->assertStringContainsString('grouped', $run->skipped_items[0]['reason']);
    }

    /**
     * A SKU that Kirki already uses is saved with a suffix, and the report names it.
     *
     * @return void
     */
    public function test_sku_clash_gets_a_suffix_and_a_note()
    {
        $existing = Product::create(['title' => 'Existing', 'slug' => 'existing', 'status' => 'draft', 'created_by' => get_current_user_id(), 'updated_by' => get_current_user_id()]);
        Variant::create(['product_id' => $existing->id, 'sku' => 'DUP-1', 'base_price' => 100, 'created_by' => get_current_user_id(), 'updated_by' => get_current_user_id()]);
        $id = $this->simple_product('Clash', ['_sku' => 'DUP-1', '_regular_price' => '9']);

        $progress = $this->migrate();

        $variant = Variant::find((new RecordLedger('woocommerce'))->resolve('variant', $id));
        $this->assertSame('DUP-1-2', $variant->sku);
        $this->assertStringContainsString('DUP-1-2', implode(' ', $progress['notes']));
        $this->assertSame('DUP-1', Variant::find(Variant::query()->where('product_id', $existing->id)->first()->id)->sku);
    }

    /**
     * Yoast SEO fields are copied, and a title that still has template variables is not.
     *
     * @return void
     */
    public function test_seo_fields_are_copied_from_yoast()
    {
        $with = $this->simple_product('Seo', ['_regular_price' => '1', '_yoast_wpseo_title' => 'Great Seo Title', '_yoast_wpseo_metadesc' => 'Great description']);
        $template = $this->simple_product('Template', ['_regular_price' => '1', '_yoast_wpseo_title' => '%%title%% %%sep%% %%sitename%%']);

        $this->migrate();

        $map = new RecordLedger('woocommerce');
        $this->assertSame('Great Seo Title', Product::find($map->resolve('product', $with))->seo_title);
        $this->assertSame('Great description', Product::find($map->resolve('product', $with))->seo_description);
        $this->assertNull(Product::find($map->resolve('product', $template))->seo_title);
    }

    /**
     * Trashed products and variations that are not live are left out, and private products become drafts.
     *
     * @return void
     */
    public function test_trashed_products_are_left_out_and_private_become_drafts()
    {
        $this->simple_product('Gone', ['_regular_price' => '1'], ['post_status' => 'trash']);
        $private = $this->simple_product('Hidden', ['_regular_price' => '1'], ['post_status' => 'private']);

        $progress = $this->migrate();

        $this->assertSame(1, Product::query()->count());
        $this->assertSame('draft', Product::find((new RecordLedger('woocommerce'))->resolve('product', $private))->status);
        $this->assertStringContainsString('private', implode(' ', $progress['notes']));
    }

    /**
     * The original creation date of the product is kept.
     *
     * @return void
     */
    public function test_original_dates_are_kept()
    {
        $id = $this->simple_product('Old', ['_regular_price' => '1'], ['post_date_gmt' => '2021-03-04 05:06:07', 'post_date' => '2021-03-04 05:06:07']);

        $this->migrate();

        $product = Product::find((new RecordLedger('woocommerce'))->resolve('product', $id));
        $this->assertSame('2021-03-04 05:06:07', $product->created_at->format('Y-m-d H:i:s'));
    }

    /**
     * Create a simple WooCommerce product.
     *
     * @param string               $title The title.
     * @param array<string, mixed> $meta  Product meta.
     * @param array<string, mixed> $post  Post fields.
     * @return int
     */
    protected function simple_product(string $title, array $meta = [], array $post = []): int
    {
        $id = $this->woo_product(array_merge(['post_title' => $title], $post), $meta);
        wp_set_object_terms($id, ['simple'], 'product_type');

        return $id;
    }

    /**
     * Get the post id of a variation by title.
     *
     * @param string $title The variation title.
     * @return int
     */
    protected function variation_id(string $title): int
    {
        return (int) get_posts(['post_type' => 'product_variation', 'title' => $title, 'post_status' => 'any', 'fields' => 'ids'])[0];
    }

    /**
     * Build a WooCommerce source with the named extensions installed.
     *
     * @param string[] $installed Plugin folder names.
     * @return WooCommerceSource
     */
    protected function source_with(array $installed): WooCommerceSource
    {
        $detector = new class ($installed) extends ExtensionDetector {
            /** @var string[] */
            protected $folders;

            public function __construct(array $folders)
            {
                $this->folders = $folders;
            }

            protected function installed_folders()
            {
                return $this->folders;
            }
        };

        return new WooCommerceSource(null, $detector);
    }

    /**
     * Run a migration of the given groups to the end and return the last progress with all notes.
     *
     * @param string[] $groups The group ids.
     * @return array<string, mixed>
     */
    protected function migrate(array $groups = ['products']): array
    {
        $run = $this->runner->start($this->source, $groups);
        $notes = [];

        do {
            $progress = $this->runner->next_chunk($run);
            $notes = array_merge($notes, $progress['notes']);
        } while (!$progress['done']);

        $progress['notes'] = $notes;

        return $progress;
    }

    /**
     * Delete the Kirki rows and WordPress content the test creates.
     *
     * @return void
     */
    protected function purge(): void
    {
        MigrationRun::query()->delete();
        MigrationRecordLedger::query()->delete();
        Product::query()->delete();
        AttributeValue::query()->delete();
        Attribute::query()->delete();
        Brand::query()->delete();
        Tag::query()->delete();
        Category::query()->delete();
        $this->purge_woo_content();

        foreach (get_posts(['post_type' => 'attachment', 'post_status' => 'any', 'numberposts' => -1, 'fields' => 'ids']) as $attachment_id) {
            wp_delete_post($attachment_id, true);
        }
    }
}
