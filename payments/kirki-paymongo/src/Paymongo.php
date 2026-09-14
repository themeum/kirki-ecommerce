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
 * PayMongo payment gateway.
 */
class Paymongo extends PaymentProvider
{
    protected ?PaymongoClient $client = null;

    public function __construct()
    {
        $this->id = 'paymongo';
        $this->title = __('PayMongo', 'kirki-ecommerce-paymongo');
        $this->description = __('PayMongo Payment Gateway', 'kirki-ecommerce-paymongo');
        $this->icon = $this->icon_url('paymongo');
        $this->settings_key = 'paymongo';
        $this->is_offline = false;
        $this->is_available = true;
        $this->has_fields = true;

        parent::__construct();

        $this->set_admin_fields([
            [
                'name' => 'secret_key',
                'label' => __('Secret Key', 'kirki-ecommerce-paymongo'),
                'type' => 'password',
                'required' => true,
            ],
            [
                'name' => 'sandbox',
                'label' => __('Sandbox Mode', 'kirki-ecommerce-paymongo'),
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
            throw new Exception(__('PayMongo is not enabled.', 'kirki-ecommerce-paymongo'));
        }

        try {
            $this->client = $this->get_client();
            $builder = new PaymongoTransactionBuilder($order);
            $payload = $builder->create_checkout_session_payload();
            $response = $this->client->create_checkout_session_url($payload);

            return PaymentActionDTO::from_array([
                'type' => PaymentActionType::REDIRECT,
                'value' => '',//$payment_link['url'],
            ]);
        } catch (Exception $e) {
            throw new Exception(sprintf(__('PayMongo Payment Error: %s', 'kirki-ecommerce-paymongo'), $e->getMessage()));
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
            'secret_key' => 'sometimes|string',
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
            'secret_key' => Sanitizer::TEXT,
            'sandbox' => Sanitizer::BOOL,
        ])->get_sanitized_data();

        return array_merge($parent_settings, $data);
    }

    /**
     * Handle a PayMongo webhook notification.
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
                throw new Exception(__('Webhook error: Order UUID Not Found.', 'kirki-ecommerce-paymongo'));
            }

            $order = OrderManager::find_by_uuid($order_uuid);
            if (!$order) {
                throw new Exception(__('Webhook error: Order Not Found.', 'kirki-ecommerce-paymongo'));
            }

            if ($order->payment_status === PaymentStatus::PAID) {
                return false;
            }

            $this->handle_transaction_response($order, $payload);

            return true;
        } catch (\Throwable $th) {
            throw new Exception(sprintf(__('Webhook error: %s', 'kirki-ecommerce-paymongo'), $th->getMessage()));
        }
    }

    /**
     * PayMongo API client.
     *
     * @return PaymongoClient
     * @throws Exception If credentials are missing.
     */
    protected function get_client(): PaymongoClient
    {
        if ($this->client) {
            return $this->client;
        }

        $secret_key = $this->settings['secret_key'] ?? '';
        $sandbox = (bool) ($this->settings['sandbox'] ?? true);

        if (empty($secret_key)) {
            throw new Exception(__('PayMongo credentials are missing.', 'kirki-ecommerce-paymongo'));
        }

        return new PaymongoClient($secret_key, $sandbox);
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
