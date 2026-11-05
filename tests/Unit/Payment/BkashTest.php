<?php

namespace Kirki\Ecommerce\Tests\Unit\Payment;

use Exception;
use Kirki\Ecommerce\App\Constants\Order\PaymentStatus;
use Kirki\Ecommerce\App\Constants\Payment\PaymentActionType;
use Kirki\Ecommerce\App\Managers\MoneyManager;
use Kirki\Ecommerce\App\Managers\OrderManager;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Models\Refund;
use Kirki\Ecommerce\Framework\Container;
use Kirki\Ecommerce\Framework\Http\Request;
use Kirki\Ecommerce\Framework\Route;
use Kirki\Ecommerce\Payments\Bkash;
use Kirki\Ecommerce\Payments\BkashClient;
use Kirki\Ecommerce\Payments\BkashRejectedException;
use Kirki\Ecommerce\Payments\BkashUnknownResultException;
use Kirki\Ecommerce\Tests\Unit\TestCase;

foreach (['BkashConstant', 'BkashRejectedException', 'BkashUnknownResultException', 'BkashClient', 'BkashTransactionBuilder', 'Bkash'] as $bkash_class) {
    require_once dirname(__DIR__, 3) . '/payments/kirki-bkash/src/' . $bkash_class . '.php';
}

class BkashTest extends TestCase
{
    const SANDBOX = 'https://tokenized.sandbox.bka.sh/v2/tokenized-checkout';
    const LIVE = 'https://tokenized.pay.bka.sh/v2/tokenized-checkout';
    const UUID = 'uuid-1';
    const SUCCESS_URL = 'https://shop.test/checkout?order=success&uuid=uuid-1';
    const FAILED_URL = 'https://shop.test/checkout?order=failed&uuid=uuid-1';
    const HOME_URL = 'https://shop.test';

    /** @var array<int, array<string, mixed>> */
    public $http_calls = [];

    /** @var array<string, array<int, array{0: int, 1: mixed}>> */
    public $responses = [];

    /** @var array<string, mixed> */
    public $cache = [];

    /** @var bool */
    public $lock_busy = false;

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

    /** @var array<int, object> */
    public $recorded_refunds = [];

    protected function setUp(): void
    {
        parent::setUp();

        $this->order = $this->make_order();
        $this->bind_fakes();
        $this->seed_token();
    }

    // Provider.

    public function test_provider_is_online_with_id_bkash(): void
    {
        $provider = $this->make_provider();
        $id = new \ReflectionProperty(\Kirki\Ecommerce\App\Payment\PaymentProvider::class, 'id');
        $id->setAccessible(true);
        $id->setValue($provider, 'bkash');

        $this->assertSame('bkash', $provider->id());
        $this->assertFalse($provider->is_offline());
    }

    public function test_missing_sandbox_value_uses_the_sandbox_host(): void
    {
        $settings = $this->settings();
        unset($settings['sandbox']);
        $this->seed_token('sandbox');
        $this->respond('/query/payment', 200, $this->query_payment());

        $this->make_provider($settings)->handle_return($this->return_request('cancel'));

        $this->assertStringStartsWith(static::SANDBOX, $this->http_calls[0]['url']);
    }

    public function test_sandbox_off_uses_the_live_host(): void
    {
        $this->seed_token('live');
        $this->respond('/query/payment', 200, $this->query_payment());

        $this->make_provider(array_merge($this->settings(), ['sandbox' => false]))->handle_return($this->return_request('cancel'));

        $this->assertStringStartsWith(static::LIVE, $this->http_calls[0]['url']);
    }

    public function test_settings_keep_special_characters_in_secrets(): void
    {
        $sanitize = new \ReflectionMethod(Bkash::class, 'sanitize_settings');
        $sanitize->setAccessible(true);

        $sanitized = $sanitize->invoke($this->make_provider(), ['app_secret' => ' a<b*c ', 'password' => 'p<x>w']);

        $this->assertSame('a<b*c', $sanitized['app_secret']);
        $this->assertSame('p<x>w', $sanitized['password']);
    }

    // Client outcomes.

    public function test_json_without_external_code_is_success(): void
    {
        $this->respond('/query/payment', 200, ['paymentId' => 'TR001']);

        $this->assertSame(['paymentId' => 'TR001'], $this->make_client()->query_payment('TR001'));
    }

    public function test_request_sends_the_bare_token_and_app_key(): void
    {
        $this->respond('/query/payment', 200, ['paymentId' => 'TR001']);

        $this->make_client()->query_payment('TR001');

        $this->assertSame('seeded-token', $this->http_calls[0]['headers']['authorization']);
        $this->assertSame('app-key', $this->http_calls[0]['headers']['X-App-Key']);
        $this->assertSame(30, $this->http_calls[0]['timeout']);
        $this->assertSame(['paymentId' => 'TR001'], $this->http_calls[0]['data']);
    }

    /**
     * @dataProvider rejected_statuses
     */
    public function test_external_code_is_rejected_at_any_client_status(int $status): void
    {
        $this->respond('/payment/execute', $status, ['externalCode' => '2023', 'errorMessageEn' => 'Insufficient Balance']);

        try {
            $this->make_client()->execute_payment('TR001');
            $this->fail('Expected a rejection.');
        } catch (BkashRejectedException $e) {
            $this->assertSame('2023', $e->external_code());
            $this->assertSame('Insufficient Balance', $e->getMessage());
        }
    }

    public function rejected_statuses(): array
    {
        return ['HTTP 200' => [200], 'HTTP 400' => [400]];
    }

    /**
     * @dataProvider unknown_responses
     */
    public function test_unclear_responses_are_unknown(int $status, $body): void
    {
        $this->respond('/payment/execute', $status, $body);

        $this->expectException(BkashUnknownResultException::class);

        $this->make_client()->execute_payment('TR001');
    }

    public function unknown_responses(): array
    {
        return [
            'connection error' => [0, null],
            'server error' => [502, ['message' => 'Bad Gateway']],
            'server error with a code' => [503, ['externalCode' => '503', 'errorMessageEn' => 'Maintenance']],
            'non JSON body' => [200, null],
            'client error without a code' => [401, ['message' => 'Unauthorized']],
        ];
    }

    // Tokens.

    public function test_token_younger_than_50_minutes_is_reused(): void
    {
        $this->seed_token('sandbox', 'seeded-token', time() - (49 * 60));
        $this->respond('/query/payment', 200, []);

        $client = $this->make_client();

        for ($i = 0; $i < 10; $i++) {
            $client->query_payment('TR001');
        }

        $this->assertSame(0, $this->auth_call_count());
    }

    public function test_token_older_than_50_minutes_is_refreshed_once(): void
    {
        $this->seed_token('sandbox', 'old-token', time() - (51 * 60));
        $this->respond('/auth/refresh-token', 200, ['id_token' => 'new-token', 'refresh_token' => 'new-refresh']);
        $this->respond('/query/payment', 200, []);

        $client = $this->make_client();
        $client->query_payment('TR001');
        $client->query_payment('TR001');

        $this->assertSame(1, $this->auth_call_count());
        $this->assertStringEndsWith('/auth/refresh-token', $this->http_calls[0]['url']);
        $this->assertSame('old-refresh', $this->http_calls[0]['data']['refresh_token']);
        $this->assertSame('app-user', $this->http_calls[0]['headers']['username']);
        $this->assertSame('new-token', end($this->http_calls)['headers']['authorization']);
    }

    public function test_grant_runs_when_no_token_exists(): void
    {
        $this->cache = [];
        $this->respond('/auth/grant-token', 200, ['id_token' => 'granted', 'refresh_token' => 'r']);
        $this->respond('/query/payment', 200, []);

        $this->make_client()->query_payment('TR001');

        $this->assertStringEndsWith('/auth/grant-token', $this->http_calls[0]['url']);
        $this->assertSame('app-secret', $this->http_calls[0]['data']['app_secret']);
        $this->assertSame('granted', $this->http_calls[1]['headers']['authorization']);
    }

    public function test_grant_runs_when_refresh_is_rejected(): void
    {
        $this->seed_token('sandbox', 'old-token', time() - (51 * 60));
        $this->respond('/auth/refresh-token', 200, ['statusCode' => '2079', 'statusMessage' => 'Invalid token']);
        $this->respond('/auth/grant-token', 200, ['id_token' => 'granted', 'refresh_token' => 'r']);
        $this->respond('/query/payment', 200, []);

        $this->make_client()->query_payment('TR001');

        $this->assertSame(2, $this->auth_call_count());
        $this->assertSame('granted', end($this->http_calls)['headers']['authorization']);
    }

    public function test_busy_lock_uses_the_current_valid_token(): void
    {
        $this->seed_token('sandbox', 'old-token', time() - (55 * 60));
        $this->lock_busy = true;
        $this->respond('/query/payment', 200, []);

        $this->make_client()->query_payment('TR001');

        $this->assertSame(0, $this->auth_call_count());
        $this->assertSame('old-token', $this->http_calls[0]['headers']['authorization']);
    }

    public function test_busy_lock_with_no_usable_token_fails_without_a_renewal(): void
    {
        $this->cache = [];
        $this->lock_busy = true;

        try {
            $this->make_client()->query_payment('TR001');
            $this->fail('Expected a failure.');
        } catch (BkashUnknownResultException $e) {
            $this->assertSame(0, count($this->http_calls));
        }
    }

    public function test_failed_renewal_uses_the_current_valid_token(): void
    {
        $this->seed_token('sandbox', 'old-token', time() - (55 * 60));
        $this->respond('/auth/refresh-token', 0, null);
        $this->respond('/query/payment', 200, []);

        $this->make_client()->query_payment('TR001');

        $this->assertSame('old-token', end($this->http_calls)['headers']['authorization']);
    }

    public function test_expired_token_is_not_used_after_a_failed_renewal(): void
    {
        $this->seed_token('sandbox', 'old-token', time() - (61 * 60));
        $this->respond('/auth/refresh-token', 0, null);

        $this->expectException(BkashUnknownResultException::class);

        $this->make_client()->query_payment('TR001');
    }

    public function test_token_keys_differ_per_environment_and_app_key(): void
    {
        $this->respond('/auth/grant-token', 200, ['id_token' => 'granted', 'refresh_token' => 'r']);
        $this->respond('/query/payment', 200, []);

        $this->make_client(false)->query_payment('TR001');
        $this->assertSame(1, $this->auth_call_count(), 'The sandbox token must not serve live.');

        (new BkashClient('other-key', 'app-secret', 'app-user', 'app-pass', true))->query_payment('TR001');
        $this->assertSame(2, $this->auth_call_count(), 'The token of one App Key must not serve another.');
    }

    public function test_secrets_do_not_appear_in_errors_or_logs(): void
    {
        $this->seed_token('sandbox', 'secret-token', time());
        $this->respond('/query/payment', 0, null);

        $this->make_provider()->handle_return($this->return_request('success'));

        $logged = implode(' ', array_column($this->logs, 1));

        foreach (['secret-token', 'old-refresh', 'app-secret', 'app-pass'] as $secret) {
            $this->assertStringNotContainsString($secret, $logged);
        }

        $this->cache = [];
        $this->respond('/auth/grant-token', 401, ['message' => 'Unauthorized']);

        try {
            $this->make_client()->query_payment('TR001');
            $this->fail('Expected a failure.');
        } catch (Exception $e) {
            foreach (['app-secret', 'app-pass'] as $secret) {
                $this->assertStringNotContainsString($secret, $e->getMessage());
            }
        }
    }

    // Starting a payment.

    public function test_pay_creates_the_payment_and_redirects(): void
    {
        $this->respond('/payment/create', 200, ['paymentId' => 'TR001', 'bkashURL' => 'https://sandbox.payment.bkash.com/?paymentId=TR001']);

        $action = $this->make_provider()->pay($this->order);

        $this->assertSame(PaymentActionType::REDIRECT, $action->type);
        $this->assertSame('https://sandbox.payment.bkash.com/?paymentId=TR001', $action->value);
        $this->assertSame([
            'payerReference' => static::UUID,
            'callbackURL' => 'https://shop.test/wp-json/kirki/payment/webhook/bkash',
            'amount' => '500.00',
            'currency' => 'BDT',
            'intent' => 'sale',
            'merchantInvoiceNumber' => static::UUID,
        ], $this->http_calls[0]['data']);

        $this->assertSame([[7, '{"paymentId":"TR001"}']], $this->order_call_arguments('set_payment_metadata'));
    }

    public function test_pay_rejects_a_non_bdt_order_without_a_call(): void
    {
        $this->order->currency_code = 'USD';

        try {
            $this->make_provider()->pay($this->order);
            $this->fail('Expected a failure.');
        } catch (Exception $e) {
            $this->assertStringContainsString('BDT', $e->getMessage());
        }

        $this->assertSame([], $this->http_calls);
        $this->assertSame([], $this->order_calls);
    }

    public function test_pay_fails_on_missing_credentials_without_a_call(): void
    {
        $settings = $this->settings();
        unset($settings['app_secret']);

        $this->expectException(Exception::class);
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

    /**
     * @dataProvider failed_create_responses
     */
    public function test_pay_fails_when_create_payment_fails(int $status, $body): void
    {
        $this->respond('/payment/create', $status, $body);

        try {
            $this->make_provider()->pay($this->order);
            $this->fail('Expected a failure.');
        } catch (Exception $e) {
            $this->assertStringContainsString('bKash Payment Error', $e->getMessage());
        }

        $this->assertSame([], $this->order_call_arguments('mark_payment_as_paid'));
        $this->assertSame([], $this->order_call_arguments('set_payment_metadata'));
    }

    public function failed_create_responses(): array
    {
        return [
            'rejected' => [200, ['externalCode' => '2007', 'errorMessageEn' => 'Invalid currency']],
            'no answer' => [0, null],
            'no payment page' => [200, ['paymentId' => 'TR001']],
        ];
    }

    // Customer return: paid paths.

    public function test_success_return_executes_and_marks_paid(): void
    {
        $this->respond('/query/payment', 200, $this->query_payment());
        $this->respond('/payment/execute', 200, $this->completed_payment());

        $result = $this->make_provider()->handle_return($this->return_request('success'));

        $this->assertSame(static::SUCCESS_URL, $result->get_url());
        $this->assertSame([[7]], $this->order_call_arguments('mark_payment_as_paid'));
        $this->assertSame([[7, 'TRX123']], $this->order_call_arguments('set_transaction_id'));
        $this->assertSame(['begin', 'commit'], $this->db_calls);
    }

    public function test_settled_metadata_keeps_the_payment_id_and_drops_the_wallet_number(): void
    {
        $this->respond('/query/payment', 200, $this->query_payment());
        $this->respond('/payment/execute', 200, $this->completed_payment() + ['payerAccount' => '01700000000']);

        $this->make_provider()->handle_return($this->return_request('success'));

        $metadata = json_decode($this->order_call_arguments('set_payment_metadata')[0][1], true);

        $this->assertSame('TR001', $metadata['paymentId']);
        $this->assertSame('TRX123', $metadata['trxId']);
        $this->assertArrayNotHasKey('payerAccount', $metadata);
    }

    public function test_repeated_return_on_a_paid_order_does_not_execute(): void
    {
        $this->order->payment_status = PaymentStatus::PAID;
        $this->respond('/query/payment', 200, $this->query_payment(['transactionStatus' => 'Completed']));

        $result = $this->make_provider()->handle_return($this->return_request('success'));

        $this->assertSame(static::SUCCESS_URL, $result->get_url());
        $this->assertSame(0, $this->call_count('/payment/execute'));
        $this->assertSame([], $this->order_call_arguments('mark_payment_as_paid'));
    }

    public function test_query_already_completed_settles_without_execute(): void
    {
        $this->respond('/query/payment', 200, $this->completed_payment());

        $result = $this->make_provider()->handle_return($this->return_request('success'));

        $this->assertSame(static::SUCCESS_URL, $result->get_url());
        $this->assertSame(0, $this->call_count('/payment/execute'));
        $this->assertSame([[7]], $this->order_call_arguments('mark_payment_as_paid'));
    }

    public function test_already_complete_rejection_is_resolved_with_query(): void
    {
        $this->respond('/query/payment', 200, $this->query_payment());
        $this->respond('/query/payment', 200, $this->completed_payment());
        $this->respond('/payment/execute', 200, ['externalCode' => '2062', 'errorMessageEn' => 'Already completed']);

        $result = $this->make_provider()->handle_return($this->return_request('success'));

        $this->assertSame(static::SUCCESS_URL, $result->get_url());
        $this->assertSame([[7]], $this->order_call_arguments('mark_payment_as_paid'));
        $this->assertSame([], $this->order_call_arguments('mark_payment_as_failed'));
    }

    public function test_unknown_execute_with_completed_query_marks_paid(): void
    {
        $this->respond('/query/payment', 200, $this->query_payment());
        $this->respond('/query/payment', 200, $this->completed_payment());
        $this->respond('/payment/execute', 0, null);

        $result = $this->make_provider()->handle_return($this->return_request('success'));

        $this->assertSame(static::SUCCESS_URL, $result->get_url());
        $this->assertSame([[7]], $this->order_call_arguments('mark_payment_as_paid'));
    }

    // Customer return: protection paths.

    public function test_stale_payment_id_does_not_execute(): void
    {
        $this->order->payment_metadata = ['gateway' => ['paymentId' => 'TR002']];
        $this->respond('/query/payment', 200, $this->query_payment());

        $result = $this->make_provider()->handle_return($this->return_request('success'));

        $this->assertSame(static::FAILED_URL, $result->get_url());
        $this->assertSame(0, $this->call_count('/payment/execute'));
        $this->assertSame([], $this->order_calls_except('find_by_uuid'));
        $this->assertSame('warning', $this->logs[0][0]);
    }

    /**
     * @dataProvider unusable_queries
     */
    public function test_unusable_payment_id_goes_home_and_changes_nothing(int $status, $body): void
    {
        $this->respond('/query/payment', $status, $body);

        $result = $this->make_provider()->handle_return($this->return_request('success'));

        $this->assertSame(static::HOME_URL, $result->get_url());
        $this->assertSame(0, $this->call_count('/payment/execute'));
        $this->assertSame([], $this->order_calls_except('find_by_uuid'));
    }

    public function unusable_queries(): array
    {
        return [
            'bKash does not recognize it' => [200, ['externalCode' => '2002', 'errorMessageEn' => 'Invalid Payment ID']],
            'no answer' => [0, null],
            'no order has the invoice' => [200, ['merchantInvoice' => 'other-uuid', 'transactionStatus' => 'Completed']],
        ];
    }

    public function test_missing_payment_id_goes_home_without_a_call(): void
    {
        $result = $this->make_provider()->handle_return((new Request())->merge(['status' => 'success']));

        $this->assertSame(static::HOME_URL, $result->get_url());
        $this->assertSame([], $this->http_calls);
    }

    public function test_forged_success_with_no_completed_result_is_not_paid(): void
    {
        $this->respond('/query/payment', 200, $this->query_payment());
        $this->respond('/payment/execute', 200, ['transactionStatus' => 'Initiated']);

        $this->make_provider()->handle_return($this->return_request('success'));

        $this->assertSame([], $this->order_call_arguments('mark_payment_as_paid'));
        $this->assertSame([], $this->order_call_arguments('set_transaction_id'));
    }

    public function test_post_to_the_webhook_url_changes_nothing(): void
    {
        $this->assertTrue($this->make_provider()->webhook());
        $this->assertSame([], $this->http_calls);
        $this->assertSame([], $this->order_calls);
    }

    // Customer return: failure paths.

    /**
     * @dataProvider non_success_statuses
     */
    public function test_cancel_and_failure_leave_the_order_unpaid(string $status): void
    {
        $this->respond('/query/payment', 200, $this->query_payment());

        $result = $this->make_provider()->handle_return($this->return_request($status));

        $this->assertSame(static::FAILED_URL, $result->get_url());
        $this->assertSame(0, $this->call_count('/payment/execute'));
        $this->assertSame([], $this->order_calls_except('find_by_uuid'));
    }

    public function non_success_statuses(): array
    {
        return ['cancel' => ['cancel'], 'failure' => ['failure']];
    }

    public function test_rejected_execute_marks_failed(): void
    {
        $this->respond('/query/payment', 200, $this->query_payment());
        $this->respond('/payment/execute', 200, ['externalCode' => '2023', 'errorMessageEn' => 'Insufficient Balance']);

        $result = $this->make_provider()->handle_return($this->return_request('success'));

        $this->assertSame(static::FAILED_URL, $result->get_url());
        $this->assertSame([[7]], $this->order_call_arguments('mark_payment_as_failed'));
    }

    /**
     * @dataProvider mismatched_payments
     */
    public function test_mismatch_puts_the_order_on_hold(array $overrides): void
    {
        $this->respond('/query/payment', 200, $this->query_payment());
        $this->respond('/payment/execute', 200, array_merge($this->completed_payment(), $overrides));

        $result = $this->make_provider()->handle_return($this->return_request('success'));

        $this->assertSame(static::FAILED_URL, $result->get_url());
        $this->assertSame([], $this->order_call_arguments('mark_payment_as_paid'));
        $this->assertSame([[7]], $this->order_call_arguments('mark_as_on_hold'));
        $this->assertCount(1, $this->order_call_arguments('set_payment_metadata'));
        $this->assertSame('critical', $this->logs[0][0]);
    }

    public function mismatched_payments(): array
    {
        return [
            'lower amount' => [['amount' => '499.99']],
            'other currency' => [['currency' => 'USD']],
        ];
    }

    public function test_unknown_execute_and_unknown_query_leave_the_order_unpaid(): void
    {
        $this->respond('/query/payment', 200, $this->query_payment());
        $this->respond('/query/payment', 0, null);
        $this->respond('/payment/execute', 0, null);

        $result = $this->make_provider()->handle_return($this->return_request('success'));

        $this->assertSame(static::SUCCESS_URL, $result->get_url());
        $this->assertSame([], $this->order_calls_except('find_by_uuid'));
        $this->assertContains(['critical', 'bKash payment TR001 of order 7 has no confirmed result. Check it in the bKash panel.'], $this->logs);
    }

    public function test_order_update_failure_rolls_back_and_logs_the_payment(): void
    {
        $this->fail_on = 'mark_payment_as_paid';
        $this->respond('/query/payment', 200, $this->query_payment());
        $this->respond('/payment/execute', 200, $this->completed_payment());

        $result = $this->make_provider()->handle_return($this->return_request('success'));

        $this->assertSame(static::SUCCESS_URL, $result->get_url());
        $this->assertSame(['begin', 'rollback'], $this->db_calls);
        $this->assertSame('critical', $this->logs[0][0]);
    }

    // Refunds.

    /**
     * @dataProvider refund_amounts
     */
    public function test_completed_refund_returns_true(int $minor, string $decimal): void
    {
        $this->prepare_paid_order();
        $this->respond('/refund/payment/transaction', 200, ['refundTransactionStatus' => 'Completed', 'refundTrxId' => 'R1']);

        $this->assertTrue($this->make_provider()->refund($this->order, $this->make_refund($minor)));

        $this->assertSame([
            'paymentId' => 'TR001',
            'trxId' => 'TRX123',
            'refundAmount' => $decimal,
            'sku' => static::UUID,
            'reason' => 'Damaged item',
        ], $this->http_calls[0]['data']);
    }

    public function refund_amounts(): array
    {
        return ['full' => [50000, '500.00'], 'partial' => [20000, '200.00']];
    }

    public function test_refund_uses_a_default_reason_and_limits_its_length(): void
    {
        $this->prepare_paid_order();
        $this->respond('/refund/payment/transaction', 200, ['refundTransactionStatus' => 'Completed']);

        $this->make_provider()->refund($this->order, $this->make_refund(20000, 2, ''));
        $this->assertSame('Refund by merchant', $this->http_calls[0]['data']['reason']);

        $this->make_provider()->refund($this->order, $this->make_refund(20000, 2, str_repeat('a', 300)));
        $this->assertSame(255, strlen($this->http_calls[1]['data']['reason']));
    }

    public function test_rejected_refund_throws_the_bkash_message(): void
    {
        $this->prepare_paid_order();
        $this->respond('/refund/payment/transaction', 200, ['externalCode' => '2071', 'errorMessageEn' => 'Refund after 60 days not allowed']);

        $this->expectExceptionMessage('Refund after 60 days not allowed');

        try {
            $this->make_provider()->refund($this->order, $this->make_refund(20000));
        } finally {
            $this->assertSame(0, $this->call_count('/refund/payment/status'));
        }
    }

    public function test_refund_without_a_stored_payment_id_throws(): void
    {
        $this->order->payment_transaction_id = 'TRX123';
        $this->order->payment_metadata = [];

        $this->expectExceptionMessage('no bKash payment');

        $this->make_provider()->refund($this->order, $this->make_refund(20000));
    }

    public function test_unknown_refund_with_a_new_status_entry_returns_true(): void
    {
        $this->prepare_paid_order();
        $this->respond('/refund/payment/transaction', 0, null);
        $this->respond('/refund/payment/status', 200, ['refundTransactions' => [
            ['refundTransactionStatus' => 'Completed', 'refundAmount' => '200'],
        ]]);

        $this->assertTrue($this->make_provider()->refund($this->order, $this->make_refund(20000)));
        $this->assertSame(['paymentId' => 'TR001', 'trxId' => 'TRX123'], end($this->http_calls)['data']);
    }

    public function test_unknown_refund_ignores_an_earlier_refund_of_the_same_amount(): void
    {
        $this->prepare_paid_order();
        $this->recorded_refunds = [(object) ['id' => 1, 'invoiced_amount' => 10000]];
        $this->respond('/refund/payment/transaction', 0, null);
        $this->respond('/refund/payment/status', 200, ['refundTransactions' => [
            ['refundTransactionStatus' => 'Completed', 'refundAmount' => '100.00'],
        ]]);

        $this->expectExceptionMessage('did not complete the refund');

        $this->make_provider()->refund($this->order, $this->make_refund(10000, 2));
    }

    public function test_unknown_refund_counts_past_the_current_refund_row(): void
    {
        $this->prepare_paid_order();
        $this->recorded_refunds = [
            (object) ['id' => 1, 'invoiced_amount' => 10000],
            (object) ['id' => 2, 'invoiced_amount' => 10000],
        ];
        $this->respond('/refund/payment/transaction', 0, null);
        $this->respond('/refund/payment/status', 200, ['refundTransactions' => [
            ['refundTransactionStatus' => 'Completed', 'refundAmount' => '100.00'],
            ['refundTransactionStatus' => 'Completed', 'refundAmount' => '100.00'],
        ]]);

        $this->assertTrue($this->make_provider()->refund($this->order, $this->make_refund(10000, 2)));
    }

    public function test_unknown_refund_and_unknown_status_tell_the_admin_to_check_the_panel(): void
    {
        $this->prepare_paid_order();
        $this->respond('/refund/payment/transaction', 0, null);
        $this->respond('/refund/payment/status', 0, null);

        $this->expectExceptionMessage('Check the bKash panel');

        $this->make_provider()->refund($this->order, $this->make_refund(20000));
    }

    // Fakes called by the bound services.

    public function record_http_call(string $url, array $headers, $timeout, array $data): void
    {
        $this->http_calls[] = ['url' => $url, 'headers' => $headers, 'timeout' => $timeout, 'data' => $data];
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
        $this->order_calls[] = [$method, $arguments];

        if ($method === $this->fail_on) {
            throw new Exception('boom');
        }

        if ($method === 'find_by_uuid') {
            return $arguments[0] === static::UUID ? $this->order : null;
        }

        return true;
    }

    // Helpers.

    protected function bind_fakes(): void
    {
        $test = $this;

        $http = new class($test) {
            protected $test;
            protected $headers = [];
            protected $timeout = null;

            public function __construct($test)
            {
                $this->test = $test;
            }

            public function with_headers(array $headers)
            {
                $this->headers = $headers;

                return $this;
            }

            public function timeout($seconds)
            {
                $this->timeout = $seconds;

                return $this;
            }

            public function as_json()
            {
                return $this;
            }

            public function post(string $url, $data = [])
            {
                $this->test->record_http_call($url, $this->headers, $this->timeout, $data);

                return $this->test->respond_to($url);
            }
        };

        $cache = new class($test) {
            protected $test;

            public function __construct($test)
            {
                $this->test = $test;
            }

            public function get($key, $default = null)
            {
                return $this->test->cache[$key] ?? $default;
            }

            public function put($key, $value, $ttl = null)
            {
                $this->test->cache[$key] = $value;

                return true;
            }

            public function lock(string $name, int $seconds = 60)
            {
                return new class($this->test) {
                    protected $test;

                    public function __construct($test)
                    {
                        $this->test = $test;
                    }

                    public function get($callback = null)
                    {
                        return $this->test->lock_busy ? false : $callback();
                    }
                };
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
        $container->bind('cache', fn() => $cache);
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

    protected function tearDown(): void
    {
        $router = new \ReflectionProperty(Route::class, 'site_router');
        $router->setAccessible(true);
        $router->setValue(null, null);

        parent::tearDown();
    }

    protected function respond(string $path, int $status, $body): void
    {
        $this->responses[$path][] = [$status, $body];
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

            public function failed()
            {
                return $this->status === 0 || $this->status >= 400;
            }

            public function json($key = null, $default = null)
            {
                return $this->body;
            }
        };
    }

    protected function settings(): array
    {
        return [
            'app_key' => 'app-key',
            'app_secret' => 'app-secret',
            'username' => 'app-user',
            'password' => 'app-pass',
            'sandbox' => true,
        ];
    }

    protected function make_client(bool $sandbox = true): BkashClient
    {
        return new BkashClient('app-key', 'app-secret', 'app-user', 'app-pass', $sandbox);
    }

    protected function make_provider(?array $settings = null): Bkash
    {
        $provider = new class extends Bkash {
            public function __construct()
            {
            }

            public function webhook_url()
            {
                return 'https://shop.test/wp-json/kirki/payment/webhook/bkash';
            }
        };

        $base = \Kirki\Ecommerce\App\Payment\PaymentProvider::class;

        foreach (['settings' => $settings ?? $this->settings(), 'is_enabled' => true] as $name => $value) {
            $property = new \ReflectionProperty($base, $name);
            $property->setAccessible(true);
            $property->setValue($provider, $value);
        }

        return $provider;
    }

    protected function make_order(): Order
    {
        $test = $this;

        $order = new class($test) extends Order {
            protected $bkash_test;

            public function __construct($test = null)
            {
                parent::__construct();

                $this->bkash_test = $test;
            }

            public function refunds()
            {
                return new class($this->bkash_test) {
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
        $order->currency_code = 'BDT';
        $order->invoiced_total = 50000;
        $order->payment_metadata = ['gateway' => ['paymentId' => 'TR001']];

        return $order;
    }

    protected function make_refund(int $minor, int $id = 1, string $reason = 'Damaged item'): Refund
    {
        $refund = new Refund();
        $refund->id = $id;
        $refund->invoiced_amount = $minor;
        $refund->reason = $reason;

        return $refund;
    }

    protected function prepare_paid_order(): void
    {
        $this->order->payment_status = PaymentStatus::PAID;
        $this->order->payment_transaction_id = 'TRX123';
    }

    protected function seed_token(string $environment = 'sandbox', string $token = 'seeded-token', ?int $issued_at = null): void
    {
        $this->cache['bkash_token_' . md5($environment . '|app-key')] = [
            'id_token' => $token,
            'refresh_token' => 'old-refresh',
            'issued_at' => $issued_at ?? time(),
        ];
    }

    protected function return_request(string $status): Request
    {
        return (new Request())->merge(['paymentID' => 'TR001', 'status' => $status]);
    }

    protected function query_payment(array $overrides = []): array
    {
        return array_merge([
            'paymentId' => 'TR001',
            'merchantInvoice' => static::UUID,
            'transactionStatus' => 'Initiated',
            'amount' => '500.00',
            'currency' => 'BDT',
        ], $overrides);
    }

    protected function completed_payment(): array
    {
        return [
            'paymentId' => 'TR001',
            'trxId' => 'TRX123',
            'transactionStatus' => 'Completed',
            'amount' => '500.00',
            'currency' => 'BDT',
            'merchantInvoice' => static::UUID,
        ];
    }

    protected function call_count(string $path): int
    {
        return count(array_filter($this->http_calls, function ($call) use ($path) {
            return substr($call['url'], -strlen($path)) === $path;
        }));
    }

    protected function auth_call_count(): int
    {
        return $this->call_count('/auth/grant-token') + $this->call_count('/auth/refresh-token');
    }

    protected function order_call_arguments(string $method): array
    {
        $calls = array_filter($this->order_calls, function ($call) use ($method) {
            return $call[0] === $method;
        });

        return array_values(array_column($calls, 1));
    }

    protected function order_calls_except(string $method): array
    {
        return array_values(array_filter($this->order_calls, function ($call) use ($method) {
            return $call[0] !== $method;
        }));
    }
}
