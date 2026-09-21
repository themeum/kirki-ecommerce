<?php

namespace Kirki\Ecommerce\Tests\Unit\Payment;

use Exception;
use Kirki\Ecommerce\App\Constants\Order\PaymentStatus;
use Kirki\Ecommerce\App\Managers\OrderManager;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Payment\Providers\PayPal;
use Kirki\Ecommerce\Framework\Container;
use Kirki\Ecommerce\Tests\Unit\TestCase;

class PayPalWebhookTest extends TestCase
{
    const SIGNATURE_HEADERS = [
        'HTTP_PAYPAL_AUTH_ALGO' => 'SHA256withRSA',
        'HTTP_PAYPAL_CERT_URL' => 'https://api.sandbox.paypal.com/v1/notifications/certs/CERT-1',
        'HTTP_PAYPAL_TRANSMISSION_ID' => 'transmission-1',
        'HTTP_PAYPAL_TRANSMISSION_SIG' => 'c2lnbmF0dXJl+/=',
        'HTTP_PAYPAL_TRANSMISSION_TIME' => '2026-01-01T00:00:00Z',
    ];

    const CAPTURE_COMPLETED_PAYLOAD = '{"event_type":"PAYMENT.CAPTURE.COMPLETED","links":[],"resource":{"id":"CAPTURE-1","custom_id":"7","supplementary_data":{"related_ids":{"order_id":"PAYPAL-ORDER-1"}},"metadata":{}}}';

    protected $http_calls;

    protected $order_calls;

    protected $verification_response;

    protected $order;

    protected function setUp(): void
    {
        parent::setUp();

        $this->http_calls = [];
        $this->order_calls = [];
        $this->verification_response = ['status' => 200, 'body' => ['verification_status' => 'SUCCESS']];
        $this->order = new Order();
        $this->order->id = 7;
        $this->order->payment_status = PaymentStatus::UNPAID;
        $this->order->currency_code = 'USD';

        $this->bind_fakes();
    }

    protected function tearDown(): void
    {
        foreach (array_keys(static::SIGNATURE_HEADERS) as $server_key) {
            unset($_SERVER[$server_key]);
        }

        parent::tearDown();
    }

    protected function bind_fakes(): void
    {
        $test = $this;

        $http = new class($test) {
            protected $test;

            protected $bearer_token = null;

            protected $body = null;

            public function __construct($test)
            {
                $this->test = $test;
            }

            public function with_headers(array $headers)
            {
                return $this;
            }

            public function as_form()
            {
                return $this;
            }

            public function as_json()
            {
                return $this;
            }

            public function with_token(string $token, $type = 'Bearer')
            {
                $this->bearer_token = $token;

                return $this;
            }

            public function with_body($content, $type = 'application/json')
            {
                $this->body = $content;

                return $this;
            }

            public function post(string $url, array $data = [])
            {
                $this->test->record_http_call($url, $this->bearer_token, $this->body);

                return $this->test->respond_to($url);
            }
        };

        $orders = new class($test) {
            protected $test;

            public function __construct($test)
            {
                $this->test = $test;
            }

            public function __call($method, $arguments)
            {
                return $this->test->handle_order_call($method, $arguments);
            }
        };

        $container = new Container();
        $container->instance('app', $container);
        $container->bind('client-request', fn() => $http);
        $container->bind(OrderManager::class, fn() => $orders);

        $this->set_container_instance($container);
    }

    public function record_http_call(string $url, $bearer_token, $body): void
    {
        $this->http_calls[] = ['url' => $url, 'bearer_token' => $bearer_token, 'body' => $body];
    }

    public function respond_to(string $url)
    {
        if (strpos($url, '/v1/oauth2/token') !== false) {
            return $this->make_response(200, ['access_token' => 'token-123']);
        }

        if ($this->verification_response instanceof Exception) {
            throw $this->verification_response;
        }

        return $this->make_response($this->verification_response['status'], $this->verification_response['body']);
    }

    public function handle_order_call(string $method, array $arguments)
    {
        $this->order_calls[] = $method;

        if ($method === 'find_by_transaction_id') {
            return $this->order;
        }

        return null;
    }

    protected function make_response(int $status, $body)
    {
        return new class($status, $body) {
            protected $status;

            protected $body;

            public function __construct($status, $body)
            {
                $this->status = $status;
                $this->body = $body;
            }

            public function successful()
            {
                return $this->status >= 200 && $this->status < 300;
            }

            public function failed()
            {
                return $this->status >= 400;
            }

            public function body()
            {
                return json_encode($this->body);
            }

            public function json($key = null, $default = null)
            {
                if ($key === null) {
                    return $this->body;
                }

                return $this->body[$key] ?? $default;
            }
        };
    }

    protected function make_provider(string $payload, array $settings = []): PayPal
    {
        $provider = new class extends PayPal {
            public $body = '';

            public function __construct()
            {
            }

            protected function get_request_body()
            {
                return $this->body;
            }
        };

        $provider->body = $payload;

        $settings = array_merge([
            'is_enabled' => true,
            'client_id' => 'client',
            'client_secret' => 'secret',
            'webhook_id' => 'WH-123',
            'sandbox' => true,
        ], $settings);

        $reflection = new \ReflectionObject($provider);

        while (!$reflection->hasProperty('settings')) {
            $reflection = $reflection->getParentClass();
        }

        foreach (['settings' => $settings, 'is_enabled' => true] as $name => $value) {
            $property = $reflection->getProperty($name);
            $property->setAccessible(true);
            $property->setValue($provider, $value);
        }

        return $provider;
    }

    protected function send_signature_headers(array $overrides = []): void
    {
        foreach (array_merge(static::SIGNATURE_HEADERS, $overrides) as $server_key => $value) {
            if ($value === null) {
                unset($_SERVER[$server_key]);
                continue;
            }

            $_SERVER[$server_key] = $value;
        }
    }

    protected function verification_calls(): array
    {
        return array_values(array_filter($this->http_calls, function ($call) {
            return strpos($call['url'], '/v1/notifications/verify-webhook-signature') !== false;
        }));
    }

    protected function assert_order_untouched(): void
    {
        $this->assertSame([], $this->order_calls);
    }

    public function test_it_rejects_a_webhook_without_signature_headers(): void
    {
        $provider = $this->make_provider(static::CAPTURE_COMPLETED_PAYLOAD);

        $this->assertFalse($provider->webhook());
        $this->assertSame([], $this->verification_calls());
        $this->assert_order_untouched();
    }

    public function test_it_rejects_a_webhook_missing_any_single_signature_header(): void
    {
        foreach (array_keys(static::SIGNATURE_HEADERS) as $missing_header) {
            $this->http_calls = [];
            $this->send_signature_headers([$missing_header => null]);

            $provider = $this->make_provider(static::CAPTURE_COMPLETED_PAYLOAD);

            $this->assertFalse($provider->webhook(), $missing_header);
            $this->assertSame([], $this->verification_calls(), $missing_header);
            $this->assert_order_untouched();
        }
    }

    public function test_it_rejects_a_webhook_when_the_webhook_id_is_empty(): void
    {
        $this->send_signature_headers();

        foreach (['', '   '] as $webhook_id) {
            $provider = $this->make_provider(static::CAPTURE_COMPLETED_PAYLOAD, ['webhook_id' => $webhook_id]);

            $this->assertFalse($provider->webhook());
        }

        $provider = $this->make_provider(static::CAPTURE_COMPLETED_PAYLOAD, ['webhook_id' => null]);

        $this->assertFalse($provider->webhook());
        $this->assertSame([], $this->verification_calls());
        $this->assert_order_untouched();
    }

    public function test_it_rejects_an_empty_or_invalid_body(): void
    {
        $this->send_signature_headers();

        $this->assertFalse($this->make_provider('')->webhook());
        $this->assertFalse($this->make_provider('not json')->webhook());
        $this->assertSame([], $this->http_calls);
        $this->assert_order_untouched();
    }

    public function test_it_rejects_a_webhook_when_the_verification_call_fails(): void
    {
        $this->send_signature_headers();

        $this->verification_response = ['status' => 500, 'body' => ['name' => 'INTERNAL_SERVICE_ERROR']];

        $this->assertFalse($this->make_provider(static::CAPTURE_COMPLETED_PAYLOAD)->webhook());
        $this->assertCount(1, $this->verification_calls());
        $this->assert_order_untouched();
    }

    public function test_it_rejects_a_webhook_when_the_verification_call_throws(): void
    {
        $this->send_signature_headers();

        $this->verification_response = new Exception('Connection timed out');

        $this->assertFalse($this->make_provider(static::CAPTURE_COMPLETED_PAYLOAD)->webhook());
        $this->assert_order_untouched();
    }

    public function test_it_rejects_a_webhook_when_paypal_authentication_fails(): void
    {
        $this->send_signature_headers();

        $provider = $this->make_provider(static::CAPTURE_COMPLETED_PAYLOAD, ['client_secret' => '']);

        $this->assertFalse($provider->webhook());
        $this->assertSame([], $this->http_calls);
        $this->assert_order_untouched();
    }

    public function test_it_rejects_a_webhook_when_verification_is_not_a_success(): void
    {
        $this->send_signature_headers();

        foreach ([['verification_status' => 'FAILURE'], ['verification_status' => ''], []] as $body) {
            $this->verification_response = ['status' => 200, 'body' => $body];

            $this->assertFalse($this->make_provider(static::CAPTURE_COMPLETED_PAYLOAD)->webhook());
        }

        $this->assert_order_untouched();
    }

    public function test_it_marks_the_order_paid_for_a_verified_capture_completed_event(): void
    {
        $this->send_signature_headers();

        $this->assertTrue($this->make_provider(static::CAPTURE_COMPLETED_PAYLOAD)->webhook());

        $this->assertContains('mark_payment_as_paid', $this->order_calls);
        $this->assertContains('set_transaction_id', $this->order_calls);
    }

    public function test_it_sends_the_signature_headers_webhook_id_and_untouched_event_to_paypal(): void
    {
        $this->send_signature_headers();

        $this->make_provider(static::CAPTURE_COMPLETED_PAYLOAD)->webhook();

        $calls = $this->verification_calls();

        $this->assertCount(1, $calls);
        $this->assertSame('https://api-m.sandbox.paypal.com/v1/notifications/verify-webhook-signature', $calls[0]['url']);
        $this->assertSame('token-123', $calls[0]['bearer_token']);
        $this->assertStringContainsString('"webhook_event":' . static::CAPTURE_COMPLETED_PAYLOAD . '}', $calls[0]['body']);

        $sent = json_decode($calls[0]['body'], true);

        $this->assertSame('WH-123', $sent['webhook_id']);
        $this->assertSame('SHA256withRSA', $sent['auth_algo']);
        $this->assertSame('https://api.sandbox.paypal.com/v1/notifications/certs/CERT-1', $sent['cert_url']);
        $this->assertSame('transmission-1', $sent['transmission_id']);
        $this->assertSame('c2lnbmF0dXJl+/=', $sent['transmission_sig']);
        $this->assertSame('2026-01-01T00:00:00Z', $sent['transmission_time']);
        $this->assertSame('PAYMENT.CAPTURE.COMPLETED', $sent['webhook_event']['event_type']);
    }
}
