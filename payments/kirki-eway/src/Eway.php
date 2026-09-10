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
 * Eway payment gateway.
 */
class Eway extends PaymentProvider
{
    protected ?EwayClient $client = null;

    public function __construct()
    {
        $this->id = 'eway';
        $this->title = __('Eway', 'kirki-ecommerce-eway');
        $this->description = __('Eway Payment Gateway', 'kirki-ecommerce-eway');
        $this->icon = $this->icon_url('eway');
        $this->settings_key = 'eway';
        $this->is_offline = false;
        $this->is_available = true;
        $this->has_fields = true;

        parent::__construct();

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
     * Pay for an order.
     *
     * @param Order $order
     * @return PaymentActionDTO
     * @throws Exception
     */
    public function pay(Order $order)
    {
        if (!$this->enabled()) {
            throw new Exception(__('Eway is not enabled.', 'kirki-ecommerce-eway'));
        }

        try {
            $this->client = $this->get_client();
            $builder = new EwayTransactionBuilder($order);
            $payload = $builder->build_transaction_payload();
            $response = $this->client->create_transaction($payload);

            return PaymentActionDTO::from_array([
                'type' => PaymentActionType::REDIRECT,
                'value' => $response['SharedPaymentUrl'],
            ]);
        } catch (Exception $e) {
            throw new Exception(sprintf(__('Eway Payment Error: %s', 'kirki-ecommerce-eway'), $e->getMessage()));
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
            'api_password' => 'sometimes|string',
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
            'api_password' => Sanitizer::TEXT,
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
                throw new Exception(__('Webhook error: Order UUID Not Found.', 'kirki-ecommerce-eway'));
            }

            $order = OrderManager::find_by_uuid($order_uuid);
            if (!$order) {
                throw new Exception(__('Webhook error: Order Not Found.', 'kirki-ecommerce-eway'));
            }

            if ($order->payment_status === PaymentStatus::PAID) {
                return false;
            }

            $this->handle_transaction_response($order, $payload);

            return true;
        } catch (\Throwable $th) {
            throw new Exception(sprintf(__('Webhook error: %s', 'kirki-ecommerce-eway'), $th->getMessage()));
        }
    }

    /**
     * QuickPay API client.
     *
     * @return EwayClient
     * @throws Exception If credentials are missing.
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
}
