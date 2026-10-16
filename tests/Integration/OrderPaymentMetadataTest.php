<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Facades\Order as OrderManager;
use Kirki\Ecommerce\App\Constants\Order\OrderAction;
use Kirki\Ecommerce\App\Constants\Order\OrderActivityType;
use Kirki\Ecommerce\App\Constants\Order\PaymentStatus;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Payment\Facades\Payment;
use Kirki\Ecommerce\App\Payment\PaymentManager;
use Kirki\Ecommerce\App\Services\OrderActivityService;
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

    /**
     * The snapshot of a registered provider holds its id, name, icon and offline flag.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_build_snapshot_returns_the_provider_fields(): void
    {
        $snapshot = Payment::build_snapshot('paypal');

        $this->assertSame('paypal', $snapshot['payment_provider']['id']);
        $this->assertSame('PayPal', $snapshot['payment_provider']['name']);
        $this->assertNotEmpty($snapshot['payment_provider']['icon']);
        $this->assertFalse($snapshot['payment_provider']['is_offline']);

        $offline_id = $this->create_offline_provider('Cash on Delivery');
        $offline = Payment::build_snapshot($offline_id)['payment_provider'];

        $this->assertSame($offline_id, $offline['id']);
        $this->assertSame('Cash on Delivery', $offline['name']);
        $this->assertTrue($offline['is_offline']);
    }

    /**
     * An unknown or empty provider id has no snapshot.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_build_snapshot_returns_null_for_unknown_or_empty_id(): void
    {
        $this->assertNull(Payment::build_snapshot('no-such-provider'));
        $this->assertNull(Payment::build_snapshot(null));
        $this->assertNull(Payment::build_snapshot(''));
    }

    /**
     * Marking an order paid with another provider moves the column and the snapshot together.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_mark_as_paid_with_another_provider_refreshes_the_snapshot(): void
    {
        $offline_id = $this->create_offline_provider('Cash on Delivery');

        $this->mark_as_paid($offline_id);

        $order = Order::find($this->order_id);
        $this->assertSame(PaymentStatus::PAID, $order->payment_status);
        $this->assertSame($offline_id, $order->payment_provider);
        $this->assertSame($offline_id, $order->payment_metadata['payment_provider']['id']);

        $details = $this->assert_api_success($this->request('GET', 'orders/' . $this->order_id))['data'];
        $this->assertSame('Cash on Delivery', $details['payment_provider_name']);
        $this->assertTrue($details['payment_provider_is_offline']);

        $results = $this->assert_api_success($this->request('GET', 'orders', ['page' => 1, 'limit' => 10]))['data']['results'];
        $listed = array_values(array_filter($results, fn($result) => $result['id'] == $this->order_id));
        $this->assertSame('Cash on Delivery', $listed[0]['payment_provider_name']);
        $this->assertTrue($listed[0]['payment_provider_is_offline']);
    }

    /**
     * The old provider's gateway data is dropped when the provider changes.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_mark_as_paid_with_another_provider_drops_gateway_data(): void
    {
        OrderManager::set_payment_metadata($this->order_id, wp_json_encode(['id' => 'CAPTURE-1']));
        $offline_id = $this->create_offline_provider('Cash on Delivery');

        $this->mark_as_paid($offline_id);

        $this->assertArrayNotHasKey('gateway', Order::find($this->order_id)->payment_metadata);
    }

    /**
     * Marking an order paid with the provider already in the snapshot keeps the gateway data.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_mark_as_paid_with_the_same_provider_keeps_the_metadata(): void
    {
        OrderManager::set_payment_metadata($this->order_id, wp_json_encode(['id' => 'CAPTURE-1']));
        $before = Order::find($this->order_id)->payment_metadata;

        $this->mark_as_paid('paypal');

        $this->assertSame($before, Order::find($this->order_id)->payment_metadata);
    }

    /**
     * Marking an order paid without a provider, as a gateway webhook does, leaves the provider and metadata alone.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_mark_as_paid_without_a_provider_changes_nothing(): void
    {
        OrderManager::set_payment_metadata($this->order_id, wp_json_encode(['id' => 'CAPTURE-1']));
        $before = Order::find($this->order_id)->payment_metadata;

        $this->assertTrue(OrderManager::mark_payment_as_paid($this->order_id));

        $order = Order::find($this->order_id);
        $this->assertSame('paypal', $order->payment_provider);
        $this->assertSame($before, $order->payment_metadata);
    }

    /**
     * An order that has no provider and no snapshot gets both when it is marked paid with a provider.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_mark_as_paid_creates_a_snapshot_for_an_order_without_a_provider(): void
    {
        $order = Order::find($this->order_id);
        $order->payment_provider = null;
        $order->payment_metadata = null;
        $order->save();
        $offline_id = $this->create_offline_provider('Cash on Delivery');

        $this->mark_as_paid($offline_id);

        $order = Order::find($this->order_id);
        $this->assertSame($offline_id, $order->payment_provider);
        $this->assertSame('Cash on Delivery', $order->payment_metadata['payment_provider']['name']);
    }

    /**
     * An unregistered provider is rejected and the order stays unpaid and unchanged.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_mark_as_paid_with_an_unknown_provider_is_rejected(): void
    {
        $before = Order::find($this->order_id)->payment_metadata;

        $this->assert_api_error($this->request('PATCH', 'orders/' . $this->order_id . '/action', [
            'action' => OrderAction::MARK_AS_PAID,
            'payment_provider' => 'no-such-provider',
        ]), 422);

        $order = Order::find($this->order_id);
        $this->assertSame(PaymentStatus::UNPAID, $order->payment_status);
        $this->assertSame('paypal', $order->payment_provider);
        $this->assertSame($before, $order->payment_metadata);
    }

    /**
     * A registered provider that is disabled is still accepted.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_mark_as_paid_with_a_disabled_provider_is_accepted(): void
    {
        $disabled_id = $this->create_offline_provider('Bank transfer', false);

        $this->mark_as_paid($disabled_id);

        $order = Order::find($this->order_id);
        $this->assertSame(PaymentStatus::PAID, $order->payment_status);
        $this->assertSame($disabled_id, $order->payment_provider);
    }

    /**
     * Mark the order as paid through the order action endpoint.
     *
     * @param string $payment_provider Provider ID.
     * @return void
     * @since 1.0.0
     */
    protected function mark_as_paid(string $payment_provider): void
    {
        $this->assert_api_success($this->request('PATCH', 'orders/' . $this->order_id . '/action', [
            'action' => OrderAction::MARK_AS_PAID,
            'payment_provider' => $payment_provider,
        ]));
    }

    /**
     * The payment-completed activity names the provider the order was paid with.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_payment_completed_activity_names_the_new_provider(): void
    {
        $offline_id = $this->create_offline_provider('Bank transfer');

        $this->mark_as_paid($offline_id);

        $description = $this->payment_completed_description();
        $this->assertStringContainsString('via Bank transfer.', $description);
        $this->assertStringNotContainsString($offline_id, $description);
        $this->assertStringNotContainsString('PayPal', $description);
    }

    /**
     * A provider renamed after the payment does not change the recorded activity.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_payment_completed_activity_keeps_the_name_after_a_rename(): void
    {
        $offline_id = $this->create_offline_provider('Bank transfer');
        $this->mark_as_paid($offline_id);

        $this->assert_api_success($this->request('PATCH', 'offline-payments/' . $offline_id, ['name' => 'Wire transfer']));

        $this->assertStringContainsString('via Bank transfer.', $this->payment_completed_description());
    }

    /**
     * An older activity that holds only the provider id still shows the id.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_payment_completed_activity_without_a_name_shows_the_id(): void
    {
        (new OrderActivityService())->create($this->order_id, OrderActivityType::PAYMENT_COMPLETED, null, [
            'amount' => 1000,
            'currency_code' => 'USD',
            'provider' => 'bank_transfer',
        ], null);

        $this->assertStringContainsString('via bank_transfer.', $this->payment_completed_description());
    }

    /**
     * An order paid with no provider known has an activity that names none.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_payment_completed_activity_without_a_provider_names_none(): void
    {
        $order = Order::find($this->order_id);
        $order->payment_provider = null;
        $order->payment_metadata = null;
        $order->save();

        OrderManager::mark_payment_as_paid($this->order_id);

        $this->assertStringNotContainsString(' via ', $this->payment_completed_description());
    }

    /**
     * Get the description of the order's payment-completed activity from the admin timeline.
     *
     * @return string
     * @since 1.0.0
     */
    protected function payment_completed_description(): string
    {
        $results = $this->assert_api_success($this->request('GET', 'orders/' . $this->order_id . '/activities'))['data']['results'];
        $activities = array_values(array_filter($results, fn($activity) => $activity['activity_type'] === 'payment-completed'));

        $this->assertCount(1, $activities);

        return $activities[0]['description'];
    }

    /**
     * Create an offline payment provider and return its ID.
     *
     * @param string $name       Provider name.
     * @param bool   $is_enabled Whether the provider is enabled.
     * @return string
     * @since 1.0.0
     */
    protected function create_offline_provider(string $name, bool $is_enabled = true): string
    {
        $created = $this->request('POST', 'offline-payments', ['name' => $name, 'is_enabled' => $is_enabled]);
        $id = $this->assert_api_success($created, 201)['data']['id'];
        $this->start_new_request();

        return $id;
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
}
