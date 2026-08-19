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
 * Klarna payment gateway.
 */
class Klarna extends PaymentProvider
{
    protected ?KlarnaClient $client = null;

    public function __construct()
    {
        $this->id = 'klarna';
        $this->title = __('Klarna', 'kirki-ecommerce-klarna');
        $this->description = __('Klarna Payment Gateway', 'kirki-ecommerce-klarna');
        $this->icon = $this->icon_url('klarna');
        $this->settings_key = 'klarna';
        $this->is_offline = false;
        $this->is_available = true;
        $this->has_fields = true;

        parent::__construct();

        $this->set_admin_fields([
            [
                'name' => 'username',
                'label' => __('User Name', 'kirki-ecommerce-klarna'),
                'type' => 'text',
                'required' => true,
            ],
            [
                'name' => 'password',
                'label' => __('Password', 'kirki-ecommerce-klarna'),
                'type' => 'password',
                'required' => true,
            ],
            [
                'name' => 'region',
                'label' => __('Region', 'kirki-ecommerce-klarna'),
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
     * @return PaymentActionDTO
     * @throws Exception
     */
    public function pay(Order $order)
    {
        if (!$this->enabled()) {
            throw new Exception(__('Klarna is not enabled.', 'kirki-ecommerce-klarna'));
        }

        try {
            $payment_session = $this->create_payment_session($order);

            if (empty($payment_session['session_id'])) {
                throw new Exception(__('Klarna Payment Error: Payment Session ID not found.', 'kirki-ecommerce-klarna'));
            }

            $response = $this->create_hpp_session($order, $payment_session['session_id']);

            if (empty($response['redirect_url'])) {
                throw new Exception(__('Klarna Payment Error: Redirect URL not found.', 'kirki-ecommerce-klarna'));
            }

            return PaymentActionDTO::from_array([
                'type' => PaymentActionType::REDIRECT,
                'value' => $response['redirect_url'],
            ]);
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
     * Handle a Klarna webhook notification.
     *
     * @return bool True if the notification was processed, false if ignored.
     * @throws Exception If the payload is missing, invalid, or the API lookup fails.
     */
    public function webhook()
    {
        $payload = json_decode(@file_get_contents('php://input'));

        http_response_code(200);

        $allowed_event_types = [
            KlarnaConstant::STATUS_COMPLETED,
            KlarnaConstant::STATUS_CANCELED,
            KlarnaConstant::STATUS_FAILED
        ];

        if (empty($payload->session->status) || !in_array($payload->session->status, $allowed_event_types, true)) {
            return false;
        }

        $klarna_order_id = $payload->session->order_id ?? null;

        if (empty($klarna_order_id)) {
            return false;
        }

        try {
            $order_details = $this->get_client()->get_order($klarna_order_id);
            $order_uuid = $order_details['merchant_reference1'] ?? null;

            if (empty($order_uuid)) {
                throw new Exception(__('Webhook error: Order UUID Not Found.', 'kirki-ecommerce-klarna'));
            }

            $order = OrderManager::find_by_uuid($order_uuid);

            if (!$order) {
                throw new Exception(__('Webhook error: Order Not Found.', 'kirki-ecommerce-klarna'));
            }

            if ($order->payment_status === PaymentStatus::PAID) {
                return false;
            }

            $this->handle_transaction_response($order, $order_details);

            return true;
        } catch (\Throwable $th) {
            throw new Exception(sprintf(__('Webhook error: %s', 'kirki-ecommerce-klarna'), $th->getMessage()));
        }
    }

    /**
     * Klarna API client.
     *
     * @return KlarnaClient
     * @throws Exception If credentials are missing.
     */
    protected function get_client(): KlarnaClient
    {
        if ($this->client) {
            return $this->client;
        }

        $username = $this->settings['username'] ?? '';
        $password = $this->settings['password'] ?? '';
        $region = $this->settings['region'] ?? '';
        $sandbox = (bool) ($this->settings['sandbox'] ?? true);

        if (empty($username) || empty($password) || empty($region)) {
            throw new Exception(__('Klarna credentials are missing.', 'kirki-ecommerce-klarna'));
        }

        return $this->client = new KlarnaClient($username, $password, $region, $sandbox);
    }

    protected function handle_transaction_response(Order $order, array $payload): void
    {
        $status = $payload['status'] ?? PaymentStatus::UNPAID;

        DB::begin_transaction();

        try {
            switch ($status) {
                case KlarnaConstant::ORDER_CAPTURED:
                    $this->record_transaction($order, $payload);
                    OrderManager::mark_payment_as_paid($order->id);
                    break;

                case KlarnaConstant::ORDER_EXPIRED:
                case KlarnaConstant::ORDER_CANCELLED:
                case KlarnaConstant::ORDER_CLOSED:
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
                sprintf(__('Failed to update order data: %s', 'kirki-ecommerce-klarna'), $e->getMessage())
            );
        }
    }

    protected function record_transaction(Order $order, array $payload): void
    {
        OrderManager::set_transaction_id($order->id, $payload['klarna_reference']);
        OrderManager::set_payment_metadata($order->id, wp_json_encode($payload));
    }

    protected function create_payment_session(Order $order): array
    {
        $builder = new KlarnaTransactionBuilder($order);

        $payload = [
            'billing_address' => $builder->format_address('billing'),
            'merchant_reference1' => $order->uuid,
            'order_amount' => $order->invoiced_total,
            'order_lines' => $builder->get_line_items(),
            'order_tax_amount' => (int) $order->invoiced_tax_total,
            'purchase_country' => $order->billing_country,
            'purchase_currency' => $order->currency_code,
            'shipping_address' => $builder->format_address('shipping'),
            'intent' => 'buy'
        ];

        return $this->get_client()->create_payment_session($payload);
    }

    protected function create_hpp_session(Order $order, string $session_id): array
    {
        $builder = new KlarnaTransactionBuilder($order);

        $payload = [
            'merchant_urls' => $builder->get_merchant_urls($this->webhook_url()),
            'options' => [
                'place_order_mode' => 'CAPTURE_ORDER',
                'purchase_type' => 'BUY',
            ],
            'payment_session_url' => $this->get_client()->payment_session_resource_url($session_id),
        ];

        return $this->get_client()->create_hpp_session($payload, $order->uuid);
    }
}
