<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Payment\PaymentManager;
use Kirki\Ecommerce\Tests\Support\CreatesTestProducts;
use Kirki\Ecommerce\Tests\Support\EnablesPaymentProviders;
use Kirki\Ecommerce\Tests\Support\RestTestCase;
use Kirki\Ecommerce\Tests\Support\SeedsTestShipping;

class CheckoutPaymentProviderTest extends RestTestCase
{
    use CreatesTestProducts;
    use EnablesPaymentProviders;
    use SeedsTestShipping;

    /** @var int */
    protected $variant_id;

    /**
     * Prepare a product to order and a shipping method to ship it with.
     *
     * @return void
     * @since 1.0.0
     */
    protected function setUp(): void
    {
        parent::setUp();

        $this->seed_base_currency();
        $this->seed_shipping_settings();

        $this->variant_id = $this->default_variant_id($this->create_product());
    }

    /**
     * A shopper cannot check out with a provider that does not exist.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_shopper_unknown_provider_is_rejected(): void
    {
        $orders_before = Order::count();

        $response = $this->request('POST', 'checkout', $this->order_payload(['payment_provider' => 'no-such-provider']));

        $this->assert_api_error($response, 422);
        $this->assertSame($orders_before, Order::count());
    }

    /**
     * A shopper cannot check out with a provider that is registered but disabled.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_shopper_disabled_provider_is_rejected(): void
    {
        $orders_before = Order::count();

        $response = $this->request('POST', 'checkout', $this->order_payload(['payment_provider' => 'paypal']));

        $this->assert_api_error($response, 422);
        $this->assertSame($orders_before, Order::count());
    }

    /**
     * A shopper can check out with an enabled online provider.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_shopper_enabled_provider_is_accepted(): void
    {
        $this->enable_payment_provider('paypal');
        $this->add_item_to_cart();

        $response = $this->request('POST', 'checkout', $this->order_payload(['payment_provider' => 'paypal']));

        $payload = $this->assert_api_success($response, 201);
        $this->assertSame('paypal', $payload['data']['payment_provider']);
    }

    /**
     * An offline method is rejected while disabled and accepted once enabled through its endpoint.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_offline_method_is_accepted_only_after_it_is_enabled(): void
    {
        $created = $this->request('POST', 'offline-payments', ['name' => 'Cash on Delivery', 'is_enabled' => false]);
        $id = $this->assert_api_success($created, 201)['data']['id'];
        $this->start_new_request();

        $rejected = $this->request('POST', 'checkout', $this->order_payload(['payment_provider' => $id]));
        $this->assert_api_error($rejected, 422);

        $this->assert_api_success($this->request('PATCH', 'offline-payments/' . $id, ['is_enabled' => true]));
        $this->start_new_request();
        $this->add_item_to_cart();

        $accepted = $this->request('POST', 'checkout', $this->order_payload(['payment_provider' => $id]));
        $this->assertSame($id, $this->assert_api_success($accepted, 201)['data']['payment_provider']);
    }

    /**
     * An administrator can create a manual order without choosing a provider.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_manual_order_without_provider_is_accepted(): void
    {
        $response = $this->request('POST', 'checkout', $this->order_payload(['is_manual' => true, 'payment_provider' => null]));

        $this->assert_api_success($response, 201);
    }

    /**
     * An administrator can record a manual order against a registered provider that is disabled.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_manual_order_with_disabled_provider_is_accepted(): void
    {
        $response = $this->request('POST', 'checkout', $this->order_payload(['is_manual' => true, 'payment_provider' => 'paypal']));

        $payload = $this->assert_api_success($response, 201);
        $this->assertSame('paypal', $payload['data']['payment_provider']);
    }

    /**
     * A manual order still cannot name a provider that does not exist.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_manual_order_with_unknown_provider_is_rejected(): void
    {
        $response = $this->request('POST', 'checkout', $this->order_payload(['is_manual' => true, 'payment_provider' => 'no-such-provider']));

        $this->assert_api_error($response, 422);
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
     * Rebuild the provider registry, as the next real request would.
     *
     * @return void
     * @since 1.0.0
     */
    protected function start_new_request(): void
    {
        static::forget_singleton(PaymentManager::class);
        $this->reset_facade_cache();
    }

    /**
     * Build a checkout payload for a one-item order; shopper checkout unless overridden.
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
            'payment_provider' => 'paypal',
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
