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

use function Kirki\Ecommerce\Framework\throw_anyway;
use function Kirki\Ecommerce\Framework\throw_if;
use function Kirki\Ecommerce\Framework\throw_unless;

defined('ABSPATH') || exit;

/**
 * Square payment gateway.
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
                'name' => 'client_secret',
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
     * @throws Exception
     */
    public function pay(Order $order)
    {
        throw_unless($this->enabled(), __('PayU GPO Europe is not enabled.', 'kirki-ecommerce-payu'));

        try {
            $builder = new PayuTransactionBuilder($order);
            $payload = $builder->build_order_payload();
            $payload['notifyUrl'] = $this->webhook_url();
            $payload['merchantPosId'] = $this->settings['pos_id'];

            $this->client = $this->get_client();
            $response = $this->client->create_order($payload);

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
     * Handle a Square webhook notification.
     *
     * @return bool True if the notification was processed, false if ignored.
     * @throws Exception If the payload is missing, invalid, or the API lookup fails.
     */
    public function webhook()
    {
        $payload = $this->verify_and_parse_notification();

        $allowed_event_types = [
            SquareConstant::EVENT_PAYMENT_UPDATE
        ];

        if (!in_array($payload->type, $allowed_event_types, true)) {
            return false;
        }

        $payment = $payload->data->object->payment ?? null;
        if (empty($payment)) {
            throw new Exception(__('Webhook Notification Is Not Valid.', 'kirki-ecommerce-square'));
        }
        $reference_id = $payment->reference_id ?? null;

        if (!$reference_id && !empty($payment->order_id)) {
            $order_details = $this->get_client()->get_order($payment->order_id);
            $reference_id = $order_details['order']['reference_id'] ?? null;
        }

        if (empty($reference_id)) {
            throw new Exception(__('Square Error: Order UUID Not Found.', 'kirki-ecommerce-square'));
        }

        $order = OrderManager::find_by_uuid($reference_id);

        if (!$order) {
            throw new Exception(__('Square Error: Order Not Found.', 'kirki-ecommerce-square'));
        }

        if ($order->payment_status === PaymentStatus::PAID) {
            return false;
        }

        $this->handle_transaction_response($payment, $order);
        return true;
    }

    /**
     * Square API client.
     *
     * @return PayuClient
     * @throws Exception If credentials are missing.
     */
    protected function get_client(): PayuClient
    {
        if ($this->client) {
            return $this->client;
        }

        $pos_id = $this->settings['pos_id'] ?? '';
        $client_id = $this->settings['client_id'] ?? '';
        $second_key = $this->settings['second_key'] ?? '';
        $client_secret = $this->settings['client_secret'] ?? '';
        $sandbox = (bool) ($this->settings['sandbox'] ?? true);

        if (empty($pos_id) || empty($client_id) || empty($second_key) || empty($client_secret)) {
            throw new Exception(__('Square credentials are missing.', 'kirki-ecommerce-square'));
        }

        return new PayuClient($pos_id, $client_id, $second_key, $client_secret, $sandbox);
    }

    /**
     * Read the raw webhook payload, verify its signature, and decode it.
     *
     * @return object
     * @throws Exception If the payload is empty or its signature is invalid.
     */
    protected function verify_and_parse_notification(): object
    {
        $payload = file_get_contents('php://input');

        // Respond with a 200 status code to acknowledge the notification.
        http_response_code(200);

        if (empty($payload)) {
            throw new Exception(__('Invalid Payload From Square.', 'kirki-ecommerce-square'));
        }

        if (!$this->get_client()->is_verified($payload, $this->webhook_url())) {
            throw new Exception(__('Webhook Notification Is Not Valid.', 'kirki-ecommerce-square'));
        }

        return json_decode($payload);
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
        $status = $payload->status ?? PaymentStatus::UNPAID;

        DB::begin_transaction();

        try {
            switch ($status) {
                case SquareConstant::PAYMENT_COMPLETED:
                    $this->record_transaction($order, $payload);
                    OrderManager::mark_payment_as_paid($order->id);
                    break;

                case SquareConstant::PAYMENT_CANCELED:
                case SquareConstant::PAYMENT_FAILED:
                    $this->record_transaction($order, $payload);
                    OrderManager::mark_payment_as_failed($order->id);
                    break;

                case SquareConstant::PAYMENT_APPROVED:
                case SquareConstant::PAYMENT_PENDING:
                    OrderManager::mark_payment_as_unpaid($order->id);
            }

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollback();

            throw new Exception(
                sprintf(__('Failed to update order data: %s', 'kirki-ecommerce-square'), $e->getMessage())
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
        OrderManager::set_transaction_id($order->id, $payload->id);
        OrderManager::set_payment_metadata($order->id, wp_json_encode($payload));
    }
}
