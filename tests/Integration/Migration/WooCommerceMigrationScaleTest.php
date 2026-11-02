<?php

namespace Kirki\Ecommerce\Tests\Integration\Migration;

use Kirki\Ecommerce\App\Migration\Constants\MigrationHookNames;
use Kirki\Ecommerce\App\Migration\Core\RecordLedger;
use Kirki\Ecommerce\App\Migration\Core\MigrationRunner;
use Kirki\Ecommerce\App\Migration\Core\SourceRegistry;
use Kirki\Ecommerce\App\Migration\Sources\WooCommerce\Groups\OrdersGroup;
use Kirki\Ecommerce\App\Migration\Sources\WooCommerce\WooCommerceSource;
use Kirki\Ecommerce\App\Models\Address;
use Kirki\Ecommerce\App\Models\Customer;
use Kirki\Ecommerce\App\Migration\Models\MigrationRecordLedger;
use Kirki\Ecommerce\App\Migration\Models\MigrationRun;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Models\OrderActivity;
use Kirki\Ecommerce\App\Models\OrderItem;
use Kirki\Ecommerce\App\Models\Product;
use Kirki\Ecommerce\Tests\Support\Migration\BuildsWooCommerceFixtures;
use Kirki\Ecommerce\Tests\Support\RestTestCase;
use Kirki\Ecommerce\Tests\Support\SeedsTestCurrency;
use RuntimeException;

/**
 * Runs a migration of a large store: 100 products and 1000 orders.
 */
class WooCommerceMigrationScaleTest extends RestTestCase
{
    use BuildsWooCommerceFixtures;
    use SeedsTestCurrency;

    protected const PRODUCTS = 100;
    protected const ORDERS = 1000;

    /** @var WooCommerceSource */
    protected $source;

    /** @var MigrationRunner */
    protected $runner;

    /** @var callable */
    protected $source_filter;

    /** @var int[] The WooCommerce product ids. */
    protected $product_ids = [];

    /**
     * Build the large store.
     *
     * @return void
     */
    protected function setUp(): void
    {
        parent::setUp();

        $this->register_woo_taxonomies();
        register_taxonomy('product_type', 'product');
        $this->purge();
        $this->seed_base_currency();
        update_option('woocommerce_version', '8.4.0');
        $this->create_woo_tables(false);
        $this->build_store();

        $this->source = new class extends WooCommerceSource {
            /** @var int|null Order id after which a read fails once. */
            public $fail_after = null;

            public function groups()
            {
                $groups = parent::groups();
                $failing = new class ($this->database, $this->storage, $this) extends OrdersGroup {
                    /** @var WooCommerceSource */
                    protected $owner;

                    public function __construct($database, $storage, $owner)
                    {
                        parent::__construct($database, $storage);
                        $this->owner = $owner;
                    }

                    protected function fetch(int $cursor, int $limit)
                    {
                        if ($this->owner->fail_after !== null && $cursor >= $this->owner->fail_after) {
                            $this->owner->fail_after = null;

                            throw new RuntimeException('The connection dropped');
                        }

                        return parent::fetch($cursor, $limit);
                    }
                };

                return array_map(function ($group) use ($failing) {
                    return $group->id() === 'orders' ? $failing : $group;
                }, $groups);
            }
        };
        $this->source_filter = function ($sources) {
            $sources[] = $this->source;

            return $sources;
        };
        add_filter(MigrationHookNames::SOURCES, $this->source_filter, 20);
        $this->runner = new MigrationRunner(new SourceRegistry());
    }

    /**
     * Remove everything the test created.
     *
     * @return void
     */
    protected function tearDown(): void
    {
        remove_filter(MigrationHookNames::SOURCES, $this->source_filter, 20);
        $this->purge();
        $this->drop_woo_tables();

        parent::tearDown();
    }

    /**
     * No request is bigger than a chunk, a failure in the middle resumes where it stopped, and a second run creates nothing.
     *
     * @return void
     */
    public function test_a_large_store_is_migrated_in_chunks_and_can_resume()
    {
        $scan = $this->runner->scan($this->source);
        $this->assertSame(static::PRODUCTS, array_column($scan->groups, 'count', 'id')['products']);
        $this->assertSame(static::ORDERS, array_column($scan->groups, 'count', 'id')['orders']);

        $first_order_id = min($this->order_ids());
        $this->source->fail_after = $first_order_id + 299;
        $run = $this->runner->start($this->source, ['products', 'orders']);
        $sizes = [];
        $failed = false;

        do {
            try {
                $progress = $this->runner->next_chunk($run);
                $sizes[] = $progress['range_to'] - $progress['range_from'] + 1;
            } catch (RuntimeException $e) {
                $failed = true;
                $saved = MigrationRun::find($run->id);
                $this->assertSame('failed', $saved->status);
                $this->assertSame($first_order_id + 299, $saved->groups['orders']['cursor']);
                $this->assertSame(300, $saved->groups['orders']['done']);
                $progress = ['done' => false];
            }
        } while (!$progress['done']);

        $this->assertTrue($failed, 'The forced failure happened.');
        $this->assertLessThanOrEqual(30, max($sizes));
        $this->assertSame(static::PRODUCTS, Product::query()->count());
        $this->assertSame(static::ORDERS, Order::query()->count());
        $this->assertSame(static::ORDERS, OrderItem::query()->count());
        $this->assertSame(0, MigrationRun::find($run->id)->groups['orders']['skipped']);
        $this->assertSame(1, Customer::query()->where('email', 'bulk@example.com')->count());

        $second = $this->runner->start($this->source, ['products', 'orders']);

        do {
            $progress = $this->runner->next_chunk($second);
        } while (!$progress['done']);

        $this->assertSame(static::PRODUCTS, Product::query()->count());
        $this->assertSame(static::ORDERS, Order::query()->count());
        $this->assertSame(static::ORDERS, $progress['groups']['orders']['reused']);
        $this->assertSame(0, $progress['groups']['orders']['created']);
    }

    /**
     * Get the WooCommerce order ids, keyed by id.
     *
     * @return array<int, int>
     */
    protected function order_ids(): array
    {
        global $wpdb;

        $ids = $wpdb->get_col("SELECT ID FROM {$wpdb->posts} WHERE post_type = 'shop_order' ORDER BY ID"); // phpcs:ignore WordPress.DB.DirectDatabaseQuery -- test fixture read.

        return array_combine($ids, $ids);
    }

    /**
     * Create the products and the orders with direct inserts, which is much faster than WordPress functions.
     *
     * @return void
     */
    protected function build_store(): void
    {
        global $wpdb;

        for ($i = 1; $i <= static::PRODUCTS; $i++) {
            $id = $this->woo_product(['post_title' => 'Product ' . $i], ['_regular_price' => '10', '_sku' => 'SKU-' . $i]);
            wp_set_object_terms($id, ['simple'], 'product_type');
            $this->product_ids[] = $id;
        }

        $now = '2022-01-02 03:04:05';

        for ($i = 1; $i <= static::ORDERS; $i++) {
            $wpdb->insert($wpdb->posts, [ // phpcs:ignore WordPress.DB.DirectDatabaseQuery -- test fixture row.
                'post_type' => 'shop_order', 'post_status' => 'wc-completed', 'post_title' => 'Order ' . $i, 'post_content' => '', 'post_excerpt' => '',
                'post_date' => $now, 'post_date_gmt' => $now, 'post_modified' => $now, 'post_modified_gmt' => $now, 'to_ping' => '', 'pinged' => '', 'post_content_filtered' => '',
            ]);
            $order_id = (int) $wpdb->insert_id;

            $meta = ['_order_total' => '11', '_order_tax' => '1', '_order_shipping' => '0', '_order_shipping_tax' => '0', '_cart_discount' => '0', '_cart_discount_tax' => '0', '_order_currency' => 'USD', '_prices_include_tax' => 'no', '_customer_user' => '0', '_billing_first_name' => 'Bulk', '_billing_last_name' => 'Buyer', '_billing_email' => 'bulk@example.com'];
            $values = [];

            foreach ($meta as $key => $value) {
                $values[] = $wpdb->prepare('(%d, %s, %s)', $order_id, $key, $value);
            }

            $wpdb->query("INSERT INTO {$wpdb->postmeta} (post_id, meta_key, meta_value) VALUES " . implode(',', $values)); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared, WordPress.DB.DirectDatabaseQuery -- test fixture rows.

            $item_id = $this->insert_woo_row('woocommerce_order_items', ['order_item_name' => 'Product', 'order_item_type' => 'line_item', 'order_id' => $order_id]);
            $item_meta = ['_product_id' => (string) $this->product_ids[$i % static::PRODUCTS], '_qty' => '1', '_line_subtotal' => '10', '_line_subtotal_tax' => '1', '_line_total' => '10', '_line_tax' => '1'];
            $values = [];

            foreach ($item_meta as $key => $value) {
                $values[] = $wpdb->prepare('(%d, %s, %s)', $item_id, $key, $value);
            }

            $wpdb->query("INSERT INTO {$wpdb->prefix}woocommerce_order_itemmeta (order_item_id, meta_key, meta_value) VALUES " . implode(',', $values)); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared, WordPress.DB.DirectDatabaseQuery -- test fixture rows.
        }
    }

    /**
     * Delete the Kirki rows the test created.
     *
     * @return void
     */
    protected function purge(): void
    {
        MigrationRun::query()->delete();
        MigrationRecordLedger::query()->delete();
        OrderActivity::query()->delete();
        Order::query()->delete();
        Product::query()->delete();
        Address::query()->delete();
        Customer::query()->delete();
        $this->purge_woo_content();
    }
}
