<?php

namespace Kirki\Ecommerce\Tests\Integration\Migration;

use Kirki\Ecommerce\App\Migration\Core\RecordLedger;
use Kirki\Ecommerce\App\Migration\Core\MigrationRunner;
use Kirki\Ecommerce\App\Migration\Core\SourceRegistry;
use Kirki\Ecommerce\App\Migration\Sources\WooCommerce\WooCommerceSource;
use Kirki\Ecommerce\App\Models\Address;
use Kirki\Ecommerce\App\Models\Category;
use Kirki\Ecommerce\App\Models\Coupon;
use Kirki\Ecommerce\App\Models\Customer;
use Kirki\Ecommerce\App\Migration\Models\MigrationRecordLedger;
use Kirki\Ecommerce\App\Migration\Models\MigrationRun;
use Kirki\Ecommerce\App\Models\Product;
use Kirki\Ecommerce\Tests\Support\Migration\BuildsWooCommerceFixtures;
use Kirki\Ecommerce\Tests\Support\RestTestCase;
use Kirki\Ecommerce\Tests\Support\SeedsTestCurrency;

/**
 * Covers migrating WooCommerce customers and coupons.
 */
class WooCommerceCustomersCouponsGroupTest extends RestTestCase
{
    use BuildsWooCommerceFixtures;
    use SeedsTestCurrency;

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
        $this->purge();
        $this->seed_base_currency();
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
        $this->purge();
        $this->drop_woo_tables();

        parent::tearDown();
    }

    /**
     * A registered customer is linked to the existing WordPress user, with billing and shipping addresses.
     *
     * @return void
     */
    public function test_registered_customer_is_linked_to_the_wordpress_user()
    {
        $user_id = $this->customer_user('jane@example.com', ['first_name' => 'Jane', 'last_name' => 'Roe', 'billing_phone' => '555-1']);
        update_user_meta($user_id, 'billing_address_1', '1 Main St');
        update_user_meta($user_id, 'billing_city', 'Austin');
        update_user_meta($user_id, 'billing_state', 'TX');
        update_user_meta($user_id, 'billing_postcode', '73301');
        update_user_meta($user_id, 'billing_country', 'US');
        update_user_meta($user_id, 'shipping_address_1', '9 Side Rd');
        update_user_meta($user_id, 'shipping_city', 'Dallas');
        update_user_meta($user_id, 'shipping_state', 'TX');
        update_user_meta($user_id, 'shipping_postcode', '75001');
        update_user_meta($user_id, 'shipping_country', 'US');

        $this->migrate(['customers']);

        $customer = Customer::with('billing_address', 'shipping_address')->find((new RecordLedger('woocommerce'))->resolve('customer', $user_id));

        $this->assertSame($user_id, (int) $customer->user_id);
        $this->assertSame('Jane', $customer->first_name);
        $this->assertSame('jane@example.com', $customer->email);
        $this->assertSame('555-1', $customer->phone);
        $this->assertSame('1 Main St', $customer->billing_address->address_line1);
        $this->assertSame('9 Side Rd', $customer->shipping_address->address_line1);
        $this->assertSame(2, Address::query()->where('customer_id', $customer->id)->count());
    }

    /**
     * An address that is the same for billing and shipping is saved once, as both defaults.
     *
     * @return void
     */
    public function test_equal_addresses_are_saved_once()
    {
        $user_id = $this->customer_user('same@example.com', ['first_name' => 'Sam', 'last_name' => 'Lee']);

        foreach (['billing', 'shipping'] as $purpose) {
            update_user_meta($user_id, $purpose . '_address_1', '5 Oak Ave');
            update_user_meta($user_id, $purpose . '_city', 'Reno');
            update_user_meta($user_id, $purpose . '_country', 'US');
            update_user_meta($user_id, $purpose . '_postcode', '89501');
        }

        $this->migrate(['customers']);

        $customer_id = (new RecordLedger('woocommerce'))->resolve('customer', $user_id);
        $this->assertSame(1, Address::query()->where('customer_id', $customer_id)->count());
        $address = Address::query()->where('customer_id', $customer_id)->first();
        $this->assertTrue((bool) $address->is_default_billing);
        $this->assertTrue((bool) $address->is_default_shipping);
    }

    /**
     * A Kirki customer with the same email is reused and not changed or duplicated.
     *
     * @return void
     */
    public function test_existing_customer_with_the_same_email_is_reused()
    {
        // The user is created first: creating a user links a customer with the same email, which is not what is tested here.
        $user_id = $this->customer_user('dup@example.com', ['first_name' => 'New', 'last_name' => 'Name']);
        $existing = Customer::create(['first_name' => 'Old', 'last_name' => 'Name', 'email' => 'dup@example.com', 'created_by' => get_current_user_id(), 'updated_by' => get_current_user_id()]);

        $this->migrate(['customers']);

        $this->assertSame((int) $existing->id, (new RecordLedger('woocommerce'))->resolve('customer', $user_id));
        $this->assertSame(1, Customer::query()->where('email', 'dup@example.com')->count());
        $this->assertSame('Old', Customer::find($existing->id)->first_name);
        $this->assertNull(Customer::find($existing->id)->user_id, 'The reused customer is not changed.');
    }

    /**
     * A percentage coupon keeps its code, percentage, limits, expiry, minimum spend and usage count.
     *
     * @return void
     */
    public function test_percentage_coupon_keeps_its_rules()
    {
        $expires = strtotime('2031-01-02 03:04:05 UTC');
        $id = $this->coupon('SAVE10', ['discount_type' => 'percent', 'coupon_amount' => '10', 'usage_limit' => '100', 'usage_limit_per_user' => '2', 'date_expires' => (string) $expires, 'minimum_amount' => '50.00', 'usage_count' => '7']);

        $this->migrate(['coupons']);

        $coupon = Coupon::find((new RecordLedger('woocommerce'))->resolve('coupon', $id));
        $this->assertSame('SAVE10', $coupon->code);
        $this->assertSame('amount-off', $coupon->discount_type);
        $this->assertSame('order', $coupon->discount_target);
        $this->assertSame('percentage', $coupon->discount_value_type);
        $this->assertEquals(10, $coupon->discount_amount_percentage);
        $this->assertTrue((bool) $coupon->has_usage_limit);
        $this->assertSame(100, (int) $coupon->usage_limit);
        $this->assertSame(2, (int) $coupon->customer_limit);
        $this->assertSame('2031-01-02 03:04:05', $coupon->end_datetime->format('Y-m-d H:i:s'));
        $this->assertSame('min-cart-amount', $coupon->spend_condition_type);
        $this->assertSame(5000, (int) $coupon->spend_condition_value);
        $this->assertSame(7, (int) $coupon->current_usage_count);
        $this->assertTrue((bool) $coupon->is_active);
    }

    /**
     * A fixed cart coupon becomes a fixed order discount in minor units.
     *
     * @return void
     */
    public function test_fixed_cart_coupon_becomes_a_fixed_order_discount()
    {
        $id = $this->coupon('FIVE', ['discount_type' => 'fixed_cart', 'coupon_amount' => '5.50']);

        $this->migrate(['coupons']);

        $coupon = Coupon::find((new RecordLedger('woocommerce'))->resolve('coupon', $id));
        $this->assertSame('fixed', $coupon->discount_value_type);
        $this->assertSame(550, (int) $coupon->base_discount_amount_fixed);
        $this->assertSame('order', $coupon->discount_target);
    }

    /**
     * A fixed product coupon limited to products uses the migrated products.
     *
     * @return void
     */
    public function test_fixed_product_coupon_uses_the_migrated_products()
    {
        $product = $this->woo_product(['post_title' => 'Lamp'], ['_regular_price' => '40']);
        wp_set_object_terms($product, ['simple'], 'product_type');
        register_taxonomy('product_type', 'product');
        $id = $this->coupon('LAMP', ['discount_type' => 'fixed_product', 'coupon_amount' => '3', 'product_ids' => (string) $product]);

        $this->migrate(['products', 'coupons']);

        $map = new RecordLedger('woocommerce');
        $coupon = Coupon::with('products')->find($map->resolve('coupon', $id));
        $this->assertSame('products', $coupon->discount_target);
        $this->assertSame('specific-products', $coupon->eligible_item_type);
        $this->assertSame([$map->resolve('product', $product)], $coupon->products->pluck('id')->map('intval')->all());
    }

    /**
     * A coupon limited to products that were not migrated is skipped, so it does not become wider.
     *
     * @return void
     */
    public function test_coupon_with_unresolved_restriction_is_skipped()
    {
        $id = $this->coupon('GHOST', ['discount_type' => 'percent', 'coupon_amount' => '50', 'product_ids' => '999999']);

        $this->migrate(['coupons']);

        $run = MigrationRun::query()->first();
        $this->assertSame(0, Coupon::query()->count());
        $this->assertSame($id, $run->skipped_items[0]['source_id']);
        $this->assertStringContainsString('not in Kirki', $run->skipped_items[0]['reason']);
    }

    /**
     * A coupon of an unsupported discount type is skipped and reported.
     *
     * @return void
     */
    public function test_unsupported_discount_type_is_skipped()
    {
        $this->coupon('WEIRD', ['discount_type' => 'sign_up_fee', 'coupon_amount' => '5']);

        $this->migrate(['coupons']);

        $run = MigrationRun::query()->first();
        $this->assertSame(0, Coupon::query()->count());
        $this->assertStringContainsString('sign_up_fee', $run->skipped_items[0]['reason']);
    }

    /**
     * A free shipping coupon without a discount becomes a free shipping coupon.
     *
     * @return void
     */
    public function test_free_shipping_coupon()
    {
        $id = $this->coupon('SHIPFREE', ['discount_type' => 'fixed_cart', 'coupon_amount' => '0', 'free_shipping' => 'yes']);

        $this->migrate(['coupons']);

        $this->assertSame('free-shipping', Coupon::find((new RecordLedger('woocommerce'))->resolve('coupon', $id))->discount_type);
    }

    /**
     * A code that Kirki already uses is saved with a suffix, and options Kirki lacks are reported.
     *
     * @return void
     */
    public function test_code_clash_gets_a_suffix_and_unsupported_options_are_reported()
    {
        Coupon::create(['title' => 'Existing', 'code' => 'DUP', 'created_by' => get_current_user_id(), 'updated_by' => get_current_user_id()]);
        $id = $this->coupon('DUP', ['discount_type' => 'percent', 'coupon_amount' => '5', 'individual_use' => 'yes', 'maximum_amount' => '200']);

        $progress = $this->migrate(['coupons']);

        $this->assertSame('DUP-2', Coupon::find((new RecordLedger('woocommerce'))->resolve('coupon', $id))->code);
        $this->assertSame(1, Coupon::query()->where('code', 'DUP')->count());
        $notes = implode(' ', $progress['notes']);
        $this->assertStringContainsString('DUP-2', $notes);
        $this->assertStringContainsString('individual use only', $notes);
        $this->assertStringContainsString('maximum spend', $notes);
    }

    /**
     * Draft coupons are saved as inactive.
     *
     * @return void
     */
    public function test_draft_coupon_is_inactive()
    {
        $id = $this->coupon('LATER', ['discount_type' => 'percent', 'coupon_amount' => '5'], ['post_status' => 'draft']);

        $this->migrate(['coupons']);

        $this->assertFalse((bool) Coupon::find((new RecordLedger('woocommerce'))->resolve('coupon', $id))->is_active);
    }

    /**
     * Create a WordPress user with the customer role and keep it for cleanup.
     *
     * @param string               $email The email.
     * @param array<string, mixed> $meta  User meta.
     * @return int
     */
    protected function customer_user(string $email, array $meta = []): int
    {
        $user_id = self::factory()->user->create(['role' => 'customer', 'user_email' => $email, 'user_login' => $email]);
        $this->woo_user_ids[] = $user_id;

        foreach ($meta as $key => $value) {
            update_user_meta($user_id, $key, $value);
        }

        return $user_id;
    }

    /**
     * Create a WooCommerce coupon post.
     *
     * @param string               $code The coupon code, which is the post title.
     * @param array<string, mixed> $meta Coupon meta.
     * @param array<string, mixed> $post Post fields.
     * @return int
     */
    protected function coupon(string $code, array $meta = [], array $post = []): int
    {
        return $this->woo_product(array_merge(['post_type' => 'shop_coupon', 'post_title' => $code], $post), $meta);
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
        Coupon::query()->delete();
        Address::query()->delete();
        Customer::query()->delete();
        Product::query()->delete();
        Category::query()->delete();
    }
}
