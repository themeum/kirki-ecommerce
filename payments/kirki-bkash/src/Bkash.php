<?php

namespace Kirki\Ecommerce\Payments;

use Exception;
use Kirki\Ecommerce\App\Constants\Order\PaymentStatus;
use Kirki\Ecommerce\App\Constants\Payment\PaymentActionType;
use Kirki\Ecommerce\App\DTO\Payment\PaymentActionDTO;
use Kirki\Ecommerce\App\Facades\Order as OrderManager;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Models\Refund;
use Kirki\Ecommerce\App\Payment\PaymentProvider;
use Kirki\Ecommerce\App\Supports\Url;
use Kirki\Ecommerce\Framework\Http\RedirectResponse;
use Kirki\Ecommerce\Framework\Http\Request;
use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Supports\Facades\DB;
use Kirki\Ecommerce\Framework\Supports\Facades\Log;
use Kirki\Ecommerce\Framework\Validation\Validator;
use Throwable;

use function Kirki\Ecommerce\Framework\redirect;
use function Kirki\Ecommerce\Framework\throw_anyway;

defined('ABSPATH') || exit;

/**
 * bKash payment gateway, using Tokenized Checkout without agreement.
 *
 * The webhook() method of the base class stays in place, so a POST to the webhook URL
 * cannot change an order. Only the customer return can do that, and only after bKash
 * confirms the payment in a server-to-server response.
 */
class Bkash extends PaymentProvider
{
    /** @var BkashClient|null */
    protected ?BkashClient $client = null;

    public function __construct()
    {
        $this->id = 'bkash';
        $this->settings_key = 'bkash';
        $this->title = __('bKash', 'kirki-ecommerce-bkash');
        $this->description = __('bKash Payment Gateway', 'kirki-ecommerce-bkash');
        $this->icon = $this->icon_url('bkash');
        $this->is_offline = false;
        $this->is_available = true;
        $this->has_fields = true;

        parent::__construct();
    }

    /**
     * Create a bKash payment and send the customer to the bKash page.
     *
     * @param Order $order
     * @return PaymentActionDTO
     * @throws Exception If bKash is disabled, the order is not in BDT, or the payment cannot start.
     */
    public function pay(Order $order)
    {
        if (!$this->enabled()) {
            throw_anyway(__('bKash is not enabled.', 'kirki-ecommerce-bkash'));
        }

        if (strtoupper($order->currency_code) !== BkashConstant::CURRENCY) {
            throw_anyway(__('bKash accepts only BDT.', 'kirki-ecommerce-bkash'));
        }

        try {
            $payload = (new BkashTransactionBuilder($order))->build_payment_payload($this->webhook_url());
            $response = $this->get_client()->create_payment($payload);

            if (empty($response['paymentId']) || empty($response['bkashURL'])) {
                throw_anyway(__('bKash did not return a payment page.', 'kirki-ecommerce-bkash'));
            }

            OrderManager::set_payment_metadata($order->id, wp_json_encode(['paymentId' => $response['paymentId']]));
        } catch (Exception $e) {
            /* translators: %s: error message. */
            throw_anyway(sprintf(__('bKash Payment Error: %s', 'kirki-ecommerce-bkash'), $e->getMessage()), Exception::class, 0, $e);
        }

        return PaymentActionDTO::from_array([
            'type' => PaymentActionType::REDIRECT,
            'value' => $response['bkashURL'],
        ]);
    }

    /**
     * Confirm the payment when bKash sends the customer back, then redirect them.
     *
     * Query runs first, so a stale or forged request cannot use up the single Execute
     * attempt of a payment.
     *
     * @param Request $request
     * @return RedirectResponse|null
     */
    public function handle_return(Request $request): ?RedirectResponse
    {
        $payment_id = (string) $request->text('paymentID');

        if (empty($payment_id)) {
            return redirect(home_url());
        }

        try {
            $payment = $this->get_client()->query_payment($payment_id);
            $order = OrderManager::find_by_uuid((string) ($payment['merchantInvoice'] ?? ''));

            if (!$order) {
                throw_anyway(__('Order Not Found.', 'kirki-ecommerce-bkash'));
            }
        } catch (Exception $e) {
            Log::error(sprintf('bKash return for payment %s has no order: %s', $payment_id, $e->getMessage()));

            return redirect(home_url());
        }

        return redirect($this->confirm_payment($order, $payment_id, (string) $request->text('status'), $payment));
    }

    /**
     * Refund a paid order through bKash.
     *
     * @param Order  $order
     * @param Refund $refund
     * @return bool True when bKash completed the refund.
     * @throws Exception If bKash did not complete the refund. CreateRefundAction ignores the return value, so only an exception stops the local refund.
     */
    public function refund(Order $order, Refund $refund)
    {
        $payment_id = $this->stored_payment_id($order);
        $trx_id = (string) $order->payment_transaction_id;

        if (empty($payment_id) || empty($trx_id)) {
            throw_anyway(__('This order has no bKash payment to refund.', 'kirki-ecommerce-bkash'));
        }

        $amount = static::format_amount($refund->invoiced_amount, $order->currency_code);
        $client = $this->get_client();

        try {
            $response = $client->refund([
                'paymentId' => $payment_id,
                'trxId' => $trx_id,
                'refundAmount' => $amount,
                'sku' => $order->uuid,
                'reason' => mb_substr($refund->reason ?: 'Refund by merchant', 0, BkashConstant::MAX_REASON_LENGTH),
            ]);

            if (($response['refundTransactionStatus'] ?? '') === BkashConstant::TRANSACTION_COMPLETED) {
                return true;
            }
        } catch (BkashRejectedException $e) {
            /* translators: %s: error message. */
            throw_anyway(sprintf(__('bKash Refund Error: %s', 'kirki-ecommerce-bkash'), $e->getMessage()), Exception::class, 0, $e);
        } catch (BkashUnknownResultException $e) {
            Log::warning(sprintf('bKash refund for payment %s has no clear result. Checking Refund Status.', $payment_id));
        }

        return $this->confirm_refund_with_status($order, $refund, $payment_id, $trx_id, $amount);
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
                'name' => 'app_key',
                'label' => __('App Key', 'kirki-ecommerce-bkash'),
                'type' => 'text',
                'required' => true,
            ],
            [
                'name' => 'app_secret',
                'label' => __('App Secret', 'kirki-ecommerce-bkash'),
                'type' => 'password',
                'required' => true,
            ],
            [
                'name' => 'username',
                'label' => __('Username', 'kirki-ecommerce-bkash'),
                'type' => 'text',
                'required' => true,
            ],
            [
                'name' => 'password',
                'label' => __('Password', 'kirki-ecommerce-bkash'),
                'type' => 'password',
                'required' => true,
            ],
            [
                'name' => 'sandbox',
                'label' => __('Sandbox Mode', 'kirki-ecommerce-bkash'),
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
            'app_key' => 'sometimes|string',
            'app_secret' => 'sometimes|string',
            'username' => 'sometimes|string',
            'password' => 'sometimes|string',
            'sandbox' => 'sometimes|boolean',
        ])->validate();

        return true;
    }

    /**
     * Sanitize settings. The secret and the password keep every character, because a
     * text sanitizer removes sequences such as "<a" and changes the credential.
     *
     * @param array $settings
     * @return array
     */
    protected function sanitize_settings(array $settings)
    {
        $parent_settings = parent::sanitize_settings($settings);

        $data = Sanitizer::make($settings, [
            'app_key' => Sanitizer::TEXT,
            'app_secret' => Sanitizer::TRIM,
            'username' => Sanitizer::TEXT,
            'password' => Sanitizer::TRIM,
            'sandbox' => Sanitizer::BOOL,
        ])->get_sanitized_data();

        return array_merge($parent_settings, $data);
    }

    /**
     * Get the bKash API client.
     *
     * @return BkashClient
     * @throws Exception If a credential is missing.
     */
    protected function get_client(): BkashClient
    {
        if ($this->client) {
            return $this->client;
        }

        $app_key = (string) ($this->settings['app_key'] ?? '');
        $app_secret = (string) ($this->settings['app_secret'] ?? '');
        $username = (string) ($this->settings['username'] ?? '');
        $password = (string) ($this->settings['password'] ?? '');
        $sandbox = (bool) ($this->settings['sandbox'] ?? true);

        if (empty($app_key) || empty($app_secret) || empty($username) || empty($password)) {
            throw_anyway(__('bKash credentials are missing.', 'kirki-ecommerce-bkash'));
        }

        return $this->client = new BkashClient($app_key, $app_secret, $username, $password, $sandbox);
    }

    /**
     * Decide the result of a customer return, and get the URL to send the customer to.
     *
     * @param Order                $order      The order that bKash reports for the payment.
     * @param string               $payment_id The payment ID from the return URL.
     * @param string               $status     The status from the return URL. It is not proof of payment.
     * @param array<string, mixed> $payment    The Query Payment response.
     * @return string
     */
    protected function confirm_payment(Order $order, string $payment_id, string $status, array $payment): string
    {
        if ($order->payment_status === PaymentStatus::PAID) {
            return Url::get_checkout_success_url($order->uuid);
        }

        if ($payment_id !== $this->stored_payment_id($order)) {
            Log::warning(sprintf('bKash return for order %d has the stale payment %s.', $order->id, $payment_id));

            return Url::get_checkout_failed_url($order->uuid);
        }

        if ($status !== BkashConstant::CALLBACK_STATUS_SUCCESS) {
            return Url::get_checkout_failed_url($order->uuid);
        }

        if ($this->is_completed($payment)) {
            return $this->settle_order($order, $payment_id, $payment);
        }

        try {
            $executed = $this->get_client()->execute_payment($payment_id);
        } catch (BkashRejectedException $e) {
            if (in_array($e->external_code(), BkashConstant::ALREADY_COMPLETE_CODES, true)) {
                return $this->resolve_with_query($order, $payment_id);
            }

            return $this->fail_order($order, $payment_id, $e);
        } catch (BkashUnknownResultException $e) {
            return $this->resolve_with_query($order, $payment_id);
        }

        return $this->is_completed($executed)
            ? $this->settle_order($order, $payment_id, $executed)
            : $this->resolve_with_query($order, $payment_id);
    }

    /**
     * Resolve an unclear Execute result with Query Payment.
     *
     * When Query does not report Completed, the order stays unpaid and the customer goes
     * to the success page, because the failed page offers another payment and the money
     * may already have moved.
     *
     * @param Order  $order
     * @param string $payment_id
     * @return string
     */
    protected function resolve_with_query(Order $order, string $payment_id): string
    {
        try {
            $payment = $this->get_client()->query_payment($payment_id);

            if ($this->is_completed($payment)) {
                return $this->settle_order($order, $payment_id, $payment);
            }
        } catch (Exception $e) {
            Log::error(sprintf('bKash Query Payment failed for payment %s: %s', $payment_id, $e->getMessage()));
        }

        Log::critical(sprintf('bKash payment %s of order %d has no confirmed result. Check it in the bKash panel.', $payment_id, $order->id));

        return Url::get_checkout_success_url($order->uuid);
    }

    /**
     * Record a completed payment on the order, and mark it paid when it matches the order.
     *
     * @param Order                $order
     * @param string               $payment_id
     * @param array<string, mixed> $payment    The bKash response that reports Completed.
     * @return string The URL to send the customer to.
     */
    protected function settle_order(Order $order, string $payment_id, array $payment): string
    {
        $matches = $this->matches_order($order, $payment);

        DB::begin_transaction();

        try {
            OrderManager::set_payment_metadata($order->id, wp_json_encode($this->stored_payment_data($payment_id, $payment)));

            if ($matches) {
                OrderManager::set_transaction_id($order->id, (string) ($payment['trxId'] ?? ''));
                OrderManager::mark_payment_as_paid($order->id);
            } else {
                OrderManager::mark_as_on_hold($order->id);
            }

            DB::commit();
        } catch (Throwable $e) {
            DB::rollback();

            Log::critical(sprintf('bKash payment %s completed, but order %d did not update: %s', $payment_id, $order->id, $e->getMessage()));

            return Url::get_checkout_success_url($order->uuid);
        }

        if (!$matches) {
            Log::critical(sprintf(
                'bKash payment %s does not match order %d: expected %s %s, received %s %s.',
                $payment_id,
                $order->id,
                static::format_amount($order->invoiced_total, $order->currency_code),
                strtoupper($order->currency_code),
                (string) ($payment['amount'] ?? 'no amount'),
                (string) ($payment['currency'] ?? 'no currency')
            ));

            return Url::get_checkout_failed_url($order->uuid);
        }

        return Url::get_checkout_success_url($order->uuid);
    }

    /**
     * Mark the order payment as failed after bKash rejects Execute.
     *
     * @param Order                  $order
     * @param string                 $payment_id
     * @param BkashRejectedException $rejection
     * @return string The URL to send the customer to.
     */
    protected function fail_order(Order $order, string $payment_id, BkashRejectedException $rejection): string
    {
        Log::warning(sprintf('bKash rejected Execute for payment %s: %s %s', $payment_id, $rejection->external_code(), $rejection->getMessage()));

        OrderManager::mark_payment_as_failed($order->id);

        return Url::get_checkout_failed_url($order->uuid);
    }

    /**
     * Treat a refund with no clear result as complete only when Refund Status proves it.
     *
     * @param Order  $order
     * @param Refund $refund
     * @param string $payment_id
     * @param string $trx_id
     * @param string $amount     The refund amount with two decimal places.
     * @return bool
     * @throws Exception If Refund Status has no new completed refund of this amount.
     */
    protected function confirm_refund_with_status(Order $order, Refund $refund, string $payment_id, string $trx_id, string $amount): bool
    {
        try {
            $status = $this->get_client()->refund_status($payment_id, $trx_id);
        } catch (Exception $e) {
            throw_anyway(__('bKash did not confirm the refund. Check the bKash panel before you try again.', 'kirki-ecommerce-bkash'), Exception::class, 0, $e);
        }

        $completed = 0;

        foreach ((array) ($status['refundTransactions'] ?? []) as $transaction) {
            $is_completed = ($transaction['refundTransactionStatus'] ?? '') === BkashConstant::TRANSACTION_COMPLETED;

            if ($is_completed && $this->to_decimal($transaction['refundAmount'] ?? 0) === $amount) {
                $completed++;
            }
        }

        if ($completed > $this->count_earlier_refunds($order, $refund, $amount)) {
            return true;
        }

        throw_anyway(__('bKash did not complete the refund. You can try again.', 'kirki-ecommerce-bkash'));
    }

    /**
     * Count the refunds of this amount that the order recorded before this refund.
     *
     * @param Order  $order
     * @param Refund $refund
     * @param string $amount The refund amount with two decimal places.
     * @return int
     */
    protected function count_earlier_refunds(Order $order, Refund $refund, string $amount): int
    {
        $count = 0;

        foreach ($order->refunds()->get() as $earlier) {
            $is_same_amount = static::format_amount($earlier->invoiced_amount, $order->currency_code) === $amount;

            if ((int) $earlier->id !== (int) $refund->id && $is_same_amount) {
                $count++;
            }
        }

        return $count;
    }

    /**
     * Determine whether a bKash response reports a completed payment.
     *
     * @param array<string, mixed> $payment
     * @return bool
     */
    protected function is_completed(array $payment): bool
    {
        return ($payment['transactionStatus'] ?? '') === BkashConstant::TRANSACTION_COMPLETED;
    }

    /**
     * Determine whether a bKash response has the order's exact total and currency.
     *
     * @param Order                $order
     * @param array<string, mixed> $payment
     * @return bool
     */
    protected function matches_order(Order $order, array $payment): bool
    {
        $expected = static::format_amount($order->invoiced_total, $order->currency_code);

        return $this->to_decimal($payment['amount'] ?? 0) === $expected
            && strtoupper((string) ($payment['currency'] ?? '')) === strtoupper($order->currency_code);
    }

    /**
     * Format a bKash amount with two decimal places.
     *
     * @param mixed $amount
     * @return string
     */
    protected function to_decimal($amount): string
    {
        return number_format((float) $amount, 2, '.', '');
    }

    /**
     * Get the payment ID that the order stores.
     *
     * @param Order $order
     * @return string
     */
    protected function stored_payment_id(Order $order): string
    {
        $metadata = is_array($order->payment_metadata) ? $order->payment_metadata : [];

        return (string) ($metadata['gateway']['paymentId'] ?? '');
    }

    /**
     * Get the payment fields to store on the order. The wallet number is not one of them.
     *
     * @param string               $payment_id
     * @param array<string, mixed> $payment
     * @return array<string, mixed>
     */
    protected function stored_payment_data(string $payment_id, array $payment): array
    {
        return array_merge(
            array_intersect_key($payment, array_flip(BkashConstant::STORED_PAYMENT_FIELDS)),
            ['paymentId' => $payment_id]
        );
    }
}
