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
 * Razorpay payment gateway.
 */
class Razorpay extends PaymentProvider
{
    protected ?RazorpayClient $client = null;
    protected Order $order;

    public function __construct()
    {
        $this->id = 'razorpay';
        $this->title = __('Razorpay', 'kirki-ecommerce-razorpay');
        $this->description = __('Razorpay payment gateway', 'kirki-ecommerce-razorpay');
        $this->icon = 'razorpay';
        $this->settings_key = 'razorpay';
        $this->is_offline = false;
        $this->is_available = true;
        $this->has_fields = true;

        parent::__construct();

        $this->set_admin_fields([
            [
                'name' => 'key_id',
                'label' => __('Key ID', 'kirki-ecommerce-razorpay'),
                'type' => 'text',
                'required' => true,
            ],
            [
                'name' => 'key_secret',
                'label' => __('Key Secret', 'kirki-ecommerce-razorpay'),
                'type' => 'password',
                'required' => true,
            ],
            [
                'name' => 'webhook_secret',
                'label' => __('Webhook Secret', 'kirki-ecommerce-razorpay'),
                'type' => 'password',
                'required' => true,
            ],
            [
                'name' => 'sandbox',
                'label' => __('Sandbox Mode', 'kirki-ecommerce-razorpay'),
                'type' => 'checkbox',
            ],
        ]);
    }

    /**
     * Pay for an order.
     *
     * @param Order $order
     * @return PaymentActionDTO returns HTML markup
     * @throws Exception
     */
    public function pay(Order $order)
    {
        if (!$this->enabled()) {
            throw new Exception(__('Razorpay is not enabled.', 'kirki-ecommerce-razorpay'));
        }

        try {
            $this->client = $this->get_client();
            $this->order = $order;
            $razorpay_order_id = $this->create_order();

            $html = $this->client->render_checkout_form(
                $this->order,
                $razorpay_order_id
            );

            return PaymentActionDTO::from_array([
                'type' => PaymentActionType::HTML,
                'value' => $html,
            ]);
        } catch (Exception $e) {
            throw new Exception(sprintf(__('Razorpay Payment Error: %s', 'kirki-ecommerce-razorpay'), $e->getMessage()));
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
            'key_id' => 'required|string',
            'key_secret' => 'required|string',
            'webhook_secret' => 'required|string',
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
            'key_id' => Sanitizer::TEXT,
            'key_secret' => Sanitizer::TEXT,
            'webhook_secret' => Sanitizer::TEXT,
            'sandbox' => Sanitizer::BOOL,
        ])->get_sanitized_data();

        return array_merge($parent_settings, $data);
    }

    /**
     * Handle a Razorpay webhook notification.
     *
     * @return bool True if the notification was processed, false if ignored.
     * @throws Exception If the payload is missing, invalid, or the API lookup fails.
     */
    public function webhook()
    {
        $this->client = $this->get_client();
        $event = $this->verify_and_parse_notification();

        $allowed_event_types = [
            RazorpayConstant::EVENT_PAYMENT_CAPTURED,
            RazorpayConstant::EVENT_PAYMENT_FAILED
        ];

        if (!in_array($event->event, $allowed_event_types, true)) {
            return false;
        }

        $order_id = $event->payload->payment->entity->notes->order_id ?? null;
        $order = OrderManager::find($order_id);
        if ($order->payment_status === PaymentStatus::PAID) {
            return false;
        }

        $this->handle_transaction_response($event);
        return true;
    }

    /**
     * Razorpay API client.
     *
     * @return RazorpayClient
     * @throws Exception If credentials are missing.
     */
    protected function get_client(): RazorpayClient
    {
        if ($this->client) {
            return $this->client;
        }

        $key_id = $this->settings['key_id'] ?? '';
        $key_secret = $this->settings['key_secret'] ?? '';
        $webhook_secret = $this->settings['webhook_secret'] ?? '';

        if (empty($key_id) || empty($key_secret) || empty($webhook_secret)) {
            throw new Exception(__('Razorpay credentials are missing.', 'kirki-ecommerce-razorpay'));
        }

        return new RazorpayClient($key_id, $key_secret, $webhook_secret);
    }

    /**
     * Create a Razorpay order for the current order and return its ID.
     *
     * @return string
     * @throws Exception If Razorpay doesn't return an order ID.
     */
    protected function create_order(): string
    {
        $razorpay_order = $this->client->post([
            'amount' => $this->order->invoiced_total,
            'currency' => strtoupper($this->order->currency_code)
        ], RazorpayConstant::API_URL . '/orders');

        if (empty($razorpay_order['id'])) {
            throw new Exception(__('Razorpay Payment Order ID Not Found.', 'kirki-ecommerce-razorpay'));
        }

        return $razorpay_order['id'];
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
            throw new Exception(__('Invalid Payload From Razorpay.', 'kirki-ecommerce-razorpay'));
        }

        if (!$this->client->is_verified($payload)) {
            throw new Exception(__('Webhook Notification Is Not Valid.', 'kirki-ecommerce-razorpay'));
        }

        return json_decode($payload);
    }

    /**
     * Update the order based on a Razorpay payment event's status.
     *
     * @param object $payload
     * @return void
     * @throws Exception If the order update fails.
     */
    protected function handle_transaction_response(object $payload)
    {
        $entity   = $payload->payload->payment->entity;
        $status   = $entity->status ?? PaymentStatus::UNPAID;
        $order_id = $entity->notes->order_id;

        DB::begin_transaction();

        try {
            switch ($status) {
                case RazorpayConstant::STATUS_PAYMENT_CAPTURED:
                    $this->record_transaction($order_id, $entity);
                    OrderManager::mark_payment_as_paid($order_id);
                    OrderManager::set_payment_provider_fee($order_id, $entity->fee);
                    break;

                case RazorpayConstant::STATUS_PAYMENT_FAILED:
                    $this->record_transaction($order_id, $entity);
                    OrderManager::mark_payment_as_failed($order_id);
                    break;

                default:
                    OrderManager::mark_payment_as_unpaid($order_id);
            }

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollback();

            throw new Exception(
                sprintf(__('Failed to update order data: %s', 'kirki-ecommerce-razorpay'), $e->getMessage())
            );
        }
    }

    /**
     * Store the transaction ID and raw payment payload for an order.
     *
     * @param string $order_id
     * @param object $entity
     * @return void
     */
    protected function record_transaction(string $order_id, object $entity): void
    {
        OrderManager::set_transaction_id($order_id, $entity->id);
        OrderManager::set_payment_metadata($order_id, wp_json_encode($entity));
    }
}
