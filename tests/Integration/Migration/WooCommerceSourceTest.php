<?php

namespace Kirki\Ecommerce\Tests\Integration\Migration;

use Kirki\Ecommerce\App\Migration\Core\MigrationRunner;
use Kirki\Ecommerce\App\Migration\Core\SourceRegistry;
use Kirki\Ecommerce\App\Migration\Sources\WooCommerce\Probe\ExtensionDetector;
use Kirki\Ecommerce\App\Migration\Sources\WooCommerce\Probe\StorageProbe;
use Kirki\Ecommerce\App\Migration\Sources\WooCommerce\WooCommerceDatabase;
use Kirki\Ecommerce\App\Migration\Sources\WooCommerce\WooCommerceSource;
use Kirki\Ecommerce\Tests\Support\Migration\BuildsWooCommerceFixtures;
use Kirki\Ecommerce\Tests\Support\RestTestCase;

/**
 * Covers WooCommerce detection, version and storage probes, extension detection and the scan.
 */
class WooCommerceSourceTest extends RestTestCase
{
    use BuildsWooCommerceFixtures;

    /**
     * Register the WooCommerce taxonomies.
     *
     * @return void
     */
    protected function setUp(): void
    {
        parent::setUp();

        $this->register_woo_taxonomies();
    }

    /**
     * Remove fixture tables and options.
     *
     * @return void
     */
    protected function tearDown(): void
    {
        $this->drop_woo_tables();

        parent::tearDown();
    }

    /**
     * No WooCommerce data means the source is not detected.
     *
     * @return void
     */
    public function test_not_installed_is_not_detected()
    {
        $this->assertFalse((new WooCommerceSource())->detect());
    }

    /**
     * An installed version at or above the minimum is supported, and a lower one is not.
     *
     * @return void
     */
    public function test_version_below_the_minimum_is_not_supported()
    {
        update_option('woocommerce_version', '6.9.4');
        $source = new WooCommerceSource();

        $this->assertTrue($source->detect());
        $this->assertFalse($source->version_state()['supported']);

        update_option('woocommerce_version', '8.2.1');

        $this->assertTrue($source->version_state()['supported']);
        $this->assertSame('7.0.0', $source->version_state()['minimum']);
    }

    /**
     * Detection works from the core tables alone, when the version option is gone.
     *
     * @return void
     */
    public function test_detected_from_core_tables_without_the_option()
    {
        $this->create_woo_tables(false);

        $this->assertTrue((new WooCommerceSource())->detect());
    }

    /**
     * The storage probe needs both the order tables and the setting.
     *
     * @return void
     */
    public function test_storage_probe_uses_the_table_and_the_setting()
    {
        $probe = new StorageProbe(new WooCommerceDatabase());

        $this->assertFalse($probe->uses_order_tables());

        $this->create_woo_tables();
        update_option('woocommerce_custom_orders_table_enabled', 'no');
        $this->assertFalse($probe->uses_order_tables());

        update_option('woocommerce_custom_orders_table_enabled', 'yes');
        $this->assertTrue($probe->uses_order_tables());
    }

    /**
     * The scan counts orders in the order tables when they are the source of truth.
     *
     * @return void
     */
    public function test_scan_counts_orders_in_the_order_tables()
    {
        update_option('woocommerce_version', '8.4.0');
        update_option('woocommerce_custom_orders_table_enabled', 'yes');
        $this->create_woo_tables();
        $this->insert_woo_row('wc_orders', ['id' => 101, 'status' => 'wc-completed', 'type' => 'shop_order']);
        $this->insert_woo_row('wc_orders', ['id' => 102, 'status' => 'wc-processing', 'type' => 'shop_order']);
        $this->insert_woo_row('wc_orders', ['id' => 103, 'status' => 'trash', 'type' => 'shop_order']);
        $this->insert_woo_row('wc_orders', ['id' => 104, 'status' => 'wc-completed', 'type' => 'shop_order_refund']);
        $this->woo_product(['post_type' => 'shop_order', 'post_status' => 'wc-completed']);

        $this->assertSame(2, $this->scanned_count('orders'));
    }

    /**
     * The scan counts orders in posts when the store uses legacy storage.
     *
     * @return void
     */
    public function test_scan_counts_orders_in_posts()
    {
        update_option('woocommerce_version', '7.5.0');
        update_option('woocommerce_custom_orders_table_enabled', 'no');
        $this->create_woo_tables();
        $this->woo_product(['post_type' => 'shop_order', 'post_status' => 'wc-completed']);
        $this->woo_product(['post_type' => 'shop_order', 'post_status' => 'wc-on-hold']);
        $this->woo_product(['post_type' => 'shop_order', 'post_status' => 'trash']);
        $this->woo_product(['post_type' => 'shop_order', 'post_status' => 'auto-draft']);
        $this->insert_woo_row('wc_orders', ['id' => 900, 'status' => 'wc-completed', 'type' => 'shop_order']);

        $this->assertSame(2, $this->scanned_count('orders'));
    }

    /**
     * The scan lists the catalog, customer and coupon groups with counts and leaves empty groups out.
     *
     * @return void
     */
    public function test_scan_lists_groups_with_counts_and_omits_empty_ones()
    {
        update_option('woocommerce_version', '8.4.0');
        $this->create_woo_tables(false);
        $parent = $this->woo_product(['post_title' => 'Shirt']);
        $this->woo_product(['post_title' => 'Shirt S', 'post_type' => 'product_variation', 'post_parent' => $parent]);
        $this->woo_product(['post_title' => 'Old', 'post_status' => 'trash']);
        $this->woo_product(['post_type' => 'shop_coupon', 'post_title' => 'SAVE10']);
        $this->woo_term('product_cat', 'Clothing');
        $this->woo_term('product_cat', 'Shirts');
        $this->insert_woo_row('woocommerce_attribute_taxonomies', ['attribute_name' => 'size', 'attribute_label' => 'Size']);
        $this->woo_customers(2);
        $this->woo_user_ids[] = self::factory()->user->create(['role' => 'subscriber']);

        $counts = $this->scanned_counts();

        $this->assertSame(1, $counts['products']);
        $this->assertSame(1, $counts['coupons']);
        $this->assertSame(2, $counts['customers']);
        $this->assertSame(1, $counts['attributes']);
        $this->assertSame(2, $counts['categories']);
        $this->assertArrayNotHasKey('tags', $counts);
        $this->assertArrayNotHasKey('brands', $counts);

        foreach ((new MigrationRunner(new SourceRegistry()))->scan(new WooCommerceSource())->groups as $group) {
            $this->assertNotSame('', $group['description'], $group['id']);
        }
        $this->assertArrayNotHasKey('orders', $counts);
    }

    /**
     * Known extensions are listed with their migration status.
     *
     * @return void
     */
    public function test_extensions_are_listed_with_status()
    {
        $detector = new class extends ExtensionDetector {
            protected function installed_folders()
            {
                return ['woocommerce', 'woocommerce-subscriptions', 'wordpress-seo', 'unrelated-plugin'];
            }
        };

        $found = (new WooCommerceSource(null, $detector))->extensions();

        $this->assertSame([
            ['slug' => 'woocommerce-subscriptions', 'label' => 'WooCommerce Subscriptions', 'status' => 'not_migrated'],
            ['slug' => 'wordpress-seo', 'label' => 'Yoast SEO', 'status' => 'supported'],
        ], $found);
    }

    /**
     * The scan endpoint refuses a version below the minimum.
     *
     * @return void
     */
    public function test_scan_endpoint_refuses_an_unsupported_version()
    {
        update_option('woocommerce_version', '6.0.0');

        $this->assertSame(422, $this->request('POST', 'migration/scan', ['source' => 'woocommerce'])->get_status());
    }

    /**
     * The WooCommerce source is registered through the sources filter.
     *
     * @return void
     */
    public function test_the_source_is_registered_through_the_filter()
    {
        $this->assertInstanceOf(WooCommerceSource::class, (new SourceRegistry())->get('woocommerce'));
    }

    /**
     * Scan WooCommerce and return the group counts keyed by group id.
     *
     * @return array<string, int>
     */
    protected function scanned_counts(): array
    {
        $result = (new MigrationRunner(new SourceRegistry()))->scan(new WooCommerceSource());

        return array_column($result->groups, 'count', 'id');
    }

    /**
     * Scan WooCommerce and return one group's count.
     *
     * @param string $group The group id.
     * @return int
     */
    protected function scanned_count(string $group): int
    {
        return $this->scanned_counts()[$group] ?? 0;
    }
}
