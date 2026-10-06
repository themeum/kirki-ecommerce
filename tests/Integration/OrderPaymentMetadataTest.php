<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Facades\Order as OrderManager;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\Tests\Support\CreatesTestProducts;
use Kirki\Ecommerce\Tests\Support\RestTestCase;
use Kirki\Ecommerce\Tests\Support\SeedsTestShipping;

class OrderPaymentMetadataTest extends RestTestCase
{
    use CreatesTestProducts;
    use SeedsTestShipping;

    /** @var int */
    protected $order_id;

    /**
     * Place an order with PayPal as its provider.
     *
     * @return void
     * @since 1.0.0
     */
    protected function setUp(): void
    {
        parent::setUp();

        $this->seed_base_currency();
        $this->seed_shipping_settings();

        $variant_id = $this->default_variant_id($this->create_product());

        $response = $this->request('POST', 'checkout', [
            'items' => [['variant_id' => $variant_id, 'quantity' => 1]],
            'currency_code' => 'USD',
            'payment_provider' => 'paypal',
            'shipping_method' => 'method-0001',
            'is_manual' => true,
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
        ]);

        $this->order_id = $this->assert_api_success($response, 201)['data']['id'];
    }

    /**
     * A gateway write leaves the provider name, icon and offline flag in place.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_gateway_write_keeps_provider_snapshot(): void
    {
        OrderManager::set_payment_metadata($this->order_id, wp_json_encode(['id' => 'CAPTURE-1', 'status' => 'COMPLETED']));

        $details = $this->assert_api_success($this->request('GET', 'orders/' . $this->order_id))['data'];

        $this->assertSame('PayPal', $details['payment_provider_name']);
        $this->assertNotEmpty($details['payment_provider_icon']);
        $this->assertFalse($details['payment_provider_is_offline']);
    }

    /**
     * The order list still reports the provider after a gateway write.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_order_list_keeps_provider_after_gateway_write(): void
    {
        OrderManager::set_payment_metadata($this->order_id, wp_json_encode(['id' => 'CAPTURE-1']));

        $results = $this->assert_api_success($this->request('GET', 'orders', ['page' => 1, 'limit' => 10]))['data']['results'];
        $listed = array_values(array_filter($results, fn($result) => $result['id'] == $this->order_id));

        $this->assertCount(1, $listed);
        $this->assertSame('PayPal', $listed[0]['payment_provider_name']);
    }

    /**
     * The gateway's data is kept under the gateway key.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_gateway_data_is_stored_under_gateway_key(): void
    {
        OrderManager::set_payment_metadata($this->order_id, wp_json_encode(['id' => 'CAPTURE-1', 'status' => 'COMPLETED']));

        $metadata = Order::find($this->order_id)->payment_metadata;

        $this->assertSame(['id' => 'CAPTURE-1', 'status' => 'COMPLETED'], $metadata['gateway']);
        $this->assertSame('paypal', $metadata['payment_provider']['id']);
    }

    /**
     * A second gateway write replaces the gateway data and keeps the snapshot.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_second_gateway_write_replaces_gateway_data_and_keeps_snapshot(): void
    {
        OrderManager::set_payment_metadata($this->order_id, wp_json_encode(['status' => 'PENDING']));
        OrderManager::set_payment_metadata($this->order_id, wp_json_encode(['status' => 'COMPLETED']));

        $metadata = Order::find($this->order_id)->payment_metadata;

        $this->assertSame(['status' => 'COMPLETED'], $metadata['gateway']);
        $this->assertSame('PayPal', $metadata['payment_provider']['name']);
    }

    /**
     * A payload that is not JSON is kept as given.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_non_json_payload_is_stored_as_given(): void
    {
        OrderManager::set_payment_metadata($this->order_id, 'not-json');

        $metadata = Order::find($this->order_id)->payment_metadata;

        $this->assertSame('not-json', $metadata['gateway']);
        $this->assertSame('paypal', $metadata['payment_provider']['id']);
    }

    /**
     * A row whose metadata an earlier webhook replaced with a raw JSON string is rewritten without error.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_legacy_string_metadata_is_replaced_with_structured_metadata(): void
    {
        $order = Order::find($this->order_id);
        $order->payment_metadata = '{"id":"CAPTURE-OLD"}';
        $order->save();

        $this->assertTrue(OrderManager::set_payment_metadata($this->order_id, wp_json_encode(['id' => 'CAPTURE-NEW'])));

        $this->assertSame(['gateway' => ['id' => 'CAPTURE-NEW']], Order::find($this->order_id)->payment_metadata);
    }

    /**
     * Writing to an order that does not exist reports failure.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_unknown_order_returns_false(): void
    {
        $this->assertFalse(OrderManager::set_payment_metadata(999999, wp_json_encode(['id' => 'CAPTURE-1'])));
    }
}
