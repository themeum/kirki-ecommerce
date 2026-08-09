<?php

namespace Kirki\Ecommerce\Payments;

use Exception;
use Kirki\Ecommerce\App\Constants\Order\PaymentStatus;
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
    protected $client;
    protected Order $order;

    public function __construct()
    {
        $this->id = 'razorpay';
        $this->title = __('Razorpay', 'kirki-ecommerce');
        $this->description = __('Razorpay payment gateway', 'kirki-ecommerce');
        $this->icon = 'razorpay';
        $this->settings_key = 'razorpay';
        $this->is_offline = false;
        $this->is_available = true;
        $this->has_fields = true;

        parent::__construct();

        $this->set_admin_fields([
            [
                'name' => 'key_id',
                'label' => __('Key ID', 'kirki-ecommerce'),
                'type' => 'text',
                'required' => true,
            ],
            [
                'name' => 'key_secret',
                'label' => __('Key Secret', 'kirki-ecommerce'),
                'type' => 'password',
                'required' => true,
            ],
            [
                'name' => 'webhook_secret',
                'label' => __('Webhook Secret', 'kirki-ecommerce'),
                'type' => 'password',
                'required' => true,
            ],
            [
                'name' => 'sandbox',
                'label' => __('Sandbox Mode', 'kirki-ecommerce'),
                'type' => 'checkbox',
            ],
        ]);
    }

    /**
     * Pay for an order.
     *
     * @param Order $order
     * @return string HTML markup.
     * @throws Exception
     */
    public function pay(Order $order)
    {
        if (!$this->enabled()) {
            throw new Exception(__('Razorpay is not enabled.', 'kirki-ecommerce'));
        }

        try {
            $this->client = $this->get_client();
            $this->order = $order;
            $razorpay_order_id = $this->create_order();
            $checkout_data = [
                'order' => $this->order,
                'success_url' => $this->success_url($this->order),
                'cancel_url' => $this->cancel_url($this->order),
                'razorpay_order_id' => $razorpay_order_id
            ];
            return $this->client->render_redirect_form($checkout_data);
        } catch (Exception $e) {
            throw new Exception(sprintf(__('AuthorizeNet Payment Error: %s', 'kirki-razorpay'), $e->getMessage()));
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
            'key_id' => 'sometimes|string',
            'key_secret' => 'sometimes|string',
            'webhook_secret' => 'sometimes|string',
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
     * Handle an Authorize.Net webhook notification.
     *
     * @return bool True if the notification was processed, false if ignored.
     * @throws Exception If the payload is missing, invalid, or the API lookup fails.
     */
    public function webhook()
    {
        $event = $this->verify_and_parse_notification();

        $allowed_event_types = [
            RazorpayConstant::EVENT_PAYMENT_CAPTURED,
            RazorpayConstant::EVENT_PAYMENT_FAILED
        ];

        if (!in_array($event->event, $allowed_event_types, true)) {
            return false;
        }

        $this->handle_transaction_response($event);
        return true;
    }

    protected function get_client(): RazorpayClient
    {
        if ($this->client) {
            return $this->client;
        }

        $key_id = $this->settings['key_id'] ?? '';
        $key_secret = $this->settings['key_secret'] ?? '';
        $webhook_secret = $this->settings['webhook_secret'] ?? '';

        if (empty($key_id) || empty($key_secret) || empty($webhook_secret)) {
            throw new Exception(__('Razorpay credentials are missing.', 'kirki-razorpay'));
        }

        return new RazorpayClient($key_id, $key_secret, $webhook_secret);
    }

    protected function create_order()
    {
        $razorpay_order = $this->client->post([
            'amount' => $this->order->invoiced_total,
            'currency' => strtoupper($this->order->currency_code)
        ], RazorpayConstant::API_URL . '/orders');

        if (empty($razorpay_order['id'])) {
            throw new Exception(__('Razorpay Payment Order ID Not Found.', 'kirki-razorpay'), $e->getMessage());
        }

        return $razorpay_order['id'];
    }

    protected function verify_and_parse_notification()
    {
        $payload = @file_get_contents('php://input');

        // Respond with a 200 status code to acknowledge the notification.
        http_response_code(200);

        if (empty($payload)) {
            throw new Exception(__('Invalid Payload From Razorpay.', 'kirki-razorpay'));
        }

        $this->client = $this->get_client();
        if (!$this->client->is_verified($payload)) {
            throw new Exception(__('Webhook Notification Is Not Valid.', 'kirki-razorpay'));
        }

        return json_decode($payload);
    }

    protected function handle_transaction_response($payload){
        $entity = $payload->payload->payment->entity;
        $status = $entity->status ?? PaymentStatus::UNPAID;
        $order_id = $entity->notes->order_id;

        DB::begin_transaction();

        try {
            switch ($status) {
                case RazorpayConstant::STATUS_PAYMENT_CAPTURED:
                    OrderManager::set_transaction_id($order_id, $entity->id);
                    OrderManager::mark_payment_as_paid($order_id);
                    OrderManager::mark_as_processing($order_id);
                    OrderManager::set_payment_metadata($order_id, wp_json_encode($entity));
                    OrderManager::set_payment_provider_fee($order_id, $entity->fee);
                    break;
                case PaymentStatus::UNPAID:
                    OrderManager::mark_payment_as_unpaid($order_id);
                    break;
                case RazorpayConstant::STATUS_PAYMENT_FAILED:
                    OrderManager::set_transaction_id($order_id, $entity->id);
                    OrderManager::mark_payment_as_failed($order_id);
                    OrderManager::mark_as_cancelled($order_id);
                    OrderManager::set_payment_metadata($order_id, wp_json_encode($entity));
                    break;
            }

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollback();

            throw new Exception(sprintf(__('Failed to update order data: %s', 'kirki-razorpay'), $e->getMessage()));
        }
    }
}
