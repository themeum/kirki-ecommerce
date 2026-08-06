<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Constants\BulkActions;
use Kirki\Ecommerce\App\Constants\Order\RefundStatus;
use Kirki\Ecommerce\Tests\Support\CreatesTestProducts;
use Kirki\Ecommerce\Tests\Support\RestTestCase;
use Kirki\Ecommerce\Tests\Support\SeedsTestShipping;

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
    }

    /**
     * List orders returns paginated results.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_list_orders_returns_paginated_results(): void
    {
        $this->create_order();

        $response = $this->request('GET', 'orders', [
            'page' => 1,
            'limit' => 10,
        ]);

        $payload = $this->assert_api_success($response);
        $this->assertArrayHasKey('results', $payload['data']);
        $this->assertGreaterThanOrEqual(1, $payload['data']['total']);
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
            'payment_method' => 'stripe',
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
