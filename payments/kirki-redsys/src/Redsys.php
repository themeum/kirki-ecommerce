<?php

namespace Kirki\Ecommerce\Payments;

use Exception;
use Kirki\Ecommerce\App\Constants\Order\PaymentStatus;
use Kirki\Ecommerce\App\Constants\Payment\PaymentActionType;
use Kirki\Ecommerce\App\DTO\Payment\PaymentActionDTO;
use Kirki\Ecommerce\App\Facades\Order as OrderManager;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Payment\PaymentProvider;
use Kirki\Ecommerce\Framework\Http\Request;
use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Supports\Facades\DB;
use Kirki\Ecommerce\Framework\Validation\Validator;

defined('ABSPATH') || exit;

/**
 * Square payment gateway.
 */
class Redsys extends PaymentProvider
{
    protected ?RedsysClient $client = null;

    public function __construct()
    {
        $this->id = 'redsys';
        $this->title = __('Redsys', 'kirki-ecommerce-redsys');
        $this->description = __('Redsys payment gateway', 'kirki-ecommerce-redsys');
        $this->icon = $this->icon_url('redsys');
        $this->settings_key = 'redsys';
        $this->is_offline = false;
        $this->is_available = true;
        $this->has_fields = true;

        parent::__construct();

        $this->set_admin_fields([
            [
                'name' => 'merchant_code',
                'label' => __('Merchant Code(FUC)', 'kirki-ecommerce-redsys'),
                'type' => 'text',
                'required' => true,
            ],
            [
                'name' => 'terminal',
                'label' => __('Terminal', 'kirki-ecommerce-redsys'),
                'type' => 'text',
                'required' => true,
            ],
            [
                'name' => 'signature_key',
                'label' => __('Signature Key', 'kirki-ecommerce-redsys'),
                'type' => 'password',
                'required' => true,
            ],
            [
                'name' => 'sandbox',
                'label' => __('Sandbox Mode', 'kirki-ecommerce-redsys'),
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
            throw new Exception(__('Redsys is not enabled.', 'kirki-ecommerce-redsys'));
        }

        try {
            $this->client = $this->get_client();
            $builder = new RedsysTransactionBuilder($order);
            $merchant_params = $builder->create_merchant_params();
            $merchant_params['DS_MERCHANT_MERCHANTURL'] = $this->webhook_url();
            $merchant_params['DS_MERCHANT_TERMINAL'] = (int) $this->settings['terminal'];
            $merchant_params['DS_MERCHANT_MERCHANTCODE'] = (int) $this->settings['merchant_code'];

            $encoded_merchant_params = $builder->base64_url_encode_safe(wp_json_encode($merchant_params));
            $html = $this->client->render_checkout_form($encoded_merchant_params, $merchant_params['DS_MERCHANT_ORDER']);

            return PaymentActionDTO::from_array([
                'type' => PaymentActionType::HTML,
                'value' => $html,
            ]);
        } catch (Exception $e) {
            throw new Exception(sprintf(__('Redsys Payment Error: %s', 'kirki-ecommerce-redsys'), $e->getMessage()));
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
            'terminal' => 'sometimes|string',
            'signature_key' => 'sometimes|string',
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
            'terminal' => Sanitizer::TEXT,
            'signature_key' => Sanitizer::TEXT,
            'sandbox' => Sanitizer::BOOL,
        ])->get_sanitized_data();

        return array_merge($parent_settings, $data);
    }

    /**
     * Handle a Square webhook notification.
     *
     * @return bool True if the notification was processed, false if ignored.
     * @throws Exception If the payload is missing, invalid, or the API lookup fails.
     */
    public function webhook()
    {
        $payload = $this->verify_and_parse_notification();

        $order = OrderManager::find_by_uuid($payload->Ds_MerchantData);
        if (!$order) {
            throw new Exception(__('Redsys Error: Order Not Found.', 'kirki-ecommerce-redsys'));
        }

        if ($order->payment_status === PaymentStatus::PAID) {
            return false;
        }

        $this->handle_transaction_response($payload, $order);
        return true;
    }

    /**
     * Square API client.
     *
     * @return RedsysClient
     * @throws Exception If credentials are missing.
     */
    protected function get_client(): RedsysClient
    {
        if ($this->client) {
            return $this->client;
        }

        $merchant_code = $this->settings['merchant_code'] ?? '';
        $terminal = $this->settings['terminal'] ?? '';
        $signature_key = $this->settings['signature_key'] ?? '';
        $sandbox = (bool) ($this->settings['sandbox'] ?? true);

        if (empty($merchant_code) || empty($terminal) || empty($signature_key)) {
            throw new Exception(__('Redsys credentials are missing.', 'kirki-ecommerce-redsys'));
        }

        return $this->client = new RedsysClient($merchant_code, $terminal, $signature_key, $sandbox);
    }

    protected function verify_and_parse_notification()
    {
        $payload = Request::capture();

        // Respond with a 200 status code to acknowledge the notification.
        http_response_code(200);

        if (empty($payload)) {
            throw new Exception(__('Invalid Payload From Square.', 'kirki-ecommerce-redsys'));
        }

        $this->client = $this->get_client();
        $builder = new RedsysTransactionBuilder();

        $merchant_params_string_B64 = $payload->get('Ds_MerchantParameters', '', 'string');
        $merchant_params_string = $builder->base64_url_decode_safe($merchant_params_string_B64);
        $merchant_params = json_decode($merchant_params_string);

        if (!$this->client->is_verified($merchant_params_string_B64, $merchant_params->Ds_Order, $payload->Ds_Signature)) {
            throw new Exception(__('Webhook Notification Is Not Valid.', 'kirki-ecommerce-redsys'));
        }

        return $merchant_params;
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
        $status = intval($payload->Ds_Response) <= 99 ? PaymentStatus::PAID : PaymentStatus::CANCELLED;

        DB::begin_transaction();

        try {
            switch ($status) {
                case PaymentStatus::PAID:
                    $this->record_transaction($order, $payload);
                    OrderManager::mark_payment_as_paid($order->id);
                    break;

                case PaymentStatus::CANCELLED:
                    $this->record_transaction($order, $payload);
                    OrderManager::mark_payment_as_failed($order->id);
                    break;
            }

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollback();

            throw new Exception(
                sprintf(__('Failed to update order data: %s', 'kirki-ecommerce-redsys'), $e->getMessage())
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
        OrderManager::set_transaction_id($order->id, $payload->Ds_AuthorisationCode);
        OrderManager::set_payment_metadata($order->id, wp_json_encode($payload));
    }
}
