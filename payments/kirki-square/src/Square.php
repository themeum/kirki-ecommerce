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
 * Razorpay payment gateway.
 */
class Square extends PaymentProvider
{
    protected ?SquareClient $client = null;
    protected Order $order;

    public function __construct()
    {
        $this->id = 'square';
        $this->title = __('Square', 'kirki-ecommerce-square');
        $this->description = __('Square payment gateway', 'kirki-ecommerce-square');
        $this->icon = $this->icon_url('square');
        $this->settings_key = 'square';
        $this->is_offline = false;
        $this->is_available = true;
        $this->has_fields = true;

        parent::__construct();

        $this->set_admin_fields([
            [
                'name' => 'location_id',
                'label' => __('Location ID', 'kirki-ecommerce-square'),
                'type' => 'dropdown',
                'required' => true,
            ],
            [
                'name' => 'access_token',
                'label' => __('Access Token', 'kirki-ecommerce-square'),
                'type' => 'password',
                'required' => true,
            ],
            [
                'name' => 'signature_key',
                'label' => __('Signature Key', 'kirki-ecommerce-square'),
                'type' => 'password',
                'required' => true,
            ],
            [
                'name' => 'sandbox',
                'label' => __('Sandbox Mode', 'kirki-ecommerce-square'),
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
            throw new Exception(__('Square is not enabled.', 'kirki-ecommerce-square'));
        }

        try {
            $this->client = $this->get_client();

            $payload = [
                'idempotency_key' => SquareConstant::PREFIX . $order->uuid,
                'order' => [
                    'location_id' => $this->settings['location_id'],
                    'reference_id' =>  SquareConstant::PREFIX . $order->id,
                    'line_items' => SquareTransactionBuilder::build_line_items($order),
                    'checkout_options' => [
                        'redirect_url' => Url::get_checkout_success_url($order->uuid)
                    ],
                    'enable_coupon' => false
                ]
            ];

            $response = $this->client->send($payload, 'payment_link_url');

            if (empty($response['payment_link']['long_url'])) {
                throw new Exception(__('Square checkout link not found.', 'kirki-ecommerce-square'));
            }
            return PaymentActionDTO::from_array([
                'type' => PaymentActionType::REDIRECT,
                'value' => $response['payment_link']['long_url'],
            ]);
        } catch (Exception $e) {
            throw new Exception(sprintf(__('Square Payment Error: %s', 'kirki-ecommerce-square'), $e->getMessage()));
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
            'location_id' => 'required|string',
            'access_token' => 'required|string',
            'signature_key' => 'required|string',
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
            'location_id' => Sanitizer::TEXT,
            'access_token' => Sanitizer::TEXT,
            'signature_key' => Sanitizer::TEXT,
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

        // $order_id = $event->payload->payment->entity->notes->order_id ?? null;
        // $order = OrderManager::find($order_id);
        // if ($order->payment_status === PaymentStatus::PAID) {
        //     return false;
        // }

        $this->handle_transaction_response($event);
        return true;
    }

    /**
     * Razorpay API client.
     *
     * @return SquareClient
     * @throws Exception If credentials are missing.
     */
    protected function get_client(): SquareClient
    {
        $location_id = $this->settings['location_id'] ?? '';
        $access_token = $this->settings['access_token'] ?? '';
        $signature_key = $this->settings['signature_key'] ?? '';
        $sandbox = $this->settings['sandbox'] ?? true;

        if (empty($location_id) || empty($access_token) || empty($signature_key)) {
            throw new Exception(__('Square credentials are missing.', 'kirki-ecommerce-square'));
        }

        return new SquareClient($location_id, $access_token, $signature_key, $sandbox);
    }

    /**
     * Read the raw webhook payload, verify its signature, and decode it.
     *
     * @return object
     * @throws Exception If the payload is empty or its signature is invalid.
     */
    protected function verify_and_parse_notification(): object {}

    /**
     * Update the order based on a Razorpay payment event's status.
     *
     * @param object $payload
     * @return void
     * @throws Exception If the order update fails.
     */
    protected function handle_transaction_response(object $payload)
    {
        // $entity   = $payload->payload->payment->entity;
        // $status   = $entity->status ?? PaymentStatus::UNPAID;
        // $order_id = $entity->notes->order_id;

        DB::begin_transaction();

        try {


            DB::commit();
        } catch (\Throwable $e) {
            DB::rollback();

            throw new Exception(
                sprintf(__('Failed to update order data: %s', 'kirki-ecommerce-square'), $e->getMessage())
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
