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
use Kirki\Ecommerce\Framework\Http\Request;
use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Supports\Facades\DB;
use Kirki\Ecommerce\Framework\Validation\Validator;

use function Kirki\Ecommerce\Framework\url;

defined('ABSPATH') || exit;

/**
 * Mollie payment gateway.
 */
class Mollie extends PaymentProvider
{
    /**
     * The Mollie API client instance.
     *
     * @var MollieClient
     */
    protected $client;
    /**
     * Builds transaction payloads for the Mollie API.
     *
     * @var MollieTransactionBuilder
     */
    protected $transaction_builder;
    public function __construct()
    {
        $this->id = 'mollie';
        $this->title = __('Mollie', 'kirki-ecommerce-mollie');
        $this->description = __('Mollie payment gateway', 'kirki-ecommerce-mollie');
        $this->icon = 'mollie';
        $this->settings_key = 'mollie';
        $this->is_offline = false;
        $this->is_available = true;
        $this->has_fields = true;

        parent::__construct();

        $this->set_admin_fields([
            [
                'name' => 'api_key',
                'label' => __('Api key', 'kirki-ecommerce-mollie'),
                'type' => 'password',
                'required' => true,
            ],
            [
                'name' => 'sandbox',
                'label' => __('Sandbox Mode', 'kirki-ecommerce-mollie'),
                'type' => 'checkbox',
            ],
        ]);
    }

    /**
     * Pay for an order.
     *
     * @param Order $order
     * @return PaymentActionDTO returns mollie checkout url.
     * @throws Exception
     */
    public function pay(Order $order)
    {
        if (!$this->enabled()) {
            throw new Exception(__('Mollie is not enabled.', 'kirki-ecommerce-mollie'));
        }

        $this->client = $this->get_client();
        $this->transaction_builder = new MollieTransactionBuilder($order);

        try {
            $response = $this->client->post([
                'description' => 'Order #' . $order->id,
                'amount' => [
                    'currency' => strtoupper($order->currency_code),
                    'value' => $this->format_amount($order->invoiced_total, $order->currency_code),
                ],
                'redirectUrl' => Url::get_checkout_success_url($order->uuid),
                'cancelUrl' => Url::get_checkout_failed_url($order->uuid),
                'webhookUrl' => $this->webhook_url(),
                'lines' => $this->transaction_builder->build_line_items(),
                'billingAddress' => $this->transaction_builder->get_address('billing'),
                'shippingAddress' => $this->transaction_builder->get_address('shipping'),
                'metadata' => ['order_id' => $order->id],
            ], MollieConstant::API_BASE_URL . 'payments');

            if (empty($response['_links']['checkout']['href'])) {
                throw new Exception(__('Mollie checkout link not found.', 'kirki-ecommerce-mollie'));
            }

            return PaymentActionDTO::from_array([
                'type' => PaymentActionType::REDIRECT,
                'value' => $response['_links']['checkout']['href'],
            ]);
        } catch (\Throwable $e) {
            throw new Exception(__('Mollie Payment Error: ' . $e->getMessage(), 'kirki-ecommerce-mollie'));
        }
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
            'api_key' => 'required|string',
            'sandbox' => 'boolean',
        ])->validate();

        return true;
    }

    /**
     * Sanitize settings.
     *
     * @param array $settings
     * @return array
     */
    protected function sanitize_settings(array $settings)
    {
        $parent_settings = parent::sanitize_settings($settings);

        $data = Sanitizer::make($settings, [
            'api_key' => Sanitizer::TEXT,
            'sandbox' => Sanitizer::BOOL,
        ])->get_sanitized_data();

        return array_merge($parent_settings, $data);
    }

    /**
     * Handle Mollie webhook notification.
     *
     * @return bool True if the notification was processed, false if ignored.
     * @throws Exception If the payload is missing, invalid, or the API lookup fails.
     */
    public function webhook()
    {
        $payload = Request::capture();
        $payment_id = $payload->get('id', null, 'string');

        http_response_code(200);

        if (empty($payment_id)) {
            return false;
        }

        try {
            $this->client = $this->get_client();
            $endpoint = url(MollieConstant::API_BASE_URL . 'payments/' . $payment_id);
            $payment = $this->client->get($endpoint);

            $order_id = $payment['metadata']['order_id'] ?? '';
            if (empty($order_id)) {
                return false;
            }

            $order = OrderManager::find($order_id);
            if ($order->payment_status === PaymentStatus::PAID) {
                return false;
            }

            $this->handle_payment_response($payment);
            return true;
        } catch (\Throwable $th) {
            throw new Exception(__('Mollie Webhook Error.', 'kirki-ecommerce-mollie'));
        }
    }

    /**
     * Get the Mollie API client.
     *
     * @return MollieClient
     * @throws Exception If the API key is missing.
     */
    protected function get_client()
    {
        if ($this->client) {
            return $this->client;
        }

        $api_key = $this->settings['api_key'] ?? '';

        if (empty($api_key)) {
            throw new Exception(__('Mollie API Key is missing.', 'kirki-ecommerce-mollie'));
        }

        $is_test_mode = (bool) ($this->settings['sandbox'] ?? false);
        return new MollieClient($api_key, $is_test_mode);
    }

    /**
     * Update the order based on a Mollie payment's status.
     *
     * @param array $payment
     * @return void
     * @throws Exception If the order update fails.
     */
    protected function handle_payment_response($payment)
    {
        $order_id = $payment['metadata']['order_id'] ?? null;

        if (!$order_id) {
            return;
        }

        DB::begin_transaction();

        try {
            switch ($payment) {
                case $this->is_paid($payment):
                    $this->record_transaction($order_id, $payment);
                    OrderManager::mark_payment_as_paid($order_id);
                    break;

                case $this->is_unsuccessful($payment):
                    $this->record_transaction($order_id, $payment);
                    OrderManager::mark_payment_as_failed($order_id);
                    break;

                case $payment['status'] === MollieConstant::PAYMENT_STATUS_PENDING:
                    OrderManager::mark_payment_as_pending($order_id);
                    break;
            }

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollback();

            throw new Exception(
                sprintf(__('Failed to update order data: %s', 'kirki-ecommerce-mollie'), $e->getMessage())
            );
        }
    }

    /**
     * Whether the payment is confirmed as paid.
     *
     * @param array  $payment  The payment response data from the gateway.
     *
     * return bool
     */
    protected function is_paid(array $payment): bool
    {
        return !empty($payment['paidAt'])
            && $payment['status'] === MollieConstant::PAYMENT_STATUS_PAID;
    }

    /**
     * Whether the payment ended in a terminal unsuccessful state.
     *
     * @param array  $payment  The payment response data from the gateway.
     *
     * return bool
     */
    protected function is_unsuccessful(array $payment): bool
    {
        return in_array($payment['status'], [
            MollieConstant::PAYMENT_STATUS_CANCELED,
            MollieConstant::PAYMENT_STATUS_FAILED,
            MollieConstant::PAYMENT_STATUS_EXPIRED,
        ], true);
    }

    /**
     * Store the transaction ID and raw payment payload for an order.
     *
     * @param string $order_id The ID of the order to update.
     * @param array  $payment  The payment response data from the gateway.
     *
     * @return void
     */
    protected function record_transaction(string $order_id, array $payment): void
    {
        OrderManager::set_transaction_id($order_id, $payment['id']);
        OrderManager::set_payment_metadata($order_id, wp_json_encode($payment));
    }
}
