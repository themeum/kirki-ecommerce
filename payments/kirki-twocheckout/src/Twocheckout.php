<?php

namespace Kirki\Ecommerce\Payments;

use Exception;
use Kirki\Ecommerce\App\Constants\Order\PaymentStatus;
use Kirki\Ecommerce\App\Constants\Payment\PaymentActionType;
use Kirki\Ecommerce\App\DTO\Payment\PaymentActionDTO;
use Kirki\Ecommerce\App\Facades\Order as OrderManager;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Payment\PaymentProvider;
use Kirki\Ecommerce\App\Payment\WebhookResult;
use Kirki\Ecommerce\Framework\Http\Request;
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
    protected ?Request $request = null;

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
     * Handle a received 2Checkout IPN notification.
     *
     * Returns a WebhookResult rather than a boolean because 2Checkout requires
     * a signed read receipt in the response body to acknowledge delivery.
     *
     * @link https://docs.2checkout.com/2checkout-apis/2checkout-apis/webhooks/instant-payment-notification-ipn/ipn-read-receipt-response-for-2checkout
     *
     * @return WebhookResult
     * @throws Exception If the notification is invalid or processing fails.
     */
    public function webhook(): WebhookResult
    {
        $this->request = Request::capture();

        http_response_code(200);

        try {
            $this->client = $this->get_client();

            if (!$this->validate_ipn_response()) {
                return new WebhookResult(false, null, 'application/xml');
            }
            $read_receipt = $this->client->build_read_receipt($this->request);

            $order_uuid = $this->request->get('REFNOEXT', null, 'string');
            if (!$order_uuid) {
                throw new Exception(__('Webhook error: Order UUID Not Found.', 'kirki-ecommerce-twocheckout'));
            }

            $order = OrderManager::find_by_uuid($order_uuid);
            if (!$order) {
                throw new Exception(__('Webhook error: Order Not Found.', 'kirki-ecommerce-twocheckout'));
            }

            if ($order->payment_status === PaymentStatus::PAID) {
                return new WebhookResult(true, $read_receipt, 'application/xml');
            }

            $this->handle_transaction_response($order);

            return new WebhookResult(true, $read_receipt, 'application/xml');
        } catch (\Throwable $th) {
            throw new Exception(sprintf(__('Webhook error: %s', 'kirki-ecommerce-twocheckout'), $th->getMessage()));
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
            throw new Exception(__('2Checkout credentials are missing.', 'kirki-ecommerce-twocheckout'));
        }

        return new TwocheckoutClient($merchant_code, $secret_key, $buy_link_secret_word, $sandbox);
    }

    /**
     * Apply the order status carried by the validated IPN notification to the local order.
     *
     * @param Order $order The local order.
     * @return void
     * @throws Exception If the order update fails.
     */
    protected function handle_transaction_response(Order $order): void
    {
        $status = $this->get_status($this->request->get('ORDERSTATUS', null, 'string'));

        DB::begin_transaction();

        try {
            switch ($status) {
                case PaymentStatus::PAID:
                    $this->record_transaction($order);
                    OrderManager::mark_payment_as_paid($order->id);
                    if (!empty($this->request->get('IPN_COMMISSION', null, 'string'))) {
                        OrderManager::set_payment_provider_fee($order->id, $this->request->get('IPN_COMMISSION', null, 'string'));
                    }
                    break;

                case PaymentStatus::FAILED:
                    $this->record_transaction($order);
                    OrderManager::mark_payment_as_failed($order->id);
                    break;

                default:
                    OrderManager::mark_payment_as_unpaid($order->id);
            }

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollback();

            throw new Exception(
                sprintf(__('Failed to update order data: %s', 'kirki-ecommerce-twocheckout'), $e->getMessage())
            );
        }
    }

    /**
     * Record 2Checkout's reference number and the raw IPN payload against the order.
     *
     * @param Order $order The local order.
     * @return void
     */
    protected function record_transaction(Order $order): void
    {
        OrderManager::set_transaction_id($order->id, $this->request->get('REFNO', null, 'string'));
        OrderManager::set_payment_metadata($order->id, wp_json_encode($this->request->all()));
    }

    /**
     * Verify the received IPN's signature against 2Checkout's length-prefixed HASH scheme.
     *
     * @return bool
     * @throws Exception If validation fails unexpectedly.
     */
    protected function validate_ipn_response(): bool
    {
        try {
            $received_signature = $this->client->get_received_signature($this->request);
            $ref_no = $this->request->get('REFNO', null, 'string');

            if (empty($ref_no)) {
                return false;
            }

            $result = '';
            foreach ($this->request->all() as $key => $value) {
                if (!in_array($key, ['HASH', 'SIGNATURE_SHA2_256', 'SIGNATURE_SHA3_256'], true)) {
                    $result .= is_array($value) ? $this->client->encode_length_prefixed($value) : strlen(stripslashes($value)) . stripslashes($value);
                }
            }

            $calculated_hash = $this->client->generate_hash($result, $received_signature['algorithm']);

            return $received_signature['hash_value'] === $calculated_hash;
        } catch (Exception $error) {
            throw new Exception(sprintf(__('Error while validating IPN response: %s', 'kirki-ecommerce-twocheckout'), $error->getMessage()));
        }
    }

    /**
     * Map a 2Checkout order status to an internal payment status.
     *
     * @param string $status The order status from the IPN payload.
     *
     * @return string One of the PaymentStatus constants.
     */
    protected function get_status($status): string
    {
        $statuses = array(
            TwocheckoutConstant::ORDER_STATUS_COMPLETE => PaymentStatus::PAID,
            TwocheckoutConstant::ORDER_STATUS_PENDING => PaymentStatus::UNPAID,
            TwocheckoutConstant::ORDER_STATUS_CANCELED => PaymentStatus::CANCELLED,
        );

        return $statuses[$status] ?? PaymentStatus::UNPAID;
    }
}
