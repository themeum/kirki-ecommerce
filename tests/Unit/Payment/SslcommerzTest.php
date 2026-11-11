<?php

namespace Kirki\Ecommerce\Tests\Unit\Payment;

use Exception;
use Kirki\Ecommerce\App\Constants\Order\OrderStatus;
use Kirki\Ecommerce\App\Constants\Order\PaymentStatus;
use Kirki\Ecommerce\App\Constants\Order\RefundStatus;
use Kirki\Ecommerce\App\Constants\Payment\PaymentActionType;
use Kirki\Ecommerce\App\Managers\MoneyManager;
use Kirki\Ecommerce\App\Managers\OrderManager;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Models\Refund;
use Kirki\Ecommerce\App\Supports\CountryData;
use Kirki\Ecommerce\Framework\Container;
use Kirki\Ecommerce\Framework\Http\Request;
use Kirki\Ecommerce\Framework\Route;
use Kirki\Ecommerce\Payments\Sslcommerz;
use Kirki\Ecommerce\Payments\SslcommerzClient;
use Kirki\Ecommerce\Payments\SslcommerzConstant;
use Kirki\Ecommerce\Payments\SslcommerzPaymentCheckJob;
use Kirki\Ecommerce\Payments\SslcommerzRefundCheckJob;
use Kirki\Ecommerce\Payments\SslcommerzRejectedException;
use Kirki\Ecommerce\Payments\SslcommerzTransactionBuilder;
use Kirki\Ecommerce\Payments\SslcommerzUnknownResultException;
use Kirki\Ecommerce\Tests\Unit\TestCase;

foreach (['SslcommerzConstant', 'SslcommerzRejectedException', 'SslcommerzUnknownResultException', 'SslcommerzClient', 'SslcommerzTransactionBuilder', 'SslcommerzPaymentCheckJob', 'SslcommerzRefundCheckJob', 'Sslcommerz'] as $sslcommerz_class) {
    require_once dirname(__DIR__, 3) . '/payments/kirki-sslcommerz/src/' . $sslcommerz_class . '.php';
}

class SslcommerzTest extends TestCase
{
    const SANDBOX = 'https://sandbox.sslcommerz.com';
    const LIVE = 'https://securepay.sslcommerz.com';
    const SESSION = '/gwprocess/v4/api.php';
    const VALIDATION = '/validator/api/validationserverAPI.php';
    const TRANSACTION = '/validator/api/merchantTransIDvalidationAPI.php';
    const WEBHOOK_URL = 'https://shop.test/wp-json/kirki/payment/webhook/sslcommerz';
    const UUID = 'uuid-1';
    const TRAN_ID = '7-9f3ac17e2b00';
    const VAL_ID = 'VAL-1';
    const PASSWORD = 'store-secret@ssl';
    const SUCCESS_URL = 'https://shop.test/checkout?order=success&uuid=uuid-1';
    const FAILED_URL = 'https://shop.test/checkout?order=failed&uuid=uuid-1';
    const HOME_URL = 'https://shop.test';

    /** @var array<int, array<string, mixed>> */
    public $http_calls = [];

    /** @var array<string, array<int, array{0: int, 1: mixed}>> */
    public $responses = [];

    /** @var array<int, array{0: string, 1: array}> */
    public $order_calls = [];

    /** @var string|null */
    public $fail_on = null;

    /** @var array<int, array{0: string, 1: string}> */
    public $logs = [];

    /** @var string[] */
    public $db_calls = [];

    /** @var Order */
    public $order;

    /** @var int[] */
    public $locked_orders = [];

    /** @var array<int, array> */
    public $scheduled_checks = [];

    /** @var array<int, array> */
    public $scheduled_refund_checks = [];

    /** @var bool */
    public $dispatch_fails = false;

    /** @var callable|null Runs after the lock, to act as another request that finished first. */
    public $after_lock = null;

    /** @var array<int, Refund> */
    public $recorded_refunds = [];

    /** @var array<int, array> */
    public $refund_updates = [];

    protected function setUp(): void
    {
        parent::setUp();

        $this->order = $this->make_order();
        $this->bind_fakes();
        $this->set_country_index(['BD' => ['name' => 'Bangladesh']]);
    }

    protected function tearDown(): void
    {
        $router = new \ReflectionProperty(Route::class, 'site_router');
        $router->setAccessible(true);
        $router->setValue(null, null);
        $_POST = [];
        $_GET = [];
        $this->set_country_index(null);

        parent::tearDown();
    }

    // Provider.

    public function test_provider_is_online_with_id_sslcommerz_and_no_currency_restriction(): void
    {
        $provider = $this->make_provider();
        $id = new \ReflectionProperty(\Kirki\Ecommerce\App\Payment\PaymentProvider::class, 'id');
        $id->setAccessible(true);
        $id->setValue($provider, 'sslcommerz');

        $this->assertSame('sslcommerz', $provider->id());
        $this->assertFalse($provider->is_offline());
        $this->assertSame([], $provider->supported_currencies());
        $this->assertTrue($provider->supports_currency('USD'));
    }

    public function test_missing_sandbox_value_uses_the_sandbox_host(): void
    {
        $settings = $this->settings();
        unset($settings['sandbox']);
        $this->respond(static::VALIDATION, 200, $this->valid_payment());

        $this->make_provider($settings)->handle_ipn($this->ipn());

        $this->assertStringStartsWith(static::SANDBOX, $this->http_calls[0]['url']);
    }

    public function test_sandbox_off_uses_the_live_host(): void
    {
        $this->respond(static::VALIDATION, 200, $this->valid_payment());

        $this->make_provider(array_merge($this->settings(), ['sandbox' => false]))->handle_ipn($this->ipn());

        $this->assertStringStartsWith(static::LIVE, $this->http_calls[0]['url']);
    }

    public function test_settings_keep_special_characters_in_the_password(): void
    {
        $sanitize = new \ReflectionMethod(Sslcommerz::class, 'sanitize_settings');
        $sanitize->setAccessible(true);

        $sanitized = $sanitize->invoke($this->make_provider(), ['store_password' => ' a<b*c ']);

        $this->assertSame('a<b*c', $sanitized['store_password']);
    }

    // Client.

    public function test_session_posts_a_form_with_credentials(): void
    {
        $this->respond(static::SESSION, 200, ['status' => 'SUCCESS', 'sessionkey' => 'S']);

        $this->make_client()->create_session(['tran_id' => 'T']);

        $call = $this->http_calls[0];
        $this->assertSame('POST', $call['method']);
        $this->assertTrue($call['form']);
        $this->assertSame(30, $call['timeout']);
        $this->assertSame(['tran_id' => 'T', 'store_id' => 'store-id', 'store_passwd' => static::PASSWORD], $call['data']);
    }

    public function test_session_failed_at_http_200_is_rejected(): void
    {
        $this->respond(static::SESSION, 200, ['status' => 'FAILED', 'failedreason' => 'Invalid Amount']);

        $this->expectException(SslcommerzRejectedException::class);
        $this->expectExceptionMessage('Invalid Amount');

        $this->make_client()->create_session([]);
    }

    public function test_validate_sends_the_val_id_and_credentials(): void
    {
        $this->respond(static::VALIDATION, 200, ['status' => 'VALID']);

        $this->assertSame(['status' => 'VALID'], $this->make_client()->validate(static::VAL_ID));
        $this->assertSame('GET', $this->http_calls[0]['method']);
        $this->assertSame([
            'val_id' => static::VAL_ID,
            'format' => 'json',
            'v' => 1,
            'store_id' => 'store-id',
            'store_passwd' => static::PASSWORD,
        ], $this->http_calls[0]['data']);
    }

    public function test_api_connect_other_than_done_is_rejected(): void
    {
        $this->respond(static::VALIDATION, 200, ['APIConnect' => 'INACTIVE']);

        $this->expectException(SslcommerzRejectedException::class);

        $this->make_client()->validate(static::VAL_ID);
    }

    public function test_query_without_api_connect_is_unknown(): void
    {
        $this->respond(static::TRANSACTION, 200, ['element' => []]);

        $this->expectException(SslcommerzUnknownResultException::class);

        $this->make_client()->query_by_tran_id(static::TRAN_ID);
    }

    /**
     * @dataProvider unknown_responses
     */
    public function test_unclear_responses_are_unknown(int $status, $body): void
    {
        $this->respond(static::VALIDATION, $status, $body);

        $this->expectException(SslcommerzUnknownResultException::class);

        $this->make_client()->validate(static::VAL_ID);
    }

    public function unknown_responses(): array
    {
        return [
            'connection error' => [0, null],
            'server error' => [502, ['message' => 'Bad Gateway']],
            'client error' => [401, ['status' => 'VALID']],
            'non JSON body' => [200, null],
        ];
    }

    /**
     * @dataProvider client_calls
     */
    public function test_no_error_message_holds_the_password_or_a_url(callable $call, string $path): void
    {
        $this->respond($path, 500, null);

        try {
            $call($this->make_client());
            $this->fail('Expected a failure.');
        } catch (SslcommerzUnknownResultException $e) {
            $this->assertStringNotContainsString(static::PASSWORD, $e->getMessage());
            $this->assertStringNotContainsString('http', $e->getMessage());
        }
    }

    public function client_calls(): array
    {
        return [
            'create_session' => [fn($client) => $client->create_session([]), static::SESSION],
            'validate' => [fn($client) => $client->validate('V'), static::VALIDATION],
            'query_by_tran_id' => [fn($client) => $client->query_by_tran_id('T'), static::TRANSACTION],
            'refund' => [fn($client) => $client->refund([]), static::TRANSACTION],
            'query_refund' => [fn($client) => $client->query_refund('R'), static::TRANSACTION],
        ];
    }

    public function test_provider_logs_do_not_hold_the_password(): void
    {
        $this->respond(static::VALIDATION, 0, null);
        $this->respond(static::TRANSACTION, 0, null);
        $provider = $this->make_provider();

        $provider->handle_browser_return('success', $this->ipn());
        $provider->handle_browser_return('fail', $this->ipn());
        $provider->run_payment_check(7, static::TRAN_ID, 0);

        $this->assertNotEmpty($this->logs);
        $this->assertStringNotContainsString(static::PASSWORD, implode(' ', array_column($this->logs, 1)));
    }

    // Starting a payment.

    public function test_pay_creates_the_session_and_redirects(): void
    {
        $this->respond_session();

        $action = $this->make_provider()->pay($this->order);

        $this->assertSame(PaymentActionType::REDIRECT, $action->type);
        $this->assertSame('https://sandbox.sslcommerz.com/EasyCheckOut/abc', $action->value);

        $data = $this->http_calls[0]['data'];
        $this->assertSame('500.00', $data['total_amount']);
        $this->assertSame('BDT', $data['currency']);

        $metadata = json_decode($this->order_call_arguments('set_payment_metadata')[0][1], true);
        $this->assertSame($data['tran_id'], $metadata['tran_id']);
        $this->assertSame('SESSION-1', $metadata['sessionkey']);
        $this->assertSame('500.00', $metadata['amount']);
        $this->assertSame('BDT', $metadata['currency']);
    }

    public function test_tran_id_fits_the_limit_holds_the_order_id_and_is_new_each_time(): void
    {
        $this->respond_session();
        $this->order->id = 2147483647;
        $provider = $this->make_provider();

        $provider->pay($this->order);
        $provider->pay($this->order);

        $first = $this->http_calls[0]['data']['tran_id'];
        $this->assertMatchesRegularExpression('/^2147483647-[a-f0-9]{12}$/', $first);
        $this->assertLessThanOrEqual(30, strlen($first));
        $this->assertNotSame($first, $this->http_calls[1]['data']['tran_id']);
    }

    public function test_return_urls_have_the_return_argument_and_the_ipn_url_does_not(): void
    {
        $this->respond_session();

        $this->make_provider()->pay($this->order);

        $data = $this->http_calls[0]['data'];
        $this->assertSame(static::WEBHOOK_URL . '?sslcommerz_return=success', $data['success_url']);
        $this->assertSame(static::WEBHOOK_URL . '?sslcommerz_return=fail', $data['fail_url']);
        $this->assertSame(static::WEBHOOK_URL . '?sslcommerz_return=cancel', $data['cancel_url']);
        $this->assertSame(static::WEBHOOK_URL, $data['ipn_url']);
    }

    public function test_return_urls_keep_the_route_on_plain_permalinks(): void
    {
        $this->respond_session();
        $provider = $this->make_provider(null, 'https://shop.test/?rest_route=/kirki/payment/webhook/sslcommerz');

        $provider->pay($this->order);

        $this->assertSame(
            'https://shop.test/?rest_route=/kirki/payment/webhook/sslcommerz&sslcommerz_return=success',
            $this->http_calls[0]['data']['success_url']
        );
    }

    public function test_payload_for_an_order_with_a_shipping_address(): void
    {
        $this->order->shipping_first_name = 'Ada';
        $this->order->shipping_last_name = 'Rahman';
        $this->order->shipping_address_line1 = 'Road 1';
        $this->order->shipping_city = 'Dhaka';
        $this->order->shipping_postal_code = '1207';
        $this->order->shipping_country = 'BD';

        $payload = (new SslcommerzTransactionBuilder($this->order))->build_session_payload(static::TRAN_ID, []);

        $this->assertSame('YES', $payload['shipping_method']);
        $this->assertSame('physical-goods', $payload['product_profile']);
        $this->assertSame('Ada Rahman', $payload['ship_name']);
        $this->assertSame('Road 1', $payload['ship_add1']);
        $this->assertSame('Dhaka', $payload['ship_area']);
        $this->assertSame('Dhaka', $payload['ship_sub_city']);
        $this->assertSame('1207', $payload['ship_postcode']);
        $this->assertSame('Bangladesh', $payload['ship_country']);
    }

    public function test_payload_for_an_order_with_no_shipping_address(): void
    {
        $payload = (new SslcommerzTransactionBuilder($this->order))->build_session_payload(static::TRAN_ID, []);

        $this->assertSame('NO', $payload['shipping_method']);
        $this->assertSame('non-physical-goods', $payload['product_profile']);
        $this->assertArrayNotHasKey('ship_name', $payload);
        $this->assertSame('General', $payload['product_category']);
        $this->assertSame(3, $payload['num_of_item']);
        $this->assertSame('Shirt,Hat', $payload['product_name']);
        $this->assertSame('XX', $payload['cus_country'], 'An unknown code stays as it is.');
    }

    public function test_customer_fields_fall_back_and_are_cut_to_the_limits(): void
    {
        $this->order->billing_first_name = str_repeat('a', 60);
        $this->order->billing_email = '';
        $this->order->customer_email = 'buyer@example.com';
        $this->order->billing_phone = str_repeat('1', 25);
        $this->order->billing_postal_code = str_repeat('2', 35);

        $payload = (new SslcommerzTransactionBuilder($this->order))->build_session_payload(static::TRAN_ID, []);

        $this->assertSame(50, mb_strlen($payload['cus_name']));
        $this->assertSame('buyer@example.com', $payload['cus_email']);
        $this->assertSame(20, strlen($payload['cus_phone']));
        $this->assertSame(30, strlen($payload['cus_postcode']));
    }

    public function test_store_credential_failure_gets_a_helpful_message(): void
    {
        $this->respond(static::SESSION, 200, ['status' => 'FAILED', 'failedreason' => 'Store Credential Error Or Store is De-active']);

        $this->expectExceptionMessage('not the merchant panel password');

        $this->make_provider()->pay($this->order);
    }

    /**
     * @dataProvider failed_sessions
     */
    public function test_pay_fails_when_the_session_fails(int $status, $body, string $message): void
    {
        $this->respond(static::SESSION, $status, $body);

        try {
            $this->make_provider()->pay($this->order);
            $this->fail('Expected a failure.');
        } catch (Exception $e) {
            $this->assertStringContainsString('SSLCommerz Payment Error', $e->getMessage());
            $this->assertStringContainsString($message, $e->getMessage());
        }

        $this->assertSame([], $this->order_calls);
        $this->assertSame([], $this->scheduled_checks);
    }

    public function failed_sessions(): array
    {
        return [
            'rejected currency' => [200, ['status' => 'FAILED', 'failedreason' => 'Currency type correctly not supporting'], 'Currency type'],
            'no answer' => [0, null, 'clear result'],
            'no page' => [200, ['status' => 'SUCCESS', 'sessionkey' => 'S'], 'payment page'],
            'page is not HTTPS' => [200, ['status' => 'SUCCESS', 'GatewayPageURL' => 'http://x.test/'], 'payment page'],
        ];
    }

    public function test_pay_fails_on_missing_credentials_without_a_call(): void
    {
        $settings = $this->settings();
        unset($settings['store_password']);

        $this->expectExceptionMessage('credentials are missing');

        try {
            $this->make_provider($settings)->pay($this->order);
        } finally {
            $this->assertSame([], $this->http_calls);
        }
    }

    public function test_pay_fails_when_disabled(): void
    {
        $provider = $this->make_provider();
        $enabled = new \ReflectionProperty(\Kirki\Ecommerce\App\Payment\PaymentProvider::class, 'is_enabled');
        $enabled->setAccessible(true);
        $enabled->setValue($provider, false);

        $this->expectExceptionMessage('not enabled');

        try {
            $provider->pay($this->order);
        } finally {
            $this->assertSame([], $this->http_calls);
        }
    }

    // Finding the order.

    /**
     * @dataProvider unmatched_transactions
     */
    public function test_unmatched_transaction_makes_no_call_and_goes_home(string $tran_id): void
    {
        $result = $this->make_provider()->handle_browser_return('success', ['tran_id' => $tran_id, 'val_id' => static::VAL_ID]);

        $this->assertSame(static::HOME_URL, $result->get_url());
        $this->assertSame(303, $result->get_status());
        $this->assertSame([], $this->http_calls);
        $this->assertSame([], $this->order_calls);
    }

    public function unmatched_transactions(): array
    {
        return [
            'empty' => [''],
            'no separator' => ['7'],
            'non numeric order ID' => ['x-9f3ac17e2b00'],
            'unknown order' => ['8-9f3ac17e2b00'],
            'different stored value' => ['7-aaaaaaaaaaaa'],
        ];
    }

    public function test_order_from_another_gateway_does_not_match(): void
    {
        $this->order->payment_metadata = ['gateway' => ['paymentId' => 'TR001']];

        $this->assertFalse($this->make_provider()->handle_ipn($this->ipn()));
        $this->assertSame([], $this->http_calls);
    }

    // Settlement.

    public function test_matching_bdt_payment_marks_paid(): void
    {
        $this->respond(static::VALIDATION, 200, $this->valid_payment());

        $this->assertTrue($this->make_provider()->handle_ipn($this->ipn()));

        $this->assertSame([[7]], $this->order_call_arguments('mark_payment_as_paid'));
        $this->assertSame([[7, 'BANK-1']], $this->order_call_arguments('set_transaction_id'));
        $this->assertSame([7], $this->locked_orders);
        $this->assertSame(['begin', 'commit'], $this->db_calls);
    }

    public function test_converted_payment_compares_the_sent_amount_and_currency(): void
    {
        $this->order->currency_code = 'USD';
        $this->order->invoiced_total = 10000;
        $this->respond(static::VALIDATION, 200, $this->valid_payment([
            'amount' => '8318.50',
            'currency' => 'BDT',
            'currency_amount' => '100.00',
            'currency_type' => 'USD',
        ]));

        $this->make_provider()->handle_ipn($this->ipn());

        $this->assertSame([[7]], $this->order_call_arguments('mark_payment_as_paid'));
    }

    /**
     * @dataProvider mismatched_payments
     */
    public function test_mismatch_puts_the_order_on_hold(array $overrides): void
    {
        $this->respond(static::VALIDATION, 200, $this->valid_payment($overrides));

        $result = $this->make_provider()->handle_browser_return('success', $this->ipn());

        $this->assertSame(static::FAILED_URL, $result->get_url());
        $this->assertSame([], $this->order_call_arguments('mark_payment_as_paid'));
        $this->assertSame([], $this->order_call_arguments('set_transaction_id'));
        $this->assertSame([[7]], $this->order_call_arguments('mark_as_on_hold'));
        $this->assert_logged('critical', 'does not match order 7');
    }

    public function mismatched_payments(): array
    {
        return [
            'lower amount' => [['currency_amount' => '499.99']],
            'same number in another currency' => [['currency_type' => 'USD']],
            'no amount' => [['currency_amount' => null]],
        ];
    }

    public function test_acknowledges_a_mismatch_so_the_gateway_does_not_redeliver(): void
    {
        $this->respond(static::VALIDATION, 200, $this->valid_payment(['currency_amount' => '1.00']));

        $this->assertTrue($this->make_provider()->handle_ipn($this->ipn()));
    }

    public function test_request_status_is_not_proof_when_the_api_says_invalid(): void
    {
        $this->respond(static::VALIDATION, 200, ['status' => 'INVALID_TRANSACTION']);

        $result = $this->make_provider()->handle_browser_return('success', $this->ipn());

        $this->assertSame(static::FAILED_URL, $result->get_url());
        $this->assertSame([], $this->order_calls);
    }

    public function test_request_amount_is_not_used(): void
    {
        $this->respond(static::VALIDATION, 200, $this->valid_payment(['currency_amount' => '1.00']));

        $this->make_provider()->handle_ipn($this->ipn(['currency_amount' => '500.00', 'currency_type' => 'BDT']));

        $this->assertSame([], $this->order_call_arguments('mark_payment_as_paid'));
    }

    public function test_val_id_from_another_order_does_not_settle(): void
    {
        $this->respond(static::VALIDATION, 200, $this->valid_payment(['tran_id' => '8-aaaaaaaaaaaa']));

        $this->assertFalse($this->make_provider()->handle_ipn($this->ipn()));

        $this->assertSame([], $this->order_calls);
    }

    public function test_repeat_with_the_same_val_id_has_no_effect(): void
    {
        $this->settle_order_with(static::VAL_ID);
        $this->respond(static::VALIDATION, 200, $this->valid_payment(['status' => 'VALIDATED']));

        $this->assertTrue($this->make_provider()->handle_ipn($this->ipn()));

        $this->assertSame([], $this->order_calls);
        $this->assertSame([], $this->logs_at('critical'));
    }

    public function test_validated_on_an_unsettled_order_still_settles(): void
    {
        $this->respond(static::VALIDATION, 200, $this->valid_payment(['status' => 'VALIDATED']));

        $this->make_provider()->handle_ipn($this->ipn());

        $this->assertSame([[7]], $this->order_call_arguments('mark_payment_as_paid'));
    }

    public function test_second_val_id_on_a_settled_order_logs_a_double_payment(): void
    {
        $this->settle_order_with('VAL-0');
        $this->respond(static::VALIDATION, 200, $this->valid_payment());

        $this->assertTrue($this->make_provider()->handle_ipn($this->ipn()));

        $this->assertSame([], $this->order_calls);
        $this->assert_logged('critical', 'double payment');
    }

    public function test_cancelled_order_is_not_paid(): void
    {
        $this->order->order_status = OrderStatus::UNPAID_CANCELLED;
        $this->respond(static::VALIDATION, 200, $this->valid_payment());

        $result = $this->make_provider()->handle_browser_return('success', $this->ipn());

        $this->assertSame(static::FAILED_URL, $result->get_url());
        $this->assertSame([], $this->order_calls);
        $this->assert_logged('critical', 'is cancelled');
    }

    public function test_refunded_order_is_not_paid_again(): void
    {
        $this->settle_order_with(static::VAL_ID);
        $this->order->payment_status = PaymentStatus::REFUNDED;
        $this->respond(static::VALIDATION, 200, $this->valid_payment());

        $this->make_provider()->handle_ipn($this->ipn());

        $this->assertSame([], $this->order_calls);
    }

    public function test_concurrent_settlement_applies_once(): void
    {
        $this->respond(static::VALIDATION, 200, $this->valid_payment());
        $this->after_lock = function () {
            $this->order->payment_status = PaymentStatus::PAID;
            $this->order->payment_metadata = ['gateway' => ['tran_id' => static::TRAN_ID, 'val_id' => static::VAL_ID]];
        };

        $result = $this->make_provider()->handle_browser_return('success', $this->ipn());

        $this->assertSame(static::SUCCESS_URL, $result->get_url());
        $this->assertSame([], $this->order_call_arguments('mark_payment_as_paid'));
    }

    public function test_metadata_merges_and_keeps_only_allowed_fields(): void
    {
        $this->respond(static::VALIDATION, 200, $this->valid_payment(['card_no' => '411111XXXXXX1111']));

        $this->make_provider()->handle_ipn($this->ipn());

        $metadata = json_decode($this->order_call_arguments('set_payment_metadata')[0][1], true);

        $this->assertSame(static::TRAN_ID, $metadata['tran_id']);
        $this->assertSame('SESSION-1', $metadata['sessionkey']);
        $this->assertSame(static::VAL_ID, $metadata['val_id']);
        $this->assertSame('BANK-1', $metadata['bank_tran_id']);
        $this->assertSame('500.00', $metadata['amount']);
        $this->assertArrayNotHasKey('card_no', $metadata);
    }

    public function test_failed_order_update_rolls_back_and_goes_to_success(): void
    {
        $this->fail_on = 'mark_payment_as_paid';
        $this->respond(static::VALIDATION, 200, $this->valid_payment());

        $result = $this->make_provider()->handle_browser_return('success', $this->ipn());

        $this->assertSame(static::SUCCESS_URL, $result->get_url());
        $this->assertSame(['begin', 'rollback'], $this->db_calls);
        $this->assert_logged('critical', 'did not update');
    }

    // Risk.

    /**
     * @dataProvider low_risk_values
     */
    public function test_low_risk_payment_is_paid_and_not_on_hold($risk_level): void
    {
        $this->respond(static::VALIDATION, 200, $this->valid_payment(['risk_level' => $risk_level]));

        $this->make_provider()->handle_ipn($this->ipn());

        $this->assertSame(['mark_payment_as_paid'], $this->state_calls());
    }

    public function low_risk_values(): array
    {
        return ['string' => ['0'], 'integer' => [0]];
    }

    /**
     * @dataProvider risky_values
     */
    public function test_risky_payment_from_pending_goes_hold_then_paid($risk_level): void
    {
        $payment = $this->valid_payment(['risk_level' => $risk_level, 'risk_title' => 'Risky']);
        if ($risk_level === null) {
            unset($payment['risk_level']);
        }
        $this->respond(static::VALIDATION, 200, $payment);

        $this->make_provider()->handle_ipn($this->ipn());

        $this->assertSame(['mark_as_on_hold', 'mark_payment_as_paid'], $this->state_calls());
        $this->assert_logged('warning', 'risky');
    }

    public function risky_values(): array
    {
        return [
            'one' => ['1'],
            'integer one' => [1],
            'missing' => [null],
            'empty' => [''],
            'false' => [false],
            'array' => [[]],
        ];
    }

    public function test_risky_payment_from_a_failed_order_goes_paid_then_hold(): void
    {
        $this->order->payment_status = PaymentStatus::FAILED;
        $this->order->order_status = OrderStatus::FAILED_UNFULFILLED;
        $this->respond(static::VALIDATION, 200, $this->valid_payment(['risk_level' => '1']));

        $this->make_provider()->handle_ipn($this->ipn());

        $this->assertSame(['mark_payment_as_paid', 'mark_as_on_hold'], $this->state_calls());
    }

    /**
     * @dataProvider risky_start_states
     */
    public function test_risky_transitions_end_in_on_hold_paid(string $start, array $actions): void
    {
        $matrix = json_decode(file_get_contents(dirname(__DIR__, 3) . '/resources/data/order-state-matrix.json'), true);
        $status = $start;

        foreach ($actions as $action) {
            $status = $matrix[$status]['transitions'][$action];
        }

        $this->assertSame(OrderStatus::ON_HOLD_PAID, $status);
    }

    public function risky_start_states(): array
    {
        return [
            'pending' => [OrderStatus::PENDING, ['mark-as-hold', 'mark-as-paid']],
            'failed' => [OrderStatus::FAILED_UNFULFILLED, ['mark-as-paid', 'mark-as-hold']],
        ];
    }

    public function test_risk_fields_are_stored(): void
    {
        $this->respond(static::VALIDATION, 200, $this->valid_payment(['risk_level' => '1', 'risk_title' => 'Risky']));

        $this->make_provider()->handle_ipn($this->ipn());

        $metadata = json_decode($this->order_call_arguments('set_payment_metadata')[0][1], true);
        $this->assertSame('1', $metadata['risk_level']);
        $this->assertSame('Risky', $metadata['risk_title']);
    }

    // Signature.

    public function test_official_signature_vector_is_valid(): void
    {
        $this->assertTrue($this->vector_client()->has_valid_signature($this->signature_vector()));
    }

    public function test_changed_value_fails_the_signature(): void
    {
        $this->assertFalse($this->vector_client()->has_valid_signature(array_merge($this->signature_vector(), ['amount' => '1.00'])));
    }

    public function test_signature_uses_the_raw_value_with_an_apostrophe(): void
    {
        $data = ['status' => "O'Neil & <b>", 'verify_key' => 'status'];
        $data['verify_sign'] = md5('status=' . $data['status'] . '&store_passwd=' . md5(static::PASSWORD));

        $this->assertTrue($this->make_client()->has_valid_signature($data));
    }

    public function test_wrong_signature_logs_and_the_validator_still_decides(): void
    {
        $this->respond(static::VALIDATION, 200, $this->valid_payment());

        $this->make_provider()->handle_ipn($this->ipn(['verify_sign' => 'wrong', 'verify_key' => 'status']));

        $this->assert_logged('warning', 'no valid signature');
        $this->assertSame([[7]], $this->order_call_arguments('mark_payment_as_paid'));
    }

    public function test_correct_signature_does_not_settle_when_the_api_rejects(): void
    {
        $this->respond(static::VALIDATION, 200, ['status' => 'INVALID_TRANSACTION']);
        $data = $this->ipn(['verify_key' => 'status']);
        $data['verify_sign'] = md5('status=VALID&store_passwd=' . md5(static::PASSWORD));

        $this->make_provider()->handle_ipn($data);

        $this->assertSame([], $this->logs_at('warning'));
        $this->assertSame([], $this->order_calls);
    }

    // Browser return.

    public function test_success_return_settles_and_redirects_with_303(): void
    {
        $this->respond(static::VALIDATION, 200, $this->valid_payment());

        $result = $this->make_provider()->handle_browser_return('success', $this->ipn());

        $this->assertSame(static::SUCCESS_URL, $result->get_url());
        $this->assertSame(303, $result->get_status());
        $this->assertSame([[7]], $this->order_call_arguments('mark_payment_as_paid'));
    }

    public function test_validator_with_no_result_changes_nothing_and_goes_to_success(): void
    {
        $this->respond(static::VALIDATION, 0, null);

        $result = $this->make_provider()->handle_browser_return('success', $this->ipn());

        $this->assertSame(static::SUCCESS_URL, $result->get_url());
        $this->assertSame([], $this->order_calls);
        $this->assert_logged('critical', 'no confirmed result');
    }

    public function test_success_return_with_no_val_id_goes_to_failed(): void
    {
        $result = $this->make_provider()->handle_browser_return('success', ['tran_id' => static::TRAN_ID]);

        $this->assertSame(static::FAILED_URL, $result->get_url());
        $this->assertSame([], $this->http_calls);
    }

    public function test_missing_credentials_on_a_return_goes_home_without_an_error(): void
    {
        $result = $this->make_provider(['sandbox' => true])->handle_browser_return('success', $this->ipn());

        $this->assertSame(static::HOME_URL, $result->get_url());
        $this->assertSame(303, $result->get_status());
    }

    public function test_get_return_uses_the_query_values(): void
    {
        $_GET = ['tran_id' => static::TRAN_ID];
        $this->respond(static::TRANSACTION, 200, $this->query_response([['status' => 'FAILED', 'val_id' => '']]));

        $result = $this->make_provider()->handle_return((new Request())->merge(['sslcommerz_return' => 'cancel']));

        $this->assertSame(static::FAILED_URL, $result->get_url());
        $this->assertSame(303, $result->get_status());
    }

    public function test_get_with_no_return_argument_gives_null(): void
    {
        $this->assertNull($this->make_provider()->handle_return(new Request()));
    }

    public function test_webhook_with_no_return_argument_is_an_ipn(): void
    {
        $_POST = $this->ipn();
        $this->respond(static::VALIDATION, 200, $this->valid_payment());

        $this->assertTrue($this->make_provider()->webhook());

        $this->assertSame([[7]], $this->order_call_arguments('mark_payment_as_paid'));
    }

    // Failures.

    /**
     * @dataProvider failure_returns
     */
    public function test_confirmed_failure_marks_failed(string $return_type): void
    {
        $this->respond(static::TRANSACTION, 200, $this->query_response([['status' => 'FAILED', 'val_id' => '']]));

        $result = $this->make_provider()->handle_browser_return($return_type, ['tran_id' => static::TRAN_ID, 'status' => 'FAILED']);

        $this->assertSame(static::FAILED_URL, $result->get_url());
        $this->assertSame([[7]], $this->order_call_arguments('mark_payment_as_failed'));
        $this->assertSame([7], $this->locked_orders);
    }

    public function failure_returns(): array
    {
        return ['fail' => ['fail'], 'cancel' => ['cancel']];
    }

    public function test_failure_with_no_elements_marks_failed(): void
    {
        $this->respond(static::TRANSACTION, 200, $this->query_response([]));

        $this->make_provider()->handle_browser_return('cancel', ['tran_id' => static::TRAN_ID]);

        $this->assertSame([[7]], $this->order_call_arguments('mark_payment_as_failed'));
    }

    public function test_forged_failure_on_a_paid_order_changes_nothing(): void
    {
        $this->settle_order_with(static::VAL_ID);

        $result = $this->make_provider()->handle_browser_return('fail', ['tran_id' => static::TRAN_ID]);

        $this->assertSame(static::SUCCESS_URL, $result->get_url());
        $this->assertSame([], $this->http_calls);
        $this->assertSame([], $this->order_calls);
    }

    public function test_failure_message_and_query_success_runs_the_validation_path(): void
    {
        $this->respond(static::TRANSACTION, 200, $this->query_response([
            ['status' => 'FAILED', 'val_id' => ''],
            ['status' => 'VALID', 'val_id' => static::VAL_ID],
        ]));
        $this->respond(static::VALIDATION, 200, $this->valid_payment());

        $result = $this->make_provider()->handle_browser_return('fail', ['tran_id' => static::TRAN_ID]);

        $this->assertSame(static::SUCCESS_URL, $result->get_url());
        $this->assertSame(static::VAL_ID, end($this->http_calls)['data']['val_id']);
        $this->assertSame([[7]], $this->order_call_arguments('mark_payment_as_paid'));
        $this->assertSame([], $this->order_call_arguments('mark_payment_as_failed'));
    }

    /**
     * @dataProvider unclear_queries
     */
    public function test_failure_with_no_clear_query_changes_nothing(int $status, $body): void
    {
        $this->respond(static::TRANSACTION, $status, $body);

        $result = $this->make_provider()->handle_browser_return('fail', ['tran_id' => static::TRAN_ID]);

        $this->assertSame(static::FAILED_URL, $result->get_url());
        $this->assertSame([], $this->order_calls);
    }

    public function unclear_queries(): array
    {
        return [
            'no answer' => [0, null],
            'not done' => [200, ['APIConnect' => 'INACTIVE']],
            'pending element' => [200, ['APIConnect' => 'DONE', 'element' => [['status' => 'PENDING']]]],
        ];
    }

    public function test_settled_order_during_the_failure_lock_is_not_failed(): void
    {
        $this->respond(static::TRANSACTION, 200, $this->query_response([]));
        $this->after_lock = function () {
            $this->order->payment_status = PaymentStatus::PAID;
        };

        $result = $this->make_provider()->handle_browser_return('fail', ['tran_id' => static::TRAN_ID]);

        $this->assertSame(static::SUCCESS_URL, $result->get_url());
        $this->assertSame([], $this->order_call_arguments('mark_payment_as_failed'));
    }

    // IPN.

    public function test_forged_ipn_gets_a_client_error_without_a_call(): void
    {
        $this->assertFalse($this->make_provider()->handle_ipn($this->ipn(['tran_id' => '8-aaaaaaaaaaaa'])));
        $this->assertSame([], $this->http_calls);
        $this->assertSame([], $this->order_calls);
    }

    public function test_ipn_with_a_non_success_status_needs_the_query(): void
    {
        $this->respond(static::TRANSACTION, 0, null);

        $this->assertFalse($this->make_provider()->handle_ipn($this->ipn(['status' => 'FAILED', 'val_id' => ''])));
        $this->assertSame([], $this->order_calls);

        $this->responses = [];
        $this->respond(static::TRANSACTION, 200, $this->query_response([['status' => 'FAILED', 'val_id' => '']]));

        $this->assertTrue($this->make_provider()->handle_ipn($this->ipn(['status' => 'EXPIRED', 'val_id' => ''])));
        $this->assertSame([[7]], $this->order_call_arguments('mark_payment_as_failed'));
    }

    public function test_ipn_with_no_clear_validation_gets_a_client_error(): void
    {
        $this->respond(static::VALIDATION, 0, null);

        $this->assertFalse($this->make_provider()->handle_ipn($this->ipn()));
    }

    // Payment check job.

    public function test_pay_schedules_the_first_check(): void
    {
        $this->respond_session();

        $this->make_provider()->pay($this->order);

        $this->assertCount(1, $this->scheduled_checks);
        $this->assertSame(7, $this->scheduled_checks[0][0]);
        $this->assertSame($this->http_calls[0]['data']['tran_id'], $this->scheduled_checks[0][1]);
        $this->assertSame([0, 300], array_slice($this->scheduled_checks[0], 2));
    }

    public function test_queue_error_does_not_stop_pay(): void
    {
        $this->respond_session();
        $this->dispatch_fails = true;

        $action = $this->make_provider()->pay($this->order);

        $this->assertSame(PaymentActionType::REDIRECT, $action->type);
        $this->assert_logged('error', 'could not schedule');
    }

    public function test_check_on_a_settled_order_makes_no_query(): void
    {
        $this->settle_order_with(static::VAL_ID);

        $this->make_provider()->run_payment_check(7, static::TRAN_ID, 0);

        $this->assertSame([], $this->http_calls);
        $this->assertSame([], $this->scheduled_checks);
    }

    public function test_check_settles_a_success_in_the_second_element(): void
    {
        $this->respond(static::TRANSACTION, 200, $this->query_response([
            ['status' => 'FAILED', 'val_id' => ''],
            ['status' => 'VALIDATED', 'val_id' => static::VAL_ID],
        ]));
        $this->respond(static::VALIDATION, 200, $this->valid_payment());

        $this->make_provider()->run_payment_check(7, static::TRAN_ID, 0);

        $this->assertSame([[7]], $this->order_call_arguments('mark_payment_as_paid'));
        $this->assertSame([], $this->scheduled_checks);
    }

    public function test_check_settles_a_late_success_on_a_failed_order(): void
    {
        $this->order->payment_status = PaymentStatus::FAILED;
        $this->order->order_status = OrderStatus::FAILED_UNFULFILLED;
        $this->respond(static::TRANSACTION, 200, $this->query_response([['status' => 'VALID', 'val_id' => static::VAL_ID]]));
        $this->respond(static::VALIDATION, 200, $this->valid_payment());

        $this->make_provider()->run_payment_check(7, static::TRAN_ID, 3);

        $this->assertSame(['mark_payment_as_paid'], $this->state_calls());
    }

    public function test_second_success_element_logs_a_double_payment(): void
    {
        $this->respond(static::TRANSACTION, 200, $this->query_response([
            ['status' => 'VALID', 'val_id' => static::VAL_ID],
            ['status' => 'VALID', 'val_id' => 'VAL-2'],
        ]));
        $this->respond(static::VALIDATION, 200, $this->valid_payment());
        $this->respond(static::VALIDATION, 200, $this->valid_payment(['val_id' => 'VAL-2']));

        $this->make_provider()->run_payment_check(7, static::TRAN_ID, 0);

        $this->assertCount(1, $this->order_call_arguments('mark_payment_as_paid'));
        $this->assert_logged('critical', 'double payment');
    }

    public function test_held_payment_stops_the_checks(): void
    {
        $this->respond(static::TRANSACTION, 200, $this->query_response([['status' => 'VALID', 'val_id' => static::VAL_ID]]));
        $this->respond(static::VALIDATION, 200, $this->valid_payment(['currency_amount' => '1.00']));

        $this->make_provider()->run_payment_check(7, static::TRAN_ID, 0);

        $this->assertSame([], $this->scheduled_checks);
    }

    public function test_older_transaction_logs_and_does_not_change_the_order(): void
    {
        $this->respond(static::TRANSACTION, 200, $this->query_response([['status' => 'VALID', 'val_id' => 'VAL-OLD']]));

        $this->make_provider()->run_payment_check(7, '7-aaaaaaaaaaaa', 0);

        $this->assertSame([], $this->order_calls);
        $this->assertSame([], $this->scheduled_checks);
        $this->assert_logged('critical', 'older transaction');
    }

    /**
     * @dataProvider unresolved_queries
     */
    public function test_unresolved_check_schedules_the_next_one(int $status, $body): void
    {
        $this->respond(static::TRANSACTION, $status, $body);

        $this->make_provider()->run_payment_check(7, static::TRAN_ID, 1);

        $this->assertSame([7, static::TRAN_ID, 2, 2700], $this->scheduled_checks[0]);
        $this->assertSame([], $this->order_calls);
    }

    public function unresolved_queries(): array
    {
        return [
            'no answer' => [0, null],
            'not done' => [200, ['APIConnect' => 'FAILED']],
            'failed element' => [200, ['APIConnect' => 'DONE', 'element' => [['status' => 'FAILED']]]],
        ];
    }

    public function test_last_check_logs_and_leaves_the_order_unchanged(): void
    {
        $this->respond(static::TRANSACTION, 200, $this->query_response([]));

        $this->make_provider()->run_payment_check(7, static::TRAN_ID, 4);

        $this->assertSame([], $this->scheduled_checks);
        $this->assertSame([], $this->order_calls);
        $this->assert_logged('warning', 'checks have ended');
    }

    public function test_check_delays_end_twenty_four_hours_after_the_payment_starts(): void
    {
        $this->assertSame([300, 600, 2700, 18000, 64800], SslcommerzConstant::PAYMENT_CHECK_DELAYS_SECONDS);
        $this->assertSame(86400, array_sum(SslcommerzConstant::PAYMENT_CHECK_DELAYS_SECONDS));
    }

    public function test_jobs_use_their_own_queues(): void
    {
        $this->assertSame('sslcommerz-payment-checks', SslcommerzPaymentCheckJob::QUEUE);
        $this->assertSame('sslcommerz-refund-checks', SslcommerzRefundCheckJob::QUEUE);
    }

    // Refunds.

    public function test_accepted_refund_stores_the_reference_and_stays_pending(): void
    {
        $this->prepare_paid_order();
        $this->respond(static::TRANSACTION, 200, ['APIConnect' => 'DONE', 'status' => 'success', 'refund_ref_id' => 'REF-1']);
        $refund = $this->make_refund(50000);

        $this->assertTrue($this->make_provider()->refund($this->order, $refund));

        $this->assertSame([['refund_id' => 'REF-1']], $this->refund_updates);
        $this->assertSame([[7, 1, 0, 3600]], $this->scheduled_refund_checks);

        $data = $this->http_calls[0]['data'];
        $this->assertSame('BANK-1', $data['bank_tran_id']);
        $this->assertSame('500.00', $data['refund_amount']);
        $this->assertSame('Damaged item', $data['refund_remarks']);
        $this->assertSame('7-0-50000', $data['refund_trans_id']);
    }

    public function test_partial_refund_sends_the_amount_that_the_merchant_entered(): void
    {
        $this->prepare_paid_order();
        $this->respond(static::TRANSACTION, 200, ['APIConnect' => 'DONE', 'status' => 'success', 'refund_ref_id' => 'REF-1']);

        $this->make_provider()->refund($this->order, $this->make_refund(10000));

        $this->assertSame('100.00', $this->http_calls[0]['data']['refund_amount']);
    }

    public function test_refund_trans_id_is_the_same_on_a_repeat(): void
    {
        $this->prepare_paid_order();
        $this->respond(static::TRANSACTION, 0, null);
        $provider = $this->make_provider();

        foreach ([2, 3] as $refund_id) {
            try {
                $provider->refund($this->order, $this->make_refund(10000, $refund_id));
            } catch (Exception $e) {
                $this->assertStringContainsString('Check the SSLCommerz panel', $e->getMessage());
            }
        }

        $this->assertSame($this->http_calls[0]['data']['refund_trans_id'], $this->http_calls[1]['data']['refund_trans_id']);
    }

    public function test_earlier_refunds_change_the_refund_trans_id(): void
    {
        $this->prepare_paid_order();
        $this->recorded_refunds = [$this->make_refund(10000, 1)];
        $this->respond(static::TRANSACTION, 200, ['APIConnect' => 'DONE', 'status' => 'success', 'refund_ref_id' => 'REF-2']);

        $this->make_provider()->refund($this->order, $this->make_refund(10000, 2));

        $this->assertSame('7-1-10000', $this->http_calls[0]['data']['refund_trans_id']);
    }

    /**
     * @dataProvider failed_refunds
     */
    public function test_refund_that_is_not_accepted_throws_without_a_retry(int $status, $body, string $message): void
    {
        $this->prepare_paid_order();
        $this->respond(static::TRANSACTION, $status, $body);

        try {
            $this->make_provider()->refund($this->order, $this->make_refund(10000));
            $this->fail('Expected a failure.');
        } catch (Exception $e) {
            $this->assertStringContainsString($message, $e->getMessage());
        }

        $this->assertCount(1, $this->http_calls);
        $this->assertSame([], $this->refund_updates);
        $this->assertSame([], $this->scheduled_refund_checks);
    }

    public function failed_refunds(): array
    {
        return [
            'processing' => [200, ['APIConnect' => 'DONE', 'status' => 'processing'], 'already started'],
            'failed' => [200, ['APIConnect' => 'DONE', 'status' => 'failed', 'errorReason' => 'IP not registered'], 'IP not registered'],
            'refused' => [200, ['APIConnect' => 'INACTIVE', 'errorReason' => 'Refund not allowed'], 'Refund not allowed'],
            'no answer' => [0, null, 'Check the SSLCommerz panel'],
            'success with no reference' => [200, ['APIConnect' => 'DONE', 'status' => 'success'], 'Check the SSLCommerz panel'],
            'unknown status' => [200, ['APIConnect' => 'DONE', 'status' => 'other'], 'Check the SSLCommerz panel'],
        ];
    }

    public function test_refund_with_no_transaction_id_throws_without_a_call(): void
    {
        $this->expectExceptionMessage('no SSLCommerz payment');

        try {
            $this->make_provider()->refund($this->order, $this->make_refund(10000));
        } finally {
            $this->assertSame([], $this->http_calls);
        }
    }

    // Refund check job.

    public function test_refunded_completes_through_the_core_path(): void
    {
        $this->seed_pending_refund();
        $this->respond(static::TRANSACTION, 200, ['APIConnect' => 'DONE', 'status' => 'refunded']);

        $this->make_provider()->run_refund_check(7, 1, 0);

        $this->assertSame('REF-1', $this->http_calls[0]['data']['refund_ref_id']);
        $dto = $this->order_call_arguments('update_refund')[0][0];
        $this->assertSame(RefundStatus::COMPLETED, $dto->status);
        $this->assertSame([], $this->scheduled_refund_checks);
    }

    public function test_cancelled_refund_is_cancelled_and_logged(): void
    {
        $this->seed_pending_refund();
        $this->respond(static::TRANSACTION, 200, ['APIConnect' => 'DONE', 'status' => 'cancelled']);

        $this->make_provider()->run_refund_check(7, 1, 0);

        $this->assertSame(RefundStatus::CANCELLED, $this->order_call_arguments('update_refund')[0][0]->status);
        $this->assert_logged('warning', 'cancelled refund');
    }

    /**
     * @dataProvider unresolved_refunds
     */
    public function test_unresolved_refund_schedules_the_next_check(int $status, $body): void
    {
        $this->seed_pending_refund();
        $this->respond(static::TRANSACTION, $status, $body);

        $this->make_provider()->run_refund_check(7, 1, 1);

        $this->assertSame([[7, 1, 2, 64800]], $this->scheduled_refund_checks);
        $this->assertSame([], $this->order_call_arguments('update_refund'));
    }

    public function unresolved_refunds(): array
    {
        return [
            'processing' => [200, ['APIConnect' => 'DONE', 'status' => 'processing']],
            'no answer' => [0, null],
        ];
    }

    public function test_last_refund_check_logs_and_stays_pending(): void
    {
        $this->seed_pending_refund();
        $this->respond(static::TRANSACTION, 200, ['APIConnect' => 'DONE', 'status' => 'processing']);

        $this->make_provider()->run_refund_check(7, 1, 4);

        $this->assertSame([], $this->scheduled_refund_checks);
        $this->assertSame([], $this->order_call_arguments('update_refund'));
        $this->assert_logged('warning', 'no final state');
    }

    /**
     * @dataProvider stopped_refund_rows
     */
    public function test_refund_check_stops_on_a_row_that_is_not_open(int $refund_id, string $status, ?string $reference): void
    {
        $this->seed_pending_refund($status, $reference);

        $this->make_provider()->run_refund_check(7, $refund_id, 0);

        $this->assertSame([], $this->http_calls);
        $this->assertSame([], $this->scheduled_refund_checks);
    }

    public function stopped_refund_rows(): array
    {
        return [
            'missing row' => [99, RefundStatus::PENDING, 'REF-1'],
            'completed row' => [1, RefundStatus::COMPLETED, 'REF-1'],
            'no reference' => [1, RefundStatus::PENDING, null],
        ];
    }

    // Fakes called by the bound services.

    public function record_http_call(string $method, string $url, bool $form, $timeout, array $data): void
    {
        $this->http_calls[] = ['method' => $method, 'url' => $url, 'form' => $form, 'timeout' => $timeout, 'data' => $data];
    }

    public function respond_to(string $url)
    {
        foreach ($this->responses as $path => $queue) {
            if (substr($url, -strlen($path)) === $path) {
                // The last queued response repeats.
                [$status, $body] = count($queue) > 1 ? array_shift($this->responses[$path]) : $queue[0];

                return $this->make_response($status, $body);
            }
        }

        throw new Exception('No fake response for ' . $url);
    }

    public function handle_order_call(string $method, array $arguments)
    {
        if ($method === 'get_refund') {
            foreach ($this->recorded_refunds as $refund) {
                if ((int) $refund->id === $arguments[1]) {
                    return $refund;
                }
            }

            return null;
        }

        $this->order_calls[] = [$method, $arguments];

        if ($method === $this->fail_on) {
            throw new Exception('boom');
        }

        if ($method === 'mark_payment_as_paid') {
            $this->order->payment_status = PaymentStatus::PAID;
        }

        if ($method === 'set_payment_metadata') {
            $this->order->payment_metadata = ['gateway' => json_decode($arguments[1], true)];
        }

        return true;
    }

    // Helpers.

    protected function assert_logged(string $level, string $text): void
    {
        foreach ($this->logs as $log) {
            if ($log[0] === $level && strpos($log[1], $text) !== false) {
                $this->addToAssertionCount(1);

                return;
            }
        }

        $this->fail(sprintf('No %s log entry with "%s".', $level, $text));
    }

    protected function logs_at(string $level): array
    {
        return array_values(array_filter($this->logs, fn($log) => $log[0] === $level));
    }

    protected function state_calls(): array
    {
        $calls = array_filter($this->order_calls, fn($call) => in_array($call[0], ['mark_as_on_hold', 'mark_payment_as_paid'], true));

        return array_values(array_column($calls, 0));
    }

    protected function order_call_arguments(string $method): array
    {
        $calls = array_filter($this->order_calls, fn($call) => $call[0] === $method);

        return array_values(array_column($calls, 1));
    }

    protected function bind_fakes(): void
    {
        $test = $this;

        $http = new class($test) {
            protected $test;
            protected $form = false;
            protected $timeout = null;

            public function __construct($test)
            {
                $this->test = $test;
            }

            public function as_form()
            {
                $this->form = true;

                return $this;
            }

            public function timeout($seconds)
            {
                $this->timeout = $seconds;

                return $this;
            }

            public function post(string $url, $data = [])
            {
                $this->test->record_http_call('POST', $url, $this->form, $this->timeout, $data);

                return $this->test->respond_to($url);
            }

            public function get(string $url, $query = [])
            {
                $this->test->record_http_call('GET', $url, $this->form, $this->timeout, $query);

                return $this->test->respond_to($url);
            }
        };

        $log = new class($test) {
            protected $test;

            public function __construct($test)
            {
                $this->test = $test;
            }

            public function __call($level, $arguments)
            {
                $this->test->logs[] = [$level, $arguments[0]];
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

        $db = new class($test) {
            protected $test;

            public function __construct($test)
            {
                $this->test = $test;
            }

            public function __call($method, $arguments)
            {
                $this->test->db_calls[] = ['begin_transaction' => 'begin', 'commit' => 'commit', 'rollback' => 'rollback'][$method];
            }
        };

        $this->bind_money_dependencies('BDT');

        $container = Container::get_instance();
        $container->instance('app', $container);
        $container->bind('client-request', fn() => $http);
        $container->bind('log', fn() => $log);
        $container->bind('db', fn() => $db);
        $container->bind(OrderManager::class, fn() => $orders);
        $container->bind('money', fn() => new MoneyManager());

        $this->set_container_instance($container);

        $site_router = new class {
            public function url($name, $params = [])
            {
                return 'https://shop.test/' . $name;
            }
        };

        $router = new \ReflectionProperty(Route::class, 'site_router');
        $router->setAccessible(true);
        $router->setValue(null, $site_router);
    }

    protected function set_country_index(?array $index): void
    {
        $property = new \ReflectionProperty(CountryData::class, 'index');
        $property->setAccessible(true);
        $property->setValue(null, $index);
    }

    protected function respond(string $path, int $status, $body): void
    {
        $this->responses[$path][] = [$status, $body];
    }

    protected function respond_session(): void
    {
        $this->respond(static::SESSION, 200, [
            'status' => 'SUCCESS',
            'sessionkey' => 'SESSION-1',
            'GatewayPageURL' => 'https://sandbox.sslcommerz.com/EasyCheckOut/abc',
        ]);
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

            public function status()
            {
                return $this->status;
            }

            public function json($key = null, $default = null)
            {
                return $this->body;
            }
        };
    }

    protected function settings(): array
    {
        return ['store_id' => 'store-id', 'store_password' => static::PASSWORD, 'sandbox' => true];
    }

    protected function make_client(): SslcommerzClient
    {
        return new SslcommerzClient('store-id', static::PASSWORD, true);
    }

    protected function vector_client(): SslcommerzClient
    {
        return new SslcommerzClient('test_testemi', 'test_testemi@ssl', true);
    }

    protected function signature_vector(): array
    {
        return [
            'amount' => '10.00',
            'bank_tran_id' => '200105225825DBgSoRGLvczhFjj',
            'base_fair' => '0.00',
            'card_brand' => 'VISA',
            'card_issuer' => 'TRUST BANK, LTD.',
            'card_issuer_country' => 'Bangladesh',
            'card_issuer_country_code' => 'BD',
            'card_no' => '418117XXXXXX6675',
            'card_type' => 'VISA-Dutch Bangla',
            'currency' => 'BDT',
            'currency_amount' => '10.00',
            'currency_rate' => '1.0000',
            'currency_type' => 'BDT',
            'risk_level' => '0',
            'risk_title' => 'Safe',
            'status' => 'VALID',
            'store_amount' => '9.75',
            'store_id' => 'test_testemi',
            'tran_date' => '2020-01-05 22:58:21',
            'tran_id' => '5E121A0D01F92',
            'val_id' => '200105225826116qFnATY9sHIwo',
            'value_a' => '',
            'value_b' => '',
            'value_c' => '',
            'value_d' => '',
            'verify_key' => 'amount,bank_tran_id,base_fair,card_brand,card_issuer,card_issuer_country,card_issuer_country_code,card_no,card_type,currency,currency_amount,currency_rate,currency_type,risk_level,risk_title,status,store_amount,store_id,tran_date,tran_id,val_id,value_a,value_b,value_c,value_d',
            'verify_sign' => 'd42fab70ae0bcbda5280e7baffef60b0',
        ];
    }

    protected function make_provider(?array $settings = null, string $webhook_url = self::WEBHOOK_URL): Sslcommerz
    {
        $provider = new class($this, $webhook_url) extends Sslcommerz {
            protected $test;
            protected $test_webhook_url;

            public function __construct($test, $webhook_url)
            {
                $this->test = $test;
                $this->test_webhook_url = $webhook_url;
            }

            public function webhook_url()
            {
                return $this->test_webhook_url;
            }

            protected function dispatch_payment_check(int $order_id, string $tran_id, int $check, int $delay): void
            {
                if ($this->test->dispatch_fails) {
                    throw new Exception('queue table is missing');
                }

                $this->test->scheduled_checks[] = [$order_id, $tran_id, $check, $delay];
            }

            protected function dispatch_refund_check(int $order_id, int $refund_id, int $check, int $delay): void
            {
                $this->test->scheduled_refund_checks[] = [$order_id, $refund_id, $check, $delay];
            }
        };

        $base = \Kirki\Ecommerce\App\Payment\PaymentProvider::class;
        $order_service = new class($this) {
            protected $test;

            public function __construct($test)
            {
                $this->test = $test;
            }

            public function lock_order(int $id)
            {
                $this->test->locked_orders[] = $id;

                if ($this->test->after_lock) {
                    ($this->test->after_lock)();
                }
            }

            public function find_order_or_fail(int $id)
            {
                if ($id !== (int) $this->test->order->id) {
                    throw new Exception('Order not found.');
                }

                return $this->test->order;
            }
        };

        foreach (['settings' => $settings ?? $this->settings(), 'is_enabled' => true, 'order_service' => $order_service] as $name => $value) {
            $property = new \ReflectionProperty($base, $name);
            $property->setAccessible(true);
            $property->setValue($provider, $value);
        }

        return $provider;
    }

    protected function make_order(): Order
    {
        $order = new class($this) extends Order {
            protected $sslcommerz_test;

            public function __construct($test = null)
            {
                parent::__construct();

                $this->sslcommerz_test = $test;
            }

            public function refunds()
            {
                return new class($this->sslcommerz_test) {
                    protected $test;

                    public function __construct($test)
                    {
                        $this->test = $test;
                    }

                    public function get()
                    {
                        return $this->test->recorded_refunds;
                    }
                };
            }
        };

        $order->id = 7;
        $order->uuid = static::UUID;
        $order->payment_status = PaymentStatus::UNPAID;
        $order->order_status = OrderStatus::PENDING;
        $order->currency_code = 'BDT';
        $order->invoiced_total = 50000;
        $order->billing_first_name = 'Ada';
        $order->billing_last_name = 'Rahman';
        $order->billing_email = 'ada@example.com';
        $order->billing_phone = '01700000000';
        $order->billing_address_line1 = 'Road 1';
        $order->billing_city = 'Dhaka';
        $order->billing_postal_code = '1207';
        $order->billing_country = 'XX';
        $order->items = [
            (object) ['product_name' => 'Shirt', 'quantity' => 2],
            (object) ['product_name' => 'Hat', 'quantity' => 1],
        ];
        $order->payment_metadata = ['gateway' => [
            'tran_id' => static::TRAN_ID,
            'sessionkey' => 'SESSION-1',
            'amount' => '500.00',
            'currency' => 'BDT',
        ]];

        return $order;
    }

    protected function make_refund(int $minor, int $id = 1, string $reason = 'Damaged item'): Refund
    {
        $refund = new class($this) extends Refund {
            protected $sslcommerz_test;

            public function __construct($test = null)
            {
                parent::__construct();

                $this->sslcommerz_test = $test;
            }

            public function update(array $attributes = [], array $options = [])
            {
                $this->sslcommerz_test->refund_updates[] = $attributes;

                return true;
            }
        };

        $refund->id = $id;
        $refund->invoiced_amount = $minor;
        $refund->reason = $reason;

        return $refund;
    }

    protected function seed_pending_refund(string $status = RefundStatus::PENDING, ?string $reference = 'REF-1'): void
    {
        $refund = $this->make_refund(10000);
        $refund->status = $status;
        $refund->refund_id = $reference;
        $refund->order_id = 7;
        $this->recorded_refunds = [$refund];
    }

    protected function prepare_paid_order(): void
    {
        $this->order->payment_status = PaymentStatus::PAID;
        $this->order->payment_transaction_id = 'BANK-1';
    }

    protected function settle_order_with(string $val_id): void
    {
        $this->order->payment_status = PaymentStatus::PAID;
        $this->order->order_status = OrderStatus::PAID_UNFULFILLED;
        $this->order->payment_metadata = ['gateway' => ['tran_id' => static::TRAN_ID, 'val_id' => $val_id]];
    }

    protected function ipn(array $overrides = []): array
    {
        return array_merge(['tran_id' => static::TRAN_ID, 'val_id' => static::VAL_ID, 'status' => 'VALID'], $overrides);
    }

    protected function valid_payment(array $overrides = []): array
    {
        return array_merge([
            'status' => 'VALID',
            'tran_id' => static::TRAN_ID,
            'val_id' => static::VAL_ID,
            'bank_tran_id' => 'BANK-1',
            'amount' => '500.00',
            'currency' => 'BDT',
            'currency_amount' => '500.00',
            'currency_type' => 'BDT',
            'currency_rate' => '1.0000',
            'store_amount' => '487.50',
            'risk_level' => '0',
            'risk_title' => 'Safe',
        ], $overrides);
    }

    protected function query_response(array $elements): array
    {
        return ['APIConnect' => 'DONE', 'no_of_trans_found' => count($elements), 'element' => $elements];
    }
}
