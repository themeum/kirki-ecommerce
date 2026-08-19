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
        $raw_payload = @file_get_contents('php://input');
        $payload = json_decode($raw_payload);

        http_response_code(200);

        $allowed_event_types = [
            KlarnaConstant::STATUS_COMPLETED,
            KlarnaConstant::STATUS_CANCELED,
            KlarnaConstant::STATUS_FAILED
        ];

        if (!in_array($payload->session->status, $allowed_event_types, true)) {
            return false;
        }

        $klarna_order_id = $payload->session->order_id ?? null;

        if (empty($klarna_order_id)) {
            return false;
        }

        $this->client = $this->get_client();

        try {
            $order_details = $this->client->get('order_management_url', $klarna_order_id);
            $order_uuid = $order_details['merchant_reference1'] ?? null;

            if (empty($order_uuid)) {
                throw new Exception(__('Webhook error: Order UUID Not Found.', 'kirki-ecommerce-klarna'));
            }

            $this->order = OrderManager::find_by_uuid($order_uuid);
            if ($this->order->payment_status === PaymentStatus::PAID) {
                return false;
            }

            $this->handle_transaction_response($order_details);
            return true;
        } catch (\Throwable $th) {
            throw new Exception(__('Webhook error: ' . $th->getMessage(), 'kirki-ecommerce-klarna'));
        }

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

    protected function handle_transaction_response(array $payload)
    {
        $status = $payload['status'] ?? PaymentStatus::UNPAID;

        DB::begin_transaction();

        try {
            switch ($status) {
                case KlarnaConstant::ORDER_CAPTURED:
                    $this->record_transaction($payload);
                    OrderManager::mark_payment_as_paid($this->order->id);
                    break;

                case KlarnaConstant::ORDER_EXPIRED:
                case KlarnaConstant::ORDER_CANCELLED:
                case KlarnaConstant::ORDER_CLOSED:
                    $this->record_transaction($payload);
                    OrderManager::mark_payment_as_failed($this->order->id);
                    break;

                default:
                    OrderManager::mark_payment_as_unpaid($this->order->id);
            }

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollback();

            throw new Exception(
                sprintf(__('Failed to update order data: %s', 'kirki-ecommerce-klarna'), $e->getMessage())
            );
        }
    }


    protected function record_transaction(array $payload): void
    {
        OrderManager::set_transaction_id($this->order->id, $payload['klarna_reference']);
        OrderManager::set_payment_metadata($this->order->id, wp_json_encode($payload));
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

        return $this->client->post($payload, 'create_payment_session_id');
    }

    protected function create_hpp_session(string $session_id)
    {
        $payment_session_url =  $this->client->get_base_url() . KlarnaConstant::PAYMENT_SESSION . "/{$session_id}";
        $payload = [
            'merchant_urls' => $this->transactionBuilder->get_merchant_urls($this->webhook_url()),
            'options' => [
                'place_order_mode' => 'CAPTURE_ORDER',
                'purchase_type' => 'BUY',
            ],
            'payment_session_url' => $payment_session_url
        ];

        return $this->client->post($payload, 'hhp_session_url', ['headers' => ['Klarna-Idempotency-Key' => $this->order->uuid]]);
    }
}
