<?php

namespace Kirki\Ecommerce\Payments;

use Exception;
use Kirki\Ecommerce\App\Constants\Order\PaymentStatus;
use Kirki\Ecommerce\App\Constants\Payment\PaymentActionType;
use Kirki\Ecommerce\App\DTO\Payment\PaymentActionDTO;
use Kirki\Ecommerce\App\Facades\Money;
use Kirki\Ecommerce\App\Facades\Order as OrderManager;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Payment\PaymentProvider;
use Kirki\Ecommerce\App\Supports\Url;
use Kirki\Ecommerce\Framework\Http\Superglobals;
use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Supports\Facades\DB;
use Kirki\Ecommerce\Framework\Validation\Validator;
use Throwable;

use function Kirki\Ecommerce\Framework\throw_anyway;
use function Kirki\Ecommerce\Framework\throw_if;
use function Kirki\Ecommerce\Framework\throw_unless;

defined('ABSPATH') || exit;

/**
 * PayMongo payment gateway.
 */
class Payfast extends PaymentProvider
{
    protected ?PayfastClient $client = null;


    public function __construct()
    {
        $this->id = 'payfast';
        $this->title = __('PayFast', 'kirki-ecommerce-payfast');
        $this->description = __('PayFast Payment Gateway', 'kirki-ecommerce-payfast');
        $this->icon = $this->icon_url('payfast');
        $this->settings_key = 'payfast';
        $this->is_offline = false;
        $this->is_available = true;
        $this->has_fields = true;

        parent::__construct();

        $this->set_admin_fields([
            [
                'name' => 'merchant_id',
                'label' => __('Merchant ID', 'kirki-ecommerce-payfast'),
                'type' => 'password',
                'required' => true,
            ],
            [
                'name' => 'merchant_key',
                'label' => __('Merchant Key', 'kirki-ecommerce-payfast'),
                'type' => 'password',
                'required' => true,
            ],
            [
                'name' => 'pass_phrase',
                'label' => __('Passphrase', 'kirki-ecommerce-payfast'),
                'type' => 'password',
                'required' => true,
            ],
            [
                'name' => 'sandbox',
                'label' => __('Sandbox Mode', 'kirki-ecommerce-payfast'),
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
        throw_unless(
            $this->enabled(),
            __('PayFast is not enabled.', 'kirki-ecommerce-payfast')
        );

        try {
            $site_name = html_entity_decode(get_bloginfo('name'), ENT_QUOTES, get_bloginfo('charset'));
            $total_amount = Money::of_minor($order->invoiced_total, $order->currency_code)->getAmount()->toFloat();
            $payload = [
                'merchant_id' => $this->settings['merchant_id'],
                'merchant_key' => $this->settings['merchant_key'],
                'return_url' => Url::get_checkout_success_url($order->uuid),
                'cancel_url' => Url::get_checkout_failed_url($order->uuid),
                'notify_url' => $this->webhook_url(),
                'name_first' => $order->customer_first_name ?? $order->billing->billing_first_name ?? '',
                'name_last' => $order->customer_last_name ?? $order->billing->billing_last_name ?? '',
                'email_address' => $order->customer_email ?? $order->billing->billing_email ?? '',
                'm_payment_id' => $order->uuid,
                'amount' => $total_amount,
                'item_name' => $site_name . ' - ' . $order->order_number,
                'custom_str1' => wp_json_encode(['total_amount' => $total_amount]),
                'email_confirmation' => true,
                'passphrase' => $this->settings['pass_phrase']
            ];

            $this->client = $this->get_client();
            $html = $this->client->render_checkout_form($payload);

            return PaymentActionDTO::from_array([
                'type' => PaymentActionType::HTML,
                'value' => $html,
            ]);
        } catch (Exception $e) {
            throw_anyway(sprintf(__('PayFast Payment Error: %s', 'kirki-ecommerce-payfast'), $e->getMessage()));
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
            'merchant_id' => 'sometimes|string',
            'merchant_key' => 'sometimes|string',
            'pass_phrase' => 'sometimes|string',
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
            'merchant_id' => Sanitizer::TEXT,
            'merchant_key' => Sanitizer::TEXT,
            'pass_phrase' => Sanitizer::TEXT,
            'sandbox' => Sanitizer::BOOL,
        ])->get_sanitized_data();

        return array_merge($parent_settings, $data);
    }

    /**
     * Handle a PayMongo webhook notification.
     *
     * @return bool True if the notification was processed, false if ignored.
     * @throws Exception If the payload is missing, invalid, or the order lookup fails.
     */
    public function webhook()
    {
        http_response_code(200);
        flush();

        try {
            $payload = $this->verify_and_parse_notification();

            $order_uuid = $payload['m_payment_id'] ?? '';
            throw_if(empty($order_uuid), __('Webhook error: Order UUID Not Found.', 'kirki-ecommerce-payfast'));

            $order = OrderManager::find_by_uuid($order_uuid);
            throw_if(!$order, __('Webhook error: Order Not Found.', 'kirki-ecommerce-payfast'));

            if (PaymentStatus::PAID === $order->payment_status) {
                return true;
            }

            $this->handle_payment_response($order, $payload);

            return true;
        } catch (Throwable $th) {
            throw_anyway(sprintf(__('Webhook error: %s', 'kirki-ecommerce-paymongo'), $th->getMessage()));
        }
    }

    /**
     * PayMongo API client, built from the saved settings on first use.
     *
     * @return PayfastClient
     * @throws Exception If credentials are missing.
     */
    protected function get_client(): PayfastClient
    {
        if ($this->client) {
            return $this->client;
        }

        $merchant_id = $this->settings['merchant_id'] ?? '';
        $merchant_key = $this->settings['merchant_key'] ?? '';
        $pass_phrase = $this->settings['pass_phrase'] ?? '';

        if (empty($merchant_id) || empty($merchant_key) || empty($pass_phrase)) {
            throw_anyway(__('PayFast credentials are missing.', 'kirki-ecommerce-payfast'));
        }

        $this->client = new PayfastClient(
            $merchant_id,
            $merchant_key,
            $pass_phrase,
            (bool) ($this->settings['sandbox'])
        );

        return $this->client;
    }

    protected function handle_payment_response(Order $order, array $payload): void
    {
        $status = PayfastConstant::PAYMENT_STATUS[$payload['payment_status']] ?? PaymentStatus::UNPAID;

        DB::begin_transaction();

        try {
            switch ($status) {
                case PaymentStatus::PAID:
                    $this->record_transaction($order, $payload);
                    OrderManager::mark_payment_as_paid($order->id);
                    OrderManager::set_payment_provider_fee($order->id, $payload['amount_fee']);
                    break;

                case PaymentStatus::CANCELLED:
                    $this->record_transaction($order, $payload);
                    OrderManager::mark_payment_as_failed($order->id);
                    break;

                case PaymentStatus::UNPAID:
                    OrderManager::mark_payment_as_unpaid($order->id);
                    break;
            }

            DB::commit();
        } catch (Throwable $e) {
            DB::rollback();

            throw_anyway(sprintf(__('Failed to update order data: %s', 'kirki-ecommerce-payfast'), $e->getMessage()));
        }
    }

    protected function verify_and_parse_notification()
    {
        $payload = array_map('stripslashes', Superglobals::post());

        if (!$this->get_client()->is_verified($payload)) {
            throw_anyway(__('Invalid Payload From PayFast.', 'kirki-ecommerce-payfast'));
        }

        return $payload;
    }


    protected function record_transaction(Order $order, array $payload): void
    {
        OrderManager::set_transaction_id($order->id, $payload['pf_payment_id']);
        OrderManager::set_payment_metadata($order->id, wp_json_encode($payload));
    }
}
