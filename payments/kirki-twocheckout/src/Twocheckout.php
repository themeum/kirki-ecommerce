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

    public function webhook()
    {
        $payload = Request::capture();

        http_response_code(200);

        try {
            $this->client = $this->get_client();

            if (!$this->validate_ipn_response($payload)) {
                return new WebhookResult(false, null, 'application/xml');
            }
            $response_token = $this->client->generate_ipn_response($payload);

            $order_uuid = $payload->get('REFNOEXT', null, 'string');
            if (!$order_uuid) {
                throw new Exception(__('Webhook error: Order UUID Not Found.', 'kirki-ecommerce-twocheckout'));
            }

            $order = OrderManager::find_by_uuid($order_uuid);
            if (!$order) {
                throw new Exception(__('Webhook error: Order Not Found.', 'kirki-ecommerce-twocheckout'));
            }

            if ($order->payment_status === PaymentStatus::PAID) {
                return new WebhookResult(true, $response_token, 'application/xml');
            }

            $this->handle_transaction_response($order, $payload);

            return new WebhookResult(true, $response_token, 'application/xml');
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


    protected function handle_transaction_response(Order $order,  $payload): void
    {
        $status = $this->get_status($payload->get('ORDERSTATUS', null, 'string'));

        DB::begin_transaction();

        try {
            switch ($status) {
                case PaymentStatus::PAID:
                    $this->record_transaction($order, $payload);
                    OrderManager::mark_payment_as_paid($order->id);
                    if (!empty($payload->get('IPN_COMMISSION', null, 'string'))) {
                        OrderManager::set_payment_provider_fee($order->id, $payload->get('IPN_COMMISSION', null, 'string'));
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

    protected function record_transaction(Order $order, $payload): void
    {
        OrderManager::set_transaction_id($order->id, $payload->get('REFNOEXT', null, 'string'));
        OrderManager::set_payment_metadata($order->id, wp_json_encode($payload->all()));
    }


    protected function validate_ipn_response($payload)
    {
        try {
            $result        = '';
            $received_hash = $this->client->get_hash_algorithm($payload);
            $ref_no = $payload->get('REFNO', null, 'string');

            foreach ($payload->all() as $key => $value) {
                if (! in_array($key, ['HASH', 'SIGNATURE_SHA2_256', 'SIGNATURE_SHA3_256'], true)) {
                    $result .= is_array($value) ? $this->client->array_expand($value) : strlen(stripslashes($value)) . stripslashes($value);
                }
            }

            if (!empty($ref_no)) {
                $calculated_hash = $this->client->generate_hash($result, $received_hash['algorithm']);
                return $received_hash['hash_value'] === $calculated_hash;
            }

            return false;
        } catch (Exception $error) {
            /* translators: %s: error message */
            throw new Exception(esc_html__(sprintf('Error While Validating IPN Response: %s', $error->getMessage()), 'kirki-ecommerce-twocheckout'));
        }
    }

    protected function get_status($status): string
    {
        $statuses = array(
            'COMPLETE' => PaymentStatus::PAID,
            'PENDING'  => PaymentStatus::UNPAID,
            'CANCELED' => PaymentStatus::CANCELLED,
        );

        return $statuses[$status] ?? PaymentStatus::UNPAID;
    }
}
