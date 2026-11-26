<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Constants\Coupon\CouponMethod;
use Kirki\Ecommerce\App\Constants\Coupon\DiscountTarget;
use Kirki\Ecommerce\App\Constants\Coupon\DiscountType;
use Kirki\Ecommerce\App\Constants\Coupon\DiscountValueType;
use Kirki\Ecommerce\App\Constants\Coupon\EligibleItemType;
use Kirki\Ecommerce\App\Constants\Coupon\SpendConditionType;
use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\App\Models\CartCoupon;
use Kirki\Ecommerce\App\Models\Coupon;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Models\OrderCoupon;
use Kirki\Ecommerce\App\Payment\PaymentManager;
use Kirki\Ecommerce\App\Supports\Facades\Settings;
use Kirki\Ecommerce\Tests\Support\CreatesTestProducts;
use Kirki\Ecommerce\Tests\Support\RestTestCase;
use Kirki\Ecommerce\Tests\Support\SeedsTestShipping;

/**
 * Automatic coupons attach to a shopper's cart on their own, and the shopper cannot remove them.
 *
 * Every test works on the cart of the signed-in user, which is also the cart that checkout reads.
 */
class AutomaticCouponTest extends RestTestCase
{
    use CreatesTestProducts;
    use SeedsTestShipping;

    /** @var int */
    protected $variant_id;

    /** @var string */
    protected $payment_provider;

    /**
     * Prepare a product, a shipping method and an enabled offline payment method.
     *
     * @return void
     * @since 1.0.3
     */
    protected function setUp(): void
    {
        parent::setUp();

        $this->seed_base_currency();
        $this->seed_shipping_settings();

        // Coupons of an earlier test stay in the table, and an active automatic coupon would join every cart.
        Coupon::query()->delete();

        $this->variant_id = $this->default_variant_id($this->create_product([
            'variants' => [[
                'base_price' => 100,
                'sku' => 'SKU-' . wp_generate_password(6, false),
                'available_quantity' => 50,
                'in_stock' => true,
                'track_inventory' => true,
                'is_default' => true,
                'attribute_values' => [],
            ]],
        ]));

        $created = $this->request('POST', 'offline-payments', ['name' => 'Cash on Delivery', 'is_enabled' => true]);
        $this->payment_provider = $this->assert_api_success($created, 201)['data']['id'];

        static::forget_singleton(PaymentManager::class);
        $this->reset_facade_cache();
    }

    /**
     * A valid automatic coupon is on the cart and in its totals.
     *
     * @return void
     * @since 1.0.3
     */
    public function test_a_valid_automatic_coupon_is_attached_to_the_cart(): void
    {
        $coupon = $this->create_automatic_coupon();

        $cart = $this->add_item_to_cart();

        $this->assertNotNull($this->find_coupon_in_response($cart, $coupon->code));
        $this->assertSame(CouponMethod::AUTOMATIC, $this->find_coupon_in_response($cart, $coupon->code)['method']);
        $this->assertSame(1, CartCoupon::query()->where('coupon_id', $coupon->id)->count());
    }

    /**
     * An automatic coupon that fails validation is left off the cart, without an error.
     *
     * @return void
     * @since 1.0.3
     */
    public function test_an_automatic_coupon_that_is_not_valid_is_not_attached(): void
    {
        $coupon = $this->create_automatic_coupon([
            'spend_condition_type' => SpendConditionType::MIN_CART_AMOUNT,
            'spend_condition_value' => 1000000,
        ]);

        $cart = $this->add_item_to_cart();

        $this->assertNull($this->find_coupon_in_response($cart, $coupon->code));
        $this->assertSame(0, CartCoupon::query()->where('coupon_id', $coupon->id)->count());
    }

    /**
     * An inactive automatic coupon, and a coupon that needs its code typed, are not attached.
     *
     * @return void
     * @since 1.0.3
     */
    public function test_inactive_automatic_coupons_and_code_coupons_are_not_attached(): void
    {
        $inactive = $this->create_automatic_coupon(['is_active' => false]);
        $code_coupon = $this->create_automatic_coupon(['method' => CouponMethod::CODE]);

        $cart = $this->add_item_to_cart();

        $this->assertNull($this->find_coupon_in_response($cart, $inactive->code));
        $this->assertNull($this->find_coupon_in_response($cart, $code_coupon->code));
        $this->assertSame(0, CartCoupon::query()->count());
    }

    /**
     * An automatic coupon without a code is not attached, because carts identify coupons by code.
     *
     * @return void
     * @since 1.0.3
     */
    public function test_an_automatic_coupon_without_a_code_is_not_attached(): void
    {
        $this->create_automatic_coupon(['code' => null]);
        $this->create_automatic_coupon(['code' => '']);

        $this->add_item_to_cart();

        $this->assertSame(0, CartCoupon::query()->count());
    }

    /**
     * Calculating the cart again does not attach the same coupon twice.
     *
     * @return void
     * @since 1.0.3
     */
    public function test_an_automatic_coupon_is_attached_once(): void
    {
        $coupon = $this->create_automatic_coupon();
        $this->add_item_to_cart();

        $this->assert_api_success($this->request('GET', 'cart'));
        $this->assert_api_success($this->request('GET', 'cart'));

        $this->assertSame(1, CartCoupon::query()->where('coupon_id', $coupon->id)->count());
    }

    /**
     * An attached automatic coupon is detached when it stops being valid, and attached again when it is valid again.
     *
     * @return void
     * @since 1.0.3
     */
    public function test_an_automatic_coupon_is_detached_when_invalid_and_attached_again_when_valid(): void
    {
        $coupon = $this->create_automatic_coupon();
        $cart = $this->add_item_to_cart();
        $this->assertNotNull($this->find_coupon_in_response($cart, $coupon->code));

        $coupon->update(['is_active' => false]);
        $cart = $this->assert_api_success($this->request('GET', 'cart'))['data'];
        $this->assertNull($this->find_coupon_in_response($cart, $coupon->code));
        $this->assertSame(0, CartCoupon::query()->where('coupon_id', $coupon->id)->count());

        $coupon->update(['is_active' => true]);
        $cart = $this->assert_api_success($this->request('GET', 'cart'))['data'];
        $this->assertNotNull($this->find_coupon_in_response($cart, $coupon->code));
        $this->assertSame(1, CartCoupon::query()->where('coupon_id', $coupon->id)->count());
    }

    /**
     * A non-combinable automatic coupon is not attached next to a coupon that is already applied.
     *
     * @return void
     * @since 1.0.3
     */
    public function test_a_non_combinable_automatic_coupon_is_not_attached_next_to_an_applied_coupon(): void
    {
        $code_coupon = Coupon::create($this->coupon_attributes(['method' => CouponMethod::CODE]));
        $this->add_item_to_cart();
        $this->assert_api_success($this->request('POST', 'cart/coupon', ['code' => $code_coupon->code]));

        $automatic = $this->create_automatic_coupon(['is_combinable' => false]);
        $cart = $this->assert_api_success($this->request('GET', 'cart'))['data'];

        $this->assertNotNull($this->find_coupon_in_response($cart, $code_coupon->code));
        $this->assertNull($this->find_coupon_in_response($cart, $automatic->code));
    }

    /**
     * The cart lists the code coupons and the order-targeted coupons apart from the full coupon list.
     *
     * @return void
     * @since 1.0.3
     */
    public function test_the_cart_lists_the_coupon_groups_apart(): void
    {
        $automatic_order = $this->create_automatic_coupon();
        $automatic_products = $this->create_automatic_coupon(['discount_target' => DiscountTarget::PRODUCTS]);
        $code_order = Coupon::create($this->coupon_attributes(['method' => CouponMethod::CODE]));
        $code_products = Coupon::create($this->coupon_attributes(['method' => CouponMethod::CODE, 'discount_target' => DiscountTarget::PRODUCTS]));
        $this->add_item_to_cart();

        $this->assert_api_success($this->request('POST', 'cart/coupon', ['code' => $code_order->code]));
        $cart = $this->assert_api_success($this->request('POST', 'cart/coupon', ['code' => $code_products->code]))['data'];
        $pricing = $cart['pricing'];

        $this->assertEqualsCanonicalizing(
            [$automatic_order->code, $automatic_products->code, $code_order->code, $code_products->code],
            array_column($pricing['coupons'], 'code')
        );
        $this->assertEqualsCanonicalizing([$code_order->code, $code_products->code], array_column($pricing['applied_coupons'], 'code'));
        $this->assertEqualsCanonicalizing([$automatic_order->code, $code_order->code], array_column($pricing['order_targeted_coupons'], 'code'));
    }

    /**
     * A cart with no coupon has empty coupon lists.
     *
     * @return void
     * @since 1.0.3
     */
    public function test_a_cart_with_no_coupon_has_empty_coupon_lists(): void
    {
        $pricing = $this->add_item_to_cart()['pricing'];

        $this->assertSame([], $pricing['coupons']);
        $this->assertSame([], $pricing['applied_coupons']);
        $this->assertSame([], $pricing['order_targeted_coupons']);
    }

    /**
     * A shopper cannot remove an automatic coupon from the cart.
     *
     * @return void
     * @since 1.0.3
     */
    public function test_a_shopper_cannot_remove_an_automatic_coupon(): void
    {
        $coupon = $this->create_automatic_coupon();
        $this->add_item_to_cart();

        $response = $this->request('DELETE', 'cart/coupon', ['code' => $coupon->code]);

        $this->assert_api_error($response, 422);
        $this->assertSame(1, CartCoupon::query()->where('coupon_id', $coupon->id)->count());
        $cart = $this->assert_api_success($this->request('GET', 'cart'))['data'];
        $this->assertNotNull($this->find_coupon_in_response($cart, $coupon->code));
    }

    /**
     * A store that does not accept coupon codes still gives its automatic coupons.
     *
     * @return void
     * @since 1.0.3
     */
    public function test_automatic_coupons_stay_when_coupon_codes_are_disabled(): void
    {
        $automatic = $this->create_automatic_coupon();
        $code_coupon = Coupon::create($this->coupon_attributes(['method' => CouponMethod::CODE]));
        $this->add_item_to_cart();
        $this->assert_api_success($this->request('POST', 'cart/coupon', ['code' => $code_coupon->code]));

        $snapshot = $this->set_coupon_codes_enabled(false);

        try {
            $cart = $this->assert_api_success($this->request('GET', 'cart'))['data'];
            $this->assertNotNull($this->find_coupon_in_response($cart, $automatic->code));
            $this->assertNull($this->find_coupon_in_response($cart, $code_coupon->code));
        } finally {
            $this->restore_checkout_settings($snapshot);
        }
    }

    /**
     * A cart calculation looks for automatic coupons with one query.
     *
     * @return void
     * @since 1.0.3
     */
    public function test_a_cart_calculation_makes_one_automatic_coupon_lookup(): void
    {
        $this->add_item_to_cart();

        global $wpdb;

        $table = $wpdb->prefix . 'kirki_ecommerce_coupons';
        $queries = [];
        $listener = function ($query) use ($table, &$queries) {
            if (stripos(ltrim($query), 'SELECT') === 0 && stripos($query, $table) !== false && stripos($query, "`method` = 'automatic'") !== false) {
                $queries[] = $query;
            }

            return $query;
        };

        add_filter('query', $listener);

        try {
            $this->assert_api_success($this->request('GET', 'cart'));
        } finally {
            remove_filter('query', $listener);
        }

        $this->assertCount(1, $queries, implode("\n", $queries));
    }

    /**
     * The checkout saves the automatic coupon on the order, and the order counts its use.
     *
     * @return void
     * @since 1.0.3
     */
    public function test_checkout_saves_the_automatic_coupon_on_the_order(): void
    {
        $coupon = $this->create_automatic_coupon();
        $this->add_item_to_cart();

        $order = $this->assert_api_success($this->request('POST', 'checkout', $this->order_payload()), 201)['data'];

        $this->assertSame([$coupon->code], OrderCoupon::where('order_id', $order['id'])->get()->pluck('code')->to_array());
        $this->assertSame([CouponMethod::AUTOMATIC], OrderCoupon::where('order_id', $order['id'])->get()->pluck('method')->to_array());
        $this->assertEquals(1, Coupon::find($coupon->id)->current_usage_count);
    }

    /**
     * The checkout attaches an automatic coupon that the cart never saw.
     *
     * @return void
     * @since 1.0.3
     */
    public function test_checkout_attaches_an_automatic_coupon_that_the_cart_never_saw(): void
    {
        $this->add_item_to_cart();
        $coupon = $this->create_automatic_coupon();
        $this->assertSame(0, CartCoupon::where('coupon_id', $coupon->id)->count());

        $order = $this->assert_api_success($this->request('POST', 'checkout', $this->order_payload()), 201)['data'];

        $this->assertSame([$coupon->code], OrderCoupon::where('order_id', $order['id'])->get()->pluck('code')->to_array());
        $this->assertEquals(1, Coupon::find($coupon->id)->current_usage_count);
    }

    /**
     * The checkout leaves out an automatic coupon that stopped being valid, and does not fail.
     *
     * @return void
     * @since 1.0.3
     */
    public function test_checkout_leaves_out_an_automatic_coupon_that_is_no_longer_valid(): void
    {
        $coupon = $this->create_automatic_coupon();
        $this->add_item_to_cart();
        $coupon->update(['is_active' => false]);
        $orders_before = Order::count();

        $order = $this->assert_api_success($this->request('POST', 'checkout', $this->order_payload()), 201)['data'];

        $this->assertSame($orders_before + 1, Order::count());
        $this->assertSame(0, OrderCoupon::where('order_id', $order['id'])->count());
        $this->assertEquals(0, Coupon::find($coupon->id)->current_usage_count);
    }

    /**
     * The checkout of a store that does not accept coupon codes still takes the automatic coupon.
     *
     * @return void
     * @since 1.0.3
     */
    public function test_checkout_keeps_the_automatic_coupon_when_coupon_codes_are_disabled(): void
    {
        $coupon = $this->create_automatic_coupon();
        $this->add_item_to_cart();
        $snapshot = $this->set_coupon_codes_enabled(false);

        try {
            $order = $this->assert_api_success($this->request('POST', 'checkout', $this->order_payload()), 201)['data'];

            $this->assertSame([$coupon->code], OrderCoupon::where('order_id', $order['id'])->get()->pluck('code')->to_array());
        } finally {
            $this->restore_checkout_settings($snapshot);
        }

    }

    /**
     * Put the test product in the signed-in shopper's cart.
     *
     * @return array<string, mixed> The cart as the API returns it.
     * @since 1.0.3
     */
    protected function add_item_to_cart(): array
    {
        $this->assert_api_success($this->request('POST', 'cart/items', ['variant_id' => $this->variant_id, 'quantity' => 1]));

        return $this->assert_api_success($this->request('GET', 'cart'))['data'];
    }

    /**
     * Find an applied coupon in a cart response.
     *
     * @param array<string, mixed> $cart Cart data.
     * @param string               $code Coupon code.
     * @return array<string, mixed>|null
     * @since 1.0.3
     */
    protected function find_coupon_in_response(array $cart, string $code): ?array
    {
        foreach ($cart['pricing']['coupons'] as $coupon) {
            if ($coupon['code'] === $code) {
                return $coupon;
            }
        }

        return null;
    }

    /**
     * Create an active automatic coupon: 10% off the order.
     *
     * @param array<string, mixed> $overrides Coupon fields to override.
     * @return Coupon
     * @since 1.0.3
     */
    protected function create_automatic_coupon(array $overrides = []): Coupon
    {
        return Coupon::create($this->coupon_attributes($overrides));
    }

    /**
     * Build the fields of an active automatic coupon: 10% off the order.
     *
     * @param array<string, mixed> $overrides Coupon fields to override.
     * @return array<string, mixed>
     * @since 1.0.3
     */
    protected function coupon_attributes(array $overrides = []): array
    {
        return array_merge([
            'method' => CouponMethod::AUTOMATIC,
            'title' => 'Automatic Coupon',
            'code' => 'AUTO' . strtoupper(wp_generate_password(6, false)),
            'discount_type' => DiscountType::AMOUNT_OFF,
            'discount_target' => DiscountTarget::ORDER,
            'discount_value_type' => DiscountValueType::PERCENTAGE,
            'discount_amount_percentage' => 10,
            'eligible_item_type' => EligibleItemType::ALL_PRODUCTS,
            'is_active' => true,
        ], $overrides);
    }

    /**
     * Turn the checkout "Apply Coupon Code" setting on or off.
     *
     * @param bool $is_enabled Whether coupon codes are accepted.
     * @return array<string, mixed> The checkout settings before the change.
     * @since 1.0.3
     */
    protected function set_coupon_codes_enabled(bool $is_enabled): array
    {
        $settings = Settings::get(OptionKeys::CHECKOUT_SETTINGS)->refresh();
        $snapshot = $settings->to_array();
        $configuration = (array) ($snapshot['checkout_configuration'] ?? []);
        $configuration['can_apply_coupon_code'] = $is_enabled;

        $settings->set(['checkout_configuration' => $configuration], false);

        return $snapshot;
    }

    /**
     * Put the checkout settings back and drop the cached copies, so the next test reads them again.
     *
     * @param array<string, mixed> $snapshot The checkout settings before the change.
     * @return void
     * @since 1.0.3
     */
    protected function restore_checkout_settings(array $snapshot): void
    {
        Settings::get(OptionKeys::CHECKOUT_SETTINGS)->refresh()->set($snapshot, false);

        // A checkout commits the test transaction, which saves the changed setting for good. The restore must be saved too.
        global $wpdb;
        $wpdb->query('COMMIT');

        $this->reset_facade_cache();
        $this->reset_settings_factory_cache();
        $this->reset_option_manager_cache();
    }

    /**
     * Build a checkout payload for a one-item shopper order.
     *
     * @param array<string, mixed> $overrides Fields to override.
     * @return array<string, mixed>
     * @since 1.0.3
     */
    protected function order_payload(array $overrides = []): array
    {
        return array_merge([
            'items' => [['variant_id' => $this->variant_id, 'quantity' => 1]],
            'currency_code' => 'USD',
            'payment_provider' => $this->payment_provider,
            'shipping_method' => 'method-0001',
            'is_manual' => false,
            'customer_first_name' => 'John',
            'customer_last_name' => 'Doe',
            'shipping_first_name' => 'John',
            'shipping_last_name' => 'Doe',
            'shipping_address_line1' => '123 Main St',
            'shipping_city' => 'New York',
            'shipping_state' => 'NY',
            'shipping_postal_code' => '10001',
            'shipping_country' => 'US',
            'billing_first_name' => 'John',
            'billing_last_name' => 'Doe',
            'billing_address_line1' => '123 Main St',
            'billing_city' => 'New York',
            'billing_state' => 'NY',
            'billing_postal_code' => '10001',
            'billing_country' => 'US',
        ], $overrides);
    }
}
