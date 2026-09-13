<?php

namespace Kirki\Ecommerce\Payments;

use Exception;
use Kirki\Ecommerce\App\Constants\Order\PaymentStatus;
use Kirki\Ecommerce\App\Constants\Payment\PaymentActionType;
use Kirki\Ecommerce\App\DTO\Payment\PaymentActionDTO;
use Kirki\Ecommerce\App\Facades\Order as OrderManager;
use Kirki\Ecommerce\App\Models\Order;
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

defined('ABSPATH') || exit;

/**
 * Eway payment gateway, using Eway's Responsive Shared Page.
 */
class Eway extends PaymentProvider
{
    protected ?EwayClient $client = null;

    public function __construct()
    {
        $this->id = 'eway';
        $this->settings_key = 'eway';
        $this->title = __('Eway', 'kirki-ecommerce-eway');
        $this->description = __('Eway Payment Gateway', 'kirki-ecommerce-eway');
        $this->icon = $this->icon_url('eway');
        $this->is_offline = false;
        $this->is_available = true;
        $this->has_fields = true;

        parent::__construct();
    }

    /**
     * Create an Eway shared payment page and send the customer to it.
     *
     * @param Order $order
     * @return PaymentActionDTO
     * @throws Exception If Eway is disabled or rejects the request.
     */
    public function pay(Order $order)
    {
        if (!$this->enabled()) {
            throw new Exception(__('Eway is not enabled.', 'kirki-ecommerce-eway'));
        }

        try {
            $payload = (new EwayTransactionBuilder($order))->build_transaction_payload($this->webhook_url());
            $response = $this->get_client()->create_shared_access_code($payload);

            if (!empty($response['Errors'])) {
                throw new Exception(EwayResponseCode::describe($response['Errors']));
            }
        } catch (Exception $e) {
            /* translators: %s: error message. */
            throw new Exception(sprintf(__('Eway Payment Error: %s', 'kirki-ecommerce-eway'), $e->getMessage()));
        }

        return PaymentActionDTO::from_array([
            'type' => PaymentActionType::REDIRECT,
            'value' => $response['SharedPaymentUrl'],
        ]);
    }

    /**
     * Webhook handler.
     *
     * @return bool|WebhookResult
     */
    public function webhook()
    {
        return true;
    }

    /**
     * Confirm the payment when Eway sends the customer back, then redirect them.
     *
     * @param Request $request
     * @return RedirectResponse|null
     */
    public function handle_return(Request $request): ?RedirectResponse
    {
        try {
            $transaction = $this->confirm_transaction($request);
        } catch (Throwable $e) {
            Log::critical($e->getMessage());

            return redirect(home_url());
        }

        $order_uuid = (string) $transaction['InvoiceReference'];

        return redirect(
            $this->is_approved($transaction)
                ? Url::get_checkout_success_url($order_uuid)
                : Url::get_checkout_failed_url($order_uuid)
        );
    }

    protected function init_admin_fields()
    {
        $this->set_admin_fields([
            [
                'name' => 'api_key',
                'label' => __('API Key', 'kirki-ecommerce-eway'),
                'type' => 'text',
                'required' => true,
            ],
            [
                'name' => 'api_password',
                'label' => __('API Password', 'kirki-ecommerce-eway'),
                'type' => 'password',
                'required' => true,
            ],
            [
                'name' => 'sandbox',
                'label' => __('Sandbox Mode', 'kirki-ecommerce-eway'),
                'type' => 'checkbox',
            ],
        ]);
    }

    /**
     * @param array $settings
     * @return bool
     */
    protected function validate_settings(array $settings)
    {
        parent::validate_settings($settings);

        Validator::make($settings, [
            'api_key' => 'sometimes|string',
            'api_password' => 'sometimes|string',
            'sandbox' => 'sometimes|boolean',
        ])->validate();

        return true;
    }

    /**
     * @param array $settings
     * @return array
     */
    protected function sanitize_settings(array $settings)
    {
        $parent_settings = parent::sanitize_settings($settings);

        $data = Sanitizer::make($settings, [
            'api_key' => Sanitizer::TEXT,
            'api_password' => Sanitizer::TEXT,
            'sandbox' => Sanitizer::BOOL,
        ])->get_sanitized_data();

        return array_merge($parent_settings, $data);
    }

    /**
     * @throws \InvalidArgumentException If the API credentials are not configured.
     */
    protected function get_client(): EwayClient
    {
        if ($this->client) {
            return $this->client;
        }

        $api_key = $this->settings['api_key'] ?? '';
        $api_password = $this->settings['api_password'] ?? '';
        $sandbox = (bool) ($this->settings['sandbox'] ?? true);

        if (empty($api_key) || empty($api_password)) {
            throw new Exception(__('Eway credentials are missing.', 'kirki-ecommerce-eway'));
        }

        return new EwayClient($api_key, $api_password, $sandbox);
    }

    /**
     * Look up the transaction for the request's access code and settle its order.
     *
     * An order that is already paid is left untouched.
     *
     * @param Request $request
     * @return array The Eway transaction record.
     * @throws Exception If the access code is missing, the lookup fails, or the order is not found.
     */
    protected function confirm_transaction(Request $request): array
    {
        $access_code = (string) $request->text('AccessCode');

        if (empty($access_code)) {
            throw new Exception(__('Invalid Payload Access Code.', 'kirki-ecommerce-eway'));
        }

        $response = $this->get_client()->get_transaction($access_code);
        $transaction = $response['Transactions'][0] ?? [];

        if (!empty($response['Errors'])) {
            Log::critical(EwayResponseCode::describe($response['Errors']));
        }

        $order = OrderManager::find_by_uuid((string) ($transaction['InvoiceReference'] ?? ''));

        if (!$order) {
            throw new Exception(__('Order Not Found.', 'kirki-ecommerce-eway'));
        }

        if ($order->payment_status !== PaymentStatus::PAID) {
            $this->settle_order($order, $transaction, $response);
        }

        return $transaction;
    }

    /**
     * Record the transaction on the order and mark its payment paid or failed.
     *
     * @param Order $order
     * @param array $transaction The Eway transaction record.
     * @param array $response    The full Eway response, stored as payment metadata.
     * @return void
     * @throws Exception If the order update fails; all changes are rolled back.
     */
    protected function settle_order(Order $order, array $transaction, array $response): void
    {
        DB::begin_transaction();

        try {
            OrderManager::set_transaction_id($order->id, (string) ($transaction['TransactionID'] ?? ''));
            OrderManager::set_payment_metadata($order->id, wp_json_encode($response));

            if ($this->is_approved($transaction)) {
                OrderManager::mark_payment_as_paid($order->id);
            } else {
                OrderManager::mark_payment_as_failed($order->id);
            }

            DB::commit();
        } catch (Throwable $e) {
            DB::rollback();

            /* translators: %s: error message. */
            throw new Exception(sprintf(__('Failed to update order data: %s', 'kirki-ecommerce-eway'), $e->getMessage()));
        }
    }

    /**
     * Determine whether a completed Eway transaction was approved.
     *
     * @param array $transaction The decoded Eway transaction result.
     * @return bool True if the payment was approved.
     */
    protected function is_approved(array $transaction): bool
    {
        return !empty($transaction['TransactionStatus']);
    }
}
