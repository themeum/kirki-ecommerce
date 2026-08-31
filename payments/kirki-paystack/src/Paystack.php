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
 * Paystack payment gateway.
 */
class Paystack extends PaymentProvider
{
    protected ?PaystackClient $client = null;

    public function __construct()
    {
        $this->id = 'paystack';
        $this->title = __('PayStack', 'kirki-ecommerce-paystack');
        $this->description = __('PayStack payment gateway', 'kirki-ecommerce-paystack');
        $this->icon = $this->icon_url('paystack');
        $this->settings_key = 'paystack';
        $this->is_offline = false;
        $this->is_available = true;
        $this->has_fields = true;

        parent::__construct();

        $this->set_admin_fields([
            [
                'name' => 'secret_key',
                'label' => __('Secret Key', 'kirki-ecommerce-paystack'),
                'type' => 'password',
                'required' => true,
            ],
            [
                'name' => 'sandbox',
                'label' => __('Sandbox Mode', 'kirki-ecommerce-paystack'),
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
            throw new Exception(__('PayStack is not enabled.', 'kirki-ecommerce-paystack'));
        }

        try {
            $this->client = $this->get_client();
            $builder = new PaystackTransactionBuilder($order);

            $payload = $builder->build_transaction_payload();

            $response = $this->client->initialize_transaction($payload);

            if (empty($response['data']['authorization_url'])) {
                throw new Exception(__('PayStack checkout link not found.', 'kirki-ecommerce-paystack'));
            }

            return PaymentActionDTO::from_array([
                'type' => PaymentActionType::REDIRECT,
                'value' => $response['data']['authorization_url'],
            ]);
        } catch (Exception $e) {
            throw new Exception(sprintf(__('PayStack Payment Error: %s', 'kirki-ecommerce-paystack'), $e->getMessage()), 0, $e);
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
            'secret_key' => 'required|string',
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
     * Handle a PayStack webhook notification.
     *
     * @return bool True if the notification was processed, false if ignored.
     * @throws Exception If the payload is invalid, the order isn't found, or the API lookup fails.
     */
    public function webhook()
    {
        $payload = $this->verify_and_parse_notification();

        if ($payload->event !== PaystackConstant::EVENT_CHARGE_SUCCESS) {
            return false;
        }

        $reference_id = $payload->data->reference ?? '';
        $order = OrderManager::find_by_uuid($reference_id);

        if (!$order) {
            throw new Exception(__('PayStack Error: Order Not Found.', 'kirki-ecommerce-paystack'));
        }

        if ($order->payment_status === PaymentStatus::PAID) {
            return false;
        }

        try {
            $response = $this->client->verify_transaction($reference_id);
        } catch (\Throwable $e) {
            throw new Exception(sprintf(__('PayStack Payment Error: %s', 'kirki-ecommerce-paystack'), $e->getMessage()), 0, $e);
        }

        $this->handle_transaction_response($response['data'], $order);
        return true;
    }

    /**
     * PayStack API client.
     *
     * @return PaystackClient
     * @throws Exception If credentials are missing.
     */
    protected function get_client(): PaystackClient
    {
        if ($this->client) {
            return $this->client;
        }

        $secret_key = $this->settings['secret_key'] ?? '';
        $sandbox = (bool) ($this->settings['sandbox'] ?? true);

        if (empty($secret_key)) {
            throw new Exception(__('PayStack credentials are missing.', 'kirki-ecommerce-paystack'));
        }

        return $this->client = new PaystackClient($secret_key, $sandbox);
    }

    /**
     * Read the raw webhook payload, verify its signature, and decode it.
     *
     * @return object
     * @throws Exception If the payload is empty or its signature is invalid.
     */
    protected function verify_and_parse_notification(): object
    {
        $payload = file_get_contents('php://input');
        $this->client = $this->get_client();

        if (!$this->client->is_verified($payload)) {
            throw new Exception(__('Webhook Notification Is Not Valid.', 'kirki-ecommerce-paystack'));
        }

        // Respond with a 200 status code to acknowledge the notification.
        http_response_code(200);

        return json_decode($payload);
    }

    /**
     * Update the order based on a PayStack payment event's status.
     *
     * @param array $payload The transaction data from the PayStack webhook event.
     * @param Order $order The local order.
     * @return void
     * @throws Exception If the order update fails.
     */
    protected function handle_transaction_response(array $payload, Order $order)
    {
        $status = PaystackConstant::STATUS_MAP[$payload['status']] ?? PaymentStatus::UNPAID;

        DB::begin_transaction();

        try {
            switch ($status) {
                case PaymentStatus::PAID:
                    $this->record_transaction($order, $payload);
                    OrderManager::mark_payment_as_paid($order->id);
                    OrderManager::set_payment_provider_fee($order->id, $payload['fees']);
                    break;

                case PaymentStatus::FAILED:
                    $this->record_transaction($order, $payload);
                    OrderManager::mark_payment_as_failed($order->id);
                    break;

                case PaymentStatus::UNPAID:
                    OrderManager::mark_payment_as_unpaid($order->id);
            }

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollback();

            throw new Exception(
                sprintf(__('Failed to update order data: %s', 'kirki-ecommerce-paystack'), $e->getMessage()),
                0,
                $e
            );
        }
    }


    /**
     * Record the PayStack transaction ID and raw payload against the local order.
     *
     * @param Order $order The local order.
     * @param array $payload The transaction data from the PayStack webhook event.
     * @return void
     */
    protected function record_transaction(Order $order, array $payload): void
    {
        OrderManager::set_transaction_id($order->id, $payload['id']);
        OrderManager::set_payment_metadata($order->id, wp_json_encode($payload));
    }
}
