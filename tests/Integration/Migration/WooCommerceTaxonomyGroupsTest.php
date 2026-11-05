<?php

namespace Kirki\Ecommerce\Tests\Integration\Migration;

use Kirki\Ecommerce\App\Migration\Core\RecordLedger;
use Kirki\Ecommerce\App\Migration\Core\MigrationRunner;
use Kirki\Ecommerce\App\Migration\Core\SourceRegistry;
use Kirki\Ecommerce\App\Migration\Sources\WooCommerce\WooCommerceSource;
use Kirki\Ecommerce\App\Models\Attribute;
use Kirki\Ecommerce\App\Models\AttributeValue;
use Kirki\Ecommerce\App\Models\Brand;
use Kirki\Ecommerce\App\Models\Category;
use Kirki\Ecommerce\App\Migration\Models\MigrationRecordLedger;
use Kirki\Ecommerce\App\Migration\Models\MigrationRun;
use Kirki\Ecommerce\App\Models\Tag;
use Kirki\Ecommerce\Tests\Support\Migration\BuildsWooCommerceFixtures;
use Kirki\Ecommerce\Tests\Support\RestTestCase;

/**
 * Covers migrating WooCommerce categories, tags, brands and attributes.
 */
class WooCommerceTaxonomyGroupsTest extends RestTestCase
{
    use BuildsWooCommerceFixtures;

    /** @var MigrationRunner */
    protected $runner;

    /** @var WooCommerceSource */
    protected $source;

    /**
     * Set up WooCommerce fixtures and the runner.
     *
     * @return void
     */
    protected function setUp(): void
    {
        parent::setUp();

        $this->register_woo_taxonomies();
        $this->purge_kirki_rows();
        $this->purge_woo_content();
        update_option('woocommerce_version', '8.4.0');
        $this->create_woo_tables(false);

        $this->source = new WooCommerceSource();
        $this->runner = new MigrationRunner(new SourceRegistry());
    }

    /**
     * Remove created rows and fixtures.
     *
     * @return void
     */
    protected function tearDown(): void
    {
        $this->purge_kirki_rows();
        $this->purge_woo_content();
        $this->drop_woo_tables();

        parent::tearDown();
    }

    /**
     * Categories keep their parent, even when the parent has a higher term id than the child.
     *
     * @return void
     */
    public function test_categories_keep_their_parent_in_any_order()
    {
        $child_id = $this->woo_term('product_cat', 'Shirts');
        $parent_id = $this->woo_term('product_cat', 'Clothing');
        wp_update_term($child_id, 'product_cat', ['parent' => $parent_id]);

        $this->migrate(['categories']);

        $map = new RecordLedger('woocommerce');
        $child = Category::find($map->resolve('category', $child_id));
        $parent = Category::find($map->resolve('category', $parent_id));

        $this->assertSame((int) $parent->id, (int) $child->parent_id);
        $this->assertSame(2, (int) $child->level);
        $this->assertSame(2, MigrationRecordLedger::query()->where('entity', 'category')->count());
        $this->assertSame(2, Category::query()->count() - $this->kirki_default_categories());
    }

    /**
     * A category slug that Kirki already uses gets a suffix, and the report names it.
     *
     * @return void
     */
    public function test_category_slug_clash_gets_a_suffix_and_a_note()
    {
        Category::create(['name' => 'Clothing', 'slug' => 'clothing', 'level' => 1, 'is_active' => 1, 'is_deletable' => 1]);
        $term_id = $this->woo_term('product_cat', 'Clothing');

        $progress = $this->migrate(['categories']);

        $saved = Category::find((new RecordLedger('woocommerce'))->resolve('category', $term_id));
        $this->assertSame('clothing-2', $saved->slug);
        $this->assertStringContainsString('clothing-2', implode(' ', $progress['notes']));
        $this->assertSame('clothing', Category::query()->where('slug', 'clothing')->first()->slug, 'The existing category is unchanged.');
    }

    /**
     * Tags and brands are created with their names and descriptions.
     *
     * @return void
     */
    public function test_tags_and_brands_are_created()
    {
        $tag_id = $this->woo_term('product_tag', 'Summer');
        $brand_id = $this->woo_term('product_brand', 'Acme');

        $this->migrate(['tags', 'brands']);

        $map = new RecordLedger('woocommerce');
        $this->assertSame('Summer', Tag::find($map->resolve('tag', $tag_id))->name);
        $this->assertSame('Acme', Brand::find($map->resolve('brand', $brand_id))->name);
    }

    /**
     * A global attribute is created with its value terms, and each value is linked.
     *
     * @return void
     */
    public function test_attribute_is_created_with_its_values()
    {
        register_taxonomy('pa_size', 'product');
        $attribute_id = $this->insert_woo_row('woocommerce_attribute_taxonomies', ['attribute_name' => 'size', 'attribute_label' => 'Size']);
        $small = $this->woo_term('pa_size', 'Small');
        $large = $this->woo_term('pa_size', 'Large');

        $this->migrate(['attributes']);

        $map = new RecordLedger('woocommerce');
        $attribute = Attribute::find($map->resolve('attribute', $attribute_id));
        $this->assertSame('Size', $attribute->name);
        $this->assertSame(['Small', 'Large'], AttributeValue::query()->where('attribute_id', $attribute->id)->order_by('id')->pluck('value')->all());
        $this->assertSame('Large', AttributeValue::find($map->resolve('attribute_value', $large))->value);
        $this->assertNotNull($map->resolve('attribute_value', $small));
    }

    /**
     * Run a migration of the given groups to the end and return the last progress.
     *
     * @param string[] $groups The group ids.
     * @return array<string, mixed>
     */
    protected function migrate(array $groups): array
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
     * Delete the Kirki rows the migration creates, because the engine commits its own transactions.
     *
     * @return void
     */
    protected function purge_kirki_rows(): void
    {
        MigrationRun::query()->delete();
        MigrationRecordLedger::query()->delete();
        AttributeValue::query()->delete();
        Attribute::query()->delete();
        Brand::query()->delete();
        Tag::query()->delete();
        Category::query()->delete();
    }

    /**
     * Count the categories Kirki creates by itself, so tests can ignore them.
     *
     * @return int
     */
    protected function kirki_default_categories(): int
    {
        return Category::query()->count() - MigrationRecordLedger::query()->where('entity', 'category')->count();
    }
}
