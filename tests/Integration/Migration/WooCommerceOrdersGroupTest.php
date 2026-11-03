<?php

namespace Kirki\Ecommerce\Tests\Integration\Migration;

use Kirki\Ecommerce\App\Constants\Hooks\DevHookNames;
use Kirki\Ecommerce\App\Jobs\SendOrderMailJob;
use Kirki\Ecommerce\App\Migration\Core\RecordLedger;
use Kirki\Ecommerce\App\Migration\Core\MigrationRunner;
use Kirki\Ecommerce\App\Migration\Core\SourceRegistry;
use Kirki\Ecommerce\App\Migration\Sources\WooCommerce\Readers\HposOrderReader;
use Kirki\Ecommerce\App\Migration\Sources\WooCommerce\Readers\LegacyPostsOrderReader;
use Kirki\Ecommerce\App\Migration\Sources\WooCommerce\WooCommerceSource;
use Kirki\Ecommerce\App\Models\Address;
use Kirki\Ecommerce\App\Models\Attribute;
use Kirki\Ecommerce\App\Models\AttributeValue;
use Kirki\Ecommerce\App\Models\Coupon;
use Kirki\Ecommerce\App\Models\Customer;
use Kirki\Ecommerce\App\Migration\Models\MigrationRecordLedger;
use Kirki\Ecommerce\App\Migration\Models\MigrationRun;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Models\OrderActivity;
use Kirki\Ecommerce\App\Models\OrderCoupon;
use Kirki\Ecommerce\App\Models\OrderItem;
use Kirki\Ecommerce\App\Models\OrderTax;
use Kirki\Ecommerce\App\Models\Product;
use Kirki\Ecommerce\App\Models\Refund;
use Kirki\Ecommerce\App\Models\Variant;
use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\App\Supports\Facades\Settings;
use Kirki\Ecommerce\Framework\Queue\QueueFake;
use Kirki\Ecommerce\Framework\Queue\QueueManager;
use Kirki\Ecommerce\Framework\Supports\Facades\Queue;
use Kirki\Ecommerce\Tests\Support\Migration\BuildsWooCommerceFixtures;
use Kirki\Ecommerce\Tests\Support\RestTestCase;
use Kirki\Ecommerce\Tests\Support\SeedsTestCurrency;

/**
 * Covers migrating WooCommerce orders from both storage layouts.
 */
class WooCommerceOrdersGroupTest extends RestTestCase
{
    use BuildsWooCommerceFixtures;
    use SeedsTestCurrency;

    /** @var MigrationRunner */
    protected $runner;

    /** @var WooCommerceSource */
    protected $source;

    /** @var QueueFake */
    protected $queue;

    /** @var int Next order id for HPOS orders. */
    protected $next_hpos_id = 9000;

    /**
     * Set up WooCommerce fixtures, a fake queue and the runner.
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
        $this->create_woo_tables();

        $this->source = new WooCommerceSource();
        $this->runner = new MigrationRunner(new SourceRegistry());
        $this->queue = Queue::fake();
    }

    /**
     * Remove created rows and fixtures.
     *
     * @return void
     */
    protected function tearDown(): void
    {
        static::forget_singleton(QueueManager::class);
        $this->purge();
        $this->drop_woo_tables();

        parent::tearDown();
    }

    /**
     * A full order keeps its number, dates, status, amounts, lines, tax, coupon, note and refund.
     *
     * @return void
     */
    public function test_order_is_migrated_with_everything_that_belongs_to_it()
    {
        $user_id = $this->customer_user('buyer@example.com');
        $product = $this->simple_product('Mug', '20.00', 'MUG-1');
        $coupon = $this->woo_product(['post_type' => 'shop_coupon', 'post_title' => 'SAVE5'], ['discount_type' => 'fixed_cart', 'coupon_amount' => '5']);
        $order_id = $this->legacy_order($this->order_attributes(['customer_user_id' => $user_id]), [
            ['type' => 'line_item', 'name' => 'Mug', 'meta' => ['_product_id' => $product, '_variation_id' => 0, '_qty' => 2, '_line_subtotal' => '40', '_line_subtotal_tax' => '4', '_line_total' => '35', '_line_tax' => '3.5']],
            ['type' => 'shipping', 'name' => 'Flat rate', 'meta' => ['method_id' => 'flat_rate', 'cost' => '10', 'total_tax' => '1']],
            ['type' => 'tax', 'name' => 'VAT-1', 'meta' => ['label' => 'VAT', 'rate_percent' => '10', 'tax_amount' => '3.5', 'shipping_tax_amount' => '1']],
            ['type' => 'coupon', 'name' => 'SAVE5', 'meta' => ['discount_amount' => '5', 'discount_amount_tax' => '0.5']],
        ], [['content' => 'Packed it', 'customer' => false], ['content' => 'Your parcel is on the way', 'customer' => true]], [['amount' => '10', 'reason' => 'Damaged']]);

        $this->migrate(['products', 'customers', 'coupons', 'orders']);

        $map = new RecordLedger('woocommerce');
        $order = Order::find($map->resolve('order', $order_id));

        $this->assertSame(str_pad((string) $order_id, 6, '0', STR_PAD_LEFT), $order->order_number);
        $this->assertSame('paid_unfulfilled', $order->order_status);
        $this->assertSame('paid', $order->payment_status);
        $this->assertSame('unfulfilled', $order->fulfillment_status);
        $this->assertSame('USD', $order->currency_code);
        $this->assertSame(4000, (int) $order->invoiced_subtotal);
        $this->assertSame(500, (int) $order->invoiced_discount_total);
        $this->assertSame(1100, (int) $order->invoiced_shipping_total);
        $this->assertSame(100, (int) $order->invoiced_shipping_tax_amount);
        $this->assertSame(450, (int) $order->invoiced_tax_total);
        $this->assertSame(4950, (int) $order->invoiced_total);
        $this->assertSame(4950, (int) $order->base_total);
        $this->assertSame(2, (int) $order->items_count);
        $this->assertSame('flat_rate', $order->shipping_method);
        $this->assertSame('TX-1', $order->payment_transaction_id);
        $this->assertSame('2021-05-06 07:08:09', (string) $order->created_at);
        $this->assertSame('2021-05-06 08:00:00', (string) $order->paid_at);
        $this->assertSame('Leave at the door', $order->order_notes);
        $this->assertSame('Ada', $order->billing_first_name);
        $this->assertSame('12 Elm St', $order->shipping_address_line1);
        $this->assertSame($map->resolve('customer', $user_id), (int) $order->customer_id);

        $item = OrderItem::query()->where('order_id', $order->id)->first();
        $this->assertSame($map->resolve('product', $product), (int) $item->product_id);
        $this->assertSame($map->resolve('variant', $product), (int) $item->variant_id);
        $this->assertSame('MUG-1', $item->sku);
        $this->assertSame(2, (int) $item->quantity);
        $this->assertSame(2000, (int) $item->invoiced_price);
        $this->assertSame(4000, (int) $item->invoiced_subtotal);
        $this->assertSame(500, (int) $item->invoiced_discount_amount);
        $this->assertSame(350, (int) $item->invoiced_tax_total);
        $this->assertSame(3850, (int) $item->invoiced_total);

        $this->assertSame([[350, 'product'], [100, 'shipping']], OrderTax::query()->where('order_id', $order->id)->order_by('id')->get()->map(function ($tax) {
            return [(int) $tax->invoiced_amount, $tax->type];
        })->all());

        $order_coupon = OrderCoupon::query()->where('order_id', $order->id)->first();
        $this->assertSame($map->resolve('coupon', $coupon), (int) $order_coupon->coupon_id);
        $this->assertSame(500, (int) $order_coupon->invoiced_discount_amount);

        $notes = OrderActivity::query()->where('order_id', $order->id)->order_by('id')->get();
        $this->assertSame(['Packed it', 'Your parcel is on the way'], $notes->pluck('description')->all());
        $this->assertTrue($notes[1]->metadata['is_customer_note']);
        $this->assertArrayNotHasKey('notify_customer', $notes[1]->metadata);

        $refund = Refund::query()->where('order_id', $order->id)->first();
        $this->assertSame(1000, (int) $refund->invoiced_amount);
        $this->assertSame('partial', $refund->refund_type);
        $this->assertSame('completed', $refund->status);
        $this->assertTrue((bool) $order->is_refund_initiated);
    }

    /**
     * The order number follows the order number prefix and suffix of the general settings.
     *
     * @return void
     */
    public function test_order_number_uses_the_prefix_and_suffix_of_the_general_settings()
    {
        $settings = Settings::get(OptionKeys::GENERAL_SETTINGS)->refresh();
        $previous = $settings->to_array()['order_number'] ?? [];
        $settings->set(['order_number' => ['prefix' => 'KE-', 'suffix' => '-W']], false);

        try {
            $order_id = $this->legacy_order($this->order_attributes([]), [], [], []);
            $this->migrate(['orders']);
            $order = Order::find((new RecordLedger('woocommerce'))->resolve('order', $order_id));
        } finally {
            Settings::get(OptionKeys::GENERAL_SETTINGS)->refresh()->set(['order_number' => $previous], false);
        }

        $this->assertSame('KE-' . str_pad((string) $order_id, 6, '0', STR_PAD_LEFT) . '-W', $order->order_number);
    }

    /**
     * Importing orders sends no mail, because no event is fired.
     *
     * @return void
     */
    public function test_importing_an_order_queues_no_mail()
    {
        $placed = did_action(DevHookNames::ORDER_PLACED);

        $this->legacy_order($this->order_attributes(['status' => 'wc-completed']), [], [['content' => 'Note', 'customer' => true]], []);

        $this->migrate(['orders']);

        $this->assertSame(1, Order::query()->count());
        $this->assertSame([], $this->queue->pushed(SendOrderMailJob::class));
        $this->assertSame($placed, did_action(DevHookNames::ORDER_PLACED));
    }

    /**
     * A product line and a variation line link to the migrated product and variant.
     *
     * @return void
     */
    public function test_variation_line_links_to_the_migrated_variant()
    {
        $parent = $this->woo_product(['post_title' => 'Cap'], ['_product_attributes' => ['color' => ['name' => 'Color', 'value' => 'Red | Blue', 'position' => 0, 'is_visible' => 1, 'is_variation' => 1, 'is_taxonomy' => 0]]]);
        wp_set_object_terms($parent, ['variable'], 'product_type');
        $red = $this->woo_product(['post_type' => 'product_variation', 'post_parent' => $parent], ['_regular_price' => '9', 'attribute_color' => 'Red', '_sku' => 'CAP-R']);
        $this->woo_product(['post_type' => 'product_variation', 'post_parent' => $parent], ['_regular_price' => '9', 'attribute_color' => 'Blue', '_sku' => 'CAP-B']);
        $order_id = $this->legacy_order($this->order_attributes([]), [
            ['type' => 'line_item', 'name' => 'Cap - Red', 'meta' => ['_product_id' => $parent, '_variation_id' => $red, '_qty' => 1, '_line_subtotal' => '9', '_line_subtotal_tax' => '0', '_line_total' => '9', '_line_tax' => '0']],
        ], [], []);

        $this->migrate(['products', 'orders']);

        $map = new RecordLedger('woocommerce');
        $item = OrderItem::query()->where('order_id', $map->resolve('order', $order_id))->first();
        $this->assertSame($map->resolve('variant', $red), (int) $item->variant_id);
        $this->assertSame('CAP-R', Variant::find($item->variant_id)->sku);
    }

    /**
     * A coupon line links to the coupon the migration made, even when its code was changed because Kirki already had it.
     *
     * @return void
     */
    public function test_coupon_line_links_to_the_renamed_coupon()
    {
        Coupon::create(['title' => 'SAVE5', 'code' => 'SAVE5', 'discount_type' => 'amount_off_order', 'discount_target' => 'order', 'discount_value_type' => 'fixed_amount', 'eligible_item_type' => 'all_products', 'is_active' => true]);
        $coupon = $this->woo_product(['post_type' => 'shop_coupon', 'post_title' => 'SAVE5'], ['discount_type' => 'fixed_cart', 'coupon_amount' => '5']);
        $order_id = $this->legacy_order($this->order_attributes([]), [
            ['type' => 'coupon', 'name' => 'SAVE5', 'meta' => ['discount_amount' => '5', 'discount_amount_tax' => '0']],
        ], [], []);

        $this->migrate(['coupons', 'orders']);

        $map = new RecordLedger('woocommerce');
        $order_coupon = OrderCoupon::query()->where('order_id', $map->resolve('order', $order_id))->first();
        $this->assertSame($map->resolve('coupon', $coupon), (int) $order_coupon->coupon_id);
        $this->assertSame('SAVE5-2', Coupon::find($order_coupon->coupon_id)->code);
    }

    /**
     * A line that points to a product that is not in Kirki is saved with its name and SKU, and reported.
     *
     * @return void
     */
    public function test_unresolved_product_line_is_saved_without_a_link_and_reported()
    {
        $order_id = $this->legacy_order($this->order_attributes([]), [
            ['type' => 'line_item', 'name' => 'Old thing', 'meta' => ['_product_id' => 777777, '_qty' => 1, '_line_subtotal' => '8', '_line_subtotal_tax' => '0', '_line_total' => '8', '_line_tax' => '0']],
        ], [], []);

        $progress = $this->migrate(['orders']);

        $item = OrderItem::query()->where('order_id', (new RecordLedger('woocommerce'))->resolve('order', $order_id))->first();
        $this->assertNull($item->product_id);
        $this->assertNull($item->variant_id);
        $this->assertSame('Old thing', $item->product_name);
        $this->assertStringContainsString('not in Kirki', implode(' ', $progress['notes']));
    }

    /**
     * Guest orders with the same email share one guest customer.
     *
     * @return void
     */
    public function test_guest_orders_share_one_customer()
    {
        $this->legacy_order($this->order_attributes(['customer_user_id' => 0]), [], [], []);
        $this->legacy_order($this->order_attributes(['customer_user_id' => 0]), [], [], []);

        $this->migrate(['orders']);

        $this->assertSame(2, Order::query()->count());
        $this->assertSame(1, Customer::query()->where('email', 'buyer@example.com')->count());
        $this->assertSame(1, Order::query()->distinct()->get(['customer_id'])->count());
        $this->assertNull(Customer::query()->where('email', 'buyer@example.com')->first()->user_id);
    }

    /**
     * Every WooCommerce status maps to Kirki statuses, and an unknown one is saved as pending and reported.
     *
     * @return void
     */
    public function test_statuses_are_mapped()
    {
        $expected = [
            'wc-pending' => ['pending', 'unpaid', 'unfulfilled'],
            'wc-processing' => ['paid_unfulfilled', 'paid', 'unfulfilled'],
            'wc-on-hold' => ['on_hold_unpaid', 'unpaid', 'on-hold'],
            'wc-completed' => ['completed', 'paid', 'delivered'],
            'wc-cancelled' => ['unpaid_cancelled', 'unpaid', 'cancelled'],
            'wc-refunded' => ['refunded', 'refunded', 'cancelled'],
            'wc-failed' => ['failed_unfulfilled', 'failed', 'unfulfilled'],
        ];
        $ids = [];

        foreach (array_keys($expected) as $status) {
            $ids[$status] = $this->legacy_order($this->order_attributes(['status' => $status, 'date_paid' => null]), [], [], []);
        }

        $this->migrate(['orders']);

        $map = new RecordLedger('woocommerce');

        foreach ($expected as $status => $kirki) {
            $order = Order::find($map->resolve('order', $ids[$status]));
            $this->assertSame($kirki, [$order->order_status, $order->payment_status, $order->fulfillment_status], $status);
            $this->assertContains($order->payment_status, ['paid', 'unpaid', 'failed', 'refunding', 'refunded'], $status);
        }
    }

    /**
     * An order of a status that Kirki does not know is saved as pending and the report says so. A draft cart is not an order.
     *
     * @return void
     */
    public function test_unknown_status_is_saved_as_pending_and_reported()
    {
        $custom = $this->legacy_order($this->order_attributes(['status' => 'wc-courier']), [], [], []);
        $this->legacy_order($this->order_attributes(['status' => 'wc-checkout-draft']), [], [], []);

        $progress = $this->migrate(['orders']);

        $order = Order::find((new RecordLedger('woocommerce'))->resolve('order', $custom));
        $this->assertSame('pending', $order->order_status);
        $this->assertSame(1, Order::query()->count());
        $this->assertStringContainsString('wc-courier', implode(' ', $progress['notes']));
    }

    /**
     * Both storage layouts give the same mapped data for the same order.
     *
     * @return void
     */
    public function test_both_layouts_read_the_same_order()
    {
        $items = [
            ['type' => 'line_item', 'name' => 'Mug', 'meta' => ['_product_id' => 55, '_qty' => 1, '_line_subtotal' => '20', '_line_subtotal_tax' => '2', '_line_total' => '20', '_line_tax' => '2']],
            ['type' => 'shipping', 'name' => 'Post', 'meta' => ['method_id' => 'flat_rate', 'cost' => '5', 'total_tax' => '0.5']],
        ];
        $notes = [['content' => 'Hello', 'customer' => false]];
        $refunds = [['amount' => '3', 'reason' => 'Late']];

        $legacy_id = $this->legacy_order($this->order_attributes([]), $items, $notes, $refunds);
        $legacy = (new LegacyPostsOrderReader())->orders(0, 10);
        $this->purge_woo_content();
        $this->woo_delete_items();

        $hpos_id = $this->hpos_order($this->order_attributes([]), $items, $notes, $refunds);
        $hpos = (new HposOrderReader())->orders(0, 10);

        $this->assertCount(1, $legacy);
        $this->assertCount(1, $hpos);
        $this->assertSame($legacy_id, $legacy[0]['id']);
        $this->assertSame($hpos_id, $hpos[0]['id']);
        $this->assertEquals($this->without_ids($legacy[0]), $this->without_ids($hpos[0]));
    }

    /**
     * An HPOS order is migrated end to end.
     *
     * @return void
     */
    public function test_hpos_order_is_migrated()
    {
        update_option('woocommerce_custom_orders_table_enabled', 'yes');
        $order_id = $this->hpos_order($this->order_attributes([]), [
            ['type' => 'line_item', 'name' => 'Mug', 'meta' => ['_product_id' => 55, '_qty' => 3, '_line_subtotal' => '30', '_line_subtotal_tax' => '0', '_line_total' => '30', '_line_tax' => '0']],
        ], [['content' => 'From HPOS', 'customer' => false]], [['amount' => '49.50', 'reason' => '']]);

        $progress = $this->migrate(['orders']);

        $order = Order::find((new RecordLedger('woocommerce'))->resolve('order', $order_id));
        $this->assertSame(3, (int) $order->items_count);
        $this->assertSame('Ada', $order->billing_first_name);
        $this->assertSame(1, OrderActivity::query()->where('order_id', $order->id)->count());
        $this->assertSame('full', Refund::query()->where('order_id', $order->id)->first()->refund_type);
        $this->assertSame(1, $progress['groups']['orders']['created']);
    }

    /**
     * A fee line is saved as a line item, and the order currency that is not the store currency is reported.
     *
     * @return void
     */
    public function test_fee_line_and_foreign_currency_are_reported()
    {
        $this->legacy_order($this->order_attributes(['currency' => 'EUR']), [
            ['type' => 'fee', 'name' => 'Gift wrap', 'meta' => ['_line_total' => '3', '_line_tax' => '0']],
        ], [], []);

        $progress = $this->migrate(['orders']);

        $notes = implode(' ', $progress['notes']);
        $this->assertStringContainsString('Gift wrap', $notes);
        $this->assertStringContainsString('EUR', $notes);
        $this->assertSame('Gift wrap', OrderItem::query()->first()->product_name);
        $this->assertSame('EUR', Order::query()->first()->currency_code);
    }

    /**
     * Create a simple WooCommerce product.
     *
     * @param string $title The title.
     * @param string $price The regular price.
     * @param string $sku   The SKU.
     * @return int
     */
    protected function simple_product(string $title, string $price, string $sku): int
    {
        $id = $this->woo_product(['post_title' => $title], ['_regular_price' => $price, '_sku' => $sku]);
        wp_set_object_terms($id, ['simple'], 'product_type');

        return $id;
    }

    /**
     * Get the attributes of a typical order, with overrides.
     *
     * @param array<string, mixed> $override Values to change.
     * @return array<string, mixed>
     */
    protected function order_attributes(array $override): array
    {
        return array_merge([
            'status' => 'wc-processing',
            'currency' => 'USD',
            'customer_user_id' => 0,
            'order_total' => '49.50',
            'cart_tax' => '3.5',
            'shipping_total' => '10',
            'shipping_tax' => '1',
            'discount_total' => '5',
            'discount_tax' => '0.5',
            'prices_include_tax' => 'no',
            'payment_method' => 'paypal',
            'payment_method_title' => 'PayPal',
            'transaction_id' => 'TX-1',
            'customer_note' => 'Leave at the door',
            'date_created' => '2021-05-06 07:08:09',
            'date_modified' => '2021-05-07 07:08:09',
            'date_paid' => '2021-05-06 08:00:00',
            'date_completed' => '2021-05-08 08:00:00',
            'billing' => ['first_name' => 'Ada', 'last_name' => 'Lovelace', 'company' => '', 'address_1' => '1 Main St', 'address_2' => '', 'city' => 'Austin', 'state' => 'TX', 'postcode' => '73301', 'country' => 'US', 'email' => 'buyer@example.com', 'phone' => '555-0100'],
            'shipping' => ['first_name' => 'Ada', 'last_name' => 'Lovelace', 'company' => '', 'address_1' => '12 Elm St', 'address_2' => '', 'city' => 'Dallas', 'state' => 'TX', 'postcode' => '75001', 'country' => 'US', 'email' => '', 'phone' => ''],
        ], $override);
    }

    /**
     * Create an order in post storage, with items, notes and refunds.
     *
     * @param array<string, mixed>             $order   The order attributes.
     * @param array<int, array<string, mixed>> $items   The order items: type, name and meta.
     * @param array<int, array<string, mixed>> $notes   The notes: content and customer.
     * @param array<int, array<string, mixed>> $refunds The refunds: amount and reason.
     * @return int
     */
    protected function legacy_order(array $order, array $items, array $notes, array $refunds): int
    {
        $meta = [
            '_order_total' => $order['order_total'], '_order_tax' => $order['cart_tax'], '_order_shipping' => $order['shipping_total'],
            '_order_shipping_tax' => $order['shipping_tax'], '_cart_discount' => $order['discount_total'], '_cart_discount_tax' => $order['discount_tax'],
            '_order_currency' => $order['currency'], '_prices_include_tax' => $order['prices_include_tax'], '_customer_user' => $order['customer_user_id'],
            '_payment_method' => $order['payment_method'], '_payment_method_title' => $order['payment_method_title'], '_transaction_id' => $order['transaction_id'],
            '_date_paid' => $order['date_paid'] ? strtotime($order['date_paid'] . ' UTC') : '',
            '_date_completed' => $order['date_completed'] ? strtotime($order['date_completed'] . ' UTC') : '',
        ];

        foreach (['billing', 'shipping'] as $purpose) {
            foreach ($order[$purpose] as $field => $value) {
                $meta['_' . $purpose . '_' . $field] = $value;
            }
        }

        $id = $this->woo_product([
            'post_type' => 'shop_order', 'post_status' => $order['status'], 'post_title' => 'Order', 'post_excerpt' => $order['customer_note'],
            'post_date' => $order['date_created'], 'post_date_gmt' => $order['date_created'], 'post_modified' => $order['date_modified'], 'post_modified_gmt' => $order['date_modified'],
        ], $meta);

        $this->add_items($id, $items);
        $this->add_notes($id, $notes);

        foreach ($refunds as $refund) {
            $this->woo_product(['post_type' => 'shop_order_refund', 'post_parent' => $id, 'post_status' => 'wc-completed', 'post_title' => 'Refund', 'post_date_gmt' => '2021-06-01 00:00:00'], ['_refund_amount' => $refund['amount'], '_refund_reason' => $refund['reason']]);
        }

        return $id;
    }

    /**
     * Create an order in the order tables, with items, notes and refunds.
     *
     * @param array<string, mixed>             $order   The order attributes.
     * @param array<int, array<string, mixed>> $items   The order items: type, name and meta.
     * @param array<int, array<string, mixed>> $notes   The notes: content and customer.
     * @param array<int, array<string, mixed>> $refunds The refunds: amount and reason.
     * @return int
     */
    protected function hpos_order(array $order, array $items, array $notes, array $refunds): int
    {
        $id = $this->next_hpos_id++;

        $this->insert_woo_row('wc_orders', [
            'id' => $id, 'status' => $order['status'], 'currency' => $order['currency'], 'type' => 'shop_order',
            'tax_amount' => (string) $order['cart_tax'], 'total_amount' => $order['order_total'],
            'customer_id' => $order['customer_user_id'], 'billing_email' => $order['billing']['email'], 'date_created_gmt' => $order['date_created'],
            'date_updated_gmt' => $order['date_modified'], 'payment_method' => $order['payment_method'], 'payment_method_title' => $order['payment_method_title'],
            'transaction_id' => $order['transaction_id'], 'customer_note' => $order['customer_note'],
        ]);
        $this->insert_woo_row('wc_order_operational_data', [
            'order_id' => $id, 'prices_include_tax' => $order['prices_include_tax'] === 'yes' ? 1 : 0, 'date_paid_gmt' => $order['date_paid'], 'date_completed_gmt' => $order['date_completed'],
            'shipping_tax_amount' => $order['shipping_tax'], 'shipping_total_amount' => $order['shipping_total'], 'discount_tax_amount' => $order['discount_tax'], 'discount_total_amount' => $order['discount_total'],
        ]);

        foreach (['billing', 'shipping'] as $purpose) {
            $this->insert_woo_row('wc_order_addresses', array_merge(['order_id' => $id, 'address_type' => $purpose], $order[$purpose]));
        }

        $this->add_items($id, $items);
        $this->add_notes($id, $notes);

        foreach ($refunds as $refund) {
            $refund_id = $this->next_hpos_id++;
            $this->insert_woo_row('wc_orders', ['id' => $refund_id, 'status' => 'wc-completed', 'type' => 'shop_order_refund', 'parent_order_id' => $id, 'total_amount' => '-' . $refund['amount'], 'date_created_gmt' => '2021-06-01 00:00:00']);
            $this->insert_woo_row('wc_orders_meta', ['order_id' => $refund_id, 'meta_key' => '_refund_amount', 'meta_value' => $refund['amount']]);
            $this->insert_woo_row('wc_orders_meta', ['order_id' => $refund_id, 'meta_key' => '_refund_reason', 'meta_value' => $refund['reason']]);
        }

        return $id;
    }

    /**
     * Add order items and their meta.
     *
     * @param int                              $order_id The order id.
     * @param array<int, array<string, mixed>> $items    The items.
     * @return void
     */
    protected function add_items(int $order_id, array $items): void
    {
        foreach ($items as $item) {
            $item_id = $this->insert_woo_row('woocommerce_order_items', ['order_item_name' => $item['name'], 'order_item_type' => $item['type'], 'order_id' => $order_id]);

            foreach ($item['meta'] as $key => $value) {
                $this->insert_woo_row('woocommerce_order_itemmeta', ['order_item_id' => $item_id, 'meta_key' => $key, 'meta_value' => (string) $value]);
            }
        }
    }

    /**
     * Add order notes as comments.
     *
     * @param int                              $order_id The order id.
     * @param array<int, array<string, mixed>> $notes    The notes.
     * @return void
     */
    protected function add_notes(int $order_id, array $notes): void
    {
        foreach ($notes as $note) {
            $comment_id = wp_insert_comment(['comment_post_ID' => $order_id, 'comment_type' => 'order_note', 'comment_content' => $note['content'], 'comment_author' => 'WooCommerce', 'comment_date_gmt' => '2021-05-06 09:00:00', 'comment_date' => '2021-05-06 09:00:00']);
            add_comment_meta($comment_id, 'is_customer_note', $note['customer'] ? 1 : 0);
        }
    }

    /**
     * Delete the order items and comments the fixtures created.
     *
     * @return void
     */
    protected function woo_delete_items(): void
    {
        global $wpdb;

        $wpdb->query("DELETE FROM {$wpdb->prefix}woocommerce_order_items"); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared, WordPress.DB.DirectDatabaseQuery -- test fixture cleanup.
        $wpdb->query("DELETE FROM {$wpdb->prefix}woocommerce_order_itemmeta"); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared, WordPress.DB.DirectDatabaseQuery -- test fixture cleanup.

        foreach (get_comments(['type' => 'order_note', 'fields' => 'ids']) as $comment_id) {
            wp_delete_comment($comment_id, true);
        }
    }

    /**
     * Remove the ids from a normalized order, which differ between the two layouts.
     *
     * @param array<string, mixed> $order The normalized order.
     * @return array<string, mixed>
     */
    protected function without_ids(array $order): array
    {
        unset($order['id'], $order['date_modified_gmt']);

        foreach (['items', 'notes', 'refunds'] as $part) {
            foreach ($order[$part] as $index => $row) {
                unset($order[$part][$index]['id'], $order[$part][$index]['order_id']);
            }
        }

        return $order;
    }

    /**
     * Create a WordPress user with the customer role and keep it for cleanup.
     *
     * @param string $email The email.
     * @return int
     */
    protected function customer_user(string $email): int
    {
        $user_id = self::factory()->user->create(['role' => 'customer', 'user_email' => $email, 'user_login' => $email]);
        $this->woo_user_ids[] = $user_id;

        return $user_id;
    }

    /**
     * Run a migration of the given groups to the end and return the last progress with all notes.
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
     * Delete the Kirki rows the test creates.
     *
     * @return void
     */
    protected function purge(): void
    {
        MigrationRun::query()->delete();
        MigrationRecordLedger::query()->delete();
        Refund::query()->delete();
        OrderActivity::query()->delete();
        Order::query()->delete();
        Coupon::query()->delete();
        Product::query()->delete();
        AttributeValue::query()->delete();
        Attribute::query()->delete();
        Address::query()->delete();
        Customer::query()->delete();
        $this->purge_woo_content();
    }
}
