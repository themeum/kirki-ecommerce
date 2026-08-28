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

            return PaymentActionDTO::from_array([
                'type' => PaymentActionType::REDIRECT,
                'value' => '',//$response['payment_link']['long_url'],
            ]);
        } catch (Exception $e) {
            throw new Exception(sprintf(__('PayStack Payment Error: %s', 'kirki-ecommerce-paystack'), $e->getMessage()));
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

    public function webhook()
    {
        $payload = $this->verify_and_parse_notification();

        $allowed_event_types = [
           
        ];

        if (!in_array($payload->type, $allowed_event_types, true)) {
            return false;
        }


        // $order = OrderManager::find_by_uuid($reference_id);

        // if (!$order) {
        //     throw new Exception(__('Square Error: Order Not Found.', 'kirki-ecommerce-square'));
        // }

        // if ($order->payment_status === PaymentStatus::PAID) {
        //     return false;
        // }

        $this->handle_transaction_response($payment, $order);
        return true;
    }

    /**
     * Square API client.
     *
     * @return SquareClient
     * @throws Exception If credentials are missing.
     */
    protected function get_client(): SquareClient
    {
        if ($this->client) {
            return $this->client;
        }

        $location_id = $this->settings['location_id'] ?? '';
        $access_token = $this->settings['access_token'] ?? '';
        $signature_key = $this->settings['signature_key'] ?? '';
        $sandbox = (bool) ($this->settings['sandbox'] ?? true);

        if (empty($location_id) || empty($access_token) || empty($signature_key)) {
            throw new Exception(__('Square credentials are missing.', 'kirki-ecommerce-square'));
        }

        return $this->client = new PaystackClient($location_id, $access_token, $signature_key, $sandbox);
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

        // Respond with a 200 status code to acknowledge the notification.
        http_response_code(200);

        if (empty($payload)) {
            throw new Exception(__('Invalid Payload From Square.', 'kirki-ecommerce-square'));
        }

        if (!$this->get_client()->is_verified($payload, $this->webhook_url())) {
            throw new Exception(__('Webhook Notification Is Not Valid.', 'kirki-ecommerce-square'));
        }

        return json_decode($payload);
    }

    /**
     * Update the order based on a Square payment event's status.
     *
     * @param object $payload The payment object from the Square webhook event.
     * @param Order $order The local order.
     * @return void
     * @throws Exception If the order update fails.
     */
    protected function handle_transaction_response(object $payload, Order $order)
    {
        $status = $payload->status ?? PaymentStatus::UNPAID;

        DB::begin_transaction();

        try {
            switch ($status) {
                case SquareConstant::PAYMENT_COMPLETED:
                    $this->record_transaction($order, $payload);
                    OrderManager::mark_payment_as_paid($order->id);
                    break;

                case SquareConstant::PAYMENT_CANCELED:
                case SquareConstant::PAYMENT_FAILED:
                    $this->record_transaction($order, $payload);
                    OrderManager::mark_payment_as_failed($order->id);
                    break;

                case SquareConstant::PAYMENT_APPROVED:
                case SquareConstant::PAYMENT_PENDING:
                    OrderManager::mark_payment_as_unpaid($order->id);
            }

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollback();

            throw new Exception(
                sprintf(__('Failed to update order data: %s', 'kirki-ecommerce-square'), $e->getMessage())
            );
        }
    }


    /**
     * Record the Square payment ID and raw payment payload against the local order.
     *
     * @param Order $order The local order.
     * @param object $payload The payment object from the Square webhook event.
     * @return void
     */
    protected function record_transaction(Order $order, object $payload): void
    {
        OrderManager::set_transaction_id($order->id, $payload->id);
        OrderManager::set_payment_metadata($order->id, wp_json_encode($payload));
    }
}
