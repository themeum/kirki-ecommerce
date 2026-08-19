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
 * Klarna payment gateway.
 */
class Klarna extends PaymentProvider
{
    protected ?KlarnaClient $client = null;
    protected Order $order;
    protected KlarnaTransactionBuilder $transactionBuilder;

    public function __construct()
    {
        $this->id = 'klarna';
        $this->title = __('Klarna', 'kirki-ecommerce-klarna');
        $this->description = __('Klarna Payment Gateway', 'kirki-ecommerce-klarna');
        $this->icon = $this->icon_url('square');
        $this->settings_key = 'klarna';
        $this->is_offline = false;
        $this->is_available = true;
        $this->has_fields = true;

        parent::__construct();

        $this->set_admin_fields([
            [
                'name' => 'username',
                'label' => __('User Name', 'kirki-ecommerce-square'),
                'type' => 'text',
                'required' => true,
            ],
            [
                'name' => 'password',
                'label' => __('Password', 'kirki-ecommerce-square'),
                'type' => 'password',
                'required' => true,
            ],
            [
                'name' => 'region',
                'label' => __('Region', 'kirki-ecommerce-square'),
                'type' => 'select',
                'required' => true,
                'options' => [
                    ['label' => __('Europe', 'kirki-ecommerce-klarna'), 'value' => 'eu'],
                    ['label' => __('North America', 'kirki-ecommerce-klarna'), 'value' => 'na'],
                    ['label' => __('Oceania', 'kirki-ecommerce-klarna'), 'value' => 'oc'],
                ],
            ],
            [
                'name' => 'sandbox',
                'label' => __('Sandbox Mode', 'kirki-ecommerce-klarna'),
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
            throw new Exception(__('Klarna is not enabled.', 'kirki-ecommerce-square'));
        }

        try {
            $this->order = $order;
            $this->client = $this->get_client();
            $this->transactionBuilder = new KlarnaTransactionBuilder($this->order);

            $payment_session = $this->create_payment_session();
            if (empty($payment_session['session_id'])) {
                throw new Exception(__('Klarna Payment Error: Payment Session ID not found.', 'kirki-ecommerce-klarna'));
            }

            $response = $this->create_hpp_session($payment_session['session_id']);

            if (!empty($response['redirect_url'])) {
                return PaymentActionDTO::from_array([
                    'type' => PaymentActionType::REDIRECT,
                    'value' => $response['redirect_url'],
                ]);
            }

            throw new Exception(__('Klarna Payment Error: Redirect URl not found.', 'kirki-ecommerce-klarna'));
        } catch (Exception $e) {
            throw new Exception(sprintf(__('Klarna Payment Error: %s', 'kirki-ecommerce-klarna'), $e->getMessage()));
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
            'username' => 'required|string',
            'password' => 'required|string',
            'region' => 'required|string',
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
            'username' => Sanitizer::TEXT,
            'password' => Sanitizer::TEXT,
            'region' => Sanitizer::TEXT,
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
     * @return KlarnaClient
     * @throws Exception If credentials are missing.
     */
    protected function get_client(): KlarnaClient
    {
        $username = $this->settings['username'] ?? '';
        $password = $this->settings['password'] ?? '';
        $region = $this->settings['region'] ?? '';
        $sandbox = $this->settings['sandbox'] ?? true;

        if (empty($username) || empty($password) || empty($region)) {
            throw new Exception(__('Square credentials are missing.', 'kirki-ecommerce-square'));
        }

        return new KlarnaClient($username, $password, $region, $sandbox);
    }

    /**
     * Read the raw webhook payload, verify its signature, and decode it.
     *
     * @return object
     * @throws Exception If the payload is empty or its signature is invalid.
     */
    protected function verify_and_parse_notification(): object {}

    /**
     * Update the order based on a Klarna payment event's status.
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

    protected function create_payment_session()
    {
        $payload = [
            'billing_address' => $this->transactionBuilder->format_address('billing'),
            'merchant_reference1' => $this->order->uuid,
            'order_amount' => $this->order->invoiced_total,
            'order_lines' => $this->transactionBuilder->get_line_items(),
            'order_tax_amount' => (int) $this->order->invoiced_tax_total,
            'purchase_country' => $this->order->billing_country,
            'purchase_currency' => $this->order->currency_code,
            'shipping_address' =>  $this->transactionBuilder->format_address('shipping'),
            'intent' => 'buy'
        ];

        return $this->client->send($payload, 'create_payment_session_id');
    }

    protected function create_hpp_session($session_id)
    {
        $payment_session_url =  $this->client->get_base_url() . KlarnaConstant::PAYMENT_SESSION . "/{$session_id}";
        $payload = [
            'merchant_urls' => $this->transactionBuilder->get_merchant_urls($this->webhook_url()),
            'options' => [
                'place_order_mode' => 'CAPTURE_ORDER',
                'purchase_type' => 'BUY'
            ],
            'payment_session_url' => $payment_session_url
        ];

        return $this->client->send($payload, 'hhp_session_url');
    }
}
