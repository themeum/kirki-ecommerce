<?php

namespace Kirki\Ecommerce\Payments;

use Exception;
use Kirki\Ecommerce\App\Constants\Order\OrderStatus;
use Kirki\Ecommerce\App\Constants\Order\PaymentStatus;
use Kirki\Ecommerce\App\Constants\Order\RefundStatus;
use Kirki\Ecommerce\App\Constants\Payment\PaymentActionType;
use Kirki\Ecommerce\App\DTO\Payment\PaymentActionDTO;
use Kirki\Ecommerce\App\DTO\Refund\UpdateRefundPayloadDTO;
use Kirki\Ecommerce\App\Facades\Order as OrderManager;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Models\Refund;
use Kirki\Ecommerce\App\Payment\PaymentProvider;
use Kirki\Ecommerce\App\Supports\Url;
use Kirki\Ecommerce\Framework\Http\RedirectResponse;
use Kirki\Ecommerce\Framework\Http\Request;
use Kirki\Ecommerce\Framework\Http\Superglobals;
use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Supports\Facades\DB;
use Kirki\Ecommerce\Framework\Supports\Facades\Log;
use Kirki\Ecommerce\Framework\Validation\Validator;
use Throwable;

use function Kirki\Ecommerce\Framework\redirect;
use function Kirki\Ecommerce\Framework\throw_anyway;

defined('ABSPATH') || exit;

/**
 * SSLCommerz payment gateway, using the version 4 hosted payment page.
 *
 * Each inbound request is only a hint. An order becomes paid only after the Order Validation
 * API confirms the payment and the response matches the order.
 */
class Sslcommerz extends PaymentProvider
{
    /** @var SslcommerzClient|null */
    protected ?SslcommerzClient $client = null;

    public function __construct()
    {
        $this->id = 'sslcommerz';
        $this->settings_key = 'sslcommerz';
        $this->title = __('SSLCommerz', 'kirki-ecommerce-sslcommerz');
        $this->description = __('SSLCommerz Payment Gateway', 'kirki-ecommerce-sslcommerz');
        $this->icon = $this->icon_url('sslcommerz');
        $this->is_offline = false;
        $this->is_available = true;
        $this->has_fields = true;

        parent::__construct();
    }

    /**
     * Create an SSLCommerz session and send the customer to the hosted page.
     *
     * @param Order $order
     * @return PaymentActionDTO
     * @throws Exception If SSLCommerz is disabled or the payment cannot start.
     */
    public function pay(Order $order)
    {
        if (!$this->enabled()) {
            throw_anyway(__('SSLCommerz is not enabled.', 'kirki-ecommerce-sslcommerz'));
        }

        try {
            $tran_id = $order->id . '-' . bin2hex(random_bytes(SslcommerzConstant::RANDOM_TRAN_ID_BYTES));
            $payload = (new SslcommerzTransactionBuilder($order))->build_session_payload($tran_id, $this->return_urls());
            $response = $this->get_client()->create_session($payload);
            $page_url = (string) ($response['GatewayPageURL'] ?? '');

            if (strpos($page_url, 'https://') !== 0) {
                throw_anyway(__('SSLCommerz did not return a payment page.', 'kirki-ecommerce-sslcommerz'));
            }

            OrderManager::set_payment_metadata($order->id, wp_json_encode([
                'tran_id' => $tran_id,
                'sessionkey' => (string) ($response['sessionkey'] ?? ''),
                'amount' => $payload['total_amount'],
                'currency' => $payload['currency'],
            ]));
        } catch (Exception $e) {
            /* translators: %s: error message. */
            throw_anyway(sprintf(__('SSLCommerz Payment Error: %s', 'kirki-ecommerce-sslcommerz'), $this->session_error_message($e)), Exception::class, SslcommerzConstant::DEFAULT_EXCEPTION_CODE, $e);
        }

        $this->schedule_payment_check($order->id, $tran_id, 0);

        return PaymentActionDTO::from_array([
            'type' => PaymentActionType::REDIRECT,
            'value' => $page_url,
        ]);
    }

    /**
     * Handle a POST to the webhook URL: a browser return or an IPN.
     *
     * A browser return ends here with a redirect, because the core route answers with JSON.
     *
     * @return bool True if the IPN was processed.
     * @throws Exception If the store credentials are missing.
     */
    public function webhook()
    {
        $return_type = (string) Superglobals::query(SslcommerzConstant::RETURN_ARGUMENT, '');

        if ($return_type !== '') {
            $this->handle_browser_return($return_type, Superglobals::post())->send();
        }

        return $this->handle_ipn(Superglobals::post());
    }

    /**
     * Handle a GET to the webhook URL, for a return that does not arrive as a POST.
     *
     * @param Request $request
     * @return RedirectResponse|null
     */
    public function handle_return(Request $request): ?RedirectResponse
    {
        $return_type = (string) $request->text(SslcommerzConstant::RETURN_ARGUMENT);

        return $return_type === '' ? null : $this->handle_browser_return($return_type, Superglobals::query());
    }

    /**
     * Process a browser return, and get the redirect that ends it.
     *
     * @param string               $return_type One of the SslcommerzConstant::RETURN_* values.
     * @param array<string, mixed> $data        The raw values of the request.
     * @return RedirectResponse
     */
    public function handle_browser_return(string $return_type, array $data): RedirectResponse
    {
        try {
            $this->check_signature($data);
            $order = $this->find_order_for_tran_id($this->field($data, 'tran_id'));

            if (!$order) {
                return redirect(home_url(), 303);
            }

            return redirect($return_type === SslcommerzConstant::RETURN_SUCCESS
                ? $this->success_return_url($order, $this->field($data, 'val_id'))
                : $this->failure_return_url($order), 303);
        } catch (Throwable $e) {
            Log::critical(sprintf('SSLCommerz browser return failed: %s', $e->getMessage()));

            return redirect(home_url(), 303);
        }
    }

    /**
     * Process an IPN.
     *
     * @param array<string, mixed> $data The raw posted values.
     * @return bool True if the IPN was processed. False gives a client error, so a retry can occur.
     * @throws Exception If the store credentials are missing.
     */
    public function handle_ipn(array $data): bool
    {
        $this->check_signature($data);

        $order = $this->find_order_for_tran_id($this->field($data, 'tran_id'));

        if (!$order) {
            Log::warning('SSLCommerz IPN has no matching order.');

            return false;
        }

        $outcome = in_array($this->field($data, 'status'), SslcommerzConstant::SUCCESS_STATUSES, true)
            ? $this->confirm($order, $this->field($data, 'val_id'))
            : $this->resolve_failure($order);

        return !in_array($outcome, [SslcommerzConstant::OUTCOME_UNKNOWN, SslcommerzConstant::OUTCOME_NOT_CONFIRMED], true);
    }

    /**
     * Run one scheduled payment check, and schedule the next one if the payment is still unresolved.
     *
     * @param int    $order_id
     * @param string $tran_id
     * @param int    $check    The number of this check, from zero.
     * @return void
     */
    public function run_payment_check(int $order_id, string $tran_id, int $check): void
    {
        if (!$this->check_payment($order_id, $tran_id)) {
            return;
        }

        $next_check = $check + 1;

        if ($next_check >= count(SslcommerzConstant::PAYMENT_CHECK_DELAYS_SECONDS)) {
            Log::warning(sprintf('SSLCommerz payment %s of order %d did not complete. The scheduled checks have ended.', $tran_id, $order_id));

            return;
        }

        $this->schedule_payment_check($order_id, $tran_id, $next_check);
    }

    /**
     * Send a refund to SSLCommerz. An accepted refund stays pending until a scheduled check completes it.
     *
     * @param Order  $order
     * @param Refund $refund
     * @return bool True when SSLCommerz accepted the refund.
     * @throws Exception If SSLCommerz did not accept the refund. CreateRefundAction ignores the return value, so only an exception stops the local refund.
     */
    public function refund(Order $order, Refund $refund)
    {
        $bank_tran_id = (string) $order->payment_transaction_id;

        if (empty($bank_tran_id)) {
            throw_anyway(__('This order has no SSLCommerz payment to refund.', 'kirki-ecommerce-sslcommerz'));
        }

        try {
            $response = $this->get_client()->refund([
                'bank_tran_id' => $bank_tran_id,
                'refund_trans_id' => $this->refund_trans_id($order, $refund),
                'refund_amount' => static::format_amount($refund->invoiced_amount, $order->currency_code),
                'refund_remarks' => mb_substr($refund->reason ?: 'Refund by merchant', 0, SslcommerzConstant::MAX_REFUND_REMARKS_LENGTH),
            ]);
        } catch (SslcommerzRejectedException $e) {
            /* translators: %s: error message. */
            throw_anyway(sprintf(__('SSLCommerz Refund Error: %s', 'kirki-ecommerce-sslcommerz'), $e->getMessage()), Exception::class, SslcommerzConstant::DEFAULT_EXCEPTION_CODE, $e);
        } catch (SslcommerzUnknownResultException $e) {
            throw_anyway(__('SSLCommerz did not confirm the refund. Check the SSLCommerz panel before you try again.', 'kirki-ecommerce-sslcommerz'), Exception::class, SslcommerzConstant::DEFAULT_EXCEPTION_CODE, $e);
        }

        $status = (string) ($response['status'] ?? '');
        $reference = (string) ($response['refund_ref_id'] ?? '');

        if ($status === SslcommerzConstant::REFUND_SUCCESS && $reference !== '') {
            $refund->update(['refund_id' => $reference]);
            $this->schedule_refund_check($order->id, (int) $refund->id, 0);

            return true;
        }

        if ($status === SslcommerzConstant::REFUND_PROCESSING) {
            throw_anyway(__('SSLCommerz has already started a refund for this payment. Check the SSLCommerz panel.', 'kirki-ecommerce-sslcommerz'));
        }

        if ($status === SslcommerzConstant::REFUND_FAILED) {
            /* translators: %s: error message. */
            throw_anyway(sprintf(__('SSLCommerz Refund Error: %s', 'kirki-ecommerce-sslcommerz'), (string) ($response['errorReason'] ?? '')));
        }

        throw_anyway(__('SSLCommerz did not confirm the refund. Check the SSLCommerz panel before you try again.', 'kirki-ecommerce-sslcommerz'));
    }

    /**
     * Run one scheduled refund check, and schedule the next one if the refund has no final state.
     *
     * @param int $order_id
     * @param int $refund_id The ID of the refund row.
     * @param int $check     The number of this check, from zero.
     * @return void
     */
    public function run_refund_check(int $order_id, int $refund_id, int $check): void
    {
        if (!$this->check_refund($order_id, $refund_id)) {
            return;
        }

        $next_check = $check + 1;

        if ($next_check >= count(SslcommerzConstant::REFUND_CHECK_DELAYS_SECONDS)) {
            Log::warning(sprintf('SSLCommerz refund %d of order %d has no final state. Check it in the SSLCommerz panel.', $refund_id, $order_id));

            return;
        }

        $this->schedule_refund_check($order_id, $refund_id, $next_check);
    }

    /**
     * Define the admin settings fields.
     *
     * @return void
     */
    protected function init_admin_fields()
    {
        $this->set_admin_fields([
            [
                'name' => 'store_id',
                'label' => __('Store ID', 'kirki-ecommerce-sslcommerz'),
                'placeholder' => __('Enter your SSLCommerz store ID', 'kirki-ecommerce-sslcommerz'),
                'type' => 'text',
                'required' => true,
            ],
            [
                'name' => 'store_password',
                'label' => __('Store Password', 'kirki-ecommerce-sslcommerz'),
                'placeholder' => __('Enter your SSLCommerz API password', 'kirki-ecommerce-sslcommerz'),
                'type' => 'password',
                'required' => true,
                'description' => __('Use the API password, not the merchant panel password. Live refunds need your server public IP registered with SSLCommerz.', 'kirki-ecommerce-sslcommerz'),
            ],
            [
                'name' => 'sandbox',
                'label' => __('Sandbox Mode', 'kirki-ecommerce-sslcommerz'),
                'type' => 'checkbox',
            ],
        ]);
    }

    /**
     * Validate settings.
     *
     * @param array $settings
     * @return bool
     */
    protected function validate_settings(array $settings)
    {
        parent::validate_settings($settings);

        Validator::make($settings, [
            'store_id' => 'sometimes|string',
            'store_password' => 'sometimes|string',
            'sandbox' => 'sometimes|boolean',
        ])->validate();

        return true;
    }

    /**
     * Sanitize settings. The password keeps every character, because a text sanitizer removes
     * sequences such as "<a" and changes the credential.
     *
     * @param array $settings
     * @return array
     */
    protected function sanitize_settings(array $settings)
    {
        $parent_settings = parent::sanitize_settings($settings);

        $data = Sanitizer::make($settings, [
            'store_id' => Sanitizer::TEXT,
            'store_password' => Sanitizer::TRIM,
            'sandbox' => Sanitizer::BOOL,
        ])->get_sanitized_data();

        return array_merge($parent_settings, $data);
    }

    /**
     * Get the SSLCommerz API client.
     *
     * @return SslcommerzClient
     * @throws Exception If a credential is missing.
     */
    protected function get_client(): SslcommerzClient
    {
        if ($this->client) {
            return $this->client;
        }

        $store_id = (string) ($this->settings['store_id'] ?? '');
        $store_password = (string) ($this->settings['store_password'] ?? '');
        $sandbox = (bool) ($this->settings['sandbox'] ?? true);

        if (empty($store_id) || empty($store_password)) {
            throw_anyway(__('SSLCommerz credentials are missing.', 'kirki-ecommerce-sslcommerz'));
        }

        return $this->client = new SslcommerzClient($store_id, $store_password, $sandbox);
    }

    /**
     * Get the session URLs. A return URL has a query argument, so that webhook() can tell it from an IPN.
     *
     * @return array<string, string>
     */
    protected function return_urls(): array
    {
        $url = $this->webhook_url();

        return [
            'success_url' => add_query_arg([SslcommerzConstant::RETURN_ARGUMENT => SslcommerzConstant::RETURN_SUCCESS], $url),
            'fail_url' => add_query_arg([SslcommerzConstant::RETURN_ARGUMENT => SslcommerzConstant::RETURN_FAIL], $url),
            'cancel_url' => add_query_arg([SslcommerzConstant::RETURN_ARGUMENT => SslcommerzConstant::RETURN_CANCEL], $url),
            'ipn_url' => $url,
        ];
    }

    /**
     * Get the message for a session error, with help for the most common credential mistake.
     *
     * @param Exception $error
     * @return string
     */
    protected function session_error_message(Exception $error): string
    {
        if ($error instanceof SslcommerzRejectedException && strpos($error->getMessage(), SslcommerzConstant::STORE_CREDENTIAL_ERROR) !== false) {
            return __('The store credentials are not correct. Use the API password, not the merchant panel password.', 'kirki-ecommerce-sslcommerz');
        }

        return $error->getMessage();
    }

    /**
     * Log a wrong signature. The Order Validation API decides the order state in all cases.
     *
     * @param array<string, mixed> $data The raw values of the request.
     * @return void
     * @throws Exception If the store credentials are missing.
     */
    protected function check_signature(array $data): void
    {
        if (!$this->get_client()->has_valid_signature($data)) {
            Log::warning(sprintf('SSLCommerz message for transaction %s has no valid signature.', $this->field($data, 'tran_id')));
        }
    }

    /**
     * Read one sanitized text value from raw request values.
     *
     * @param array<string, mixed> $data The raw values of the request.
     * @param string               $name The field name.
     * @return string
     */
    protected function field(array $data, string $name): string
    {
        $value = $data[$name] ?? '';

        return is_scalar($value) ? (string) Sanitizer::apply_rule((string) $value, Sanitizer::TEXT) : '';
    }

    /**
     * Find the order of a transaction ID, which must equal the value that the order stores.
     *
     * @param string $tran_id
     * @return Order|null
     */
    protected function find_order_for_tran_id(string $tran_id): ?Order
    {
        if (!preg_match('/^(\d+)-[a-f0-9]+$/', $tran_id, $matches)) {
            return null;
        }

        try {
            $order = $this->order_service->find_order_or_fail((int) $matches[1]);
        } catch (Exception $e) {
            return null;
        }

        return hash_equals($this->stored_tran_id($order), $tran_id) ? $order : null;
    }

    /**
     * Confirm a payment for a success return, and get the URL to send the customer to.
     *
     * When the validator has no clear result, the customer goes to the success page, because the
     * failed page offers another payment and the money may already have moved.
     *
     * @param Order  $order
     * @param string $val_id
     * @return string
     */
    protected function success_return_url(Order $order, string $val_id): string
    {
        $outcome = $this->confirm($order, $val_id);

        if ($outcome === SslcommerzConstant::OUTCOME_UNKNOWN) {
            Log::critical(sprintf('SSLCommerz payment of order %d has no confirmed result. Check it in the SSLCommerz panel.', $order->id));

            return Url::get_checkout_success_url($order->uuid);
        }

        return in_array($outcome, SslcommerzConstant::SETTLED_OUTCOMES, true)
            ? Url::get_checkout_success_url($order->uuid)
            : Url::get_checkout_failed_url($order->uuid);
    }

    /**
     * Resolve a failure message for a browser return, and get the URL to send the customer to.
     *
     * @param Order $order
     * @return string
     */
    protected function failure_return_url(Order $order): string
    {
        return in_array($this->resolve_failure($order), SslcommerzConstant::SETTLED_OUTCOMES, true)
            ? Url::get_checkout_success_url($order->uuid)
            : Url::get_checkout_failed_url($order->uuid);
    }

    /**
     * Confirm one payment with the Order Validation API, and settle it.
     *
     * @param Order  $order
     * @param string $val_id
     * @return string One of the SslcommerzConstant::OUTCOME_* values.
     */
    protected function confirm(Order $order, string $val_id): string
    {
        if ($val_id === '') {
            return SslcommerzConstant::OUTCOME_NOT_CONFIRMED;
        }

        try {
            $payment = $this->get_client()->validate($val_id);
        } catch (Exception $e) {
            Log::warning(sprintf('SSLCommerz validation for order %d has no result: %s', $order->id, $e->getMessage()));

            return SslcommerzConstant::OUTCOME_UNKNOWN;
        }

        if (!in_array($payment['status'] ?? '', SslcommerzConstant::SUCCESS_STATUSES, true)) {
            return SslcommerzConstant::OUTCOME_NOT_CONFIRMED;
        }

        if (!hash_equals($this->stored_tran_id($order), (string) ($payment['tran_id'] ?? ''))) {
            Log::warning(sprintf('SSLCommerz validation for order %d reports another transaction.', $order->id));

            return SslcommerzConstant::OUTCOME_NOT_CONFIRMED;
        }

        try {
            return $this->apply_settlement($order->id, $val_id, $payment);
        } catch (Throwable $e) {
            Log::critical(sprintf('SSLCommerz payment %s completed, but order %d did not update: %s', $val_id, $order->id, $e->getMessage()));

            return SslcommerzConstant::OUTCOME_UNKNOWN;
        }
    }

    /**
     * Apply a confirmed payment to the order under a row lock.
     *
     * The return, the IPN, and the check can run at the same time, so the state is read again
     * after the lock. The caller makes every SSLCommerz call before this method.
     *
     * @param int                  $order_id
     * @param string               $val_id
     * @param array<string, mixed> $payment  The Order Validation API response.
     * @return string One of the SslcommerzConstant::OUTCOME_* values.
     * @throws Throwable If the order update fails. The change is rolled back.
     */
    protected function apply_settlement(int $order_id, string $val_id, array $payment): string
    {
        DB::begin_transaction();

        try {
            $this->order_service->lock_order($order_id);
            $order = $this->order_service->find_order_or_fail($order_id);
            $outcome = $this->apply_settlement_to_locked_order($order, $val_id, $payment);

            DB::commit();
        } catch (Throwable $e) {
            DB::rollback();

            throw $e;
        }

        return $outcome;
    }

    /**
     * Decide and apply the settlement for an order that this request has locked.
     *
     * @param Order                $order
     * @param string               $val_id
     * @param array<string, mixed> $payment The Order Validation API response.
     * @return string One of the SslcommerzConstant::OUTCOME_* values.
     */
    protected function apply_settlement_to_locked_order(Order $order, string $val_id, array $payment): string
    {
        if ($this->is_settled($order)) {
            if (($this->stored_gateway_data($order)['val_id'] ?? '') !== $val_id) {
                Log::critical(sprintf('SSLCommerz payment %s also completed for the settled order %d. Check for a double payment in the SSLCommerz panel.', $val_id, $order->id));
            }

            return SslcommerzConstant::OUTCOME_ALREADY_PAID;
        }

        if (in_array($order->order_status, [OrderStatus::UNPAID_CANCELLED, OrderStatus::FAILED_CANCELLED], true)) {
            Log::critical(sprintf('SSLCommerz payment %s completed, but order %d is cancelled. Refund it in the SSLCommerz panel.', $val_id, $order->id));

            return SslcommerzConstant::OUTCOME_CANCELLED;
        }

        $this->store_gateway_data($order, array_intersect_key($payment, array_flip(SslcommerzConstant::STORED_PAYMENT_FIELDS)));

        if (!$this->matches_order($order, $payment)) {
            $this->hold_order($order);
            Log::critical(sprintf(
                'SSLCommerz payment %s does not match order %d: expected %s %s, received %s %s.',
                $val_id,
                $order->id,
                static::format_amount($order->invoiced_total, $order->currency_code),
                strtoupper($order->currency_code),
                (string) ($payment['currency_amount'] ?? 'no amount'),
                (string) ($payment['currency_type'] ?? 'no currency')
            ));

            return SslcommerzConstant::OUTCOME_HELD;
        }

        OrderManager::set_transaction_id($order->id, (string) ($payment['bank_tran_id'] ?? ''));

        if ($this->is_low_risk($payment)) {
            OrderManager::mark_payment_as_paid($order->id);
        } else {
            $this->mark_risky_payment_as_paid($order, $val_id, $payment);
        }

        return SslcommerzConstant::OUTCOME_PAID;
    }

    /**
     * Put the order in the paid and on-hold state.
     *
     * From a failed payment, hold and then paid gives paid_processing, so that order goes paid and
     * then hold.
     *
     * @param Order                $order
     * @param string               $val_id
     * @param array<string, mixed> $payment The Order Validation API response.
     * @return void
     */
    protected function mark_risky_payment_as_paid(Order $order, string $val_id, array $payment): void
    {
        if ($order->payment_status === PaymentStatus::FAILED) {
            OrderManager::mark_payment_as_paid($order->id);
            OrderManager::mark_as_on_hold($order->id);
        } else {
            $this->hold_order($order);
            OrderManager::mark_payment_as_paid($order->id);
        }

        Log::warning(sprintf('SSLCommerz reports payment %s of order %d as risky: %s. The order is on hold.', $val_id, $order->id, (string) ($payment['risk_title'] ?? 'no risk title')));
    }

    /**
     * Put an order on hold, unless it is on hold already. A repeat would log a second activity.
     *
     * @param Order $order
     * @return void
     */
    protected function hold_order(Order $order): void
    {
        if (!in_array($order->order_status, [OrderStatus::ON_HOLD_UNPAID, OrderStatus::FAILED_ON_HOLD], true)) {
            OrderManager::mark_as_on_hold($order->id);
        }
    }

    /**
     * Determine whether a validation response reports exactly the low risk level.
     *
     * @param array<string, mixed> $payment
     * @return bool
     */
    protected function is_low_risk(array $payment): bool
    {
        $risk_level = $payment['risk_level'] ?? null;

        return is_scalar($risk_level) && (string) $risk_level === SslcommerzConstant::LOW_RISK_LEVEL;
    }

    /**
     * Determine whether an order has a confirmed payment, including a refund of it.
     *
     * @param Order $order
     * @return bool
     */
    protected function is_settled(Order $order): bool
    {
        return in_array($order->payment_status, [PaymentStatus::PAID, PaymentStatus::REFUNDING, PaymentStatus::REFUNDED], true);
    }

    /**
     * Determine whether a validation response has the order's exact total and currency.
     *
     * `amount` is the BDT value after conversion. `currency_amount` and `currency_type` are the
     * values that the store sent.
     *
     * @param Order                $order
     * @param array<string, mixed> $payment
     * @return bool
     */
    protected function matches_order(Order $order, array $payment): bool
    {
        $amount = number_format((float) ($payment['currency_amount'] ?? 0), 2, '.', '');

        return $amount === static::format_amount($order->invoiced_total, $order->currency_code)
            && strtoupper((string) ($payment['currency_type'] ?? '')) === strtoupper($order->currency_code);
    }

    /**
     * Confirm a failure message with a transaction query.
     *
     * The message can be forged, and it often has no validation ID, so it does not change the
     * order itself.
     *
     * @param Order $order
     * @return string One of the SslcommerzConstant::OUTCOME_* values.
     */
    protected function resolve_failure(Order $order): string
    {
        if ($this->is_settled($order)) {
            return SslcommerzConstant::OUTCOME_ALREADY_PAID;
        }

        try {
            $elements = $this->get_client()->query_by_tran_id($this->stored_tran_id($order));
        } catch (Exception $e) {
            Log::warning(sprintf('SSLCommerz query for order %d has no result: %s', $order->id, $e->getMessage()));

            return SslcommerzConstant::OUTCOME_UNKNOWN;
        }

        $outcome = $this->settle_successful_elements($order, $elements);

        if ($outcome !== null) {
            return $outcome;
        }

        if (in_array(SslcommerzConstant::STATUS_PENDING, array_column($elements, 'status'), true)) {
            return SslcommerzConstant::OUTCOME_UNKNOWN;
        }

        return $this->fail_order($order);
    }

    /**
     * Send each successful query element through the validation path.
     *
     * The docs do not define the order of the elements, and more than one can report success.
     *
     * @param Order                            $order
     * @param array<int, array<string, mixed>> $elements
     * @return string|null The outcome of the first successful element, or null if none reports success.
     */
    protected function settle_successful_elements(Order $order, array $elements): ?string
    {
        $first_outcome = null;

        foreach ($elements as $element) {
            if (in_array($element['status'] ?? '', SslcommerzConstant::SUCCESS_STATUSES, true)) {
                $outcome = $this->confirm($order, (string) ($element['val_id'] ?? ''));
                $first_outcome = $first_outcome ?? $outcome;
            }
        }

        return $first_outcome;
    }

    /**
     * Mark the order payment as failed under the lock, unless another request settled it first.
     *
     * @param Order $order
     * @return string One of the SslcommerzConstant::OUTCOME_* values.
     */
    protected function fail_order(Order $order): string
    {
        DB::begin_transaction();

        try {
            $this->order_service->lock_order($order->id);
            $is_settled = $this->is_settled($this->order_service->find_order_or_fail($order->id));

            if (!$is_settled) {
                OrderManager::mark_payment_as_failed($order->id);
            }

            DB::commit();
        } catch (Throwable $e) {
            DB::rollback();
            Log::critical(sprintf('SSLCommerz could not mark order %d as failed: %s', $order->id, $e->getMessage()));

            return SslcommerzConstant::OUTCOME_UNKNOWN;
        }

        return $is_settled ? SslcommerzConstant::OUTCOME_ALREADY_PAID : SslcommerzConstant::OUTCOME_FAILED;
    }

    /**
     * Check one payment with a transaction query, and settle it if SSLCommerz reports success.
     *
     * @param int    $order_id
     * @param string $tran_id
     * @return bool True if the payment is still unresolved.
     */
    protected function check_payment(int $order_id, string $tran_id): bool
    {
        try {
            $order = $this->order_service->find_order_or_fail($order_id);
        } catch (Exception $e) {
            Log::warning(sprintf('SSLCommerz scheduled check found no order %d for transaction %s.', $order_id, $tran_id));

            return false;
        }

        if ($this->stored_tran_id($order) !== $tran_id) {
            $this->report_older_transaction($order_id, $tran_id);

            return false;
        }

        if ($this->is_settled($order)) {
            return false;
        }

        try {
            $elements = $this->get_client()->query_by_tran_id($tran_id);
        } catch (Exception $e) {
            Log::warning(sprintf('SSLCommerz scheduled check for transaction %s has no result: %s', $tran_id, $e->getMessage()));

            return true;
        }

        $outcome = $this->settle_successful_elements($order, $elements);

        return $outcome === null || in_array($outcome, [SslcommerzConstant::OUTCOME_UNKNOWN, SslcommerzConstant::OUTCOME_NOT_CONFIRMED], true);
    }

    /**
     * Log a success on a transaction that the order no longer stores. The order does not change.
     *
     * @param int    $order_id
     * @param string $tran_id
     * @return void
     */
    protected function report_older_transaction(int $order_id, string $tran_id): void
    {
        try {
            $statuses = array_column($this->get_client()->query_by_tran_id($tran_id), 'status');
        } catch (Exception $e) {
            Log::warning(sprintf('SSLCommerz scheduled check for transaction %s has no result: %s', $tran_id, $e->getMessage()));

            return;
        }

        if (array_intersect($statuses, SslcommerzConstant::SUCCESS_STATUSES)) {
            Log::critical(sprintf('SSLCommerz older transaction %s of order %d has a successful payment. Check it in the SSLCommerz panel.', $tran_id, $order_id));
        }
    }

    /**
     * Check one refund, and update it if SSLCommerz reports a final state.
     *
     * @param int $order_id
     * @param int $refund_id The ID of the refund row.
     * @return bool True if the refund still has no final state.
     */
    protected function check_refund(int $order_id, int $refund_id): bool
    {
        try {
            $order = $this->order_service->find_order_or_fail($order_id);
        } catch (Exception $e) {
            return false;
        }

        $refund = OrderManager::get_refund($order, $refund_id);

        if (!$refund || $refund->status !== RefundStatus::PENDING || empty($refund->refund_id)) {
            return false;
        }

        try {
            $response = $this->get_client()->query_refund((string) $refund->refund_id);
            $status = (string) ($response['status'] ?? '');

            if ($status === SslcommerzConstant::REFUND_REFUNDED) {
                $this->update_refund_status($refund, RefundStatus::COMPLETED);

                return false;
            }

            if ($status === SslcommerzConstant::REFUND_CANCELLED) {
                $this->update_refund_status($refund, RefundStatus::CANCELLED);
                Log::warning(sprintf('SSLCommerz cancelled refund %d of order %d. Check it in the SSLCommerz panel.', $refund_id, $order_id));

                return false;
            }
        } catch (Exception $e) {
            Log::warning(sprintf('SSLCommerz refund check for refund %d has no result: %s', $refund_id, $e->getMessage()));
        }

        return true;
    }

    /**
     * Update a refund row through the core refund path.
     *
     * @param Refund $refund
     * @param string $status One of the RefundStatus values.
     * @return void
     */
    protected function update_refund_status(Refund $refund, string $status): void
    {
        OrderManager::update_refund(UpdateRefundPayloadDTO::from_array(array_merge($refund->to_array(), [
            'invoiced_amount' => $refund->invoiced_amount,
            'status' => $status,
        ])));
    }

    /**
     * Get the refund transaction ID.
     *
     * The value is the same when an admin repeats a refund after a refund with no clear result,
     * because a thrown exception removes the refund row.
     *
     * @param Order  $order
     * @param Refund $refund
     * @return string
     */
    protected function refund_trans_id(Order $order, Refund $refund): string
    {
        $earlier_refunds = 0;

        foreach ($order->refunds()->get() as $earlier) {
            if ((int) $earlier->id !== (int) $refund->id) {
                $earlier_refunds++;
            }
        }

        return sprintf('%d-%d-%d', $order->id, $earlier_refunds, (int) $refund->invoiced_amount);
    }

    /**
     * Schedule a payment check. A queue error must not stop the payment, so it only writes a log entry.
     *
     * @param int    $order_id
     * @param string $tran_id
     * @param int    $check    The number of the check, from zero.
     * @return void
     */
    protected function schedule_payment_check(int $order_id, string $tran_id, int $check): void
    {
        try {
            $this->dispatch_payment_check($order_id, $tran_id, $check, SslcommerzConstant::PAYMENT_CHECK_DELAYS_SECONDS[$check]);
        } catch (Throwable $e) {
            Log::error(sprintf('SSLCommerz could not schedule a check for transaction %s: %s', $tran_id, $e->getMessage()));
        }
    }

    /**
     * Put a payment check on the queue.
     *
     * @param int    $order_id
     * @param string $tran_id
     * @param int    $check    The number of the check, from zero.
     * @param int    $delay    Seconds to wait.
     * @return void
     */
    protected function dispatch_payment_check(int $order_id, string $tran_id, int $check, int $delay): void
    {
        SslcommerzPaymentCheckJob::dispatch($order_id, $tran_id, $check)->delay($delay);
    }

    /**
     * Schedule a refund check. A queue error must not stop the refund, so it only writes a log entry.
     *
     * @param int $order_id
     * @param int $refund_id The ID of the refund row.
     * @param int $check     The number of the check, from zero.
     * @return void
     */
    protected function schedule_refund_check(int $order_id, int $refund_id, int $check): void
    {
        try {
            $this->dispatch_refund_check($order_id, $refund_id, $check, SslcommerzConstant::REFUND_CHECK_DELAYS_SECONDS[$check]);
        } catch (Throwable $e) {
            Log::error(sprintf('SSLCommerz could not schedule a check for refund %d: %s', $refund_id, $e->getMessage()));
        }
    }

    /**
     * Put a refund check on the queue.
     *
     * @param int $order_id
     * @param int $refund_id The ID of the refund row.
     * @param int $check     The number of the check, from zero.
     * @param int $delay     Seconds to wait.
     * @return void
     */
    protected function dispatch_refund_check(int $order_id, int $refund_id, int $check, int $delay): void
    {
        SslcommerzRefundCheckJob::dispatch($order_id, $refund_id, $check)->delay($delay);
    }

    /**
     * Merge fields into the gateway data on the order, because set_payment_metadata replaces the key.
     *
     * @param Order                $order
     * @param array<string, mixed> $fields
     * @return void
     */
    protected function store_gateway_data(Order $order, array $fields): void
    {
        OrderManager::set_payment_metadata($order->id, wp_json_encode(array_merge($this->stored_gateway_data($order), $fields)));
    }

    /**
     * Get the gateway data that the order stores.
     *
     * @param Order $order
     * @return array<string, mixed>
     */
    protected function stored_gateway_data(Order $order): array
    {
        $metadata = is_array($order->payment_metadata) ? $order->payment_metadata : [];

        return is_array($metadata['gateway'] ?? null) ? $metadata['gateway'] : [];
    }

    /**
     * Get the transaction ID that the order stores.
     *
     * @param Order $order
     * @return string
     */
    protected function stored_tran_id(Order $order): string
    {
        return (string) ($this->stored_gateway_data($order)['tran_id'] ?? '');
    }
}
