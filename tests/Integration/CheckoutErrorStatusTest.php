<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Models\Variant;
use Kirki\Ecommerce\App\Services\AvailabilityService;
use Kirki\Ecommerce\App\Services\InventoryService;
use Kirki\Ecommerce\App\Services\VariantService;
use Kirki\Ecommerce\App\Payment\PaymentManager;
use Kirki\Ecommerce\Tests\Support\CreatesTestProducts;
use Kirki\Ecommerce\Tests\Support\RestTestCase;
use Kirki\Ecommerce\Tests\Support\SeedsTestShipping;

use function Kirki\Ecommerce\Framework\app;

/**
 * Checkout failures a shopper can fix answer with a validation status, never a server error.
 */
class CheckoutErrorStatusTest extends RestTestCase
{
    use CreatesTestProducts;
    use SeedsTestShipping;

    /** @var int */
    protected $variant_id;

    /** @var string */
    protected $payment_provider;

    /**
     * Prepare a one-unit product, a shipping method and an enabled offline payment method.
     *
     * @return void
     * @since 1.0.0
     */
    protected function setUp(): void
    {
        parent::setUp();

        $this->seed_base_currency();
        $this->seed_shipping_settings();

        $this->variant_id = $this->default_variant_id($this->create_product([
            'variants' => [[
                'base_price' => 29.99,
                'sku' => 'SKU-' . wp_generate_password(6, false),
                'available_quantity' => 1,
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
     * The checkout that loses a stock race gets a 422 with the stock message and leaves no order behind.
     *
     * Another shopper takes the last unit right after the first stock check passes, so the check
     * inside the order transaction is the one that fails.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_checkout_that_loses_a_stock_race_returns_validation_error(): void
    {
        $this->add_item_to_cart();
        $orders_before = Order::count();

        $inventory = new class (app()->make(VariantService::class), app()->make(AvailabilityService::class)) extends InventoryService {
            /** @var bool[] */
            public $results = [];

            /**
             * Report the real answer, then let a competing shopper take the stock.
             *
             * @param int $variant_id Variant ID.
             * @param int $quantity   Quantity wanted.
             * @return bool
             */
            public function has_stock(int $variant_id, int $quantity)
            {
                $result = parent::has_stock($variant_id, $quantity);

                if (empty($this->results)) {
                    Variant::where('id', $variant_id)->update(['available_quantity' => 0]);
                }

                $this->results[] = $result;

                return $result;
            }
        };
        app()->instance(InventoryService::class, $inventory);

        $response = $this->request('POST', 'checkout', $this->order_payload());

        $data = $this->assert_api_error($response, 422);
        $this->assertStringContainsString('Not enough stock', $data['message']);
        $this->assertTrue($inventory->results[0], 'The first stock check must pass so the in-transaction check is the one that fails.');
        $this->assertContains(false, $inventory->results);
        $this->assertSame($orders_before, Order::count());
        $this->assertEquals(0, Variant::find($this->variant_id)->available_quantity);
        $this->assertEquals(0, Variant::find($this->variant_id)->committed_quantity);
    }

    /**
     * A shopper cannot check out with a shipping method that is not available for the order.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_checkout_with_unavailable_shipping_method_returns_validation_error(): void
    {
        $this->add_item_to_cart();
        $orders_before = Order::count();

        $response = $this->request('POST', 'checkout', $this->order_payload(['shipping_method' => 'no-such-method']));

        $this->assert_api_error($response, 422);
        $this->assertSame($orders_before, Order::count());
    }

    /**
     * A shopper cannot check out from an empty cart.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_checkout_with_empty_cart_returns_validation_error(): void
    {
        $orders_before = Order::count();

        $response = $this->request('POST', 'checkout', $this->order_payload());

        $data = $this->assert_api_error($response, 422);
        $this->assertSame('Cart not found.', $data['message']);
        $this->assertSame($orders_before, Order::count());
    }

    /**
     * Put the test product in the signed-in shopper's cart, which shopper checkout reads from.
     *
     * @return void
     * @since 1.0.0
     */
    protected function add_item_to_cart(): void
    {
        $this->assert_api_success($this->request('POST', 'cart/items', ['variant_id' => $this->variant_id, 'quantity' => 1]));
    }

    /**
     * Build a checkout payload for a one-item shopper order.
     *
     * @param array<string, mixed> $overrides Fields to override.
     * @return array<string, mixed>
     * @since 1.0.0
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
