<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Constants\BulkActions;
use Kirki\Ecommerce\App\Constants\Order\RefundStatus;
use Kirki\Ecommerce\App\Facades\Order as OrderManager;
use Kirki\Ecommerce\App\Payment\PaymentManager;
use Kirki\Ecommerce\App\Payment\Providers\PayPal;
use Kirki\Ecommerce\Tests\Support\CreatesTestProducts;
use Kirki\Ecommerce\Tests\Support\RestTestCase;
use Kirki\Ecommerce\Tests\Support\SeedsTestShipping;
use Exception;
use ReflectionMethod;

use function Kirki\Ecommerce\Framework\app;

class OrderApiTest extends RestTestCase
{
    use CreatesTestProducts;
    use SeedsTestShipping;

    /**
     * Order id for the current test.
     *
     * @var mixed
     * @since 1.0.0
     */
    protected $order_id;
    /**
     * Variant id for the current test.
     *
     * @var mixed
     * @since 1.0.0
     */
    protected $variant_id;
    /**
     * Refund id for the current test.
     *
     * @var mixed
     * @since 1.0.0
     */
    protected $refund_id;

    /**
     * Prepare state before each test.
     *
     * @return void
     * @since 1.0.0
     */
    protected function setUp(): void
    {
        parent::setUp();
        $this->seed_base_currency();
        $this->seed_shipping_settings();

        $product = $this->create_product();
        $this->variant_id = $this->default_variant_id($product);
    }

    /**
     * Store order returns 201.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_store_order_returns_201(): void
    {
        $response = $this->request('POST', 'orders', $this->order_payload());
        $payload = $this->assert_api_success($response, 201);

        $this->assertArrayHasKey('id', $payload['data']);
        $this->assertNotEmpty($payload['data']['order_number']);
        $this->assertEquals('PayPal', $payload['data']['payment_provider_name']);
        $this->assertNotEmpty($payload['data']['payment_provider_icon']);
        $this->assertFalse($payload['data']['payment_provider_is_offline']);
        $this->assertEquals('Standard Delivery', $payload['data']['shipping_method_name']);
        $this->assertEquals('flat_rate', $payload['data']['shipping_method_type']);

        $this->order_id = $payload['data']['id'];
    }

    /**
     * Show order returns resource.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_show_order_returns_resource(): void
    {
        $order = $this->create_order();
        $this->order_id = $order['id'];

        $response = $this->request('GET', 'orders/' . $this->order_id);
        $payload = $this->assert_api_success($response);

        $this->assertEquals($this->order_id, $payload['data']['id']);
        $this->assertEquals('PayPal', $payload['data']['payment_provider_name']);
        $this->assertNotEmpty($payload['data']['payment_provider_icon']);
        $this->assertFalse($payload['data']['payment_provider_is_offline']);
        $this->assertEquals('Standard Delivery', $payload['data']['shipping_method_name']);
        $this->assertEquals('flat_rate', $payload['data']['shipping_method_type']);
    }

    /**
     * List orders returns paginated results.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_list_orders_returns_paginated_results(): void
    {
        $order = $this->create_order();

        $response = $this->request('GET', 'orders', [
            'page' => 1,
            'limit' => 10,
        ]);

        $payload = $this->assert_api_success($response);
        $this->assertArrayHasKey('results', $payload['data']);
        $this->assertGreaterThanOrEqual(1, $payload['data']['total']);

        $listed_order = null;

        foreach ($payload['data']['results'] as $result) {
            if ($result['id'] == $order['id']) {
                $listed_order = $result;
                break;
            }
        }

        $this->assertNotNull($listed_order);
        $this->assertEquals('PayPal', $listed_order['payment_provider_name']);
        $this->assertNotEmpty($listed_order['payment_provider_icon']);
        $this->assertFalse($listed_order['payment_provider_is_offline']);
        $this->assertEquals('method-0001', $listed_order['shipping_method']);
        $this->assertEquals('Standard Delivery', $listed_order['shipping_method_name']);
    }

    /**
     * Update order changes notes.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_update_order_changes_notes(): void
    {
        $order = $this->create_order();
        $this->order_id = $order['id'];
        $customer_id = $this->create_customer()['id'];

        $response = $this->request('PUT', 'orders/' . $this->order_id, $this->order_payload([
            'id' => $this->order_id,
            'customer_id' => $customer_id,
            'customer_notes' => 'Updated notes',
            'items' => [
                [
                    'id' => $order['items'][0]['id'] ?? null,
                    'variant_id' => $this->variant_id,
                    'quantity' => 1,
                ],
            ],
        ]));

        $payload = $this->assert_api_success($response);
        $this->assertEquals('Updated notes', $payload['data']['customer_notes']);
    }

    /**
     * Delete order removes record.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_delete_order_removes_record(): void
    {
        $this->order_id = $this->create_order()['id'];

        $response = $this->request('DELETE', 'orders/' . $this->order_id);
        $payload = $this->assert_api_success($response);

        $this->assertTrue($payload['data']);
    }

    /**
     * Create refund on order.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_create_refund_on_order(): void
    {
        $order = $this->create_order();
        $this->order_id = $order['id'];

        $response = $this->request('POST', 'orders/' . $this->order_id . '/refunds', [
            'order_id' => $this->order_id,
            'invoiced_amount' => 10,
            'reason' => 'Customer request',
        ]);

        $payload = $this->assert_api_success($response);
        $this->assertNotEmpty($payload['data']['refunds']);
    }

    /**
     * Store order validation fails without items.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_store_order_validation_fails_without_items(): void
    {
        $response = $this->request('POST', 'orders', $this->order_payload([
            'items' => [],
        ]));

        $this->assert_validation_error($response);
    }

    /**
     * Unauthenticated request returns 401.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_unauthenticated_request_returns_401(): void
    {
        $this->logout();

        $response = $this->request('GET', 'orders');
        $this->assert_api_error($response, 401);
    }

    /**
     * Setting a payment provider fee also derives the base-currency fee
     * using the order's own frozen exchange rate.
     *
     * @return void
     */
    public function test_set_payment_provider_fee_derives_base_currency_fee(): void
    {
        $currency_code = $this->create_test_currency(['code' => 'EUR', 'exchange_rate' => 2.0]);

        $order = $this->create_order(['currency_code' => $currency_code]);
        $this->order_id = $order['id'];

        OrderManager::set_payment_provider_fee($this->order_id, 200);

        $stored = OrderManager::find($this->order_id);

        $this->assertSame(200, $stored->invoiced_payment_provider_fee);
        $this->assertSame(100, $stored->base_payment_provider_fee);
    }

    /**
     * Setting a payment provider fee for an order already in the base
     * currency skips conversion entirely.
     *
     * @return void
     */
    public function test_set_payment_provider_fee_same_currency_skips_conversion(): void
    {
        $order = $this->create_order();
        $this->order_id = $order['id'];

        OrderManager::set_payment_provider_fee($this->order_id, 150);

        $stored = OrderManager::find($this->order_id);

        $this->assertSame(150, $stored->invoiced_payment_provider_fee);
        $this->assertSame(150, $stored->base_payment_provider_fee);
    }

    /**
     * PayPal only records its reported fee when the fee's currency matches
     * the order's invoiced currency.
     *
     * @return void
     */
    public function test_paypal_captures_fee_only_when_currency_matches_order(): void
    {
        $order = $this->create_order();
        $this->order_id = $order['id'];

        $order_model = OrderManager::find($this->order_id);
        $paypal = new PayPal();

        $capture_fee = new ReflectionMethod(PayPal::class, 'capture_payment_provider_fee');
        $capture_fee->setAccessible(true);

        $capture_fee->invoke($paypal, $order_model, [
            'seller_receivable_breakdown' => [
                'paypal_fee' => ['currency_code' => 'EUR', 'value' => '3.30'],
            ],
        ]);

        $this->assertSame(0, OrderManager::find($this->order_id)->invoiced_payment_provider_fee);

        $capture_fee->invoke($paypal, $order_model, [
            'seller_receivable_breakdown' => [
                'paypal_fee' => ['currency_code' => $order_model->currency_code, 'value' => '3.30'],
            ],
        ]);

        $this->assertSame(330, OrderManager::find($this->order_id)->invoiced_payment_provider_fee);
    }

    /**
     * PaymentManager::pay() resolves the gateway from the order's
     * payment_provider attribute (regression test for the stale
     * payment_method lookup) instead of silently returning null.
     *
     * @return void
     */
    public function test_pay_resolves_provider_using_payment_provider_attribute(): void
    {
        $order = $this->create_order();
        $this->order_id = $order['id'];

        $order_model = OrderManager::find($this->order_id);

        $this->expectException(Exception::class);
        $this->expectExceptionMessage('PayPal is not enabled.');

        app()->make(PaymentManager::class)->pay($order_model);
    }

    /**
     * Create order.
     * @param array $overrides Overrides.
     *
     * @return array
     * @since 1.0.0
     */
    protected function create_order(array $overrides = []): array
    {
        $response = $this->request('POST', 'orders', $this->order_payload($overrides));
        $payload = $this->assert_api_success($response, 201);

        return $payload['data'];
    }

    /**
     * Create customer.
     *
     * @return array
     * @since 1.0.0
     */
    protected function create_customer(): array
    {
        $unique = wp_generate_password(8, false);
        $response = $this->request('POST', 'customers', [
            'first_name' => 'Order',
            'last_name' => 'Customer',
            'email' => 'order-customer-' . $unique . '@example.com',
            'phone' => '5550100',
            'is_billing_same_as_shipping' => true,
            'shipping_address' => [
                'first_name' => 'Order',
                'last_name' => 'Customer',
                'email' => 'order-customer-' . $unique . '@example.com',
                'phone' => '5550100',
                'address_line1' => '123 Main St',
                'address_line2' => '',
                'city' => 'New York',
                'state' => 'NY',
                'postal_code' => '10001',
                'country' => 'US',
            ],
        ]);

        $payload = $this->assert_api_success($response, 201);

        return $payload['data'];
    }

    /**
     * Create a non-base currency for exchange-rate conversion tests.
     * @param array $overrides Overrides.
     *
     * @return string The created currency's code.
     */
    protected function create_test_currency(array $overrides = []): string
    {
        $code = $overrides['code'] ?? 'T' . strtoupper(substr(wp_generate_password(4, false), 0, 2));

        $response = $this->request('POST', 'currencies', [
            'items' => [
                array_merge([
                    'name' => 'Test Currency',
                    'symbol' => '$',
                    'exchange_rate' => 1.0,
                    'is_active' => true,
                    'is_base' => false,
                ], $overrides, ['code' => $code]),
            ],
        ]);

        $this->assert_api_success($response, 201);

        return $code;
    }

    /**
     * Order payload.
     * @param array $overrides Overrides.
     *
     * @return array
     * @since 1.0.0
     */
    protected function order_payload(array $overrides = []): array
    {
        $payload = [
            'items' => [
                [
                    'variant_id' => $this->variant_id,
                    'quantity' => 1,
                ],
            ],
            'currency_code' => 'USD',
            'payment_provider' => 'paypal',
            'shipping_method' => 'method-0001',
            'is_manual' => true,
            'shipping_first_name' => 'John',
            'shipping_last_name' => 'Doe',
            'shipping_address_line1' => '123 Main St',
            'shipping_city' => 'New York',
            'shipping_state' => 'NY',
            'shipping_postcode' => '10001',
            'shipping_country' => 'US',
            'billing_first_name' => 'John',
            'billing_last_name' => 'Doe',
            'billing_address_line1' => '123 Main St',
            'billing_city' => 'New York',
            'billing_state' => 'NY',
            'billing_postcode' => '10001',
            'billing_country' => 'US',
            'customer_notes' => 'Test order',
        ];

        return array_merge($payload, $overrides);
    }
}
