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
use stdClass;
use Throwable;

use function Kirki\Ecommerce\Framework\throw_anyway;
use function Kirki\Ecommerce\Framework\throw_if;
use function Kirki\Ecommerce\Framework\throw_unless;

defined('ABSPATH') || exit;

/**
 * PayU GPO Europe payment gateway.
 */
class Payu extends PaymentProvider
{
    protected ?PayuClient $client = null;

    public function __construct()
    {
        $this->id = 'payu';
        $this->title = __('PayU GPO Europe', 'kirki-ecommerce-payu');
        $this->description = __('PayU GPO Europe Payment Gateway', 'kirki-ecommerce-payu');
        $this->icon = $this->icon_url('payu');
        $this->settings_key = 'payu';
        $this->is_offline = false;
        $this->is_available = true;
        $this->has_fields = true;

        parent::__construct();

        $this->set_admin_fields([
            [
                'name' => 'pos_id',
                'label' => __('POS ID', 'kirki-ecommerce-payu'),
                'type' => 'text',
                'required' => true,
            ],
            [
                'name' => 'client_id',
                'label' => __('OAuth - Client ID', 'kirki-ecommerce-payu'),
                'type' => 'text',
                'required' => true,
            ],
            [
                'name' => 'second_key',
                'label' => __('Second key (MD5)', 'kirki-ecommerce-payu'),
                'type' => 'password',
                'required' => true,
            ],
            [
                'name' => 'client_secret',
                'label' => __('OAuth - Client Secret', 'kirki-ecommerce-payu'),
                'type' => 'password',
                'required' => true,
            ],
            [
                'name' => 'sandbox',
                'label' => __('Sandbox Mode', 'kirki-ecommerce-payu'),
                'type' => 'checkbox',
            ],
        ]);
    }

    /**
     * Pay for an order.
     *
     * @param Order $order
     * @return PaymentActionDTO
     * @throws Exception If the gateway is disabled or PayU rejects the order.
     */
    public function pay(Order $order)
    {
        throw_unless($this->enabled(), __('PayU GPO Europe is not enabled.', 'kirki-ecommerce-payu'));

        try {
            $builder = new PayuTransactionBuilder($order);
            $payload = $builder->build_order_payload();
            $payload['merchantPosId'] = $this->settings['pos_id'];
            $payload['notifyUrl'] = $this->webhook_url();

            $response = $this->get_client()->create_order($payload);

            throw_if(empty($response['redirectUri']), __('PayU checkout link not found.', 'kirki-ecommerce-payu'));

            return PaymentActionDTO::from_array([
                'type' => PaymentActionType::REDIRECT,
                'value' => $response['redirectUri'],
            ]);
        } catch (Exception $e) {
            /* translators: %s: Error message */
            throw_anyway(sprintf(__('PayU Payment Error: %s', 'kirki-ecommerce-payu'), $e->getMessage()));
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
            'pos_id' => 'sometimes|string',
            'client_id' => 'sometimes|string',
            'second_key' => 'sometimes|string',
            'client_secret' => 'sometimes|string',
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
            'pos_id' => Sanitizer::TEXT,
            'client_id' => Sanitizer::TEXT,
            'second_key' => Sanitizer::TEXT,
            'client_secret' => Sanitizer::TEXT,
            'sandbox' => Sanitizer::BOOL,
        ])->get_sanitized_data();

        return array_merge($parent_settings, $data);
    }

    /**
     * Handle a PayU order notification.
     *
     * @return bool True if the notification was processed.
     * @throws Exception If the payload is missing, invalid, or the order is unknown.
     */
    public function webhook()
    {
        $payload = $this->verify_and_parse_notification();

        $order_uuid = $payload->order->extOrderId ?? '';
        throw_if(empty($order_uuid), __('PayU Error: Order UUID Not Found.', 'kirki-ecommerce-payu'));

        $order = OrderManager::find_by_uuid($order_uuid);
        throw_if(!$order, __('PayU Error: Order Not Found.', 'kirki-ecommerce-payu'));

        if (PaymentStatus::PAID === $order->payment_status) {
            return true;
        }

        $this->handle_transaction_response($payload, $order);

        return true;
    }

    /**
     * PayU API client.
     *
     * @return PayuClient
     * @throws Exception If credentials are missing.
     */
    protected function get_client(): PayuClient
    {
        if ($this->client) {
            return $this->client;
        }

        $credentials = [
            'pos_id' => $this->settings['pos_id'] ?? '',
            'client_id' => $this->settings['client_id'] ?? '',
            'second_key' => $this->settings['second_key'] ?? '',
            'client_secret' => $this->settings['client_secret'] ?? '',
        ];

        throw_if(in_array('', $credentials, true), __('PayU credentials are missing.', 'kirki-ecommerce-payu'));

        $this->client = new PayuClient(
            $credentials['client_id'],
            $credentials['client_secret'],
            $credentials['second_key'],
            (bool) ($this->settings['sandbox'] ?? true)
        );

        return $this->client;
    }

    /**
     * Read the raw notification body, verify its signature, and decode it.
     *
     * @return object
     * @throws Exception If the payload is empty, unsigned, or not a PayU notification.
     */
    protected function verify_and_parse_notification(): object
    {
        $raw_payload = file_get_contents('php://input');

        throw_if(empty($raw_payload), __('Invalid Payload From PayU.', 'kirki-ecommerce-payu'));
        throw_unless(
            $this->get_client()->is_verified($raw_payload),
            __('Webhook Notification Is Not Valid.', 'kirki-ecommerce-payu')
        );

        return json_decode($raw_payload);
    }

    /**
     * Update the order to match the notification's payment status.
     *
     * @param object $payload The decoded notification payload.
     * @param Order $order The local order.
     * @return void
     * @throws Exception If the order update fails.
     */
    protected function handle_transaction_response(object $payload, Order $order)
    {
        $status = PayuConstant::PAYMENT_STATUS_MAP[$payload->order->status ?? ''] ?? PaymentStatus::UNPAID;

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

                case PaymentStatus::PENDING:
                    OrderManager::mark_payment_as_unpaid($order->id);
                    break;
            }

            DB::commit();
        } catch (Throwable $e) {
            DB::rollback();

            /* translators: %s: Error message */
            throw new Exception(sprintf(__('Failed to update order data: %s', 'kirki-ecommerce-payu'), $e->getMessage()));
        }
    }

    /**
     * Record the PayU order ID and raw notification payload against the local order.
     *
     * @param Order $order The local order.
     * @param object $payload The decoded notification payload.
     * @return void
     */
    protected function record_transaction(Order $order, object $payload): void
    {
        OrderManager::set_transaction_id($order->id, $payload->order->orderId ?? '');
        OrderManager::set_payment_metadata($order->id, wp_json_encode($payload));
    }
}
