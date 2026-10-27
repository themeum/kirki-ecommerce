<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Payment\Facades\Payment;
use Kirki\Ecommerce\App\Payment\PaymentManager;
use Kirki\Ecommerce\Framework\Http\Client\Request as ClientRequest;
use Kirki\Ecommerce\Tests\Support\CreatesTestProducts;
use Kirki\Ecommerce\Tests\Support\EnablesPaymentProviders;
use Kirki\Ecommerce\Tests\Support\RestTestCase;
use Kirki\Ecommerce\Tests\Support\SeedsTestShipping;

use function Kirki\Ecommerce\Framework\app;

class PayPalCreateOrderTest extends RestTestCase
{
    use CreatesTestProducts;
    use EnablesPaymentProviders;
    use SeedsTestShipping;

    /** @var int */
    protected $variant_id;

    /** @var array<int, array<string, mixed>> */
    protected $create_order_requests = [];

    /**
     * Configure and enable PayPal, and route its HTTP calls to a recording fake.
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

        $this->assert_api_success($this->request('PUT', 'online-payments/paypal', [
            'data' => ['client_id' => 'client', 'client_secret' => 'secret', 'sandbox' => true],
        ]));
        $this->enable_payment_provider('paypal');

        $this->create_order_requests = [];
        $this->fake_paypal_http();
    }

    /**
     * Put the container's HTTP client back for the tests that follow.
     *
     * @return void
     * @since 1.0.0
     */
    protected function tearDown(): void
    {
        app()->forget_instance('client-request');
        app()->alias('client-request', ClientRequest::class);

        parent::tearDown();
    }

    /**
     * Starting payment twice for one order sends the same idempotency key both times.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_paying_the_same_order_twice_sends_the_same_request_id(): void
    {
        $order = $this->place_order();
        $this->create_order_requests = [];

        $this->pay($order);
        $this->pay($order);

        $this->assertCount(2, $this->create_order_requests);
        $this->assertSame('kirki-paypal-' . $order->uuid, $this->create_order_requests[0]['PayPal-Request-Id']);
        $this->assertSame($this->create_order_requests[0]['PayPal-Request-Id'], $this->create_order_requests[1]['PayPal-Request-Id']);
    }

    /**
     * Two different orders never share an idempotency key.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_different_orders_send_different_request_ids(): void
    {
        $first = $this->place_order();
        $second = $this->place_order();
        $this->create_order_requests = [];

        $this->pay($first);
        $this->pay($second);

        $this->assertCount(2, $this->create_order_requests);
        $this->assertNotSame($this->create_order_requests[0]['PayPal-Request-Id'], $this->create_order_requests[1]['PayPal-Request-Id']);
    }

    /**
     * Run PayPal's pay step for an order.
     *
     * @param Order $order Order to pay.
     * @return void
     * @since 1.0.0
     */
    protected function pay(Order $order): void
    {
        static::forget_singleton(PaymentManager::class);
        $this->reset_facade_cache();

        $action = Payment::get_provider('paypal')->pay(Order::find($order->id));

        $this->assertSame('https://paypal.test/approve', $action->value);
    }

    /**
     * Place an admin order that names PayPal as its provider.
     *
     * The checkout response itself starts payment, so callers clear the recorded
     * requests after placing their orders.
     *
     * @return Order
     * @since 1.0.0
     */
    protected function place_order(): Order
    {
        $response = $this->request('POST', 'checkout', [
            'items' => [['variant_id' => $this->variant_id, 'quantity' => 1]],
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

        return Order::find($this->assert_api_success($response, 201)['data']['id']);
    }

    /**
     * Replace the container's HTTP client with a fake that answers PayPal and records create-order headers.
     *
     * @return void
     * @since 1.0.0
     */
    protected function fake_paypal_http(): void
    {
        $test = $this;

        $client = new class($test) {
            protected $test;

            protected $headers = [];

            public function __construct($test)
            {
                $this->test = $test;
            }

            public function with_headers(array $headers)
            {
                $this->headers = array_merge($this->headers, $headers);

                return $this;
            }

            public function with_token(string $token, $type = 'Bearer')
            {
                return $this->with_headers(['Authorization' => $type . ' ' . $token]);
            }

            public function as_form()
            {
                return $this;
            }

            public function as_json()
            {
                return $this;
            }

            public function post(string $url, array $data = [])
            {
                if (substr($url, -strlen('/v2/checkout/orders')) === '/v2/checkout/orders') {
                    $this->test->record_create_order_request($this->headers);

                    return $this->response(['id' => 'PP-ORDER', 'links' => [['rel' => 'approve', 'href' => 'https://paypal.test/approve']]]);
                }

                return $this->response(['access_token' => 'token-123']);
            }

            protected function response(array $body)
            {
                return new class($body) {
                    protected $body;

                    public function __construct($body)
                    {
                        $this->body = $body;
                    }

                    public function failed()
                    {
                        return false;
                    }

                    public function body()
                    {
                        return json_encode($this->body);
                    }

                    public function json($key = null, $default = null)
                    {
                        return $key === null ? $this->body : ($this->body[$key] ?? $default);
                    }
                };
            }
        };

        app()->instance('client-request', $client);
        $this->reset_facade_cache();
    }

    /**
     * Record the headers of one create-order request.
     *
     * @param array<string, mixed> $headers Request headers.
     * @return void
     * @since 1.0.0
     */
    public function record_create_order_request(array $headers): void
    {
        $this->create_order_requests[] = $headers;
    }
}
