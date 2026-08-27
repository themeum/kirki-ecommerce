<?php

namespace Kirki\Ecommerce\Payments;

use Exception;
use Kirki\Ecommerce\App\Constants\Order\PaymentStatus;
use Kirki\Ecommerce\App\Constants\Payment\PaymentActionType;
use Kirki\Ecommerce\App\DTO\Payment\PaymentActionDTO;
use Kirki\Ecommerce\App\Facades\Order as OrderManager;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Payment\PaymentProvider;
use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Supports\Facades\DB;
use Kirki\Ecommerce\Framework\Validation\Validator;

defined('ABSPATH') || exit;

/**
 * Quickpay payment gateway.
 */
class Quickpay extends PaymentProvider
{
    protected ?QuickpayClient $client = null;

    public function __construct()
    {
        $this->id = 'quickpay';
        $this->title = __('QuickPay', 'kirki-ecommerce-quickpay');
        $this->description = __('QuickPay Payment Gateway', 'kirki-ecommerce-quickpay');
        $this->icon = $this->icon_url('quickpay');
        $this->settings_key = 'quickpay';
        $this->is_offline = false;
        $this->is_available = true;
        $this->has_fields = true;

        parent::__construct();

        $this->set_admin_fields([
            [
                'name' => 'api_key',
                'label' => __('API Key', 'kirki-ecommerce-quickpay'),
                'type' => 'text',
                'required' => true,
            ],
            [
                'name' => 'private_key',
                'label' => __('Private Key', 'kirki-ecommerce-quickpay'),
                'type' => 'password',
                'required' => true,
            ],
            [
                'name' => 'sandbox',
                'label' => __('Sandbox Mode', 'kirki-ecommerce-quickpay'),
                'type' => 'checkbox',
            ],
        ]);
    }

    /**
     * Pay for an order.
     *
     * @param Order $order
     * @return PaymentActionDTO
     * @throws Exception
     */
    public function pay(Order $order)
    {
        if (!$this->enabled()) {
            throw new Exception(__('QuickPay is not enabled.', 'kirki-ecommerce-quickpay'));
        }

        try {
            $this->client = $this->get_client();

            $builder = new QuickpayTransactionBuilder($order);
            $payment_response = $this->client->create_payment($builder->create_payment_payload());

            if (empty($payment_response['id'])) {
                throw new Exception(__('QuickPay Payment ID Not Found.', 'kirki-ecommerce-quickpay'));
            }

            $payment_link = $this->client->create_payment_link($builder->create_payment_link_payload($this->webhook_url()), $payment_response['id']);

            if (empty($payment_link['url'])) {
                throw new Exception(__('QuickPay Payment Link Not Found.', 'kirki-ecommerce-quickpay'));
            }

            return PaymentActionDTO::from_array([
                'type' => PaymentActionType::REDIRECT,
                'value' => $payment_link['url'],
            ]);
        } catch (Exception $e) {
            throw new Exception(sprintf(__('QuickPay Payment Error: %s', 'kirki-ecommerce-quickpay'), $e->getMessage()));
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
            'api_key' => 'sometimes|string',
            'private_key' => 'sometimes|string',
            'sandbox' => 'sometimes|boolean',
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
            'private_key' => Sanitizer::TEXT,
            'sandbox' => Sanitizer::BOOL,
        ])->get_sanitized_data();

        return array_merge($parent_settings, $data);
    }

    /**
     * Handle a QuickPay webhook notification.
     *
     * @return bool True if the notification was processed, false if ignored.
     * @throws Exception If the payload is missing, invalid, or the API lookup fails.
     */
    public function webhook()
    {
        $payload = $this->verify_and_parse_notification();

        http_response_code(200);

        try {
            $order_uuid = $payload->variables->order_uuid ?? '';
            if (!$order_uuid) {
                throw new Exception(__('Webhook error: Order UUID Not Found.', 'kirki-ecommerce-quickpay'));
            }

            $order = OrderManager::find_by_uuid($order_uuid);
            if (!$order) {
                throw new Exception(__('Webhook error: Order Not Found.', 'kirki-ecommerce-quickpay'));
            }

            if ($order->payment_status === PaymentStatus::PAID) {
                return false;
            }

            $this->handle_transaction_response($order, $payload);

            return true;
        } catch (\Throwable $th) {
            throw new Exception(sprintf(__('Webhook error: %s', 'kirki-ecommerce-quickpay'), $th->getMessage()));
        }
    }

    /**
     * QuickPay API client.
     *
     * @return QuickpayClient
     * @throws Exception If credentials are missing.
     */
    protected function get_client(): QuickpayClient
    {
        if ($this->client) {
            return $this->client;
        }

        $api_key = $this->settings['api_key'] ?? '';
        $private_key = $this->settings['private_key'] ?? '';
        $sandbox = (bool) ($this->settings['sandbox'] ?? true);

        if (empty($api_key) || empty($private_key)) {
            throw new Exception(__('QuickPay credentials are missing.', 'kirki-ecommerce-quickpay'));
        }

        return new QuickpayClient($api_key, $private_key, $sandbox);
    }

    /**
     * Apply an order's status, from QuickPay's Order Management API, to the local order.
     *
     * @param Order $order The local order.
     * @param object $payload The payment data returned by QuickPay.
     * @return void
     * @throws Exception If the order update fails.
     */
    protected function handle_transaction_response(Order $order, object $payload): void
    {
        if (empty($payload->operations)) {
            throw new Exception(__('QuickPay payload data not found.', 'kirki-ecommerce-quickpay'));
        }

        $operation = end($payload->operations);

        if (QuickpayConstant::PAYMENT_CAPTURE !== $operation->type) {
            return;
        }

        $status = $this->get_status($operation);

        DB::begin_transaction();

        try {
            switch ($status) {
                case PaymentStatus::PAID:
                    $this->record_transaction($order, $payload);
                    OrderManager::mark_payment_as_paid($order->id);
                    if (!empty($payload->fee)) {
                        OrderManager::set_payment_provider_fee($order->id, $payload->fee);
                    }
                    break;

                case PaymentStatus::FAILED:
                    $this->record_transaction($order, $payload);
                    OrderManager::mark_payment_as_failed($order->id);
                    break;

                default:
                    OrderManager::mark_payment_as_unpaid($order->id);
            }

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollback();

            throw new Exception(
                sprintf(__('Failed to update order data: %s', 'kirki-ecommerce-quickpay'), $e->getMessage())
            );
        }
    }

    protected function record_transaction(Order $order, object $payload): void
    {
        OrderManager::set_transaction_id($order->id, $payload->id);
        OrderManager::set_payment_metadata($order->id, wp_json_encode($payload));
    }

    /**
     * Read the raw webhook payload, verify its checksum, and decode it.
     *
     * @return object
     * @throws Exception If the payload is missing or its checksum is invalid.
     */
    protected function verify_and_parse_notification()
    {
        $raw_payload = file_get_contents('php://input');
        $this->client = $this->get_client();

        // Respond with a 200 status code to acknowledge the notification.
        http_response_code(200);

        if (empty($raw_payload) || ! $this->client->is_verified($raw_payload)) {
            throw new Exception(__('Invalid Payload From QuickPay.', 'kirki-ecommerce-quickpay'));
        }

        return json_decode($raw_payload);
    }

    /**
     * Map a QuickPay capture operation to a local payment status.
     *
     * @param object $operation A capture entry from the webhook payload's operations array.
     * @return string One of PaymentStatus::PAID, ::FAILED or ::UNPAID.
     */
    protected function get_status(object $operation): string
    {
        if ($operation->pending) {
            return PaymentStatus::UNPAID;
        }

        $status_code = (int) $operation->aq_status_code;

        if (20000 === $status_code) {
            return PaymentStatus::PAID;
        }

        if (40000 >= $status_code) {
            return PaymentStatus::FAILED;
        }

        return PaymentStatus::UNPAID;
    }
}
