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
 * 2Checkout payment gateway.
 */
class Twocheckout extends PaymentProvider
{
    protected ?TwocheckoutClient $client = null;

    public function __construct()
    {
        $this->id = 'twocheckout';
        $this->title = __('2checkout', 'kirki-ecommerce-twocheckout');
        $this->description = __('2checkout Payment Gateway', 'kirki-ecommerce-twocheckout');
        $this->icon = $this->icon_url('twocheckout');
        $this->settings_key = 'twocheckout';
        $this->is_offline = false;
        $this->is_available = true;
        $this->has_fields = true;

        parent::__construct();

        $this->set_admin_fields([
            [
                'name' => 'merchant_code',
                'label' => __('Merchant Code', 'kirki-ecommerce-twocheckout'),
                'type' => 'text',
                'required' => true,
            ],
            [
                'name' => 'secret_key',
                'label' => __('Secret Key', 'kirki-ecommerce-twocheckout'),
                'type' => 'password',
                'required' => true,
            ],
            [
                'name' => 'buy_link_secret_word',
                'label' => __('Buy link secret word', 'kirki-ecommerce-twocheckout'),
                'type' => 'password',
                'required' => true,
            ],
            [
                'name' => 'sandbox',
                'label' => __('Sandbox Mode', 'kirki-ecommerce-twocheckout'),
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
            throw new Exception(__('2Checkout is not enabled.', 'kirki-ecommerce-twocheckout'));
        }

        try {
            $this->client = $this->get_client();

            $builder = new TwocheckoutTransactionBuilder($order);
            $payload = $builder->built_payment_payload();
            $payload['merchant'] = $this->settings['merchant_code'];

            if ($this->client->is_sandbox()) {
                $payload['test'] = 1;
            }

            $payload['signature'] = $this->client->generate_signature($payload);

            $buy_link = TwocheckoutConstant::BUY_LINK_URL . http_build_query($payload);

            return PaymentActionDTO::from_array([
                'type' => PaymentActionType::REDIRECT,
                'value' => $buy_link,
            ]);
        } catch (Exception $e) {
            throw new Exception(sprintf(__('2Checkout Payment Error: %s', 'kirki-ecommerce-twocheckout'), $e->getMessage()));
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
            'merchant_code' => 'sometimes|string',
            'secret_key' => 'sometimes|string',
            'buy_link_secret_word' => 'sometimes|string',
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
            'merchant_code' => Sanitizer::TEXT,
            'secret_key' => Sanitizer::TEXT,
            'buy_link_secret_word' => Sanitizer::TEXT,
            'sandbox' => Sanitizer::BOOL,
        ])->get_sanitized_data();

        return array_merge($parent_settings, $data);
    }

    /**
     * Handle a 2Checkout webhook notification.
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
                throw new Exception(__('Webhook error: Order UUID Not Found.', 'kirki-ecommerce-quickpay'));
            }

            $order = OrderManager::find_by_uuid($order_uuid);
            if (!$order) {
                throw new Exception(__('Webhook error: Order Not Found.', 'kirki-ecommerce-quickpay'));
            }

            if ($order->payment_status === PaymentStatus::PAID) {
                return false;
            }

            $this->handle_transaction_response($order, $payload);

            return true;
        } catch (\Throwable $th) {
            throw new Exception(sprintf(__('Webhook error: %s', 'kirki-ecommerce-quickpay'), $th->getMessage()));
        }
    }

    /**
     * 2Checkout API client.
     *
     * @return TwocheckoutClient
     * @throws Exception If credentials are missing.
     */
    protected function get_client(): TwocheckoutClient
    {
        if ($this->client) {
            return $this->client;
        }

        $merchant_code = $this->settings['merchant_code'] ?? '';
        $secret_key = $this->settings['secret_key'] ?? '';
        $buy_link_secret_word = $this->settings['buy_link_secret_word'] ?? '';
        $sandbox = (bool) ($this->settings['sandbox'] ?? true);

        if (empty($merchant_code) || empty($secret_key) || empty($buy_link_secret_word)) {
            throw new Exception(__('2Checkout credentials are missing.', 'kirki-ecommerce-2checkout'));
        }

        return new TwocheckoutClient($merchant_code, $secret_key, $buy_link_secret_word, $sandbox);
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
